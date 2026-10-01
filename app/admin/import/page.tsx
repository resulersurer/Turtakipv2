import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/AdminLogin";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { AutomaticImportPanel } from "@/components/import/AutomaticImportPanel";
import { ImportChangeHistory } from "@/components/import/ImportChangeHistory";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  if (!(await isAdmin())) return <AdminLogin />;
  return (
    <main className="page-shell space-y-6">
      <header className="admin-page-header">
        <div className="admin-page-header__title"><span className="admin-eyebrow">Veri aktarımı</span><h1>Tur içe aktar</h1><p>Ejder Turizm 2026, 2027 ve EJDER VIP turlarını günlük senkronize edin.</p></div>
        <div className="admin-page-actions"><Link className="btn" href="/admin/tours">Tur listesi</Link></div>
      </header>
      <AutomaticImportPanel />
      <ImportChangeHistory />
    </main>
  );
}
