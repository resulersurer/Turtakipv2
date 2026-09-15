import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Smartphone,
  Info,
  ShieldCheck,
  Building2,
  ExternalLink
} from "lucide-react";
import { PassengerFooter } from "@/components/passenger/PassengerFooter";

export const metadata: Metadata = {
  title: "ParafPara Kampanyası | Halkbank İş Birliği | Ejder Turizm",
  description:
    "13 Nisan – 31 Aralık 2026 tarihleri arasında Halkbank Paraf POS üzerinden tek seferde 200.000 TL – 400.000 TL arası harcamalara 10.000 TL ParafPara fırsatı ve kampanya koşulları.",
  alternates: { canonical: "/passenger/campaigns/halkbank-parafpara" },
  openGraph: {
    title: "ParafPara Kampanyası | Halkbank İş Birliği | Ejder Turizm",
    description:
      "Halkbank iş birliği ile tek seferde 200.000 TL – 400.000 TL harcamanıza 10.000 TL ParafPara hediye!",
    url: "/passenger/campaigns/halkbank-parafpara"
  }
};

const keyHighlights = [
  {
    icon: Coins,
    title: "Kampanya Özeti",
    description:
      "Halkbank Paraf POS üzerinden tek seferde yapılacak 200.000 TL – 400.000 TL arası harcamalarda 10.000 TL ParafPara kazanma fırsatı."
  },
  {
    icon: Calendar,
    title: "Kampanya Dönemi",
    description: "13 Nisan – 31 Aralık 2026 tarihleri arasında geçerlidir."
  },
  {
    icon: ShieldCheck,
    title: "Maksimum Kazanım",
    description:
      "Her müşteri kampanyadan yalnızca bir kez ve en fazla 10.000 TL ParafPara kazanabilir."
  },
  {
    icon: CreditCard,
    title: "Geçerli Kartlar",
    description:
      "Paraf, Parafly, sanal kartlar ve ek kartlar ile yapılan işlemler kampanyaya dahildir."
  },
  {
    icon: Smartphone,
    title: "Kampanya Takibi",
    description:
      "Katılım, kazanım ve tüm süreçlerin takibi Paraf Mobil uygulaması üzerinden gerçekleştirilmektedir."
  }
];

const detailedTerms = [
  "Halkbank iş birliği kapsamında düzenlenen kampanya, 13 Nisan – 31 Aralık 2026 tarihleri arasında geçerlidir.",
  "Kampanya kapsamında, Halkbank Paraf POS üzerinden tek seferde yapılacak 200.000 TL – 400.000 TL arası harcamalarda 10.000 TL ParafPara kazanımı sağlanır.",
  "Kampanya müşteri bazlıdır. Her müşteri kampanyadan yalnızca ilk uygun işlemi ile bir kez faydalanabilir ve en fazla 10.000 TL ParafPara kazanabilir.",
  "Kampanya; Paraf, Parafly, sanal kartlar ve ek kartlar ile yapılan işlemlerde geçerlidir.",
  "Paraf KOBİ, Paraf Esnaf Business kartlar, HalkCard, debit kartlar ve ParafPara kullanılarak yapılan ödemeler kampanya kapsamında değildir.",
  "Kampanya kapsamında gerçekleştirilen işlemlerin iptal veya iade edilmesi durumunda, ilgili işlemler kampanya kapsamı dışında kalır.",
  "İade sonrasında işlem tutarının kampanya şartlarında belirtilen minimum harcama tutarının altına düşmesi halinde, kazanılan ParafPara tutarı geri alınacaktır.",
  "Kampanya kapsamında kazanılan ParafPara’lar, Paraf POS bulunan tüm üye işyerlerinde kullanılabilir.",
  "Kampanya dahilinde kazanılan ParafPara’lar ile katlı kullanım yapılamaz.",
  "Kampanyaya ilişkin katılım, kazanım ve tüm süreçler Paraf Mobil üzerinden takip edilmektedir.",
  "Kampanya şartlarını sağlamayan işlemler için geriye dönük hak talebi oluşturulamaz."
];

