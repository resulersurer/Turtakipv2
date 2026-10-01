import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, WalletCards } from "lucide-react";
import { tourCollections } from "@/lib/tour-collections";

const order = ["asya", "uzak-rotalar", "vizesiz", "latin", "afrika"];
const routeCards = [
  ...order.slice(0, 2).map((slug) => tourCollections.find((item) => item.slug === slug)!),
  { slug: "2026", title: "2026 Turları", image: "https://image.elitema.com.tr/db_images/154/21/269/img-5897.png" },
  ...order.slice(2).map((slug) => tourCollections.find((item) => item.slug === slug)!)
];

export function CampaignSection() {
  return <section aria-labelledby="campaigns-heading" className="campaigns-section">
    <div className="campaigns-inner">
      <div className="campaigns-header"><div><span className="campaigns-eyebrow">YENİ YOLCULUKLAR</span><h2 id="campaigns-heading" className="campaigns-title">Kampanyalar</h2><p className="campaigns-subtitle">Rotanızı seçin, seyahatinize avantaj katın.</p></div><Link className="campaigns-all" href="/tours">Tüm turlar <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      <div className="campaigns-grid">
        {routeCards.map((card) => <Link key={card.slug} href={card.slug === "2026" ? "/passenger/tours/2026" : `/passenger/collections/${card.slug}`} className="campaign-route">
          <span className={`campaign-route__image campaign-route__image--${card.slug}`}><Image src={card.image} alt="" fill sizes="(max-width: 600px) 76px, 104px" unoptimized /></span>
          <span className="campaign-route__copy"><span className="campaign-route__title">{card.title}</span><span className="campaign-route__hint">Turları keşfet</span></span>
          <span className="campaign-route__arrow"><ArrowUpRight size={18} aria-hidden="true" /></span>
        </Link>)}
      </div>
      <Link href="/passenger/campaigns/halkbank-parafpara" className="campaign-bank">
        <span className="campaign-bank__icon"><WalletCards size={26} aria-hidden="true" /></span>
        <span className="campaign-bank__copy"><span className="campaign-bank__label">BANKA KAMPANYASI</span><span className="campaign-bank__title">Halkbank ParafPara</span><span className="campaign-bank__hint">Kampanya koşullarını ve seyahat avantajlarını inceleyin.</span></span>
        <span className="campaign-bank__cta">Detayları gör <ArrowRight size={16} aria-hidden="true" /></span>
      </Link>
    </div>
  </section>;
}
