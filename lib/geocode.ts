export type GeocodeResult = {
  label: string;
  lat: number;
  lng: number;
  country?: string;
  city?: string;
};

const localHints: Record<string, GeocodeResult> = {
  tokyo: { label: "Tokyo, Japan", lat: 35.6764, lng: 139.65, country: "Japonya", city: "Tokyo" },
  seoul: { label: "Seoul, South Korea", lat: 37.5665, lng: 126.978, country: "Güney Kore", city: "Seul" },
  seul: { label: "Seoul, South Korea", lat: 37.5665, lng: 126.978, country: "Güney Kore", city: "Seul" },
  osaka: { label: "Osaka, Japan", lat: 34.6937, lng: 135.5023, country: "Japonya", city: "Osaka" },
  istanbul: { label: "Istanbul, Türkiye", lat: 41.0082, lng: 28.9784, country: "Türkiye", city: "İstanbul" },
  kyoto: { label: "Kyoto, Japan", lat: 35.0116, lng: 135.7681, country: "Japonya", city: "Kyoto" },
  fuji: { label: "Mount Fuji, Japan", lat: 35.3606, lng: 138.7274, country: "Japonya", city: "Fuji" },
  hakone: { label: "Hakone, Japan", lat: 35.2324, lng: 139.1069, country: "Japonya", city: "Hakone" },
  nara: { label: "Nara, Japan", lat: 34.6851, lng: 135.8048, country: "Japonya", city: "Nara" },
  hiroshima: { label: "Hiroshima, Japan", lat: 34.3853, lng: 132.4553, country: "Japonya", city: "Hiroshima" },
  busan: { label: "Busan, South Korea", lat: 35.1796, lng: 129.0756, country: "Güney Kore", city: "Busan" },
  melbourne: { label: "Melbourne, Australia", lat: -37.8136, lng: 144.9631, country: "Avustralya", city: "Melbourne" },
  hobart: { label: "Hobart, Australia", lat: -42.8821, lng: 147.3272, country: "Avustralya", city: "Hobart" },
  sydney: { label: "Sydney, Australia", lat: -33.8688, lng: 151.2093, country: "Avustralya", city: "Sydney" },
  auckland: { label: "Auckland, New Zealand", lat: -36.8509, lng: 174.7645, country: "Yeni Zelanda", city: "Auckland" },
  rotorua: { label: "Rotorua, New Zealand", lat: -38.1368, lng: 176.2497, country: "Yeni Zelanda", city: "Rotorua" },
  waitomo: { label: "Waitomo, New Zealand", lat: -38.2608, lng: 175.1147, country: "Yeni Zelanda", city: "Waitomo" },
  taupo: { label: "Taupo, New Zealand", lat: -38.6857, lng: 176.0702, country: "Yeni Zelanda", city: "Taupo" },
  hobbiton: { label: "Hobbiton Movie Set, New Zealand", lat: -37.8722, lng: 175.6839, country: "Yeni Zelanda", city: "Hobbiton" },
  "port arthur": { label: "Port Arthur, Tasmania, Australia", lat: -43.1416, lng: 147.8507, country: "Avustralya", city: "Port Arthur" },
  "blue mountains": { label: "Blue Mountains, Australia", lat: -33.4098, lng: 150.3031, country: "Avustralya", city: "Blue Mountains" },
  "philip island": { label: "Phillip Island, Australia", lat: -38.4899, lng: 145.232, country: "Avustralya", city: "Philip Island" }
};

export async function geocode(query: string): Promise<GeocodeResult[]> {
  const key = query.trim().toLocaleLowerCase("tr-TR").replace("ı", "i");
  const hint = Object.keys(localHints).find((name) => key.includes(name));
  if (hint) return [localHints[hint]];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  const res = await fetch(url, {
    headers: { "User-Agent": process.env.GEOCODE_USER_AGENT || "ejder-tour-tracker/1.0" },
    next: { revalidate: 60 * 60 * 24 * 7 }
  });
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return data.map((item) => ({ label: item.display_name, lat: Number(item.lat), lng: Number(item.lon) }));
}
