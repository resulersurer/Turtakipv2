import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { serializeTour, tourInclude } from "@/lib/tours";
import { databaseMissingResponse, databaseSchemaMissingResponse, hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabaseUrl()) return databaseMissingResponse();
  if (!(await isDatabaseSchemaReady())) return databaseSchemaMissingResponse();
  const auth = await requireAdmin();
  if (auth) return auth;
  const { id } = await params;
  const source = await prisma.tour.findUnique({ where: { id }, include: tourInclude });
  if (!source) return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  const copy = await prisma.tour.create({
    data: {
      name: `${source.name} Kopya`,
      slug: `${slugify(source.name)}-kopya-${Date.now()}`,
      durationDays: source.durationDays,
      departureCity: source.departureCity,
      airline: source.airline,
      visaStatus: source.visaStatus,
      coverImageUrl: source.coverImageUrl,
      status: "DRAFT",
      departures: { create: source.departures.map(({ startDate, endDate, label, price, currency, availabilityStatus }) => ({ startDate, endDate, label, price, currency, availabilityStatus })) },
      days: { create: source.days.map(({ dayNumber, title, dateOffset, hour, city, country, description, hotelInfo, flightInfo, photoUrl, lat, lng, sortOrder }) => ({ dayNumber, title, dateOffset, hour, city, country, description, hotelInfo, flightInfo, photoUrl, lat, lng, sortOrder })) },
      images: { create: source.images.map(({ url, alt, sortOrder }) => ({ url, alt, sortOrder })) },
      prices: { create: source.prices.map(({ roomType, adultPrice, childPrice, currency }) => ({ roomType, adultPrice, childPrice, currency })) }
    },
    include: tourInclude
  });
  return NextResponse.json(serializeTour(copy), { status: 201 });
}
