import type { Metadata } from 'next';
import { Bricolage_Grotesque, Newsreader } from 'next/font/google';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  display: 'swap',
});

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dpg.local';
const siteName = 'DPG Tracker';
const siteDescription =
  'A live tracker of Sierra Leone’s Digital Public Goods program — every workshop, every campus, every line of open code shipped, counted as it happens.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Sierra Leone DPG Program`,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    'Digital Public Goods',
    'DPG',
    'Sierra Leone',
    'open source',
    'open data',
    'open AI',
    'capacity building',
  ],
  openGraph: {
    type: 'website',
    siteName,
    title: `${siteName} — Sierra Leone DPG Program`,
    description: siteDescription,
    url: siteUrl,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} — Sierra Leone DPG Program`,
    description: siteDescription,
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans overflow-x-clip">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-ink focus:text-primary-foreground focus:px-3 focus:py-2 focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
