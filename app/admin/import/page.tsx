import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/AdminLogin";
import { ImportPreview } from "@/components/import/ImportPreview";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  if (!(await isAdmin())) return <AdminLogin />;
  return (
    <main className="page-shell space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Tur import</h1><p className="text-slate-400">İçe aktarılan kayıtlar taslak oluşturur; yayın öncesi düzenlenir.</p></div>
        <Link className="btn" href="/admin">Dashboard</Link>
      </header>
      <section className="grid gap-4 lg:grid-cols-2">
        <ImportPreview mode="tour" />
        <ImportPreview mode="list" />
      </section>
    </main>
  );
}
