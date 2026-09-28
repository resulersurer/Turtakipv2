import { isAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/AdminLogin";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { ReservationDashboard } from "@/components/reservations/ReservationDashboard";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  return <ReservationDashboard />;
}
