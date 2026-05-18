import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth) return auth;
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 });
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`tour-images/${Date.now()}-${file.name}`, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  }
  return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN tanımlı değil. Vercel Blob veya Supabase Storage bağlayın." }, { status: 501 });
}
