import type { Metadata } from 'next';
import { Syne, Archivo } from 'next/font/google';
import './globals.css';
import { clsx } from 'clsx';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Media Sage',
  description: 'AI-powered semantic search for Anime, Movies, Books, and Music',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={clsx(syne.variable, archivo.variable)}>
      <body className="antialiased min-h-screen bg-background text-foreground font-sans bg-noise selection:bg-primary/30">
        {children}
      </body>
    </html>
  );
}
