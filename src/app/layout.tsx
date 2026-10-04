import type { Metadata, Viewport } from 'next';
import { Hind_Siliguri } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/providers';

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-hind-siliguri',
});

export const metadata: Metadata = {
  title: 'BD E-Commerce',
  description: 'Your trusted online shopping destination in Bangladesh',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f1f5f9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.setAttribute('data-theme', 'light');
                  localStorage.setItem('theme', 'light');
                } catch (e) {}
              })();
            `
          }}
        />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://api.bdecommerce.inspireacademyy.com/" />
        <link rel="dns-prefetch" href="https://api.bdecommerce.inspireacademyy.com/" />
        <link rel="preconnect" href="https://api.bdecommerce.inspireacademyy.com/" />
        <link rel="dns-prefetch" href="https://api.bdecommerce.inspireacademyy.com/" />
      </head>
      <body suppressHydrationWarning className={`${hindSiliguri.variable} font-sans antialiased bg-background text-foreground`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
