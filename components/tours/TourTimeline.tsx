"use client";

import { routeStats } from "@/lib/distance";

type Day = {
  id?: string;
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
};

export function TourTimeline({ days, selected, onSelect }: { days: Day[]; selected: number; onSelect: (day: number) => void }) {
  const stats = routeStats(days);
  return (
    <div className="relative space-y-3 border-l border-slate-200 pl-4">
      {days.map((day, index) => {
        const leg = stats.legs[index];
        const active = day.dayNumber === selected;
        return (
          <button
            key={day.id || day.dayNumber}
            onClick={() => onSelect(day.dayNumber)}
            className={`relative w-full rounded-md border p-3 text-left transition ${active ? "border-[#7f1d1d] bg-[#7f1d1d]/10 shadow-sm" : "border-slate-200 bg-white hover:border-[#7f1d1d]/50"}`}
          >
            <span className={`absolute -left-[23px] top-4 h-3 w-3 rounded-full border ${active ? "border-[#7f1d1d] bg-[#7f1d1d]" : "border-slate-300 bg-slate-300"}`} />
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-[#7f1d1d]">{day.dayNumber}. Gün</span>
              <span className="text-xs text-slate-500">{leg.distanceFromPrevious} km</span>
            </div>
            <div className="mt-1 line-clamp-2 text-sm text-slate-700">{day.title}</div>
            <div className="mt-1 text-xs text-slate-500">{[day.city, day.country].filter(Boolean).join(", ")}</div>
          </button>
        );
      })}
    </div>
  );
}
