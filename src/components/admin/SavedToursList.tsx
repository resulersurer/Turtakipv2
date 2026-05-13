'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Copy, Trash2, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import Card from '@/components/ui/card';
import type { Tour } from '@/types/tour';
import { getIsoWeekday, getMonthLabel } from '@/lib/dates';

interface SavedToursListProps {
  tours: Tour[];
}

const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export default function SavedToursList({ tours }: SavedToursListProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [weekdayFilter, setWeekdayFilter] = useState('');

  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      const matchesQuery = query.trim().length === 0 || tour.name.toLowerCase().includes(query.toLowerCase());
      const matchesMonth = !monthFilter || getMonthLabel(tour.startDate) === monthFilter || getMonthLabel(tour.endDate) === monthFilter;
      const matchesWeekday = !weekdayFilter || tour.days.some((day) => getIsoWeekday(day.date) === weekdayFilter);
      return matchesQuery && matchesMonth && matchesWeekday;
    });
  }, [tours, query, monthFilter, weekdayFilter]);

  const monthOptions = useMemo(() => {
    return Array.from(new Set(tours.flatMap((tour) => [getMonthLabel(tour.startDate), getMonthLabel(tour.endDate)]))).filter(Boolean);
  }, [tours]);

  const onCopyLink = async (id: string) => {
    const link = `${window.location.origin}/tour/${id}`;
    await navigator.clipboard.writeText(link);
    toast.success('Yolcu linki kopyalandı');
  };

  const onDuplicate = async (id: string) => {
    const res = await fetch(`/api/tours/${id}/duplicate`, { method: 'POST' });
    if (!res.ok) {
      toast.error('Kopyalama başarısız');
      return;
    }
    toast.success('Tur kopyalandı');
    router.refresh();
  };

  const onDelete = async (id: string) => {
    if (!window.confirm('Tur kalıcı olarak silinsin mi?')) return;
    const res = await fetch(`/api/tours/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Silme işleminde hata oldu');
      return;
    }
    toast.success('Tur silindi');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full rounded-2xl border border-white/10 bg-[#0c1733]/90 py-3 pl-11 pr-4 text-sm text-slate-100 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
            placeholder="Tur veya destinasyon ara"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select className="rounded-2xl border border-white/10 bg-[#0c1733]/90 py-3 px-4 text-sm text-slate-100 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}>
          <option value="">Ay filtresi</option>
          {monthOptions.map((month) => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
        <select className="rounded-2xl border border-white/10 bg-[#0c1733]/90 py-3 px-4 text-sm text-slate-100 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" value={weekdayFilter} onChange={(event) => setWeekdayFilter(event.target.value)}>
          <option value="">Haftanın günü</option>
          {days.map((weekday) => (
            <option key={weekday} value={weekday}>{weekday}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4">
        {filteredTours.length === 0 ? (
          <Card className="border-dashed border-white/20 bg-white/5 p-10 text-center text-slate-300">
            Aradığınız kritere uyan tur bulunamadı.
          </Card>
        ) : (
          filteredTours.map((tour) => (
            <Card key={tour.id} className="grid gap-4 md:grid-cols-[1.4fr_auto] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-semibold text-white">{tour.name}</h3>
                  <Badge>{tour.days.length} gün</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {tour.startDate} - {tour.endDate} · Son güncelleme {new Date(tour.updatedAt).toLocaleDateString('tr-TR')}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                  {tour.days.slice(0, 3).map((day) => (
                    <span key={day.id} className="rounded-2xl bg-white/5 px-3 py-1">{day.city ?? 'Şehir yok'}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => router.push(`/admin?tourId=${tour.id}`)}>
                    <ArrowRight className="mr-2 h-4 w-4" /> Admin
                  </Button>
                  <Button type="button" className="bg-slate-900 hover:bg-slate-800" onClick={() => router.push(`/tour/${tour.id}`)}>
                    <Layers className="mr-2 h-4 w-4" /> Yolcu
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => onCopyLink(tour.id)} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10">
                    <Copy className="h-4 w-4" /> Kopyala
                  </button>
                  <button type="button" onClick={() => onDuplicate(tour.id)} className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">
                    <Sparkles className="h-4 w-4" /> Çoğalt
                  </button>
                  <button type="button" onClick={() => onDelete(tour.id)} className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500">
                    <Trash2 className="h-4 w-4" /> Sil
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