export default function HalkbankCampaignPage() {
  return (
    <main className="min-h-screen bg-[#fcfafb] text-slate-800">
      {/* ── Üst Menü / Navbar ── */}
      <div className="sticky top-0 z-40 border-b border-[#ecdfe2] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/passenger" className="flex items-center gap-3">
            <img src="/logo.png" alt="Ejder Turizm" className="h-9 w-auto object-contain" />
          </Link>
          <Link
            href="/passenger"
            className="inline-flex items-center gap-2 rounded-xl border border-[#ecdfe2] bg-[#fbf5f6] px-3.5 py-2 text-xs font-bold text-[#7b1d2b] transition-all hover:border-[#cb596c] hover:bg-[#faebed]"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Tüm Turlara Dön
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* ── Ekmek Kırıntısı (Breadcrumbs) ── */}
        <nav aria-label="Ekmek Kırıntısı" className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/passenger" className="hover:text-[#7b1d2b] transition-colors">
            Turlar
          </Link>
          <span>/</span>
          <Link href="/passenger#campaigns-heading" className="hover:text-[#7b1d2b] transition-colors">
            Kampanyalar
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#7b1d2b]">Halkbank ParafPara</span>
        </nav>

        {/* ── Hero Banner Görseli ── */}
        <div className="group relative mb-8 overflow-hidden rounded-2xl border border-[#ebd2d7] bg-white shadow-lg transition-shadow duration-300 hover:shadow-xl">
          <div className="relative aspect-[1920/652] w-full overflow-hidden bg-slate-100">
            <Image
              src="https://image.elitema.com.tr/db_images/154/21/273/h-banner.png"
              alt="Halkbank ParafPara Kampanyası"
              width={1920}
              height={652}
              priority
              unoptimized
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>

        {/* ── Başlık & Özet Bilgi Başlığı ── */}
        <div className="mb-10 rounded-2xl border border-[#f0d4d9] bg-gradient-to-br from-white via-[#fef7f8] to-[#fcecee] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7b1d2b] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
              <Building2 size={13} aria-hidden="true" />
              Halkbank İş Birliği
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5bec5] bg-white px-3 py-1 text-[11px] font-bold text-[#7b1d2b]">
              <Calendar size={13} aria-hidden="true" />
              13 Nisan – 31 Aralık 2026
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#45121b]">
            ParafPara Kampanyası
          </h1>

          <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
            13 Nisan – 31 Aralık 2026 tarihleri arasında geçerli olan kampanyaya ilişkin tüm detaylar ve kullanım şartları aşağıda yer almaktadır.
          </p>
        </div>

        {/* ── Kampanya Temel Özellikleri / Özet Kartlar ── */}
        <section aria-labelledby="highlights-heading" className="mb-12">
          <h2 id="highlights-heading" className="mb-5 text-lg font-bold text-[#5c1523] flex items-center gap-2">
            <Info size={19} className="text-[#a83042]" />
            Kampanya Öne Çıkanları
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {keyHighlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="relative flex flex-col rounded-2xl border border-[#ebd7db] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#c9586a] hover:shadow-md"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#fbebee] to-[#f4d1d6] text-[#8e2434]">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-[#3d121b] mb-1.5">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Detaylı Şartlar & Koşullar ── */}
        <section aria-labelledby="terms-heading" className="mb-12 rounded-2xl border border-[#ebd5d9] bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between border-b border-[#f3e5e8] pb-4">
            <div>
              <h2 id="terms-heading" className="text-lg sm:text-xl font-bold text-[#45121b]">
                Detaylı Kampanya Şartları
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Lütfen kampanya katılımı öncesinde maddeleri dikkatle inceleyiniz.
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#fdf2f4] px-3 py-1 text-xs font-semibold text-[#8c2535]">
              {detailedTerms.length} Madde
            </span>
          </div>

          <ul className="space-y-3.5">
            {detailedTerms.map((term, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-xl border border-[#f5ebed] bg-[#fdfbfc] p-3.5 text-xs sm:text-sm leading-relaxed text-slate-700 transition-colors hover:border-[#ebd5d9] hover:bg-white"
              >
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#fce8eb] text-[#8e2434] font-bold text-[10px]">
                  {index + 1}
                </div>
                <span>{term}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Önemli Bilgilendirme / İptal & İade Uyarısı ── */}
        <section className="mb-12 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/90 to-amber-100/60 p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="rounded-xl bg-amber-500/15 p-2 text-amber-800">
              <AlertTriangle size={22} aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">Önemli Bilgilendirme</h3>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-amber-900">
                Kampanya kapsamına girmeyen işlemler, kart tipleri veya iade sonrası oluşan tutar değişiklikleri nedeniyle kazanılan ParafPara geri alınabilir.
              </p>
              <div className="mt-2 text-[11px] font-medium text-amber-800/80">
                Son güncelleme: 2026
              </div>
            </div>
          </div>
        </section>

        {/* ── Alt Aksiyon Alanı ── */}
        <div className="rounded-2xl border border-[#ebd2d7] bg-gradient-to-br from-[#681421] via-[#7d1d2c] to-[#992538] p-8 text-center text-white shadow-xl">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/90 mb-3">
            Halkbank & Ejder Turizm
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
            Seyahatinize 10.000 TL ParafPara Avantajıyla Başlayın
          </h2>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-white/80 leading-relaxed mb-6">
            Hayalinizdeki rotayı seçin, Halkbank Paraf ile ödemenizi yaparak kampanyadan hemen yararlanın.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/passenger"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs sm:text-sm font-bold text-[#7b1d2b] shadow-md transition-all hover:bg-slate-100 hover:shadow-lg"
            >
              Turları Keşfet <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a
              href="https://www.parafcard.com.tr/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/20"
            >
              Paraf Mobil Detayları <ExternalLink size={15} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Sayfa Altlığı (Footer) ── */}
      <PassengerFooter />
    </main>
  );
}
