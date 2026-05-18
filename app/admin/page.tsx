import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/AdminLogin";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { isPrismaSetupError } from "@/lib/db-errors";

export const dynamic = "force-dynamic";

type DraftTour = Prisma.TourGetPayload<{
  include: {
    departures: true;
    days: { select: { id: true } };
  };
}>;

export default async function AdminPage() {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  if (!(await isAdmin())) return <AdminLogin />;

  let published = 0;
  let drafts = 0;
  let logs: Awaited<ReturnType<typeof prisma.importLog.findMany>> = [];
  let draftTours: DraftTour[] = [];

  try {
    [published, drafts, logs, draftTours] = await Promise.all([
      prisma.tour.count({ where: { status: "PUBLISHED" } }),
      prisma.tour.count({ where: { status: "DRAFT" } }),
      prisma.importLog.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { tour: true } }),
      prisma.tour.findMany({
        where: { status: "DRAFT" },
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: {
          departures: { orderBy: { startDate: "asc" } },
          days: { select: { id: true } }
        }
      })
    ]);
  } catch (error) {
    if (isPrismaSetupError(error)) return <SetupNotice />;
    throw error;
  }

  return (
    <main className="page-shell space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Ejder Turizm Admin</h1>
          <p className="text-slate-400">Import, yayın ve tur takip operasyonları.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {published > 0 ? (
            <form action="/api/tours/delete-published" method="post">
              <button className="btn" type="submit">Yayındakileri sil</button>
            </form>
          ) : null}
          {drafts > 0 ? (
            <form action="/api/tours/publish-drafts" method="post">
              <button className="btn-primary rounded-md" type="submit">Tüm taslakları yayınla</button>
            </form>
          ) : null}
          <Link className="btn" href="/admin/import">Import</Link>
          <Link className="btn-primary rounded-md" href="/admin/tours">Turlar</Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel rounded-lg p-4"><div className="text-3xl font-semibold">{published}</div><div className="text-sm text-slate-400">Yayındaki tur</div></div>
        <div className="panel rounded-lg p-4"><div className="text-3xl font-semibold">{drafts}</div><div className="text-sm text-slate-400">Taslak tur</div></div>
        <div className="panel rounded-lg p-4"><div className="text-3xl font-semibold">{logs.length}</div><div className="text-sm text-slate-400">Son import kaydı</div></div>
      </section>

      {draftTours.length > 0 ? (
        <section className="panel rounded-lg p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Yayın bekleyen taslaklar</h2>
              <p className="text-sm text-slate-400">Bu turlar passenger ekranında görünmez; yayına alınca listelenir.</p>
            </div>
            <form action="/api/tours/publish-drafts" method="post">
              <button className="btn-primary rounded-md" type="submit">Hepsini yayınla</button>
            </form>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {draftTours.map((tour) => {
              const firstDeparture = tour.departures[0]?.startDate
                ? tour.departures[0].startDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })
                : "Tarih yok";
              return (
                <article className="rounded-md border border-line bg-ink/70 p-3" key={tour.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{tour.name}</h3>
                      <p className="text-sm text-slate-400">
                        {tour.departures.length} çıkış tarihi · {tour.days.length} gün · İlk tarih: {firstDeparture}
                      </p>
                    </div>
                    <form action={`/api/tours/${tour.id}/publish`} method="post">
                      <button className="btn-primary rounded-md" type="submit">Yayınla</button>
                    </form>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <Link className="btn" href={`/admin/tours/${tour.id}`}>Düzenle</Link>
                    <Link className="btn" href={`/passenger/${tour.id}`}>Ön izle</Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="panel rounded-lg p-4">
        <h2 className="mb-3 font-semibold">Import geçmişi</h2>
        <div className="space-y-2">
          {logs.map((log) => (
            <div className="rounded-md border border-line bg-ink/70 p-3 text-sm" key={log.id}>
              <span className="badge">{log.status}</span>
              <span className="ml-2">{log.message}</span>
              <div className="text-xs text-slate-500">{log.sourceUrl}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
