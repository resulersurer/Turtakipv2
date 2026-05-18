import * as cheerio from "cheerio";
import { geocode } from "@/lib/geocode";
import { inferCityCountry, inferDuration, makeParsedBase, normalizeText, ParsedTour, parsePrice } from "./normalizeTour";

const dateMonths: Record<string, number> = {
  ocak: 0,
  şubat: 1,
  subat: 1,
  mart: 2,
  nisan: 3,
  mayıs: 4,
  mayis: 4,
  haziran: 5,
  temmuz: 6,
  ağustos: 7,
  agustos: 7,
  eylül: 8,
  eylul: 8,
  ekim: 9,
  kasım: 10,
  kasim: 10,
  aralık: 11,
  aralik: 11
};

function parseTurkishDate(raw: string) {
  const numeric = raw.match(/\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/);
  if (numeric) return new Date(Number(numeric[3]), Number(numeric[2]) - 1, Number(numeric[1]));
  const text = raw.toLocaleLowerCase("tr-TR");
  const match = text.match(/(\d{1,2})\s+([a-zçğıöşü]+)\s+(20\d{2})/i);
  if (!match) return null;
  const month = dateMonths[match[2].replace("ı", "i")] ?? dateMonths[match[2]];
  if (month == null) return null;
  return new Date(Number(match[3]), month, Number(match[1]));
}

function absolutize(url: string, sourceUrl: string) {
  try {
    return new URL(url, sourceUrl).toString();
  } catch {
    return null;
  }
}

function extractLabel(text: string, labels: string[]) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escaped}\\s*:?\\s*([^|\\n\\r]{2,80})`, "i"));
    if (match?.[1]) return normalizeText(match[1]).replace(/\s{2,}.*/, "");
  }
  return null;
}

function extractDays($: cheerio.CheerioAPI) {
  const bodyText = normalizeText($("body").text());
  const chunks = bodyText.split(/(?=\b\d{1,2}\.\s*G[ÜU]N\b)/i).filter((chunk) => /^\d{1,2}\.\s*G[ÜU]N/i.test(chunk));
  return chunks.map((chunk, index) => {
    const titleMatch = chunk.match(/^(\d{1,2})\.\s*G[ÜU]N\s*[:|-]?\s*([^\.]{0,120})/i);
    const dayNumber = titleMatch ? Number(titleMatch[1]) : index + 1;
    const title = normalizeText(titleMatch?.[2] || `${dayNumber}. Gün`);
    const { city, country } = inferCityCountry(title);
    const hotel = chunk.match(/(?:otel|konaklama)\s*:?\s*([^\.]{4,120})/i)?.[1];
    const flight = chunk.match(/(?:uçuş|ucus)\s*:?\s*([^\.]{4,120})/i)?.[1];
    return {
      dayNumber,
      title,
      dateOffset: dayNumber - 1,
      hour: chunk.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/)?.[0] || null,
      city,
      country,
      description: normalizeText(chunk.slice(0, 1200)),
      hotelInfo: normalizeText(hotel) || null,
      flightInfo: normalizeText(flight) || null,
      photoUrl: null,
      lat: null,
      lng: null,
      sortOrder: index
    };
  });
}

export async function parseTourHtml(html: string, sourceUrl: string): Promise<ParsedTour> {
  const $ = cheerio.load(html);
  const title = normalizeText($("h1").first().text()) || normalizeText($("title").text()).replace(/\|.*$/, "") || "İçe Aktarılan Tur";
  const pageText = normalizeText($("body").text());
  const parsed: ParsedTour = {
    ...makeParsedBase(sourceUrl, title),
    durationDays: inferDuration(`${title} ${pageText}`),
    departureCity: extractLabel(pageText, ["Kalkış", "Kalkis", "Kalkış Yeri", "Kalkış Şehri"]) || null,
    airline: extractLabel(pageText, ["Havayolu", "Hava Yolu", "Uçak", "Ucak"]) || (title.match(/\b(THY|TK|Pegasus|Emirates|Qatar|AJet)\b/i)?.[1] ?? null),
    visaStatus: extractLabel(pageText, ["Vize Durumu", "Vize"]) || null,
    coverImageUrl: null,
    departures: [] as ParsedTour["departures"],
    days: [] as ParsedTour["days"],
    images: [] as ParsedTour["images"],
    prices: [] as ParsedTour["prices"]
  };

  $("img").each((index, element) => {
    const src = $(element).attr("src") || $(element).attr("data-src");
    const url = src ? absolutize(src, sourceUrl) : null;
    const lower = url?.toLowerCase() || "";
    const looksLikeTourImage = url && !/logo|icon|sprite|loading|blank|whatsapp|facebook|instagram/.test(lower);
    if (looksLikeTourImage && !parsed.images.some((image) => image.url === url)) {
      parsed.images.push({ url, alt: normalizeText($(element).attr("alt")), sortOrder: index });
    }
  });
  parsed.coverImageUrl = parsed.images[0]?.url || null;

  const textualDates = pageText.match(/\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]+\s+20\d{2}/g) || [];
  const numericDates = pageText.match(/\b\d{1,2}[./-]\d{1,2}[./-]20\d{2}\b/g) || [];
  const dateMatches = [...textualDates, ...numericDates];
  const uniqueDates = Array.from(new Set(dateMatches));
  parsed.departures = uniqueDates.map((raw) => {
    const startDate = parseTurkishDate(raw) || new Date();
    const endDate = parsed.durationDays ? new Date(startDate.getTime() + (parsed.durationDays - 1) * 86400000) : null;
    const nearbyPrice = parsePrice(pageText.slice(Math.max(0, pageText.indexOf(raw) - 120), pageText.indexOf(raw) + 240));
    return {
      startDate,
      endDate,
      label: raw,
      price: nearbyPrice?.amount || null,
      currency: nearbyPrice?.currency || "EUR",
      availabilityStatus: null
    };
  });

  const globalPrice = parsePrice(pageText);
  if (globalPrice) {
    parsed.prices.push({ roomType: "İki Kişilik Odada Kişi Başı", adultPrice: globalPrice.amount, childPrice: null, currency: globalPrice.currency });
  }

  parsed.days = extractDays($);
  for (const day of parsed.days) {
    if (day.city && day.lat == null) {
      const [match] = await geocode(`${day.city} ${day.country || ""}`);
      if (match) {
        day.lat = match.lat;
        day.lng = match.lng;
      }
    }
  }

  if (!parsed.departures.length) parsed.warnings.push("Çıkış tarihi parse edilemedi.");
  if (!parsed.days.length) parsed.warnings.push("Gün programı 1. GÜN başlıklarından parse edilemedi.");
  if (!parsed.durationDays) parsed.warnings.push("Tur süresi otomatik bulunamadı.");

  return parsed;
}

export async function parseTourPage(sourceUrl: string) {
  const response = await fetch(sourceUrl, { headers: { "User-Agent": "ejder-tour-tracker-import/1.0" }, cache: "no-store" });
  if (!response.ok) throw new Error(`Sayfa alınamadı: ${response.status}`);
  return parseTourHtml(await response.text(), sourceUrl);
}
