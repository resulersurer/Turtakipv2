import Link from 'next/link';

export default function TourPreviewPage() {
  return (
    <main className="min-h-screen bg-[#040815] px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-[#07122f]/90 p-10 shadow-glass backdrop-blur-xl text-center">
        <h1 className="text-4xl font-semibold text-white">Yolcu paneli örneği</h1>
        <p className="mt-4 text-slate-300">
          Kaydolan bir turunuz olduğunda bu sayfada gerçek bir yolcu paneli önizleyebilirsiniz. Yeni bir tur oluşturmak için lütfen admin paneline gidin.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/admin" className="rounded-3xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">
            Admin Paneline Git
          </Link>
          <Link href="/admin/tours" className="rounded-3xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-brand-400">
            Kayıtlı Turları Gör
          </Link>
        </div>
      </div>
    </main>
  );
}
