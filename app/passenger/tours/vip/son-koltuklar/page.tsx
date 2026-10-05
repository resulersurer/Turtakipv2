import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Crown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { lastSeatsAvailable } from "@/lib/last-seats";
import { MemberNav } from "@/components/members/MemberNav";
import { PassengerFooter } from "@/components/passenger/PassengerFooter";
import "../../[year]/year-tours.css";
import "../vip-tours.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "EJDER VIP Son Koltuklar",
  description: "EJDER VIP turlarında 5 veya daha az koltuğu kalan çıkış tarihlerini ve ayrıcalıklı tur programlarını keşfedin.",
  alternates: { canonical: "/passenger/tours/vip/son-koltuklar" },
};
const date = (value: Date) => new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric", timeZone: "Europe/Istanbul" }).format(value);
const money = (value: number, currency: string) => new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

export default async function VipLastSeatsPage() {
  const now = new Date();
  const allTours = await prisma.tour.findMany({
    where: { status: "PUBLISHED", sourceLinks: { some: { active: true, source: { key: "ejder-vip", active: true } } } },
    include: {
      departures: { orderBy: { startDate: "asc" }, include: { reservations: { select: { status: true, seats: true, holdExpiresAt: true } } } },
      days: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { name: "asc" },
  });
  const tours = allTours.map((tour) => ({ ...tour, departures: tour.departures.filter((departure) => lastSeatsAvailable(departure, now) !== null) })).filter((tour) => tour.departures.length > 0);
  return (
    <main className="year-tours vip-tours year-tours--last-seats">
      <div className="year-tours__topbar">
        <Link href="/passenger" className="year-tours__brand"><Image src="/logo.png" alt="Ejder Turizm" width={112} height={78} priority /></Link>
        <nav><Link href="/passenger"><ArrowLeft size={16} />Ana sayfa</Link><Link href="/passenger/tours/vip">EJDER VIP Turları</Link><MemberNav /></nav>
      </div>
      <header className="year-tours__hero"><div className="year-tours__hero-inner">
        <span className="year-tours__eyebrow"><Crown size={15} />AYRICALIKLI ROTALAR · SINIRLI KONTENJAN</span>
        <h1><strong>EJDER VIP</strong><br />Son Koltuklar</h1>
        <p>Seçkin yolculuklarda son fırsatlar: 5 veya daha az koltuğu kalan VIP çıkışlarında size uygun rotayı keşfedin.</p>
        <div className="year-tours__hero-actions"><a href="#vip-son-koltuklar">Son koltukları keşfet <ArrowRight size={17} /></a><Link href="/passenger/tours/vip">Tüm VIP turları</Link></div>
      </div></header>
      <section className="year-tours__content" id="vip-son-koltuklar">
        <div className="year-tours__heading"><div><span>EJDER VIP SON KOLTUKLAR</span><h2>Ayrıcalıklı yolculuğunuzda yerinizi seçin</h2><p>Kalan koltuk sayıları sistemdeki kapasite ve aktif rezervasyonlara göre hesaplanır.</p></div></div>
        {tours.length ? <div className="last-seats-list" role="list" aria-label="Son koltukları kalan VIP turlar">
          {tours.map((tour) => <article key={tour.id} className="last-seats-row" role="listitem">
            <div className="last-seats-row__tour">
              <h3><Link href={`/tour/${tour.slug}`}>{tour.name}</Link></h3>
              <p>{[...new Set(tour.days.map((day) => day.country).filter(Boolean))].join(" · ")}</p>
              <small>{[tour.durationDays ? `${tour.durationDays} gün` : null, tour.departureCity ? `${tour.departureCity} kalkışlı` : null].filter(Boolean).join(" · ")}</small>
            </div>
            <ul className="last-seats-row__departures" aria-label="Çıkış tarihleri ve kalan koltuklar">
              {tour.departures.map((departure) => <li key={departure.id}>
                <span>{date(departure.startDate)}</span><strong>Son {lastSeatsAvailable(departure, now)} koltuk</strong>
                <span className="last-seats-row__price">{departure.price ? money(departure.price.toNumber(), departure.currency) : "Fiyat için bilgi alın"}</span>
              </li>)}
            </ul>
            <Link className="last-seats-row__action" href={`/tour/${tour.slug}`}>Turu incele <ArrowRight size={16} aria-hidden="true" /></Link>
          </article>)}
        </div> : <div className="year-tours__empty">Şu anda 5 veya daha az koltuğu kalan bir VIP çıkışı bulunmuyor. <Link href="/passenger/tours/vip">Tüm VIP turlarına göz atın.</Link></div>}
      </section>
      <PassengerFooter />
    </main>
  );
}
