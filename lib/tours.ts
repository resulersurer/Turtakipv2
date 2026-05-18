import { Prisma, TourStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { tourWriteSchema } from "@/lib/validators";
import type { ParsedTour } from "@/lib/import/normalizeTour";

export const tourInclude = {
  departures: { orderBy: { startDate: "asc" } },
  days: { orderBy: { sortOrder: "asc" } },
  images: { orderBy: { sortOrder: "asc" } },
  prices: true
} satisfies Prisma.TourInclude;

export function serializeTour<T>(tour: T): T {
  return JSON.parse(
    JSON.stringify(tour, (_key, value) => {
      if (typeof value === "object" && value !== null && "toNumber" in value) return value.toNumber();
      return value;
    })
  );
}

export async function saveTour(input: unknown, id?: string) {
  const data = tourWriteSchema.parse(input);
  const base = {
    externalId: data.externalId,
    sourceUrl: data.sourceUrl,
    slug: data.slug,
    name: data.name,
    durationDays: data.durationDays,
    departureCity: data.departureCity,
    airline: data.airline,
    visaStatus: data.visaStatus,
    status: data.status as TourStatus,
    coverImageUrl: data.coverImageUrl
  };
  const existingId = id;
  return prisma.$transaction(
    async (tx) => {
    const tour = existingId
      ? await tx.tour.update({ where: { id: existingId }, data: base })
      : await tx.tour.create({ data: base });
    await tx.tourDeparture.deleteMany({ where: { tourId: tour.id } });
    await tx.tourDay.deleteMany({ where: { tourId: tour.id } });
    await tx.tourImage.deleteMany({ where: { tourId: tour.id } });
    await tx.tourPrice.deleteMany({ where: { tourId: tour.id } });
    if (data.departures.length) {
      await tx.tourDeparture.createMany({
        data: data.departures.map((departure) => ({
          tourId: tour.id,
          startDate: departure.startDate,
          endDate: departure.endDate,
          label: departure.label,
          price: departure.price,
          currency: departure.currency,
          availabilityStatus: departure.availabilityStatus
        }))
      });
    }
    if (data.days.length) {
      await tx.tourDay.createMany({ data: data.days.map((day) => ({ ...day, tourId: tour.id })) });
    }
    if (data.images.length) {
      await tx.tourImage.createMany({ data: data.images.map((image) => ({ ...image, tourId: tour.id })) });
    }
    if (data.prices.length) {
      await tx.tourPrice.createMany({
        data: data.prices.map((price) => ({
          tourId: tour.id,
          roomType: price.roomType,
          adultPrice: price.adultPrice,
          childPrice: price.childPrice,
          currency: price.currency
        }))
      });
    }
      return tx.tour.findUniqueOrThrow({ where: { id: tour.id }, include: tourInclude });
    },
    {
      maxWait: 10000,
      timeout: 30000
    }
  );
}

export async function upsertImportedTour(parsed: ParsedTour) {
  const existing = await prisma.tour.findFirst({
    where: {
      OR: [{ sourceUrl: parsed.sourceUrl }, { externalId: parsed.externalId || undefined }, { slug: parsed.slug }]
    }
  });
  const saved = await saveTour(
    {
      ...parsed,
      status: "DRAFT",
      importedAt: new Date()
    },
    existing?.id
  );
  await prisma.tour.update({ where: { id: saved.id }, data: { importedAt: new Date() } });
  return prisma.tour.findUniqueOrThrow({ where: { id: saved.id }, include: tourInclude });
}
