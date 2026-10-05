import { lastSeatsAvailable } from "@/lib/last-seats";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Globe2, MapPin, PlaneTakeoff, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MemberNav } from "@/components/members/MemberNav";
import { PassengerFooter } from "@/components/passenger/PassengerFooter";
import "@/app/passenger/tours/[year]/year-tours.css";

const years = [2026, 2027];
const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const money = (value: number, currency: string) => new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
const date = (value: Date) => new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric", timeZone: "Europe/Istanbul" }).format(value);

export default async function YearToursPage({ params, searchParams, lastSeats = false }: { params: Promise<{ year: string }>; searchParams: Promise<{ month?: string }>; lastSeats?: boolean }) {
  const year = Number((await params).year);
  if (!years.includes(year)) notFound();
  const requestedMonth = Number((await searchParams).month || 0);
  const selectedMonth = Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12 ? requestedMonth : 0;
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const sourceKey = `ejder-${year}`;
  const allTours = await prisma.tour.findMany({
    where: { status: "PUBLISHED", sourceLinks: { some: { active: true, source: { key: sourceKey, active: true } } } },
    include: { departures: { where: { startDate: { gte: start, lt: end } }, orderBy: { startDate: "asc" }, include: { reservations: { select: { status: true, seats: true, holdExpiresAt: true } } } }, days: { orderBy: { sortOrder: "asc" } }, images: { orderBy: { sortOrder: "asc" } }, prices: true },
    orderBy: { name: "asc" }
  });
  const now = new Date();
  const tours = lastSeats ? allTours.map((tour) => ({ ...tour, departures: tour.departures.filter((departure) => lastSeatsAvailable(departure, now) !== null) })).filter((tour) => tour.departures.length > 0) : allTours;
  const basePath = `/passenger/tours/${year}${lastSeats ? "/son-koltuklar" : ""}`;
  const visible = selectedMonth >= 1 && selectedMonth <= 12 ? tours.filter((tour) => tour.departures.some((item) => item.startDate.getUTCMonth() + 1 === selectedMonth)) : tours;
  const departures = tours.flatMap((tour) => tour.departures);
  const months = [...new Set(departures.map((item) => item.startDate.getUTCMonth() + 1))].sort((a, b) => a - b);
  const countries = new Set(tours.flatMap((tour) => tour.days.map((item) => item.country).filter(Boolean)));
  const nextYear = year === 2026 ? 2027 : 2026;

  return <main className={`year-tours year-tours--${year}${lastSeats ? " year-tours--last-seats" : ""}`}>
    <div className="year-tours__topbar"><Link href="/passenger" className="year-tours__brand"><Image src="/logo.png" alt="Ejder Turizm" width={112} height={78} priority/></Link><nav><Link href="/passenger"><ArrowLeft size={16}/>Ana sayfa</Link><Link href={`/passenger/tours/${nextYear}`}>{nextYear} Turları</Link><MemberNav/></nav></div>
    <header className="year-tours__hero"><div className="year-tours__orb year-tours__orb--one"/><div className="year-tours__orb year-tours__orb--two"/><div className="year-tours__hero-inner"><span className="year-tours__eyebrow"><Sparkles size={15}/>{lastSeats ? "SINIRLI KONTENJAN · YENİ YOLCULUKLAR" : "YENİ ROTALAR · GÜNCEL TARİHLER"}</span><h1><strong>{year}</strong> {lastSeats ? "Son Koltuklar" : "Turları"}</h1><p>{lastSeats ? "Yolculuğa son bir adım: 5 veya daha az koltuğu kalan çıkış tarihlerini keşfedin, size uygun rotada yerinizi ayırtın." : year === 2026 ? "Bu yılın en özel yolculuklarını, uzak coğrafyaları ve kültürleri güncel çıkış tarihleriyle keşfedin." : "Yeni yılın büyük rotalarını erkenden planlayın; seçkin programlar ve farklı kıtalarda unutulmaz deneyimler sizi bekliyor."}</p><div className="year-tours__hero-actions"><a href="#turlar">{lastSeats ? "Son koltukları keşfet" : "Turları keşfet"} <ArrowRight size={17}/></a><Link href={`/passenger/tours/${nextYear}`}>{nextYear} koleksiyonuna geç</Link></div></div></header>
    <section className="year-tours__stats" aria-label={`${year} tur özeti`}><div><PlaneTakeoff/><strong>{tours.length}</strong><span>özgün tur programı</span></div><div><CalendarDays/><strong>{departures.length}</strong><span>planlı çıkış tarihi</span></div><div><Globe2/><strong>{countries.size}</strong><span>farklı ülke</span></div></section>
    <section className="year-tours__content" id="turlar"><div className="year-tours__heading"><div><span>SEYAHAT TAKVİMİ</span><h2>{lastSeats ? "Yeriniz ayrılmadan rotanızı seçin" : "Size uygun yolculuğu seçin"}</h2><p>{lastSeats ? "Kalan koltuk sayıları sistemdeki kapasite ve aktif rezervasyonlara göre hesaplanır." : "Tarihler her gün resmî tur kaynağıyla karşılaştırılarak güncellenir."}</p></div><div className="year-tours__months"><Link className={!selectedMonth ? "is-active" : ""} href={basePath}>Tüm aylar</Link>{months.map((month) => <Link className={selectedMonth === month ? "is-active" : ""} href={`${basePath}?month=${month}`} key={month}>{monthNames[month - 1]}</Link>)}</div></div>
      <div className="year-tours__grid">{visible.map((tour) => {
        const tourDepartures = selectedMonth ? tour.departures.filter((item) => item.startDate.getUTCMonth() + 1 === selectedMonth) : tour.departures;
        const first = tourDepartures[0];
        const prices = tourDepartures.map((item) => item.price?.toNumber()).filter((item): item is number => item != null);
        const globalPrices = tour.prices.map((item) => item.adultPrice?.toNumber()).filter((item): item is number => item != null);
        const lowest = (lastSeats ? (first?.price ? [first.price.toNumber()] : []) : [...prices, ...globalPrices]).sort((a, b) => a - b)[0];
        const currency = first?.currency || tour.prices[0]?.currency || "EUR";
        const route = [...new Set(tour.days.map((item) => item.country).filter(Boolean))].slice(0, 3).join(" · ");
        const cover = tour.coverImageUrl || tour.images[0]?.url;
        return <article className="year-tour-card" key={tour.id}><Link className="year-tour-card__image" href={`/tour/${tour.slug}`}>{cover ? <img src={cover} alt="" loading="lazy"/> : <span><Globe2/></span>}<span className="year-tour-card__shade"/><span className="year-tour-card__year">{year}</span>{tour.durationDays ? <span className="year-tour-card__duration">{tour.durationDays} gün</span> : null}</Link><div className="year-tour-card__body"><span className="year-tour-card__kicker">EJDER TURİZM · SEÇİLİ ROTA</span><h3><Link href={`/tour/${tour.slug}`}>{tour.name}</Link></h3>{route ? <p className="year-tour-card__route"><MapPin size={15}/>{route}</p> : null}<div className="year-tour-card__facts"><div><CalendarDays/><span><small>Yakın çıkış</small><strong>{first ? date(first.startDate) : "Tarih hazırlanıyor"}</strong></span></div><div><PlaneTakeoff/><span><small>Alternatif</small><strong>{tourDepartures.length} çıkış tarihi</strong></span></div></div>{lastSeats ? <ul className="last-seats-dates">{tourDepartures.map((departure) => <li key={departure.id}><span>{date(departure.startDate)}</span><strong>Son {lastSeatsAvailable(departure, now)} koltuk</strong></li>)}</ul> : null}<div className="year-tour-card__bottom"><div>{lowest ? <><small>Başlangıç fiyatı</small><strong>{money(lowest, currency)}</strong></> : <><small>Program</small><strong>Detayları inceleyin</strong></>}</div><Link href={`/tour/${tour.slug}`}>Turu incele <ArrowRight size={16}/></Link></div></div></article>;
      })}</div>{!visible.length ? <div className="year-tours__empty">{lastSeats ? "Şu anda bu dönem için 5 veya daha az koltuğu kalan bir çıkış bulunmuyor. Tüm yıl turlarına göz atabilirsiniz." : "Seçilen ay için yayınlanmış tur bulunmuyor. Diğer aylara göz atabilirsiniz."}</div> : null}
    </section>
    <div className="year-tours__hero-actions last-seats-navigation"><Link href={`/passenger/tours/${year}`}>{year} Turları</Link><Link href={`/passenger/tours/${year}/son-koltuklar`}>{year} Son Koltuklar</Link><Link href={`/passenger/tours/${nextYear}/son-koltuklar`}>{nextYear} Son Koltuklar</Link></div>
    <PassengerFooter/>
  </main>;
}
