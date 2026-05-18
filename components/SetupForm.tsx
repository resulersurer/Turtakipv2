"use client";

import { Database, KeyRound, RefreshCw, Save, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type SaveState = {
  ok?: boolean;
  message?: string;
  error?: string;
  output?: string;
};

function randomSecret() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function SetupForm() {
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminCookieSecret, setAdminCookieSecret] = useState(randomSecret);
  const [saving, setSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [state, setState] = useState<SaveState | null>(null);

  async function saveEnv() {
    setSaving(true);
    setState(null);
    const response = await fetch("/api/setup/env", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ databaseUrl, adminPassword, adminCookieSecret })
    });
    const data = await response.json();
    setSaving(false);
    setState(data);
  }

  async function pushSchema() {
    setMigrating(true);
    setState(null);
    const response = await fetch("/api/setup/db-push", { method: "POST" });
    const data = await response.json();
    setMigrating(false);
    setState(data);
  }

  return (
    <section className="panel max-w-3xl rounded-lg p-6">
      <span className="badge">Yerel kurulum</span>
      <h1 className="mt-4 text-2xl font-semibold">Veritabanı ve admin ayarları</h1>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Bu ekran yalnızca local development için `.env` dosyasını yazar. Vercel production ortamında environment variable değerleri Vercel dashboard üzerinden eklenmelidir.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="space-y-2 text-sm">
          <span className="inline-flex items-center gap-2 text-slate-200"><Database size={16} /> PostgreSQL DATABASE_URL</span>
          <input
            className="input"
            value={databaseUrl}
            onChange={(event) => setDatabaseUrl(event.target.value)}
            placeholder="postgresql://USER:PASSWORD@HOST:5432/ejder?sslmode=require"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="inline-flex items-center gap-2 text-slate-200"><KeyRound size={16} /> Admin şifresi</span>
          <input className="input" type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="Güçlü bir admin şifresi" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="inline-flex items-center gap-2 text-slate-200"><ShieldCheck size={16} /> Cookie secret</span>
          <div className="flex gap-2">
            <input className="input" value={adminCookieSecret} onChange={(event) => setAdminCookieSecret(event.target.value)} />
            <button className="btn" type="button" onClick={() => setAdminCookieSecret(randomSecret())}><RefreshCw size={16} /></button>
          </div>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button className="btn-primary rounded-md" disabled={saving || !databaseUrl || !adminPassword || !adminCookieSecret} onClick={saveEnv}>
          <Save size={16} />
          {saving ? "Kaydediliyor" : ".env kaydet"}
        </button>
        <button className="btn" disabled={migrating} onClick={pushSchema}>
          <Database size={16} />
          {migrating ? "DB hazırlanıyor" : "Prisma db push"}
        </button>
      </div>

      {state ? (
        <div className={`mt-5 rounded-md border p-4 text-sm ${state.ok ? "border-mint bg-mint/10 text-slate-100" : "border-coral bg-coral/10 text-coral"}`}>
          <p>{state.message || state.error}</p>
          {state.output ? <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs text-slate-300">{state.output}</pre> : null}
          {state.ok && state.message?.includes("Prisma") ? (
            <div className="mt-4">
              <Link className="btn-primary rounded-md" href="/admin">Admin paneline geç</Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
