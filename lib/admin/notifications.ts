import type { Prisma } from "@prisma/client";

export function capacityTransition(before: number | null, after: number | null) {
  if (before !== null && before > 0 && after !== null && after <= 0) return "CAPACITY_FULL";
  if (before !== null && before <= 0 && after !== null && after > 0) return "CAPACITY_AVAILABLE";
  return null;
}

export function importChanges(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const strings = (items: Prisma.JsonValue | undefined) => Array.isArray(items) ? items.filter((item): item is string => typeof item === "string") : [];
  return {
    type: typeof value.changeType === "string" ? value.changeType : "",
    changes: strings(value.changes),
    addedDates: strings(value.addedDates),
    removedDates: strings(value.removedDates)
  };
}
