"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Map, Pause, Play, SkipBack, SkipForward } from "lucide-react";
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

function PhotoPanel({ day }: { day: Day }) {
  if (!day.photoUrl) return <div className="h-52 rounded-lg border border-line bg-ink/80" />;
  return (
    <div className="relative h-52 overflow-hidden rounded-lg border border-line bg-slate-950">
      <img src={day.photoUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-xl" />
      <img src={day.photoUrl} alt={day.title} className="relative z-10 h-full w-full object-contain" />
    </div>
  );
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
    }, 2600);
    return () => window.clearInterval(timer);
  }, [playing, ordered]);

  return (
    <div className="grid min-h-[calc(100vh-96px)] gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="panel flex max-h-none flex-col rounded-lg p-4 xl:max-h-[calc(100vh-96px)]">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-mint">Yolcu takip</p>
          <h1 className="mt-1 text-xl font-semibold leading-tight text-white">{tour.name}</h1>
          {tour.selectedDeparture ? <p className="mt-2 text-sm text-slate-300">{dayDate(tour.selectedDeparture, ordered[0])} çıkışlı tur</p> : null}
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <span className="rounded-md border border-line bg-ink/70 px-3 py-2 text-slate-300">{ordered.length} gün</span>
            <span className="rounded-md border border-line bg-ink/70 px-3 py-2 text-slate-300">{stats.total} km rota</span>
          </div>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button className="btn" onClick={() => setSelected(ordered[Math.max(0, index - 1)]?.dayNumber || selected)}><SkipBack size={16} />Önceki</button>
          <button className="btn" onClick={() => setSelected(ordered[Math.min(ordered.length - 1, index + 1)]?.dayNumber || selected)}><SkipForward size={16} />Sonraki</button>
          <button className="btn col-span-1" onClick={() => setPlaying(!playing)}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? "Duraklat" : "Oynat"}</button>
          <select className="input col-span-1" value={layer} onChange={(event) => setLayer(event.target.value as typeof layer)}>
            <option value="dark">Koyu</option>
            <option value="light">Açık</option>
            <option value="satellite">Uydu</option>
          </select>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <TourTimeline days={ordered} selected={selected} onSelect={setSelected} />
        </div>
      </aside>

      <section className="grid gap-4 xl:grid-rows-[minmax(520px,1fr)_auto]">
        <div className="panel overflow-hidden rounded-lg p-3">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 text-sm text-slate-300"><Map size={16} /> Canlı rota haritası</div>
            {current ? <span className="badge">{current.dayNumber}. gün seçili</span> : null}
          </div>
          <div className="h-[420px] overflow-hidden rounded-md xl:h-full">
            <PassengerMap days={ordered} selectedDay={selected} layer={layer} followSelected onSelect={setSelected} />
          </div>
        </div>

        {current ? (
          <article className="panel grid gap-4 rounded-lg p-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <PhotoPanel day={current} />
            <div>
              <div className="text-sm font-semibold text-mint">
                {current.dayNumber}. Gün · {dayDate(tour.selectedDeparture || null, current) || ""} · {[current.city, current.country].filter(Boolean).join(", ")}
              </div>
              <h2 className="mt-2 text-2xl font-semibold leading-tight text-white">{current.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{current.description}</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                <span className="badge">Önceki güne mesafe: {stats.legs[index]?.distanceFromPrevious || 0} km</span>
                <span className="badge">Kümülatif mesafe: {stats.legs[index]?.totalDistance || 0} km</span>
                {current.hotelInfo ? <span className="rounded-md border border-line bg-ink/60 p-2">Otel: {current.hotelInfo}</span> : null}
                {current.flightInfo ? <span className="rounded-md border border-line bg-ink/60 p-2">Uçuş: {current.flightInfo}</span> : null}
              </div>
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}
