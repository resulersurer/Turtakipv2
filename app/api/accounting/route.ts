import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { applyAccountingAction, getAccountingDashboard } from "@/lib/accounting";
import { reservationErrorResponse } from "@/lib/reservations/http";

export const dynamic = "force-dynamic";
export async function GET() { const auth = await requireAdmin(); if (auth) return auth; try { return NextResponse.json(await getAccountingDashboard(), { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return reservationErrorResponse(error); } }
export async function POST(request: NextRequest) { const auth = await requireAdmin(); if (auth) return auth; try { return NextResponse.json(await applyAccountingAction(await request.json()), { status: 201 }); } catch (error) { return reservationErrorResponse(error); } }
