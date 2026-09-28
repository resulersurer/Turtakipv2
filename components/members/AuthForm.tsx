"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { memberClient } from "@/lib/members/client";
import { memberErrorMessage, memberSignInSchema, memberSignUpSchema, safeMemberReturnPath } from "@/lib/members/validation";
import { PasswordField } from "./PasswordField";

export function AuthForm({ mode, returnTo }: { mode: "sign-in" | "sign-up"; returnTo: string }) {
  const signUp = mode === "sign-up";
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const destination = safeMemberReturnPath(returnTo);
  const alternateHref = `${signUp ? "/giris" : "/kayit"}?next=${encodeURIComponent(destination)}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = signUp ? memberSignUpSchema.safeParse(data) : memberSignInSchema.safeParse(data);
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    submitting.current = true;
    setBusy(true); setError("");
    try {
      const result = signUp
        ? await memberClient.signUp.email({ name: String(data.name).trim(), email: parsed.data.email, password: parsed.data.password })
        : await memberClient.signIn.email({ email: parsed.data.email, password: parsed.data.password, rememberMe: data.remember === "on" });
      if (result.error) { setError(memberErrorMessage(result.error)); return; }
      router.replace(destination);
      router.refresh();
    } catch { setError("Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin."); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <form onSubmit={submit} className="member-form">
    {error && <p className="member-message member-message--error" role="alert">{error}</p>}
    <fieldset disabled={busy}>
      {signUp && <div className="member-field"><label htmlFor="name">Ad soyad</label><input id="name" name="name" autoComplete="name" required minLength={2} maxLength={120} placeholder="Adınız ve soyadınız" /></div>}
      <div className="member-field"><label htmlFor="email">E-posta adresi</label><input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} placeholder="ornek@eposta.com" /></div>
      <PasswordField name="password" label="Şifre" autoComplete={signUp ? "new-password" : "current-password"} minLength={signUp ? 12 : 1} hint={signUp ? "En az 12 karakter kullanın." : undefined} />
      {signUp && <PasswordField name="confirmPassword" label="Şifre tekrar" autoComplete="new-password" minLength={12} />}
      {!signUp && <label className="member-checkbox"><input type="checkbox" name="remember" defaultChecked />Beni hatırla</label>}
      <button className="member-button member-button--primary member-button--full" type="submit">{busy ? <><LoaderCircle size={18} className="animate-spin" aria-hidden="true" />{signUp ? "Hesabınız oluşturuluyor…" : "Giriş yapılıyor…"}</> : <>{signUp ? "Kayıt ol" : "Giriş yap"}<ArrowRight size={18} aria-hidden="true" /></>}</button>
    </fieldset>
    <p className="member-form-alternate">{signUp ? "Zaten hesabınız var mı?" : "Henüz üye değil misiniz?"} <Link href={alternateHref}>{signUp ? "Giriş yapın" : "Üye olun"}</Link></p>
  </form>;
}
