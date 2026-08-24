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
    <main className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>{departure ? <span className="inline-flex items-center rounded-md border border-[#7f1d1d]/20 bg-[#7f1d1d]/5 px-2 py-1 text-xs font-medium text-[#7f1d1d]">{formatDepartureRange(departure)} · {departureRelativeLabel(departure)}</span> : null}</div>
        <div className="flex gap-2">
          {tour.slug ? <Link className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#7f1d1d]/20 bg-[#7f1d1d]/5 px-3 py-2 text-sm font-medium text-[#7f1d1d] transition hover:bg-[#7f1d1d]/10" href={`/tour/${tour.slug}`}>Tur detayı</Link> : null}
          <Link className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#7f1d1d]/40 bg-[#7f1d1d] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#7f1d1d]/90" href="/passenger">Tüm turlar</Link>
        </div>
      </div>
      <PassengerTracker tour={{ ...tour, selectedDeparture: departure }} />
    </main>
  );
}
