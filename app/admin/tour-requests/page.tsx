import Link from "next/link";
import { BadgeCheck, CircleDot, Headphones, Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/AdminLogin";
import { SetupNotice } from "@/components/SetupNotice";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { tourRequestStatusLabels } from "@/lib/tour-requests";
import { TourRequestStatus } from "@/components/tour-requests/TourRequestStatus";

export const dynamic = "force-dynamic";
const dateTime = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" });
const dateOnly = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeZone: "Europe/Istanbul" });

export default async function AdminTourRequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice/>;
  if (!(await isAdmin())) return <AdminLogin/>;
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const status = ["NEW", "CONTACTED", "CONVERTED", "CLOSED"].includes(params.status || "") ? params.status as "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED" : undefined;
  const where = { ...(status ? { status } : {}), ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q } }, { email: { contains: q, mode: "insensitive" as const } }, { tourName: { contains: q, mode: "insensitive" as const } }, { code: { contains: q, mode: "insensitive" as const } }] } : {}) };
  const [total, fresh, contacted, converted, requests] = await Promise.all([
    prisma.tourRequest.count(), prisma.tourRequest.count({ where: { status: "NEW" } }), prisma.tourRequest.count({ where: { status: "CONTACTED" } }), prisma.tourRequest.count({ where: { status: "CONVERTED" } }),
    prisma.tourRequest.findMany({ where, include: { member: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 200 })
  ]);
  return <main className="page-shell space-y-6">
    <header className="admin-page-header"><div className="admin-page-header__title"><span className="admin-eyebrow">Müşteri talepleri</span><h1>Tur talepleri</h1><p>Formu dolduran kişiyi, ilgilendiği turu ve talebin hangi sayfadan geldiğini tek ekrandan takip edin.</p></div><div className="admin-page-actions"><Link className="btn" href="/passenger/tour-request?source=admin-preview" target="_blank">Formu görüntüle</Link></div></header>
    <section className="admin-kpi-grid" aria-label="Talep özeti"><article className="admin-kpi"><div className="admin-kpi__top"><span>Toplam talep</span><span className="admin-kpi__icon"><Inbox size={18}/></span></div><strong>{total}</strong><small>Sisteme ulaşan tüm formlar</small></article><article className="admin-kpi"><div className="admin-kpi__top"><span>Yeni</span><span className="admin-kpi__icon"><CircleDot size={18}/></span></div><strong>{fresh}</strong><small>Henüz işlem yapılmayan</small></article><article className="admin-kpi"><div className="admin-kpi__top"><span>İletişimde</span><span className="admin-kpi__icon"><Headphones size={18}/></span></div><strong>{contacted}</strong><small>Müşteriye dönüş yapılan</small></article><article className="admin-kpi"><div className="admin-kpi__top"><span>Satışa dönüştü</span><span className="admin-kpi__icon"><BadgeCheck size={18}/></span></div><strong>{converted}</strong><small>Olumlu sonuçlanan talep</small></article></section>
    <form className="panel admin-filter-panel tour-request-filter"><label><span>Talep ara</span><input className="input" name="q" defaultValue={q} placeholder="Kişi, telefon, e-posta, tur veya kod"/></label><label><span>Durum</span><select className="input" name="status" defaultValue={status || ""}><option value="">Tümü</option>{Object.entries(tourRequestStatusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><button className="btn-primary">Filtrele</button>{(q || status) ? <Link href="/admin/tour-requests" className="btn">Temizle</Link> : null}</form>
    <div className="admin-section-heading"><div><h2>Form kayıtları</h2><p>{requests.length} talep gösteriliyor</p></div></div>
    <section className="tour-request-admin-list">{requests.map((item)=><article className="panel tour-request-admin-card" key={item.id}><div className="tour-request-admin-card__head"><div><span className={`badge tour-request-badge--${item.status.toLowerCase()}`}>{tourRequestStatusLabels[item.status]}</span><strong>{item.code}</strong></div><TourRequestStatus id={item.id} status={item.status}/></div><div className="tour-request-admin-card__body"><div className="tour-request-admin-person"><h3>{item.fullName}</h3><p><a href={`tel:${item.phone}`}>{item.phone}</a>{item.email ? <> · <a href={`mailto:${item.email}`}>{item.email}</a></> : null}</p><p>{item.city || "Şehir belirtilmedi"} · {item.adultCount} yetişkin{item.childCount ? `, ${item.childCount} çocuk` : ""}</p>{item.member ? <span className="badge">Üye: {item.member.name || item.member.email}</span> : <span className="badge">Misafir formu</span>}</div><div className="tour-request-admin-tour"><span>İLGİLENİLEN TUR</span><h3>{item.tourName || "Tur seçilmedi / özel talep"}</h3>{item.preferredDate ? <p>Tercih: {dateOnly.format(item.preferredDate)}</p> : <p>Tarih belirtilmedi</p>}{item.budget ? <p>Bütçe: {item.budget}</p> : null}</div><div className="tour-request-admin-source"><span>GELİŞ KAYNAĞI</span><h3>{item.sourceLabel || "Doğrudan form"}</h3><p title={item.sourcePage}>{item.sourcePage}</p>{item.utmSource ? <p>Kampanya: {item.utmSource}{item.utmCampaign ? ` / ${item.utmCampaign}` : ""}</p> : null}<small>{dateTime.format(item.createdAt)}</small></div></div>{item.notes ? <div className="tour-request-admin-note"><strong>Müşteri notu</strong><p>{item.notes}</p></div> : null}</article>)}{!requests.length ? <div className="panel p-10 text-center text-slate-500">Filtrelere uygun tur talebi bulunamadı.</div> : null}</section>
  </main>;
}
