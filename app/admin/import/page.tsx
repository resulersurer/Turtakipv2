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
      <header className="admin-page-header">
        <div className="admin-page-header__title"><span className="admin-eyebrow">Veri aktarımı</span><h1>Tur içe aktar</h1><p>Tek bir turu veya bir liste sayfasındaki tüm turları taslak olarak aktarın; kontrol ettikten sonra yayınlayın.</p></div>
        <div className="admin-page-actions"><Link className="btn" href="/admin/tours">Tur listesi</Link></div>
      </header>
      <section className="grid gap-4 lg:grid-cols-2">
        <ImportPreview mode="tour" />
        <ImportPreview mode="list" />
      </section>
    </main>
  );
}
