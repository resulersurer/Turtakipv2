"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Save, Plus, Trash2, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";
import { PhotoUpload } from "@/components/upload/PhotoUpload";

const AdminMap = dynamic(() => import("@/components/maps/AdminMap"), { ssr: false });

type TourFormData = {
  id?: string;
  externalId?: string | null;
  sourceUrl?: string | null;
  slug: string;
  name: string;
  durationDays?: number | null;
  departureCity?: string | null;
  airline?: string | null;
  visaStatus?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  coverImageUrl?: string | null;
  departures: Array<{ startDate: string; endDate?: string | null; label?: string | null; price?: number | null; currency: string; availabilityStatus?: string | null }>;
  days: Array<{ dayNumber: number; title: string; dateOffset: number; hour?: string | null; city?: string | null; country?: string | null; description?: string | null; hotelInfo?: string | null; flightInfo?: string | null; photoUrl?: string | null; lat?: number | null; lng?: number | null; sortOrder: number }>;
  images: Array<{ url: string; alt?: string | null; sortOrder: number }>;
  prices: Array<{ roomType: string; adultPrice?: number | null; childPrice?: number | null; currency: string }>;
};

const blank: TourFormData = {
  slug: "",
  name: "",
  status: "DRAFT",
  departures: [],
  days: [],
  images: [],
  prices: []
};

