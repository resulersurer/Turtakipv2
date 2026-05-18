export type DepartureLike = {
  startDate: string | Date;
  endDate?: string | Date | null;
};

const TIME_ZONE = "Europe/Istanbul";

function dayKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dateFromDayKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function compareDay(a: Date, b: Date) {
  return dayKey(a).localeCompare(dayKey(b));
}

function daysBetween(a: Date, b: Date) {
  return Math.round((dateFromDayKey(dayKey(a)).getTime() - dateFromDayKey(dayKey(b)).getTime()) / 86400000);
}

export function classifyDeparture(departure: DepartureLike, now = new Date()) {
  const start = new Date(departure.startDate);
  const end = new Date(departure.endDate || departure.startDate);
  const startCompare = compareDay(start, now);
  const endCompare = compareDay(end, now);
  if (startCompare === 0) return "today";
  if (startCompare < 0 && endCompare >= 0) return "ongoing";
  if (startCompare > 0) return "future";
  return "past";
}

export function departureRelativeLabel(departure: DepartureLike, now = new Date()) {
  const status = classifyDeparture(departure, now);
  const start = new Date(departure.startDate);
  const end = new Date(departure.endDate || departure.startDate);
  if (status === "today") return "Bugün çıkışlı";
  if (status === "ongoing") {
    const day = Math.max(1, daysBetween(now, start) + 1);
    const remaining = Math.max(0, daysBetween(end, now));
    return `${day}. günü devam ediyor${remaining ? `, ${remaining} gün sonra bitecek` : ""}`;
  }
  if (status === "future") {
    const days = daysBetween(start, now);
    return days === 1 ? "Yarın başlayacak" : `${days} gün sonra başlayacak`;
  }
  const days = daysBetween(now, end);
  return days === 1 ? "Dün bitti" : `${days} gün önce bitti`;
}

export function formatDepartureRange(departure: DepartureLike) {
  const start = new Date(departure.startDate).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
  const endDate = departure.endDate ? new Date(departure.endDate) : null;
  const end = endDate?.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
  return end ? `${start} - ${end}` : start;
}
