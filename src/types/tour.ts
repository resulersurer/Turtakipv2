export interface TourDay {
  id: string;
  tourId?: string;
  dayNumber: number;
  date: string;
  hour?: string | null;
  city?: string | null;
  country?: string | null;
  activity?: string | null;
  photoUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface Tour {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  days: TourDay[];
}
