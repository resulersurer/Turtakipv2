"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarDays, Check, Download, Plus, RefreshCw, Users, X } from "lucide-react";
import { assertBookable, csvCell, effectiveStatus, occupancy, type BookingStatus } from "@/lib/reservations/domain";

type Departure = {
  id: string; startDate: string; endDate: string | null; capacity: number | null; blockedSeats: number;
  tour: { id: string; name: string; status: string };
};
type Reservation = {
  id: string; code: string; contactName: string; contactPhone: string; contactEmail: string | null;
  notes: string | null; seats: number; status: BookingStatus; holdExpiresAt: string | null; createdAt: string;
  passengers: Array<{ id: string; fullName: string }>;
  events: Array<{ id: string; message: string; createdAt: string }>;
};
type Dashboard = { selectedId: string | null; serverTime: string; departures: Departure[]; reservations: Reservation[] };
const statusLabels = { HOLD: "Opsiyon", CONFIRMED: "Kesin", CANCELLED: "İptal", EXPIRED: "Süresi doldu" };
const dateFormat = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "long", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...init?.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(response.status === 401 ? "Oturumunuz sona erdi. Yeniden giriş yapmak için sayfayı yenileyin." : data.error || "İşlem tamamlanamadı.");
  return data as T;
}

function BookingForm({ departureId, available, busy, onSave, onClose }: {
  departureId: string; available: number; busy: boolean;
  onSave: (payload: object) => Promise<boolean>; onClose: () => void;
}) {
  const [status, setStatus] = useState<"HOLD" | "CONFIRMED">("CONFIRMED");
  const [passengers, setPassengers] = useState([""]);
  const requestId = useRef<string | null>(null);
  const lastPayload = useRef("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = {
      departureId, contactName: form.get("contactName"), contactPhone: form.get("contactPhone"),
      contactEmail: form.get("contactEmail"), notes: form.get("notes"), status,
      holdExpiresAt: status === "HOLD" ? new Date(`${form.get("holdExpiresAt")}:00+03:00`).toISOString() : null,
      passengers
    };
    const fingerprint = JSON.stringify(value);
    if (!requestId.current || lastPayload.current !== fingerprint) requestId.current = crypto.randomUUID();
    lastPayload.current = fingerprint;
    if (await onSave({ ...value, requestId: requestId.current })) onClose();
  };
  return <form className="panel space-y-5 p-5" onSubmit={submit}>
    <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Yeni rezervasyon</h2><button className="btn" type="button" onClick={onClose} disabled={busy} aria-label="Rezervasyon formunu kapat"><X size={16} /></button></div>
    <fieldset disabled={busy} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1 text-sm">İletişim kişisi<input name="contactName" className="input w-full" required minLength={2} maxLength={120} autoComplete="name" /></label>
        <label className="space-y-1 text-sm">Telefon<input name="contactPhone" className="input w-full" type="tel" required minLength={7} maxLength={30} autoComplete="tel" /></label>
        <label className="space-y-1 text-sm">E-posta (isteğe bağlı)<input name="contactEmail" className="input w-full" type="email" maxLength={254} autoComplete="email" /></label>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Yolcular · {passengers.length} koltuk</h3><span className="text-sm text-slate-500">Her yolcu bir koltuk kullanır.</span></div>
        <div className="grid gap-3 md:grid-cols-2">{passengers.map((name, index) => <div key={index} className="flex items-end gap-2">
          <label className="flex-1 space-y-1 text-sm">{index + 1}. yolcu adı soyadı<input className="input w-full" required minLength={2} maxLength={120} value={name} onChange={(e) => setPassengers(passengers.map((p, i) => i === index ? e.target.value : p))} /></label>
          {passengers.length > 1 && <button className="btn" type="button" aria-label={`${index + 1}. yolcuyu kaldır`} onClick={() => setPassengers(passengers.filter((_, i) => i !== index))}><X size={16} /></button>}
        </div>)}</div>
        <button className="btn mt-3" type="button" disabled={passengers.length >= Math.min(available, 200)} onClick={() => setPassengers([...passengers, ""])}><Plus size={16} />Yolcu ekle</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">Rezervasyon durumu<select className="input w-full" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}><option value="CONFIRMED">Kesin rezervasyon</option><option value="HOLD">Süreli opsiyon</option></select></label>
        {status === "HOLD" && <label className="space-y-1 text-sm">Opsiyon bitişi (Türkiye saati)<input className="input w-full" name="holdExpiresAt" type="datetime-local" required /><span className="block text-xs text-slate-500">Süre dolunca koltuklar otomatik serbest kalır.</span></label>}
      </div>
      <label className="block space-y-1 text-sm">Notlar (isteğe bağlı)<textarea className="input w-full" name="notes" maxLength={2000} rows={3} /></label>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">{passengers.length} yolcu · {available} müsait koltuk</p><button className="btn-primary" type="submit" disabled={available < passengers.length}>{busy ? "Kaydediliyor…" : "Rezervasyonu kaydet"}</button></div>
    </fieldset>
  </form>;
}

