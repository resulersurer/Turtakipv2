'use client';

import type { TourDay } from '@/types/tour';
import { MapPin, Clock3, Globe2, Camera } from 'lucide-react';
import { formatShortDate, getIsoWeekday } from '@/lib/dates';

interface TourDayCardProps {
  day: TourDay;
}

export default function TourDayCard({ day }: TourDayCardProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-white/10 bg-[#09172b]/90 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-brand-200">Gün {day.dayNumber}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{day.city ?? 'Şehir yok'}</h2>
            <p className="mt-1 text-sm text-slate-400">{getIsoWeekday(day.date)}, {formatShortDate(day.date)}</p>
          </div>
          <div className="rounded-3xl bg-brand-500/10 px-4 py-3 text-sm font-semibold text-brand-100">
            {day.country ?? 'Ülke yok'}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-[#07122f]/90 p-5">
          <div className="mb-4 flex items-center gap-3 text-brand-100">
            <Clock3 className="h-4 w-4" /> Saat
          </div>
          <p className="text-lg text-white">{day.hour || 'Belirtilmemiş'}</p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-[#07122f]/90 p-5">
          <div className="mb-4 flex items-center gap-3 text-brand-100">
            <MapPin className="h-4 w-4" /> Konum
          </div>
          <p className="text-lg text-white">{day.city || 'Şehir yok'}</p>
          <p className="mt-1 text-sm text-slate-400">{day.lat && day.lng ? `${day.lat.toFixed(4)}, ${day.lng.toFixed(4)}` : 'Koordinat eksik'}</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-[#07122f]/90 p-6">
        <div className="mb-4 flex items-center gap-3 text-brand-100">
          <Globe2 className="h-4 w-4" /> Aktivite
        </div>
        <p className="text-lg text-white">{day.activity || 'Aktivite açıklaması eklenmemiş.'}</p>
      </div>

      {day.photoUrl ? (
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#08132d]/90">
          <img src={day.photoUrl} alt={day.activity ?? 'Tour fotoğrafı'} className="h-64 w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-[32px] border border-dashed border-white/10 bg-[#08132d]/90 text-slate-500">
          <Camera className="mr-2 h-5 w-5" /> Fotoğraf yok
        </div>
      )}
    </div>
  );
}
