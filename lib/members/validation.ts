import { z } from "zod";

export const MEMBER_PASSWORD_MIN = 12;
export const MEMBER_PASSWORD_MAX = 128;
export const memberNameSchema = z.string().trim().min(2, "Adınız ve soyadınız en az 2 karakter olmalı.").max(120, "Adınız ve soyadınız en fazla 120 karakter olabilir.");
const email = z.string().trim().email("Geçerli bir e-posta adresi girin.").max(254).transform((value) => value.toLowerCase());
const newPassword = z.string().min(MEMBER_PASSWORD_MIN, "Şifreniz en az 12 karakter olmalı.").max(MEMBER_PASSWORD_MAX, "Şifreniz en fazla 128 karakter olabilir.");

export const memberSignInSchema = z.object({ email, password: z.string().min(1, "Şifrenizi girin.").max(MEMBER_PASSWORD_MAX) });
export const memberSignUpSchema = z.object({ name: memberNameSchema, email, password: newPassword, confirmPassword: z.string() }).refine((data) => data.password === data.confirmPassword, { message: "Şifreler eşleşmiyor.", path: ["confirmPassword"] });
export const memberPasswordSchema = z.object({ currentPassword: z.string().min(1, "Mevcut şifrenizi girin.").max(MEMBER_PASSWORD_MAX), newPassword, confirmPassword: z.string() }).refine((data) => data.newPassword === data.confirmPassword, { message: "Yeni şifreler eşleşmiyor.", path: ["confirmPassword"] }).refine((data) => data.currentPassword !== data.newPassword, { message: "Yeni şifreniz mevcut şifrenizden farklı olmalı.", path: ["newPassword"] });

// Only permit customer-facing local routes after authentication.
export function safeMemberReturnPath(value?: unknown) {
  if (typeof value !== "string" || !value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return "/hesabim";
  try {
    const url = new URL(value, "https://member.invalid");
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== "https://member.invalid" || !/^\/(?:hesabim|passenger|tours|tour)(?:\/|$)/.test(path) || /[\\\u0000-\u0020]/.test(path)) return "/hesabim";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return "/hesabim"; }
}

export function memberErrorMessage(error?: { code?: string; status?: number; message?: string } | null) {
  if (error?.status === 429) return "Çok fazla deneme yaptınız. Bir dakika bekleyip tekrar deneyin.";
  if (error?.status === 503) return "Üyelik hizmeti şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.";
  const messages: Record<string, string> = {
    INVALID_EMAIL_OR_PASSWORD: "E-posta adresi veya şifre hatalı.",
    INVALID_PASSWORD: "Mevcut şifreniz hatalı.",
    USER_ALREADY_EXISTS: "Bu e-posta adresiyle bir hesap mevcut. Giriş yapabilirsiniz.",
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Bu e-posta adresiyle bir hesap mevcut. Giriş yapabilirsiniz.",
    PASSWORD_TOO_SHORT: "Şifreniz en az 12 karakter olmalı.",
    PASSWORD_TOO_LONG: "Şifreniz en fazla 128 karakter olabilir.",
    INVALID_EMAIL: "Geçerli bir e-posta adresi girin.",
    INVALID_NAME: "Adınızı ve soyadınızı 2–120 karakter arasında girin.",
    SESSION_EXPIRED: "Oturumunuz sona erdi. Lütfen yeniden giriş yapın.",
    UNAUTHORIZED: "Oturumunuz sona erdi. Lütfen yeniden giriş yapın."
  };
  if (error?.status === 401 && !error.code) return messages.UNAUTHORIZED;
  return messages[error?.code || ""] || "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
}
