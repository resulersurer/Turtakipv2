import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import "./member.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <div className="member-shell">
    <header className="member-header"><Link className="member-brand" href="/passenger"><Image src="/logo.png" alt="Ejder Turizm" width={72} height={72} /><span>Ejder Turizm<small>Yolculuğunuzu keşfedin</small></span></Link><nav aria-label="Üyelik sayfası menüsü"><Link href="/passenger">Tur takibi</Link><Link href="/tours">Turları keşfet</Link></nav></header>
    <main className="member-main">{children}</main>
    <footer className="member-footer">Ejder Turizm · <Link href="/passenger">Turlara dön</Link></footer>
  </div>;
}
