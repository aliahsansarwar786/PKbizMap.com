import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import SplashScreen from '@/components/ui/SplashScreen';
import FloatingWhatsApp from '@/components/ui/FloatingWhatsApp';

const inter = Inter({ subsets: ['latin'] });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.bizprimehub.com'),
  title: {
    default: 'BizPrimeHub - Find Local Businesses',
    template: '%s | BizPrimeHub',
  },
  description:
    'Discover and connect with trusted local businesses. Browse by category, location, and ratings.',
  keywords: ['business directory', 'local businesses', 'find businesses', 'business listings'],
  authors: [{ name: 'BizPrimeHub' }],
  openGraph: {
    title: 'BizPrimeHub - Find Local Businesses',
    description: 'Discover and connect with trusted local businesses.',
    siteName: 'BizPrimeHub',
    type: 'website',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'BizPrimeHub - List Your Business for Free',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BizPrimeHub - Find Local Businesses',
    description: 'Discover and connect with trusted local businesses.',
    images: ['/og-default.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {gaMeasurementId ? (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaMeasurementId}');
                `,
              }}
            />
          </>
        ) : null}
        <SplashScreen />
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                fontSize: '0.875rem',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#059669', secondary: '#ffffff' },
              },
              error: {
                iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
              },
            }}
          />
          <FloatingWhatsApp />
        </AuthProvider>
      </body>
    </html>
  );
}
