"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

export function TourDataRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const refresh = () => {
      if (pending || document.visibilityState !== "visible") return;
      startTransition(() => router.refresh());
    };
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [router, pending]);

  return null;
}
