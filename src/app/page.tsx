import Link from 'next/link';
import { ArrowRight, MapPin, Plane } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-12 sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-0 bg-hero-gradient opacity-80" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10">
        <section className="rounded-[32px] border border-white/10 bg-[#08122d]/90 p-10 shadow-glass backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/15 px-4 py-2 text-sm font-semibold text-brand-100">
                <MapPin className="h-4 w-4" /> Premium tur deneyimi
              </span>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                TURTAKIP Next ile tur altyapınızı modernize edin
              </h1>
              <p className="max-w-2xl leading-8 text-slate-300">
                Tur programı oluşturun, günlerinizi haritada planlayın, yolcu paneli ile tüm katılımcılara premium bir deneyim sunun.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link href="/admin" className="inline-flex items-center justify-center rounded-3xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">
                Admin Paneline Git
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/tour/preview" className="inline-flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-brand-400/50 hover:text-brand-100">
                Yolcu Panelini İncele
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[32px] border border-white/10 bg-panel p-8 shadow-panel">
            <span className="text-sm uppercase tracking-[0.24em] text-brand-200">Yönetim</span>
            <h2 className="mt-4 text-3xl font-semibold text-white">Tur yönetimini tek panelde toplayın</h2>
            <p className="mt-4 text-slate-300">
              Yeni tur oluşturun, turunuzu düzenleyin, rota ve konum detayları ekleyin. Bütün günleriniz bir arada, taşınabilir ve paylaşılabilir.
            </p>
            <div className="mt-8 space-y-4 text-sm text-slate-400">
              <p>• Tarih aralığına göre gün oluşturma</p>
              <p>• Harita tıklaması ile konum seçme</p>
              <p>• Drag & drop sıralama</p>
            </div>
          </article>

          <article className="rounded-[32px] border border-white/10 bg-panel p-8 shadow-panel">
            <span className="text-sm uppercase tracking-[0.24em] text-brand-200">Yolcu deneyimi</span>
            <h2 className="mt-4 text-3xl font-semibold text-white">İlham veren bir seyahat takvimi sunun</h2>
            <p className="mt-4 text-slate-300">
              İstanbul, Kapadokya veya dünya turu fark etmeksizin yolcularınıza gün gün görsel bir rota sunun.
            </p>
            <div className="mt-8 space-y-4 text-sm text-slate-400">
              <p>• Harita + rota görselleştirme</p>
              <p>• Gün detay kartları</p>
              <p>• Mobil öncelikli kullanıcı arayüzü</p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
