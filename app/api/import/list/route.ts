import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Liste URL importu kapalı.",
      message: "Lütfen yalnızca tekil tur detay URL'si ile import yapın."
    },
    { status: 410 }
  );
}
