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
    <div className="page-shell flex min-h-screen items-center justify-center">
      <div className="panel w-full max-w-sm rounded-lg p-5">
        <h1 className="text-xl font-semibold">Admin girişi</h1>
        <input className="input mt-4" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Admin şifresi" />
        {error ? <p className="mt-2 text-sm text-coral">{error}</p> : null}
        <button className="btn-primary mt-4 w-full rounded-md" onClick={login}>Giriş yap</button>
      </div>
    </div>
  );
}
