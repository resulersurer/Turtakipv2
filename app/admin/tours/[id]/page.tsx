import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/AdminLogin";
import { TourForm } from "@/components/tours/TourForm";
import { serializeTour, tourInclude } from "@/lib/tours";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { isPrismaSetupError } from "@/lib/db-errors";

export const dynamic = "force-dynamic";

export default async function AdminTourEditPage({ params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  if (!(await isAdmin())) return <AdminLogin />;
  const { id } = await params;
  let tour = null;
  try {
    tour = id === "new" ? null : await prisma.tour.findUnique({ where: { id }, include: tourInclude });
  } catch (error) {
    if (isPrismaSetupError(error)) return <SetupNotice />;
    throw error;
  }
  if (id !== "new" && !tour) notFound();
  return (
    <main className="page-shell space-y-5">
      <header className="admin-page-header">
        <div className="admin-page-header__title"><span className="admin-eyebrow">Tur operasyonu</span><h1>{tour ? "Tur düzenle" : "Yeni tur"}</h1><p>Temel bilgiler, çıkış tarihleri, fiyatlar, günlük program ve harita noktalarını yönetin.</p></div>
        <div className="admin-page-actions"><Link className="btn" href="/admin/tours">Tur listesine dön</Link></div>
      </header>
      <TourForm initial={tour ? (serializeTour(tour) as any) : undefined} />
    </main>
  );
}
