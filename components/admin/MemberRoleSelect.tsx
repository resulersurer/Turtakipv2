"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { memberRoleLabels, memberRoles, type MemberRoleValue } from "@/lib/member-roles";

export function MemberRoleSelect({ memberId, role }: { memberId: string; role: MemberRoleValue }) {
  const router = useRouter();
  const [value, setValue] = useState(role);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function update(nextRole: MemberRoleValue) {
    const previous = value;
    setValue(nextRole); setPending(true); setError("");
    try {
      const response = await fetch(`/api/admin/members/${memberId}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: nextRole }) });
      if (!response.ok) throw new Error("Rol kaydedilemedi.");
      router.refresh();
    } catch (reason) { setValue(previous); setError(reason instanceof Error ? reason.message : "Rol kaydedilemedi."); }
    finally { setPending(false); }
  }

  return <div className="member-role-control"><label><span className="sr-only">Üye rolü</span>{pending ? <LoaderCircle className="animate-spin" size={15}/> : null}<select value={value} disabled={pending} onChange={(event) => update(event.target.value as MemberRoleValue)}>{memberRoles.map((item) => <option key={item} value={item}>{memberRoleLabels[item]}</option>)}</select></label>{error ? <small role="alert">{error}</small> : null}</div>;
}
