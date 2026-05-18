import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ejder Turizm Tur Takip",
  description: "Ejder Turizm turları için admin import ve yolcu harita takip uygulaması"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
