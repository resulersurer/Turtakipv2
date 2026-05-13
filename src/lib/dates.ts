export function getDateRangeDays(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days: string[] = [];
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return days;

  const current = new Date(start);
  while (current <= end) {
    days.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function formatShortDate(date: string) {
  try {
    return new Intl.DateTimeFormat('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(date));
  } catch {
    return date;
  }
}

export function getIsoWeekday(date: string) {
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return '';
  return new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(dt);
}

export function getMonthLabel(date: string) {
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return '';
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(dt);
}
