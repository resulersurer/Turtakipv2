import Image from "next/image";
import Link from "next/link";
import "./admin.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-theme">
      <header className="admin-brand">
        <div className="admin-brand-inner">
          <Link href="/admin" aria-label="Ejder Turizm yönetim ana sayfası">
            <Image src="/logo.png" alt="Ejder Turizm" width={180} height={80} className="h-16 w-auto object-contain" priority />
          </Link>
          <div className="admin-brand-title">
            <p>Ejder Turizm</p>
            <span>Tur yönetim paneli</span>
          </div>
          <nav aria-label="Yönetim menüsü" className="admin-nav">
            <Link href="/admin">Genel bakış</Link>
            <Link href="/admin/tours">Turlar</Link>
            <Link href="/admin/import">İçe aktar</Link>
            <Link href="/passenger">Yolcu görünümü ↗</Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
