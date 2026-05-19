import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPinned, Plane, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { serializeTour, tourInclude } from "@/lib/tours";
import { PublicMap } from "@/components/maps/PublicMap";
import { hasDatabaseUrl, isDatabaseSchemaReady } from "@/lib/db-ready";
import { SetupNotice } from "@/components/SetupNotice";
import { isPrismaSetupError } from "@/lib/db-errors";
import { compactTourMeta } from "@/lib/display";
import { formatDepartureRange } from "@/lib/departure-status";

export const dynamic = "force-dynamic";

function ImageFrame({ src, alt, className = "h-full" }: { src?: string | null; alt: string; className?: string }) {
  if (!src) return <div className={`${className} rounded-lg border border-line bg-ink/80`} />;
  return (
    <div className={`relative overflow-hidden rounded-lg border border-line bg-slate-950 ${className}`}>
      <img src={src} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-xl" />
      <img src={src} alt={alt} className="relative z-10 h-full w-full object-contain" />
    </div>
  );
}

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasDatabaseUrl() || !(await isDatabaseSchemaReady())) return <SetupNotice />;
  const { slug } = await params;
  let tour: any;
  try {
    tour = serializeTour(await prisma.tour.findFirst({ where: { slug, status: "PUBLISHED" }, include: tourInclude })) as any;
  } catch (error) {
    if (isPrismaSetupError(error)) return <SetupNotice />;
    throw error;
  }
  if (!tour) notFound();
  const meta = compactTourMeta([tour.departureCity, tour.airline, tour.visaStatus]);
  const pricedDepartures = tour.departures.filter((departure: any) => departure.price);

  return (
    <main className="page-shell space-y-6">
      <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="panel rounded-lg p-6">
          <span className="badge">{tour.durationDays || "-"} gün</span>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-white lg:text-4xl">{tour.name}</h1>
          {meta ? <p className="mt-3 text-slate-400">{meta}</p> : null}
          <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <span className="rounded-md border border-line bg-ink/70 p-3"><Plane className="mb-2" size={18} />{tour.airline || "Havayolu"}</span>
            <span className="rounded-md border border-line bg-ink/70 p-3"><MapPinned className="mb-2" size={18} />{tour.departureCity || "Kalkış"}</span>
            <span className="rounded-md border border-line bg-ink/70 p-3"><ShieldCheck className="mb-2" size={18} />{tour.visaStatus || "Vize bilgisi"}</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link className="btn-primary rounded-md" href={`/passenger/${tour.id}`}>Yolcu takip görünümü</Link>
            <Link className="btn" href="/tours">Tüm turlar</Link>
          </div>
        </div>
        <ImageFrame src={tour.coverImageUrl} alt={tour.name} className="min-h-72 lg:min-h-full" />
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="panel rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Rota haritası</h2>
            <span className="badge">{tour.days.filter((day: any) => day.lat != null && day.lng != null).length} nokta</span>
          </div>
          <div className="h-[460px] overflow-hidden rounded-md"><PublicMap days={tour.days} /></div>
        </div>
        <div className="panel rounded-lg p-4">
          <h2 className="mb-3 font-semibold">Çıkış tarihleri</h2>
          <div className="space-y-2">
            {tour.departures.map((departure: any) => (
              <div className="rounded-md border border-line bg-ink/70 p-3 text-sm" key={departure.id}>
                <div className="flex items-start gap-2 text-white"><CalendarDays size={16} className="mt-0.5 text-mint" />{formatDepartureRange(departure)}</div>
                <div className="mt-1 text-slate-400">{departure.price ? `${departure.price} ${departure.currency}` : departure.label || "Tarih seçilebilir"}</div>
                <Link className="btn mt-3 w-full" href={`/passenger/${tour.id}?departureId=${departure.id}`}>Bu tarihle takip et</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {pricedDepartures.length || tour.prices.length ? (
        <section className="panel rounded-lg p-4">
          <h2 className="mb-3 text-lg font-semibold">Fiyat bilgileri</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {tour.prices.map((price: any) => (
              <div className="rounded-md border border-line bg-ink/70 p-3 text-sm" key={price.id}>
                <div className="font-semibold text-white">{price.roomType}</div>
                <div className="mt-1 text-mint">{price.adultPrice ? `${price.adultPrice} ${price.currency}` : "Fiyat sorunuz"}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tur programı</h2>
        <div className="relative space-y-4 border-l border-line pl-5">
          {tour.days.map((day: any) => (
            <article className="panel relative rounded-lg p-4" key={day.id}>
              <span className="absolute -left-[27px] top-5 h-3 w-3 rounded-full border border-mint bg-mint" />
              <div className="text-sm font-semibold text-mint">{day.dayNumber}. Gün · {[day.city, day.country].filter(Boolean).join(", ")}</div>
              <h3 className="mt-1 text-lg font-semibold text-white">{day.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{day.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                {day.hotelInfo ? <span className="badge">Otel: {day.hotelInfo}</span> : null}
                {day.flightInfo ? <span className="badge">Uçuş: {day.flightInfo}</span> : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      {tour.images.length ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Galeri</h2>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            {tour.images.map((image: any) => <ImageFrame key={image.id} src={image.url} alt={image.alt || tour.name} className="h-48" />)}
          </div>
        </section>
      ) : null}
    </main>
  );
}
