import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, CalendarDays, Globe2, MapPin, PlaneTakeoff, Sparkles } from "lucide-react";
import { tourCollections } from "@/lib/tour-collections";
import { getCollectionTours } from "@/lib/tour-collection-data";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { MemberNav } from "@/components/members/MemberNav";
import { PassengerFooter } from "@/components/passenger/PassengerFooter";
import "../../tours/[year]/year-tours.css";
import "./collections.css";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ year?: string }> };
const date = (value: Date) => new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric", timeZone: "Europe/Istanbul" }).format(value);
const money = (value: number, currency: string) => new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { category } = await params;
  const collection = tourCollections.find((item) => item.slug === category);
  return collection ? { title: collection.title, description: collection.description, alternates: { canonical: `/passenger/collections/${collection.slug}` } } : {};
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { category } = await params;
  const collection = tourCollections.find((item) => item.slug === category);
  if (!collection) notFound();
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  let tours: Awaited<ReturnType<typeof getCollectionTours>> = [];
  let failed = false;
  try { tours = await getCollectionTours(collection.sourceUrl); }
  catch (error) { failed = true; console.error("[passenger/collections] List could not be loaded", { category, error: error instanceof Error ? error.name : "UnknownError" }); }
  const selectedYear = Number((await searchParams).year || 0);
  const years = [...new Set(tours.flatMap((tour) => tour.departures.map((departure) => departure.startDate.getUTCFullYear())))].sort();
  const activeYear = years.includes(selectedYear) ? selectedYear : 0;
  const visible = activeYear ? tours.filter((tour) => tour.departures.some((departure) => departure.startDate.getUTCFullYear() === activeYear)) : tours;
  const departures = tours.flatMap((tour) => tour.departures);
  const countries = new Set(tours.flatMap((tour) => tour.days.map((day) => day.country).filter(Boolean)));
  const path = `/passenger/collections/${collection.slug}`;

  return <main className={`year-tours collection-tours collection-tours--${collection.slug}`}>
    <div className="year-tours__topbar"><Link href="/passenger" className="year-tours__brand"><Image src="/logo.png" alt="Ejder Turizm" width={112} height={78} priority /></Link><nav><Link href="/passenger"><ArrowLeft size={16} />Ana sayfa</Link><Link href="/passenger/tours/2026">2026 Turları</Link><MemberNav /></nav></div>
    <header className="year-tours__hero"><div className="year-tours__orb year-tours__orb--one" /><div className="year-tours__orb year-tours__orb--two" /><div className="year-tours__hero-inner"><span className="year-tours__eyebrow"><Sparkles size={15} />EJDER TURİZM · SEÇİLİ ROTALAR</span><h1>{collection.title}</h1><p>{collection.description}</p><div className="year-tours__hero-actions"><a href="#turlar">Turları keşfet <ArrowRight size={17} /></a><Link href="/passenger#campaigns-heading">Diğer koleksiyonlar</Link></div></div></header>
    <section className="year-tours__stats" aria-label={`${collection.title} özeti`}><div><PlaneTakeoff /><strong>{tours.length}</strong><span>tur programı</span></div><div><CalendarDays /><strong>{departures.length}</strong><span>çıkış tarihi</span></div><div><Globe2 /><strong>{countries.size}</strong><span>farklı ülke</span></div></section>
    <nav className="collection-tours__nav" aria-label="Tur koleksiyonları">{tourCollections.map((item) => <Link href={`/passenger/collections/${item.slug}`} key={item.slug} aria-current={item.slug === category ? "page" : undefined}>{item.title}</Link>)}<Link href="/passenger/tours/2026">2026 Turları</Link></nav>
    <section className="year-tours__content" id="turlar"><div className="year-tours__heading"><div><span>TUR KOLEKSİYONU</span><h2>Yolculuğunuzu seçin</h2><p>Tur programını, çıkış tarihlerini ve güncel fiyatları inceleyin.</p></div><div className="year-tours__months"><Link className={!activeYear ? "is-active" : ""} href={path}>Tüm yıllar</Link>{years.map((year) => <Link className={activeYear === year ? "is-active" : ""} href={`${path}?year=${year}`} key={year}>{year}</Link>)}</div></div>
      <div className="year-tours__grid">{visible.map((tour) => {
        const dates = activeYear ? tour.departures.filter((departure) => departure.startDate.getUTCFullYear() === activeYear) : tour.departures;
        const first = dates.find((departure) => departure.startDate >= new Date()) || dates[0];
        const options = [...dates.map((departure) => ({ value: departure.price?.toNumber(), currency: departure.currency })), ...tour.prices.map((price) => ({ value: price.adultPrice?.toNumber(), currency: price.currency }))].filter((price): price is { value: number; currency: string } => price.value != null && price.value > 0);
        const currency = options[0]?.currency || "EUR";
        const lowest = options.filter((price) => price.currency === currency).sort((a, b) => a.value - b.value)[0];
        const route = [...new Set(tour.days.map((day) => day.country).filter(Boolean))].slice(0, 3).join(" · ");
        const cover = tour.coverImageUrl || tour.images[0]?.url;
        return <article className="year-tour-card" key={tour.id}><Link className="year-tour-card__image" href={`/tour/${tour.slug}`}>{cover ? <Image src={cover} alt="" fill sizes="(max-width: 620px) 100vw, (max-width: 980px) 50vw, 33vw" /> : <span><Globe2 /></span>}<span className="year-tour-card__shade" />{tour.durationDays ? <span className="year-tour-card__duration">{tour.durationDays} gün</span> : null}</Link><div className="year-tour-card__body"><span className="year-tour-card__kicker">{collection.title}</span><h3><Link href={`/tour/${tour.slug}`}>{tour.name}</Link></h3>{route ? <p className="year-tour-card__route"><MapPin size={15} />{route}</p> : null}<div className="year-tour-card__facts"><div><CalendarDays /><span><small>Çıkış tarihi</small><strong>{first ? date(first.startDate) : "Tarih hazırlanıyor"}</strong></span></div><div><PlaneTakeoff /><span><small>Alternatif</small><strong>{dates.length} çıkış tarihi</strong></span></div></div><div className="year-tour-card__bottom"><div>{lowest ? <><small>Başlangıç fiyatı</small><strong>{money(lowest.value, lowest.currency)}</strong></> : <><small>Program</small><strong>Detayları inceleyin</strong></>}</div><Link href={`/tour/${tour.slug}`}>Turu incele <ArrowRight size={16} /></Link></div></div></article>;
      })}</div>
      {!visible.length ? <div className="year-tours__empty">{failed ? "Tur listesi şu anda yüklenemiyor. Lütfen biraz sonra yeniden deneyin." : "Bu koleksiyonda yayınlanmış tur bulunmuyor. Yeni programlar eklendiğinde burada görebilirsiniz."}</div> : null}
    </section><PassengerFooter />
  </main>;
}
