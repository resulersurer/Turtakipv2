import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ReservationError } from "./domain";

export function reservationErrorResponse(error: unknown) {
  if (error instanceof ReservationError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ error: error.issues.map((i) => i.message).join(" ") }, { status: 400 });
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : null;
  if (code === "P2021" || code === "P2022") return NextResponse.json({ error: "Rezervasyon tabloları hazır değil. Veritabanı migration işlemini çalıştırın." }, { status: 503 });
  if (code === "P2003") return NextResponse.json({ error: "Rezervasyon geçmişi bulunan tur veya çıkış silinemez. Turu arşivleyebilirsiniz." }, { status: 409 });
  if (code === "P2002" || code === "P2034") return NextResponse.json({ error: "Eş zamanlı bir işlem gerçekleşti. Ekranı yenileyip tekrar deneyin." }, { status: 409 });
  console.error("Reservation operation failed", error instanceof Error ? error.name : "Unknown error");
  return NextResponse.json({ error: "İşlem tamamlanamadı. Lütfen tekrar deneyin." }, { status: 500 });
}
