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
    color: "#7dd3fc",
    iconSrc: "/icons/tour-status/today.svg"
  },
  ongoing: {
    label: "Devam eden turlar",
    count: "text-amber-200 bg-amber-500/15 border-amber-400/50",
    heading: "text-amber-200",
    card: "hover:border-amber-300 border-amber-400/45",
    color: "#fbbf24",
    iconSrc: "/icons/tour-status/ongoing.svg"
  },
  future: {
    label: "Gelecek turlar",
    count: "text-emerald-200 bg-emerald-500/15 border-emerald-400/50",
    heading: "text-emerald-200",
    card: "hover:border-emerald-300 border-emerald-400/45",
    color: "#34d399",
    iconSrc: "/icons/tour-status/future.svg"
  },
  past: {
    label: "Geçmiş turlar",
    count: "text-slate-200 bg-slate-500/15 border-slate-400/40",
    heading: "text-slate-300",
    card: "hover:border-slate-300 border-line",
    color: "#cbd5e1",
    iconSrc: "/icons/tour-status/past.svg"
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

function departureSortValue(item: { status: StatusKey; departure: { startDate: string | Date; endDate?: string | Date | null } }) {
  const start = new Date(item.departure.startDate).getTime();
  const end = new Date(item.departure.endDate || item.departure.startDate).getTime();
  if (item.status === "past") return -end;
  return item.status === "ongoing" ? end : start;
}

function tourSearchText(tour: any) {
  return [
    tour.name,
    tour.departureCity,
    tour.airline,
    tour.visaStatus,
    ...tour.days.flatMap((day: any) => [day.title, day.city, day.country, day.description])
  ].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
}

export default async function PassengerPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  const params = await searchParams;
  let tours: any[];
  try {
    tours = serializeTour(await prisma.tour.findMany({ where: { status: "PUBLISHED" }, include: tourInclude, orderBy: { updatedAt: "desc" } })) as any[];
  } catch (error) {
    if (isPrismaSetupError(error)) return <SetupNotice />;
    throw error;
  }

  const q = params.q?.trim();
  const normalizedQuery = q?.toLocaleLowerCase("tr-TR");
  const visibleTours = normalizedQuery ? tours.filter((tour) => tourSearchText(tour).includes(normalizedQuery)) : tours;
  const today = dayNumber(dayKey(new Date()));
  const countriesThisWeek = new Map<string, { country: string; lat: number; lng: number; tourNames: Set<string> }>();

  for (const tour of visibleTours) {
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
  const departures = visibleTours.flatMap((tour) =>
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
    items: departures.filter((item) => item.status === key).sort((a, b) => departureSortValue(a) - departureSortValue(b))
  }));
  const hasResults = groups.some((group) => group.items.length > 0);

  return (
    <main className="page-shell space-y-6">
      <section className="rounded-lg border border-line bg-[#f7fafc] p-4 text-slate-900 shadow-xl sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-mint">Ejder Turizm yolcu takip</p>
            <h1 className="mt-2 max-w-5xl text-3xl font-black leading-tight tracking-normal sm:text-4xl xl:text-5xl">
              Bu hafta dünyayı keşfediyoruz
            </h1>
            <p className="mt-3 max-w-6xl text-sm font-bold uppercase leading-6 tracking-normal text-slate-600 sm:text-base">
              {weeklyCountries.length ? `${weeklyCountries.map((country) => country.country).join(", ")} · ${weeklyCountries.length} ülke` : "Bu hafta rota ülkesi yok"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <a className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100" href="https://www.ejderturizm.com.tr/">
              Anasayfa
            </a>
            <Link className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100" href="/tours">Tur listesi</Link>
          </div>
        </div>
        <form className="mt-5 flex flex-col gap-2 sm:flex-row" action="/passenger">
          <input className="input min-w-0 flex-1 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400" name="q" defaultValue={q || ""} placeholder="Tur, şehir, ülke veya havayolu ara" />
          <button className="btn-primary rounded-md px-6" type="submit">Ara</button>
          {q ? <Link className="rounded-md border border-slate-300 bg-white px-4 py-3 text-center text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100" href="/passenger">Temizle</Link> : null}
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="h-[300px] sm:h-[360px] lg:h-[420px]">
          <PublicMap days={weeklyCountryMarkers} showRoute={false} layer="light" />
        </div>
      </section>

      {q && !hasResults ? (
        <div className="panel rounded-lg p-8 text-center">
          <h2 className="text-lg font-semibold text-white">Aramanıza uygun tur bulunamadı</h2>
          <p className="mt-2 text-sm text-slate-400">Farklı bir tur adı, şehir, ülke veya havayolu deneyebilirsiniz.</p>
        </div>
      ) : null}

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
                  <Link className={`panel group overflow-hidden rounded-lg border transition hover:-translate-y-0.5 ${group.card}`} href={`/passenger/${tour.id}?departureId=${departure.id}`} key={`${tour.id}-${departure.id}`}>
                    <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-slate-950">
                      {tour.coverImageUrl ? <img src={tour.coverImageUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-xl" /> : null}
                      {tour.coverImageUrl ? <img src={tour.coverImageUrl} alt={tour.name} className="relative z-10 h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]" /> : <div className="h-full w-full bg-gradient-to-br from-emerald-500/20 via-slate-900 to-sky-500/20" />}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/85 to-transparent" />
                    </div>
                    <div className="relative space-y-4 p-5 pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="badge">{range}</span>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-950/55 p-1 shadow-lg">
                          <img src={group.iconSrc} alt="" className="h-full w-full object-contain opacity-90" />
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold leading-snug text-white">{tour.name}</h3>
                        {meta ? <p className="mt-2 text-sm text-slate-400">{meta}</p> : null}
                      </div>
                      <div className="flex items-end justify-between gap-3 text-sm">
                        <p className="text-slate-300">{tour.days.length} günlük rota, {tour.days.filter((day: any) => day.lat != null && day.lng != null).length} harita noktası</p>
                        <span className="shrink-0 text-right text-xs font-semibold" style={{ color: group.color }}>{relative}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : !q ? (
            <div className="panel rounded-lg p-5 text-sm text-slate-400">Bu bölümde tur çıkışı yok.</div>
          ) : null}
        </section>
      ))}
    </main>
  );
}
