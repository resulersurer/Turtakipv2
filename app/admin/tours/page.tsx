import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/AdminLogin";
import { TourCard } from "@/components/tours/TourCard";
import { TourDataRefresh } from "@/components/admin/TourDataRefresh";
import { tourInclude, serializeTour } from "@/lib/tours";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { isPrismaSetupError } from "@/lib/db-errors";
import { AlertTriangle, Archive, CircleCheck, FilePenLine } from "lucide-react";

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

function duplicateName(name: string) {
  return name.toLocaleLowerCase("tr-TR").replace(/\s+(?:kopya|copy)(?:\s+\d+)?$/i, "").replace(/[^a-z0-9çğıöşü]+/gi, " ").trim();
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
  const duplicateIds = new Set<string>();
  for (let left = 0; left < tours.length; left += 1) for (let right = left + 1; right < tours.length; right += 1) {
    if (duplicateName(tours[left].name) !== duplicateName(tours[right].name)) continue;
    const dates = new Set(tours[left].departures.map((item: any) => new Date(item.startDate).toISOString().slice(0, 10)));
    if (tours[right].departures.some((item: any) => dates.has(new Date(item.startDate).toISOString().slice(0, 10))) || (!dates.size && !tours[right].departures.length)) {
      duplicateIds.add(tours[left].id); duplicateIds.add(tours[right].id);
    }
  }
  const counts = { published: tours.filter((tour) => tour.status === "PUBLISHED").length, draft: tours.filter((tour) => tour.status === "DRAFT").length, archived: tours.filter((tour) => tour.status === "ARCHIVED").length };
  const filtered = tours.filter((tour) => {
    const q = params.q?.toLocaleLowerCase("tr-TR");
    if (q && !`${tour.name} ${tour.days?.map((d: any) => d.city).join(" ")}`.toLocaleLowerCase("tr-TR").includes(q)) return false;
    if (params.status && tour.status !== params.status) return false;
    if (params.month && !tour.departures?.some((d: any) => new Date(d.startDate).getMonth() + 1 === Number(params.month))) return false;
    if (params.weekday && !tour.departures?.some((d: any) => new Date(d.startDate).getDay() === Number(params.weekday))) return false;
    if (params.duplicates === "1" && !duplicateIds.has(tour.id)) return false;
    return true;
  }).sort((a, b) => tourSortValue(a) - tourSortValue(b));
  return (
    <main className="page-shell space-y-6">
      <TourDataRefresh />
      <header className="admin-page-header">
        <div className="admin-page-header__title"><span className="admin-eyebrow">Tur operasyonu</span><h1>Turlar</h1><p>Tur içeriklerini, çıkış tarihlerini, yayın durumunu ve kapasite hazırlığını yönetin.</p></div>
        <div className="admin-page-actions">
          {publishedCount > 0 ? <details className="admin-bulk-actions"><summary className="btn">Toplu işlemler</summary><div><p>Rezervasyonu olmayan {publishedCount} yayındaki tur silinebilir.</p><form action="/api/tours/delete-published" method="post"><button type="submit">Yayındakileri toplu sil</button></form></div></details> : null}
          <Link className="btn" href="/admin/import">İçe aktar</Link>
          <Link className="btn-primary" href="/admin/tours/new">Yeni tur</Link>
        </div>
      </header>
      <section className="admin-kpi-grid" aria-label="Tur yayın özeti">
        <article className="admin-kpi"><div className="admin-kpi__top"><span>Yayında</span><span className="admin-kpi__icon"><CircleCheck size={18}/></span></div><strong>{counts.published}</strong><small>Yolcuların görebildiği turlar</small></article>
        <article className="admin-kpi"><div className="admin-kpi__top"><span>Taslak</span><span className="admin-kpi__icon"><FilePenLine size={18}/></span></div><strong>{counts.draft}</strong><small>Yayınlanmayı bekleyen turlar</small></article>
        <article className="admin-kpi"><div className="admin-kpi__top"><span>Arşiv</span><span className="admin-kpi__icon"><Archive size={18}/></span></div><strong>{counts.archived}</strong><small>Listelerde gösterilmeyen turlar</small></article>
        <article className="admin-kpi"><div className="admin-kpi__top"><span>Olası tekrar</span><span className="admin-kpi__icon"><AlertTriangle size={18}/></span></div><strong>{duplicateIds.size}</strong><small>Aynı ad ve çıkış tarihini paylaşan kayıt</small></article>
      </section>
      {duplicateIds.size ? <div className="admin-alert"><AlertTriangle size={19}/><div><strong>{duplicateIds.size} olası tekrar kayıt bulundu</strong><p>Aynı tur adı ve aynı çıkış tarihine sahip kayıtları karşılaştırıp gereksiz olanı arşivleyin veya silin.</p></div><Link className="btn admin-list-item__action" href="/admin/tours?duplicates=1">Tekrarları göster</Link></div> : null}
      <form className="panel admin-filter-panel">
        <label><span>Tur ara</span><input className="input" name="q" defaultValue={params.q} placeholder="Tur veya şehir" /></label>
        <label><span>Durum</span><select className="input" name="status" defaultValue={params.status || ""}><option value="">Tümü</option><option value="DRAFT">Taslak</option><option value="PUBLISHED">Yayında</option><option value="ARCHIVED">Arşiv</option></select></label>
        <label><span>Ay</span><input className="input" name="month" type="number" min="1" max="12" defaultValue={params.month} placeholder="1-12" /></label>
        <label><span>Haftanın günü</span><select className="input" name="weekday" defaultValue={params.weekday || ""}><option value="">Tümü</option><option value="1">Pazartesi</option><option value="2">Salı</option><option value="3">Çarşamba</option><option value="4">Perşembe</option><option value="5">Cuma</option><option value="6">Cumartesi</option><option value="0">Pazar</option></select></label>
        <label><span>Tekrar kontrolü</span><select className="input" name="duplicates" defaultValue={params.duplicates || ""}><option value="">Tüm kayıtlar</option><option value="1">Yalnız olası tekrarlar</option></select></label>
        <button className="btn-primary">Filtrele</button>
      </form>
      <div className="admin-section-heading"><div><h2>Tur listesi</h2><p>{filtered.length} tur gösteriliyor</p></div></div>
      {filtered.length ? <section className="admin-tour-list">{filtered.map((tour) => <TourCard key={tour.id} tour={tour} admin duplicate={duplicateIds.has(tour.id)} />)}</section> : <div className="panel p-8 text-center text-slate-400">Filtrelere uygun tur bulunamadı.</div>}
    </main>
  );
}
