import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { listToursQuerySchema } from "@/lib/validators";
import { saveTour, serializeTour, tourInclude } from "@/lib/tours";
import { databaseMissingResponse, databaseSchemaMissingResponse, hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { isPrismaSetupError } from "@/lib/db-errors";

export async function GET(request: NextRequest) {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = listToursQuerySchema.parse(params);
  const where = {
    status: query.status,
    OR: query.q
      ? [
          { name: { contains: query.q, mode: "insensitive" as const } },
          { days: { some: { city: { contains: query.q, mode: "insensitive" as const } } } }
        ]
      : undefined,
    departures:
      query.month || query.weekday != null
        ? {
            some: {
              startDate: {
                gte: query.month ? new Date(new Date().getFullYear(), query.month - 1, 1) : undefined,
                lt: query.month ? new Date(new Date().getFullYear(), query.month, 1) : undefined
              }
            }
          }
        : undefined
  };
  let tours;
  try {
    tours = await prisma.tour.findMany({ where, include: tourInclude, orderBy: { updatedAt: "desc" } });
  } catch (error) {
    if (isPrismaSetupError(error)) return databaseSchemaMissingResponse();
    throw error;
  }
  const filtered = tours.filter((tour) => {
    if (query.weekday == null) return true;
    return tour.departures.some((departure) => departure.startDate.getDay() === query.weekday);
  });
  return NextResponse.json(serializeTour(filtered));
}

export async function POST(request: NextRequest) {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const auth = await requireAdmin();
  if (auth) return auth;
  const tour = await saveTour(await request.json());
  return NextResponse.json(serializeTour(tour), { status: 201 });
}
