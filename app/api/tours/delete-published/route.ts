import { reservationErrorResponse } from "@/lib/reservations/http";
import { NextRequest, NextResponse } from "next/server";
import { TourStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { databaseMissingResponse, databaseSchemaMissingResponse, hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { deleteToursByStatus } from "@/lib/tours";

export async function POST(request: NextRequest) {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const auth = await requireAdmin();
  if (auth) return auth;

  let count: number;
  try { count = await deleteToursByStatus(TourStatus.PUBLISHED); } catch (error) { return reservationErrorResponse(error); }
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    return NextResponse.redirect(new URL(request.headers.get("referer") || "/admin/tours", request.url));
  }

  return NextResponse.json({ ok: true, count });
}
