"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CalendarPlus2, FileClock, RefreshCw, TriangleAlert } from "lucide-react";

type Summary = { trigger?: string; changeType?: string; changes?: string[]; addedDates?: string[]; removedDates?: string[]; warnings?: string[] };
type Log = { id: string; status: string; message: string; sourceUrl: string; createdAt: string; rawSummary: Summary | null; tour: { id: string; name: string } | null };

const dateTime = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" });
const shortDate = (value: string) => new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
const labels: Record<string, string> = { CREATED: "Yeni tur", UPDATED: "Güncellendi", ARCHIVED: "Arşivlendi" };

export function ImportChangeHistory() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/import/logs", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Değişiklik geçmişi alınamadı.");
      setLogs(body); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Değişiklik geçmişi alınamadı."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return <section className="panel p-5">
    <div className="admin-section-heading"><div><h2>İçe aktarma değişiklik geçmişi</h2><p>Otomatik ve manuel aktarımlarda yapılan son 100 işlem</p></div><button className="btn" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={16}/>{loading ? "Yükleniyor" : "Yenile"}</button></div>
    {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800" role="alert">{error}</p> : null}
    <div className="admin-list mt-4">
      {logs.map((log) => {
        const summary = log.rawSummary || {};
        const type = summary.changeType || (log.status === "FAILED" ? "FAILED" : "IMPORTED");
        return <article className="rounded-xl border border-line bg-white/60 p-4" key={log.id}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="badge">{labels[type] || (type === "FAILED" ? "Hata" : "İçe aktarıldı")}</span><span className="text-xs text-slate-500">{summary.trigger === "CRON" ? "Otomatik" : "Manuel"}</span></div><h3 className="mt-2 font-semibold">{log.tour ? <Link href={`/admin/tours/${log.tour.id}`}>{log.tour.name}</Link> : log.message}</h3><p className="mt-1 text-sm text-slate-500"><FileClock className="mr-1 inline" size={14}/>{dateTime.format(new Date(log.createdAt))}</p></div>{log.status === "FAILED" ? <TriangleAlert className="text-red-700" size={20}/> : <CalendarPlus2 className="text-emerald-700" size={20}/>}</div>
          {summary.changes?.length ? <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">{summary.changes.map((change) => <li key={change}>{change}</li>)}</ul> : <p className="mt-3 text-sm text-slate-700">{log.message}</p>}
          {(summary.addedDates?.length || summary.removedDates?.length) ? <div className="mt-3 flex flex-wrap gap-2">{summary.addedDates?.map((value) => <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800" key={`add-${value}`}>+ {shortDate(value)}</span>)}{summary.removedDates?.map((value) => <span className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-800" key={`remove-${value}`}>− {shortDate(value)}</span>)}</div> : null}
          <a className="mt-3 block truncate text-xs text-slate-400" href={log.sourceUrl} target="_blank" rel="noreferrer">{log.sourceUrl}</a>
        </article>;
      })}
      {!loading && !logs.length ? <p className="py-8 text-center text-sm text-slate-500">Henüz içe aktarma kaydı yok.</p> : null}
    </div>
  </section>;
}
