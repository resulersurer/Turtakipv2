import Link from "next/link";
import { SetupForm } from "@/components/SetupForm";

export function SetupNotice() {
  const isProduction = process.env.NODE_ENV === "production";
  return (
    <main className="page-shell flex min-h-screen flex-col items-center justify-center gap-5">
      <section className="panel max-w-3xl rounded-lg p-6">
        <span className="badge">Kurulum gerekli</span>
        <h1 className="mt-4 text-2xl font-semibold">{isProduction ? "Production ayarları eksik" : "Veritabanı kurulumu tamamlanmadı"}</h1>
        <p className="mt-3 leading-6 text-slate-300">
          {isProduction
            ? "Vercel ortamında environment variable değerleri dashboard üzerinden tanımlanmalıdır. Deploy build sırasında Prisma migration otomatik çalışır."
            : "Uygulama Prisma ile PostgreSQL bekliyor. `DATABASE_URL` eksikse bağlantı adresini kaydedin; bağlantı varsa `/setup` ekranından `Prisma db push` çalıştırarak tabloları oluşturun."}
        </p>
        <div className="mt-4 rounded-md border border-line bg-ink/80 p-4 text-sm text-slate-200">
          <code>DATABASE_URL=&quot;postgresql://USER:PASSWORD@HOST:5432/ejder?sslmode=require&quot;</code>
          <br />
          <code>ADMIN_PASSWORD=&quot;change-me&quot;</code>
          <br />
          <code>ADMIN_COOKIE_SECRET=&quot;uzun-rastgele-bir-deger&quot;</code>
          <br />
          <code>BLOB_READ_WRITE_TOKEN=&quot;opsiyonel-vercel-blob-token&quot;</code>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {!isProduction ? <Link className="btn-primary rounded-md" href="/setup">Web arayüzünden kur</Link> : null}
          <Link className="btn" href="/tours">Tur listesi</Link>
        </div>
      </section>
      {!isProduction ? <SetupForm /> : null}
    </main>
  );
}
