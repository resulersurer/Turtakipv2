import { prisma } from "@/lib/prisma";
import { serializeTour, tourInclude } from "@/lib/tours";
import Link from "next/link";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { isPrismaSetupError } from "@/lib/db-errors";
import { compactTourMeta } from "@/lib/display";
import { classifyDeparture, departureRelativeLabel, formatDepartureRange } from "@/lib/departure-status";

export const dynamic = "force-dynamic";

const statusUi = {
  "Devam eden": {
    label: "Devam eden turlar",
    count: "text-amber-900 bg-amber-200 border-amber-300 shadow-sm",
    heading: "text-[#7f1d1d]",
    card: "hover:border-amber-300 border-amber-400/45",
    color: "#fbbf24",
    iconSrc: "/icons/tour-status/ongoing.svg"
  },
  Gelecek: {
    label: "Gelecek turlar",
    count: "text-emerald-900 bg-emerald-200 border-emerald-300 shadow-sm",
    heading: "text-[#7f1d1d]",
    card: "hover:border-emerald-300 border-emerald-400/45",
    color: "#34d399",
    iconSrc: "/icons/tour-status/future.svg"
  },
  Geçmiş: {
    label: "Geçmiş turlar",
    count: "text-slate-800 bg-slate-200 border-slate-300 shadow-sm",
    heading: "text-[#7f1d1d]",
    card: "hover:border-slate-300 border-slate-300",
    color: "#cbd5e1",
    iconSrc: "/icons/tour-status/past.svg"
  }
} as const;

function classify(tour: any) {
  const now = new Date();
  let hasFuture = false;
  for (const departure of tour.departures) {
    const status = classifyDeparture(departure, now);
    if (status === "today" || status === "ongoing") return "Devam eden";
    if (status === "future") hasFuture = true;
  }
  return hasFuture ? "Gelecek" : "Geçmiş";
}

function tourSortValue(tour: any) {
  const now = new Date();
  const ranges = tour.departures.map((departure: any) => ({
    start: new Date(departure.startDate).getTime(),
    end: new Date(departure.endDate || departure.startDate).getTime(),
    status: classifyDeparture(departure, now)
  }));
  const activeEnd = ranges
    .filter((range: any) => (range.status === "today" || range.status === "ongoing") && range.start <= now.getTime() && range.end >= now.getTime())
    .map((range: any) => range.end)
    .sort((a: number, b: number) => a - b)[0];
  if (activeEnd != null) return activeEnd;
  const nextStart = ranges
    .filter((range: any) => range.status === "future" && range.start > now.getTime())
    .map((range: any) => range.start)
    .sort((a: number, b: number) => a - b)[0];
  if (nextStart != null) return nextStart;
  const lastEnd = ranges.map((range: any) => range.end).sort((a: number, b: number) => b - a)[0];
  return -(lastEnd || 0);
}

