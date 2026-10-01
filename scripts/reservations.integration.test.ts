import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) throw new Error("TEST_DATABASE_URL must point to a disposable local turtakip_reservations_test database.");
const parsedUrl = new URL(databaseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname) || parsedUrl.pathname !== "/turtakip_reservations_test") throw new Error("Integration tests only support the local turtakip_reservations_test database.");
process.env.DATABASE_URL = databaseUrl;

let prisma: typeof import("../lib/prisma").prisma;
let service: typeof import("../lib/reservations/service");
let tours: typeof import("../lib/tours");
const tourIds: string[] = [];
const memberIds: string[] = [];
const future = new Date("2090-06-15T00:00:00Z");

before(async () => {
  ({ prisma } = await import("../lib/prisma"));
  service = await import("../lib/reservations/service");
  tours = await import("../lib/tours");
});
after(async () => {
  if (!prisma) return;
  await prisma.adminNotification.deleteMany({ where: { tourId: { in: tourIds } } });
  await prisma.reservation.deleteMany({ where: { departure: { tourId: { in: tourIds } } } });
  await prisma.tour.deleteMany({ where: { id: { in: tourIds } } });
  await prisma.member.deleteMany({ where: { id: { in: memberIds } } });
  await prisma.$disconnect();
});

async function fixture(capacity: number | null = 2) {
  const tour = await prisma.tour.create({ data: { name: "Rezervasyon test turu", slug: `test-${randomUUID()}`, status: "DRAFT", departures: { create: { startDate: future, capacity } } }, include: { departures: true } });
  tourIds.push(tour.id);
  return { tour, departure: tour.departures[0] };
}
function booking(departureId: string, extra: Record<string, unknown> = {}) {
  return { departureId, requestId: randomUUID(), contactName: "Test Kişi", contactPhone: "+90 555 123 4567", status: "CONFIRMED", passengers: ["Test Yolcu"], ...extra };
}
function edit(tour: { slug: string; name: string }, departures: Array<{ id?: string; startDate: Date }>) {
  return { slug: tour.slug, name: tour.name, status: "DRAFT", departures };
}

test("only one of two concurrent requests gets the last seat", async () => {
  const { departure } = await fixture(1);
  const result = await Promise.allSettled([service.createReservation(booking(departure.id)), service.createReservation(booking(departure.id))]);
  assert.equal(result.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(result.filter((r) => r.status === "rejected").length, 1);
  assert.equal(await prisma.reservation.count({ where: { departureId: departure.id } }), 1);
});

test("parallel retries with the same request ID create only one booking", async () => {
  const { departure } = await fixture(2);
  const payload = booking(departure.id);
  const results = await Promise.all([service.createReservation(payload), service.createReservation(payload)]);
  assert.equal(results[0].id, results[1].id);
  assert.equal(await prisma.reservation.count({ where: { departureId: departure.id } }), 1);
  await assert.rejects(service.createReservation({ ...payload, status: "HOLD", holdExpiresAt: new Date(Date.now() + 60000).toISOString() }), /farklı bilgilerle/);
});

test("member booking derives contact identity, links ownership and requires a published tour", async () => {
  const { tour, departure } = await fixture(3);
  const member = await prisma.member.create({ data: { name: "Üye Test", email: `booking-${randomUUID()}@example.com` } });
  memberIds.push(member.id);
  const payload = { requestId: randomUUID(), departureId: departure.id, contactPhone: "+90 555 123 4567", passengers: ["Üye Yolcu"] };
  await assert.rejects(service.createMemberReservation(payload, member), /açık değil/);
  await prisma.tour.update({ where: { id: tour.id }, data: { status: "PUBLISHED" } });
  const reservation = await service.createMemberReservation(payload, member);
  assert.equal(reservation.contactName, member.name);
  assert.equal(reservation.contactEmail, member.email);
  assert.equal((await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id } })).memberId, member.id);
  assert.equal((await service.getDepartureAvailability(tour.id)).get(departure.id)?.available, 2);
});

