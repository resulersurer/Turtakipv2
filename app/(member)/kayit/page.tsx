import type { Metadata } from "next";
import { MemberEntry } from "@/components/members/MemberEntry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Üye ol" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return <MemberEntry mode="sign-up" returnTo={params.next} />;
}
