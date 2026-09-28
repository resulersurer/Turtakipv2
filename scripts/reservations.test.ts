import test from "node:test";
import assert from "node:assert/strict";
import { assertBookable, assertCapacity, csvCell, effectiveStatus, occupancy } from "../lib/reservations/domain";
import { capacitySchema, reservationSchema } from "../lib/reservations/validators";

const now = new Date("2026-09-25T12:00:00Z");
const rows = [
  { status: "CONFIRMED" as const, seats: 30, holdExpiresAt: null },
  { status: "HOLD" as const, seats: 4, holdExpiresAt: "2026-09-25T12:01:00Z" },
  { status: "HOLD" as const, seats: 7, holdExpiresAt: now },
  { status: "CANCELLED" as const, seats: 6, holdExpiresAt: null }
];

test("availability excludes expired and cancelled reservations", () => {
  assert.deepEqual(occupancy(46, 2, rows, now), { capacity: 46, blockedSeats: 2, confirmed: 30, held: 4, available: 10 });
});
test("hold expires exactly at its deadline", () => {
  assert.equal(effectiveStatus(rows[1], now), "HOLD");
  assert.equal(effectiveStatus(rows[2], now), "EXPIRED");
  assert.equal(effectiveStatus({ status: "HOLD", seats: 1, holdExpiresAt: null }, now), "EXPIRED");
});
test("unknown capacity blocks bookings; zero capacity is not unlimited", () => {
  assert.equal(occupancy(null, 0, [], now).available, null);
  assert.throws(() => assertCapacity(null, 0, [], 1, now), /kapasite/);
  assert.throws(() => assertCapacity(0, 0, [], 1, now), /Yeterli/);
});
test("cannot exceed inventory or shrink below booked plus blocked seats", () => {
  assert.equal(assertCapacity(46, 2, rows, 10, now).available, 10);
  assert.throws(() => assertCapacity(46, 2, rows, 11, now), /Yeterli/);
  assert.throws(() => assertCapacity(35, 2, rows, 0, now), /indirilemez/);
});
test("bookability uses the Istanbul day across the UTC midnight boundary", () => {
  const localNextDay = new Date("2026-09-25T22:00:00Z");
  assert.throws(() => assertBookable(new Date("2026-09-25T00:00:00Z"), "PUBLISHED", localNextDay), /Geçmiş/);
  assert.doesNotThrow(() => assertBookable(new Date("2026-09-26T00:00:00Z"), "PUBLISHED", localNextDay));
  assert.throws(() => assertBookable(new Date("2026-09-26T00:00:00Z"), "ARCHIVED", now), /Arşiv/);
});
test("capacity validation rejects fractions, negatives and blocked seats over total", () => {
  for (const value of [{ capacity: -1, blockedSeats: 0 }, { capacity: 4.5, blockedSeats: 0 }, { capacity: 4, blockedSeats: 5 }]) assert.equal(capacitySchema.safeParse(value).success, false);
  assert.equal(capacitySchema.safeParse({ capacity: 46, blockedSeats: 2 }).success, true);
});
test("reservation requires named passengers, contact details and a hold deadline", () => {
  const valid = { requestId: "91d8aa21-b2f9-43fc-a523-20759cb93af6", departureId: "departure", contactName: "Test Kişi", contactPhone: "+90 555 123 4567", status: "CONFIRMED", passengers: ["Test Yolcu"] };
  assert.equal(reservationSchema.safeParse(valid).success, true);
  for (const change of [{ passengers: [] }, { passengers: [" "] }, { status: "HOLD" }, { contactPhone: "abcdefg" }, { requestId: "not-a-uuid" }]) assert.equal(reservationSchema.safeParse({ ...valid, ...change }).success, false);
});
test("CSV escapes quotes and prevents formulas in passenger and contact fields", () => {
  assert.equal(csvCell('Ali "Can"'), '"Ali ""Can"""');
  assert.equal(csvCell("=1+1"), '"\'=1+1"');
  assert.equal(csvCell("  +90555"), '"\'  +90555"');
  assert.equal(csvCell("Ayşe Yılmaz"), '"Ayşe Yılmaz"');
});
