import { prisma } from "@/lib/prisma";

export function importTitleFromUrl(url: string) {
  try {
    const last = decodeURIComponent(new URL(url).pathname.split("/").pop() || url);
    return last.replace(/_23\.html$/i, "").replace(/[-_]+/g, " ").trim();
  } catch {
    return url;
  }
}

export function serializeImportJob(job: any) {
  return {
    id: job.id,
    sourceUrl: job.sourceUrl,
    total: job.total,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    items: [...(job.items || [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        id: item.id,
        url: item.url,
        title: item.title,
        status: item.status,
        tour: item.tourId ? { id: item.tourId, name: item.tourName || item.title || item.url, status: "DRAFT" } : undefined,
        error: item.error,
        sortOrder: item.sortOrder
      }))
  };
}

export async function getLatestImportJob(sourceUrl?: string) {
  const job = await prisma.importJob.findFirst({
    where: sourceUrl ? { sourceUrl } : undefined,
    include: { items: true },
    orderBy: { updatedAt: "desc" }
  });
  return job ? serializeImportJob(job) : null;
}

export async function createOrUpdateImportJob(sourceUrl: string, links: string[]) {
  const existing = await prisma.importJob.findFirst({
    where: { sourceUrl },
    include: { items: true },
    orderBy: { updatedAt: "desc" }
  });

  const job = existing
    ? await prisma.importJob.update({
        where: { id: existing.id },
        data: { total: links.length, status: "ACTIVE" }
      })
    : await prisma.importJob.create({
        data: { sourceUrl, total: links.length, status: "ACTIVE" }
      });

  const existingUrls = new Set(existing?.items.map((item) => item.url) || []);
  const creates = links
    .map((link, index) => ({ link, index }))
    .filter(({ link }) => !existingUrls.has(link));

  if (creates.length) {
    await prisma.importJobItem.createMany({
      data: creates.map(({ link, index }) => ({
        jobId: job.id,
        url: link,
        title: importTitleFromUrl(link),
        sortOrder: index
      })),
      skipDuplicates: true
    });
  }

  const refreshed = await prisma.importJob.findUnique({
    where: { id: job.id },
    include: { items: true }
  });
  return refreshed ? serializeImportJob(refreshed) : null;
}

export async function refreshImportJobStatus(jobId: string) {
  const counts = await prisma.importJobItem.groupBy({
    by: ["status"],
    where: { jobId },
    _count: true
  });
  const unfinished = counts.some((item) => ["PENDING", "PROCESSING"].includes(item.status) && item._count > 0);
  await prisma.importJob.update({
    where: { id: jobId },
    data: { status: unfinished ? "ACTIVE" : "COMPLETED" }
  });
}