test("capacity must be configured and cannot be reduced below occupied and blocked seats", async () => {
  const { departure } = await fixture(null);
  await assert.rejects(service.createReservation(booking(departure.id)), /kapasite/);
  await service.setCapacity(departure.id, { capacity: 4, blockedSeats: 1 });
  await service.createReservation(booking(departure.id, { passengers: ["Bir Yolcu", "İki Yolcu"] }));
  await assert.rejects(service.setCapacity(departure.id, { capacity: 2, blockedSeats: 1 }), /indirilemez/);
  const saved = await prisma.tourDeparture.findUniqueOrThrow({ where: { id: departure.id } });
  assert.equal(saved.capacity, 4);
});

test("expired holds release inventory without cron and cannot be confirmed", async () => {
  const { departure } = await fixture(1);
  const hold = await service.createReservation(booking(departure.id, { status: "HOLD", holdExpiresAt: new Date(Date.now() + 60000).toISOString() }));
  await assert.rejects(service.createReservation(booking(departure.id)), /Yeterli/);
  await prisma.reservation.update({ where: { id: hold.id }, data: { holdExpiresAt: new Date(Date.now() - 1000) } });
  const dashboard = await service.getReservationDashboard(departure.id);
  assert.equal(dashboard.reservations[0].effectiveStatus, "EXPIRED");
  await assert.rejects(service.changeReservationStatus(hold.id, { status: "CONFIRMED" }), /süresi doldu/);
  await service.createReservation(booking(departure.id));
});

test("confirming a hold consumes no extra inventory, cancellation restores it and preserves history", async () => {
  const { departure } = await fixture(1);
  const hold = await service.createReservation(booking(departure.id, { status: "HOLD", holdExpiresAt: new Date(Date.now() + 60000).toISOString() }));
  await service.changeReservationStatus(hold.id, { status: "CONFIRMED" });
  await assert.rejects(service.createReservation(booking(departure.id)), /Yeterli/);
  await service.changeReservationStatus(hold.id, { status: "CANCELLED" });
  await service.changeReservationStatus(hold.id, { status: "CANCELLED" });
  const record = await prisma.reservation.findUniqueOrThrow({ where: { id: hold.id }, include: { passengers: true, events: true } });
  assert.equal(record.passengers.length, 1);
  assert.equal(record.events.length, 3);
  await assert.rejects(service.changeReservationStatus(hold.id, { status: "CONFIRMED" }), /yeniden açılamaz/);
  await service.createReservation(booking(departure.id));
});

test("editing and reimporting preserve departure ID, inventory and booking links", async () => {
  const { tour, departure } = await fixture(10);
  await service.setCapacity(departure.id, { capacity: 10, blockedSeats: 2 });
  const reservation = await service.createReservation(booking(departure.id));
  await tours.saveTour(edit(tour, [{ id: departure.id, startDate: future }]), tour.id);
  // Import payloads carry dates but not local IDs.
  await tours.saveTour(edit(tour, [{ startDate: future }]), tour.id);
  const saved = await prisma.tourDeparture.findUniqueOrThrow({ where: { id: departure.id } });
  assert.equal(saved.capacity, 10);
  assert.equal(saved.blockedSeats, 2);
  assert.equal((await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id } })).departureId, departure.id);
});

test("booked departures cannot be removed, moved to another date or deleted with their tour", async () => {
  const { tour, departure } = await fixture();
  await service.createReservation(booking(departure.id));
  await assert.rejects(tours.saveTour(edit(tour, []), tour.id), /kaldırılamaz/);
  await assert.rejects(tours.saveTour(edit(tour, [{ id: departure.id, startDate: new Date("2090-07-15T00:00:00Z") }]), tour.id), /tarihi değiştirilemez/);
  await assert.rejects(tours.deleteTour(tour.id), /silinemez/);
  await assert.rejects(prisma.tourDeparture.delete({ where: { id: departure.id } }));
  assert.equal(await prisma.reservation.count({ where: { departureId: departure.id } }), 1);
});

