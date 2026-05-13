'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Camera, Sparkles } from 'lucide-react';
import MapClient from '@/components/map/MapClient';
import Timeline from './Timeline';
import TourDayCard from './TourDayCard';
import Card from '@/components/ui/card';
import type { Tour, TourDay } from '@/types/tour';
import { formatShortDate, getIsoWeekday } from '@/lib/dates';

interface PassengerTourViewProps {
  tour: Tour;
}

export default function PassengerTourView({ tour }: PassengerTourViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const days = tour.days;
  const activeDay = useMemo(() => days[selectedIndex] ?? days[0], [days, selectedIndex]);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
      <section className="rounded-[32px] border border-white/10 bg-[#07122f]/90 p-8 shadow-glass backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/15 px-4 py-2 text-sm font-semibold text-brand-100">
              <Sparkles className="h-4 w-4" /> Premium seyahat deneyimi
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{tour.name}</h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              {tour.startDate} - {tour.endDate} tarihleri arasında planlanmış büyüleyici turunuz. Gün gün rotanızı haritada ve detaylı açıklamalarla keşfedin.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3">
                <CalendarDays className="h-4 w-4" /> {days.length} gün
              </span>
              <span className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3">
                <MapPin className="h-4 w-4" /> {activeDay.city ?? 'Belirlenmemiş şehir'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3">
                {getIsoWeekday(activeDay.date)} · {formatShortDate(activeDay.date)}
              </span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 text-slate-200">
              <p className="text-sm uppercase tracking-[0.24em] text-brand-200">En yakın durak</p>
              <p className="mt-3 text-2xl font-semibold">{activeDay.city ?? 'Şehir ekleyin'}</p>
              <p className="mt-2 text-sm text-slate-400">{activeDay.activity ?? 'Aktivite detayları burada görünecek.'}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 text-slate-200">
              <p className="text-sm uppercase tracking-[0.24em] text-brand-200">Fotoğraf</p>
              <div className="mt-4 flex h-28 items-center justify-center rounded-3xl bg-slate-900/80 text-slate-500">
                <Camera className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <Card className="rounded-[32px] border border-white/10 bg-[#07122f]/90 p-6 shadow-panel">
            <h2 className="text-xl font-semibold text-white">Tur Planı</h2>
            <Timeline days={days} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
          </Card>
          <div className="flex items-center justify-between gap-4">
            <button type="button" onClick={() => setSelectedIndex(Math.max(selectedIndex - 1, 0))} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-100 transition hover:border-brand-400">
              <ArrowLeft className="h-4 w-4" /> Önceki
            </button>
            <button type="button" onClick={() => setSelectedIndex(Math.min(selectedIndex + 1, days.length - 1))} className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">
              Sonraki <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <TourDayCard day={activeDay} />
          </Card>
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-brand-300" />
              <h3 className="text-lg font-semibold text-white">Tur Haritası</h3>
            </div>
            <MapClient days={days} selectedDayId={activeDay.id} onSelect={(id) => setSelectedIndex(days.findIndex((item) => item.id === id))} />
          </Card>
        </div>
      </section>
    </div>
  );
}
