"use client";

import { Upload } from "lucide-react";
import { useState } from "react";

export function PhotoUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function upload(file: File) {
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: form });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) setError(data.error || "Upload başarısız");
    else onUploaded(data.url);
  }
  return (
    <label className="btn cursor-pointer">
      <Upload size={16} />
      {busy ? "Yükleniyor" : "Fotoğraf"}
      <input className="hidden" type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
      {error ? <span className="text-coral">{error}</span> : null}
    </label>
  );
}
