export const siteUrl = "https://turtakipv2.vercel.app";

export function officialTourUrl(sourceUrl: string | null | undefined) {
  if (!sourceUrl) return null;
  try {
    const url = new URL(sourceUrl);
    if (url.protocol !== "https:" || !["ejderturizm.com.tr", "www.ejderturizm.com.tr"].includes(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
