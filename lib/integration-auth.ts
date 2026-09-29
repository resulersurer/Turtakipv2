import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function hasValidIntegrationKey(request: Request) {
  const expected = process.env.INTEGRATION_API_KEY;
  const authorization = request.headers.get("authorization");
  const provided = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!expected || !provided) return false;
  return timingSafeEqual(digest(provided), digest(expected));
}
