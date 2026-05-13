'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Save, Trash2, Copy, Globe2, Sparkles } from 'lucide-react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import { TourDay, type Tour } from '@/types/tour';
import { tourPayloadSchema, type TourPayload } from '@/lib/validations';
import { getDateRangeDays } from '@/lib/dates';
import MapClient from '@/components/map/MapClient';
import DayEditorCard from './DayEditorCard';

interface TourEditorProps {
  tourId?: string;
}

const emptyDay = (dayNumber: number, date: string): TourDay => ({
  id: `${Date.now()}-${dayNumber}`,
  dayNumber,
  date,
  hour: '',
  city: '',
  country: '',
  activity: '',
  photoUrl: '',
  lat: undefined,
  lng: undefined
});

export default function TourEditor({ tourId }: TourEditorProps) {
  const router = useRouter();
  const [days, setDays] = useState<TourDay[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  const form = useForm<TourPayload>({
    resolver: zodResolver(tourPayloadSchema),
    defaultValues: {
      name: '',
      startDate: '',
      endDate: '',
      days: []
    }
  });

  const selectedDay = useMemo(() => days.find((day) => day.id === selectedDayId) ?? days[0], [days, selectedDayId]);

  useEffect(() => {
    if (!tourId) {
      const today = new Date().toISOString().slice(0, 10);
      setDays([emptyDay(1, today)]);
      setSelectedDayId(`${Date.now()}-1`);
      return;
    }

    let active = true;
    setIsLoading(true);
    fetch(`/api/tours/${tourId}`)
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) throw new Error('Tur yüklenemedi');
        const tour = (await res.json()) as Tour;
        const normalizedDays = tour.days.map((day) => ({
          ...day,
          hour: day.hour ?? undefined,
          city: day.city ?? undefined,
          country: day.country ?? undefined,
          activity: day.activity ?? undefined,
          photoUrl: day.photoUrl ?? undefined,
          lat: day.lat ?? undefined,
          lng: day.lng ?? undefined
        }));
        setDays(normalizedDays);
        form.reset({ name: tour.name, startDate: tour.startDate, endDate: tour.endDate, days: normalizedDays });
        setSelectedDayId(normalizedDays[0]?.id);
      })
      .catch(() => {
        toast.error('Tur yüklenirken hata oluştu.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tourId, form]);

  useEffect(() => {
    if (!form.watch('startDate') || !form.watch('endDate')) return;
    const start = form.getValues('startDate');
    const end = form.getValues('endDate');
    if (start && end) {
      const range = getDateRangeDays(start, end);
      if (range.length && range.length !== days.length) {
        setDays(range.map((date, index) => ({
          id: days[index]?.id ?? `${Date.now()}-${index}`,
          dayNumber: index + 1,
          date,
          hour: days[index]?.hour ?? '',
          city: days[index]?.city ?? '',
          country: days[index]?.country ?? '',
          activity: days[index]?.activity ?? '',
          photoUrl: days[index]?.photoUrl ?? '',
          lat: days[index]?.lat,
          lng: days[index]?.lng
        })));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch('startDate'), form.watch('endDate')]);

  const updateDay = (id: string, value: Partial<TourDay>) => {
    setDays((current) => current.map((day) => (day.id === id ? { ...day, ...value } : day)));
  };

  const removeDay = (id: string) => {
    setDays((current) => {
      const next = current.filter((day) => day.id !== id).map((day, index) => ({ ...day, dayNumber: index + 1 }));
      setSelectedDayId(next[0]?.id);
      return next;
    });
  };

  const addDay = () => {
    const nextNumber = days.length + 1;
    const lastDate = days[days.length - 1]?.date ?? new Date().toISOString().slice(0, 10);
    setDays((current) => [...current, emptyDay(nextNumber, lastDate)]);
    setSelectedDayId(`${Date.now()}-${nextNumber}`);
  };

  const moveDay = (dragIndex: number, hoverIndex: number) => {
    setDays((current) => {
      const next = [...current];
      const [removed] = next.splice(dragIndex, 1);
      next.splice(hoverIndex, 0, removed);
      return next.map((day, index) => ({ ...day, dayNumber: index + 1 }));
    });
  };

  const loadGeo = async (day: TourDay) => {
    if (!day.city && !day.country) return;
    setIsGeoLoading(true);
    try {
      const params = new URLSearchParams();
      if (day.city) params.set('city', day.city);
      if (day.country) params.set('country', day.country);
      const res = await fetch(`/api/geocode?${params.toString()}`);
      if (!res.ok) throw new Error('Konum bulunamadı');
      const data = await res.json();
      updateDay(day.id, { lat: data.lat, lng: data.lng });
      toast.success('Konum güncellendi');
    } catch {
      toast.error('Geocode bulunamadı.');
    } finally {
      setIsGeoLoading(false);
    }
  };

  const onSubmit = async (values: TourPayload) => {
    if (days.length === 0) {
      toast.error('En az bir gün ekleyin.');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        id: tourId,
        name: values.name,
        startDate: values.startDate,
        endDate: values.endDate,
        days
      };
      const res = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Kaydedilemedi');
      const result = await res.json();
      toast.success('Tur kaydedildi');
      if (!tourId) {
        router.replace(`/admin?tourId=${result.id}`);
      }
      router.refresh();
    } catch {
      toast.error('Tur kaydedilemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    if (!tourId) return;
    if (!window.confirm('Tur silinsin mi?')) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tours/${tourId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Silinemedi');
      toast.success('Tur silindi');
      router.push('/admin');
      router.refresh();
    } catch {
      toast.error('Tur silinirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDuplicate = async () => {
    if (!tourId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tours/${tourId}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Kopyalanamadı');
      const result = await res.json();
      toast.success('Tur kopyalandı');
      router.replace(`/admin?tourId=${result.id}`);
      router.refresh();
    } catch {
      toast.error('Tur kopyalanamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  const onCopyLink = () => {
    if (!tourId) return;
    const link = `${window.location.origin}/tour/${tourId}`;
    navigator.clipboard.writeText(link);
    toast.success('Yolcu linki kopyalandı');
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Label className="text-brand-200">Tur Bilgileri</Label>
              <h2 className="mt-2 text-2xl font-semibold text-white">Yeni tur oluştur</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge>{tourId ? 'Düzenleme' : 'Yeni Tur'}</Badge>
              <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-400">{days.length} gün</span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Tur adı</Label>
              <Input placeholder="Kapadokya Rüyası" {...form.register('name')} />
            </div>
            <div>
              <Label>Başlangıç</Label>
              <Input type="date" {...form.register('startDate')} />
            </div>
            <div>
              <Label>Bitiş</Label>
              <Input type="date" {...form.register('endDate')} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label className="text-brand-200">Tur Günleri</Label>
              <p className="mt-2 text-sm text-slate-400">Her bir gün için şehir, aktivite ve konum ekleyin.</p>
            </div>
            <Button type="button" onClick={addDay}>
              <Plus className="mr-2 h-4 w-4" /> Gün Ekle
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            {days.map((day, index) => (
              <DayEditorCard
                key={day.id}
                index={index}
                day={day}
                selected={selectedDay?.id === day.id}
                onSelect={() => setSelectedDayId(day.id)}
                onChange={(payload) => updateDay(day.id, payload)}
                onRemove={() => removeDay(day.id)}
                onGeocode={() => loadGeo(day)}
                isGeocoding={isGeoLoading}
                onMove={moveDay}
              />
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="text-brand-200">Harita</Label>
                <p className="text-sm text-slate-400">Haritada noktaları gör, seçili günü güncelle.</p>
              </div>
              <Button type="button" onClick={() => selectedDay && loadGeo(selectedDay)} disabled={isGeoLoading}>
                <Globe2 className="mr-2 h-4 w-4" /> Geocode
              </Button>
            </div>
            <MapClient days={days} selectedDayId={selectedDay?.id} onSelect={setSelectedDayId} onMapClick={(lat, lng) => selectedDay && updateDay(selectedDay.id, { lat, lng })} />
          </div>
        </Card>

        <Card>
          <div className="grid gap-4">
            <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" /> Turu Kaydet
            </Button>
            <Button type="button" className="bg-slate-900 hover:bg-slate-800" onClick={onCopyLink} disabled={!tourId}>
              <Copy className="mr-2 h-4 w-4" /> Yolcu Linki Kopyala
            </Button>
            <Button type="button" className="bg-slate-900 hover:bg-slate-800" onClick={onDuplicate} disabled={!tourId || isLoading}>
              <Sparkles className="mr-2 h-4 w-4" /> Turu Çoğalt
            </Button>
            <Button type="button" className="bg-red-600 hover:bg-red-500" onClick={onDelete} disabled={!tourId || isLoading}>
              <Trash2 className="mr-2 h-4 w-4" /> Turu Sil
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
