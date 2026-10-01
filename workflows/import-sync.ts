import { prisma } from "@/lib/prisma";
import { parseTourList } from "@/lib/import/parseTourList";
import { AUTOMATIC_IMPORT_SOURCES, syncAutomaticTour, type AutomaticTourResult } from "@/lib/import/sync";

type Trigger = "CRON" | "MANUAL";
type Prepared = { runId: string; urls: string[] };

async function prepare(trigger: Trigger, sourceKey?: string): Promise<Prepared | null> {
  "use step";
  const configs = sourceKey ? AUTOMATIC_IMPORT_SOURCES.filter((source) => source.key === sourceKey) : [...AUTOMATIC_IMPORT_SOURCES];
  if (!configs.length) throw new Error("Bilinmeyen otomatik içe aktarma kaynağı.");
  const run = await prisma.importSyncRun.create({ data: { trigger, status: "RUNNING", sourceKey: sourceKey || null, sources: configs.length } });
  const urls = new Set<string>();
  try {
    for (const config of configs) {
      const source = await prisma.importSource.upsert({ where: { key: config.key }, update: { label: config.label, listUrl: config.listUrl, active: true }, create: { ...config } });
      const links = await parseTourList(config.listUrl);
      if (!links.length) throw new Error(`${config.label} listesinde tur bağlantısı bulunamadı.`);
      const checkedAt = new Date();
      for (const detailUrl of links) {
        urls.add(detailUrl);
        await prisma.importSourceTour.upsert({ where: { sourceId_detailUrl: { sourceId: source.id, detailUrl } }, update: { active: true, lastSeenAt: checkedAt, missingSince: null }, create: { sourceId: source.id, detailUrl, lastSeenAt: checkedAt } });
      }
      await prisma.importSourceTour.updateMany({ where: { sourceId: source.id, detailUrl: { notIn: links }, active: true }, data: { active: false, missingSince: checkedAt } });
      await prisma.importSource.update({ where: { id: source.id }, data: { lastCheckedAt: checkedAt, lastSuccessAt: checkedAt, lastError: null } });
    }
    await prisma.importSyncRun.update({ where: { id: run.id }, data: { discovered: urls.size } });
    return { runId: run.id, urls: [...urls] };
  } catch (error) {
    await prisma.importSyncRun.update({ where: { id: run.id }, data: { status: "FAILED", error: error instanceof Error ? error.message : "Kaynak listesi alınamadı.", finishedAt: new Date() } });
    if (sourceKey) await prisma.importSource.updateMany({ where: { key: sourceKey }, data: { lastCheckedAt: new Date(), lastError: error instanceof Error ? error.message : "Kaynak listesi alınamadı." } });
    return null;
  }
}

async function syncOne(url: string, trigger: Trigger): Promise<AutomaticTourResult> {
  "use step";
  try {
    return await syncAutomaticTour(url, trigger);
  } catch (error) {
    await prisma.importLog.create({ data: { sourceUrl: url, status: "FAILED", message: error instanceof Error ? error.message : "Otomatik içe aktarma başarısız" } });
    return "failed";
  }
}

async function updateProgress(runId: string, results: AutomaticTourResult[]) {
  "use step";
  const counts = { created: 0, updated: 0, unchanged: 0, failed: 0 };
  for (const result of results) counts[result] += 1;
  await prisma.importSyncRun.update({ where: { id: runId }, data: counts });
}

async function finish(runId: string, results: AutomaticTourResult[]) {
  "use step";
  const counts = { created: 0, updated: 0, unchanged: 0, failed: 0 };
  for (const result of results) counts[result] += 1;
  const candidates = await prisma.tour.findMany({ where: { AND: [{ sourceLinks: { some: { missingSince: { lte: new Date(Date.now() - 12 * 60 * 60 * 1000) } } } }, { sourceLinks: { none: { active: true } } }], status: { not: "ARCHIVED" } }, select: { id: true, name: true, sourceUrl: true } });
  const archived = candidates.length ? (await prisma.tour.updateMany({ where: { id: { in: candidates.map((item) => item.id) } }, data: { status: "ARCHIVED" } })).count : 0;
  if (candidates.length) await prisma.importLog.createMany({ data: candidates.map((tour) => ({ sourceUrl: tour.sourceUrl || "automatic-sync", tourId: tour.id, status: "SUCCESS" as const, message: "Tur kaynak listelerde bulunamadığı için arşivlendi.", rawSummary: { trigger: "CRON", changeType: "ARCHIVED", changes: ["Tur arşivlendi"] } })) });
  return prisma.importSyncRun.update({ where: { id: runId }, data: { ...counts, archived, status: counts.failed ? "PARTIAL" : "COMPLETED", finishedAt: new Date() } });
}

async function getSourceKeys(sourceKey?: string) {
  "use step";
  const configs = sourceKey ? AUTOMATIC_IMPORT_SOURCES.filter((source) => source.key === sourceKey) : AUTOMATIC_IMPORT_SOURCES;
  if (!configs.length) throw new Error("Bilinmeyen otomatik içe aktarma kaynağı.");
  return configs.map((source) => source.key);
}

export async function automaticImportWorkflow(trigger: Trigger, sourceKey?: string) {
  "use workflow";
  const sourceKeys = await getSourceKeys(sourceKey);
  for (const key of sourceKeys) {
    const prepared = await prepare(trigger, key);
    if (!prepared) continue;
    const results: AutomaticTourResult[] = [];
    for (const url of prepared.urls) {
      results.push(await syncOne(url, trigger));
      if (results.length % 5 === 0 || results.length === prepared.urls.length) await updateProgress(prepared.runId, results);
    }
    await finish(prepared.runId, results);
  }
}
