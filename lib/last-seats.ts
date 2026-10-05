import { occupancy, type OccupancyReservation } from "./reservations/domain";
import { classifyDeparture } from "./departure-status";

export const LAST_SEATS_LIMIT = 5;
export function lastSeatsAvailable(departure: {
  startDate: Date | string;
  capacity: number | null;
  blockedSeats: number;
  availabilityStatus: string | null;
  reservations: OccupancyReservation[];
}, now = new Date()) {
  const status = classifyDeparture(departure, now);
  if (!["today", "future"].includes(status) || departure.availabilityStatus === "SOURCE_REMOVED") return null;
  const available = occupancy(departure.capacity, departure.blockedSeats, departure.reservations, now).available;
  return available !== null && available > 0 && available <= LAST_SEATS_LIMIT ? available : null;
}
