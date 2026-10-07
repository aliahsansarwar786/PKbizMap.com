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

export const metadata = {
  title: {
    default: 'PKbizMap - Find Local Businesses',
    template: '%s | PKbizMap',
  },
  description:
    'Discover and connect with trusted local businesses. Browse by category, location, and ratings.',
  keywords: ['business directory', 'local businesses', 'find businesses', 'business listings'],
  authors: [{ name: 'PKbizMap' }],
  openGraph: {
    title: 'PKbizMap - Find Local Businesses',
    description: 'Discover and connect with trusted local businesses.',
    type: 'website',
  },
  icons: {
    icon: '/logo-transparent.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
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
