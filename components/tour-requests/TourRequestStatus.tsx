"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

export function TourRequestStatus({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function update(nextStatus: string) {
    setPending(true);
    const response = await fetch(`/api/tour-requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
    setPending(false);
    if (response.ok) router.refresh();
  }
  return <label className="tour-request-status"><span className="sr-only">Talep durumu</span>{pending ? <LoaderCircle className="animate-spin" size={16}/> : null}<select value={status} disabled={pending} onChange={(event) => update(event.target.value)}><option value="NEW">Yeni</option><option value="CONTACTED">İletişime geçildi</option><option value="CONVERTED">Satışa dönüştü</option><option value="CLOSED">Kapatıldı</option></select></label>;
}
