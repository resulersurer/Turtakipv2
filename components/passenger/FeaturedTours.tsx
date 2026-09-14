"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, MapPin, Pause, Play, Sparkles } from "lucide-react";

type FeaturedTour = {
  id: string;
  slug: string;
  name: string;
  coverImageUrl?: string | null;
  durationDays?: number | null;
  departureCity?: string | null;
  departureDate?: string | null;
  route?: string;
  countryCount?: number;
};

export function FeaturedTours({ tours }: { tours: FeaturedTour[] }) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const hovered = useRef(false);
  const focused = useRef(false);
  const visible = useRef(false);
  const manualUntil = useRef(0);

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
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    if (!section || !viewport) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(motion.matches);
    updateMotion();
    motion.addEventListener("change", updateMotion);
    const observer = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting; }, { threshold: 0.05 });
    observer.observe(section);
    let frame = 0;
    let previous = 0;
    const tick = (now: number) => {
      const elapsed = previous ? Math.min(now - previous, 50) : 0;
      previous = now;
      if (visible.current && !paused && !motion.matches && !hovered.current && !focused.current && !document.hidden && now > manualUntil.current) {
        const loopWidth = viewport.scrollWidth / 2;
        if (loopWidth > 0) viewport.scrollLeft = (viewport.scrollLeft + elapsed * 0.035) % loopWidth;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => { window.cancelAnimationFrame(frame); observer.disconnect(); motion.removeEventListener("change", updateMotion); };
  }, [paused]);

  const move = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const card = viewport.querySelector<HTMLElement>(".featured-tours__card");
    const distance = (card?.offsetWidth || 274) + 18;
    const loopWidth = viewport.scrollWidth / 2;
    if (direction < 0 && viewport.scrollLeft < distance) viewport.scrollLeft += loopWidth;
    viewport.scrollBy({ left: distance * direction, behavior: reducedMotion ? "instant" : "smooth" });
    manualUntil.current = performance.now() + 3500;
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
        <span className="featured-tours__image-top"><Sparkles size={13} aria-hidden="true" /> SEÇİLİ ROTA</span>
        {tour.durationDays ? <span className="featured-tours__duration">{tour.durationDays} gün</span> : null}
      </div>
      <div className="featured-tours__card-body">
        <span className="featured-tours__eyebrow">EJDER TURİZM · TUR PROGRAMI</span>
        <h3>{tour.name}</h3>
        {tour.route ? <div className="featured-tours__fact"><MapPin size={14} aria-hidden="true" /><span>{tour.route}{tour.countryCount && tour.countryCount > 2 ? ` +${tour.countryCount - 2} ülke` : ""}</span></div> : null}
        {tour.departureDate ? <div className="featured-tours__fact"><CalendarDays size={14} aria-hidden="true" /><span>Yakın çıkış: {tour.departureDate}</span></div> : null}
        <div className="featured-tours__card-bottom">
          <span>{tour.departureCity ? `${tour.departureCity} kalkışlı` : "Tur programı"}</span>
          <span className="featured-tours__card-action">Turu incele <ArrowUpRight aria-hidden="true" size={16} /></span>
        </div>
      </div>
    </Link>
  ));

  return (
    <section ref={sectionRef} className="featured-tours" aria-labelledby="featured-tours-title">
      <div className="featured-tours__heading">
        <div>
          <span className="featured-tours__kicker"><Sparkles aria-hidden="true" size={14} /> ÖNE ÇIKAN ROTALAR</span>
          <h2 id="featured-tours-title">Çok Satan Turlar</h2>
          <p>Yeni bir yolculuk için ilham veren tur programlarını keşfedin.</p>
        </div>
        <div className="featured-tours__actions">
          <button type="button" onClick={() => move(-1)} aria-label="Önceki turlar" className="featured-tours__control"><ArrowLeft size={18} /></button>
          <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Kaydırmayı başlat" : "Kaydırmayı duraklat"} aria-pressed={paused} className="featured-tours__control">{paused ? <Play size={18} /> : <Pause size={18} />}</button>
          <button type="button" onClick={() => move(1)} aria-label="Sonraki turlar" className="featured-tours__control"><ArrowRight size={18} /></button>
          <Link href="/tours" className="featured-tours__all">Tüm turları gör <ArrowUpRight aria-hidden="true" size={17} /></Link>
        </div>
      </div>
      <div ref={viewportRef} className="featured-tours__viewport" onMouseEnter={() => { hovered.current = true; }} onMouseLeave={() => { hovered.current = false; }} onFocusCapture={() => { focused.current = true; }} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) focused.current = false; }} onTouchStart={() => { manualUntil.current = performance.now() + 5000; }}>
        <div className="featured-tours__track">
          <div className="featured-tours__set">{cards(false)}</div>
          <div className="featured-tours__set" aria-hidden="true">{cards(true)}</div>
        </div>
      </div>
    </section>
  );
}
