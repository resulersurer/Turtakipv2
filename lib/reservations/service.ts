import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertBookable, assertCapacity, effectiveStatus, occupancy, ReservationError } from "./domain";
import { capacitySchema, memberReservationSchema, reservationSchema, statusSchema } from "./validators";

const reservationInclude = {
  passengers: { orderBy: { sortOrder: "asc" } },
  events: { orderBy: { createdAt: "asc" } }
} satisfies Prisma.ReservationInclude;

// All inventory mutations lock the same departure before reading occupancy.
// READ COMMITTED ensures the query after a lock wait sees the preceding commit.
async function lockDeparture(tx: Prisma.TransactionClient, id: string) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "TourDeparture" WHERE "id" = ${id} FOR UPDATE`;
  if (!rows.length) throw new ReservationError("Çıkış bulunamadı.", 404);
  return tx.tourDeparture.findUniqueOrThrow({ where: { id }, include: { tour: { select: { status: true } }, reservations: true } });
}
const transactionOptions = { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 10000, timeout: 15000 };

export async function getReservationDashboard(departureId?: string) {
  const departures = await prisma.tourDeparture.findMany({
    orderBy: [{ startDate: "asc" }, { id: "asc" }],
    select: { id: true, startDate: true, endDate: true, capacity: true, blockedSeats: true, tour: { select: { id: true, name: true, status: true } }, reservations: { select: { status: true, seats: true, holdExpiresAt: true } } }
  });
  const now = new Date();
  const selectedId = departureId || departures.find((d) => d.tour.status !== "ARCHIVED" && d.startDate >= new Date(now.toISOString().slice(0, 10)))?.id || departures[0]?.id || null;
  if (departureId && !departures.some((d) => d.id === departureId)) throw new ReservationError("Çıkış bulunamadı.", 404);
  const reservations = selectedId ? await prisma.reservation.findMany({ where: { departureId: selectedId }, include: reservationInclude, orderBy: { createdAt: "desc" } }) : [];
  // Selected departure counts use the same rows as its list.
  return {
    serverTime: now.toISOString(),
    selectedId,
    departures: departures.map(({ reservations: rows, ...departure }) => ({ ...departure, occupancy: occupancy(departure.capacity, departure.blockedSeats, departure.id === selectedId ? reservations : rows, now) })),
    reservations: reservations.map((r) => ({ ...r, effectiveStatus: effectiveStatus(r, now) }))
  };
}

export async function setCapacity(id: string, input: unknown) {
  const data = capacitySchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const departure = await lockDeparture(tx, id);
    assertCapacity(data.capacity, data.blockedSeats, departure.reservations);
    return tx.tourDeparture.update({ where: { id }, data });
  }, transactionOptions);
}

export async function createReservation(input: unknown, memberId?: string, requirePublished = false) {
  const data = reservationSchema.parse(input);
  const requestHash = createHash("sha256").update(JSON.stringify({ ...data, memberId: memberId || null })).digest("hex");
  return prisma.$transaction(async (tx) => {
    const departure = await lockDeparture(tx, data.departureId);
    const prior = await tx.reservation.findUnique({ where: { requestId: data.requestId }, include: reservationInclude });
    if (prior) {
      if (prior.requestHash !== requestHash) throw new ReservationError("Bu istek daha önce farklı bilgilerle kullanıldı. Yeni rezervasyon formunu açın.");
      return prior;
    }
    const now = new Date();
    if (requirePublished && departure.tour.status !== "PUBLISHED") throw new ReservationError("Bu tur rezervasyona açık değil.", 409);
    assertBookable(departure.startDate, departure.tour.status, now);
    const expires = data.status === "HOLD" ? new Date(data.holdExpiresAt!) : null;
    if (expires && expires <= now) throw new ReservationError("Opsiyon bitişi gelecekte olmalıdır.", 400);
    assertCapacity(departure.capacity, departure.blockedSeats, departure.reservations, data.passengers.length, now);
    return tx.reservation.create({ data: {
      requestId: data.requestId,
      requestHash,
      code: `R-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
      departureId: data.departureId,
      memberId: memberId || null,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail || null,
      notes: data.notes || null,
      status: data.status,
      holdExpiresAt: expires,
      seats: data.passengers.length,
      passengers: { create: data.passengers.map((fullName, sortOrder) => ({ fullName, sortOrder })) },
      events: { create: { message: data.status === "HOLD" ? "Opsiyonlu rezervasyon oluşturuldu." : "Kesin rezervasyon oluşturuldu." } }
    }, include: reservationInclude });
  }, transactionOptions);
}

export async function createMemberReservation(input: unknown, member: { id: string; name: string; email: string }) {
  const data = memberReservationSchema.parse(input);
  return createReservation({
    ...data,
    contactName: member.name,
    contactEmail: member.email,
    status: "CONFIRMED"
  }, member.id, true);
}

export async function getDepartureAvailability(tourId: string) {
  const departures = await prisma.tourDeparture.findMany({
    where: { tourId, tour: { status: "PUBLISHED" } },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      capacity: true,
      blockedSeats: true,
      reservations: { select: { status: true, seats: true, holdExpiresAt: true } }
    }
  });
  const now = new Date();
  return new Map(departures.map(({ reservations, ...departure }) => [departure.id, occupancy(departure.capacity, departure.blockedSeats, reservations, now)]));
}

export async function changeReservationStatus(id: string, input: unknown) {
  const { status } = statusSchema.parse(input);
  const existing = await prisma.reservation.findUnique({ where: { id }, select: { departureId: true } });
  if (!existing) throw new ReservationError("Rezervasyon bulunamadı.", 404);
  return prisma.$transaction(async (tx) => {
    const departure = await lockDeparture(tx, existing.departureId);
    const reservation = await tx.reservation.findUniqueOrThrow({ where: { id } });
    if (reservation.status === status) return reservation;
    if (reservation.status === "CANCELLED") throw new ReservationError("İptal edilen rezervasyon yeniden açılamaz. Yeni rezervasyon oluşturun.");
    if (status === "CONFIRMED") {
      const now = new Date();
      assertBookable(departure.startDate, departure.tour.status, now);
      if (effectiveStatus(reservation, now) === "EXPIRED") throw new ReservationError("Opsiyon süresi doldu. Müsaitliğe göre yeni rezervasyon oluşturun.");
      assertCapacity(departure.capacity, departure.blockedSeats, departure.reservations, 0, now);
    }
    return tx.reservation.update({ where: { id }, data: { status, events: { create: { message: status === "CONFIRMED" ? "Rezervasyon kesinleştirildi." : "Rezervasyon iptal edildi; koltuklar serbest bırakıldı." } } } });
  }, transactionOptions);
}