function dateInput(value?: string | Date | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function TourForm({ initial }: { initial?: Partial<TourFormData> }) {
  const router = useRouter();
  const [tour, setTour] = useState<TourFormData>({ ...blank, ...initial } as TourFormData);
  const [activeDay, setActiveDay] = useState(tour.days[0]?.dayNumber || 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoGeocoded = useRef(new Set<string>());
  const orderedDays = useMemo(() => [...tour.days].sort((a, b) => a.sortOrder - b.sortOrder), [tour.days]);

  function patch<K extends keyof TourFormData>(key: K, value: TourFormData[K]) {
    setTour((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const payload = { ...tour, slug: tour.slug || slugify(tour.name) };
    const response = await fetch(tour.id ? `/api/tours/${tour.id}` : "/api/tours", {
      method: tour.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "Kaydetme başarısız");
      return;
    }
    router.push(`/admin/tours/${data.id}`);
    router.refresh();
  }

  async function suggest(dayNumber: number) {
    const day = tour.days.find((item) => item.dayNumber === dayNumber);
    if (!day) return;
    const query = [day.city, day.country].filter(Boolean).join(" ");
    if (!query) return;
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    const hit = data.results?.[0];
    if (hit) {
      patch(
        "days",
        tour.days.map((item) => (item.dayNumber === dayNumber ? { ...item, lat: hit.lat, lng: hit.lng } : item))
      );
    }
  }

  useEffect(() => {
    const missing = tour.days.find((day) => {
      const query = [day.city, day.country].filter(Boolean).join(" ");
      const key = `${day.dayNumber}:${query}`;
      return query && (day.lat == null || day.lng == null) && !autoGeocoded.current.has(key);
    });
    if (!missing) return;
    const query = [missing.city, missing.country].filter(Boolean).join(" ");
    const key = `${missing.dayNumber}:${query}`;
    autoGeocoded.current.add(key);
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      const hit = data.results?.[0];
      if (hit) {
        setTour((current) => ({
          ...current,
          days: current.days.map((day) => (day.dayNumber === missing.dayNumber ? { ...day, lat: hit.lat, lng: hit.lng } : day))
        }));
        setActiveDay(missing.dayNumber);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [tour.days]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="space-y-5">
        <div className="panel rounded-lg p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">Tur adı<input className="input" value={tour.name} onChange={(e) => patch("name", e.target.value)} /></label>
            <label className="space-y-1 text-sm">Slug<input className="input" value={tour.slug} onChange={(e) => patch("slug", e.target.value)} placeholder={slugify(tour.name)} /></label>
            <label className="space-y-1 text-sm">Süre<input className="input" type="number" value={tour.durationDays || ""} onChange={(e) => patch("durationDays", Number(e.target.value) || null)} /></label>
            <label className="space-y-1 text-sm">Kalkış<input className="input" value={tour.departureCity || ""} onChange={(e) => patch("departureCity", e.target.value)} /></label>
            <label className="space-y-1 text-sm">Havayolu<input className="input" value={tour.airline || ""} onChange={(e) => patch("airline", e.target.value)} /></label>
            <label className="space-y-1 text-sm">Vize<input className="input" value={tour.visaStatus || ""} onChange={(e) => patch("visaStatus", e.target.value)} /></label>
            <label className="space-y-1 text-sm">Durum<select className="input" value={tour.status} onChange={(e) => patch("status", e.target.value as TourFormData["status"])}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select></label>
            <label className="space-y-1 text-sm">Kapak görseli<input className="input" value={tour.coverImageUrl || ""} onChange={(e) => patch("coverImageUrl", e.target.value)} /></label>
          </div>
        </div>

        <div className="panel rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Çıkış tarihleri</h2><button className="btn" onClick={() => patch("departures", [...tour.departures, { startDate: dateInput(new Date()), endDate: null, currency: "EUR" }])}><Plus size={16} />Ekle</button></div>
          <div className="space-y-2">
            {tour.departures.map((departure, index) => (
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_80px_40px]" key={index}>
                <input className="input" type="date" value={dateInput(departure.startDate)} onChange={(e) => patch("departures", tour.departures.map((d, i) => (i === index ? { ...d, startDate: e.target.value } : d)))} />
                <input className="input" type="date" value={dateInput(departure.endDate)} onChange={(e) => patch("departures", tour.departures.map((d, i) => (i === index ? { ...d, endDate: e.target.value } : d)))} />
                <input className="input" placeholder="Etiket" value={departure.label || ""} onChange={(e) => patch("departures", tour.departures.map((d, i) => (i === index ? { ...d, label: e.target.value } : d)))} />
                <input className="input" placeholder="Fiyat" type="number" value={departure.price || ""} onChange={(e) => patch("departures", tour.departures.map((d, i) => (i === index ? { ...d, price: Number(e.target.value) || null } : d)))} />
                <button className="btn" onClick={() => patch("departures", tour.departures.filter((_, i) => i !== index))}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Gün gün program</h2><button className="btn" onClick={() => patch("days", [...tour.days, { dayNumber: tour.days.length + 1, title: "Yeni Gün", dateOffset: tour.days.length, sortOrder: tour.days.length }])}><Plus size={16} />Gün</button></div>
          <div className="space-y-3">
            {orderedDays.map((day, index) => (
              <div className="rounded-md border border-line bg-ink/60 p-3" key={day.dayNumber}>
                <div className="mb-2 flex items-center justify-between"><button className="font-semibold text-mint" onClick={() => setActiveDay(day.dayNumber)}>{day.dayNumber}. Gün</button><button className="btn" onClick={() => suggest(day.dayNumber)}><Wand2 size={16} />Koordinat</button></div>
                <div className="grid gap-2 md:grid-cols-2">
                  <input className="input" value={day.title} onChange={(e) => patch("days", tour.days.map((d) => (d.dayNumber === day.dayNumber ? { ...d, title: e.target.value } : d)))} />
                  <input className="input" placeholder="Saat" value={day.hour || ""} onChange={(e) => patch("days", tour.days.map((d) => (d.dayNumber === day.dayNumber ? { ...d, hour: e.target.value } : d)))} />
                  <input className="input" placeholder="Şehir" value={day.city || ""} onChange={(e) => patch("days", tour.days.map((d) => (d.dayNumber === day.dayNumber ? { ...d, city: e.target.value } : d)))} />
                  <input className="input" placeholder="Ülke" value={day.country || ""} onChange={(e) => patch("days", tour.days.map((d) => (d.dayNumber === day.dayNumber ? { ...d, country: e.target.value } : d)))} />
                  <input className="input" placeholder="Lat" value={day.lat || ""} onChange={(e) => patch("days", tour.days.map((d) => (d.dayNumber === day.dayNumber ? { ...d, lat: Number(e.target.value) || null } : d)))} />
                  <input className="input" placeholder="Lng" value={day.lng || ""} onChange={(e) => patch("days", tour.days.map((d) => (d.dayNumber === day.dayNumber ? { ...d, lng: Number(e.target.value) || null } : d)))} />
                </div>
                <textarea className="input mt-2 min-h-24" value={day.description || ""} onChange={(e) => patch("days", tour.days.map((d) => (d.dayNumber === day.dayNumber ? { ...d, description: e.target.value } : d)))} placeholder="Açıklama" />
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <input className="input" placeholder="Otel" value={day.hotelInfo || ""} onChange={(e) => patch("days", tour.days.map((d) => (d.dayNumber === day.dayNumber ? { ...d, hotelInfo: e.target.value } : d)))} />
                  <input className="input" placeholder="Uçuş" value={day.flightInfo || ""} onChange={(e) => patch("days", tour.days.map((d) => (d.dayNumber === day.dayNumber ? { ...d, flightInfo: e.target.value } : d)))} />
                </div>
                <div className="mt-2 flex gap-2"><PhotoUpload onUploaded={(url) => patch("days", tour.days.map((d) => (d.dayNumber === day.dayNumber ? { ...d, photoUrl: url } : d)))} /><button className="btn" onClick={() => patch("days", tour.days.filter((d) => d.dayNumber !== day.dayNumber))}><Trash2 size={16} />Sil</button></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="sticky top-4 space-y-4">
          <div className="panel rounded-lg p-3">
            <AdminMap
              days={orderedDays}
              activeDay={activeDay}
              onPick={(lat, lng) => patch("days", tour.days.map((day) => (day.dayNumber === activeDay ? { ...day, lat, lng } : day)))}
            />
            <p className="mt-2 text-xs text-slate-400">Haritaya tıklayınca seçili günün koordinatı güncellenir.</p>
          </div>
          {error ? <div className="rounded-md border border-coral bg-coral/10 p-3 text-sm text-coral">{error}</div> : null}
          <button className="btn-primary w-full rounded-md" disabled={saving} onClick={save}><Save size={16} />{saving ? "Kaydediliyor" : "Kaydet"}</button>
        </div>
      </aside>
    </div>
  );
}
