"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Play, RefreshCw, TriangleAlert } from "lucide-react";

type Source = { id: string; key: string; label: string; listUrl: string; lastCheckedAt: string | null; lastSuccessAt: string | null; lastError: string | null; _count: { tours: number } };
type Run = { id: string; trigger: string; status: string; discovered: number; created: number; updated: number; unchanged: number; archived: number; failed: number; startedAt: string; finishedAt: string | null; error: string | null };
type Status = { sources: Source[]; runs: Run[] };

const dateTime = (value: string | null) => value ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(value)) : "Henüz çalışmadı";

export function AutomaticImportPanel() {
  const [data, setData] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/import/sync", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Senkronizasyon durumu alınamadı.");
    setData(body);
  }, []);
  useEffect(() => { void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Durum alınamadı.")); }, [load]);

  async function run() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/import/sync", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Senkronizasyon tamamlanamadı.");
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Senkronizasyon tamamlanamadı."); }
    finally { setBusy(false); }
  }

  const latest = data?.runs[0];
  return <section className="panel p-5">
    <div className="admin-section-heading">
      <div><span className="admin-eyebrow">Her gün 06.00, 07.00 ve 08.00 · Türkiye saati</span><h2>Otomatik tur senkronizasyonu</h2><p>2026, 2027 ve EJDER VIP listelerini ayrı ayrı kontrol eder; yeni turları ekler, tarihleri günceller ve kaldırılan turları arşivler.</p></div>
      <CalendarClock size={22} />
    </div>
    {error ? <p className="my-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : null}
    <div className="my-5 grid gap-3 lg:grid-cols-2">
      {(data?.sources || []).map((source) => <article className="admin-list-item" key={source.id}>
        <div className="admin-list-item__main"><h3>{source.label}</h3><p>{source._count.tours} aktif tur · Son başarılı kontrol: {dateTime(source.lastSuccessAt)}</p><a className="break-all text-xs text-slate-500" href={source.listUrl} target="_blank" rel="noreferrer">{source.listUrl}</a>{source.lastError ? <p className="mt-1 text-red-700">{source.lastError}</p> : null}</div>
        {source.lastError ? <TriangleAlert size={20} className="text-red-700" /> : <CheckCircle2 size={20} className="text-emerald-700" />}
      </article>)}
      {!data?.sources.length ? <p className="text-sm text-slate-500">Kaynaklar ilk senkronizasyonda oluşturulacak.</p> : null}
    </div>
    {latest ? <div className="rounded-xl border border-line bg-white/60 p-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><strong>Son çalışma: {latest.status}</strong><span>{dateTime(latest.startedAt)} · {latest.trigger === "CRON" ? "Otomatik" : "Manuel"}</span></div><p className="mt-2 text-slate-600">{latest.discovered} bulundu · {latest.created} yeni · {latest.updated} güncellendi · {latest.unchanged} değişmedi · {latest.archived} arşivlendi · {latest.failed} hata</p></div> : null}
    <div className="mt-4 flex flex-wrap gap-3"><button className="btn-primary" type="button" onClick={() => void run()} disabled={busy}><Play size={16}/>{busy ? "Senkronize ediliyor…" : "Şimdi senkronize et"}</button><button className="btn" type="button" onClick={() => void load()} disabled={busy}><RefreshCw size={16}/>Durumu yenile</button></div>
  </section>;
}
