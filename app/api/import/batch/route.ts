import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseTourPage } from "@/lib/import/parseTourPage";
import { serializeTour, upsertImportedTour } from "@/lib/tours";
import { databaseMissingResponse, databaseSchemaMissingResponse, hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { refreshImportJobStatus } from "@/lib/import/jobs";

export const maxDuration = 120;

const batchSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(5),
  jobId: z.string().optional()
});

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const auth = await requireAdmin();
  if (auth) return auth;

  const { urls, jobId } = batchSchema.parse(await request.json());
  const results = [];

  if (jobId) {
    await prisma.importJobItem.updateMany({
      where: { jobId, url: { in: urls } },
      data: { status: "PROCESSING", error: null }
    });
  }

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
      if (jobId) {
        await prisma.importJobItem.updateMany({
          where: { jobId, url },
          data: { status: "SUCCESS", tourId: tour.id, tourName: tour.name, error: null }
        });
      }
      results.push({ url, status: "SUCCESS", tour: serializeTour(tour), log: serializeTour(log), warnings: parsed.warnings });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      await prisma.importLog.create({ data: { sourceUrl: url, status: "FAILED", message } });
      if (jobId) {
        await prisma.importJobItem.updateMany({
          where: { jobId, url },
          data: { status: "FAILED", error: message }
        });
      }
      results.push({ url, status: "FAILED", error: message });
    }
    await wait(900 + Math.floor(Math.random() * 700));
  }

  if (jobId) await refreshImportJobStatus(jobId);

  return NextResponse.json({
    processed: results.length,
    success: results.filter((item) => item.status === "SUCCESS").length,
    failed: results.filter((item) => item.status === "FAILED").length,
    results
  });
}
