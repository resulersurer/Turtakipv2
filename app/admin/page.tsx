import Link from "next/link";
import { AlertTriangle, Armchair, CalendarDays, PlaneTakeoff, Plus, TicketCheck, UsersRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/AdminLogin";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { isPrismaSetupError } from "@/lib/db-errors";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { occupancy } from "@/lib/reservations/domain";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "short", year: "numeric" });
const reservationStatus = { HOLD: "Opsiyon", CONFIRMED: "Kesin", CANCELLED: "İptal" } as const;

export default async function AdminPage() {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  if (!(await isAdmin())) return <AdminLogin />;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const [published, drafts, members, upcoming, recentReservations, draftTours, changeLogs, notifications] = await Promise.all([
      prisma.tour.count({ where: { status: "PUBLISHED" } }),
      prisma.tour.count({ where: { status: "DRAFT" } }),
      prisma.member.count(),
      prisma.tourDeparture.findMany({
        where: { startDate: { gte: today }, tour: { status: "PUBLISHED" } },
        orderBy: { startDate: "asc" },
        include: { tour: { select: { id: true, name: true } }, reservations: { select: { status: true, seats: true, holdExpiresAt: true } } }
      }),
      prisma.reservation.findMany({
        orderBy: { createdAt: "desc" }, take: 6,
        include: { member: { select: { name: true } }, departure: { include: { tour: { select: { name: true } } } } }
      }),
      prisma.tour.findMany({
        where: { status: "DRAFT" }, orderBy: { updatedAt: "desc" }, take: 5,
        include: { departures: { orderBy: { startDate: "asc" } }, days: { select: { id: true } } }
      }),
      prisma.importLog.findMany({
        where: { OR: ["CREATED", "UPDATED", "ARCHIVED"].map((type) => ({ rawSummary: { path: ["changeType"], equals: type } })) },
        orderBy: { createdAt: "desc" }, take: 20, include: { tour: { select: { id: true, name: true } } }
      }),
      prisma.adminNotification.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { tour: { select: { id: true, name: true } } } })
    ]);
    const summaries = upcoming.map((departure) => occupancy(departure.capacity, departure.blockedSeats, departure.reservations));
    const missingCapacity = upcoming.filter((departure) => departure.capacity === null).length;
    const availableSeats = summaries.reduce((total, summary) => total + Math.max(0, summary.available || 0), 0);
    const activeBookings = summaries.reduce((total, summary) => total + summary.confirmed + summary.held, 0);
    const nextDepartures = upcoming.slice(0, 6);
    const fullDepartures = upcoming.filter((_, index) => summaries[index].available !== null && summaries[index].available! <= 0);

    return <main className="page-shell space-y-7">
      <header className="admin-page-header">
        <div className="admin-page-header__title"><span className="admin-eyebrow">Operasyon merkezi</span><h1>Genel bakış</h1><p>Tur yayınları, yaklaşan çıkışlar, koltuk durumu ve üye rezervasyonlarını tek ekrandan takip edin.</p></div>
        <div className="admin-page-actions"><Link className="btn" href="/admin/import">Tur içe aktar</Link><Link className="btn-primary" href="/admin/tours/new"><Plus size={17} />Yeni tur</Link></div>
      </header>

      <AdminNotifications logs={changeLogs} notifications={notifications} fullDepartures={fullDepartures} />

      <section className="admin-kpi-grid" aria-label="Operasyon özeti">
        {[
          { label: "Yayındaki tur", value: published, detail: `${drafts} taslak yayın bekliyor`, icon: PlaneTakeoff },
          { label: "Yaklaşan çıkış", value: upcoming.length, detail: `${missingCapacity} çıkışta kapasite eksik`, icon: CalendarDays },
          { label: "Rezerve koltuk", value: activeBookings, detail: "Kesin ve geçerli opsiyon koltukları", icon: TicketCheck },
          { label: "Müsait koltuk", value: availableSeats, detail: `${members} kayıtlı üye`, icon: Armchair }
        ].map((item) => { const Icon = item.icon; return <article className="admin-kpi" key={item.label}><div className="admin-kpi__top"><span>{item.label}</span><span className="admin-kpi__icon"><Icon size={18} /></span></div><strong>{item.value}</strong><small>{item.detail}</small></article>; })}
      </section>

      {missingCapacity > 0 ? <div className="admin-alert"><AlertTriangle size={19} /><div><strong>{missingCapacity} yaklaşan çıkış rezervasyona kapalı</strong><p>Üyelerin boş koltuk görebilmesi ve rezervasyon yapabilmesi için toplam kapasiteyi tanımlayın.</p></div><Link className="btn admin-list-item__action" href="/admin/capacities">Kapasiteleri düzenle</Link></div> : null}

      <div className="admin-dashboard-grid">
        <section className="panel p-5">
          <div className="admin-section-heading"><div><h2>Yaklaşan çıkışlar</h2><p>Tarih ve koltuk doluluğuna göre operasyon sırası</p></div><Link className="btn" href="/admin/reservations">Tümünü yönet</Link></div>
          <div className="admin-list">{nextDepartures.length ? nextDepartures.map((departure) => {
            const summary = occupancy(departure.capacity, departure.blockedSeats, departure.reservations);
            return <article className="admin-list-item" key={departure.id}><div className="admin-list-item__main"><h3>{departure.tour.name}</h3><p>{dateFormat.format(departure.startDate)} · {summary.capacity === null ? "Kapasite tanımsız" : `${summary.available} boş / ${summary.capacity} toplam`}</p></div><Link className="btn admin-list-item__action" href={`/admin/reservations?departureId=${departure.id}`}>Yönet</Link></article>;
          }) : <p className="py-8 text-center text-sm text-slate-500">Yaklaşan yayınlanmış çıkış bulunmuyor.</p>}</div>
        </section>

        <section className="panel p-5">
          <div className="admin-section-heading"><div><h2>Son rezervasyonlar</h2><p>Üye ve operasyon ekibi kayıtları</p></div><UsersRound size={20} /></div>
          <div className="admin-list">{recentReservations.length ? recentReservations.map((reservation) => <article className="admin-list-item" key={reservation.id}><div className="admin-list-item__main"><h3>{reservation.contactName}</h3><p>{reservation.departure.tour.name} · {reservation.seats} koltuk · {reservation.member ? "Üye" : "Admin"}</p></div><span className="badge">{reservationStatus[reservation.status]}</span></article>) : <p className="py-8 text-center text-sm text-slate-500">Henüz rezervasyon yok.</p>}</div>
        </section>
      </div>

      <div>
        <section className="panel p-5">
          <div className="admin-section-heading"><div><h2>Yayın bekleyen taslaklar</h2><p>Eksik bilgileri tamamlayıp yayına alın</p></div>{drafts > 0 ? <form action="/api/tours/publish-drafts" method="post"><button className="btn-primary" type="submit">Tümünü yayınla</button></form> : null}</div>
          <div className="admin-list">{draftTours.length ? draftTours.map((tour) => <article className="admin-list-item" key={tour.id}><div className="admin-list-item__main"><h3>{tour.name}</h3><p>{tour.departures.length} çıkış · {tour.days.length} program günü</p></div><Link className="btn admin-list-item__action" href={`/admin/tours/${tour.id}`}>Düzenle</Link></article>) : <p className="py-8 text-center text-sm text-slate-500">Yayın bekleyen taslak yok.</p>}</div>
        </section>
      </div>
    </main>;
  } catch (error) {
    if (isPrismaSetupError(error)) return <SetupNotice />;
    throw error;
  }
}
