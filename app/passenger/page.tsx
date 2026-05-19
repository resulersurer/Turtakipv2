import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializeTour, tourInclude } from "@/lib/tours";
import { PublicMap } from "@/components/maps/PublicMap";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { isPrismaSetupError } from "@/lib/db-errors";
import { classifyDeparture, departureRelativeLabel, formatDepartureRange } from "@/lib/departure-status";
import { compactTourMeta } from "@/lib/display";

export const dynamic = "force-dynamic";

const countryCenters: Record<string, { lat: number; lng: number; label: string }> = {
  japonya: { lat: 36.2048, lng: 138.2529, label: "Japonya" },
  "güney kore": { lat: 36.5, lng: 127.9, label: "Güney Kore" },
  avustralya: { lat: -25.2744, lng: 133.7751, label: "Avustralya" },
  "yeni zelanda": { lat: -40.9006, lng: 174.886, label: "Yeni Zelanda" },
  çin: { lat: 35.8617, lng: 104.1954, label: "Çin" },
  küba: { lat: 21.5218, lng: -77.7812, label: "Küba" },
  türkiye: { lat: 39.0, lng: 35.0, label: "Türkiye" }
};

function dayKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dayNumber(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86400000;
}

export default async function PassengerPage() {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  let tours: any[];
  try {
    tours = serializeTour(await prisma.tour.findMany({ where: { status: "PUBLISHED" }, include: tourInclude, orderBy: { updatedAt: "desc" } })) as any[];
  } catch (error) {
    if (isPrismaSetupError(error)) return <SetupNotice />;
    throw error;
  }

  const today = dayNumber(dayKey(new Date()));
  const countriesThisWeek = new Map<string, { country: string; lat: number; lng: number; tourNames: Set<string> }>();
  for (const tour of tours) {
    for (const departure of tour.departures) {
      for (const day of tour.days) {
        if (!day.country) continue;
        const date = new Date(departure.startDate);
        date.setDate(date.getDate() + (day.dateOffset ?? day.dayNumber - 1));
        const diff = dayNumber(dayKey(date)) - today;
        if (diff >= 0 && diff <= 7) {
          const key = day.country.toLocaleLowerCase("tr-TR");
          const fallback = countryCenters[key];
          const lat = day.lat ?? fallback?.lat;
          const lng = day.lng ?? fallback?.lng;
          if (lat == null || lng == null) continue;
          const current = countriesThisWeek.get(key) || { country: fallback?.label || day.country, lat, lng, tourNames: new Set<string>() };
          current.tourNames.add(tour.name);
          countriesThisWeek.set(key, current);
        }
      }
    }
  }
  const weeklyCountryMarkers = Array.from(countriesThisWeek.values()).map((country, index) => ({
    id: country.country,
    dayNumber: index + 1,
    title: `${country.country} • ${country.tourNames.size} tur`,
    city: country.country,
    country: country.country,
    lat: country.lat,
    lng: country.lng,
    highlightPulse: true
  }));
  const departures = tours.flatMap((tour) =>
    tour.departures.map((departure: any) => ({
      tour,
      departure,
      status: classifyDeparture(departure),
      relative: departureRelativeLabel(departure),
      range: formatDepartureRange(departure)
    }))
  );
  const groups = [
    { key: "today", label: "Bugün çıkışlı turlar" },
    { key: "ongoing", label: "Devam eden turlar" },
    { key: "future", label: "Gelecek turlar" },
    { key: "past", label: "Geçmiş turlar" }
  ].map((group) => ({ ...group, items: departures.filter((item) => item.status === group.key) }));

  return (
    <main className="page-shell space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Yolcu tur takip</h1>
          <p className="text-slate-400">Yayındaki turların rota ve timeline görünümü.</p>
        </div>
        <Link className="btn" href="/tours">Tur listesi</Link>
      </header>
      <section className="panel rounded-lg p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-slate-300">
          <span>Önümüzdeki 1 hafta içinde gidilecek ülkeler haritada yanıp söner.</span>
          {countriesThisWeek.size ? <span className="text-mint">{Array.from(countriesThisWeek.values()).map((country) => country.country).join(", ")}</span> : <span className="text-slate-500">Bu hafta rota ülkesi yok</span>}
        </div>
        <div className="h-[460px]"><PublicMap days={weeklyCountryMarkers} showRoute={false} layer="light" /></div>
      </section>
      {groups.map((group) => (
        <section className="space-y-3" key={group.key}>
          <h2 className="text-lg font-semibold">{group.label}</h2>
          {group.items.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map(({ tour, departure, relative, range }) => {
                const meta = compactTourMeta([tour.durationDays ? `${tour.durationDays} gün` : null, tour.departureCity, tour.airline]);
                return (
                  <Link className="panel overflow-hidden rounded-lg transition hover:border-mint" href={`/passenger/${tour.id}?departureId=${departure.id}`} key={`${tour.id}-${departure.id}`}>
                    {tour.coverImageUrl ? <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${tour.coverImageUrl})` }} /> : <div className="h-2 bg-mint" />}
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="badge">{range}</span>
                        <span className="text-xs text-mint">{relative}</span>
                      </div>
                      <h3 className="mt-3 font-semibold">{tour.name}</h3>
                      {meta ? <p className="mt-1 text-sm text-slate-400">{meta}</p> : null}
                      <p className="mt-2 text-sm text-slate-300">{tour.days.length} günlük rota, {tour.days.filter((day: any) => day.lat != null && day.lng != null).length} harita noktası</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="panel rounded-lg p-5 text-sm text-slate-400">Bu bölümde tur çıkışı yok.</div>
          )}
        </section>
      ))}
    </main>
  );
}
