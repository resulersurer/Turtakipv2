import Link from "next/link";
import { SetupForm } from "@/components/SetupForm";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  const isProduction = process.env.NODE_ENV === "production";
  return (
    <main className="page-shell min-h-screen space-y-5">
      <div className="flex justify-end">
        <Link className="btn" href="/passenger">Uygulamaya dön</Link>
      </div>
      {isProduction ? (
        <section className="panel max-w-3xl rounded-lg p-6">
          <span className="badge">Production</span>
          <h1 className="mt-4 text-2xl font-semibold">Vercel environment ayarları kullanılır</h1>
          <p className="mt-3 text-slate-300">
            Production ortamında `.env` web arayüzünden yazılmaz. Vercel Project Settings üzerinden `DATABASE_URL`,
            `ADMIN_PASSWORD`, `ADMIN_COOKIE_SECRET` ve gerekiyorsa `BLOB_READ_WRITE_TOKEN` ekleyin.
          </p>
        </section>
      ) : (
        <SetupForm />
      )}
    </main>
  );
}
