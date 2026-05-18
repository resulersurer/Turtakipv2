"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { TourTimeline } from "@/components/tours/TourTimeline";
import { routeStats } from "@/lib/distance";

const PassengerMap = dynamic(() => import("@/components/maps/PassengerMap"), { ssr: false });

type Day = {
  id: string;
  dayNumber: number;
  title: string;
  city?: string | null;
  country?: string | null;
  description?: string | null;
  hotelInfo?: string | null;
  flightInfo?: string | null;
  photoUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  dateOffset?: number | null;
};

type SelectedDeparture = {
  startDate: string | Date;
  endDate?: string | Date | null;
  label?: string | null;
} | null;

function dayDate(departure: SelectedDeparture, day: Day) {
  if (!departure) return null;
  const date = new Date(departure.startDate);
  date.setDate(date.getDate() + (day.dateOffset ?? day.dayNumber - 1));
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export function PassengerTracker({ tour }: { tour: { name: string; days: Day[]; selectedDeparture?: SelectedDeparture } }) {
  const [selected, setSelected] = useState(tour.days[0]?.dayNumber || 1);
  const [playing, setPlaying] = useState(false);
  const [layer, setLayer] = useState<"dark" | "light" | "satellite">("dark");
  const ordered = useMemo(() => [...tour.days].sort((a, b) => a.dayNumber - b.dayNumber), [tour.days]);
  const index = Math.max(0, ordered.findIndex((day) => day.dayNumber === selected));
  const current = ordered[index] || ordered[0];
  const stats = routeStats(ordered);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setSelected((day) => {
        const currentIndex = ordered.findIndex((item) => item.dayNumber === day);
        return ordered[(currentIndex + 1) % ordered.length]?.dayNumber || day;
      });
    }, 2200);
    return () => window.clearInterval(timer);
  }, [playing, ordered]);

  return (
    <div className="grid min-h-[calc(100vh-48px)] gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="panel rounded-lg p-4">
        <div className="mb-4">
          <h1 className="text-xl font-semibold">{tour.name}</h1>
          {tour.selectedDeparture ? <p className="mt-1 text-sm text-mint">{dayDate(tour.selectedDeparture, ordered[0])} çıkışlı takip</p> : null}
          <p className="text-sm text-slate-400">Toplam rota: {stats.total} km</p>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <button className="btn" onClick={() => setSelected(ordered[Math.max(0, index - 1)]?.dayNumber || selected)}><SkipBack size={16} />Önceki</button>
          <button className="btn" onClick={() => setPlaying(!playing)}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? "Duraklat" : "Oynat"}</button>
          <button className="btn" onClick={() => setSelected(ordered[Math.min(ordered.length - 1, index + 1)]?.dayNumber || selected)}><SkipForward size={16} />Sonraki</button>
          <select className="input max-w-32" value={layer} onChange={(event) => setLayer(event.target.value as typeof layer)}><option value="dark">Koyu</option><option value="light">Açık</option><option value="satellite">Uydu</option></select>
        </div>
        <TourTimeline days={ordered} selected={selected} onSelect={setSelected} />
      </aside>
      <section className="grid gap-4 lg:grid-rows-[minmax(360px,1fr)_auto]">
        <div className="panel rounded-lg p-3"><PassengerMap days={ordered} selectedDay={selected} layer={layer} onSelect={setSelected} /></div>
        {current ? (
          <article className="panel grid gap-4 rounded-lg p-4 md:grid-cols-[220px_minmax(0,1fr)]">
            {current.photoUrl ? <div className="h-44 rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${current.photoUrl})` }} /> : <div className="h-44 rounded-md bg-ink" />}
            <div>
              <div className="text-sm text-mint">{current.dayNumber}. Gün • {dayDate(tour.selectedDeparture || null, current) || ""} • {[current.city, current.country].filter(Boolean).join(", ")}</div>
              <h2 className="mt-1 text-xl font-semibold">{current.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{current.description}</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                <span className="badge">Önceki güne mesafe: {stats.legs[index]?.distanceFromPrevious || 0} km</span>
                <span className="badge">Kümülatif mesafe: {stats.legs[index]?.totalDistance || 0} km</span>
                {current.hotelInfo ? <span>Otel: {current.hotelInfo}</span> : null}
                {current.flightInfo ? <span>Uçuş: {current.flightInfo}</span> : null}
              </div>
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}
