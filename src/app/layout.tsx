import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HR Food - Makan Enak, Mood Naik!',
  description: 'Masakan Rumahan Rasa Juara! Pesan Makanan Langsung dari Meja Anda.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-rose-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
