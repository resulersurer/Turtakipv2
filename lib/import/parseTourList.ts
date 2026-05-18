import * as cheerio from "cheerio";

function collectTourLinks(html: string, sourceUrl: string, links: Set<string>) {
  const $ = cheerio.load(html);

  function addLink(href: string) {
    try {
      const url = new URL(href.replace(/&amp;/g, "&").replace(/\s+/g, ""), sourceUrl);
      if (!/\.html/i.test(url.pathname)) return;
      if (!url.searchParams.get("syprdky") && !/_\d+\.html/i.test(url.pathname)) return;
      links.add(url.toString());
    } catch {
      // ignore malformed links
    }
  }

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    if (/\.html/i.test(href) || /TourDetail|Tour_Detail|Tüm-Turlar|Tum-Turlar/i.test(href)) addLink(href);
  });

  const rawMatches = html.match(/(?:https?:\/\/www\.ejderturizm\.com\.tr)?\/[^"'<>\\\s]+_+\d+\.html(?:\?[^"'<>\\\s]+)?/gi) || [];
  for (const href of rawMatches) addLink(href);
}

async function fetchText(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": "ejder-tour-tracker-import/1.0" }, cache: "no-store" });
  if (!response.ok) throw new Error(`Liste alınamadı: ${response.status}`);
  return response.text();
}

export async function parseTourList(sourceUrl: string) {
  const links = new Set<string>();
  const html = await fetchText(sourceUrl);
  collectTourLinks(html, sourceUrl, links);

  const url = new URL(sourceUrl);
  if (/TourList\.aspx/i.test(url.pathname)) {
    for (let page = 0; page < 8; page += 1) {
      const before = links.size;
      const center = new URL("/TourList_Center.aspx", url.origin);
      center.searchParams.set("fsrt", "0");
      center.searchParams.set("sypgno", String(page));
      center.searchParams.set("ssrtord", "0");
      center.searchParams.set("pcpgcnt", "48");
      center.searchParams.set("pacntid", "");
      center.searchParams.set("paregid", "");
      for (const [key, value] of url.searchParams.entries()) center.searchParams.set(key, value);
      const centerHtml = await fetchText(center.toString());
      collectTourLinks(centerHtml, center.toString(), links);
      if (links.size === before && page > 0) break;
    }
  }

  return Array.from(links).sort((a, b) => a.localeCompare(b, "tr"));
}
