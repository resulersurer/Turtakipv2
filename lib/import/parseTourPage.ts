import * as cheerio from "cheerio";
import { geocode } from "@/lib/geocode";
import { cleanImportedText } from "@/lib/display";
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
    if (/^(file|data):/i.test(url)) return null;
    return new URL(url, sourceUrl).toString();
  } catch {
    return null;
  }
}

function extractLabel(text: string, labels: string[]) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escaped}\\s*:?\\s*([^|\\n\\r]{2,220})`, "i"));
    if (match?.[1]) {
      return cleanImportedText(normalizeText(match[1])
        .replace(/\s*(Vize|Vize Durumu|Havayolu|Hava Yolu|Kalkış|Kalkis|Lütfen|Tura Katılmak|Tur Tarihleri|Fiyat|Program).*$/i, "")
        .trim());
    }
  }
  return null;
}

function inferAirline(title: string, text: string) {
  const source = `${title} ${text}`;
  if (/\b3U\b|Sichuan Airlines|SICHUAN AIRLINES/i.test(source)) return "SICHUAN AIRLINES";
  if (/\bTHY\b|\bTK\b|Türk Hava Yolları|Turkish Airlines/i.test(source)) return "TÜRK HAVA YOLLARI";
  if (/Qatar Airways|QATAR AIRWAYS/i.test(source)) return "QATAR AIRWAYS";
  if (/Pegasus/i.test(source)) return "PEGASUS";
  if (/Emirates/i.test(source)) return "EMIRATES";
  if (/AJet/i.test(source)) return "AJET";
  const extracted = extractLabel(text, ["Havayolu", "Hava Yolu", "Uçak", "Ucak"]);
  if (extracted && !/tarife|değişiklik|kosul|koşul|mücbir|mucbir|doğrultusunda/i.test(extracted)) return extracted;
  return null;
}

function inferVisa(text: string) {
  if (/vizesiz/i.test(text)) return "VİZESİZ";
  if (/çin vizesi|cin vizesi/i.test(text)) return "ÇİN VİZESİ";
  if (/avustralya vizesi/i.test(text) && /yeni zelanda/i.test(text)) return "AVUSTRALYA VİZESİ - YENİ ZELANDA";
  if (/avustralya vizesi/i.test(text)) return "AVUSTRALYA VİZESİ";
  const extracted = extractLabel(text, ["Vize Durumu", "Vize"]);
  if (extracted && extracted.length <= 80 && !/ücreti|ucreti|bahşiş|bahsis|yemek|dahil/i.test(extracted)) return extracted;
  return null;
}

function extractDays($: cheerio.CheerioAPI) {
  const bodyText = normalizeText($("body").text());
  const chunks = bodyText.split(/(?=\b\d{1,2}\.\s*G(?:Ü|U)N\b)/i).filter((chunk) => /^\d{1,2}\.\s*G(?:Ü|U)N/i.test(chunk));
  const days = chunks.map((chunk, index) => {
    const titleMatch = chunk.match(/^(\d{1,2})\.\s*G(?:Ü|U)N\s*[:/|-]?\s*([^\.]{0,160})/i);
    const dayNumber = titleMatch ? Number(titleMatch[1]) : index + 1;
    const title = normalizeText(titleMatch?.[2] || `${dayNumber}. Gün`).replace(/^[\s/:|-]+/, "");
    const { city, country } = inferCityCountry(title);
    const hotel = chunk.match(/(?:📌\s*)?Otel(?:imiz)?\s*:?\s*([^\.]{4,180})/i)?.[1];
    const flight = chunk.match(/(?:Uçuş Bilgisi|Uçuş Bilgileri|Ucus Bilgileri)\s*:?\s*([^\.]{4,220})/i)?.[1];
    return {
      dayNumber,
      title,
      dateOffset: dayNumber - 1,
      hour: chunk.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/)?.[0] || null,
      city,
      country,
      description: normalizeText(chunk.slice(0, 1600)),
      hotelInfo: normalizeText(hotel) || null,
      flightInfo: normalizeText(flight) || null,
      photoUrl: null,
      lat: null,
      lng: null,
      sortOrder: index
    };
  });

  return Array.from(
    days
      .reduce((best, day) => {
        const current = best.get(day.dayNumber);
        if (!current || (day.description || "").length > (current.description || "").length) best.set(day.dayNumber, day);
        return best;
      }, new Map<number, (typeof days)[number]>())
      .values()
  ).map((day, index) => ({ ...day, sortOrder: index }));
}

function extractDepartureDateTexts(pageText: string) {
  const lower = pageText.toLocaleLowerCase("tr-TR");
  const priceStartCandidates = ["Çift Kişilik Oda", "Cift Kisilik Oda", "Fiyat (Kişi Başı)", "Fiyat (Kisi Basi)", "Fiyatlar"];
  const priceStart = priceStartCandidates
    .map((label) => lower.indexOf(label.toLocaleLowerCase("tr-TR")))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  const programStart = lower.indexOf("tur programı");
  const dateArea = priceStart != null ? pageText.slice(priceStart, programStart > priceStart ? programStart : undefined) : pageText;
  const numericDates = dateArea.match(/\b\d{1,2}[./-]\d{1,2}[./-]20\d{2}\b/g) || [];
  if (numericDates.length) return numericDates;

  const selectorStart = lower.indexOf("lütfen tura katılmak istediğiniz tarihi seçiniz");
  if (selectorStart >= 0) {
    const selectorEnd = lower.indexOf("tur tarihi", selectorStart);
    const selectorText = pageText.slice(selectorStart, selectorEnd > selectorStart ? selectorEnd : undefined);
    return selectorText.match(/\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]+\s+20\d{2}/g) || [];
  }

  return pageText.match(/\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]+\s+20\d{2}/g) || [];
}

export async function parseTourHtml(html: string, sourceUrl: string): Promise<ParsedTour> {
  const $ = cheerio.load(html);
  const title = normalizeText($("h1").first().text()) || normalizeText($("title").text()).replace(/\|.*$/, "") || "İçe Aktarılan Tur";
  const pageText = normalizeText($("body").text());
  const parsed: ParsedTour = {
    ...makeParsedBase(sourceUrl, title),
    durationDays: inferDuration(`${title} ${pageText}`),
    departureCity: extractLabel(pageText, ["Kalkış", "Kalkis", "Kalkış Yeri", "Kalkış Şehri"]) || null,
    airline: inferAirline(title, pageText),
    visaStatus: inferVisa(pageText),
    coverImageUrl: null,
    departures: [] as ParsedTour["departures"],
    days: [] as ParsedTour["days"],
    images: [] as ParsedTour["images"],
    prices: [] as ParsedTour["prices"]
  };

  const metaImage =
    $("meta[property='og:image']").attr("content") ||
    $("meta[name='twitter:image']").attr("content") ||
    $("link[rel='image_src']").attr("href");
  const metaImageUrl = metaImage ? absolutize(metaImage, sourceUrl) : null;
  if (metaImageUrl) parsed.images.push({ url: metaImageUrl, alt: title, sortOrder: 0 });

  $("img").each((index, element) => {
    const src = $(element).attr("src") || $(element).attr("data-src");
    const url = src ? absolutize(src, sourceUrl) : null;
    const lower = url?.toLowerCase() || "";
    const looksLikeTourImage =
      url &&
      !/data:image|file:|logo|icon|sprite|loading|blank|whatsapp|facebook|instagram|layout|tursab|iata|develitema|thy_v|ckeditor\/image\/bu\.png/i.test(lower);
    if (looksLikeTourImage && !parsed.images.some((image) => image.url === url)) {
      parsed.images.push({ url, alt: normalizeText($(element).attr("alt")), sortOrder: index });
    }
  });
  parsed.coverImageUrl = parsed.images[0]?.url || null;

  const uniqueDates = Array.from(new Set(extractDepartureDateTexts(pageText)));
  parsed.departures = uniqueDates.map((raw) => {
    const startDate = parseTurkishDate(raw) || new Date();
    const endDate = parsed.durationDays ? new Date(startDate.getTime() + (parsed.durationDays - 1) * 86400000) : null;
    const nearbyPrice = parsePrice(pageText.slice(Math.max(0, pageText.indexOf(raw) - 120), pageText.indexOf(raw) + 260));
    return {
      startDate,
      endDate,
      label: raw,
      price: nearbyPrice?.amount || null,
      currency: nearbyPrice?.currency || "EUR",
      availabilityStatus: null
    };
  });
  parsed.departures = parsed.departures.filter((departure, index, all) => {
    const key = departure.startDate.toISOString().slice(0, 10);
    return all.findIndex((item) => item.startDate.toISOString().slice(0, 10) === key) === index;
  });

  const globalPrice = parsePrice(pageText);
  if (globalPrice && globalPrice.amount >= 100) {
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
