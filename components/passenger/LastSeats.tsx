import { FeaturedTours } from "./FeaturedTours";
import { TourDataRefresh } from "@/components/admin/TourDataRefresh";

export type LastSeatDeparture = {
  id: string;
  slug: string;
  name: string;
  coverImageUrl: string | null;
  startDate: string;
  available: number;
  durationDays: number | null;
  departureCity: string | null;
  route: string;
  countries: string[];
  countryCount: number;
};

const dateFormat = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "short", year: "numeric" });

export function LastSeats({ departures }: { departures: LastSeatDeparture[] }) {
  const tours = departures.map((departure) => ({
    ...departure,
    departureDate: dateFormat.format(new Date(departure.startDate))
  }));
  return <>
    <TourDataRefresh />
    <FeaturedTours tours={tours} variant="last-seats" />
  </>;
}
