import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/AdminLogin";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { isPrismaSetupError } from "@/lib/db-errors";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  if (!(await isAdmin())) return <AdminLogin />;
  let published = 0;
  let drafts = 0;
  let logs: Awaited<ReturnType<typeof prisma.importLog.findMany>> = [];
  try {
    [published, drafts, logs] = await Promise.all([
      prisma.tour.count({ where: { status: "PUBLISHED" } }),
      prisma.tour.count({ where: { status: "DRAFT" } }),
      prisma.importLog.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { tour: true } })
    ]);
  } catch (error) {
    if (isPrismaSetupError(error)) return <SetupNotice />;
    throw error;
  }
  return (
    <main className="page-shell space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Ejder Turizm Admin</h1><p className="text-slate-400">Import, yayın ve tur takip operasyonları.</p></div>
        <div className="flex gap-2"><Link className="btn" href="/admin/import">Import</Link><Link className="btn-primary rounded-md" href="/admin/tours">Turlar</Link></div>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel rounded-lg p-4"><div className="text-3xl font-semibold">{published}</div><div className="text-sm text-slate-400">Yayındaki tur</div></div>
        <div className="panel rounded-lg p-4"><div className="text-3xl font-semibold">{drafts}</div><div className="text-sm text-slate-400">Taslak tur</div></div>
        <div className="panel rounded-lg p-4"><div className="text-3xl font-semibold">{logs.length}</div><div className="text-sm text-slate-400">Son import kaydı</div></div>
      </section>
      <section className="panel rounded-lg p-4">
        <h2 className="mb-3 font-semibold">Import geçmişi</h2>
        <div className="space-y-2">{logs.map((log) => <div className="rounded-md border border-line bg-ink/70 p-3 text-sm" key={log.id}><span className="badge">{log.status}</span> <span className="ml-2">{log.message}</span><div className="text-xs text-slate-500">{log.sourceUrl}</div></div>)}</div>
      </section>
    </main>
  );
}
