"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle, Minus, Plus, TicketCheck } from "lucide-react";

type Availability = {
  capacity: number | null;
  confirmed: number;
  held: number;
  available: number | null;
};

export function MemberBooking({ departureId, availability, signedIn, returnTo }: {
  departureId: string;
  availability: Availability;
  signedIn: boolean;
  returnTo: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [passengers, setPassengers] = useState([""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const submitting = useRef(false);
  const canBook = availability.available !== null && availability.available > 0;
  const maxPassengers = Math.min(8, Math.max(1, availability.available || 1));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const names = passengers.map((_, index) => String(data.get(`passenger-${index}`) || "").trim());
    if (names.some((name) => name.length < 2)) { setError("Her yolcunun adını ve soyadını girin."); return; }
    submitting.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/member-reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          departureId,
          contactPhone: String(data.get("contactPhone") || ""),
          notes: String(data.get("notes") || ""),
          passengers: names
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Rezervasyon tamamlanamadı.");
      setConfirmation(result.code);
      setOpen(false);
      form.reset();
      setPassengers([""]);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Rezervasyon tamamlanamadı.");
    } finally { submitting.current = false; setBusy(false); }
  }

  if (!signedIn) return <div className="tour-detail__booking-guest"><Link href={`/giris?next=${encodeURIComponent(returnTo)}`}>Giriş yapıp rezervasyon yapın</Link></div>;

  return <div className="tour-detail__booking">
    {confirmation ? <p className="tour-detail__booking-success" role="status"><CheckCircle2 size={17} aria-hidden="true" /><span>Rezervasyonunuz oluşturuldu. Kodunuz: <strong>{confirmation}</strong></span></p> : null}
    {!open ? <button className="tour-detail__reserve-button" type="button" disabled={!canBook} onClick={() => { setOpen(true); setError(""); }}><TicketCheck size={17} aria-hidden="true" />{canBook ? "Rezervasyon yap" : availability.available === 0 ? "Kontenjan dolu" : "Rezervasyona kapalı"}</button> : null}
    {open ? <form className="tour-detail__booking-form" onSubmit={submit}>
      {error ? <p className="tour-detail__booking-error" role="alert">{error}</p> : null}
      <label>Telefon numarası<input name="contactPhone" autoComplete="tel" inputMode="tel" required minLength={7} maxLength={30} placeholder="+90 5xx xxx xx xx" /></label>
      <div className="tour-detail__passenger-heading"><span>Yolcular</span><span>{passengers.length} / {maxPassengers}</span></div>
      {passengers.map((_, index) => <label key={index}>Yolcu {index + 1}<input name={`passenger-${index}`} autoComplete="name" required minLength={2} maxLength={120} placeholder="Ad soyad" /></label>)}
      <div className="tour-detail__passenger-actions">
        <button type="button" disabled={passengers.length <= 1 || busy} onClick={() => setPassengers((current) => current.slice(0, -1))}><Minus size={15} aria-hidden="true" />Yolcu çıkar</button>
        <button type="button" disabled={passengers.length >= maxPassengers || busy} onClick={() => setPassengers((current) => [...current, ""])}><Plus size={15} aria-hidden="true" />Yolcu ekle</button>
      </div>
      <label>Not <textarea name="notes" maxLength={1000} rows={3} placeholder="Varsa iletmek istediğiniz not" /></label>
      <div className="tour-detail__booking-actions"><button type="button" disabled={busy} onClick={() => setOpen(false)}>Vazgeç</button><button className="tour-detail__reserve-button" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="animate-spin" size={17} aria-hidden="true" />Kaydediliyor…</> : "Rezervasyonu tamamla"}</button></div>
    </form> : null}
  </div>;
}
