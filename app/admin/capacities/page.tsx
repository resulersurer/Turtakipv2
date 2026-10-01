import { isAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/AdminLogin";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { prisma } from "@/lib/prisma";
import { occupancy } from "@/lib/reservations/domain";
import { CapacityDashboard } from "@/components/reservations/CapacityDashboard";

export const dynamic = "force-dynamic";

export default async function CapacitiesPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  const tours = await prisma.tour.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, status: true, departures: {
      orderBy: { startDate: "asc" },
      select: { id: true, startDate: true, capacity: true, blockedSeats: true, reservations: { select: { status: true, seats: true, holdExpiresAt: true } } }
    } }
  });
  const now = new Date();
  return <CapacityDashboard tours={tours.map((tour) => ({ ...tour, departures: tour.departures.map(({ reservations, ...departure }) => ({ ...departure, startDate: departure.startDate.toISOString(), summary: occupancy(departure.capacity, departure.blockedSeats, reservations, now) })) }))} />;
}
