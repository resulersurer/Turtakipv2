import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { serializeTour } from "@/lib/tours";
import { databaseMissingResponse, databaseSchemaMissingResponse, hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";

export async function GET() {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const auth = await requireAdmin();
  if (auth) return auth;
  const logs = await prisma.importLog.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { tour: true } });
  return NextResponse.json(serializeTour(logs));
}
