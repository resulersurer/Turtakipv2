"use client";

import { useState } from "react";
import Link from "next/link";

type ImportResult = {
  url: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  tour?: { id: string; name: string; status: string };
  error?: string;
};

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

  async function run() {
    setBusy(true);
    setResult(null);
    setImports([]);
    const response = await fetch(`/api/import/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    setResult(await response.json());
    setBusy(false);
  }

  async function publish(id: string) {
    const response = await fetch(`/api/tours/${id}/publish`, { method: "POST" });
    if (response.ok) {
      setResult((current: any) => current?.tour ? { ...current, tour: { ...current.tour, status: "PUBLISHED" } } : current);
    }
  }

  async function importLinks() {
    const links = result?.links || [];
    setBusy(true);
    setImports(links.map((link: string) => ({ url: link, status: "PENDING" })));
    for (const link of links) {
      try {
        const response = await fetch("/api/import/tour", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: link }) });
        const data = await response.json();
        setImports((current) => current.map((item) => item.url === link ? { url: link, status: response.ok ? "SUCCESS" : "FAILED", tour: data.tour, error: data.error } : item));
      } catch (error) {
        setImports((current) => current.map((item) => item.url === link ? { url: link, status: "FAILED", error: error instanceof Error ? error.message : "Import failed" } : item));
      }
    }
    setBusy(false);
  }

  const isList = mode === "list";
  const successCount = imports.filter((item) => item.status === "SUCCESS").length;
  const failedCount = imports.filter((item) => item.status === "FAILED").length;

  return (
    <div className="panel rounded-lg p-4">
      <div className="mb-3">
        <h2 className="font-semibold">{isList ? "Liste URL'den detay linklerini bul" : "Tek tur detay import"}</h2>
        <p className="text-sm text-slate-400">{isList ? "Önce detay linkleri çıkarılır; sonra her link tekil tur import gibi işlenir." : "Tek bir tur detay URL'sini taslak olarak içe aktarır."}</p>
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
                <button className="btn-primary rounded-md" onClick={importLinks} disabled={busy || !result.links.length}>Bulunan linkleri içe aktar</button>
              </div>
              <div className="max-h-72 space-y-2 overflow-auto">
                {result.links.map((link: string, index: number) => (
                  <div className="rounded-md border border-line bg-panel/70 p-2" key={link}>
                    <div className="text-slate-300">{index + 1}. {titleFromUrl(link)}</div>
                    <div className="break-all text-xs text-slate-500">{link}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {imports.length ? (
            <div className="mt-4 rounded-md border border-line bg-ink p-3">
              <div className="mb-2 text-slate-300">Import ilerlemesi: {successCount} başarılı, {failedCount} hatalı, {imports.length} toplam</div>
              <div className="max-h-80 space-y-2 overflow-auto">
                {imports.map((item) => (
                  <div className="rounded-md border border-line bg-panel/70 p-2" key={item.url}>
                    <span className="badge">{item.status}</span>
                    {item.tour ? <Link className="ml-2 text-mint" href={`/admin/tours/${item.tour.id}`}>{item.tour.name}</Link> : <span className="ml-2">{titleFromUrl(item.url)}</span>}
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
