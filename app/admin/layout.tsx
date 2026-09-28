import type { Metadata } from "next";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { isAdmin } from "@/lib/auth";
import "./admin.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await isAdmin();
  return (
    <div className="admin-theme">
      {authenticated ? <AdminNavigation /> : null}
      <div className={authenticated ? "admin-workspace" : "admin-workspace admin-workspace--guest"}>{children}</div>
    </div>
  );
}
