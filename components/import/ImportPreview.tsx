"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ImportResult = {
  url: string;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  tour?: { id: string; name: string; status: string };
  error?: string;
};

const DEFAULT_BATCH_SIZE = 3;
const BATCH_PAUSE_MS = 2500;

function titleFromUrl(url: string) {
  try {
    const last = decodeURIComponent(new URL(url).pathname.split("/").pop() || url);
    return last.replace(/_23\.html$/i, "").replace(/[-_]+/g, " ").trim();
  } catch {
    return url;
  }
}

function ImportRow({ item, index }: { item: ImportResult; index: number }) {
  return (
    <div className={`rounded-md border p-2 ${item.status === "FAILED" ? "border-coral/40 bg-coral/5" : "border-line bg-panel/70"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge">{item.status}</span>
        {item.tour ? (
          <Link className="text-mint" href={`/admin/tours/${item.tour.id}`}>
            {item.tour.name}
          </Link>
        ) : (
          <span className="text-slate-300">{index + 1}. {titleFromUrl(item.url)}</span>
        )}
      </div>
      <div className="mt-1 break-all text-xs text-slate-500">{item.url}</div>
      {item.error ? <div className="mt-1 text-xs text-coral">{item.error}</div> : null}
    </div>
  );
}

export function ImportPreview({ mode }: { mode: "tour" | "list" }) {
  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [imports, setImports] = useState<ImportResult[]>([]);
  const [batchSize, setBatchSize] = useState(DEFAULT_BATCH_SIZE);

  const isList = mode === "list";
  const pending = useMemo(() => imports.filter((item) => item.status === "PENDING"), [imports]);
  const failed = useMemo(() => imports.filter((item) => item.status === "FAILED"), [imports]);
  const activeImports = useMemo(() => imports.filter((item) => item.status !== "FAILED"), [imports]);
  const processingCount = imports.filter((item) => item.status === "PROCESSING").length;
  const successCount = imports.filter((item) => item.status === "SUCCESS").length;
  const failedCount = failed.length;
  const doneCount = successCount + failedCount;

  function wait(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function applyJob(job: any) {
    if (!job) return;
    setJobId(job.id);
    setUrl(job.sourceUrl);
    setResult({ found: job.total, links: job.items.map((item: any) => item.url), job });
    setImports(job.items.map((item: any) => ({
      url: item.url,
      status: item.status === "PROCESSING" ? "PENDING" : item.status,
      tour: item.tour,
      error: item.error
    })));
  }

  useEffect(() => {
    if (!isList) return;
    let alive = true;
    fetch("/api/import/list")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (alive && data?.job) applyJob(data.job);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [isList]);

  async function run() {
    setBusy(true);
    setResult(null);
    setJobId(null);
    setImports([]);
    const response = await fetch(`/api/import/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    const data = await response.json();
    setResult(data);
    if (data.job) {
      applyJob(data.job);
      setBusy(false);
      return;
    }
    if (mode === "list" && data.links?.length) {
      setImports(data.links.map((link: string) => ({ url: link, status: "PENDING" })));
    }
    setBusy(false);
  }

  async function publish(id: string) {
    const response = await fetch(`/api/tours/${id}/publish`, { method: "POST" });
    if (response.ok) {
      setResult((current: any) => current?.tour ? { ...current, tour: { ...current.tour, status: "PUBLISHED" } } : current);
    }
  }

  async function importBatch(urls: string[]) {
    if (!urls.length) return;
    setImports((current) => current.map((item) => urls.includes(item.url) ? { ...item, status: "PROCESSING", error: undefined } : item));
    const response = await fetch("/api/import/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobId ? { urls, jobId } : { urls })
    });
    const data = await response.json();
    if (!response.ok) {
      setImports((current) => current.map((item) => urls.includes(item.url) ? { ...item, status: "FAILED", error: data.error || "Batch import failed" } : item));
      return;
    }
    const resultMap = new Map((data.results || []).map((item: any) => [item.url, item]));
    setImports((current) =>
      current.map((item) => {
        const next: any = resultMap.get(item.url);
        if (!next) return item;
        return {
          url: item.url,
          status: next.status === "SUCCESS" ? "SUCCESS" : "FAILED",
          tour: next.tour,
          error: next.error
        };
      })
    );
  }

  async function importNextBatch() {
    const urls = pending.slice(0, batchSize).map((item) => item.url);
    setBusy(true);
    await importBatch(urls);
    setBusy(false);
  }

  async function importAllBatches() {
    setBusy(true);
    let guard = 0;
    while (guard < 1000) {
      const currentPending = await new Promise<ImportResult[]>((resolve) => {
        setImports((current) => {
          resolve(current.filter((item) => item.status === "PENDING"));
          return current;
        });
      });
      const urls = currentPending.slice(0, batchSize).map((item) => item.url);
      if (!urls.length) break;
      await importBatch(urls);
      await wait(BATCH_PAUSE_MS);
      guard += 1;
    }
    setBusy(false);
  }

  async function retryFailed() {
    const urls = failed.slice(0, batchSize).map((item) => item.url);
    setBusy(true);
    setImports((current) => current.map((item) => urls.includes(item.url) ? { ...item, status: "PROCESSING", error: undefined } : item));
    await wait(800);
    await importBatch(urls);
    setBusy(false);
  }

  async function retryAllFailed() {
    setBusy(true);
    let guard = 0;
    while (guard < 1000) {
      const currentFailed = await new Promise<ImportResult[]>((resolve) => {
        setImports((current) => {
          resolve(current.filter((item) => item.status === "FAILED"));
          return current;
        });
      });
      const urls = currentFailed.slice(0, batchSize).map((item) => item.url);
      if (!urls.length) break;
      setImports((current) => current.map((item) => urls.includes(item.url) ? { ...item, status: "PROCESSING", error: undefined } : item));
      await wait(800);
      await importBatch(urls);
      await wait(BATCH_PAUSE_MS);
      guard += 1;
    }
    setBusy(false);
  }

  return (
    <div className="panel rounded-lg p-4">
      <div className="mb-3">
        <h2 className="font-semibold">{isList ? "Liste URL'den detay linklerini bul" : "Tek tur detay import"}</h2>
        <p className="text-sm text-slate-400">
          {isList ? "Liste URL'si sadece detay linklerini cikarir. Ice aktarma yavaslatilmis guvenli partiler halinde yapilir." : "Tek bir tur detay URL'sini taslak olarak ice aktarir."}
        </p>
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <input className="input" value={url} onChange={(event) => setUrl(event.target.value)} placeholder={isList ? "Tur liste URL'si" : "Tur detay URL'si"} />
        <button className="btn-primary rounded-md" onClick={run} disabled={busy || !url}>{busy ? "Calisiyor" : isList ? "Linkleri bul" : "Ice aktar"}</button>
      </div>
      {result ? (
        <div className="mt-4 rounded-md border border-line bg-ink/70 p-3 text-sm">
          {result.error ? <p className="text-coral">{result.error}</p> : null}
          {result.tour ? (
            <div className="flex flex-wrap items-center gap-2">
              <p>Taslak hazir: <Link className="text-mint" href={`/admin/tours/${result.tour.id}`}>{result.tour.name}</Link></p>
              {result.tour.status !== "PUBLISHED" ? <button className="btn-primary rounded-md" onClick={() => publish(result.tour.id)}>Yayinla</button> : <span className="badge">Yayinda</span>}
              <Link className="btn" href={`/passenger/${result.tour.id}`}>Yolcu gorunumu</Link>
            </div>
          ) : null}
          {result.links ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>{result.found} tur detay linki bulundu.</p>
                <div className="flex flex-wrap items-center gap-2">
                  <select className="input w-24" value={batchSize} onChange={(event) => setBatchSize(Number(event.target.value))} disabled={busy}>
                    <option value={1}>1'li</option>
                    <option value={2}>2'li</option>
                    <option value={3}>3'lu</option>
                    <option value={5}>5'li</option>
                  </select>
                  <button className="btn" onClick={importNextBatch} disabled={busy || !pending.length}>Siradaki partiyi aktar</button>
                  <button className="btn-primary rounded-md" onClick={importAllBatches} disabled={busy || !pending.length}>Tumunu partlarla aktar</button>
                </div>
              </div>
              {jobId ? (
                <div className="rounded-md border border-mint/30 bg-mint/5 p-2 text-xs text-mint">
                  Bu liste DB'ye kaydedildi. Sayfayi yenilesen de kaldigin yerden devam eder.
                </div>
              ) : null}
              {imports.length ? (
                <div className="rounded-md border border-line bg-ink p-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-slate-300">
                    <span>Ilerleme: {doneCount}/{imports.length} tamamlandi - {successCount} basarili - {failedCount} hatali - {processingCount} isleniyor</span>
                    <span className="text-xs text-slate-500">Hatalilar sagdaki panele ayrilir ve daha sonra tekrar denenebilir.</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full bg-mint transition-all" style={{ width: `${imports.length ? (doneCount / imports.length) * 100 : 0}%` }} />
                  </div>
                </div>
              ) : null}
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-h-72 max-h-[32rem] space-y-2 overflow-auto rounded-md border border-line bg-ink/50 p-2">
                  <div className="sticky top-0 z-10 flex items-center justify-between bg-ink/95 pb-2 text-xs text-slate-400">
                    <span>Aktarim listesi</span>
                    <span>{activeImports.length} kayit</span>
                  </div>
                  {activeImports.map((item) => (
                    <ImportRow item={item} index={imports.findIndex((entry) => entry.url === item.url)} key={item.url} />
                  ))}
                </div>
                <div className="min-h-72 max-h-[32rem] overflow-auto rounded-md border border-coral/30 bg-coral/5 p-2">
                  <div className="sticky top-0 z-10 space-y-2 bg-[#160d12]/95 pb-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-coral">
                      <span>Hatalilar</span>
                      <span>{failedCount} kayit</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="btn text-xs" onClick={retryFailed} disabled={busy || !failedCount}>Parti tekrar</button>
                      <button className="btn-primary rounded-md text-xs" onClick={retryAllFailed} disabled={busy || !failedCount}>Tum hatalilar</button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-2">
                    {failed.length ? failed.map((item) => (
                      <ImportRow item={item} index={imports.findIndex((entry) => entry.url === item.url)} key={item.url} />
                    )) : <div className="rounded-md border border-line bg-panel/60 p-3 text-xs text-slate-500">Henuz hatali link yok.</div>}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
