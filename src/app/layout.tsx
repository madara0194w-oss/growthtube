import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/components/providers/AppProvider'
import { ClientLayout } from '@/components/layout/ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GrowthTube - Share Your Videos With The World',
  description: 'GrowthTube is a video sharing platform where you can upload, watch, and share videos with millions of people around the world.',
  keywords: ['video', 'streaming', 'upload', 'share', 'watch', 'entertainment', 'growth'],
  authors: [{ name: 'GrowthTube' }],
  openGraph: {
    title: 'GrowthTube - Share Your Videos With The World',
    description: 'GrowthTube is a video sharing platform where you can upload, watch, and share videos with millions of people around the world.',
    type: 'website',
    locale: 'en_US',
    siteName: 'GrowthTube',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GrowthTube - Share Your Videos With The World',
    description: 'GrowthTube is a video sharing platform where you can upload, watch, and share videos with millions of people around the world.',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <AppProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AppProvider>
      </body>
    </html>
  )
}
