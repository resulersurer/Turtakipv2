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

const statusUi = {
  today: {
    label: "Bugün çıkışlı turlar",
    count: "text-sky-200 bg-sky-500/15 border-sky-400/50",
    heading: "text-sky-200",
    card: "hover:border-sky-300 border-sky-400/50",
    color: "#7dd3fc"
  },
  ongoing: {
    label: "Şu an gezen turlar",
    count: "text-amber-200 bg-amber-500/15 border-amber-400/50",
    heading: "text-amber-200",
    card: "hover:border-amber-300 border-amber-400/45",
    color: "#fbbf24"
  },
  future: {
    label: "Gelecek turlar",
    count: "text-emerald-200 bg-emerald-500/15 border-emerald-400/50",
    heading: "text-emerald-200",
    card: "hover:border-emerald-300 border-emerald-400/45",
    color: "#34d399"
  },
  past: {
    label: "Geçmiş turlar",
    count: "text-slate-200 bg-slate-500/15 border-slate-400/40",
    heading: "text-slate-300",
    card: "hover:border-slate-300 border-line",
    color: "#cbd5e1"
  }
} as const;

type StatusKey = keyof typeof statusUi;

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

  const weeklyCountries = Array.from(countriesThisWeek.values());
  const weeklyCountryMarkers = weeklyCountries.map((country, index) => ({
    id: country.country,
    dayNumber: index + 1,
    title: `${country.country} • ${country.tourNames.size} tur`,
    city: country.country,
    country: country.country,
    lat: country.lat,
    lng: country.lng,
    highlightPulse: true,
    markerStyle: "pin" as const
  }));
  const departures = tours.flatMap((tour) =>
    tour.departures.map((departure: any) => ({
      tour,
      departure,
      status: classifyDeparture(departure) as StatusKey,
      relative: departureRelativeLabel(departure),
      range: formatDepartureRange(departure)
    }))
  );
  const groups = (Object.keys(statusUi) as StatusKey[]).map((key) => ({
    key,
    ...statusUi[key],
    items: departures.filter((item) => item.status === key)
  }));

  return (
    <main className="page-shell space-y-6">
      <header className="flex items-center justify-end gap-3">
        <Link className="btn" href="/tours">Tur listesi</Link>
      </header>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="relative z-[500] -mb-24 px-4 pt-4 text-center text-slate-800 sm:px-8">
          <h1 className="text-2xl font-black tracking-normal sm:text-4xl">EjderTurizmle bu hafta dünyayı geziyoruz...</h1>
          <p className="mt-3 text-sm font-bold uppercase tracking-normal text-slate-600 sm:text-base">
            {weeklyCountries.length ? `${weeklyCountries.map((country) => country.country).join(", ")} · ${weeklyCountries.length} ülke` : "Bu hafta rota ülkesi yok"}
          </p>
        </div>
        <div className="h-[380px]"><PublicMap days={weeklyCountryMarkers} showRoute={false} layer="light" /></div>
      </section>
      {groups.map((group) => (
        <section className="space-y-3" key={group.key}>
          <div className="flex items-center justify-between gap-3">
            <h2 className={`text-xl font-semibold ${group.heading}`}>{group.label}</h2>
            <span className={`rounded-full border px-3 py-1 text-sm font-bold ${group.count}`}>{group.items.length} tur</span>
          </div>
          {group.items.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map(({ tour, departure, relative, range }) => {
                const meta = compactTourMeta([tour.durationDays ? `${tour.durationDays} gün` : null, tour.departureCity, tour.airline]);
                return (
                  <Link className={`panel overflow-hidden rounded-lg border transition ${group.card}`} href={`/passenger/${tour.id}?departureId=${departure.id}`} key={`${tour.id}-${departure.id}`}>
                    {tour.coverImageUrl ? <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${tour.coverImageUrl})` }} /> : <div className="h-2 bg-mint" />}
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="badge">{range}</span>
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color, boxShadow: `0 0 14px ${group.color}` }} />
                      </div>
                      <h3 className="mt-3 font-semibold">{tour.name}</h3>
                      {meta ? <p className="mt-2 text-sm text-slate-400">{meta}</p> : null}
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <p className="text-slate-300">{tour.days.length} günlük rota, {tour.days.filter((day: any) => day.lat != null && day.lng != null).length} harita noktası</p>
                        <span className="text-xs font-semibold" style={{ color: group.color }}>{relative}</span>
                      </div>
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
