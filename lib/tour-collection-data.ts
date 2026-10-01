import { unstable_cache } from "next/cache";
import { parseTourList } from "@/lib/import/parseTourList";
import { inferExternalId } from "@/lib/import/normalizeTour";
import { prisma } from "@/lib/prisma";

const collectionLinks = unstable_cache(async (sourceUrl: string) => {
  const links = await parseTourList(sourceUrl, { timeoutMs: 10000 });
  if (!links.length) throw new Error("Kategori listesi şu anda alınamıyor.");
  return links;
}, ["passenger-tour-collections"], { revalidate: 3600 });

export async function getCollectionTours(sourceUrl: string) {
  const links = await collectionLinks(sourceUrl);
  const externalIds = [...new Set(links.map(inferExternalId).filter((value): value is string => Boolean(value)))];
  return prisma.tour.findMany({
    where: { status: "PUBLISHED", OR: [{ sourceUrl: { in: links } }, { externalId: { in: externalIds } }] },
    include: { departures: { orderBy: { startDate: "asc" } }, days: { orderBy: { sortOrder: "asc" } }, images: { orderBy: { sortOrder: "asc" } }, prices: true },
    orderBy: { name: "asc" }
  });
}
