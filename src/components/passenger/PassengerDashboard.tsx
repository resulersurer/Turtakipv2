'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Compass, Globe, MapPin, Calendar, Layers, ShieldCheck, ChevronRight, X } from 'lucide-react';
import PassengerTourCard, { type EnrichedTourItem } from './PassengerTourCard';
import PassengerGlobalMapClient from './PassengerGlobalMapClient';

interface PassengerDashboardProps {
  initialTours: EnrichedTourItem[];
  agencyName?: string;
  countryListText?: string;
}

export default function PassengerDashboard({
  initialTours,
  agencyName = 'EJDER TURİZM YOLCU TAKİP',
  countryListText = 'VİETNAM, FRANSA, KAMBOÇYA, LAOS, JAPONYA, ENDONEZYA, TÜRKİYE, GÜNEY KORE, PERU, BREZİLYA, İTALYA, ARJANTİN, MEKSİKA, ÇİN, ARNAVUTLUK, RUSYA, GÜNEY AFRİKA, MALEZYA, KAMERUN, MOĞOLİSTAN, ABD, BOLİVYA, SRİ LANKA, HİNDİSTAN, ŞİLİ, FİLİPİNLER, TÜRKMENİSTAN, KÜBA, ANGOLA - 29 ÜLKE'
}: PassengerDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'ongoing' | 'today'>('all');

  // Filter tours by search query (matching tour name, city, country, airline)
  const filteredTours = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return initialTours;

    return initialTours.filter((tour) => {
      const matchName = tour.name.toLowerCase().includes(query);
      const matchAirline = tour.airline?.toLowerCase().includes(query) ?? false;
      const matchCity = tour.days?.some((d) => d.city?.toLowerCase().includes(query)) ?? false;
      const matchCountry = tour.days?.some((d) => d.country?.toLowerCase().includes(query)) ?? false;
      return matchName || matchAirline || matchCity || matchCountry;
    });
  }, [initialTours, searchQuery]);

  // Today departing tours
  const todayDepartures = useMemo(() => {
    return filteredTours.filter((tour) => tour.statusType === 'today_departure');
  }, [filteredTours]);

  // Ongoing tours
  const ongoingTours = useMemo(() => {
    return filteredTours.filter((tour) => tour.statusType !== 'today_departure');
  }, [filteredTours]);

  return (
    <div className="mx-auto flex max-w-[1520px] flex-col gap-8">
      {/* Top Banner / Corporate Hero Card */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#071129]/95 p-6 sm:p-8 lg:p-10 shadow-glass backdrop-blur-xl">
        {/* Subtle radial glow inside header */}
        <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-500/5 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Top Row: Agency Badge & Action Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold tracking-wider text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              {agencyName}
            </div>

            {/* Nav Buttons */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                Anasayfa
              </Link>
              <a
                href="#ongoing-tours"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                Tur listesi
              </a>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand-400/30 bg-brand-500/15 px-4 py-2 text-xs font-semibold text-brand-200 transition hover:bg-brand-500 hover:text-white"
              >
                Yönetim
              </Link>
            </div>
          </div>

          {/* Main Hero Title */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Bu hafta dünyayı keşfediyoruz
            </h1>
            <p className="mt-3.5 max-w-5xl text-xs sm:text-sm font-medium leading-relaxed tracking-wide text-slate-300">
              {countryListText}
            </p>
          </div>

          {/* Corporate Search Bar */}
          <div className="mt-2 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tur, şehir, ülke veya havayolu ara..."
                className="w-full rounded-2xl border border-white/10 bg-[#0c193c]/90 py-3.5 pl-12 pr-10 text-sm font-medium text-white placeholder-slate-400 outline-none transition focus:border-cyan-400 focus:bg-[#0e1e47] focus:ring-2 focus:ring-cyan-400/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition-all duration-200 hover:from-teal-400 hover:to-emerald-400 hover:shadow-teal-500/30 active:scale-98"
            >
              <Search className="h-4 w-4" />
              <span>Ara</span>
            </button>
          </div>
        </div>
      </section>

      {/* Global Interactive Map Section */}
      <section className="space-y-3">
        <PassengerGlobalMapClient tours={filteredTours} />
      </section>

      {/* Section 1: Bugün Çıkışlı Turlar */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Bugün çıkışlı turlar
            </h2>
            <span className="inline-flex items-center rounded-full bg-cyan-500/15 px-3 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-500/30">
              {todayDepartures.length} tur
            </span>
          </div>
        </div>

        {todayDepartures.length === 0 ? (
          <div className="flex items-center justify-start rounded-2xl border border-white/5 bg-[#071129]/60 px-6 py-5 text-sm font-medium text-slate-400 backdrop-blur-md">
            <span>Bu bölümde tur çıkışı yok.</span>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {todayDepartures.map((tour) => (
              <PassengerTourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Devam Eden Turlar */}
      <section id="ongoing-tours" className="space-y-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Devam eden turlar
            </h2>
            <span className="inline-flex items-center rounded-full bg-brand-500/15 px-3 py-0.5 text-xs font-bold text-brand-300 border border-brand-500/30">
              {ongoingTours.length} tur
            </span>
          </div>
        </div>

        {ongoingTours.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center text-slate-400">
            Aradığınız kritere uygun devam eden tur bulunamadı.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ongoingTours.map((tour) => (
              <PassengerTourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </section>

      {/* Bottom Subtle Corporate Info */}
      <footer className="mt-6 border-t border-white/10 py-6 text-center text-xs font-medium text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>EJDER TURİZM Dijital Rota & Canlı Yolcu Takip Portalı</span>
        </div>
        <p>© 2026 Tüm Hakları Saklıdır.</p>
      </footer>
    </div>
  );
}
