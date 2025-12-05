import type React from 'react'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { AuthProvider } from '@/app/providers/AuthProvider'

const geist = Geist({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
})

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  preload: true,
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
}

export const metadata: Metadata = {
  title: 'CHRONOS INFINITY 2026',
  description: 'Sistema de Gestión Empresarial Premium - El dashboard más avanzado del mundo',
  keywords: ['gestión empresarial', 'finanzas', 'dashboard', 'AI', 'capital', 'ventas'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body 
        className={`${geist.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
