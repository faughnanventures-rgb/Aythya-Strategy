import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import { Providers } from './providers';
import CookieConsent from '@/components/CookieConsent';

export const metadata: Metadata = {
  title: {
    default: 'Aythya Strategy — Strategic Clarity for Your Life',
    template: '%s | Aythya Strategy',
  },
  description:
    'Create a thoughtful strategic plan for your life. Navigate career transitions, relationships, and personal growth with intention and clarity.',
  keywords: [
    'life planning',
    'strategic planning',
    'personal development',
    'career planning',
    'goal setting',
    'life transitions',
    'clarity',
    'aythya strategy',
  ],
  authors: [{ name: 'Aythya Strategy' }],
  creator: 'Aythya Strategy',
  publisher: 'Aythya Strategy',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aythya.strategy',
    title: 'Aythya Strategy — Strategic Clarity for Your Life',
    description:
      'Create a thoughtful strategic plan for your life. Navigate transitions with intention.',
    siteName: 'Aythya Strategy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aythya Strategy — Strategic Clarity for Your Life',
    description:
      'Create a thoughtful strategic plan for your life. Navigate transitions with intention.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fdfbf7' },
    { media: '(prefers-color-scheme: dark)', color: '#141211' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {/* Skip to main content link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-sage-500 focus:text-white focus:rounded-xl focus:shadow-soft"
          >
            Skip to main content
          </a>
          
          {/* Main content */}
          <main id="main-content" className="relative">
            {children}
          </main>
          
          {/* Cookie consent banner */}
          <CookieConsent />
        </Providers>
        
        {/* Vercel Analytics */}
        <Analytics />
        
        {/* Portal root for modals */}
        <div id="portal-root" />
      </body>
    </html>
  );
}
