import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Plane, Globe2 } from "lucide-react";
import { occupancy, type OccupancyReservation } from "@/lib/reservations/domain";

type CardTour = {
  id: string; name: string; coverImageUrl?: string | null;
  durationDays?: number | null; departureCity?: string | null;
  airline?: string | null; visaStatus?: string | null;
  days: { country?: string | null }[];
};
type CardDeparture = {
  id: string; price?: number | string | null; currency?: string | null;
  capacity: number | null; blockedSeats: number;
  availabilityStatus?: string | null; reservations: OccupancyReservation[];
};

export function departurePriceLabel(departure: Pick<CardDeparture, "price" | "currency">) {
  const amount = Number(departure.price);
  if (departure.price == null || !Number.isFinite(amount) || amount <= 0) return "Fiyat için bilgi alın";
  return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(amount)} ${departure.currency || ""}`.trim();
}

export function PassengerTourCard({ tour, departure, relative, range, status }: {
  tour: CardTour; departure: CardDeparture; relative: string; range: string;
  status: "today" | "ongoing" | "future" | "past";
}) {
  const countries = [...new Set(tour.days.map(day => day.country).filter(Boolean))];
  const available = occupancy(departure.capacity, departure.blockedSeats, departure.reservations).available;
  const canShowAvailability = status === "future" || status === "today";
  const removed = departure.availabilityStatus === "SOURCE_REMOVED";
  const availability = removed ? "Çıkış satışa kapalı" : available === null ? "Kontenjan için bilgi alın" : available <= 0 ? "Kontenjan doldu" : `${available} kişilik yer var`;
  return (
    <Link className="passenger-tour-card" href={`/passenger/${tour.id}?departureId=${departure.id}`}>
      <div className="passenger-tour-card__image">
        {tour.coverImageUrl ? <img src={tour.coverImageUrl} alt="" loading="lazy" /> : <Globe2 aria-hidden="true" size={42} />}
        <span className={`passenger-tour-card__status passenger-tour-card__status--${status}`}>{relative}</span>
        {tour.durationDays ? <span className="passenger-tour-card__duration">{tour.durationDays} gün</span> : null}
      </div>
      <div className="passenger-tour-card__body">
        <h3>{tour.name}</h3>
        {countries.length ? <p className="passenger-tour-card__route"><Globe2 size={14} aria-hidden="true" /><span>{countries.join(" · ")}</span></p> : null}
        <p className="passenger-tour-card__date"><CalendarDays size={15} aria-hidden="true" /><span>{range}</span></p>
        <div className="passenger-tour-card__facts">
          {tour.departureCity ? <span><MapPin size={13} aria-hidden="true" />{tour.departureCity} çıkışlı</span> : null}
          {tour.airline ? <span><Plane size={13} aria-hidden="true" />{tour.airline}</span> : null}
          {tour.visaStatus ? <span>{tour.visaStatus}</span> : null}
        </div>
        {canShowAvailability ? <p className={`passenger-tour-card__availability${removed || (available !== null && available <= 0) ? " passenger-tour-card__availability--closed" : ""}`}>{availability}</p> : null}
        <div className="passenger-tour-card__bottom">
          <span className="passenger-tour-card__price"><small>Çıkış fiyatı</small>{departurePriceLabel(departure)}</span>
          <span className="passenger-tour-card__action">Rotayı gör <ArrowUpRight size={16} aria-hidden="true" /></span>
        </div>
      </div>
    </Link>
  );
}
