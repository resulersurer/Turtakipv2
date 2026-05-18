import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { importSchema } from "@/lib/validators";
import { parseTourPage } from "@/lib/import/parseTourPage";
import { serializeTour, upsertImportedTour } from "@/lib/tours";
import { databaseMissingResponse, databaseSchemaMissingResponse, hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const auth = await requireAdmin();
  if (auth) return auth;
  const { url } = importSchema.parse(await request.json());
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
    return NextResponse.json({ tour: serializeTour(tour), log: serializeTour(log), warnings: parsed.warnings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    await prisma.importLog.create({ data: { sourceUrl: url, status: "FAILED", message } });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
