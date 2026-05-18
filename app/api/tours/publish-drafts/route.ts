import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { databaseMissingResponse, databaseSchemaMissingResponse, hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const auth = await requireAdmin();
  if (auth) return auth;

  const result = await prisma.tour.updateMany({
    where: { status: "DRAFT" },
    data: { status: "PUBLISHED" }
  });

  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    return NextResponse.redirect(new URL(request.headers.get("referer") || "/admin", request.url));
  }

  return NextResponse.json({ ok: true, count: result.count });
}
