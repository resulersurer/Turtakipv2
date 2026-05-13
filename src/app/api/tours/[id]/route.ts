import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, context: any) {
  const tour = await prisma.tour.findUnique({
    where: { id: context.params.id },
    include: { days: { orderBy: { dayNumber: 'asc' } } }
  });

  if (!tour) {
    return NextResponse.json({ error: 'Tur bulunamadı' }, { status: 404 });
  }

  return NextResponse.json(tour);
}

export async function DELETE(request: Request, context: any) {
  await prisma.tour.delete({ where: { id: context.params.id } });
  return NextResponse.json({ success: true });
}
