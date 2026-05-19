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
  const match = text.match(/(\d+)\s*(?:gun|gün|gece)/i);
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

function titleCaseLocation(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .map((part) => (part.length <= 2 ? part.toLocaleUpperCase("tr-TR") : part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1)))
    .join(" ")
    .replace(/\bDel\b/g, "del")
    .replace(/\bDe\b/g, "de")
    .replace(/\bDa\b/g, "da")
    .replace(/\bRio\b/g, "Rio");
}

function genericCityCandidate(title: string) {
  const cleaned = title
    .replace(/^\d+\.\s*g(?:u|ü)n\s*[:/]?\s*/i, "")
    .replace(/^[\s/:|—–-]+/, "")
    .replace(/\([^)]*\)/g, " ")
    .trim();
  const parts = cleaned
    .split(/\s*(?:—|–|->|➝|→|-|\||\/|&|\bve\b|\bile\b)\s*/i)
    .map((part) =>
      part
        .replace(/\b(varış|varis|dönüş|donus|uçuş|ucus|şehir turu|sehir turu|turu|transfer|serbest zaman|otel|kahvaltı|kahvalti|vadisi|vadisi|uçak|ucak|thy|saat).*$/i, "")
        .replace(/[^A-Za-zÇĞİÖŞÜçğıöşü'’.\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((part) => part.length >= 3 && part.length <= 40 && !/^(gun|gün|sabah|aksam|akşam|bugun|bugün|otelimizde|otel)$/i.test(part));
  const city = parts.findLast((part) => !/^istanbul$/i.test(part)) || parts[0];
  return city ? titleCaseLocation(city.replace(/[’]/g, "'")) : null;
}

export function inferCityCountry(title: string) {
  const cleaned = title
    .replace(/^\d+\.\s*g(?:u|ü)n\s*[:/]?\s*/i, "")
    .replace(/^[\s/:|—–-]+/, "")
    .replace(/şangay/gi, "Şanghay")
    .replace(/shangai/gi, "Şanghay")
    .replace(/shanghai/gi, "Şanghay")
    .trim();
  const knownCities = [
    "İSTANBUL",
    "ISTANBUL",
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
    "MELBOURNE",
    "HOBART",
    "SYDNEY",
    "AUCKLAND",
    "ROTORUA",
    "WAITOMO",
    "TAUPO",
    "HOBBITON",
    "PORT ARTHUR",
    "BLUE MOUNTAINS",
    "PHILIP ISLAND",
    "XI'AN",
    "XIAN",
    "XI’AN",
    "PEKİN",
    "PEKIN",
    "BEIJING",
    "ŞANGHAY",
    "SHANGHAI",
    "CHENGDU",
    "MUTIANYU",
    "HAVANA",
    "PINAR DEL RIO",
    "VINALES",
    "VIÑALES",
    "TRINIDAD",
    "SANTA CLARA",
    "VARADERO",
    "CIENFUEGOS"
  ];
  const hits = knownCities
    .flatMap((city) => {
      const escaped = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
      const match = cleaned.match(new RegExp(`\\b${escaped}\\b`, "i"));
      return match?.index == null ? [] : [{ city, index: match.index }];
    })
    .sort((a, b) => a.index - b.index)
    .map((hit) => hit.city);
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

  const cityMap: Record<string, string> = {
    SEOUL: "SEUL",
    XIAN: "XI'AN",
    "XI’AN": "XI'AN",
    PEKIN: "PEKİN",
    BEIJING: "PEKİN",
    SHANGHAI: "ŞANGHAY",
    MUTIANYU: "PEKİN",
    "VIÑALES": "VINALES"
  };
  city = city ? cityMap[city] || city : genericCityCandidate(cleaned);
  const target = city || cleaned;
  const country = /seul|seoul|busan|kore/i.test(target)
    ? "Güney Kore"
    : /tokyo|osaka|kyoto|nara|kobe|fuji|hakone|kamakura|japon/i.test(target)
      ? "Japonya"
      : /melbourne|hobart|sydney|port arthur|blue mountains|philip island|avustralya|tasmania|tazmanya/i.test(target)
        ? "Avustralya"
        : /auckland|rotorua|waitomo|taupo|hobbiton|yeni zelanda/i.test(target)
          ? "Yeni Zelanda"
          : /xi'?an|xian|pekin|beijing|şanghay|shanghai|chengdu|mutianyu|çin/i.test(target)
            ? "Çin"
            : /havana|pinar del rio|vinales|viñales|trinidad|santa clara|varadero|cienfuegos|kuba|küba|cuba/i.test(target)
              ? "Küba"
              : null;
  return { city, country };
}

export function parsePrice(text: string) {
  const match = text.replace(/\./g, "").match(/(\d+(?:,\d+)?)\s*(EUR|EURO|USD|TL|TRY|₺|\$|€)/i);
  if (!match) return null;
  const currencyMap: Record<string, string> = { EURO: "EUR", "€": "EUR", "₺": "TRY", TL: "TRY", "$": "USD" };
  const raw = match[1];
  const amount = /,\d{3}$/.test(raw) ? Number(raw.replace(",", "")) : Number(raw.replace(",", "."));
  return { amount, currency: currencyMap[match[2].toUpperCase()] || match[2].toUpperCase() };
}
