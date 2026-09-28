import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { changeReservationStatus } from "@/lib/reservations/service";
import { reservationErrorResponse } from "@/lib/reservations/http";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth) return auth;
  try {
    const { id } = await params;
    return NextResponse.json(await changeReservationStatus(id, await request.json()));
  } catch (error) { return reservationErrorResponse(error); }
}
