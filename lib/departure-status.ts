export type DepartureLike = {
  startDate: string | Date;
  endDate?: string | Date | null;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(a: Date, b: Date) {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

export function classifyDeparture(departure: DepartureLike, now = new Date()) {
  const start = startOfDay(new Date(departure.startDate));
  const end = startOfDay(new Date(departure.endDate || departure.startDate));
  const today = startOfDay(now);
  if (start.getTime() === today.getTime()) return "today";
  if (start < today && end >= today) return "ongoing";
  if (start > today) return "future";
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
