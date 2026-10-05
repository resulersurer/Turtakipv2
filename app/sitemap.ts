import type { MetadataRoute } from "next";
import { tourCollections } from "@/lib/tour-collections";
import { prisma } from "@/lib/prisma";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { officialTourUrl, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/passenger`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/passenger/tours/2026`, changeFrequency: "daily", priority: 0.85 },
    { url: `${siteUrl}/passenger/tours/2027`, changeFrequency: "daily", priority: 0.85 },
    { url: `${siteUrl}/passenger/tours/vip`, changeFrequency: "daily", priority: 0.85 },
    { url: `${siteUrl}/passenger/contact`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/passenger/tour-request`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/tours`, changeFrequency: "daily", priority: 0.8 }
  ];
  pages.push(...[2026, 2027].map((year) => ({ url: `${siteUrl}/passenger/tours/${year}/son-koltuklar`, changeFrequency: "daily" as const, priority: 0.8 })));
  pages.push(...tourCollections.map((collection) => ({ url: `${siteUrl}/passenger/collections/${collection.slug}`, changeFrequency: "daily" as const, priority: 0.8 })));
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return pages;
  try {
    const tours = await prisma.tour.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, sourceUrl: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 40000
    });
    return pages.concat(tours.filter((tour) => !officialTourUrl(tour.sourceUrl)).map((tour) => ({
      url: `${siteUrl}/tour/${encodeURIComponent(tour.slug)}`,
      lastModified: tour.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6
    })));
  } catch {
    return pages;
  }
}
