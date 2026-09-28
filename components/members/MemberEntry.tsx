import { redirect } from "next/navigation";
import { Compass, MapPinned } from "lucide-react";
import { getMemberAuth } from "@/lib/members/auth";
import { getMemberSession } from "@/lib/members/session";
import { safeMemberReturnPath } from "@/lib/members/validation";
import { AuthForm } from "./AuthForm";
import { MemberUnavailable } from "./MemberUnavailable";

export async function MemberEntry({ mode, returnTo }: { mode: "sign-in" | "sign-up"; returnTo?: string }) {
  if (!getMemberAuth()) return <MemberUnavailable />;
  let session;
  try { session = await getMemberSession(); }
  catch { return <MemberUnavailable />; }
  const destination = safeMemberReturnPath(returnTo);
  if (session) redirect(destination);
  const signUp = mode === "sign-up";
  return <div className="member-entry">
    <aside className="member-intro">
      <div className="member-intro-icon"><Compass size={34} strokeWidth={1.4} aria-hidden="true" /></div>
      <p className="member-eyebrow">EJDER TURİZM</p>
      <h2>Yeni rotalar.<br />Unutulmaz anılar.</h2>
      <p>Bir sonraki yolculuğunuz için ilham alın. Dünyanın farklı köşelerini birlikte keşfedelim.</p>
      <div className="member-intro-footer"><MapPinned size={22} aria-hidden="true" /><span>Yolculuğunuz burada başlıyor.</span></div>
    </aside>
    <section className="member-entry-form">
      <p className="member-eyebrow">{signUp ? "ARAMIZA KATILIN" : "TEKRAR HOŞ GELDİNİZ"}</p>
      <h1>{signUp ? "Üye olun" : "Giriş yapın"}</h1>
      <p className="member-description">{signUp ? "Bilgilerinizi girin, hesabınızı hemen oluşturun." : "E-posta adresiniz ve şifrenizle hesabınıza erişin."}</p>
      <AuthForm mode={mode} returnTo={destination} />
    </section>
  </div>;
}
