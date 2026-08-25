import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeTour, tourInclude } from "@/lib/tours";
import { PassengerTracker } from "@/components/passenger/PassengerTracker";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { isPrismaSetupError } from "@/lib/db-errors";
import { departureRelativeLabel, formatDepartureRange } from "@/lib/departure-status";

export const dynamic = "force-dynamic";

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

export default async function PassengerTourPage({ params, searchParams }: { params: Promise<{ tourId: string }>; searchParams: Promise<{ departureId?: string }> }) {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  const { tourId } = await params;
  const { departureId } = await searchParams;
  let tour: any;
  try {
    tour = serializeTour(await prisma.tour.findFirst({ where: { id: tourId, status: "PUBLISHED" }, include: tourInclude })) as any;
  } catch (error) {
    if (isPrismaSetupError(error)) return <SetupNotice />;
    throw error;
  }
  if (!tour) notFound();
  const departure = tour.departures.find((item: any) => item.id === departureId) || tour.departures[0] || null;

  const today = dayNumber(dayKey(new Date()));
  const countriesThisWeek = new Map<string, { country: string; lat: number; lng: number; tourNames: Set<string> }>();
  for (const dep of tour.departures) {
    for (const day of tour.days) {
      if (!day.country) continue;
      const date = new Date(dep.startDate);
      date.setDate(date.getDate() + (day.dateOffset ?? day.dayNumber - 1));
      const diff = dayNumber(dayKey(date)) - today;
      if (diff >= 0 && diff <= 7) {
        const key = day.country.toLocaleLowerCase("tr-TR");
        const lat = day.lat ?? null;
        const lng = day.lng ?? null;
        if (lat == null || lng == null) continue;
        const current = countriesThisWeek.get(key) || { country: day.country, lat, lng, tourNames: new Set<string>() };
        current.tourNames.add(tour.name);
        countriesThisWeek.set(key, current);
      }
    }
  }
  const weeklyCountries = Array.from(countriesThisWeek.values());

  return (
    <main className="p-4">
      <section className="relative -mx-4 -mt-6 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 overflow-hidden border-b border-slate-200 bg-white shadow-sm">
        <div className="relative px-6 py-5 sm:px-10 sm:py-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="shrink-0 text-center sm:text-left">
              <img src="/logo.png" alt="Ejder Turizm" className="h-16 w-auto sm:h-20 lg:h-24" />
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-extrabold leading-tight tracking-tight text-[#7f1d1d] sm:text-xl">
                Bu Hafta{" "}
                <span className="bg-gradient-to-r from-[#7f1d1d] via-[#991b1b] to-[#b91c1c] bg-clip-text text-transparent">
                  Dünyayı Keşfediyoruz
                </span>
              </h1>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                {weeklyCountries.length > 0 ? (
                  <>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[#7f1d1d]/60">Bu hafta:</span>
                    {weeklyCountries.slice(0, 6).map((c) => (
                      <span key={c.country} className="rounded-md border border-[#7f1d1d]/15 bg-[#7f1d1d]/5 px-2 py-0.5 text-[11px] font-medium text-[#7f1d1d]/80">
                        {c.country}
                      </span>
                    ))}
                    {weeklyCountries.length > 6 && (
                      <span className="text-[11px] font-medium text-[#7f1d1d]/60">+{weeklyCountries.length - 6} daha</span>
                    )}
                  </>
                ) : (
                  <span className="text-[11px] text-[#7f1d1d]/60">Bu hafta aktif rota bulunmuyor.</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a
                href="https://www.ejderturizm.com.tr/"
                className="inline-flex items-center gap-2 rounded-lg border border-[#7f1d1d]/20 bg-[#7f1d1d]/5 px-4 py-2.5 text-sm font-medium text-[#7f1d1d] backdrop-blur transition-all duration-200 hover:border-[#7f1d1d]/40 hover:bg-[#7f1d1d]/10"
              >
                <svg className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Anasayfa
              </a>
              <Link
                href="/tours"
                className="inline-flex items-center gap-2 rounded-lg border border-[#7f1d1d]/40 bg-[#7f1d1d] px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-all duration-200 hover:bg-[#7f1d1d]/90"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Tur Listesi
              </Link>
            </div>
          </div>
        </div>
      </section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>{departure ? <span className="inline-flex items-center rounded-md border border-[#7f1d1d]/20 bg-[#7f1d1d]/5 px-2 py-1 text-xs font-medium text-[#7f1d1d]">{formatDepartureRange(departure)} · {departureRelativeLabel(departure)}</span> : null}</div>
        <div className="flex gap-2">
          {tour.slug ? <Link className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#7f1d1d]/20 bg-[#7f1d1d]/5 px-3 py-2 text-sm font-medium text-[#7f1d1d] transition hover:bg-[#7f1d1d]/10" href={`/tour/${tour.slug}`}>Tur detayı</Link> : null}
          <Link className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#7f1d1d]/40 bg-[#7f1d1d] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#7f1d1d]/90" href="/passenger">Tüm turlar</Link>
        </div>
      </div>
      <PassengerTracker tour={{ ...tour, selectedDeparture: departure }} />
    </main>
  );
}
