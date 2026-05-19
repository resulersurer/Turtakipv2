import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/AdminLogin";
import { TourCard } from "@/components/tours/TourCard";
import { tourInclude, serializeTour } from "@/lib/tours";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { isPrismaSetupError } from "@/lib/db-errors";

export const dynamic = "force-dynamic";

function tourSortValue(tour: any) {
  const now = Date.now();
  const ranges = (tour.departures || []).map((departure: any) => ({
    start: new Date(departure.startDate).getTime(),
    end: new Date(departure.endDate || departure.startDate).getTime()
  }));
  const activeEnd = ranges.filter((range: any) => range.start <= now && range.end >= now).map((range: any) => range.end).sort((a: number, b: number) => a - b)[0];
  if (activeEnd != null) return activeEnd;
  const nextStart = ranges.filter((range: any) => range.start > now).map((range: any) => range.start).sort((a: number, b: number) => a - b)[0];
  if (nextStart != null) return nextStart;
  const lastEnd = ranges.map((range: any) => range.end).sort((a: number, b: number) => b - a)[0];
  return -(lastEnd || 0);
}

export default async function AdminToursPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  if (!(await isAdmin())) return <AdminLogin />;
  const params = await searchParams;
  let tours: any[];
  let publishedCount = 0;
  try {
    tours = serializeTour(await prisma.tour.findMany({ include: tourInclude, orderBy: { updatedAt: "desc" } })) as any[];
    publishedCount = tours.filter((tour) => tour.status === "PUBLISHED").length;
  } catch (error) {
    if (isPrismaSetupError(error)) return <SetupNotice />;
    throw error;
  }
  const filtered = tours.filter((tour) => {
    const q = params.q?.toLocaleLowerCase("tr-TR");
    if (q && !`${tour.name} ${tour.days?.map((d: any) => d.city).join(" ")}`.toLocaleLowerCase("tr-TR").includes(q)) return false;
    if (params.status && tour.status !== params.status) return false;
    if (params.month && !tour.departures?.some((d: any) => new Date(d.startDate).getMonth() + 1 === Number(params.month))) return false;
    if (params.weekday && !tour.departures?.some((d: any) => new Date(d.startDate).getDay() === Number(params.weekday))) return false;
    return true;
  }).sort((a, b) => tourSortValue(a) - tourSortValue(b));
  return (
    <main className="page-shell space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Turlar</h1><p className="text-slate-400">Arama, durum ve takvim filtreleriyle operasyon listesi.</p></div>
        <div className="flex flex-wrap gap-2">
          {publishedCount > 0 ? (
            <form action="/api/tours/delete-published" method="post">
              <button className="btn" type="submit">Yayındakileri toplu sil ({publishedCount})</button>
            </form>
          ) : null}
          <Link className="btn" href="/admin/import">Import</Link>
          <Link className="btn-primary rounded-md" href="/admin/tours/new">Yeni tur</Link>
        </div>
      </header>
      <form className="panel grid gap-3 rounded-lg p-4 md:grid-cols-5">
        <input className="input" name="q" defaultValue={params.q} placeholder="Tur veya şehir ara" />
        <select className="input" name="status" defaultValue={params.status || ""}><option value="">Tüm durumlar</option><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select>
        <input className="input" name="month" defaultValue={params.month} placeholder="Ay 1-12" />
        <input className="input" name="isoWeek" defaultValue={params.isoWeek} placeholder="ISO hafta" />
        <select className="input" name="weekday" defaultValue={params.weekday || ""}><option value="">Gün</option><option value="1">Pzt</option><option value="2">Sal</option><option value="3">Çar</option><option value="4">Per</option><option value="5">Cum</option><option value="6">Cmt</option><option value="0">Paz</option></select>
        <button className="btn-primary rounded-md md:col-span-5">Filtrele</button>
      </form>
      {filtered.length ? <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((tour) => <TourCard key={tour.id} tour={tour} admin />)}</section> : <div className="panel rounded-lg p-8 text-center text-slate-400">Tur bulunamadı.</div>}
    </main>
  );
}
