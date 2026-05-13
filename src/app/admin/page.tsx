import TourEditor from '@/components/admin/TourEditor';

export default function AdminPage(props: any) {
  const { searchParams } = props;

  return (
    <main className="min-h-screen bg-[#040815] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8">
        <div className="rounded-[28px] border border-white/10 bg-[#071029]/90 p-8 shadow-glass backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-brand-200">Admin panel</p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Yeni tur oluştur ve yönet</h1>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-300">
              Salacaktan Kapadokya'ya ya da Ege sahillerine, her turunuzu günlere bölün, haritada planlayın ve yolcu paneli linkini paylaşın.
            </p>
          </div>
          <TourEditor tourId={searchParams.tourId ?? ''} />
        </div>
      </div>
    </main>
  );
}
