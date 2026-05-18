import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializeTour, tourInclude } from "@/lib/tours";
import { PublicMap } from "@/components/maps/PublicMap";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { isPrismaSetupError } from "@/lib/db-errors";
import { classifyDeparture, departureRelativeLabel, formatDepartureRange } from "@/lib/departure-status";

export const dynamic = "force-dynamic";

export default async function PassengerPage() {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  let tours: any[];
  try {
    tours = serializeTour(await prisma.tour.findMany({ where: { status: "PUBLISHED" }, include: tourInclude, orderBy: { updatedAt: "desc" } })) as any[];
  } catch (error) {
    if (isPrismaSetupError(error)) return <SetupNotice />;
    throw error;
  }
  const allDays = tours.flatMap((tour) => tour.days.map((day: any) => ({ ...day, title: `${tour.name} • ${day.title}` })));
  const departures = tours.flatMap((tour) =>
    tour.departures.map((departure: any) => ({
      tour,
      departure,
      status: classifyDeparture({ ...departure, firstDayHour: tour.days[0]?.hour }),
      relative: departureRelativeLabel({ ...departure, firstDayHour: tour.days[0]?.hour }),
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
      <header className="flex items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Yolcu tur takip</h1><p className="text-slate-400">Yayındaki turların rota ve timeline görünümü.</p></div><Link className="btn" href="/tours">Tur listesi</Link></header>
      <section className="panel rounded-lg p-3"><div className="h-[460px]"><PublicMap days={allDays} /></div></section>
      {groups.map((group) => (
        <section className="space-y-3" key={group.key}>
          <h2 className="text-lg font-semibold">{group.label}</h2>
          {group.items.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map(({ tour, departure, relative, range }) => (
                <Link className="panel overflow-hidden rounded-lg transition hover:border-mint" href={`/passenger/${tour.id}?departureId=${departure.id}`} key={`${tour.id}-${departure.id}`}>
                  {tour.coverImageUrl ? <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${tour.coverImageUrl})` }} /> : <div className="h-2 bg-mint" />}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="badge">{range}</span>
                      <span className="text-xs text-mint">{relative}</span>
                    </div>
                    <h3 className="mt-3 font-semibold">{tour.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{[tour.durationDays ? `${tour.durationDays} gün` : null, tour.departureCity, tour.airline].filter(Boolean).join(" • ")}</p>
                    <p className="mt-2 text-sm text-slate-300">{tour.days.length} günlük rota, {tour.days.filter((day: any) => day.lat != null && day.lng != null).length} harita noktası</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="panel rounded-lg p-5 text-sm text-slate-400">Bu bölümde tur çıkışı yok.</div>
          )}
        </section>
      ))}
    </main>
  );
}
