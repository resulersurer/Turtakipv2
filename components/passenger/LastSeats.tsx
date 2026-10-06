import Link from "next/link";
import { Armchair, ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { TourDataRefresh } from "@/components/admin/TourDataRefresh";

export type LastSeatDeparture = {
  id: string;
  slug: string;
  name: string;
  coverImageUrl: string | null;
  startDate: string;
  available: number;
  durationDays: number | null;
  departureCity: string | null;
};

const dateFormat = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long", year: "numeric" });

export function LastSeats({ departures }: { departures: LastSeatDeparture[] }) {
  return <>
    <TourDataRefresh />
    {departures.length ? <section className="home-last-seats" aria-labelledby="home-last-seats-title">
      <div className="home-last-seats__heading">
        <div><span className="home-last-seats__kicker"><Armchair size={15} aria-hidden="true" /> YOLCULUĞA SON BİR ADIM</span><h2 id="home-last-seats-title">Son Koltuklar</h2><p>Rotanızı seçin, az kalan yerlerden birini ayırtın.</p></div>
        <span className="home-last-seats__note">Her çıkışta en fazla 5 koltuk</span>
      </div>
      <div className="home-last-seats__grid">
        {departures.map((departure) => <article className="home-last-seats__card" key={departure.id}>
          <Link href={`/tour/${departure.slug}`} className="home-last-seats__image" aria-label={`${departure.name} turunu incele`}>
            {departure.coverImageUrl ? <img src={departure.coverImageUrl} alt="" loading="lazy" /> : <div className="home-last-seats__placeholder"><MapPin size={36} aria-hidden="true" /></div>}
            <span className="home-last-seats__badge"><Armchair size={14} aria-hidden="true" /> Son {departure.available} koltuk</span>
            {departure.durationDays ? <span className="home-last-seats__duration">{departure.durationDays} gün</span> : null}
          </Link>
          <div className="home-last-seats__body">
            <h3><Link href={`/tour/${departure.slug}`}>{departure.name}</Link></h3>
            <p className="home-last-seats__date"><CalendarDays size={16} aria-hidden="true" /><time dateTime={departure.startDate}>{dateFormat.format(new Date(departure.startDate))}</time></p>
            <div className="home-last-seats__bottom"><span>{departure.departureCity ? `${departure.departureCity} kalkışlı` : "Tur programı"}</span><Link href={`/tour/${departure.slug}`}>Turu incele <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
          </div>
        </article>)}
      </div>
      <p className="home-last-seats__footnote">Kalan koltuklar güncel rezervasyon ve opsiyonlara göre yenilenir.</p>
    </section> : null}
  </>;
}
