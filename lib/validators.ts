import { z } from "zod";

const optionalString = z.string().trim().optional().nullable().transform((v) => v || null);
const optionalNumber = z.coerce.number().optional().nullable().transform((v) => (Number.isFinite(v as number) ? v : null));

export const departureSchema = z.object({
  id: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  label: optionalString,
  price: z.coerce.number().optional().nullable(),
  currency: z.string().default("EUR"),
  availabilityStatus: optionalString
});

export const daySchema = z.object({
  id: z.string().optional(),
  dayNumber: z.coerce.number().int().min(1),
  title: z.string().min(1),
  dateOffset: z.coerce.number().int().default(0),
  hour: optionalString,
  city: optionalString,
  country: optionalString,
  description: optionalString,
  hotelInfo: optionalString,
  flightInfo: optionalString,
  photoUrl: optionalString,
  lat: optionalNumber,
  lng: optionalNumber,
  sortOrder: z.coerce.number().int().default(0)
});

export const imageSchema = z.object({
  id: z.string().optional(),
  url: z.string().url(),
  alt: optionalString,
  sortOrder: z.coerce.number().int().default(0)
});

export const priceSchema = z.object({
  id: z.string().optional(),
  departureId: optionalString,
  roomType: z.string().default("Yetişkin"),
  adultPrice: z.coerce.number().optional().nullable(),
  childPrice: z.coerce.number().optional().nullable(),
  currency: z.string().default("EUR")
});

export const tourWriteSchema = z.object({
  externalId: optionalString,
  sourceUrl: z.string().url().optional().nullable(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  durationDays: z.coerce.number().int().min(1).optional().nullable(),
  departureCity: optionalString,
  airline: optionalString,
  visaStatus: optionalString,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  coverImageUrl: z.string().url().optional().nullable(),
  departures: z.array(departureSchema).default([]),
  days: z.array(daySchema).default([]),
  images: z.array(imageSchema).default([]),
  prices: z.array(priceSchema).default([])
});

export const importSchema = z.object({
  url: z.string().url()
});

export const listToursQuerySchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  q: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  isoWeek: z.coerce.number().int().min(1).max(53).optional(),
  weekday: z.coerce.number().int().min(0).max(6).optional()
});
