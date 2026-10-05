import type { Metadata } from "next";
import YearToursPage from "@/components/passenger/YearToursPage";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const { year } = await params;
  if (!["2026", "2027"].includes(year)) return {};
  return { title: `${year} Son Koltuklar`, description: `Ejder Turizm ${year} turlarında 5 veya daha az koltuğu kalan çıkışları, tarihleri ve tur programlarını keşfedin.`, alternates: { canonical: `/passenger/tours/${year}/son-koltuklar` } };
}
export default function LastSeatsPage(props: { params: Promise<{ year: string }>; searchParams: Promise<{ month?: string }> }) {
  return <YearToursPage {...props} lastSeats />;
}
