import type { Metadata } from "next";
import YearToursPage from "@/components/passenger/YearToursPage";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const { year } = await params;
  if (!["2026", "2027"].includes(year)) return {};
  return { title: `${year} Turları`, description: `Ejder Turizm ${year} yurtdışı turları, güncel çıkış tarihleri, rotalar ve tur programları.`, alternates: { canonical: `/passenger/tours/${year}` } };
}
export default function Page(props: { params: Promise<{ year: string }>; searchParams: Promise<{ month?: string }> }) {
  return <YearToursPage {...props} />;
}
