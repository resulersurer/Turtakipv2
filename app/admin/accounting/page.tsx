import { isAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/AdminLogin";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { AccountingDashboard } from "@/components/accounting/AccountingDashboard";

export const dynamic = "force-dynamic";
export default async function AccountingPage() { if (!(await isAdmin())) return <AdminLogin />; if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />; return <AccountingDashboard />; }
