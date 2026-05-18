import { slugify } from "@/lib/slug";

export type ParsedTour = {
  externalId?: string | null;
  sourceUrl: string;
  slug: string;
  name: string;
  durationDays?: number | null;
  departureCity?: string | null;
  airline?: string | null;
  visaStatus?: string | null;
  coverImageUrl?: string | null;
  departures: Array<{
    startDate: Date;
    endDate?: Date | null;
    label?: string | null;
    price?: number | null;
    currency?: string;
    availabilityStatus?: string | null;
  }>;
  days: Array<{
    dayNumber: number;
    title: string;
    dateOffset: number;
    hour?: string | null;
    city?: string | null;
    country?: string | null;
    description?: string | null;
    hotelInfo?: string | null;
    flightInfo?: string | null;
    photoUrl?: string | null;
    lat?: number | null;
    lng?: number | null;
    sortOrder: number;
  }>;
  images: Array<{ url: string; alt?: string | null; sortOrder: number }>;
  prices: Array<{ roomType: string; adultPrice?: number | null; childPrice?: number | null; currency: string }>;
  warnings: string[];
};

export function normalizeText(input?: string | null) {
  return (input || "").replace(/\s+/g, " ").trim();
}

export function inferDuration(text: string) {
  const match = text.match(/(\d+)\s*(?:g[uü]n|gece|gün)/i);
  return match ? Number(match[1]) : null;
}

export function inferExternalId(sourceUrl: string) {
  const url = new URL(sourceUrl);
  const syprdky = url.searchParams.get("syprdky");
  if (syprdky) return syprdky;
  const path = url.pathname;
  const htmlId = path.match(/_([0-9]+)\.html/i)?.[1];
  const contpg = url.searchParams.get("contpg");
  return htmlId || contpg || slugify(path);
}

export function makeParsedBase(sourceUrl: string, name: string): Pick<ParsedTour, "sourceUrl" | "externalId" | "slug" | "name" | "warnings"> {
  const externalId = inferExternalId(sourceUrl);
  return { sourceUrl, externalId, slug: slugify(`${name}-${externalId || ""}`), name, warnings: [] };
}

export function inferCityCountry(title: string) {
  const cleaned = title.replace(/^\d+\.\s*g[uü]n\s*:?\s*/i, "").trim();
  const knownCities = [
    "TOKYO",
    "OSAKA",
    "KYOTO",
    "NARA",
    "KOBE",
    "FUJI",
    "HAKONE",
    "KAMAKURA",
    "SEUL",
    "SEOUL",
    "BUSAN",
    "İSTANBUL",
    "ISTANBUL"
  ];
  const hits = knownCities.filter((city) => new RegExp(`\\b${city}\\b`, "i").test(cleaned));
  let city = hits[0] || null;
  if (hits.length > 1) {
    if (/dönüş|donus|return/i.test(cleaned) && /istanbul/i.test(hits[hits.length - 1])) {
      city = hits[0];
    } else if (/istanbul/i.test(hits[0])) {
      city = hits[1];
    } else {
      city = hits[hits.length - 1];
    }
  }
  city = city === "SEOUL" ? "SEUL" : city;
  const country = /seul|seoul|busan|kore/i.test(city || cleaned) ? "Güney Kore" : /tokyo|osaka|kyoto|nara|kobe|fuji|hakone|kamakura|japon/i.test(city || cleaned) ? "Japonya" : null;
  return { city, country };
}

export function parsePrice(text: string) {
  const match = text.replace(/\./g, "").match(/(\d+(?:,\d+)?)\s*(EUR|EURO|USD|TL|TRY|₺|\$|€)/i);
  if (!match) return null;
  const currencyMap: Record<string, string> = { EURO: "EUR", "€": "EUR", "₺": "TRY", TL: "TRY", "$": "USD" };
  return { amount: Number(match[1].replace(",", ".")), currency: currencyMap[match[2].toUpperCase()] || match[2].toUpperCase() };
}
