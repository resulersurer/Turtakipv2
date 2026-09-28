"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarCheck2, ExternalLink, FileInput, LayoutDashboard, LogOut, Map, PlaneTakeoff } from "lucide-react";

const items = [
  { href: "/admin", label: "Genel bakış", description: "Operasyon özeti", icon: LayoutDashboard, exact: true },
  { href: "/admin/tours", label: "Turlar", description: "Tur ve çıkışlar", icon: PlaneTakeoff },
  { href: "/admin/reservations", label: "Rezervasyonlar", description: "Koltuk ve yolcular", icon: CalendarCheck2 },
  { href: "/admin/import", label: "İçe aktar", description: "Tur verisi aktarımı", icon: FileInput }
];

export function AdminNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const active = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return <aside className="admin-sidebar">
    <div className="admin-sidebar__brand">
      <Link href="/admin" aria-label="Ejder Turizm yönetim ana sayfası"><Image src="/logo.png" alt="Ejder Turizm" width={104} height={78} priority /></Link>
      <div><strong>Ejder Turizm</strong><span>Operasyon merkezi</span></div>
    </div>
    <nav className="admin-sidebar__nav" aria-label="Yönetim menüsü">
      {items.map((item) => {
        const Icon = item.icon;
        const selected = active(item.href, item.exact);
        return <Link className={selected ? "is-active" : ""} href={item.href} key={item.href} aria-current={selected ? "page" : undefined}>
          <Icon size={20} aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.description}</small></span>
        </Link>;
      })}
    </nav>
    <div className="admin-sidebar__footer">
      <Link href="/passenger"><Map size={18} aria-hidden="true" /><span>Yolcu görünümü</span><ExternalLink size={14} aria-hidden="true" /></Link>
      <button type="button" onClick={signOut}><LogOut size={18} aria-hidden="true" /><span>Çıkış yap</span></button>
    </div>
  </aside>;
}
