'use client';

import Link from 'next/link';
import { Calendar, MapPin, Plane, ArrowUpRight, Compass } from 'lucide-react';
import type { Tour } from '@/types/tour';

export interface EnrichedTourItem extends Tour {
  airline?: string;
  originCity?: string;
  coverImage?: string;
  year?: string | number;
  activeDayIndex?: number;
  totalDaysCount?: number;
  totalPointsCount?: number;
  statusText?: string;
  statusType?: 'ongoing' | 'ending_soon' | 'today_departure' | 'upcoming';
  countryList?: string[];
}

interface PassengerTourCardProps {
  tour: EnrichedTourItem;
}

export default function PassengerTourCard({ tour }: PassengerTourCardProps) {
  const totalDays = tour.totalDaysCount || (tour.days && tour.days.length > 0 ? tour.days.length : 10);
  const totalPoints = tour.totalPointsCount || (tour.days ? tour.days.filter((d) => d.lat != null && d.lng != null).length : totalDays);
  const airline = tour.airline || 'TÜRK HAVA YOLLARI';
  const origin = tour.originCity || 'İstanbul';
  const year = tour.year || '2026';

  // Format date range nicely
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const startFormatted = formatDate(tour.startDate);
  const endFormatted = formatDate(tour.endDate);
  const dateRangeText = startFormatted && endFormatted ? `${startFormatted} - ${endFormatted}` : (tour.startDate || '2026 Sezonu');

  // Fallback high-res thematic background images for tours
  const defaultImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
  const coverImg = tour.coverImage || (tour.days && tour.days[0]?.photoUrl) || defaultImage;

  // Status color styles
  const isEndingSoon = tour.statusType === 'ending_soon' || tour.statusText?.includes('sonra bitecek');
  const isOngoing = tour.statusType === 'ongoing' || tour.statusText?.includes('devam ediyor');
  const isTodayDeparture = tour.statusType === 'today_departure';

  return (
    <Link
      href={`/tour/${tour.id}`}
      className="group relative flex flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#07132e]/90 shadow-panel backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-400/40 hover:shadow-2xl hover:shadow-brand-500/10"
    >
      {/* Visual Cover Top Banner */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-900">
        <img
          src={coverImg}
          alt={tour.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07132e] via-[#07132e]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute left-3.5 top-3.5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md border border-white/15">
            <Calendar className="h-3.5 w-3.5 text-brand-300" />
            {dateRangeText}
          </span>
        </div>

        {/* Airline / Emblem Top Right */}
        <div className="absolute right-3.5 top-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/95 p-1.5 shadow-lg backdrop-blur-md transition-transform group-hover:scale-110">
            {airline.toUpperCase().includes('TÜRK') || airline.toUpperCase().includes('THY') ? (
              <span className="text-[10px] font-black tracking-tighter text-red-600">THY</span>
            ) : airline.toUpperCase().includes('PEGASUS') || airline.toUpperCase().includes('PC') ? (
              <span className="text-[10px] font-black tracking-tighter text-amber-500">PGS</span>
            ) : airline.toUpperCase().includes('QATAR') ? (
              <span className="text-[10px] font-black tracking-tighter text-purple-900">QR</span>
            ) : airline.toUpperCase().includes('INDIGO') ? (
              <span className="text-[10px] font-black tracking-tighter text-blue-700">6E</span>
            ) : (
              <Plane className="h-4 w-4 text-slate-800" />
            )}
          </div>
        </div>

        {/* Big Year Watermark */}
        <div className="pointer-events-none absolute right-3 bottom-2 select-none text-4xl font-black tracking-tighter text-white/15 group-hover:text-white/25 transition-colors">
          {year}
        </div>

        {/* Small Destination Tag on Image */}
        <div className="absolute bottom-3 left-4">
          <span className="inline-flex items-center gap-1 rounded-lg bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-slate-200 backdrop-blur-sm border border-white/10">
            <Compass className="h-3 w-3 text-cyan-400" />
            {totalDays} Günlük Keşif
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold leading-snug text-white transition-colors group-hover:text-brand-200 line-clamp-2">
              {tour.name}
            </h3>
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition-all group-hover:bg-brand-500 group-hover:text-white">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-300">
            <span className="text-slate-200">{totalDays} gün</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">{origin}</span>
            <span className="text-slate-500">•</span>
            <span className="font-semibold text-brand-300">{airline}</span>
          </div>
        </div>

        {/* Progress & Route Footer */}
        <div className="mt-5 border-t border-white/10 pt-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-brand-400" />
              <span>{totalDays} günlük rota, {totalPoints} harita noktası</span>
            </span>

            {/* Status indicator */}
            {tour.statusText && (
              <span
                className={`font-semibold ${
                  isEndingSoon
                    ? 'text-amber-400'
                    : isOngoing
                    ? 'text-amber-300'
                    : isTodayDeparture
                    ? 'text-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                {tour.statusText}
              </span>
            )}
          </div>

          {/* Micro Progress Bar */}
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isEndingSoon
                  ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                  : 'bg-gradient-to-r from-brand-500 to-cyan-400'
              }`}
              style={{
                width: tour.activeDayIndex
                  ? `${Math.min(100, Math.round((tour.activeDayIndex / totalDays) * 100))}%`
                  : '65%'
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
