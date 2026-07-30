import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import { headers } from "next/headers";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://trivisionx-ai.vercel.app'),
  title: 'trivisionx',
  description: 'TriVisionX is an enterprise-grade AI research platform that combines multi-agent intelligence, semantic search, and automated knowledge discovery to transform information into actionable insights.',
  generator: 'Next.js',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'trivisionx — Enterprise Agentic Research Platform',
    description: 'TriVisionX is an enterprise-grade AI research platform that combines multi-agent intelligence, semantic search, and automated knowledge discovery to transform information into actionable insights.',
    url: 'https://trivisionx-ai.vercel.app',
    siteName: 'TriVisionX',
    images: [
      {
        url: '/og/og.png',
        width: 1200,
        height: 630,
        alt: 'TriVisionX — Enterprise Agentic Research Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'trivisionx — Enterprise Agentic Research Platform',
    description: 'TriVisionX is an enterprise-grade AI research platform that combines multi-agent intelligence, semantic search, and automated knowledge discovery to transform information into actionable insights.',
    images: ['/og/og.png'],
  },
}

import { Toaster } from '@/components/ui/sonner';

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { GlobalCommandPalette } from "@/components/global-command-palette";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers()
  const nonce = headersList.get("x-nonce") || undefined

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <TooltipProvider>
            {children}
            <GlobalCommandPalette />
          </TooltipProvider>
          <Toaster position="top-center" />
          {/* @ts-expect-error - Analytics component supports nonce at runtime but lacks it in some type definitions */}
          <Analytics nonce={nonce} />
        </ThemeProvider>
      </body>
    </html>
  );
}
