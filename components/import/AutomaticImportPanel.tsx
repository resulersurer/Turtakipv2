"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, CircleX, LoaderCircle, Play, RefreshCw } from "lucide-react";

type Source = { id: string; key: string; label: string; listUrl: string; lastCheckedAt: string | null; lastSuccessAt: string | null; lastError: string | null; _count: { tours: number } };
type Run = { id: string; sourceKey: string | null; trigger: string; status: string; discovered: number; created: number; updated: number; unchanged: number; archived: number; failed: number; startedAt: string; finishedAt: string | null; error: string | null };
type Status = { configuredSources: { key: string; label: string; listUrl: string }[]; sources: Source[]; runs: Run[]; sourceRuns: Run[] };

const dateTime = (value: string | null) => value ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(value)) : "Henüz çalışmadı";
const statusLabels: Record<string, string> = { RUNNING: "Devam ediyor", COMPLETED: "Tamamlandı", PARTIAL: "Hatalarla tamamlandı", FAILED: "Başarısız" };

function elapsed(startedAt: string, finishedAt: string | null, now: number) {
  const seconds = Math.max(0, Math.floor(((finishedAt ? new Date(finishedAt).getTime() : now) - new Date(startedAt).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes} dk ${seconds % 60} sn` : `${seconds} sn`;
}

export function AutomaticImportPanel() {
  const [data, setData] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [trackingStartedAt, setTrackingStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const load = useCallback(async () => {
    const response = await fetch("/api/import/sync", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Senkronizasyon durumu alınamadı.");
    setData(body);
  }, []);
  useEffect(() => { void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Durum alınamadı.")); }, [load]);
  useEffect(() => { setNow(Date.now()); }, []);

  const isRunning = data?.sourceRuns.some((run) => run.status === "RUNNING") || false;
  useEffect(() => {
    if (!isRunning && trackingStartedAt === null) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
      void load().then(() => undefined).catch((reason) => setError(reason instanceof Error ? reason.message : "Durum alınamadı."));
    }, 3000);
    return () => window.clearInterval(timer);
  }, [isRunning, trackingStartedAt, load]);
  useEffect(() => {
    if (!trackingStartedAt || !data || isRunning) return;
    if (data.configuredSources.every((source) => data.sourceRuns.some((run) => run.sourceKey === source.key && new Date(run.startedAt).getTime() >= trackingStartedAt - 3000))) setTrackingStartedAt(null);
  }, [data, isRunning, trackingStartedAt]);

  async function run() {
    setBusy(true); setError("");
    try {
      const requestedAt = Date.now();
      const response = await fetch("/api/import/sync", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Senkronizasyon tamamlanamadı.");
      setTrackingStartedAt(requestedAt);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Senkronizasyon tamamlanamadı."); }
    finally { setBusy(false); }
  }

  const runningOrStarting = busy || isRunning || trackingStartedAt !== null;
  return <section className="panel p-5">
    <div className="admin-section-heading">
      <div><span className="admin-eyebrow">Her gün 06.00, 07.00 ve 08.00 · Türkiye saati</span><h2>Otomatik tur senkronizasyonu</h2><p>2026, 2027 ve EJDER VIP listelerini ayrı ayrı kontrol eder; yeni turları ekler, tarihleri günceller ve kaldırılan turları arşivler.</p></div>
      <CalendarClock size={22} />
    </div>
    {error ? <p className="my-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : null}
    {runningOrStarting && !isRunning ? <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><LoaderCircle className="animate-spin" size={20}/><div><strong>Senkronizasyon başlatılıyor</strong><p>Kaynak listeleri hazırlanıyor. Bu ekran otomatik yenilenecek.</p></div></div> : null}
    <div className="my-5 space-y-4">
      {(data?.configuredSources || []).map((config) => {
        const source = data?.sources.find((item) => item.key === config.key);
        const latest = data?.sourceRuns.find((item) => item.sourceKey === config.key);
        const isRunning = latest?.status === "RUNNING";
        const processed = latest ? latest.created + latest.updated + latest.unchanged + latest.failed : 0;
        const percent = latest?.discovered ? Math.min(100, Math.round((processed / latest.discovered) * 100)) : 0;
        return <article className="rounded-xl border border-slate-200 p-4" key={config.key}>
          <h3 className="mb-2 text-lg font-semibold">{config.label}</h3>
          <p className="mb-3 text-sm text-slate-500">{source ? `${source._count.tours} aktif tur` : "Kaynak henüz kontrol edilmedi"} · Son başarılı liste kontrolü: {dateTime(source?.lastSuccessAt || null)}</p>
          {source?.lastError ? <p className="mb-3 text-sm text-red-700">{source.lastError}</p> : null}
          {latest ? <div className={`rounded-xl border p-4 text-sm ${isRunning ? "border-blue-200 bg-blue-50" : latest.status === "COMPLETED" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2">{isRunning ? <LoaderCircle className="animate-spin text-blue-700" size={20}/> : latest.status === "COMPLETED" ? <CheckCircle2 className="text-emerald-700" size={20}/> : <CircleX className="text-amber-700" size={20}/>}<strong>{statusLabels[latest.status] || latest.status}</strong></div><span>{dateTime(latest.startedAt)} · {latest.trigger === "CRON" ? "Otomatik" : "Manuel"} · {elapsed(latest.startedAt, latest.finishedAt, now)}</span></div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80" role="progressbar" aria-label={`${config.label} senkronizasyon ilerlemesi`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><div className={`h-full rounded-full transition-all duration-500 ${latest.status === "COMPLETED" ? "bg-emerald-600" : "bg-blue-600"}`} style={{ width: `${isRunning ? Math.max(percent, 2) : percent}%` }}/></div>
            <div className="mt-2 flex flex-wrap justify-between gap-2"><strong>{isRunning ? `${processed} / ${latest.discovered} tur işlendi · %${percent}` : `${processed} / ${latest.discovered} tur işlendi`}</strong>{isRunning ? <span className="text-blue-800">Sayfa otomatik yenileniyor</span> : latest.finishedAt ? <span>Bitiş: {dateTime(latest.finishedAt)}</span> : null}</div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5"><span className="rounded-lg bg-white/70 p-2"><strong className="block text-lg">{latest.created}</strong>Yeni</span><span className="rounded-lg bg-white/70 p-2"><strong className="block text-lg">{latest.updated}</strong>Güncellendi</span><span className="rounded-lg bg-white/70 p-2"><strong className="block text-lg">{latest.unchanged}</strong>Değişmedi</span><span className="rounded-lg bg-white/70 p-2"><strong className="block text-lg">{latest.archived}</strong>Arşivlendi</span><span className="rounded-lg bg-white/70 p-2"><strong className="block text-lg">{latest.failed}</strong>Hata</span></div>
            {latest.status === "COMPLETED" ? <p className="mt-4 font-semibold text-emerald-800">Senkronizasyon tamamlandı. Yeni turları Turlar sayfasındaki Taslak filtresinden yayınlayabilirsiniz.</p> : null}
            {latest.error ? <p className="mt-3 text-red-800">{latest.error}</p> : null}
          </div> : <p className="text-sm text-slate-500">Bu kaynak için ayrı çalışma kaydı henüz yok. Sonuçlar bir sonraki senkronizasyonda görünecek.</p>}
        </article>;
      })}
      {!data ? <p className="text-sm text-slate-500">Senkronizasyon durumları yükleniyor…</p> : null}
    </div>
    <div className="mt-4 flex flex-wrap gap-3"><button className="btn-primary" type="button" onClick={() => void run()} disabled={runningOrStarting}><Play size={16}/>{runningOrStarting ? "Senkronizasyon sürüyor…" : "Şimdi senkronize et"}</button><button className="btn" type="button" onClick={() => void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Durum alınamadı."))} disabled={busy}><RefreshCw size={16}/>Durumu yenile</button></div>
  </section>;
}
