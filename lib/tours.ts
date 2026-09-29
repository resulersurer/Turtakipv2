import { Prisma, TourStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { tourWriteSchema } from "@/lib/validators";
import type { ParsedTour } from "@/lib/import/normalizeTour";
import { cleanImportedText } from "@/lib/display";
import { ReservationError } from "@/lib/reservations/domain";

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

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export async function saveTour(input: unknown, id?: string, options: { preserveBookedRemovedDepartures?: boolean } = {}) {
  const data = tourWriteSchema.parse(input);
  const departures = uniqueBy(data.departures, (departure) => departure.startDate.toISOString());
  const days = uniqueBy(data.days, (day) => String(day.dayNumber));
  const images = uniqueBy(data.images, (image) => image.url);
  const base = {
    externalId: data.externalId,
    sourceUrl: data.sourceUrl,
    slug: data.slug,
    name: data.name,
    durationDays: data.durationDays,
    departureCity: cleanImportedText(data.departureCity),
    airline: cleanImportedText(data.airline),
    visaStatus: cleanImportedText(data.visaStatus),
    status: data.status as TourStatus,
    coverImageUrl: data.coverImageUrl
  };
  const existingId = id;
  if (!existingId && departures.length) {
    const duplicate = await prisma.tour.findFirst({
      where: { name: { equals: data.name, mode: "insensitive" }, departures: { some: { startDate: { in: departures.map((item) => item.startDate) } } } },
      select: { id: true, name: true }
    });
    if (duplicate) throw new ReservationError(`Aynı ad ve çıkış tarihine sahip bir tur zaten var: ${duplicate.name}`, 409);
  }
  return prisma.$transaction(
    async (tx) => {
    const tour = existingId
      ? await tx.tour.update({ where: { id: existingId }, data: base })
      : await tx.tour.create({ data: base });
    // Preserve departure IDs and inventory when editing or re-importing a tour.
    await tx.$queryRaw`SELECT "id" FROM "TourDeparture" WHERE "tourId" = ${tour.id} ORDER BY "id" FOR UPDATE`;
    const previous = await tx.tourDeparture.findMany({ where: { tourId: tour.id } });
    const retained = new Set<string>();
    for (const departure of departures) {
      const match = departure.id
        ? previous.find((row) => row.id === departure.id)
        : previous.find((row) => row.startDate.getTime() === departure.startDate.getTime());
      if (departure.id && !match) throw new ReservationError("Çıkış bu tura ait değil.", 400);
      if (match && retained.has(match.id)) throw new ReservationError("Aynı çıkış birden fazla kez gönderilemez.", 400);
      const values = {
        startDate: departure.startDate, endDate: departure.endDate,
        label: departure.label, price: departure.price,
        currency: departure.currency, availabilityStatus: departure.availabilityStatus
      };
      if (match) {
        // A booked departure date is an immutable part of the booking history.
        if (match.startDate.getTime() !== departure.startDate.getTime() && await tx.reservation.count({ where: { departureId: match.id } })) {
          throw new ReservationError("Rezervasyon geçmişi olan çıkışın tarihi değiştirilemez. Yeni bir çıkış ekleyin.");
        }
        await tx.tourDeparture.update({ where: { id: match.id }, data: values });
        retained.add(match.id);
      } else {
        const created = await tx.tourDeparture.create({ data: { ...values, tourId: tour.id } });
        retained.add(created.id);
      }
    }
    const removed = previous.filter((row) => !retained.has(row.id)).map((row) => row.id);
    if (removed.length) {
      const booked = await tx.reservation.findMany({ where: { departureId: { in: removed } }, select: { departureId: true }, distinct: ["departureId"] });
      const bookedIds = booked.map((item) => item.departureId);
      if (bookedIds.length && !options.preserveBookedRemovedDepartures) {
        throw new ReservationError("Rezervasyon geçmişi olan çıkış kaldırılamaz. Mevcut çıkış tarihlerini koruyun.");
      }
      if (bookedIds.length) await tx.tourDeparture.updateMany({ where: { id: { in: bookedIds } }, data: { availabilityStatus: "SOURCE_REMOVED" } });
      await tx.tourDeparture.deleteMany({ where: { id: { in: removed.filter((id) => !bookedIds.includes(id)) } } });
    }
    await tx.tourDay.deleteMany({ where: { tourId: tour.id } });
    await tx.tourImage.deleteMany({ where: { tourId: tour.id } });
    await tx.tourPrice.deleteMany({ where: { tourId: tour.id } });
    if (days.length) {
      await tx.tourDay.createMany({ data: days.map((day) => ({ ...day, tourId: tour.id })), skipDuplicates: true });
    }
    if (images.length) {
      await tx.tourImage.createMany({ data: images.map((image) => ({ ...image, tourId: tour.id })) });
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
      timeout: 60000
    }
  );
}

export async function deleteTour(id: string) {
  await prisma.$transaction(async (tx) => {
    if (await tx.reservation.count({ where: { departure: { tourId: id } } })) {
      throw new ReservationError("Rezervasyon geçmişi bulunan tur silinemez. Turu arşivleyebilirsiniz.");
    }
    await tx.importLog.updateMany({ where: { tourId: id }, data: { tourId: null } });
    await tx.tourPrice.deleteMany({ where: { tourId: id } });
    await tx.tourImage.deleteMany({ where: { tourId: id } });
    await tx.tourDay.deleteMany({ where: { tourId: id } });
    await tx.tourDeparture.deleteMany({ where: { tourId: id } });
    await tx.tour.delete({ where: { id } });
  });
}

export async function deleteToursByStatus(status: TourStatus) {
  return prisma.$transaction(
    async (tx) => {
      const tours = await tx.tour.findMany({ where: { status, departures: { every: { reservations: { none: {} } } } }, select: { id: true } });
      const ids = tours.map((tour) => tour.id);
      if (!ids.length) return 0;
      await tx.importLog.updateMany({ where: { tourId: { in: ids } }, data: { tourId: null } });
      await tx.tourPrice.deleteMany({ where: { tourId: { in: ids } } });
      await tx.tourImage.deleteMany({ where: { tourId: { in: ids } } });
      await tx.tourDay.deleteMany({ where: { tourId: { in: ids } } });
      await tx.tourDeparture.deleteMany({ where: { tourId: { in: ids } } });
      const result = await tx.tour.deleteMany({ where: { id: { in: ids } } });
      return result.count;
    },
    {
      maxWait: 10000,
      timeout: 30000
    }
  );
}

export async function upsertImportedTour(parsed: ParsedTour, options: { automatic?: boolean; sourceHash?: string } = {}) {
  const existing = await prisma.tour.findFirst({
    where: {
      OR: [{ sourceUrl: parsed.sourceUrl }, { externalId: parsed.externalId || undefined }, { slug: parsed.slug }]
    },
    include: { days: true }
  });
  if (options.automatic && existing) {
    parsed.days = parsed.days.map((day) => {
      const previous = existing.days.find((item) => item.dayNumber === day.dayNumber && item.city === day.city);
      return previous ? { ...day, lat: previous.lat, lng: previous.lng } : day;
    });
  }
  const saved = await saveTour(
    {
      ...parsed,
      status: existing?.status || "DRAFT",
      importedAt: new Date()
    },
    existing?.id,
    { preserveBookedRemovedDepartures: options.automatic }
  );
  await prisma.tour.update({ where: { id: saved.id }, data: { importedAt: new Date(), sourceHash: options.sourceHash } });
  return prisma.tour.findUniqueOrThrow({ where: { id: saved.id }, include: tourInclude });
}
