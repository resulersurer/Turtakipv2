"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { memberClient } from "@/lib/members/client";

export function MemberNav() {
  const { data, isPending } = memberClient.useSession();
  if (isPending) return <span className="member-nav-links" aria-busy="true"><span className="member-nav-link text-slate-500">Hesabım</span></span>;
  return <span className="member-nav-links">
    {data?.user ? <Link className="member-nav-link member-nav-link--primary" href="/hesabim"><UserRound size={16} aria-hidden="true" />Hesabım</Link> : <>
      <Link className="member-nav-link" href="/giris">Giriş yap</Link>
      <Link className="member-nav-link member-nav-link--primary" href="/kayit">Üye ol</Link>
    </>}
  </span>;
}
