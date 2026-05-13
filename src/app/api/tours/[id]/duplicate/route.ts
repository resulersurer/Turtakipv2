import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, context: any) {
  const source = await prisma.tour.findUnique({
    where: { id: context.params.id },
    include: { days: { orderBy: { dayNumber: 'asc' } } }
  });

  if (!source) {
    return NextResponse.json({ error: 'Tur bulunamadı' }, { status: 404 });
  }

  const duplicated = await prisma.tour.create({
    data: {
      name: `${source.name} (Kopya)`,
      startDate: source.startDate,
      endDate: source.endDate,
      days: {
        create: source.days.map((day) => ({
          dayNumber: day.dayNumber,
          date: day.date,
          hour: day.hour,
          city: day.city,
          country: day.country,
          activity: day.activity,
          photoUrl: day.photoUrl,
          lat: day.lat,
          lng: day.lng
        }))
      }
    },
    include: { days: true }
  });

  return NextResponse.json(duplicated);
}
