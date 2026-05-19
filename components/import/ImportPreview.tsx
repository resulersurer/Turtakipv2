"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ImportResult = {
  url: string;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  tour?: { id: string; name: string; status: string };
  error?: string;
};

const DEFAULT_BATCH_SIZE = 5;

function titleFromUrl(url: string) {
  try {
    const last = decodeURIComponent(new URL(url).pathname.split("/").pop() || url);
    return last.replace(/_23\.html$/i, "").replace(/[-_]+/g, " ").trim();
  } catch {
    return url;
  }
}

export function ImportPreview({ mode }: { mode: "tour" | "list" }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [imports, setImports] = useState<ImportResult[]>([]);
  const [batchSize, setBatchSize] = useState(DEFAULT_BATCH_SIZE);

  const isList = mode === "list";
  const pending = useMemo(() => imports.filter((item) => item.status === "PENDING"), [imports]);
  const processingCount = imports.filter((item) => item.status === "PROCESSING").length;
  const successCount = imports.filter((item) => item.status === "SUCCESS").length;
  const failedCount = imports.filter((item) => item.status === "FAILED").length;
  const doneCount = successCount + failedCount;

  async function run() {
    setBusy(true);
    setResult(null);
    setImports([]);
    const response = await fetch(`/api/import/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    const data = await response.json();
    setResult(data);
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
      body: JSON.stringify({ urls })
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
      guard += 1;
    }
    setBusy(false);
  }

  return (
    <div className="panel rounded-lg p-4">
      <div className="mb-3">
        <h2 className="font-semibold">{isList ? "Liste URL'den detay linklerini bul" : "Tek tur detay import"}</h2>
        <p className="text-sm text-slate-400">
          {isList ? "Liste URL'si sadece detay linklerini çıkarır. İçe aktarma güvenli parçalar halinde yapılır." : "Tek bir tur detay URL'sini taslak olarak içe aktarır."}
        </p>
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <input className="input" value={url} onChange={(event) => setUrl(event.target.value)} placeholder={isList ? "Tur liste URL'si" : "Tur detay URL'si"} />
        <button className="btn-primary rounded-md" onClick={run} disabled={busy || !url}>{busy ? "Çalışıyor" : isList ? "Linkleri bul" : "İçe aktar"}</button>
      </div>
      {result ? (
        <div className="mt-4 rounded-md border border-line bg-ink/70 p-3 text-sm">
          {result.error ? <p className="text-coral">{result.error}</p> : null}
          {result.tour ? (
            <div className="flex flex-wrap items-center gap-2">
              <p>Taslak hazır: <Link className="text-mint" href={`/admin/tours/${result.tour.id}`}>{result.tour.name}</Link></p>
              {result.tour.status !== "PUBLISHED" ? <button className="btn-primary rounded-md" onClick={() => publish(result.tour.id)}>Yayınla</button> : <span className="badge">Yayında</span>}
              <Link className="btn" href={`/passenger/${result.tour.id}`}>Yolcu görünümü</Link>
            </div>
          ) : null}
          {result.links ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>{result.found} tur detay linki bulundu.</p>
                <div className="flex flex-wrap items-center gap-2">
                  <select className="input w-24" value={batchSize} onChange={(event) => setBatchSize(Number(event.target.value))} disabled={busy}>
                    <option value={3}>3'lü</option>
                    <option value={5}>5'li</option>
                    <option value={8}>8'li</option>
                  </select>
                  <button className="btn" onClick={importNextBatch} disabled={busy || !pending.length}>Sıradaki partiyi aktar</button>
                  <button className="btn-primary rounded-md" onClick={importAllBatches} disabled={busy || !pending.length}>Tümünü partlarla aktar</button>
                </div>
              </div>
              {imports.length ? (
                <div className="rounded-md border border-line bg-ink p-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-slate-300">
                    <span>İlerleme: {doneCount}/{imports.length} tamamlandı · {successCount} başarılı · {failedCount} hatalı · {processingCount} işleniyor</span>
                    <span className="text-xs text-slate-500">Her parti ayrı request olarak çalışır; hata diğer linkleri durdurmaz.</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full bg-mint transition-all" style={{ width: `${imports.length ? (doneCount / imports.length) * 100 : 0}%` }} />
                  </div>
                </div>
              ) : null}
              <div className="max-h-96 space-y-2 overflow-auto">
                {imports.map((item, index) => (
                  <div className="rounded-md border border-line bg-panel/70 p-2" key={item.url}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge">{item.status}</span>
                      {item.tour ? <Link className="text-mint" href={`/admin/tours/${item.tour.id}`}>{item.tour.name}</Link> : <span className="text-slate-300">{index + 1}. {titleFromUrl(item.url)}</span>}
                    </div>
                    <div className="mt-1 break-all text-xs text-slate-500">{item.url}</div>
                    {item.error ? <div className="mt-1 text-xs text-coral">{item.error}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
