import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Headphones, Mail, Phone } from "lucide-react";
import { MemberNav } from "@/components/members/MemberNav";
import { PassengerFooter } from "@/components/passenger/PassengerFooter";
import "./contact.css";

export const metadata: Metadata = {
  title: "Bize Ulaşın",
  description: "Tur planlama, rezervasyon ve seyahat desteği için Ejder Turizm iletişim bilgileri.",
  alternates: { canonical: "/passenger/contact" }
};

export default function ContactPage() {
  return (
    <main className="contact-page">
      <header className="contact-topbar">
        <Link href="/passenger"><img src="/logo.png" alt="Ejder Turizm ana sayfa" /></Link>
        <nav aria-label="İletişim sayfası menüsü"><Link href="/passenger"><ArrowLeft size={16} aria-hidden="true" />Turlara dön</Link><MemberNav /></nav>
      </header>
      <section className="contact-hero">
        <span>EJDER TURİZM · İLETİŞİM</span>
        <h1>Bir yolculuk, bir merhaba ile başlar.</h1>
        <p>Tur seçimi, rezervasyonunuz veya seyahatinizle ilgili sorularınız için bize ulaşın.</p>
      </section>
      <section className="contact-content" aria-label="İletişim seçenekleri">
        <div className="contact-grid">
          <article className="contact-card">
            <Phone aria-hidden="true" className="contact-icon" />
            <h2>Bizi arayın</h2><p>Tur ve rezervasyon seçeneklerini birlikte değerlendirelim.</p>
            <a href="tel:+908503330203">0850 333 0 203 <ArrowUpRight size={16} aria-hidden="true" /></a>
            <a href="tel:+902127065379">0212 706 53 79 <ArrowUpRight size={16} aria-hidden="true" /></a>
          </article>
          <article className="contact-card">
            <Mail aria-hidden="true" className="contact-icon" />
            <h2>Bize yazın</h2><p>Turlar ve seyahat planlarınız hakkında bilgi alın.</p>
            <a href="mailto:info@ejderturizm.com.tr">info@ejderturizm.com.tr <ArrowUpRight size={16} aria-hidden="true" /></a>
          </article>
          <article className="contact-card">
            <Headphones aria-hidden="true" className="contact-icon" />
            <h2>Müşteri desteği</h2><p>Mevcut rezervasyonunuz ve seyahatinizle ilgili destek alın.</p>
            <a href="mailto:musteridestek@ejderturizm.com.tr">musteridestek@ejderturizm.com.tr <ArrowUpRight size={16} aria-hidden="true" /></a>
          </article>
        </div>
        <div className="contact-request">
          <div><span>YENİ BİR SEYAHAT PLANLIYORSANIZ</span><h2>Size uygun turu birlikte bulalım.</h2><p>Gitmek istediğiniz rotayı ve tercihlerinizi tur talep formunda paylaşın.</p></div>
          <Link href="/passenger/tour-request?source=contact">Tur talebi oluştur <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>
      <PassengerFooter />
    </main>
  );
}
