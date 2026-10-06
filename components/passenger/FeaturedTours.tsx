"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CountryName } from "./CountryName";
import { useRouter } from "next/navigation";
import { Armchair, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, MapPin, Sparkles } from "lucide-react";

type FeaturedTour = {
  id: string;
  slug: string;
  name: string;
  coverImageUrl?: string | null;
  durationDays?: number | null;
  departureCity?: string | null;
  departureDate?: string | null;
  route?: string;
  countries?: string[];
  countryCount?: number;
  available?: number;
};

export function FeaturedTours({ tours, variant = "featured" }: { tours: FeaturedTour[]; variant?: "featured" | "last-seats" }) {
  const lastSeats = variant === "last-seats";
  const titleId = `${variant}-tours-title`;
  const router = useRouter();
  const viewportRef = useRef<HTMLDivElement>(null);
  const position = useRef(0);
  const [copyCount, setCopyCount] = useState(2);

  useEffect(() => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    const value = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
    const secondsNow = value("hour") * 3600 + value("minute") * 60 + value("second");
    const secondsUntilRefresh = (9 * 3600 - secondsNow + 86400) % 86400 || 86400;
    const timer = window.setTimeout(() => router.refresh(), secondsUntilRefresh * 1000 + 1000);
    return () => window.clearTimeout(timer);
  }, [router, tours]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const set = viewport.querySelector<HTMLElement>(".featured-tours__set");
    if (!set) return;
    const updateCopies = () => {
      if (set.offsetWidth > 0) {
        setCopyCount(Math.max(2, Math.ceil(viewport.clientWidth / set.offsetWidth) + 1));
      }
    };
    updateCopies();
    const observer = new ResizeObserver(updateCopies);
    observer.observe(viewport);
    observer.observe(set);
    let frame = 0;
    let previous = 0;
    let lastScroll = viewport.scrollLeft;
    position.current = lastScroll;
    const tick = (now: number) => {
      const elapsed = previous ? Math.min(now - previous, 50) : 0;
      previous = now;
      const loopWidth = set.offsetWidth;
      if (loopWidth > 0) {
        // Preserve fractional movement while accepting manual scrolling.
        if (Math.abs(viewport.scrollLeft - lastScroll) > 1) {
          position.current = viewport.scrollLeft;
        }
        position.current = ((position.current + elapsed * 0.035 * (lastSeats ? -1 : 1)) % loopWidth + loopWidth) % loopWidth;
        viewport.scrollLeft = position.current;
        lastScroll = viewport.scrollLeft;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [tours.length, lastSeats]);

  const move = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const set = viewport.querySelector<HTMLElement>(".featured-tours__set");
    const card = viewport.querySelector<HTMLElement>(".featured-tours__card");
    const loopWidth = set?.offsetWidth || 0;
    if (!loopWidth) return;
    const gap = set ? Number.parseFloat(window.getComputedStyle(set).columnGap) || 0 : 0;
    const distance = (card?.offsetWidth || 274) + gap;
    position.current = ((position.current + distance * direction) % loopWidth + loopWidth) % loopWidth;
    viewport.scrollLeft = position.current;
  };

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
        <span className="featured-tours__image-shade" />
        <span className="featured-tours__image-top">{lastSeats ? <><Armchair size={13} aria-hidden="true" /> Son {tour.available} koltuk</> : <><Sparkles size={13} aria-hidden="true" /> SEÇİLİ ROTA</>}</span>
        {tour.durationDays ? <span className="featured-tours__duration">{tour.durationDays} gün</span> : null}
      </div>
      <div className="featured-tours__card-body">
        <span className="featured-tours__eyebrow">EJDER TURİZM · TUR PROGRAMI</span>
        <h3>{tour.name}</h3>
        {tour.route ? <div className="featured-tours__fact"><MapPin size={14} aria-hidden="true" /><span>{tour.countries?.length ? tour.countries.map((country, index) => <span key={country}>{index > 0 ? " · " : null}<CountryName name={country} /></span>) : tour.route}{tour.countryCount && tour.countryCount > 2 ? ` +${tour.countryCount - 2} ülke` : ""}</span></div> : null}
        {tour.departureDate ? <div className="featured-tours__fact"><CalendarDays size={14} aria-hidden="true" /><span>Yakın çıkış: {tour.departureDate}</span></div> : null}
        <div className="featured-tours__card-bottom">
          <span>{tour.departureCity ? `${tour.departureCity} kalkışlı` : "Tur programı"}</span>
          <span className="featured-tours__card-action">Turu incele <ArrowUpRight aria-hidden="true" size={16} /></span>
        </div>
      </div>
    </Link>
  ));

  return (
    <section className="featured-tours" aria-labelledby={titleId}>
      <div className="featured-tours__heading">
        <div>
          <span className="featured-tours__kicker">{lastSeats ? <><Armchair aria-hidden="true" size={14} /> YOLCULUĞA SON BİR ADIM</> : <><Sparkles aria-hidden="true" size={14} /> ÖNE ÇIKAN ROTALAR</>}</span>
          <h2 id={titleId}>{lastSeats ? "Son Koltuklar" : "Çok Satan Turlar"}</h2>
          <p>{lastSeats ? "Rotanızı seçin, az kalan yerlerden birini ayırtın." : "Yeni bir yolculuk için ilham veren tur programlarını keşfedin."}</p>
        </div>
        <div className="featured-tours__actions">
          <button type="button" onClick={() => move(-1)} aria-label="Önceki turlar" className="featured-tours__control"><ArrowLeft size={18} /></button>
          <button type="button" onClick={() => move(1)} aria-label="Sonraki turlar" className="featured-tours__control"><ArrowRight size={18} /></button>
          <Link href="/tours" className="featured-tours__all">Tüm turları gör <ArrowUpRight aria-hidden="true" size={17} /></Link>
        </div>
      </div>
      <div ref={viewportRef} className="featured-tours__viewport">
        <div className="featured-tours__track">
          <div className="featured-tours__set">{cards(false)}</div>
          {Array.from({ length: copyCount - 1 }, (_, index) => (
            <div key={index} className="featured-tours__set" aria-hidden="true">{cards(true)}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
