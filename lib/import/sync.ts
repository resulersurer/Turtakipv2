import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { parseTourList } from "@/lib/import/parseTourList";
import { geocodeTourDays, parseTourPage } from "@/lib/import/parseTourPage";
import { upsertImportedTour } from "@/lib/tours";

export const AUTOMATIC_IMPORT_SOURCES = [
  { key: "ejder-2026", label: "2026 Turları", listUrl: "https://www.ejderturizm.com.tr/TourList.aspx?contpg=260&pcmncat=1&pcsbcat=138" },
  { key: "ejder-2027", label: "2027 Turları", listUrl: "https://www.ejderturizm.com.tr/TourList.aspx?contpg=276&pcmncat=16,1&pcsbcat=147" }
] as const;

export function fingerprint(parsed: Awaited<ReturnType<typeof parseTourPage>>) {
  const value = {
    name: parsed.name, durationDays: parsed.durationDays, departureCity: parsed.departureCity,
    airline: parsed.airline, visaStatus: parsed.visaStatus, coverImageUrl: parsed.coverImageUrl,
    departures: parsed.departures.map((item) => ({ ...item, startDate: item.startDate.toISOString(), endDate: item.endDate?.toISOString() || null })),
    days: parsed.days.map((item) => ({ ...item, lat: null, lng: null })), images: parsed.images, prices: parsed.prices
  };
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export type AutomaticTourResult = "created" | "updated" | "unchanged" | "failed";

export async function syncAutomaticTour(url: string, trigger: "CRON" | "MANUAL"): Promise<AutomaticTourResult> {
  const parsed = await parseTourPage(url, { geocodeDays: false, fast: true });
  const sourceHash = fingerprint(parsed);
  const existing = await prisma.tour.findFirst({ where: { OR: [{ sourceUrl: url }, { externalId: parsed.externalId || undefined }, { slug: parsed.slug }] }, select: { id: true, sourceHash: true } });
  if (existing?.sourceHash === sourceHash) {
    await prisma.tour.update({ where: { id: existing.id }, data: { importedAt: new Date() } });
    await prisma.importSourceTour.updateMany({ where: { detailUrl: url, active: true }, data: { tourId: existing.id } });
    return "unchanged";
  }
  await geocodeTourDays(parsed, { external: false });
  const tour = await upsertImportedTour(parsed, { automatic: true, sourceHash });
  await prisma.importSourceTour.updateMany({ where: { detailUrl: url, active: true }, data: { tourId: tour.id } });
  await prisma.importLog.create({ data: { sourceUrl: url, tourId: tour.id, status: parsed.warnings.length ? "PARTIAL" : "SUCCESS", message: existing ? "Otomatik senkronizasyonda güncellendi." : "Otomatik senkronizasyonda yeni taslak oluşturuldu.", rawSummary: { trigger, warnings: parsed.warnings, departures: parsed.departures.length } } });
  return existing ? "updated" : "created";
}

async function mapWithConcurrency<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      await worker(item);
    }
  }));
}

export async function getAutomaticImportStatus() {
  const [sources, runs] = await Promise.all([
    prisma.importSource.findMany({ include: { _count: { select: { tours: { where: { active: true } } } } }, orderBy: { key: "asc" } }),
    prisma.importSyncRun.findMany({ orderBy: { startedAt: "desc" }, take: 10 })
  ]);
  return { configuredSources: AUTOMATIC_IMPORT_SOURCES, sources, runs };
}

export async function runAutomaticImport(trigger: "CRON" | "MANUAL", sourceKey?: string) {
  const sourceConfigs = sourceKey ? AUTOMATIC_IMPORT_SOURCES.filter((source) => source.key === sourceKey) : [...AUTOMATIC_IMPORT_SOURCES];
  if (!sourceConfigs.length) throw new Error("Bilinmeyen otomatik içe aktarma kaynağı.");
  const running = await prisma.importSyncRun.findFirst({ where: { status: "RUNNING", startedAt: { gt: new Date(Date.now() - 30 * 60 * 1000) } }, orderBy: { startedAt: "desc" } });
  if (running) throw new Error("Başka bir otomatik senkronizasyon halen çalışıyor.");
  const run = await prisma.importSyncRun.create({ data: { trigger, status: "RUNNING", sources: sourceConfigs.length } });
  const stats = { discovered: 0, created: 0, updated: 0, unchanged: 0, archived: 0, failed: 0 };
  const discoveredUrls = new Set<string>();
  let allListsSucceeded = true;
  try {
    for (const config of sourceConfigs) {
      const source = await prisma.importSource.upsert({
        where: { key: config.key }, update: { label: config.label, listUrl: config.listUrl, active: true },
        create: { ...config }
      });
      try {
        const links = await parseTourList(config.listUrl);
        if (!links.length) throw new Error("Kaynak listede tur bağlantısı bulunamadı.");
        const checkedAt = new Date();
        for (const detailUrl of links) {
          discoveredUrls.add(detailUrl);
          await prisma.importSourceTour.upsert({
            where: { sourceId_detailUrl: { sourceId: source.id, detailUrl } },
            update: { active: true, lastSeenAt: checkedAt, missingSince: null },
            create: { sourceId: source.id, detailUrl, lastSeenAt: checkedAt }
          });
        }
        await prisma.importSourceTour.updateMany({
          where: { sourceId: source.id, detailUrl: { notIn: links }, active: true },
          data: { active: false, missingSince: checkedAt }
        });
        await prisma.importSource.update({ where: { id: source.id }, data: { lastCheckedAt: checkedAt, lastSuccessAt: checkedAt, lastError: null } });
      } catch (error) {
        allListsSucceeded = false;
        stats.failed += 1;
        const message = error instanceof Error ? error.message : "Liste alınamadı";
        await prisma.importSource.update({ where: { id: source.id }, data: { lastCheckedAt: new Date(), lastError: message } });
      }
    }

    const urls = Array.from(discoveredUrls);
    stats.discovered = urls.length;
    await mapWithConcurrency(urls, 1, async (url) => {
      try {
        const result = await syncAutomaticTour(url, trigger);
        stats[result] += 1;
      } catch (error) {
        stats.failed += 1;
        await prisma.importLog.create({ data: { sourceUrl: url, status: "FAILED", message: error instanceof Error ? error.message : "Otomatik içe aktarma başarısız" } });
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    if (allListsSucceeded) {
      const candidates = await prisma.tour.findMany({
        where: { AND: [{ sourceLinks: { some: { missingSince: { lte: new Date(Date.now() - 12 * 60 * 60 * 1000) } } } }, { sourceLinks: { none: { active: true } } }], status: { not: "ARCHIVED" } },
        select: { id: true }
      });
      if (candidates.length) {
        const result = await prisma.tour.updateMany({ where: { id: { in: candidates.map((item) => item.id) } }, data: { status: "ARCHIVED" } });
        stats.archived = result.count;
      }
    }
    const status = stats.failed ? "PARTIAL" : "COMPLETED";
    return await prisma.importSyncRun.update({ where: { id: run.id }, data: { ...stats, status, finishedAt: new Date() } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Senkronizasyon başarısız";
    await prisma.importSyncRun.update({ where: { id: run.id }, data: { ...stats, status: "FAILED", error: message, finishedAt: new Date() } });
    throw error;
  }
}
