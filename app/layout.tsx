import type React from 'react'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'
import './globals.css'
import './styles/obsidian-glass.css'
import './styles/chronos-obsidian-os.css'
import './styles/chronos-2026-ultra.css'
import './styles/chronos-quantum-2026.css' // 🌌 QUANTUM 2026 - Sin cyan, Violeta Real + Oro Líquido + Rosa Eléctrico
import { AppProvider } from '@/app/lib/context/AppContext'
import { Toaster } from '@/app/components/ui/toaster'
import { ErrorBoundary } from '@/app/components/ErrorBoundary'
import ImmersiveWrapper from '@/app/components/layout/ImmersiveWrapper'
import { SplashScreen } from '@/app/components/splash'
import { TracingProvider } from '@/app/lib/tracing/TracingProvider'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { ConvexClientProvider } from '@/app/lib/convex/ConvexProvider'
import { RollbarProvider } from '@/app/lib/rollbar/RollbarProvider'
import { FeatureFlagsDebugPanel } from '@/app/components/debug/FeatureFlagsDebugPanel'
import { NoiseTexture } from '@/app/components/ui-premium/NoiseTexture'
import { ChronosShell } from '@/app/components/layout/ChronosShell'
// 🤖 GrokAIOrb - Widget flotante IA movido al layout para garantizar posición fixed global
import { GrokAIOrb } from '@/app/components/widgets/GrokAIOrb'
// 🎯 ScrollProvider - Sistema de scroll unificado
import { ScrollProvider } from '@/app/components/ui/ScrollController'
// 🎤 VoiceWorkerProvider - Web Worker para voz y AI (0 bloqueo UI)
import { VoiceWorkerProvider } from '@/app/providers/VoiceWorkerProvider'

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
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://chronos.vercel.app'),
  title: {
    default: 'Chronos - Sistema de Gestión Empresarial Premium',
    template: '%s | Chronos',
  },
  description: 'Sistema completo de gestión de flujos de capital con arquitectura 3D, AI avanzada y visualizaciones premium en tiempo real.',
  keywords: ['gestión empresarial', 'finanzas', 'dashboard', '3D', 'AI', 'capital', 'ventas', 'clientes'],
  authors: [{ name: 'Chronos Team' }],
  creator: 'Chronos',
  publisher: 'Chronos',
  generator: 'Next.js',
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    siteName: 'Chronos',
    title: 'Chronos - Sistema de Gestión Empresarial Premium',
    description: 'Sistema completo de gestión de flujos de capital con arquitectura 3D y AI',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Chronos Dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chronos - Sistema de Gestión Empresarial Premium',
    description: 'Sistema completo de gestión de flujos de capital con arquitectura 3D y AI',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Chronos',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="dark" style={{ backgroundColor: 'hsl(240 10% 3.9%)', colorScheme: 'dark' }}>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`} suppressHydrationWarning style={{ backgroundColor: 'hsl(240 10% 3.9%)', color: 'hsl(0 0% 98%)', minHeight: '100vh' }}>
        <Script
          id="disable-devtools"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
                supportsFiber: true,
                inject: function() {},
                onCommitFiberRoot: function() {},
                onCommitFiberUnmount: function() {},
                isDisabled: true
              };
            `,
          }}
        />
        <Script
          id="service-worker"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
        <RollbarProvider>
          <ConvexClientProvider>
            <ErrorBoundary>
              <TracingProvider enabled={process.env.NODE_ENV === 'development'}>
                <QueryProvider>
                  <AuthProvider>
                    <AppProvider>
                      {/* 🎤 VOICE WORKER - AI y Voz off-main-thread */}
                      <VoiceWorkerProvider>
                        {/* 🎬 SPLASH SCREEN PREMIUM 2026 - Con logo animado y efectos cinematográficos */}
                        <SplashScreen duration={4500} enabled={true} type="premium">
                          {/* 🎯 SCROLL CONTROLLER - Sistema unificado */}
                          <ScrollProvider>
                            {/* <PerformanceMonitor /> */}
                            
                            {/* 🌌 FONDO 3D GLOBAL - Siempre visible */}
                            <ImmersiveWrapper />
                            
                            {/* 📦 CONTENIDO PRINCIPAL - Sin overflow propio, scroll en html */}
                            <div className="relative z-10 min-h-screen w-full">
                              <ChronosShell>
                                {children}
                              </ChronosShell>
                            </div>
                            
                            {/* 🤖 AGENTE IA FLOTANTE - Siempre visible con posición fixed global */}
                            <GrokAIOrb />
                            
                            {/* 🎯 FEATURE FLAGS DEBUG PANEL - Solo en desarrollo */}
                            <FeatureFlagsDebugPanel />
                            
                            {/* 🔮 TEXTURA DE RUIDO OBSIDIAN - Efecto táctil premium */}
                            <NoiseTexture />
                            
                            <Toaster />
                          </ScrollProvider>
                        </SplashScreen>
                      </VoiceWorkerProvider>
                    </AppProvider>
                  </AuthProvider>
                </QueryProvider>
              </TracingProvider>
            </ErrorBoundary>
          </ConvexClientProvider>
        </RollbarProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