export function ReservationDashboard() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<Dashboard | null>(null);
  const [selectedId, setSelectedId] = useState(() => searchParams.get("departureId") || "");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const clockOffset = useRef(0);
  const sequence = useRef(0);
  const mutationLock = useRef(false);

  const load = useCallback(async () => {
    const version = ++sequence.current;
    try {
      const next = await requestJson<Dashboard>(`/api/reservations${selectedId ? `?departureId=${encodeURIComponent(selectedId)}` : ""}`);
      if (version !== sequence.current) return;
      clockOffset.current = new Date(next.serverTime).getTime() - Date.now();
      setNow(new Date(next.serverTime));
      setData(next);
      setError("");
    } catch (error) {
      if (version === sequence.current) setError(error instanceof Error ? error.message : "Rezervasyonlar yüklenemedi.");
    } finally { if (version === sequence.current) setLoading(false); }
  }, [selectedId]);

  const invalidateRequests = useCallback(() => { sequence.current++; }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => { if (!mutationLock.current) void load(); }, 30000);
    const timer = setInterval(() => setNow(new Date(Date.now() + clockOffset.current)), 1000);
    return () => { invalidateRequests(); clearInterval(interval); clearInterval(timer); };
  }, [load, invalidateRequests]);

  const mutate = async (url: string, method: string, payload: object, success: string) => {
    if (mutationLock.current) return false;
    mutationLock.current = true;
    sequence.current++;
    setBusy(true); setError(""); setNotice("");
    try {
      await requestJson(url, { method, body: JSON.stringify(payload) });
      await load();
      setNotice(success);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "İşlem tamamlanamadı.");
      return false;
    } finally { mutationLock.current = false; setBusy(false); }
  };

  const departure = data?.departures.find((d) => d.id === data.selectedId);
  const summary = departure && data ? occupancy(departure.capacity, departure.blockedSeats, data.reservations, now) : null;
  let bookingRestriction = "";
  if (departure) {
    try { assertBookable(new Date(departure.startDate), departure.tour.status, now); }
    catch (error) { bookingRestriction = error instanceof Error ? error.message : "Bu çıkışa rezervasyon kapalı."; }
  }
  const canBook = !bookingRestriction && summary?.available !== null && (summary?.available ?? 0) > 0;
  const reservations = data?.reservations.filter((r) => {
    const text = [r.code, r.contactName, r.contactPhone, ...r.passengers.map((p) => p.fullName)].join(" ").toLocaleLowerCase("tr-TR");
    return text.includes(query.toLocaleLowerCase("tr-TR")) && (filter === "ALL" || effectiveStatus(r, now) === filter);
  }) || [];

  const exportPassengers = () => {
    if (!departure) return;
    const rows = [["Rezervasyon", "Tur", "Çıkış", "Durum", "Yolcu", "İletişim kişisi", "Telefon", "E-posta"]];
    for (const r of reservations) for (const passenger of r.passengers) rows.push([r.code, departure.tour.name, dateFormat.format(new Date(departure.startDate)), statusLabels[effectiveStatus(r, now)], passenger.fullName, r.contactName, r.contactPhone, r.contactEmail || ""]);
    const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a"); link.href = url; link.download = `yolcular-${departure.startDate.slice(0, 10)}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <main className="page-shell space-y-6">
    <header className="admin-page-header"><div className="admin-page-header__title"><span className="admin-eyebrow">Koltuk operasyonu</span><h1>Rezervasyonlar</h1><p>Rezervasyonları, opsiyonları ve yolcu kayıtlarını yönetin.</p></div><div className="admin-page-actions"><Link className="btn" href="/admin/capacities">Kontenjanlar</Link><button className="btn" disabled={busy || loading} onClick={() => { setLoading(true); void load(); }}><RefreshCw size={16} />Yenile</button></div></header>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{notice}</div>}
    {loading && <p role="status" className="text-slate-500">Rezervasyonlar yükleniyor…</p>}
    {data?.departures.length === 0 && <section className="panel p-8 text-center"><CalendarDays className="mx-auto mb-3 text-slate-400" size={36} /><h2 className="text-lg font-semibold">Henüz çıkış tarihi yok</h2><p className="my-3 text-slate-500">Rezervasyona başlamak için bir tura çıkış tarihi ekleyin.</p><Link className="btn-primary" href="/admin/tours">Turlara git</Link></section>}
    {data && departure && summary && <>
      <section className="panel p-5"><label className="block space-y-2 font-semibold"><span>Tur ve çıkış tarihi</span><select className="input w-full" disabled={busy || loading} value={data.selectedId || ""} onChange={(e) => { setSelectedId(e.target.value); setLoading(true); setShowForm(false); setCancelId(null); setNotice(""); setQuery(""); }}>
        {data.departures.map((d) => <option key={d.id} value={d.id}>{dateFormat.format(new Date(d.startDate))} · {d.tour.name}{d.tour.status === "ARCHIVED" ? " (Arşiv)" : ""}</option>)}
      </select></label><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500"><span>{dateFormat.format(new Date(departure.startDate))}{departure.endDate ? ` – ${dateFormat.format(new Date(departure.endDate))}` : ""} · Türkiye saati</span><Link className="underline" href={`/admin/tours/${departure.tour.id}`}>Turu düzenle</Link></div></section>
      <section aria-label="Koltuk özeti" className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[
        ["Toplam koltuk", summary.capacity ?? "—"], ["Kesin rezervasyon", summary.confirmed], ["Opsiyonda", summary.held], ["Satışa kapalı", summary.blockedSeats], ["Müsait koltuk", summary.available ?? "—"]
      ].map(([label, value]) => <div className="panel p-4" key={label}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}</section>
      {departure.capacity === null && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">Bu çıkışın kapasitesi henüz tanımlanmadı. Rezervasyon açmak için <Link className="font-semibold underline" href={`/admin/capacities#departure-${departure.id}`}>Kontenjanlar sayfasından kapasiteyi tanımlayın</Link>.</p>}
      {bookingRestriction && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">{bookingRestriction} Mevcut kayıtları görüntüleyebilir ve iptal edebilirsiniz.</p>}
      {showForm && <BookingForm key={departure.id} departureId={departure.id} available={bookingRestriction ? 0 : summary.available ?? 0} busy={busy || loading} onClose={() => setShowForm(false)} onSave={(payload) => mutate("/api/reservations", "POST", payload, "Rezervasyon kaydedildi.")} />}
      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Rezervasyon listesi</h2><p className="text-sm text-slate-500">{reservations.length} kayıt · Liste 30 saniyede bir yenilenir.</p></div><div className="flex flex-wrap gap-2"><button className="btn" disabled={loading || !reservations.length} onClick={exportPassengers}><Download size={16} />Yolcuları CSV indir</button><button className="btn-primary" disabled={!canBook || busy || loading || showForm} onClick={() => { setShowForm(true); setNotice(""); }}><Plus size={16} />Yeni rezervasyon</button></div></div>
        <div className="my-4 grid gap-3 md:grid-cols-[1fr_220px]"><label className="space-y-1 text-sm">Rezervasyon ara<input className="input w-full" placeholder="Kod, yolcu, iletişim kişisi veya telefon" value={query} onChange={(e) => setQuery(e.target.value)} /></label><label className="space-y-1 text-sm">Durum<select className="input w-full" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="ALL">Tüm durumlar</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
        <p className="mb-4 text-xs text-slate-500">CSV, mevcut arama ve durum filtresindeki yolcuları içerir.</p>
        {!reservations.length && <div className="py-10 text-center text-slate-500"><Users className="mx-auto mb-3" size={32} /><p>{data.reservations.length ? "Aramanıza uygun rezervasyon bulunamadı." : "Bu çıkışta henüz rezervasyon yok."}</p></div>}
        <div className="space-y-3">{reservations.map((r) => {
          const status = effectiveStatus(r, now);
          return <article key={r.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{r.contactName}</h3><span className="badge">{statusLabels[status]}</span><span className="text-sm text-slate-500">{r.seats} koltuk</span></div><p className="mt-1 font-mono text-xs text-slate-500">{r.code}</p><p className="mt-2 text-sm">{r.contactPhone}{r.contactEmail ? ` · ${r.contactEmail}` : ""}</p>{r.holdExpiresAt && <p className="mt-1 text-sm text-slate-500">Opsiyon bitişi: {timeFormat.format(new Date(r.holdExpiresAt))}</p>}</div><div className="flex flex-wrap gap-2">
              {status === "HOLD" && <button className="btn" disabled={busy || loading || !!bookingRestriction} onClick={() => void mutate(`/api/reservations/${r.id}`, "PATCH", { status: "CONFIRMED" }, `${r.code} kesinleştirildi.`)}><Check size={16} />Kesinleştir</button>}
              {status !== "CANCELLED" && <button className="btn" disabled={busy || loading} onClick={() => setCancelId(r.id)}>İptal et</button>}
            </div></div>
            {cancelId === r.id && <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-red-50 p-3"><p className="text-sm text-red-800">{r.code} iptal edilsin mi? Ayrılmış koltuklar serbest kalacak.</p><button className="btn" disabled={busy || loading} onClick={async () => { if (await mutate(`/api/reservations/${r.id}`, "PATCH", { status: "CANCELLED" }, `${r.code} iptal edildi.`)) setCancelId(null); }}>İptali onayla</button><button className="btn" disabled={busy} onClick={() => setCancelId(null)}>Vazgeç</button></div>}
            <details className="mt-3 border-t border-slate-100 pt-3"><summary className="cursor-pointer text-sm font-semibold">Yolcular ve işlem geçmişi</summary><ul className="mt-3 list-inside list-decimal space-y-1 text-sm">{r.passengers.map((p) => <li key={p.id}>{p.fullName}</li>)}</ul>{r.notes && <p className="mt-3 whitespace-pre-wrap text-sm"><strong>Not:</strong> {r.notes}</p>}<ul className="mt-4 space-y-1 text-xs text-slate-500">{r.events.map((event) => <li key={event.id}>{timeFormat.format(new Date(event.createdAt))} · {event.message}</li>)}{status === "EXPIRED" && <li>{timeFormat.format(new Date(r.holdExpiresAt!))} · Opsiyon süresi doldu; koltuklar serbest bırakıldı.</li>}</ul></details>
          </article>;
        })}</div>
      </section>
    </>}
  </main>;
}
