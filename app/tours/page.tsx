import { prisma } from "@/lib/prisma";
import { TourCard } from "@/components/tours/TourCard";
import { serializeTour, tourInclude } from "@/lib/tours";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { isPrismaSetupError } from "@/lib/db-errors";

export const dynamic = "force-dynamic";

function classify(tour: any) {
  const starts = tour.departures.map((departure: any) => new Date(departure.startDate).getTime());
  const ends = tour.departures.map((departure: any) => new Date(departure.endDate || departure.startDate).getTime());
  const now = Date.now();
  if (ends.some((end: number, index: number) => starts[index] <= now && end >= now)) return "Devam eden";
  if (starts.some((start: number) => start > now)) return "Gelecek";
  return "Geçmiş";
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
  const groups = ["Devam eden", "Gelecek", "Geçmiş"].map((label) => ({ label, tours: filtered.filter((tour) => classify(tour) === label) }));
  return (
    <main className="page-shell space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Yayındaki turlar</h1><p className="text-slate-400">Program, çıkış tarihleri ve yolcu takip bağlantıları.</p></div>
        <form><input className="input w-72" name="q" defaultValue={params.q} placeholder="Tur veya şehir ara" /></form>
      </header>
      {groups.map((group) => (
        <section className="space-y-3" key={group.label}>
          <h2 className="text-lg font-semibold">{group.label}</h2>
          {group.tours.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{group.tours.map((tour) => <TourCard key={tour.id} tour={tour} />)}</div> : <div className="panel rounded-lg p-5 text-sm text-slate-400">Bu bölümde tur yok.</div>}
        </section>
      ))}
    </main>
  );
}
