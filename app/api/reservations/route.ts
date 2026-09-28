import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createReservation, getReservationDashboard } from "@/lib/reservations/service";
import { reservationErrorResponse } from "@/lib/reservations/http";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth) return auth;
  try {
    return NextResponse.json(await getReservationDashboard(request.nextUrl.searchParams.get("departureId") || undefined), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return reservationErrorResponse(error); }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth) return auth;
  try {
    return NextResponse.json(await createReservation(await request.json()), { status: 201 });
  } catch (error) { return reservationErrorResponse(error); }
}
