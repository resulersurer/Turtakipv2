export type BookingStatus = "HOLD" | "CONFIRMED" | "CANCELLED";
export type OccupancyReservation = {
  status: BookingStatus;
  seats: number;
  holdExpiresAt: Date | string | null;
};

export class ReservationError extends Error {
  status: number;
  constructor(message: string, status = 409) {
    super(message);
    this.status = status;
  }
}

export function effectiveStatus(reservation: OccupancyReservation, now = new Date()) {
  if (reservation.status === "HOLD" && (!reservation.holdExpiresAt || new Date(reservation.holdExpiresAt) <= now)) return "EXPIRED";
  return reservation.status;
}

export function occupancy(capacity: number | null, blockedSeats: number, reservations: OccupancyReservation[], now = new Date()) {
  let confirmed = 0;
  let held = 0;
  for (const reservation of reservations) {
    const status = effectiveStatus(reservation, now);
    if (status === "CONFIRMED") confirmed += reservation.seats;
    if (status === "HOLD") held += reservation.seats;
  }
  return { capacity, blockedSeats, confirmed, held, available: capacity === null ? null : capacity - blockedSeats - confirmed - held };
}

export function assertCapacity(capacity: number | null, blockedSeats: number, reservations: OccupancyReservation[], additionalSeats = 0, now = new Date()) {
  const result = occupancy(capacity, blockedSeats, reservations, now);
  if (result.available === null) throw new ReservationError("Önce bu çıkış için toplam kapasiteyi belirleyin.");
  if (result.available < additionalSeats) throw new ReservationError(`Yeterli müsait koltuk yok. Müsait: ${Math.max(0, result.available)}. Kapasite mevcut rezervasyonların altına indirilemez.`);
  return result;
}

export function assertBookable(startDate: Date, tourStatus: string, now = new Date()) {
  const dateKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  if (tourStatus === "ARCHIVED") throw new ReservationError("Arşivlenmiş tura rezervasyon yapılamaz.");
  if (dateKey(startDate) < dateKey(now)) throw new ReservationError("Geçmiş bir çıkışa rezervasyon yapılamaz.");
}

export function csvCell(value: string) {
  // Spreadsheet formula injection protection, including leading whitespace.
  const safe = /^\s*[=+\-@\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
