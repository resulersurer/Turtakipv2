"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Armchair, RefreshCw } from "lucide-react";
import { TourDataRefresh } from "@/components/admin/TourDataRefresh";

type Departure = {
  id: string; startDate: string; capacity: number | null; blockedSeats: number;
  summary: { confirmed: number; held: number; available: number | null };
};
type Tour = { id: string; name: string; status: string; departures: Departure[] };
const labels: Record<string, string> = { PUBLISHED: "Yayında", DRAFT: "Taslak", ARCHIVED: "Arşiv" };
const dateFormat = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "medium" });

function CapacityRow({ departure, tourName, onSaved }: { departure: Departure; tourName: string; onSaved: () => void }) {
  const [draft, setDraft] = useState<{ capacity: string; blocked: string } | null>(null);
  const capacity = draft?.capacity ?? departure.capacity?.toString() ?? "";
  const blocked = draft?.blocked ?? String(departure.blockedSeats);
  if (draft && draft.capacity === (departure.capacity?.toString() ?? "") && draft.blocked === String(departure.blockedSeats)) {
    setDraft(null);
  }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const date = dateFormat.format(new Date(departure.startDate));
  const changed = capacity !== (departure.capacity?.toString() ?? "") || blocked !== String(departure.blockedSeats);

  async function save() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/reservations/departures/${departure.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity: Number(capacity), blockedSeats: Number(blocked) })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? "Oturumunuz sona erdi. Sayfayı yenileyip yeniden giriş yapın." : body.error || "Kontenjan kaydedilemedi.");
      setDraft({ capacity: String(body.capacity), blocked: String(body.blockedSeats) });
      setNotice("Kontenjan kaydedildi.");
      onSaved();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Kontenjan kaydedilemedi."); }
    finally { lock.current = false; setBusy(false); }
  }

  return <form id={`departure-${departure.id}`} className="scroll-mt-6 rounded-xl border border-slate-200 p-4 target:border-blue-400 target:bg-blue-50" aria-label={`${tourName} · ${date} kontenjanı`} onSubmit={(event) => { event.preventDefault(); void save(); }}>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold">{date}</h3><p className="mt-1 text-sm text-slate-500">{departure.summary.confirmed} kesin · {departure.summary.held} opsiyon · {departure.summary.available === null ? "Kontenjan tanımsız" : `${Math.max(0, departure.summary.available)} müsait`}</p></div><Link className="text-sm underline" href={`/admin/reservations?departureId=${departure.id}`}>Rezervasyonları gör</Link></div>
    <fieldset disabled={busy} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <label className="space-y-1 text-sm"><span>Toplam koltuk</span><input className="input w-full" type="number" min={0} max={10000} step={1} required value={capacity} onChange={(event) => { setDraft({ capacity: event.target.value, blocked }); setNotice(""); }} placeholder="Örn. 46" /></label>
      <label className="space-y-1 text-sm"><span>Satışa kapalı koltuk</span><input className="input w-full" type="number" min={0} max={capacity === "" ? 10000 : Number(capacity)} step={1} required value={blocked} onChange={(event) => { setDraft({ capacity, blocked: event.target.value }); setNotice(""); }} /></label>
      <button className="btn-primary" type="submit" disabled={!changed}>{busy ? "Kaydediliyor…" : "Kaydet"}</button>
    </fieldset>
    {error ? <p className="mt-3 text-sm text-red-700" role="alert">{error}</p> : null}
    {notice ? <p className="mt-3 text-sm text-emerald-700" role="status">{notice}</p> : null}
  </form>;
}

export function CapacityDashboard({ tours }: { tours: Tour[] }) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [missingOnly, setMissingOnly] = useState(false);
  const refresh = () => startTransition(() => router.refresh());
  const visible = tours.filter((tour) => tour.name.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR")) && (status === "ALL" || tour.status === status))
    .map((tour) => ({ ...tour, departures: tour.departures.filter((departure) => !missingOnly || departure.capacity === null) }))
    .filter((tour) => !missingOnly || tour.departures.length > 0);
  const departures = tours.flatMap((tour) => tour.departures);
  const missing = departures.filter((departure) => departure.capacity === null).length;

  return <main className="page-shell space-y-6">
    <TourDataRefresh />
    <header className="admin-page-header"><div className="admin-page-header__title"><span className="admin-eyebrow">Koltuk yönetimi</span><h1>Kontenjanlar</h1><p>Tüm turların çıkış tarihleri için toplam ve satışa kapalı koltukları düzenleyin.</p></div><div className="admin-page-actions"><button className="btn" type="button" disabled={refreshing} onClick={refresh}><RefreshCw size={16} />{refreshing ? "Yenileniyor…" : "Yenile"}</button></div></header>
    <section className="panel space-y-4 p-5">
      <p className="flex items-center gap-2 text-sm text-slate-600"><Armchair size={18} />{tours.length} tur · {departures.length} çıkış · {missing} kontenjan tanımsız</p>
      <div className="grid gap-4 md:grid-cols-[1fr_200px]"><label className="space-y-1 text-sm"><span>Tur ara</span><input className="input w-full" placeholder="Tur adı" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="space-y-1 text-sm"><span>Tur durumu</span><select className="input w-full" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">Tüm turlar</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={missingOnly} onChange={(event) => setMissingOnly(event.target.checked)} />Yalnızca kontenjanı tanımlanmamış çıkışlar</label>
      <p className="text-xs text-slate-500">Rehber ve operasyon için ayrılan koltukları satışa kapalı olarak girin. Toplam kontenjan, mevcut rezervasyonlar ve ayrılan koltukların altına indirilemez.</p>
    </section>
    {visible.map((tour) => <section className="panel p-5" key={tour.id}><div className="admin-section-heading"><div><h2>{tour.name}</h2><p>{tour.departures.length} çıkış</p></div><span className="badge">{labels[tour.status] || tour.status}</span></div><div className="space-y-3">{tour.departures.map((departure) => <CapacityRow key={departure.id} departure={departure} tourName={tour.name} onSaved={refresh} />)}</div>{!tour.departures.length ? <p className="text-sm text-slate-500">Bu turda henüz çıkış tarihi yok. <Link className="underline" href={`/admin/tours/${tour.id}`}>Çıkış tarihi ekle</Link></p> : null}</section>)}
    {!visible.length ? <section className="panel p-8 text-center text-slate-500">{tours.length ? "Aramanıza uygun tur bulunamadı." : "Henüz tur bulunmuyor."}</section> : null}
  </main>;
}
