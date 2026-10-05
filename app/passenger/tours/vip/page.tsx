import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, CalendarDays, Crown, Gem, Globe2, MapPin, PlaneTakeoff, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MemberNav } from "@/components/members/MemberNav";
import { PassengerFooter } from "@/components/passenger/PassengerFooter";
import "../[year]/year-tours.css";
import "./vip-tours.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "EJDER VIP Turları",
  description: "Özenle seçilmiş rotalar, ayrıcalıklı programlar ve güncel çıkış tarihleriyle EJDER VIP turları.",
  alternates: { canonical: "/passenger/tours/vip" }
};

const money = (value: number, currency: string) => new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
const date = (value: Date) => new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric", timeZone: "Europe/Istanbul" }).format(value);

export default async function VipToursPage() {
  const now = new Date();
  const tours = await prisma.tour.findMany({
    where: {
      status: "PUBLISHED",
      sourceLinks: { some: { active: true, source: { key: "ejder-vip", active: true } } }
    },
    include: {
      departures: { where: { startDate: { gte: now } }, orderBy: { startDate: "asc" } },
      days: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
      prices: true
    },
    orderBy: { name: "asc" }
  });
  const departures = tours.flatMap((tour) => tour.departures);
  const countries = new Set(tours.flatMap((tour) => tour.days.map((item) => item.country).filter(Boolean)));

  return <main className="year-tours vip-tours">
    <div className="year-tours__topbar"><Link href="/passenger" className="year-tours__brand"><Image src="/logo.png" alt="Ejder Turizm" width={112} height={78} priority /></Link><nav><Link href="/passenger"><ArrowLeft size={16}/>Ana sayfa</Link><Link href="/passenger/tours/2027">2027 Turları</Link><MemberNav/></nav></div>
    <header className="year-tours__hero"><div className="year-tours__orb year-tours__orb--one"/><div className="year-tours__orb year-tours__orb--two"/><div className="year-tours__hero-inner"><span className="year-tours__eyebrow"><Sparkles size={15}/>AYRICALIKLI ROTALAR · ÖZENLİ DENEYİMLER</span><h1><strong>EJDER</strong> VIP</h1><p>Kalabalıktan uzak, detayları özenle planlanmış ve seçkin deneyimlerle zenginleştirilmiş yolculukları keşfedin.</p><div className="year-tours__hero-actions"><a href="#vip-turlar">VIP turları keşfet <ArrowRight size={17}/></a><Link href="/passenger/tours/vip/son-koltuklar">VIP Son Koltuklar</Link></div></div></header>
    <section className="year-tours__stats" aria-label="EJDER VIP tur özeti"><div><Crown/><strong>{tours.length}</strong><span>seçkin tur programı</span></div><div><CalendarDays/><strong>{departures.length}</strong><span>yaklaşan çıkış tarihi</span></div><div><Globe2/><strong>{countries.size}</strong><span>farklı ülke</span></div></section>
    <section className="vip-tours__promise"><div><Gem/><h2>Özenle seçilmiş programlar</h2><p>Rota, konaklama ve deneyim ayrıntıları baştan sona dengeli bir seyahat için bir araya geliyor.</p></div><div><PlaneTakeoff/><h2>Konforlu yolculuk</h2><p>Uçuşlardan günlük programa kadar her adım, seyahat konforunuzu önceliklendirerek planlanıyor.</p></div><div><Crown/><h2>Ayrıcalıklı deneyimler</h2><p>Her destinasyonu daha yakından tanımanızı sağlayan özel duraklar ve zengin içerikler sunuluyor.</p></div></section>
    <section className="year-tours__content" id="vip-turlar"><div className="year-tours__heading"><div><span>EJDER VIP KOLEKSİYONU</span><h2>Size özel bir yolculuk seçin</h2><p>VIP tur programları ve çıkış tarihleri her gün kaynak listeyle karşılaştırılarak güncellenir.</p></div></div>
      <div className="year-tours__grid">{tours.map((tour) => {
        const first = tour.departures[0];
        const departurePrices = tour.departures.map((item) => item.price?.toNumber()).filter((item): item is number => item != null);
        const programPrices = tour.prices.map((item) => item.adultPrice?.toNumber()).filter((item): item is number => item != null);
        const lowest = [...departurePrices, ...programPrices].sort((a, b) => a - b)[0];
        const currency = first?.currency || tour.prices[0]?.currency || "EUR";
        const route = [...new Set(tour.days.map((item) => item.country).filter(Boolean))].slice(0, 3).join(" · ");
        const cover = tour.coverImageUrl || tour.images[0]?.url;
        return <article className="year-tour-card" key={tour.id}><Link className="year-tour-card__image" href={`/tour/${tour.slug}`}>{cover ? <img src={cover} alt="" loading="lazy"/> : <span><Crown/></span>}<span className="year-tour-card__shade"/><span className="year-tour-card__year">EJDER VIP</span>{tour.durationDays ? <span className="year-tour-card__duration">{tour.durationDays} gün</span> : null}</Link><div className="year-tour-card__body"><span className="year-tour-card__kicker">SEÇKİN ROTA · ÖZEL PROGRAM</span><h3><Link href={`/tour/${tour.slug}`}>{tour.name}</Link></h3>{route ? <p className="year-tour-card__route"><MapPin size={15}/>{route}</p> : null}<div className="year-tour-card__facts"><div><CalendarDays/><span><small>Yakın çıkış</small><strong>{first ? date(first.startDate) : "Tarih hazırlanıyor"}</strong></span></div><div><PlaneTakeoff/><span><small>Alternatif</small><strong>{tour.departures.length} çıkış tarihi</strong></span></div></div><div className="year-tour-card__bottom"><div>{lowest ? <><small>Başlangıç fiyatı</small><strong>{money(lowest, currency)}</strong></> : <><small>Program</small><strong>Detayları inceleyin</strong></>}</div><Link href={`/tour/${tour.slug}`}>Turu incele <ArrowRight size={16}/></Link></div></div></article>;
      })}</div>{!tours.length ? <div className="year-tours__empty">Yayınlanmış VIP tur programları hazırlanıyor. Yeni rotalar çok yakında burada olacak.</div> : null}
    </section>
    <PassengerFooter/>
  </main>;
}