export default async function PublicToursPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  const params = await searchParams;
  let tours: any[];
  try {
    tours = serializeTour(await prisma.tour.findMany({ where: { status: "PUBLISHED" }, include: tourInclude, orderBy: { updatedAt: "desc" } })) as any[];
  } catch (error) {
    if (isPrismaSetupError(error)) return <SetupNotice />;
    throw error;
  }
  const q = params.q?.toLocaleLowerCase("tr-TR");
  const filtered = q ? tours.filter((tour) => `${tour.name} ${tour.days.map((day: any) => day.city).join(" ")}`.toLocaleLowerCase("tr-TR").includes(q)) : tours;
  const groups = (Object.keys(statusUi) as Array<keyof typeof statusUi>).map((key) => ({
    key,
    ...statusUi[key],
    tours: filtered.filter((tour) => classify(tour) === key).sort((a, b) => tourSortValue(a) - tourSortValue(b))
  }));
  const hasResults = groups.some((group) => group.tours.length > 0);

  return (
    <main className="page-shell">
      <section className="relative -mx-4 -mt-6 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 overflow-hidden border-b border-slate-200 bg-white shadow-sm">
        <div className="relative px-6 py-5 sm:px-10 sm:py-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="shrink-0 text-center sm:text-left">
              <img src="/logo.png" alt="Ejder Turizm" className="h-16 w-auto sm:h-20 lg:h-24" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-lg font-extrabold leading-tight tracking-tight text-[#7f1d1d] sm:text-xl">
                    Turlarımızı{" "}
                    <span className="bg-gradient-to-r from-[#7f1d1d] via-[#991b1b] to-[#b91c1c] bg-clip-text text-transparent">
                      Keşfedin
                    </span>
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">Program, çıkış tarihleri ve detaylı bilgiler.</p>
                </div>
                <nav className="flex items-center gap-1 rounded-xl border border-[#7f1d1d]/15 bg-[#7f1d1d]/5 p-1">
                  <a
                    href="https://www.ejderturizm.com.tr/"
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#7f1d1d] transition-all duration-200 hover:bg-white hover:shadow-sm"
                  >
                    <svg className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    Anasayfa
                  </a>
                  <Link
                    href="/passenger"
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#7f1d1d] transition-all duration-200 hover:bg-white hover:shadow-sm"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Yolcu Takip
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-b border-slate-200 bg-[#f5f5f7] shadow-sm -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="px-6 py-5 sm:px-10 sm:py-6">
          <form>
            <input
              className="input w-full md:w-96"
              name="q"
              defaultValue={params.q}
              placeholder="Tur veya şehir ara"
            />
          </form>
        </div>
      </section>

      {q && !hasResults ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-10 text-center backdrop-blur">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/60">
            <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-base font-semibold text-white">Aramanıza uygun tur bulunamadı</h2>
          <p className="mt-2 text-sm text-slate-500">Farklı bir tur adı, şehir, ülke veya havayolu deneyebilirsiniz.</p>
        </div>
      ) : null}

      <div className="mt-8 space-y-8">
        {groups.map((group) => (
          <section className="space-y-4" key={group.key}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#7f1d1d]/20 bg-gradient-to-br from-[#7f1d1d]/10 to-[#7f1d1d]/5 shadow-sm">
                  <img src={group.iconSrc} alt="" className="h-5 w-5 object-contain drop-shadow-sm" />
                </div>
                <h2 className={`text-lg font-bold tracking-tight ${group.heading}`}>{group.label}</h2>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-[#7f1d1d]/40 via-[#7f1d1d]/15 to-transparent" />
              <span className={`rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${group.count}`}>
                {group.tours.length} tur
              </span>
            </div>

            {group.tours.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {group.tours.map((tour) => {
                  const departure = (tour.departures || []).sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
                  const otherMeta = compactTourMeta([tour.durationDays ? `${tour.durationDays} gün` : null, tour.departureCity]);
                  const mapPoints = tour.days.filter((day: any) => day.lat != null && day.lng != null).length;
                  return (
                    <Link
                      className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#7f1d1d]/10 hover:border-[#7f1d1d]/30"
                      href={`/tour/${tour.slug}`}
                      key={tour.id}
                      style={{ aspectRatio: "3/4" }}
                    >
                      <div className="absolute inset-0">
                        {tour.coverImageUrl ? (
                          <>
                            <img
                              src={tour.coverImageUrl}
                              alt={tour.name}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          </>
                        ) : (
                          <div
                            className="h-full w-full"
                            style={{
                              background: `radial-gradient(ellipse at 30% 20%, ${group.color}25 0%, transparent 60%), linear-gradient(160deg, #f5f5f7 0%, #e5e5ea 100%)`
                            }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                              <svg viewBox="0 0 100 100" className="h-48 w-48" fill="currentColor" style={{ color: group.color }}>
                                <circle cx="50" cy="50" r="40" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="absolute left-0 right-0 top-0 z-10 flex items-start justify-between p-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#7f1d1d]/25 bg-white/95 shadow-md backdrop-blur-md">
                          <img src={group.iconSrc} alt="" className="h-6 w-6 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
                        </span>
                        {departure ? (
                          <span className="rounded-full border border-[#7f1d1d]/25 bg-white/95 px-3 py-1 text-xs font-semibold text-[#7f1d1d] shadow-sm backdrop-blur-md">
                            {formatDepartureRange(departure)}
                          </span>
                        ) : null}
                      </div>

                      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-white/95 via-white/85 to-transparent px-5 pb-5 pt-20">
                        {departure ? (
                          <span className="mb-2.5 inline-block rounded-full border border-[#7f1d1d]/20 bg-[#7f1d1d]/5 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-[#7f1d1d]">
                            {departureRelativeLabel(departure)}
                          </span>
                        ) : null}

                        <h3 className="text-lg font-bold leading-snug text-[#7f1d1d] transition-colors duration-200 group-hover:text-[#7f1d1d]">
                          {tour.name}
                        </h3>

                        {tour.airline ? (
                          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-[#7f1d1d]/15 bg-[#7f1d1d]/5 px-2.5 py-1">
                            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: group.color, opacity: 0.85 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            <span className="text-xs font-semibold tracking-wide text-[#7f1d1d]">{tour.airline}</span>
                          </div>
                        ) : null}

                        {otherMeta ? (
                          <p className="mt-1.5 text-xs font-medium text-slate-700 leading-relaxed">
                            {otherMeta}
                          </p>
                        ) : null}

                        <div className="mt-4 flex items-center gap-4 border-t border-[#7f1d1d]/10 pt-3.5">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#7f1d1d]">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {tour.days.length} gün
                          </span>
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#7f1d1d]">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {mapPoints} nokta
                          </span>
                          <span className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-[#7f1d1d]/20 bg-[#7f1d1d]/5 transition-all duration-200 group-hover:border-[#7f1d1d]/40 group-hover:bg-[#7f1d1d]/10">
                            <svg className="h-3.5 w-3.5 text-[#7f1d1d] transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </div>

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
      </div>
    </main>
  );
}
