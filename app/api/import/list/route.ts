import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { importSchema } from "@/lib/validators";
import { parseTourList } from "@/lib/import/parseTourList";
import { parseTourPage } from "@/lib/import/parseTourPage";
import { upsertImportedTour, serializeTour } from "@/lib/tours";
import { prisma } from "@/lib/prisma";
import { databaseMissingResponse, databaseSchemaMissingResponse, hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const auth = await requireAdmin();
  if (auth) return auth;
  const { url } = importSchema.parse(await request.json());
  const links = await parseTourList(url);
  const results = [];
  const concurrency = 3;
  for (let index = 0; index < links.length; index += concurrency) {
    const batch = links.slice(index, index + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (link) => {
        try {
          const parsed = await parseTourPage(link);
          const tour = await upsertImportedTour(parsed);
          return { url: link, status: parsed.warnings.length ? "PARTIAL" : "SUCCESS", tour: serializeTour(tour), warnings: parsed.warnings };
        } catch (error) {
          return { url: link, status: "FAILED", error: error instanceof Error ? error.message : "Import failed" };
        }
      })
    );
    results.push(...batchResults);
  }
  await prisma.importLog.create({
    data: {
      sourceUrl: url,
      status: results.some((result) => result.status === "FAILED") ? "PARTIAL" : "SUCCESS",
      message: `${results.length} tur işlendi, ${links.length} link bulundu.`,
      rawSummary: { links, results: results.map((result) => ({ url: result.url, status: result.status })) }
    }
  });
  return NextResponse.json({ found: links.length, imported: results.length, results });
}
