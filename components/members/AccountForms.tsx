"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { memberClient } from "@/lib/members/client";
import { memberErrorMessage, memberNameSchema, memberPasswordSchema } from "@/lib/members/validation";
import { PasswordField } from "./PasswordField";

export function AccountForms({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const lock = useRef(false);

  async function action(kind: string, operation: () => Promise<{ error: { code?: string; status?: number } | null }>, success: string, after?: () => void) {
    if (lock.current) return;
    lock.current = true; setBusy(kind); setMessage(null);
    try {
      const result = await operation();
      if (result.error) { setMessage({ text: memberErrorMessage(result.error), error: true }); return; }
      setMessage({ text: success, error: false });
      after?.();
      router.refresh();
    } catch { setMessage({ text: "Bağlantı kurulamadı. Lütfen tekrar deneyin.", error: true }); }
    finally { lock.current = false; setBusy(null); }
  }

  function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = memberNameSchema.safeParse(new FormData(event.currentTarget).get("name"));
    if (!parsed.success) { setMessage({ text: parsed.error.issues[0].message, error: true }); return; }
    void action("profile", () => memberClient.updateUser({ name: parsed.data }), "Adınız ve soyadınız güncellendi.");
  }

  function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const parsed = memberPasswordSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) { setMessage({ text: parsed.error.issues[0].message, error: true }); return; }
    void action("password", () => memberClient.changePassword({ currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword, revokeOtherSessions: true }), "Şifreniz değiştirildi. Diğer cihazlardaki oturumlarınız kapatıldı.", () => form.reset());
  }

  return <>
    {message && <p className={`member-message${message.error ? " member-message--error" : " member-message--success"}`} role={message.error ? "alert" : "status"}>{message.text}</p>}
    <div className="member-account-grid">
      <section className="member-card"><div className="member-section-heading"><UserRound size={22} aria-hidden="true" /><h2>Hesap bilgileriniz</h2></div><form className="member-form" onSubmit={updateProfile}><fieldset disabled={busy !== null}>
        <div className="member-field"><label htmlFor="profileName">Ad soyad</label><input id="profileName" name="name" autoComplete="name" required minLength={2} maxLength={120} defaultValue={name} /></div>
        <div className="member-field"><label htmlFor="profileEmail">E-posta adresi</label><input id="profileEmail" type="email" value={email} readOnly /></div>
        <button className="member-button member-button--primary" type="submit">{busy === "profile" ? "Kaydediliyor…" : "Bilgileri kaydet"}</button>
      </fieldset></form></section>
      <section className="member-card"><div className="member-section-heading"><ShieldCheck size={22} aria-hidden="true" /><h2>Şifre değiştir</h2></div><form className="member-form" onSubmit={changePassword}><fieldset disabled={busy !== null}>
        <PasswordField name="currentPassword" label="Mevcut şifre" autoComplete="current-password" />
        <PasswordField name="newPassword" label="Yeni şifre" autoComplete="new-password" minLength={12} hint="En az 12 karakter kullanın. Şifre değişince diğer oturumlarınız kapatılır." />
        <PasswordField name="confirmPassword" label="Yeni şifre tekrar" autoComplete="new-password" minLength={12} />
        <button className="member-button member-button--primary" type="submit">{busy === "password" ? "Değiştiriliyor…" : "Şifreyi değiştir"}</button>
      </fieldset></form></section>
    </div>
    <section className="member-signout"><div><h2>Oturumunuz</h2><p>Paylaşılan bir cihaz kullanıyorsanız işiniz bitince çıkış yapın.</p></div><button className="member-button" disabled={busy !== null} onClick={() => void action("signout", () => memberClient.signOut(), "Çıkış yapıldı.", () => router.replace("/giris"))}><LogOut size={17} aria-hidden="true" />{busy === "signout" ? "Çıkış yapılıyor…" : "Çıkış yap"}</button></section>
  </>;
}
