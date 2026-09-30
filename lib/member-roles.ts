import { z } from "zod";

export const memberRoles = ["MANAGEMENT", "STAFF", "PASSENGER", "GUIDE", "AGENCY"] as const;
export type MemberRoleValue = typeof memberRoles[number];

export const memberRoleLabels: Record<MemberRoleValue, string> = {
  MANAGEMENT: "Yönetim",
  STAFF: "Personel",
  PASSENGER: "Yolcu / Misafir",
  GUIDE: "Rehber",
  AGENCY: "Acente"
};

export const updateMemberRoleSchema = z.object({ role: z.enum(memberRoles) });

export function isMemberRole(value?: string): value is MemberRoleValue {
  return memberRoles.includes(value as MemberRoleValue);
}
