export function cleanImportedText(value?: string | null) {
  if (!value) return null;
  const cleaned = value
    .replace(/\$\([^)]*\)\.ready[\s\S]*$/i, "")
    .replace(/\$\(document\)[\s\S]*$/i, "")
    .replace(/function\s*\([^)]*\)\s*\{[\s\S]*$/i, "")
    .replace(/fnOpenEnq\s*=\s*function[\s\S]*$/i, "")
    .replace(/Talep\s+G[öo]nder[\s\S]*$/i, "")
    .replace(/K[iı]?[sş]i\s+K[iı]?[sş]i\s+Sizi\s+Arayal[ıi]m[\s\S]*$/i, "")
    .replace(/Sizi\s+Arayal[ıi]m[\s\S]*$/i, "")
    .replace(/checkIn\s*=\s*MY[\s\S]*$/i, "")
    .replace(/\$\(.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned.length < 2) return null;
  if (/[{}]|\$\(|ready\(|function\s*\(|Talep\s+G[öo]nder|Sizi\s+Arayal[ıi]m|checkIn\s*=/i.test(cleaned)) return null;
  return cleaned;
}

export function compactTourMeta(parts: Array<string | number | null | undefined>) {
  return parts
    .map((part) => cleanImportedText(part == null ? null : String(part)))
    .filter(Boolean)
    .join(" • ");
}
