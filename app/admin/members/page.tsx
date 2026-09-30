import Link from "next/link";
import { Activity, CalendarCheck2, MailCheck, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/AdminLogin";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { MemberRoleSelect } from "@/components/admin/MemberRoleSelect";
import { isMemberRole, memberRoleLabels, memberRoles } from "@/lib/member-roles";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 50;
const dateTime = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" });

export default async function AdminMembersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  if (!(await isAdmin())) return <AdminLogin />;
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const role = isMemberRole(params.role) ? params.role : undefined;
  const requestedPage = Math.max(1, Number(params.page) || 1);
  const where = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] } : {}),
    ...(role ? { role } : {}),
    ...(params.verified === "1" ? { emailVerified: true } : params.verified === "0" ? { emailVerified: false } : {})
  };
  const now = new Date();
  const [totalMembers, verifiedMembers, membersWithReservations, activeSessions, filteredCount] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({ where: { emailVerified: true } }),
    prisma.member.count({ where: { reservations: { some: {} } } }),
    prisma.memberSession.count({ where: { expiresAt: { gt: now } } }),
    prisma.member.count({ where })
  ]);
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const members = await prisma.member.findMany({
    where,
    select: {
      id: true, name: true, email: true, emailVerified: true, role: true, image: true, createdAt: true, updatedAt: true,
      _count: { select: { reservations: true, sessions: true } },
      sessions: { orderBy: { updatedAt: "desc" }, take: 1, select: { updatedAt: true, expiresAt: true } }
    },
    orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE
  });
  const pageHref = (target: number) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (params.verified) query.set("verified", params.verified);
    if (role) query.set("role", role);
    query.set("page", String(target));
    return `/admin/members?${query.toString()}`;
  };

  return <main className="page-shell space-y-6">
    <header className="admin-page-header"><div className="admin-page-header__title"><span className="admin-eyebrow">Kullanıcı hesapları</span><h1>Üyeler</h1><p>Yönetim, personel, yolcu, rehber ve acente hesaplarını rollerine göre sınıflandırın ve takip edin.</p></div></header>
    <section className="admin-kpi-grid" aria-label="Üye özeti">
      <article className="admin-kpi"><div className="admin-kpi__top"><span>Toplam üye</span><span className="admin-kpi__icon"><Users size={18}/></span></div><strong>{totalMembers}</strong><small>Kayıtlı kullanıcı hesabı</small></article>
      <article className="admin-kpi"><div className="admin-kpi__top"><span>Doğrulanmış</span><span className="admin-kpi__icon"><MailCheck size={18}/></span></div><strong>{verifiedMembers}</strong><small>E-posta doğrulaması tamamlanan</small></article>
      <article className="admin-kpi"><div className="admin-kpi__top"><span>Rezervasyon yapan</span><span className="admin-kpi__icon"><CalendarCheck2 size={18}/></span></div><strong>{membersWithReservations}</strong><small>En az bir rezervasyonu bulunan</small></article>
      <article className="admin-kpi"><div className="admin-kpi__top"><span>Aktif oturum</span><span className="admin-kpi__icon"><Activity size={18}/></span></div><strong>{activeSessions}</strong><small>Süresi dolmamış giriş oturumu</small></article>
    </section>
    <form className="panel admin-filter-panel">
      <label><span>Üye ara</span><input className="input" name="q" defaultValue={q} placeholder="Ad veya e-posta"/></label>
      <label><span>E-posta durumu</span><select className="input" name="verified" defaultValue={params.verified || ""}><option value="">Tümü</option><option value="1">Doğrulanmış</option><option value="0">Doğrulanmamış</option></select></label>
      <label><span>Üye rolü</span><select className="input" name="role" defaultValue={role || ""}><option value="">Tüm roller</option>{memberRoles.map((item) => <option value={item} key={item}>{memberRoleLabels[item]}</option>)}</select></label>
      <button className="btn-primary">Filtrele</button>
      {(q || params.verified || role) ? <Link className="btn" href="/admin/members">Temizle</Link> : null}
    </form>
    <div className="admin-section-heading"><div><h2>Üye listesi</h2><p>{filteredCount} kayıt · Sayfa {page}/{totalPages}</p></div></div>
    <section className="admin-list">
      {members.map((member) => {
        const lastSession = member.sessions[0];
        const active = Boolean(lastSession && lastSession.expiresAt > now);
        return <article className="admin-list-item" key={member.id}>
          <div className="admin-list-item__main"><h3>{member.name || "İsimsiz üye"}</h3><p>{member.email} · {dateTime.format(member.createdAt)} tarihinde kayıt oldu</p><p>{member._count.reservations} rezervasyon · {member._count.sessions} oturum · {lastSession ? `Son hareket ${dateTime.format(lastSession.updatedAt)}` : "Henüz giriş yapmadı"}</p></div>
          <div className="member-list-actions"><div className="flex flex-wrap items-center justify-end gap-2"><span className={`badge member-role-badge member-role-badge--${member.role.toLowerCase()}`}>{memberRoleLabels[member.role]}</span><span className="badge">{member.emailVerified ? "E-posta doğrulandı" : "Doğrulanmadı"}</span><span className={`badge ${active ? "text-emerald-700" : "text-slate-500"}`}>{active ? "Oturum aktif" : "Çevrimdışı"}</span></div><MemberRoleSelect memberId={member.id} role={member.role}/></div>
        </article>;
      })}
      {!members.length ? <div className="panel p-8 text-center text-slate-500">Filtrelere uygun üye bulunamadı.</div> : null}
    </section>
    {totalPages > 1 ? <nav className="flex items-center justify-between gap-3" aria-label="Üye listesi sayfaları"><span className="text-sm text-slate-500">Sayfa {page} / {totalPages}</span><div className="flex gap-2">{page > 1 ? <Link className="btn" href={pageHref(page - 1)}>Önceki</Link> : null}{page < totalPages ? <Link className="btn" href={pageHref(page + 1)}>Sonraki</Link> : null}</div></nav> : null}
  </main>;
}
