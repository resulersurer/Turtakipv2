import Link from "next/link";
import { ArrowRight, ArrowUpRight, Mail, Phone } from "lucide-react";

const tourLinks = [
  { label: "2027 Turları", href: "https://www.ejderturizm.com.tr/TourList.aspx?contpg=276&pcmncat=16,1&pcsbcat=147" },
  { label: "2026 Turları", href: "https://www.ejderturizm.com.tr/TourList.aspx?contpg=260&pcmncat=1&pcsbcat=138" },
  { label: "EJDER VIP", href: "https://www.ejderturizm.com.tr/TourList.aspx?contpg=259&pcmncat=16,1&pcsbcat=65" },
  { label: "Tur Talep Formu", href: "https://www.ejderturizm.com.tr/talep_1000.html" },
  { label: "Bize Ulaşın", href: "https://www.ejderturizm.com.tr/Bize-ulasin.html" }
];

export function PassengerFooter() {
  return (
    <footer className="passenger-footer">
      <div className="passenger-footer__feature">
        <div className="passenger-footer__feature-copy">
          <span className="passenger-footer__eyebrow"><span aria-hidden="true" /> EJDER TURİZM İLE KEŞFET</span>
          <h2>Bir sonraki yolculuğunuz burada başlıyor.</h2>
          <p>İlham veren rotalara göz atın veya size özel bir tur planlayalım.</p>
        </div>
        <div className="passenger-footer__feature-actions">
          <a href={tourLinks[0].href} className="passenger-footer__button passenger-footer__button--light">
            2027 Turlarını Gör <ArrowUpRight size={17} aria-hidden="true" />
          </a>
          <a href="https://www.ejderturizm.com.tr/talep_1000.html" className="passenger-footer__button passenger-footer__button--outline">
            Tur Talep Formu <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
      <div className="passenger-footer__inner">
        <div className="passenger-footer__brand">
          <img src="/logo.png" alt="Ejder Turizm" className="passenger-footer__logo" />
          <p>Dünyanın farklı köşelerinde unutulmaz anılar biriktirmek için yanınızdayız.</p>
        </div>

        <nav aria-label="Footer tur bağlantıları" className="passenger-footer__column">
          <h2>Keşfet</h2>
          <div className="passenger-footer__links">
            {tourLinks.map(({ label, href }) => <a key={href} href={href}><span>{label}</span><ArrowUpRight size={14} aria-hidden="true" /></a>)}
          </div>
        </nav>

        <div className="passenger-footer__column">
          <h2>İletişim</h2>
          <div className="passenger-footer__links passenger-footer__contact">
            <a href="tel:+908503330203"><Phone size={15} aria-hidden="true" />0850 333 0 203</a>
            <a href="tel:+902127065379"><Phone size={15} aria-hidden="true" />0212 706 53 79</a>
            <a href="mailto:info@ejderturizm.com.tr"><Mail size={15} aria-hidden="true" />info@ejderturizm.com.tr</a>
            <a href="mailto:musteridestek@ejderturizm.com.tr"><Mail size={15} aria-hidden="true" />musteridestek@ejderturizm.com.tr</a>
          </div>
        </div>
      </div>
      <div className="passenger-footer__bottom">
        <span>© {new Date().getFullYear()} Ejder Turizm. Tüm hakları saklıdır.</span>
        <div>
          <a href="https://www.ejderturizm.com.tr/">Anasayfa</a>
          <Link href="/tours">Tur Listesi</Link>
          <a href="https://www.ejderturizm.com.tr/Bize-ulasin.html">Bize Ulaşın</a>
        </div>
      </div>
    </footer>
  );
}
