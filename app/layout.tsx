import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Ejder Turizm | Tur Takibi ve Rotalar", template: "%s | Ejder Turizm" },
  description: "Ejder Turizm turlarının rotalarını, çıkış tarihlerini ve tur programlarını keşfedin.",
  openGraph: { type: "website", locale: "tr_TR", siteName: "Ejder Turizm Tur Takip" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
