import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseTourPage } from "@/lib/import/parseTourPage";
import { serializeTour, upsertImportedTour } from "@/lib/tours";
import { databaseMissingResponse, databaseSchemaMissingResponse, hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";

export const maxDuration = 120;

const batchSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(5)
});

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const auth = await requireAdmin();
  if (auth) return auth;

  const { urls } = batchSchema.parse(await request.json());
  const results = [];

  for (const url of urls) {
    try {
      const parsed = await parseTourPage(url);
      const tour = await upsertImportedTour(parsed);
      const log = await prisma.importLog.create({
        data: {
          sourceUrl: url,
          tourId: tour.id,
          status: parsed.warnings.length ? "PARTIAL" : "SUCCESS",
          message: parsed.warnings.length ? parsed.warnings.join(" ") : "Tur taslak olarak içe aktarıldı.",
          rawSummary: {
            name: parsed.name,
            departures: parsed.departures.length,
            days: parsed.days.length,
            images: parsed.images.length,
            warnings: parsed.warnings
          }
        }
      });
      results.push({ url, status: "SUCCESS", tour: serializeTour(tour), log: serializeTour(log), warnings: parsed.warnings });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      await prisma.importLog.create({ data: { sourceUrl: url, status: "FAILED", message } });
      results.push({ url, status: "FAILED", error: message });
    }
    await wait(900 + Math.floor(Math.random() * 700));
  }

  return NextResponse.json({
    processed: results.length,
    success: results.filter((item) => item.status === "SUCCESS").length,
    failed: results.filter((item) => item.status === "FAILED").length,
    results
  });
}
