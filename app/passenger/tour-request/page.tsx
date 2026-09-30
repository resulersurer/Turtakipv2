import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock3, Headphones, MapPinned, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { MemberNav } from "@/components/members/MemberNav";
import { PassengerFooter } from "@/components/passenger/PassengerFooter";
import { TourRequestForm } from "@/components/tour-requests/TourRequestForm";
import "./tour-request.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tur Talep Formu | Ejder Turizm", description: "Hayalinizdeki turu ve seyahat tercihlerinizi paylaşın; Ejder Turizm danışmanları size uygun seçenekleri hazırlasın." };

const sourceLabels: Record<string, string> = { menu: "Ana menü", footer: "Sayfa altı", "tour-detail": "Tur detay sayfası", "route-detail": "Rota takip sayfası" };

export default async function TourRequestPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const tours = hasDatabaseUrl() && await isDatabaseSchemaReady() ? await prisma.tour.findMany({ where: { status: "PUBLISHED" }, select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }) : [];
  const selected = tours.find((tour) => tour.slug === params.tour || tour.id === params.tour);
  const sourceKey = params.source || (selected ? "tour-detail" : "menu");
  const sourcePage = sourceKey === "tour-detail" && selected ? `/tour/${selected.slug}` : sourceKey === "route-detail" && selected ? `/passenger/${selected.id}` : "/passenger";

  return <main className="tour-request-page">
    <header className="tour-request-topbar"><Link href="/passenger" className="tour-request-brand"><img src="/logo.png" alt="Ejder Turizm"/></Link><nav><Link href="/passenger"><ArrowLeft size={16}/>Turlara dön</Link><MemberNav/></nav></header>
    <section className="tour-request-hero"><div><span>Size özel yolculuk</span><h1>Hayalinizdeki turu birlikte planlayalım.</h1><p>İlgilendiğiniz turu ve seyahat tercihlerinizi paylaşın. Deneyimli tur danışmanımız size en uygun tarih ve seçeneklerle ulaşsın.</p></div><div className="tour-request-hero__facts"><div><Clock3/><strong>Hızlı dönüş</strong><span>Talebiniz ekibimize anında ulaşır.</span></div><div><MapPinned/><strong>Doğru tur eşleşmesi</strong><span>Seçtiğiniz tur bilgisi kaybolmaz.</span></div><div><ShieldCheck/><strong>Güvenli kayıt</strong><span>Talebiniz yalnızca yetkili ekipte görünür.</span></div></div></section>
    <section className="tour-request-content"><aside><span>Tur danışmanınız</span><h2>{selected ? selected.name : "Size uygun rotayı bulalım"}</h2><p>{selected ? "Bu tur talebinizde otomatik olarak seçildi. Dilerseniz formdan başka bir tur seçebilirsiniz." : "Karar vermediyseniz sorun değil. Beklentinizi not alanına yazın, seçenekleri birlikte değerlendirelim."}</p><div><Headphones/><span><strong>Yardıma mı ihtiyacınız var?</strong><a href="tel:+908503330203">0850 333 0 203</a></span></div></aside><div className="tour-request-card"><div className="tour-request-card__heading"><span>Tur talep formu</span><h2>Seyahat bilgilerinizi paylaşın</h2><p>* işaretli alanlar zorunludur.</p></div><TourRequestForm tours={tours} selectedTourId={selected?.id} sourcePage={sourcePage} sourceLabel={sourceLabels[sourceKey] || sourceKey.slice(0, 120)} tracking={{ utmSource: params.utm_source, utmMedium: params.utm_medium, utmCampaign: params.utm_campaign }}/></div></section>
    <PassengerFooter/>
  </main>;
}
