import { headers } from "next/headers";
import { cache } from "react";
import { getMemberAuth } from "./auth";

export const getMemberSession = cache(async () => {
  const auth = getMemberAuth();
  if (!auth) return null;
  return auth.api.getSession({ headers: await headers() });
});
