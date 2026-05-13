import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'TURTAKIP Next',
  description: 'Tur programı ve yolcu takip uygulaması'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
