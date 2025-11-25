import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AppProvider } from "@/frontend/app/lib/context/AppContext"
import { Toaster } from "@/frontend/app/components/ui/toaster"
import { ErrorBoundary } from "@/frontend/app/components/ErrorBoundary"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Chronos - Sistema de Gestión Empresarial Premium",
  description: "Sistema completo de gestión de flujos de capital con arquitectura 3D y AI",
  generator: "v0.app",
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chronos",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
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
    <html lang="es" suppressHydrationWarning>
      <body className={`font-sans antialiased bg-slate-950 text-render-optimized`} suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Disable React DevTools to prevent __reactContextDevtoolDebugId errors
              if (typeof window !== 'undefined') {
                window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
                  supportsFiber: true,
                  inject: function() {},
                  onCommitFiberRoot: function() {},
                  onCommitFiberUnmount: function() {},
                  isDisabled: true
                };
              }
              
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('[SW] Registered successfully:', registration.scope);
                    },
                    function(err) {
                      console.log('[SW] Registration failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
        <ErrorBoundary>
          <AppProvider>
            {children}
            <Toaster />
            {/* Global R3F Canvas for View tracking - enables 3D windows in Bento Grid */}
            {/* <Canvas
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
                zIndex: -1,
              }}
              eventSource={typeof document !== "undefined" ? document.getElementById("root") : undefined}
              eventPrefix="client"
              gl={{ alpha: true, antialias: true }}
              dpr={[1, 2]}
            >
              <View.Port />
            </Canvas> */}
          </AppProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
