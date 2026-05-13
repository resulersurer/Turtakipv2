import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tourPayloadSchema } from '@/lib/validations';

export async function GET() {
  const tours = await prisma.tour.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { days: { orderBy: { dayNumber: 'asc' } } }
  });
  return NextResponse.json(tours);
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parseResult = tourPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.flatten() }, { status: 422 });
  }

  const tourData = parseResult.data;

  if (tourData.id) {
    const updated = await prisma.tour.update({
      where: { id: tourData.id },
      data: {
        name: tourData.name,
        startDate: tourData.startDate,
        endDate: tourData.endDate,
        days: {
          deleteMany: {},
          create: tourData.days.map((day) => ({
            dayNumber: day.dayNumber,
            date: day.date,
            hour: day.hour || null,
            city: day.city || null,
            country: day.country || null,
            activity: day.activity || null,
            photoUrl: day.photoUrl || null,
            lat: day.lat ?? null,
            lng: day.lng ?? null
          }))
        }
      },
      include: { days: true }
    });

    return NextResponse.json(updated);
  }

  const created = await prisma.tour.create({
    data: {
      name: tourData.name,
      startDate: tourData.startDate,
      endDate: tourData.endDate,
      days: {
        create: tourData.days.map((day) => ({
          dayNumber: day.dayNumber,
          date: day.date,
          hour: day.hour || null,
          city: day.city || null,
          country: day.country || null,
          activity: day.activity || null,
          photoUrl: day.photoUrl || null,
          lat: day.lat ?? null,
          lng: day.lng ?? null
        }))
      }
    },
    include: { days: true }
  });

  return NextResponse.json(created);
}
