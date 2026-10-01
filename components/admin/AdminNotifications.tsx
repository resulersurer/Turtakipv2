import Link from "next/link";
import { Bell, CircleAlert } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { importChanges } from "@/lib/admin/notifications";

type Tour = { id: string; name: string } | null;
type ChangeLog = { id: string; createdAt: Date; message: string; rawSummary: Prisma.JsonValue | null; tour: Tour };
type Notification = { id: string; type: string; message: string; createdAt: Date; startDate: Date | null; departureId: string | null; tour: Tour };
type FullDeparture = { id: string; startDate: Date; tour: NonNullable<Tour> };
const dateTime = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" });
const date = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeZone: "Europe/Istanbul" });
const labels: Record<string, string> = { CREATED: "Yeni tur", UPDATED: "Tur güncellendi", ARCHIVED: "Tur arşivlendi", CAPACITY_FULL: "Kontenjan doldu", CAPACITY_AVAILABLE: "Yer açıldı", DATE_ADDED: "Tarih eklendi", DATE_REMOVED: "Tarih kaldırıldı" };
const formatDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) ? date.format(new Date(`${value}T00:00:00Z`)) : value;

export function AdminNotifications({ logs, notifications, fullDepartures }: { logs: ChangeLog[]; notifications: Notification[]; fullDepartures: FullDeparture[] }) {
  const items = [
    ...logs.map((log) => {
      const summary = importChanges(log.rawSummary);
      return { id: `import-${log.id}`, createdAt: log.createdAt, type: summary?.type || "UPDATED", tour: log.tour,
        href: log.tour ? `/admin/tours/${log.tour.id}` : null,
        details: [...(summary?.changes.length ? summary.changes : [log.message]), ...(summary?.addedDates || []).map((value) => `Eklenen tarih: ${formatDate(value)}`), ...(summary?.removedDates || []).map((value) => `Kaldırılan tarih: ${formatDate(value)}`)] };
    }),
    ...notifications.map((item) => ({ id: item.id, createdAt: item.createdAt, type: item.type, tour: item.tour,
      href: item.tour ? item.departureId ? `/admin/reservations?departureId=${item.departureId}` : `/admin/tours/${item.tour.id}` : null,
      details: [`${item.startDate ? `${date.format(item.startDate)} · ` : ""}${item.message}`] }))
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 20);

  return <section className="panel p-5" aria-labelledby="admin-notifications-title">
    <div className="admin-section-heading"><div><h2 id="admin-notifications-title" className="flex items-center gap-2"><Bell size={20} />Bildirimler</h2><p>Tur değişiklikleri ve rezervasyon kontenjanları · Son 20 bildirim</p></div><Link className="btn" href="/admin/import">Değişiklik geçmişi</Link></div>
    {fullDepartures.length ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-900"><CircleAlert size={18} />Şu anda kontenjanı dolu {fullDepartures.length} çıkış</h3><div className="flex flex-wrap gap-2">{fullDepartures.map((departure) => <Link className="rounded-lg bg-white px-3 py-2 text-sm text-amber-900" href={`/admin/reservations?departureId=${departure.id}`} key={departure.id}>{departure.tour.name} · {date.format(departure.startDate)}</Link>)}</div></div> : null}
    <div className="max-h-[32rem] space-y-3 overflow-y-auto">
      {items.map((item) => <article className="rounded-xl border border-line p-4" key={item.id}>
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="badge">{labels[item.type] || "Tur değişikliği"}</span><time className="text-xs text-slate-500" dateTime={item.createdAt.toISOString()}>{dateTime.format(item.createdAt)}</time></div>
        <h3 className="mt-2 font-semibold">{item.href ? <Link href={item.href}>{item.tour?.name || "Tur kaydı"}</Link> : item.tour?.name || "Silinen tur"}</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">{item.details.map((detail, index) => <li key={index}>{detail}</li>)}</ul>
      </article>)}
      {!items.length ? <p className="py-5 text-center text-sm text-slate-500">Henüz değişiklik bildirimi yok. Yeni tarih ve kontenjan değişiklikleri burada görünecek.</p> : null}
    </div>
  </section>;
}
