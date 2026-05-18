import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { databaseMissingResponse, databaseSchemaMissingResponse, hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { deleteTour } from "@/lib/tours";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const auth = await requireAdmin();
  if (auth) return auth;

  const { id } = await params;
  await deleteTour(id);

  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    return NextResponse.redirect(new URL(request.headers.get("referer") || "/admin/tours", request.url));
  }

  return NextResponse.json({ ok: true });
}
