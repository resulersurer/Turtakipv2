import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeTour, tourInclude } from "@/lib/tours";
import { PublicMap } from "@/components/maps/PublicMap";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { isPrismaSetupError } from "@/lib/db-errors";
import { compactTourMeta } from "@/lib/display";

export const dynamic = "force-dynamic";

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  const { slug } = await params;
  let tour: any;
  try {
    tour = serializeTour(await prisma.tour.findFirst({ where: { slug, status: "PUBLISHED" }, include: tourInclude })) as any;
  } catch (error) {
    if (isPrismaSetupError(error)) return <SetupNotice />;
    throw error;
  }
  if (!tour) notFound();
  const meta = compactTourMeta([tour.departureCity, tour.airline, tour.visaStatus]);

  return (
    <main className="page-shell space-y-6">
      <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <span className="badge">{tour.durationDays || "-"} gün</span>
          <h1 className="mt-3 text-3xl font-semibold">{tour.name}</h1>
          {meta ? <p className="mt-2 text-slate-400">{meta}</p> : null}
          <div className="mt-4 flex gap-2">
            <Link className="btn-primary rounded-md" href={`/passenger/${tour.id}`}>Yolcu takip görünümü</Link>
            <Link className="btn" href="/tours">Tüm turlar</Link>
          </div>
        </div>
        {tour.coverImageUrl ? <div className="min-h-56 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${tour.coverImageUrl})` }} /> : null}
      </header>
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel rounded-lg p-4 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Rota</h2>
          <div className="h-[420px]"><PublicMap days={tour.days} /></div>
        </div>
        <div className="panel rounded-lg p-4">
          <h2 className="mb-3 font-semibold">Çıkış tarihleri</h2>
          <div className="space-y-2">
            {tour.departures.map((departure: any) => (
              <div className="rounded-md border border-line bg-ink/70 p-3 text-sm" key={departure.id}>
                <div>{new Date(departure.startDate).toLocaleDateString("tr-TR")}</div>
                <div className="text-slate-400">{departure.price ? `${departure.price} ${departure.currency}` : departure.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tur programı</h2>
        {tour.days.map((day: any) => (
          <article className="panel rounded-lg p-4" key={day.id}>
            <div className="text-sm text-mint">{day.dayNumber}. Gün • {[day.city, day.country].filter(Boolean).join(", ")}</div>
            <h3 className="mt-1 font-semibold">{day.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{day.description}</p>
          </article>
        ))}
      </section>
      {tour.images.length ? <section className="grid gap-3 md:grid-cols-4">{tour.images.map((image: any) => <div className="h-40 rounded-md bg-cover bg-center" key={image.id} style={{ backgroundImage: `url(${image.url})` }} />)}</section> : null}
    </main>
  );
}
