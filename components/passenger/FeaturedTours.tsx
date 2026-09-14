import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

type FeaturedTour = {
  id: string;
  slug: string;
  name: string;
  coverImageUrl?: string | null;
  durationDays?: number | null;
  departureCity?: string | null;
};

export function FeaturedTours({ tours }: { tours: FeaturedTour[] }) {
  if (!tours.length) return null;

  const cards = (duplicate: boolean) => tours.map((tour) => (
    <Link
      key={`${duplicate ? "copy" : "main"}-${tour.id}`}
      href={`/tour/${tour.slug}`}
      className="featured-tours__card"
      aria-hidden={duplicate ? true : undefined}
      tabIndex={duplicate ? -1 : undefined}
    >
      <div className="featured-tours__image">
        {tour.coverImageUrl ? <img src={tour.coverImageUrl} alt="" loading="lazy" /> : <div className="featured-tours__placeholder"><Sparkles aria-hidden="true" /></div>}
      </div>
      <div className="featured-tours__card-body">
        <span className="featured-tours__eyebrow">Ejder Turizm rotası</span>
        <h3>{tour.name}</h3>
        <div className="featured-tours__card-bottom">
          <span>{[tour.durationDays ? `${tour.durationDays} gün` : null, tour.departureCity].filter(Boolean).join(" · ")}</span>
          <ArrowUpRight aria-hidden="true" size={18} />
        </div>
      </div>
    </Link>
  ));

  return (
    <section className="featured-tours" aria-labelledby="featured-tours-title">
      <div className="featured-tours__heading">
        <div>
          <span className="featured-tours__kicker"><Sparkles aria-hidden="true" size={14} /> ÖNE ÇIKAN ROTALAR</span>
          <h2 id="featured-tours-title">Çok Satan Turlar</h2>
          <p>Yeni bir yolculuk için ilham veren tur programlarını keşfedin.</p>
        </div>
        <Link href="/tours" className="featured-tours__all">Tüm turları gör <ArrowUpRight aria-hidden="true" size={17} /></Link>
      </div>
      <div className="featured-tours__viewport">
        <div className="featured-tours__track">
          <div className="featured-tours__set">{cards(false)}</div>
          <div className="featured-tours__set" aria-hidden="true">{cards(true)}</div>
        </div>
      </div>
    </section>
  );
}
