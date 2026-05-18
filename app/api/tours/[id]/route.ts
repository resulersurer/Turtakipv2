import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { deleteTour, saveTour, serializeTour, tourInclude } from "@/lib/tours";
import { databaseMissingResponse, databaseSchemaMissingResponse, hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { isPrismaSetupError } from "@/lib/db-errors";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const { id } = await params;
  let tour;
  try {
    tour = await prisma.tour.findUnique({ where: { id }, include: tourInclude });
  } catch (error) {
    if (isPrismaSetupError(error)) return databaseSchemaMissingResponse();
    throw error;
  }
  if (!tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  return NextResponse.json(serializeTour(tour));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const auth = await requireAdmin();
  if (auth) return auth;
  const { id } = await params;
  const tour = await saveTour(await request.json(), id);
  return NextResponse.json(serializeTour(tour));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
