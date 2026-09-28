import { createHmac } from "node:crypto";

export function memberAuthConfig(env: Record<string, string | undefined> = process.env) {
  // Domain separation lets existing installations reuse their strong server secret.
  const adminSecret = env.ADMIN_COOKIE_SECRET;
  const secret = env.BETTER_AUTH_SECRET || (adminSecret && adminSecret.length >= 32 && !/^(replace-|change-me|dev-secret)/i.test(adminSecret) ? createHmac("sha256", adminSecret).update("ejder-member-auth-v1").digest("hex") : undefined);
  if (!secret || secret.length < 32 || secret.startsWith("replace-") || secret.startsWith("change-me")) return null;
  const baseURL = env.BETTER_AUTH_URL || (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : env.NODE_ENV === "production" ? "https://turtakipv2.vercel.app" : "http://localhost:3000");
  try {
    const url = new URL(baseURL);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if ((url.protocol !== "https:" && !(url.protocol === "http:" && local)) || url.username || url.password || url.search || url.hash || !["", "/"].includes(url.pathname)) return null;
    return { secret, baseURL: url.origin };
  } catch { return null; }
}
