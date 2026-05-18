import Link from "next/link";
import { CalendarDays, Copy, Eye, Pencil, Plane, Send, Trash2 } from "lucide-react";

type Tour = {
  id: string;
  slug: string;
  name: string;
  status: string;
  durationDays?: number | null;
  departureCity?: string | null;
  airline?: string | null;
  departures?: Array<{ startDate: string | Date; endDate?: string | Date | null }>;
  days?: Array<unknown>;
  coverImageUrl?: string | null;
};

export function TourCard({ tour, admin = false }: { tour: Tour; admin?: boolean }) {
  const starts = (tour.departures || []).map((departure) => new Date(departure.startDate)).sort((a, b) => a.getTime() - b.getTime());
  const first = starts[0]?.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
  const last = starts.at(-1)?.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
  return (
    <article className="panel overflow-hidden rounded-lg">
      {tour.coverImageUrl ? <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${tour.coverImageUrl})` }} /> : <div className="h-2 bg-mint" />}
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">{tour.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{[tour.durationDays ? `${tour.durationDays} gün` : null, tour.departureCity, tour.airline].filter(Boolean).join(" • ")}</p>
          </div>
          <span className="badge">{tour.status}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
          <span className="inline-flex items-center gap-2"><CalendarDays size={16} />{first && last ? `${first} - ${last}` : "Tarih yok"}</span>
          <span className="inline-flex items-center gap-2"><Plane size={16} />{tour.departures?.length || 0} çıkış</span>
          <span>{tour.days?.length || 0} program günü</span>
          <span>{tour.durationDays || "-"} gün</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {admin ? (
            <>
              <Link className="btn" href={`/admin/tours/${tour.id}`} title="Düzenle"><Pencil size={16} />Düzenle</Link>
              {tour.status === "PUBLISHED" ? <Link className="btn" href={`/passenger/${tour.id}`} title="Yolcu görünümü"><Eye size={16} />Yolcu</Link> : null}
              {tour.status !== "PUBLISHED" ? <form action={`/api/tours/${tour.id}/publish`} method="post"><button className="btn-primary rounded-md" title="Yayınla"><Send size={16} />Yayınla</button></form> : null}
              <form action={`/api/tours/${tour.id}/duplicate`} method="post"><button className="btn" title="Kopyala"><Copy size={16} />Kopyala</button></form>
              <form action={`/api/tours/${tour.id}/delete`} method="post">
                <button className="btn" title="Sil" type="submit"><Trash2 size={16} />Sil</button>
              </form>
            </>
          ) : (
            <>
              <Link className="btn-primary rounded-md" href={`/tour/${tour.slug}`}>Detay</Link>
              <Link className="btn" href={`/passenger/${tour.id}`}>Takip</Link>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
