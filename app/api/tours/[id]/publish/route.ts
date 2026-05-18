import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { databaseMissingResponse, databaseSchemaMissingResponse, hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const auth = await requireAdmin();
  if (auth) return auth;
  const { id } = await params;
  return NextResponse.json(await prisma.tour.update({ where: { id }, data: { status: "PUBLISHED" } }));
}
