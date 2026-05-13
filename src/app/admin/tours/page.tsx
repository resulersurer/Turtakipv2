export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import SavedToursList from '@/components/admin/SavedToursList';
import { Tour } from '@/types/tour';

async function getTours() {
  const tours = await prisma.tour.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { days: { orderBy: { dayNumber: 'asc' } } }
  });
  return tours;
}

export default async function SavedToursPage() {
  const tours = await getTours();

  return (
    <main className="min-h-screen bg-[#040815] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px] rounded-[28px] border border-white/10 bg-[#071029]/90 p-8 shadow-glass backdrop-blur-xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-brand-200">Kayıtlı turlar</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Tüm rotalarınızı yönetin</h1>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-300">
            Gelişmiş arama ve filtreleme ile tarih, ay ya da haftanın gününe göre tur bulabilirsiniz.
          </p>
        </div>
        <SavedToursList tours={tours} />
      </div>
    </main>
  );
}
