import cities from "cities.json";
import countries from "i18n-iso-countries";
import trLocale from "i18n-iso-countries/langs/tr.json";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(trLocale);
countries.registerLocale(enLocale);

type CityRecord = {
  name: string;
  lat: string;
  lng: string;
  country: string;
};

export type LocationMatch = {
  city: string;
  country: string | null;
  countryCode: string;
  lat: number;
  lng: number;
};

const cityRecords = cities as CityRecord[];

function normalize(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’`]/g, "'")
    .replace(/['‘][a-zçğıöşü]{1,8}\b/gi, "")
    .replace(/[^a-z0-9çğıöşü\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const cityIndex = cityRecords
  .map((city) => ({
    city,
    key: normalize(city.name)
  }))
  .filter((item) => item.key.length >= 3)
  .sort((a, b) => b.key.length - a.key.length);

function countryName(countryCode: string) {
  return countries.getName(countryCode, "tr") || countries.getName(countryCode, "en") || countryCode;
}

export function findCityInText(text: string): LocationMatch | null {
  const normalized = normalize(text);
  if (!normalized) return null;
  const hit = cityIndex.find(({ key }) => new RegExp(`(^|\\s)${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`, "i").test(normalized));
  if (!hit) return null;
  return {
    city: hit.city.name,
    country: countryName(hit.city.country),
    countryCode: hit.city.country,
    lat: Number(hit.city.lat),
    lng: Number(hit.city.lng)
  };
}
