import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, MapPin, Plane, Route, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { serializeTour, tourInclude } from "@/lib/tours";
import { PublicMap } from "@/components/maps/PublicMap";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { isPrismaSetupError } from "@/lib/db-errors";
import { classifyDeparture, formatDepartureRange } from "@/lib/departure-status";
import { officialTourUrl } from "@/lib/seo";
import "./tour-detail.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return { robots: { index: false, follow: false } };
  const tour = await prisma.tour.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { name: true, durationDays: true, departureCity: true, coverImageUrl: true, sourceUrl: true }
  });
  if (!tour) return { robots: { index: false, follow: false } };
  const canonical = officialTourUrl(tour.sourceUrl) || `/tour/${encodeURIComponent(slug)}`;
  const description = `${tour.name} turunun rotasını, programını ve çıkış tarihlerini inceleyin${tour.durationDays ? `; ${tour.durationDays} günlük tur` : ""}${tour.departureCity ? `, ${tour.departureCity} kalkışlı` : ""}.`;
  return {
    title: tour.name,
    description,
    alternates: { canonical },
    openGraph: { title: `${tour.name} | Ejder Turizm`, description, url: canonical, images: tour.coverImageUrl ? [{ url: tour.coverImageUrl, alt: tour.name }] : undefined }
  };
}

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  const { slug } = await params;
  let tour: any;
  try {
    tour = serializeTour(await prisma.tour.findFirst({ where: { slug, status: "PUBLISHED" }, include: tourInclude })) as any;
  } catch (error) {
    if (isPrismaSetupError(error)) return <SetupNotice />;
    throw error;
  }
  if (!tour) notFound();

  const officialUrl = officialTourUrl(tour.sourceUrl);
  const countries = [...new Set<string>(tour.days.map((day: any) => day.country).filter(Boolean))];
  const mapPoints = tour.days.filter((day: any) => day.lat != null && day.lng != null).length;
  const nextDeparture = tour.departures.find((departure: any) => ["today", "future"].includes(classifyDeparture(departure)));
  const heroImage = tour.coverImageUrl || tour.images[0]?.url;

  return (
    <main className="tour-detail">
      <div className="tour-detail__topbar">
        <Link href="/passenger" className="tour-detail__brand"><img src="/logo.png" alt="Ejder Turizm" /></Link>
        <nav aria-label="Tur sayfası menüsü">
          <Link href="/passenger"><ArrowLeft size={16} aria-hidden="true" /> Turlara dön</Link>
          <a href="#program">Program</a>
          <a href="#departures">Çıkışlar</a>
          {officialUrl ? <a className="tour-detail__top-cta" href={officialUrl}>Resmî sayfa <ArrowUpRight size={15} aria-hidden="true" /></a> : null}
        </nav>
      </div>

      <header className="tour-detail__hero">
        {heroImage ? <img src={heroImage} alt="" className="tour-detail__hero-image" /> : null}
        <div className="tour-detail__hero-shade" />
        <div className="tour-detail__hero-content">
          <div className="tour-detail__breadcrumbs"><Link href="/passenger">Turlar</Link><span>/</span><span>Tur detayı</span></div>
          <span className="tour-detail__eyebrow">EJDER TURİZM · KEŞİF ROTASI</span>
          <h1>{tour.name}</h1>
          <p>{countries.length ? countries.slice(0, 4).join(" · ") : "Yeni bir yolculuk için rotayı keşfedin"}</p>
          <div className="tour-detail__hero-actions">
            {officialUrl ? <a className="tour-detail__button tour-detail__button--light" href={officialUrl}>Resmî tur sayfasını incele <ArrowUpRight size={18} aria-hidden="true" /></a> : null}
            <a className="tour-detail__button tour-detail__button--outline" href="#program">Programı keşfet <ArrowUpRight size={17} aria-hidden="true" /></a>
          </div>
        </div>
      </header>

      <div className="tour-detail__content">
        <section className="tour-detail__facts" aria-label="Tur özeti">
          {tour.durationDays ? <div><Clock3 aria-hidden="true" /><span>SÜRE</span><strong>{tour.durationDays} gün</strong></div> : null}
          {tour.departureCity ? <div><MapPin aria-hidden="true" /><span>KALKIŞ</span><strong>{tour.departureCity}</strong></div> : null}
          {tour.airline ? <div><Plane aria-hidden="true" /><span>HAVAYOLU</span><strong>{tour.airline}</strong></div> : null}
          {tour.visaStatus ? <div><ShieldCheck aria-hidden="true" /><span>VİZE</span><strong>{tour.visaStatus}</strong></div> : null}
          {countries.length ? <div><Route aria-hidden="true" /><span>ROTA</span><strong>{countries.length} ülke</strong></div> : null}
        </section>

        <div className="tour-detail__intro">
          <div><span className="tour-detail__section-kicker">YOLCULUĞA GENEL BAKIŞ</span><h2>Rota boyunca neler var?</h2><p>Gün gün programı, durakları ve çıkış seçeneklerini aşağıda inceleyebilirsiniz.</p></div>
          {nextDeparture ? <div className="tour-detail__next"><CalendarDays size={19} aria-hidden="true" /><div><span>Yaklaşan çıkış</span><strong>{formatDepartureRange(nextDeparture)}</strong></div></div> : null}
        </div>

        <section className="tour-detail__map-grid" id="route" aria-labelledby="tour-route-heading">
          <div className="tour-detail__map-card"><div className="tour-detail__card-heading"><div><span className="tour-detail__section-kicker">DÜNYA ÜZERİNDE</span><h2 id="tour-route-heading">Rota haritası</h2></div><span className="tour-detail__pill">{mapPoints} durak</span></div><div className="tour-detail__map"><PublicMap days={tour.days} /></div></div>
          <div className="tour-detail__route-card"><span className="tour-detail__section-kicker">ROTA ÖZETİ</span><h2>Keşfedilecek yerler</h2><p>Tur programındaki ülkeler ve duraklar.</p><div className="tour-detail__countries">{countries.map((country) => <span key={country}><MapPin size={14} aria-hidden="true" />{country}</span>)}</div><a href="#program" className="tour-detail__text-link">Günlük programı gör <ArrowUpRight size={16} aria-hidden="true" /></a></div>
        </section>

        <section className="tour-detail__section" id="departures" aria-labelledby="tour-departures-heading"><div className="tour-detail__section-heading"><div><span className="tour-detail__section-kicker">SEYAHATİNİ PLANLA</span><h2 id="tour-departures-heading">Çıkış tarihleri</h2></div><span className="tour-detail__pill">{tour.departures.length} seçenek</span></div><div className="tour-detail__departure-grid">{tour.departures.length ? tour.departures.map((departure: any) => <article className="tour-detail__departure" key={departure.id}><div className="tour-detail__departure-date"><CalendarDays size={20} aria-hidden="true" /><strong>{formatDepartureRange(departure)}</strong></div><p>{departure.price ? `${departure.price} ${departure.currency}` : departure.label || "Fiyat ve yer bilgisi için resmî sayfayı inceleyin"}</p><Link href={`/passenger/${tour.id}?departureId=${departure.id}`}>Bu tarihi haritada takip et <ArrowUpRight size={16} aria-hidden="true" /></Link></article>) : <p className="tour-detail__empty">Henüz çıkış tarihi eklenmemiş.</p>}</div></section>

        {tour.prices.length ? <section className="tour-detail__section" aria-labelledby="tour-prices-heading"><div className="tour-detail__section-heading"><div><span className="tour-detail__section-kicker">KONAKLAMA SEÇENEKLERİ</span><h2 id="tour-prices-heading">Fiyat bilgileri</h2></div></div><div className="tour-detail__price-grid">{tour.prices.map((price: any) => <div className="tour-detail__price" key={price.id}><span>{price.roomType}</span><strong>{price.adultPrice ? `${price.adultPrice} ${price.currency}` : "Fiyat sorunuz"}</strong></div>)}</div></section> : null}

        <section className="tour-detail__section" id="program" aria-labelledby="tour-program-heading"><div className="tour-detail__section-heading"><div><span className="tour-detail__section-kicker">ADIM ADIM KEŞFET</span><h2 id="tour-program-heading">Gün gün tur programı</h2></div><span className="tour-detail__pill">{tour.days.length} gün</span></div><div className="tour-detail__timeline">{tour.days.map((day: any) => <article className="tour-detail__day" key={day.id}><span className="tour-detail__day-index">{String(day.dayNumber).padStart(2, "0")}</span><div><span className="tour-detail__day-place">{[day.city, day.country].filter(Boolean).join(" · ")}</span><h3>{day.title}</h3>{day.description ? <p>{day.description}</p> : null}{day.hotelInfo || day.flightInfo ? <div className="tour-detail__day-tags">{day.hotelInfo ? <span>Otel: {day.hotelInfo}</span> : null}{day.flightInfo ? <span>Uçuş: {day.flightInfo}</span> : null}</div> : null}</div></article>)}</div></section>

        {tour.images.length ? <section className="tour-detail__section" aria-labelledby="tour-gallery-heading"><div className="tour-detail__section-heading"><div><span className="tour-detail__section-kicker">YOLCULUKTAN KARELER</span><h2 id="tour-gallery-heading">Fotoğraf galerisi</h2></div></div><div className="tour-detail__gallery">{tour.images.map((image: any) => <div key={image.id}><img src={image.url} alt={image.alt || tour.name} loading="lazy" /></div>)}</div></section> : null}

        <section className="tour-detail__closing"><div><span className="tour-detail__section-kicker">SIRADAKİ MACERA</span><h2>Bu rotayı yakından tanıyın</h2><p>Güncel tur ve rezervasyon bilgilerini resmî Ejder Turizm sayfasından inceleyin.</p></div><div className="tour-detail__closing-actions">{officialUrl ? <a className="tour-detail__button tour-detail__button--light" href={officialUrl}>Resmî tur sayfası <ArrowUpRight size={18} aria-hidden="true" /></a> : null}<Link className="tour-detail__button tour-detail__button--outline" href={`/passenger/${tour.id}`}>Rotayı haritada izle</Link></div></section>
      </div>
    </main>
  );
}
