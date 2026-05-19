import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeTour, tourInclude } from "@/lib/tours";
import { PassengerTracker } from "@/components/passenger/PassengerTracker";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { isPrismaSetupError } from "@/lib/db-errors";
import { departureRelativeLabel, formatDepartureRange } from "@/lib/departure-status";

export const dynamic = "force-dynamic";

export default async function PassengerTourPage({ params, searchParams }: { params: Promise<{ tourId: string }>; searchParams: Promise<{ departureId?: string }> }) {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  const { tourId } = await params;
  const { departureId } = await searchParams;
  let tour: any;
  try {
    tour = serializeTour(await prisma.tour.findFirst({ where: { id: tourId, status: "PUBLISHED" }, include: tourInclude })) as any;
  } catch (error) {
    if (isPrismaSetupError(error)) return <SetupNotice />;
    throw error;
  }
  if (!tour) notFound();
  const departure = tour.departures.find((item: any) => item.id === departureId) || tour.departures[0] || null;
  return (
    <main className="p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>{departure ? <span className="badge">{formatDepartureRange(departure)} · {departureRelativeLabel(departure)}</span> : null}</div>
        <div className="flex gap-2">
          {tour.slug ? <Link className="btn" href={`/tour/${tour.slug}`}>Tur detayı</Link> : null}
          <Link className="btn" href="/passenger">Tüm turlar</Link>
        </div>
      </div>
      <PassengerTracker tour={{ ...tour, selectedDeparture: departure }} />
    </main>
  );
}
