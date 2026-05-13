'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MapPin, X } from 'lucide-react';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Card from '@/components/ui/card';
import type { TourDay } from '@/types/tour';

interface DayEditorCardProps {
  day: TourDay;
  index: number;
  selected?: boolean;
  onSelect: () => void;
  onChange: (payload: Partial<TourDay>) => void;
  onRemove: () => void;
  onGeocode: () => void;
  isGeocoding: boolean;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

export default function DayEditorCard({ day, index, selected, onSelect, onChange, onRemove, onGeocode, isGeocoding, onMove }: DayEditorCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: day.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={selected ? 'border-brand-400/50 bg-[#0c1b42]/95' : ''}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button type="button" {...attributes} {...listeners} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-slate-200 transition hover:bg-white/10">
              <GripVertical className="h-5 w-5" />
            </button>
            <div>
              <div className="text-sm uppercase tracking-[0.24em] text-brand-200">Gün {day.dayNumber}</div>
              <button type="button" onClick={onSelect} className="text-lg font-semibold text-white hover:text-brand-200">
                {day.date}
              </button>
            </div>
          </div>
          <button onClick={onRemove} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600/15 text-red-300 transition hover:bg-red-600/25">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Tarih</Label>
          <Input value={day.date} onChange={(event) => onChange({ date: event.target.value })} />
        </div>
        <div>
          <Label>Saat</Label>
          <Input value={day.hour ?? ''} onChange={(event) => onChange({ hour: event.target.value })} placeholder="09:30" />
        </div>
        <div>
          <Label>Şehir</Label>
          <Input value={day.city ?? ''} onChange={(event) => onChange({ city: event.target.value })} placeholder="İstanbul" />
        </div>
        <div>
          <Label>Ülke</Label>
          <Input value={day.country ?? ''} onChange={(event) => onChange({ country: event.target.value })} placeholder="Türkiye" />
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div>
          <Label>Aktivite</Label>
          <Input value={day.activity ?? ''} onChange={(event) => onChange({ activity: event.target.value })} placeholder="Balon turu ve Kapadokya keşfi" />
        </div>
        <div>
          <Label>Fotoğraf URL</Label>
          <Input value={day.photoUrl ?? ''} onChange={(event) => onChange({ photoUrl: event.target.value })} placeholder="https://..." />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Lat</Label>
          <Input value={day.lat ?? ''} onChange={(event) => onChange({ lat: event.target.value ? Number(event.target.value) : undefined })} placeholder="37.0" />
        </div>
        <div>
          <Label>Lng</Label>
          <Input value={day.lng ?? ''} onChange={(event) => onChange({ lng: event.target.value ? Number(event.target.value) : undefined })} placeholder="32.0" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onGeocode} disabled={isGeocoding} className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-70">
          <MapPin className="h-4 w-4" /> {isGeocoding ? 'Konum aranıyor...' : 'Geocode'}
        </button>
        {day.lat != null && day.lng != null ? (
          <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-2 text-sm text-slate-300">
            {day.lat.toFixed(4)}, {day.lng.toFixed(4)}
          </span>
        ) : null}
      </div>
      </Card>
    </div>
  );
}
