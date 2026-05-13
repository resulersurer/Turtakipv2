'use client';

import type { TourDay } from '@/types/tour';
import { formatShortDate, getIsoWeekday } from '@/lib/dates';

interface TimelineProps {
  days: TourDay[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export default function Timeline({ days, selectedIndex, onSelect }: TimelineProps) {
  return (
    <div className="grid gap-3">
      {days.map((day, index) => (
        <button
          key={day.id}
          type="button"
          onClick={() => onSelect(index)}
          className={`flex w-full items-center justify-between rounded-3xl border px-4 py-4 text-left transition ${
            index === selectedIndex ? 'border-brand-400 bg-brand-500/10 text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:border-brand-400 hover:bg-white/10'
          }`}
        >
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-brand-200">Gün {day.dayNumber}</p>
            <p className="mt-1 text-base font-semibold">{day.city ?? 'Bilinmeyen konum'}</p>
          </div>
          <div className="text-sm text-slate-300">{formatShortDate(day.date)}</div>
        </button>
      ))}
    </div>
  );
}
