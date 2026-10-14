export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import PassengerDashboard from '@/components/passenger/PassengerDashboard';
import { SAMPLE_PASSENGER_TOURS } from '@/lib/passengerSampleData';
import type { EnrichedTourItem } from '@/components/passenger/PassengerTourCard';

async function getPassengerTours(): Promise<EnrichedTourItem[]> {
  try {
    const dbTours = await prisma.tour.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { days: { orderBy: { dayNumber: 'asc' } } }
    }).catch((err) => {
      console.warn('Could not fetch tours from database, using sample tours:', err?.message);
      return null;
    });

    if (!dbTours || dbTours.length === 0) {
      return SAMPLE_PASSENGER_TOURS;
    }

    // Map and enrich database tours
    const enrichedDbTours: EnrichedTourItem[] = dbTours.map((tour) => {
      const daysCount = tour.days.length;
      const pointsCount = tour.days.filter((d) => d.lat != null && d.lng != null).length;
      return {
        ...tour,
        airline: 'TÜRK HAVA YOLLARI',
        originCity: 'İstanbul',
        year: '2026',
        coverImage: tour.days[0]?.photoUrl || undefined,
        totalDaysCount: daysCount > 0 ? daysCount : 7,
        totalPointsCount: pointsCount > 0 ? pointsCount : daysCount,
        activeDayIndex: Math.max(1, Math.min(daysCount, 3)),
        statusText: `${daysCount > 0 ? Math.min(daysCount, 3) : 1}. günü devam ediyor`,
        statusType: 'ongoing'
      };
    });

    // Combine database tours with sample tours so the global map and 29 countries are richly populated
    const dbTourIds = new Set(enrichedDbTours.map((t) => t.id));
    const remainingSamples = SAMPLE_PASSENGER_TOURS.filter((t) => !dbTourIds.has(t.id));

    return [...enrichedDbTours, ...remainingSamples];
  } catch (error) {
    console.warn('Error in getPassengerTours, falling back to sample tours:', error);
    return SAMPLE_PASSENGER_TOURS;
  }
}

export default async function PassengerPage() {
  const tours = await getPassengerTours();

  return (
    <main className="min-h-screen bg-[#040815] px-3 py-6 sm:px-6 sm:py-8 lg:px-10">
      <PassengerDashboard initialTours={tours} />
    </main>
  );
}
