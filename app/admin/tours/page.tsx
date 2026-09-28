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
    <main className="page-shell space-y-6">
      <header className="admin-page-header">
        <div className="admin-page-header__title"><span className="admin-eyebrow">Tur operasyonu</span><h1>Turlar</h1><p>Tur içeriklerini, çıkış tarihlerini, yayın durumunu ve kapasite hazırlığını yönetin.</p></div>
        <div className="admin-page-actions">
          {publishedCount > 0 ? <details className="admin-bulk-actions"><summary className="btn">Toplu işlemler</summary><div><p>Rezervasyonu olmayan {publishedCount} yayındaki tur silinebilir.</p><form action="/api/tours/delete-published" method="post"><button type="submit">Yayındakileri toplu sil</button></form></div></details> : null}
          <Link className="btn" href="/admin/import">İçe aktar</Link>
          <Link className="btn-primary" href="/admin/tours/new">Yeni tur</Link>
        </div>
      </header>
      <form className="panel admin-filter-panel">
        <label><span>Tur ara</span><input className="input" name="q" defaultValue={params.q} placeholder="Tur veya şehir" /></label>
        <label><span>Durum</span><select className="input" name="status" defaultValue={params.status || ""}><option value="">Tümü</option><option value="DRAFT">Taslak</option><option value="PUBLISHED">Yayında</option><option value="ARCHIVED">Arşiv</option></select></label>
        <label><span>Ay</span><input className="input" name="month" type="number" min="1" max="12" defaultValue={params.month} placeholder="1-12" /></label>
        <label><span>Haftanın günü</span><select className="input" name="weekday" defaultValue={params.weekday || ""}><option value="">Tümü</option><option value="1">Pazartesi</option><option value="2">Salı</option><option value="3">Çarşamba</option><option value="4">Perşembe</option><option value="5">Cuma</option><option value="6">Cumartesi</option><option value="0">Pazar</option></select></label>
        <button className="btn-primary">Filtrele</button>
      </form>
      <div className="admin-section-heading"><div><h2>Tur listesi</h2><p>{filtered.length} tur gösteriliyor</p></div></div>
      {filtered.length ? <section className="admin-tour-list">{filtered.map((tour) => <TourCard key={tour.id} tour={tour} admin />)}</section> : <div className="panel p-8 text-center text-slate-400">Filtrelere uygun tur bulunamadı.</div>}
    </main>
  );
}
