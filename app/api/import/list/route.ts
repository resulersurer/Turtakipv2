import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { importSchema } from "@/lib/validators";
import { parseTourList } from "@/lib/import/parseTourList";
import { databaseMissingResponse, databaseSchemaMissingResponse, hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const auth = await requireAdmin();
  if (auth) return auth;

  const { url } = importSchema.parse(await request.json());
  const links = await parseTourList(url);
  return NextResponse.json({ found: links.length, links });
}
