import assert from "node:assert/strict";
import test from "node:test";
import { lastSeatsAvailable } from "../lib/last-seats";
const now = new Date("2026-10-05T10:00:00Z");
const departure = { startDate: "2026-11-01T10:00:00Z", capacity: 5, blockedSeats: 0, availabilityStatus: null, reservations: [] };
test("includes only 1 to 5 available seats", () => {
  for (const capacity of [1, 3, 5]) assert.equal(lastSeatsAvailable({ ...departure, capacity }, now), capacity);
  for (const capacity of [0, 6, null]) assert.equal(lastSeatsAvailable({ ...departure, capacity }, now), null);
});
test("excludes past and removed departures", () => {
  assert.equal(lastSeatsAvailable({ ...departure, startDate: "2026-10-04" }, now), null);
  assert.equal(lastSeatsAvailable({ ...departure, availabilityStatus: "SOURCE_REMOVED" }, now), null);
});
test("counts blocked seats, confirmed and active holds", () => {
  assert.equal(lastSeatsAvailable({ ...departure, capacity: 10, blockedSeats: 2, reservations: [
    { status: "CONFIRMED", seats: 2, holdExpiresAt: null },
    { status: "HOLD", seats: 1, holdExpiresAt: "2026-10-06" },
    { status: "HOLD", seats: 2, holdExpiresAt: "2026-10-04" },
    { status: "CANCELLED", seats: 2, holdExpiresAt: null },
  ] }, now), 5);
});
