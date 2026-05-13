import { z } from 'zod';

export const tourDaySchema = z.object({
  id: z.string().optional(),
  dayNumber: z.number().min(1),
  date: z.string().min(1),
  hour: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  activity: z.string().optional(),
  photoUrl: z.string().url().optional(),
  lat: z.number().optional(),
  lng: z.number().optional()
});

export const tourPayloadSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  days: z.array(tourDaySchema).min(1)
});

export type TourPayload = z.infer<typeof tourPayloadSchema>;
