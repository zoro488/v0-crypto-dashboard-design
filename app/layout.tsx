import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Script from "next/script"
import "./globals.css"
import { AppProvider } from "@/app/lib/context/AppContext"
import { Toaster } from "@/app/components/ui/toaster"
import { ErrorBoundary } from "@/app/components/ErrorBoundary"
import ImmersiveWrapper from "@/app/components/layout/ImmersiveWrapper"
import { SplashScreen } from "@/app/components/splash"
// FloatingAIWidget removido - usar FloatingSplineAIWidget desde page.tsx
// para evitar widgets duplicados

const geist = Geist({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

export const metadata: Metadata = {
  title: "Chronos - Sistema de Gestión Empresarial Premium",
  description: "Sistema completo de gestión de flujos de capital con arquitectura 3D y AI",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chronos",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
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
        <ErrorBoundary>
          <AppProvider>
            {/* 🎬 SPLASH SCREEN - Partículas CHRONOS */}
            <SplashScreen duration={5500} enabled={true}>
              {/* <PerformanceMonitor /> */}
              
              {/* 🌌 FONDO 3D GLOBAL - Siempre visible */}
              <ImmersiveWrapper />
              
              {/* 📦 CONTENIDO PRINCIPAL - Con z-index superior */}
              <div className="relative z-10 min-h-screen w-full overflow-auto">
                {children}
              </div>
              
              {/* 🤖 AGENTE IA FLOTANTE - Manejado en page.tsx con FloatingSplineAIWidget */}
              
              <Toaster />
            </SplashScreen>
          </AppProvider>
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
