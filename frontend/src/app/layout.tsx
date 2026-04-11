import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ColorSchemeScript } from '@mantine/core';
import { AppProviders } from '@/providers/AppProviders';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'ClickLess AI', template: '%s | ClickLess AI' },
  description: 'AI-powered shopping automation with human-in-the-loop control. Shop smarter across Amazon and Walmart.',
  keywords: ['AI shopping', 'automation', 'Amazon', 'Walmart', 'comparison'],
  openGraph: {
    title: 'ClickLess AI',
    description: 'Shop smarter with AI. You confirm every purchase.',
    type: 'website',
  },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevents theme flicker on initial load */}
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className={inter.variable}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
