"use client"

import { useAppStore } from "@/frontend/app/lib/store/useAppStore"
import BentoNav from "@/frontend/app/components/layout/BentoNav"
import { FloatingAIWidget } from "@/frontend/app/components/FloatingAIWidget"
import { FirestoreSetupAlert } from "@/frontend/app/components/ui/FirestoreSetupAlert"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, lazy, Suspense } from "react"
import { useOptimizedPerformance } from "@/frontend/app/lib/hooks/useOptimizedPerformance"
import { ScrollProgress, ScrollReveal } from "@/frontend/app/components/ui/ScrollReveal"

const BentoDashboard = lazy(() => import("@/frontend/app/components/panels/BentoDashboard"))
const BentoOrdenesCompra = lazy(() => import("@/frontend/app/components/panels/BentoOrdenesCompra"))
const BentoVentas = lazy(() => import("@/frontend/app/components/panels/BentoVentas"))
const BentoBanco = lazy(() => import("@/frontend/app/components/panels/BentoBanco"))
const BentoAlmacen = lazy(() => import("@/frontend/app/components/panels/BentoAlmacen"))
const BentoReportes = lazy(() => import("@/frontend/app/components/panels/BentoReportes"))
const BentoIA = lazy(() => import("@/frontend/app/components/panels/BentoIA"))
const BentoDistribuidores = lazy(() => import("@/frontend/app/components/panels/BentoDistribuidores"))
const BentoClientes = lazy(() => import("@/frontend/app/components/panels/BentoClientes"))
const BentoProfit = lazy(() => import("@/frontend/app/components/panels/BentoProfit"))

const PanelLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <motion.div 
        className="w-16 h-16 rounded-full border-4 border-white/10 border-t-blue-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute inset-0 w-16 h-16 rounded-full bg-blue-500/20 blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.p
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-white/60 whitespace-nowrap font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Cargando panel...
      </motion.p>
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

      {/* Enhanced ambient background with better blur and animations */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-40">
        <motion.div 
          className="absolute top-[10%] left-[5%] w-[600px] h-[600px] bg-blue-500/8 rounded-full blur-[120px] will-change-transform"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[120px] will-change-transform"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute top-[50%] left-[50%] w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-[100px] will-change-transform"
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <div className="relative z-10">
        <BentoNav />

        <main className="pt-24 px-4 md:px-6 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPanel}
              initial={{ opacity: 0, y: 20, scale: 0.98, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, scale: 0.98, filter: "blur(10px)" }}
              transition={{
                duration: 0.5,
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
