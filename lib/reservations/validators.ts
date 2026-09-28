import { z } from "zod";

export const capacitySchema = z.object({
  capacity: z.number().int().min(0).max(10000),
  blockedSeats: z.number().int().min(0).max(10000)
}).refine((value) => value.blockedSeats <= value.capacity, { message: "Satışa kapalı koltuk toplam kapasiteyi aşamaz." });

export const reservationSchema = z.object({
  requestId: z.string().uuid(),
  departureId: z.string().min(1),
  contactName: z.string().trim().min(2, "İletişim kişisinin adını girin.").max(120),
  contactPhone: z.string().trim().min(7, "Geçerli bir telefon numarası girin.").max(30).regex(/^[+\d\s().-]+$/, "Geçerli bir telefon numarası girin."),
  contactEmail: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
  notes: z.string().trim().max(2000).optional(),
  status: z.enum(["HOLD", "CONFIRMED"]),
  holdExpiresAt: z.string().datetime({ offset: true }).nullable().optional(),
  passengers: z.array(z.string().trim().min(2, "Her yolcunun adını ve soyadını girin.").max(120)).min(1).max(200)
}).refine((value) => value.status !== "HOLD" || Boolean(value.holdExpiresAt), { message: "Opsiyon bitiş zamanını seçin.", path: ["holdExpiresAt"] });

export const statusSchema = z.object({ status: z.enum(["CONFIRMED", "CANCELLED"]) });
