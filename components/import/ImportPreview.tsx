"use client";

import { useState } from "react";
import Link from "next/link";

export function ImportPreview({ mode }: { mode: "tour" | "list" }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  async function run() {
    setBusy(true);
    setResult(null);
    const response = await fetch(`/api/import/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    setResult(await response.json());
    setBusy(false);
  }
  return (
    <div className="panel rounded-lg p-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <input className="input" value={url} onChange={(event) => setUrl(event.target.value)} placeholder={mode === "tour" ? "Tur detay URL'si" : "Tur liste URL'si"} />
        <button className="btn-primary rounded-md" onClick={run} disabled={busy || !url}>{busy ? "İçe aktarılıyor" : "İçe aktar"}</button>
      </div>
      {result ? (
        <div className="mt-4 rounded-md border border-line bg-ink/70 p-3 text-sm">
          {result.error ? <p className="text-coral">{result.error}</p> : null}
          {result.tour ? <p> Taslak hazır: <Link className="text-mint" href={`/admin/tours/${result.tour.id}`}>{result.tour.name}</Link></p> : null}
          {result.results ? <p>{result.imported} / {result.found} link işlendi.</p> : null}
          <pre className="mt-3 max-h-80 overflow-auto text-xs text-slate-300">{JSON.stringify(result, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
