"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  async function login() {
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (response.ok) router.refresh();
    else setError("Şifre hatalı veya ADMIN_PASSWORD tanımlı değil.");
  }
  return (
    <div className="admin-login">
      <div className="panel admin-login__card">
        <span className="admin-eyebrow">Güvenli yönetim alanı</span><h1>Admin girişi</h1><p>Tur, kapasite ve rezervasyon operasyonlarına erişmek için yönetici şifrenizi girin.</p>
        <label><span>Yönetici şifresi</span><input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void login(); }} autoComplete="current-password" /></label>
        {error ? <p className="mt-2 text-sm text-coral">{error}</p> : null}
        <button className="btn-primary w-full" onClick={login}>Giriş yap</button>
      </div>
    </div>
  );
}
