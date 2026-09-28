import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountForms } from "@/components/members/AccountForms";
import { MemberUnavailable } from "@/components/members/MemberUnavailable";
import { getMemberAuth } from "@/lib/members/auth";
import { getMemberSession } from "@/lib/members/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Hesabım" };

export default async function AccountPage() {
  if (!getMemberAuth()) return <MemberUnavailable />;
  let session;
  try { session = await getMemberSession(); }
  catch { return <MemberUnavailable />; }
  if (!session) redirect("/giris?next=%2Fhesabim");
  return <div className="member-account"><header className="member-account-header"><div><p className="member-eyebrow">HESABIM</p><h1>Merhaba, {session.user.name}</h1><p>Hesap bilgilerinizi ve şifrenizi buradan yönetin.</p></div><Link className="member-button" href="/tours">Turları keşfet</Link></header><AccountForms name={session.user.name} email={session.user.email} /></div>;
}
