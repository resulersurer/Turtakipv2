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
      <header className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">{tour ? "Tur düzenle" : "Yeni tur"}</h1><p className="text-slate-400">Program, çıkış tarihleri ve harita pinleri.</p></div>
        <Link className="btn" href="/admin/tours">Liste</Link>
      </header>
      <TourForm initial={tour ? (serializeTour(tour) as any) : undefined} />
    </main>
  );
}
