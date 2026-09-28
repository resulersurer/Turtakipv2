import { NextRequest, NextResponse } from "next/server";
import { getMemberAuth } from "@/lib/members/auth";
import { createMemberReservation } from "@/lib/reservations/service";
import { reservationErrorResponse } from "@/lib/reservations/http";

export const dynamic = "force-dynamic";

function hasValidOrigin(request: NextRequest) {
  const value = request.headers.get("origin");
  if (!value) return false;
  try {
    const origin = new URL(value);
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || new URL(request.url).protocol.replace(":", "");
    return Boolean(host) && origin.host === host && origin.protocol === `${protocol}:`;
  } catch { return false; }
}

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
  }
  const auth = getMemberAuth();
  if (!auth) return NextResponse.json({ error: "Üyelik hizmeti kullanılamıyor." }, { status: 503 });
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return NextResponse.json({ error: "Rezervasyon için giriş yapın." }, { status: 401 });
    const reservation = await createMemberReservation(await request.json(), {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email
    });
    return NextResponse.json({ id: reservation.id, code: reservation.code, seats: reservation.seats }, { status: 201 });
  } catch (error) {
    return reservationErrorResponse(error);
  }
}
