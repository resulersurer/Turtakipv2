import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const createTourRequestSchema = z.object({
  fullName: z.string().trim().min(2, "Adınızı ve soyadınızı yazın.").max(120),
  phone: z.string().trim().min(7, "Geçerli bir telefon numarası yazın.").max(30).regex(/^[+\d][\d\s().-]+$/, "Geçerli bir telefon numarası yazın."),
  email: z.string().trim().email("Geçerli bir e-posta adresi yazın.").max(254).optional().or(z.literal("")),
  city: optionalText(80),
  adultCount: z.coerce.number().int().min(1).max(20),
  childCount: z.coerce.number().int().min(0).max(20),
  preferredDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  budget: optionalText(80),
  notes: optionalText(1500),
  tourId: optionalText(80),
  tourSlug: optionalText(180),
  sourcePage: z.string().trim().min(1).max(500),
  sourceLabel: optionalText(120),
  utmSource: optionalText(120),
  utmMedium: optionalText(120),
  utmCampaign: optionalText(180),
  website: optionalText(200)
});

export const updateTourRequestSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CONVERTED", "CLOSED"])
});

export const tourRequestStatusLabels = {
  NEW: "Yeni",
  CONTACTED: "İletişime geçildi",
  CONVERTED: "Satışa dönüştü",
  CLOSED: "Kapatıldı"
} as const;
