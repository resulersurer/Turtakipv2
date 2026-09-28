import type { Metadata } from "next";
import { MemberEntry } from "@/components/members/MemberEntry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Giriş yap" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return <MemberEntry mode="sign-in" returnTo={params.next} />;
}
