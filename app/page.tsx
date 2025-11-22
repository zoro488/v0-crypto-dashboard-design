"use client"

import { useAppStore } from "@/lib/store/useAppStore"
import BentoNav from "@/components/layout/BentoNav"
import { FloatingAIWidget } from "@/components/FloatingAIWidget"
import { FirestoreSetupAlert } from "@/components/ui/FirestoreSetupAlert"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, lazy, Suspense } from "react"
import { useOptimizedPerformance } from "@/lib/hooks/useOptimizedPerformance"
import { ScrollProgress, ScrollReveal } from "@/components/ui/ScrollReveal"

const BentoDashboard = lazy(() => import("@/components/panels/BentoDashboard"))
const BentoOrdenesCompra = lazy(() => import("@/components/panels/BentoOrdenesCompra"))
const BentoVentas = lazy(() => import("@/components/panels/BentoVentas"))
const BentoBanco = lazy(() => import("@/components/panels/BentoBanco"))
const BentoAlmacen = lazy(() => import("@/components/panels/BentoAlmacen"))
const BentoReportes = lazy(() => import("@/components/panels/BentoReportes"))
const BentoIA = lazy(() => import("@/components/panels/BentoIA"))
const BentoDistribuidores = lazy(() => import("@/components/panels/BentoDistribuidores"))
const BentoClientes = lazy(() => import("@/components/panels/BentoClientes"))
const BentoProfit = lazy(() => import("@/components/panels/BentoProfit"))

const PanelLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
      className="relative"
    >
      <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin" />
      <div className="absolute inset-0 w-16 h-16 rounded-full bg-blue-500/20 blur-xl" />
    </motion.div>
  </div>
)

export default function Chronos() {
  const { currentPanel } = useAppStore()

  useOptimizedPerformance()

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth"
    document.body.classList.add("gpu-accelerated")

    if (document.fonts) {
      document.fonts.load('600 1em "Inter"')
    }

    return () => {
      document.documentElement.style.scrollBehavior = "auto"
    }
  }, [currentPanel])

  const renderPanel = () => {
    switch (currentPanel) {
      case "dashboard":
        return <BentoDashboard />
      case "ordenes":
        return <BentoOrdenesCompra />
      case "ventas":
        return <BentoVentas />
      case "distribuidores":
        return <BentoDistribuidores />
      case "clientes":
        return <BentoClientes />
      case "banco":
        return <BentoBanco />
      case "almacen":
        return <BentoAlmacen />
      case "reportes":
        return <BentoReportes />
      case "ia":
        return <BentoIA />
      case "profit":
        return <BentoProfit />
      default:
        return <BentoDashboard />
    }
  }

  return (
    <div id="root" className="min-h-screen bg-black relative">
      <ScrollProgress />

      <FirestoreSetupAlert />

      <div className="fixed inset-0 pointer-events-none z-[1] opacity-40">
        <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] bg-blue-500/8 rounded-full blur-[120px] will-change-transform animate-pulse" />
        <div
          className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[120px] will-change-transform animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-[50%] left-[50%] w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-[100px] will-change-transform animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10">
        <BentoNav />

        <main className="pt-24 px-4 md:px-6 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPanel}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="will-change-transform"
            >
              <ScrollReveal>
                <Suspense fallback={<PanelLoader />}>{renderPanel()}</Suspense>
              </ScrollReveal>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <FloatingAIWidget />
    </div>
  )
}
