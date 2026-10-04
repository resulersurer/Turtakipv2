import cities from "cities.json";
import countries from "i18n-iso-countries";
import trLocale from "i18n-iso-countries/langs/tr.json";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(trLocale);
countries.registerLocale(enLocale);

const aliases: Record<string, string> = {
  "bae": "AE", "birlesik arap emirlikleri": "AE", "uae": "AE",
  "guney kore": "KR", "kuzey kore": "KP", "ingiltere": "GB",
  "abd": "US", "amerika": "US", "amerika birlesik devletleri": "US",
};
const locations: Record<string, { lat: number; lng: number }> = {
  JP: { lat: 36.2048, lng: 138.2529 },
  KR: { lat: 36.5, lng: 127.9 },
  AU: { lat: -25.2744, lng: 133.7751 },
  NZ: { lat: -40.9006, lng: 174.886 },
  CN: { lat: 35.8617, lng: 104.1954 },
  CU: { lat: 21.5218, lng: -77.7812 },
  TR: { lat: 39, lng: 35 },
  AE: { lat: 24.4539, lng: 54.3773 },
};

// For other countries, use a known city within that country, never a tour day's unverified coordinates.
for (const city of cities) {
  if (!locations[city.country]) {
    const lat = Number(city.lat);
    const lng = Number(city.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      locations[city.country] = { lat, lng };
    }
  }
}
const nameIndex = new Map<string, string>();
function normalize(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/\s+/g, " ");
}
for (const locale of ["tr", "en"]) {
  for (const [code, names] of Object.entries(countries.getNames(locale, { select: "all" }))) {
    for (const name of names) nameIndex.set(normalize(name), code);
  }
}

export function countryMapLocation(name: string) {
  const normalized = normalize(name);
  const upper = name.trim().toUpperCase();
  const code = aliases[normalized] || nameIndex.get(normalized)
    || (countries.isValid(upper) ? countries.toAlpha2(upper) : undefined);
  if (!code || !locations[code]) return null;
  return { code, label: countries.getName(code, "tr") || name.trim(), ...locations[code] };
}
