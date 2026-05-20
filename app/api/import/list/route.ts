import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { importSchema } from "@/lib/validators";
import { parseTourList } from "@/lib/import/parseTourList";
import { databaseMissingResponse, databaseSchemaMissingResponse, hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { createOrUpdateImportJob, getLatestImportJob } from "@/lib/import/jobs";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const auth = await requireAdmin();
  if (auth) return auth;

  const sourceUrl = request.nextUrl.searchParams.get("sourceUrl") || undefined;
  const job = await getLatestImportJob(sourceUrl);
  return NextResponse.json({ job });
}

export async function POST(request: NextRequest) {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const auth = await requireAdmin();
  if (auth) return auth;

  const { url } = importSchema.parse(await request.json());
  const links = await parseTourList(url);
  const job = await createOrUpdateImportJob(url, links);
  return NextResponse.json({ found: links.length, links, job });
}