test("past and archived departures reject reservations", async () => {
  const { tour, departure } = await fixture();
  await prisma.tour.update({ where: { id: tour.id }, data: { status: "ARCHIVED" } });
  await assert.rejects(service.createReservation(booking(departure.id)), /Arşiv/);
  await prisma.tour.update({ where: { id: tour.id }, data: { status: "DRAFT" } });
  await prisma.tourDeparture.update({ where: { id: departure.id }, data: { startDate: new Date("2020-01-01") } });
  await assert.rejects(service.createReservation(booking(departure.id)), /Geçmiş/);
});

test("simultaneous capacity reduction and booking cannot oversell", async () => {
  const { departure } = await fixture(2);
  await Promise.allSettled([service.setCapacity(departure.id, { capacity: 0, blockedSeats: 0 }), service.createReservation(booking(departure.id))]);
  const saved = await prisma.tourDeparture.findUniqueOrThrow({ where: { id: departure.id }, include: { reservations: true } });
  assert.ok(saved.reservations.reduce((sum, r) => sum + r.seats, 0) <= saved.capacity!);
});

test("bulk deletion skips tours with reservation history, including cancelled bookings", async () => {
  const protectedFixture = await fixture();
  const removable = await fixture();
  const reservation = await service.createReservation(booking(protectedFixture.departure.id));
  await service.changeReservationStatus(reservation.id, { status: "CANCELLED" });
  await prisma.tour.updateMany({ where: { id: { in: [protectedFixture.tour.id, removable.tour.id] } }, data: { status: "ARCHIVED" } });
  const deleted = await tours.deleteToursByStatus("ARCHIVED");
  assert.equal(deleted, 1);
  assert.ok(await prisma.tour.findUnique({ where: { id: protectedFixture.tour.id } }));
  assert.equal(await prisma.tour.findUnique({ where: { id: removable.tour.id } }), null);
});

test("departure IDs from another tour cannot be attached through an edit", async () => {
  const one = await fixture();
  const two = await fixture();
  await assert.rejects(tours.saveTour(edit(one.tour, [{ id: two.departure.id, startDate: future }]), one.tour.id), /bu tura ait değil/);
  assert.equal((await prisma.tourDeparture.findUniqueOrThrow({ where: { id: two.departure.id } })).tourId, two.tour.id);
});

test("last-seat booking creates one full notification and cancellation creates a reopening notification", async () => {
  const { tour, departure } = await fixture(1);
  const payload = booking(departure.id);
  const reservation = await service.createReservation(payload);
  await service.createReservation(payload);
  let notifications = await prisma.adminNotification.findMany({ where: { tourId: tour.id } });
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].type, "CAPACITY_FULL");
  assert.equal(notifications[0].departureId, departure.id);
  await service.changeReservationStatus(reservation.id, { status: "CANCELLED" });
  notifications = await prisma.adminNotification.findMany({ where: { tourId: tour.id } });
  assert.equal(notifications.length, 2);
  assert.ok(notifications.some((item) => item.type === "CAPACITY_AVAILABLE"));
});

test("capacity edits notify only when availability crosses full", async () => {
  const { tour, departure } = await fixture(2);
  await service.createReservation(booking(departure.id));
  await service.setCapacity(departure.id, { capacity: 1, blockedSeats: 0 });
  await service.setCapacity(departure.id, { capacity: 1, blockedSeats: 0 });
  await service.setCapacity(departure.id, { capacity: 3, blockedSeats: 0 });
  const notifications = await prisma.adminNotification.findMany({ where: { tourId: tour.id } });
  assert.equal(notifications.length, 2);
  assert.ok(notifications.some((item) => item.type === "CAPACITY_FULL"));
  assert.ok(notifications.some((item) => item.type === "CAPACITY_AVAILABLE"));
});
