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
  const path = new URL(sourceUrl).pathname;
  const htmlId = path.match(/_([0-9]+)\.html/i)?.[1];
  const contpg = new URL(sourceUrl).searchParams.get("contpg");
  return htmlId || contpg || slugify(path);
}

export function makeParsedBase(sourceUrl: string, name: string): Pick<ParsedTour, "sourceUrl" | "externalId" | "slug" | "name" | "warnings"> {
  const externalId = inferExternalId(sourceUrl);
  return { sourceUrl, externalId, slug: slugify(`${name}-${externalId || ""}`), name, warnings: [] };
}

export function inferCityCountry(title: string) {
  const cleaned = title.replace(/^\d+\.\s*g[uü]n\s*:?\s*/i, "").trim();
  const parts = cleaned
    .split(/[-–|>]/)
    .map((part) =>
      normalizeText(part)
        .replace(/\b(varis|varış|sehir turu|şehir turu|transfer|otel|konaklama|serbest zaman|ucus|uçuş)\b/gi, "")
        .trim()
    )
    .filter(Boolean);
  const destination = parts.length > 1 && /istanbul|ist/i.test(parts[0]) ? parts[parts.length - 1] : parts[0] || cleaned;
  const city = destination?.split(/[,&/]/)[0]?.trim() || null;
  const country = /japon/i.test(cleaned) ? "Japonya" : /kore|seul|busan/i.test(cleaned) ? "Güney Kore" : null;
  return { city, country };
}

export function parsePrice(text: string) {
  const match = text.replace(/\./g, "").match(/(\d+(?:,\d+)?)\s*(EUR|EURO|USD|TL|TRY|₺|\$|€)/i);
  if (!match) return null;
  const currencyMap: Record<string, string> = { EURO: "EUR", "€": "EUR", "₺": "TRY", TL: "TRY", "$": "USD" };
  return { amount: Number(match[1].replace(",", ".")), currency: currencyMap[match[2].toUpperCase()] || match[2].toUpperCase() };
}
