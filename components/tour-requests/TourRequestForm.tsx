"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";

type TourOption = { id: string; name: string; slug: string };

export function TourRequestForm({ tours, selectedTourId, sourcePage, sourceLabel, tracking }: {
  tours: TourOption[];
  selectedTourId?: string;
  sourcePage: string;
  sourceLabel: string;
  tracking: { utmSource?: string; utmMedium?: string; utmCampaign?: string };
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/tour-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Talep gönderilemedi.");
      setCode(data.code);
      event.currentTarget.reset();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Talep gönderilemedi."); }
    finally { setPending(false); }
  }

  if (code) return <div className="tour-request-success" role="status"><CheckCircle2 aria-hidden="true"/><span>Talebiniz alındı</span><h2>Teşekkür ederiz.</h2><p>Tur danışmanımız verdiğiniz iletişim bilgileri üzerinden sizinle görüşecek.</p><strong>Takip kodunuz: {code}</strong><button type="button" onClick={() => setCode("")}>Yeni talep oluştur</button></div>;

  return <form className="tour-request-form" onSubmit={submit}>
    <input type="hidden" name="sourcePage" value={sourcePage}/><input type="hidden" name="sourceLabel" value={sourceLabel}/>
    <input type="hidden" name="utmSource" value={tracking.utmSource || ""}/><input type="hidden" name="utmMedium" value={tracking.utmMedium || ""}/><input type="hidden" name="utmCampaign" value={tracking.utmCampaign || ""}/>
    <label className="tour-request-honeypot" aria-hidden="true">Web sitesi<input name="website" tabIndex={-1} autoComplete="off"/></label>
    <div className="tour-request-form__section"><span>01 · İletişim bilgileriniz</span><div className="tour-request-form__grid">
      <label><span>Ad soyad *</span><input name="fullName" minLength={2} maxLength={120} required autoComplete="name" placeholder="Adınız ve soyadınız"/></label>
      <label><span>Telefon *</span><input name="phone" minLength={7} maxLength={30} required autoComplete="tel" inputMode="tel" placeholder="05xx xxx xx xx"/></label>
      <label><span>E-posta</span><input name="email" type="email" maxLength={254} autoComplete="email" placeholder="ornek@email.com"/></label>
      <label><span>Şehir</span><input name="city" maxLength={80} autoComplete="address-level2" placeholder="İstanbul"/></label>
    </div></div>
    <div className="tour-request-form__section"><span>02 · Yolculuk tercihiniz</span><div className="tour-request-form__grid">
      <label className="tour-request-form__wide"><span>İlgilendiğiniz tur</span><select name="tourId" defaultValue={selectedTourId || ""}><option value="">Henüz karar vermedim / özel rota</option>{tours.map((tour) => <option value={tour.id} key={tour.id}>{tour.name}</option>)}</select></label>
      <label><span>Tercih edilen tarih</span><input name="preferredDate" type="date"/></label>
      <label><span>Yaklaşık bütçe</span><input name="budget" maxLength={80} placeholder="Örn. kişi başı 2.500 €"/></label>
      <label><span>Yetişkin sayısı *</span><input name="adultCount" type="number" min={1} max={20} defaultValue={1} required/></label>
      <label><span>Çocuk sayısı</span><input name="childCount" type="number" min={0} max={20} defaultValue={0}/></label>
      <label className="tour-request-form__wide"><span>Eklemek istedikleriniz</span><textarea name="notes" maxLength={1500} rows={5} placeholder="Gitmek istediğiniz ülkeler, uygun olduğunuz dönem veya özel ihtiyaçlarınız..."/></label>
    </div></div>
    {error ? <p className="tour-request-form__error" role="alert">{error}</p> : null}
    <div className="tour-request-form__submit"><p>Formu göndererek tur danışmanımızın sizinle iletişime geçmesini kabul etmiş olursunuz.</p><button disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true"/> : <Send aria-hidden="true"/>}{pending ? "Gönderiliyor" : "Talebimi gönder"}</button></div>
  </form>;
}
