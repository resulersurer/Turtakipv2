import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin, Route } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { serializeTour, tourInclude } from "@/lib/tours";
import { PassengerTracker } from "@/components/passenger/PassengerTracker";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { isPrismaSetupError } from "@/lib/db-errors";
import { departureRelativeLabel, formatDepartureRange } from "@/lib/departure-status";
import { officialTourUrl } from "@/lib/seo";
import "./tracker-detail.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function PassengerTourPage({ params, searchParams }: { params: Promise<{ tourId: string }>; searchParams: Promise<{ departureId?: string }> }) {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  const { tourId } = await params;
  const { departureId } = await searchParams;
  let tour: any;
  try {
    tour = serializeTour(await prisma.tour.findFirst({ where: { id: tourId, status: "PUBLISHED" }, include: tourInclude })) as any;
  } catch (error) {
    if (isPrismaSetupError(error)) return <SetupNotice />;
    throw error;
  }
  if (!tour) notFound();

  const departure = tour.departures.find((item: any) => item.id === departureId) || tour.departures[0] || null;
  const officialUrl = officialTourUrl(tour.sourceUrl);
  const countries = [...new Set<string>(tour.days.map((day: any) => day.country).filter(Boolean))];
  const cover = tour.coverImageUrl || tour.images[0]?.url;

  return (
    <main className="tracker-detail">
      <div className="tracker-detail__topbar">
        <Link href="/passenger" className="tracker-detail__brand"><img src="/logo.png" alt="Ejder Turizm" /></Link>
        <nav aria-label="Tur takip menüsü"><Link href="/passenger"><ArrowLeft size={16} aria-hidden="true" /> Tüm turlar</Link>{tour.slug ? <Link href={`/tour/${tour.slug}`}>Tur programı</Link> : null}{officialUrl ? <a className="tracker-detail__top-cta" href={officialUrl}>Resmî tur sayfası <ArrowUpRight size={16} aria-hidden="true" /></a> : null}</nav>
      </div>

      <header className="tracker-detail__hero">
        {cover ? <img src={cover} alt="" className="tracker-detail__hero-image" /> : null}
        <div className="tracker-detail__hero-shade" />
        <div className="tracker-detail__hero-content">
          <div className="tracker-detail__breadcrumb"><Link href="/passenger">Turlar</Link><span>/</span><span>Yolcu takip</span></div>
          <span className="tracker-detail__eyebrow"><Route size={15} aria-hidden="true" /> İNTERAKTİF TUR ROTASI</span>
          <h1>{tour.name}</h1>
          <p>{countries.length ? countries.slice(0, 5).join(" · ") : "Rotayı gün gün harita üzerinde keşfedin"}</p>
          <div className="tracker-detail__hero-actions"><a href="#tracker" className="tracker-detail__button tracker-detail__button--light">Haritada keşfet <ArrowUpRight size={17} aria-hidden="true" /></a>{tour.slug ? <Link href={`/tour/${tour.slug}`} className="tracker-detail__button tracker-detail__button--outline">Tur programını incele</Link> : null}</div>
        </div>
      </header>

      <div className="tracker-detail__content">
        <section className="tracker-detail__summary" aria-label="Tur takip özeti">
          {departure ? <div><CalendarDays aria-hidden="true" /><span>SEÇİLİ ÇIKIŞ</span><strong>{formatDepartureRange(departure)}</strong><small>{departureRelativeLabel(departure)}</small></div> : null}
          {tour.durationDays ? <div><Route aria-hidden="true" /><span>TUR SÜRESİ</span><strong>{tour.durationDays} gün</strong></div> : null}
          {countries.length ? <div><MapPin aria-hidden="true" /><span>ROTA</span><strong>{countries.length} ülke</strong></div> : null}
          {tour.departureCity ? <div><MapPin aria-hidden="true" /><span>KALKIŞ</span><strong>{tour.departureCity}</strong></div> : null}
        </section>

        {tour.departures.length > 1 ? <section className="tracker-detail__departures" aria-label="Çıkış tarihi seç"><div><span className="tracker-detail__section-kicker">SEYAHAT TARİHİ</span><h2>Çıkış seçin</h2></div><div className="tracker-detail__departure-list">{tour.departures.map((item: any) => <Link key={item.id} href={`/passenger/${tour.id}?departureId=${item.id}`} aria-current={item.id === departure?.id ? "true" : undefined} className={item.id === departure?.id ? "is-selected" : ""}>{formatDepartureRange(item)}</Link>)}</div></section> : null}

        <section id="tracker" className="tracker-detail__tracker" aria-label="Etkileşimli rota takibi"><div className="tracker-detail__section-heading"><div><span className="tracker-detail__section-kicker">ROTAYI DENEYİMLE</span><h2>Gün gün yolculuk</h2><p>Gün seçin veya oynat düğmesiyle rotayı haritada adım adım izleyin.</p></div><span className="tracker-detail__section-count">{tour.days.length} durak</span></div><PassengerTracker tour={{ name: tour.name, coverImageUrl: cover, days: tour.days, selectedDeparture: departure }} /></section>

        <section className="tracker-detail__closing"><div><span className="tracker-detail__section-kicker">YOLCULUK DEVAM EDİYOR</span><h2>Turun tamamını keşfedin</h2><p>Program, çıkış tarihleri ve diğer ayrıntılara göz atın.</p></div><div>{tour.slug ? <Link className="tracker-detail__button tracker-detail__button--light" href={`/tour/${tour.slug}`}>Tur detayını gör <ArrowUpRight size={17} aria-hidden="true" /></Link> : null}{officialUrl ? <a className="tracker-detail__button tracker-detail__button--outline" href={officialUrl}>Resmî tur sayfası</a> : null}</div></section>
      </div>
    </main>
  );
}
