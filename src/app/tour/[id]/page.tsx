export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { type Tour } from '@/types/tour';
import PassengerTourView from '@/components/passenger/PassengerTourView';

async function getTour(id: string): Promise<Tour | null> {
  return prisma.tour.findUnique({
    where: { id },
    include: { days: { orderBy: { dayNumber: 'asc' } } }
  });
}

export default async function TourPage(props: any) {
  const { params } = props;
  const tour = await getTour(params.id);
  if (!tour) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#040815] px-4 py-8 sm:px-6 lg:px-10">
      <PassengerTourView tour={tour} />
    </main>
  );
}
