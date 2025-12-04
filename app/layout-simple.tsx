import type React from 'react'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { Toaster } from '@/app/components/ui/toaster'

const geist = Geist({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
})

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  preload: true,
  fallback: ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#8B00FF' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://chronos.vercel.app'),
  title: {
    default: 'CHRONOS 2026 - Sistema de Gestión Premium',
    template: '%s | CHRONOS',
  },
  description: 'Sistema ultra-premium de gestión empresarial con visualizaciones avanzadas.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <body 
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}
        style={{ 
          backgroundColor: '#000000', 
          color: '#ffffff', 
          minHeight: '100vh' 
        }}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
