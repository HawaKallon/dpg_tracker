import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dpg.local';
const siteName = 'DPG Tracker';
const siteDescription =
  'Live tracker of Sierra Leone’s Digital Public Goods program — participation, reach, and engagement across universities, hubs, and online communities.';

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2 focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
