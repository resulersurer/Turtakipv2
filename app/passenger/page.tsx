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
    <main className="page-shell space-y-8">

      {/* ═══════════════════════════════════════════════
          KURUMSAL HEADER
      ═══════════════════════════════════════════════ */}
      <section className="relative -mx-4 -mt-6 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4a1515] via-[#3b1111] to-[#2a0b0b]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-mint/40 to-transparent" />
        <div className="relative px-6 py-5 sm:px-10 sm:py-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <img src="/logo.png" alt="Ejder Turizm" className="h-16 w-auto sm:h-20 lg:h-24" />
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-block h-1 w-1 rounded-full bg-mint shadow-[0_0_6px_rgba(68,215,182,0.9)]" />
                <p className="text-xs font-medium uppercase tracking-widest text-white/60">Yolcu Takip Sistemi</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://www.ejderturizm.com.tr/"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur transition-all duration-200 hover:border-white/40 hover:bg-white/20"
              >
                <svg className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Anasayfa
              </a>
              <Link
                href="/tours"
                className="inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white px-4 py-2.5 text-sm font-semibold text-ink backdrop-blur transition-all duration-200 hover:bg-white/90"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Tur Listesi
              </Link>
            </div>
          </div>

          {/* Arama alanı */}
          <form className="mt-5 flex flex-col gap-3 sm:flex-row" action="/passenger">
            <div className="relative min-w-0 flex-1">
              <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full rounded-lg border border-white/15 bg-black/30 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/50 outline-none backdrop-blur transition-all duration-200 focus:border-white/40 focus:bg-black/40 focus:ring-2 focus:ring-white/10"
                name="q"
                defaultValue={q || ""}
                placeholder="Tur adı, şehir, ülke veya havayolu ara…"
              />
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-mint px-7 py-3 text-sm font-semibold text-ink shadow-lg shadow-mint/20 transition-all duration-200 hover:bg-mint/90 hover:shadow-mint/30"
              type="submit"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Ara
            </button>
            {q ? (
              <Link
                href="/passenger"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white/80 backdrop-blur transition-all duration-200 hover:border-white/40 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Temizle
              </Link>
            ) : null}
          </form>
        </div>
      </section>

      {/* Harita */}
      <section className="overflow-hidden border-y border-white/8 shadow-2xl -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="h-[300px] sm:h-[360px] lg:h-[420px]">
          <PublicMap days={weeklyCountryMarkers} showRoute={false} layer="light" />
        </div>
      </section>

      {/* Arama sonucu bulunamadı */}
      {q && !hasResults ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-10 text-center backdrop-blur">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/60">
            <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-base font-semibold text-white">Aramanıza uygun tur bulunamadı</h2>
          <p className="mt-2 text-sm text-slate-500">Farklı bir tur adı, şehir, ülke veya havayolu deneyebilirsiniz.</p>
        </div>
      ) : null}

      {/* ═══════════════════════════════════════════════
          TUR GRUPLARI & KARTLAR
      ═══════════════════════════════════════════════ */}
      {groups.map((group) => (
        <section className="space-y-4" key={group.key}>
          {/* Grup başlığı */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80">
                <img src={group.iconSrc} alt="" className="h-4 w-4 object-contain" />
              </div>
              <h2 className={`text-lg font-bold tracking-tight ${group.heading}`}>{group.label}</h2>
            </div>
            <div className="flex-1 border-t border-white/6" />
            <span className={`rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${group.count}`}>
              {group.items.length} tur
            </span>
          </div>

          {group.items.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map(({ tour, departure, relative, range }) => {
                const otherMeta = compactTourMeta([tour.durationDays ? `${tour.durationDays} gün` : null, tour.departureCity]);
                const mapPoints = tour.days.filter((day: any) => day.lat != null && day.lng != null).length;
                return (
                  <Link
                    className={`group relative block overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_32px_64px_rgba(0,0,0,0.5)] ${group.card}`}
                    href={`/passenger/${tour.id}?departureId=${departure.id}`}
                    key={`${tour.id}-${departure.id}`}
                    style={{ aspectRatio: "3/4" }}
                  >
                    {/* ── ARKA PLAN GÖRSELI (tam kaplama) ── */}
                    <div className="absolute inset-0">
                      {tour.coverImageUrl ? (
                        <>
                          <img
                            src={tour.coverImageUrl}
                            alt={tour.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                          />
                          {/* Renk tonu overlay */}
                          <div className="absolute inset-0 bg-slate-950/40" />
                        </>
                      ) : (
                        <div
                          className="h-full w-full"
                          style={{
                            background: `radial-gradient(ellipse at 30% 20%, ${group.color}22 0%, transparent 60%), linear-gradient(160deg, #0d1f2d 0%, #071016 100%)`
                          }}
                        >
                          {/* Dekoratif şekil */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <svg viewBox="0 0 100 100" className="h-48 w-48" fill="currentColor" style={{ color: group.color }}>
                              <circle cx="50" cy="50" r="40" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── ÜST ROW: status badge + tarih ── */}
                    <div className="absolute left-0 right-0 top-0 z-10 flex items-start justify-between p-4">
                      {/* Status ikonu */}
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/50 shadow-lg backdrop-blur-md">
                        <img src={group.iconSrc} alt="" className="h-5 w-5 object-contain" />
                      </span>
                      {/* Tarih aralığı */}
                      <span className="rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                        {range}
                      </span>
                    </div>

                    {/* ── ALT GRADIENT (metin alanı) ── */}
                    <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-5 pb-5 pt-20">
                      {/* Relative zaman */}
                      <span
                        className="mb-2.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide"
                        style={{ color: group.color, backgroundColor: `${group.color}20`, border: `1px solid ${group.color}35` }}
                      >
                        {relative}
                      </span>

                      {/* Tur adı */}
                      <h3 className="text-lg font-bold leading-snug text-white drop-shadow-lg transition-colors duration-200 group-hover:text-white">
                        {tour.name}
                      </h3>

                      {/* Havayolu badge */}
                      {tour.airline ? (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-black/40 px-2.5 py-1 backdrop-blur-sm">
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: group.color, opacity: 0.85 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          <span className="text-xs font-semibold tracking-wide" style={{ color: group.color }}>{tour.airline}</span>
                        </div>
                      ) : null}

                      {/* Diğer meta (süre + şehir) */}
                      {otherMeta ? (
                        <p className="mt-1.5 text-xs text-white/45 leading-relaxed">
                          {otherMeta}
                        </p>
                      ) : null}

                      {/* Alt istatistik çubuğu */}
                      <div className="mt-4 flex items-center gap-4 border-t border-white/10 pt-3.5">
                        <span className="flex items-center gap-1.5 text-xs text-white/50">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {tour.days.length} gün
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-white/50">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {mapPoints} nokta
                        </span>
                        {/* Sağda ok ikonu */}
                        <span className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-sm transition-all duration-200 group-hover:border-white/30 group-hover:bg-white/20">
                          <svg className="h-3.5 w-3.5 text-white transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>

                    {/* ── HOVER GLOW BORDER ── */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ boxShadow: `inset 0 0 0 1.5px ${group.color}50` }}
                    />
                  </Link>
                );
              })}
            </div>
          ) : !q ? (
            <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-6 text-sm text-slate-500 backdrop-blur">
              Bu bölümde tur çıkışı bulunmuyor.
            </div>
          ) : null}
        </section>
      ))}
    </main>
  );
}
