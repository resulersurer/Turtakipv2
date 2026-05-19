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
    icon: "Uçan ejderha",
    iconColor: "#7dd3fc"
  },
  ongoing: {
    label: "Şu an gezen turlar",
    count: "text-amber-200 bg-amber-500/15 border-amber-400/50",
    heading: "text-amber-200",
    card: "hover:border-amber-300 border-amber-400/45",
    icon: "Gezen ejderha",
    iconColor: "#fbbf24"
  },
  future: {
    label: "Gelecek turlar",
    count: "text-emerald-200 bg-emerald-500/15 border-emerald-400/50",
    heading: "text-emerald-200",
    card: "hover:border-emerald-300 border-emerald-400/45",
    icon: "Hazırlanan ejderha",
    iconColor: "#34d399"
  },
  past: {
    label: "Geçmiş turlar",
    count: "text-slate-200 bg-slate-500/15 border-slate-400/40",
    heading: "text-slate-300",
    card: "hover:border-slate-300 border-line",
    icon: "Dinlenen ejderha",
    iconColor: "#cbd5e1"
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

function DragonIcon({ color }: { color: string }) {
  return (
    <svg aria-hidden="true" className="h-8 w-8 shrink-0" viewBox="0 0 64 64" fill="none">
      <path d="M11 38c8-13 20-19 36-18l-5-8 11 5 4-9 2 15c-6 1-10 4-12 9 4 0 8 2 11 6-8 2-15 1-21-3-8 7-17 8-26 3Z" fill={color} opacity="0.96" />
      <path d="M19 40c6 8 16 10 28 6-5 7-13 9-23 6-6-2-11-6-13-14l8 2Z" fill={color} opacity="0.45" />
      <path d="M40 21c-7 0-15 5-22 14M45 31c-8-2-16 0-24 7" stroke="#ecfeff" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <circle cx="50" cy="21" r="2.4" fill="#0f172a" />
    </svg>
  );
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
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <span className="badge">{range}</span>
                          <h3 className="font-semibold">{tour.name}</h3>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-right text-xs font-semibold" style={{ color: group.iconColor }}>
                          <DragonIcon color={group.iconColor} />
                          <span>{group.icon}</span>
                        </div>
                      </div>
                      {meta ? <p className="mt-2 text-sm text-slate-400">{meta}</p> : null}
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <p className="text-slate-300">{tour.days.length} günlük rota, {tour.days.filter((day: any) => day.lat != null && day.lng != null).length} harita noktası</p>
                        <span className="text-xs font-semibold" style={{ color: group.iconColor }}>{relative}</span>
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
