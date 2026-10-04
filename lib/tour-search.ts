type SearchableTour = {
  name?: string | null;
  departureCity?: string | null;
  airline?: string | null;
  visaStatus?: string | null;
  days?: Array<{ title?: string | null; city?: string | null; country?: string | null; description?: string | null }>;
};

export function normalizeSearchText(value: string) {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

export function matchesTourSearch(tour: SearchableTour, query: string) {
  const tokens = normalizeSearchText(query).split(" ").filter(Boolean);
  if (!tokens.length) return true;
  const airline = normalizeSearchText(tour.airline || "");
  const aliases = /turk hava|turkish|\bthy\b/.test(airline) ? "thy tk turkish airlines turk hava yollari" : "";
  const text = normalizeSearchText([
    tour.name, tour.departureCity, tour.airline, tour.visaStatus, aliases,
    ...(tour.days || []).flatMap((day) => [day.title, day.city, day.country, day.description]),
  ].filter(Boolean).join(" "));
  return tokens.every((token) => text.includes(token));
}
