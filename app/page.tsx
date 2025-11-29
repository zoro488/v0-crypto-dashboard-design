"use client"

import { useAppStore } from "@/app/lib/store/useAppStore"
import ChronosHeader from "@/app/components/layout/ChronosHeader"
import { FloatingSplineAIWidget } from "@/app/components/FloatingSplineAIWidget"
import { FirestoreSetupAlert } from "@/app/components/ui/FirestoreSetupAlert"
import { CommandMenu } from "@/app/components/CommandMenu"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, lazy, Suspense, useState, useCallback } from "react"
import { useOptimizedPerformance } from "@/app/lib/hooks/useOptimizedPerformance"
import { ScrollProgress, ScrollReveal } from "@/app/components/ui/ScrollReveal"

// Nuevo Dashboard Premium con animación CHRONOS
const ChronosDashboard = lazy(() => import("@/app/components/panels/ChronosDashboard"))

// Paneles existentes
const BentoOrdenesCompra = lazy(() => import("@/app/components/panels/BentoOrdenesCompra"))
const BentoBanco = lazy(() => import("@/app/components/panels/BentoBanco"))

// Panel Ventas Premium con CRUD completo, perfiles y tabla avanzada
const BentoVentasPremium = lazy(() => import("@/app/components/panels/BentoVentasPremium"))
const BentoAlmacen = lazy(() => import("@/app/components/panels/BentoAlmacen"))
const BentoReportes = lazy(() => import("@/app/components/panels/BentoReportes"))
const BentoProfit = lazy(() => import("@/app/components/panels/BentoProfit"))

// Paneles Premium con CRUD completo, perfiles y tabla avanzada
const BentoClientesPremium = lazy(() => import("@/app/components/panels/BentoClientesPremium"))
const BentoDistribuidoresPremium = lazy(() => import("@/app/components/panels/BentoDistribuidoresPremium"))

// Panel IA Inmersivo con Nexbot 3D
const BentoIAImmersive = lazy(() => import("@/app/components/panels/BentoIAImmersive"))

const PanelLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Orbe 3D de carga */}
      <motion.div 
        className="w-20 h-20 rounded-full border-4 border-white/10 border-t-cyan-500 border-r-purple-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute inset-2 w-16 h-16 rounded-full border-4 border-white/5 border-b-blue-500"
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500/30 to-purple-500/30 blur-xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [0.8, 1, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-3 h-3 rounded-full bg-white/80" />
      </motion.div>
      <motion.p
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-sm text-white/60 whitespace-nowrap font-medium tracking-wider"
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
  const [isReady, setIsReady] = useState(false)

  useOptimizedPerformance()

  // Hook para escalar con el viewport
  const useViewportScale = useCallback(() => {
    const [scale, setScale] = useState(1)
    
    useEffect(() => {
      const calculateScale = () => {
        const width = window.innerWidth
        const height = window.innerHeight
        const baseWidth = 1920
        const baseHeight = 1080
        
        // Calcular escala basada en el viewport
        const widthScale = width / baseWidth
        const heightScale = height / baseHeight
        const newScale = Math.min(widthScale, heightScale, 1.2) // Max 1.2x
        
        setScale(Math.max(newScale, 0.5)) // Min 0.5x
      }
      
      calculateScale()
      window.addEventListener('resize', calculateScale)
      return () => window.removeEventListener('resize', calculateScale)
    }, [])
    
    return scale
  }, [])

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth"
    document.body.classList.add("gpu-accelerated")
    
    // Añadir estilos de escalado global
    document.documentElement.style.setProperty('--viewport-scale', '1')

    if (document.fonts) {
      document.fonts.load('600 1em "Inter"').then(() => {
        setIsReady(true)
      })
    } else {
      setIsReady(true)
    }

    return () => {
      document.documentElement.style.scrollBehavior = "auto"
    }
  }, [currentPanel])

  const renderPanel = () => {
    switch (currentPanel) {
      case "dashboard":
        return <ChronosDashboard />
      case "ordenes":
        return <BentoOrdenesCompra />
      case "ventas":
        return <BentoVentasPremium />
      case "distribuidores":
        return <BentoDistribuidoresPremium />
      case "clientes":
        return <BentoClientesPremium />
      case "banco":
        return <BentoBanco />
      case "almacen":
        return <BentoAlmacen />
      case "reportes":
        return <BentoReportes />
      case "ia":
        return <BentoIAImmersive />
      case "profit":
        return <BentoProfit />
      default:
        return <ChronosDashboard />
    }
  }

  return (
    <div id="root" className="min-h-screen bg-black relative overflow-x-hidden w-full max-w-[100vw]">
      <ScrollProgress />

      <FirestoreSetupAlert />

      {/* Enhanced ambient background with ultra-premium effects */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950" />
        
        {/* Animated orbs */}
        <motion.div 
          className="absolute top-[5%] left-[5%] w-[700px] h-[700px] bg-cyan-500/8 rounded-full blur-[150px] will-change-transform"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 80, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[5%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] will-change-transform"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -60, 0],
            y: [0, -70, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div
          className="absolute top-[40%] left-[40%] w-[500px] h-[500px] bg-blue-500/6 rounded-full blur-[130px] will-change-transform"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
        />
        <motion.div
          className="absolute bottom-[30%] left-[20%] w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-[120px] will-change-transform"
          animate={{
            scale: [1, 1.15, 1],
            x: [0, 40, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 6
          }}
        />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Vignette effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
      </div>

      <div className="relative z-10">
        {/* Nuevo Header Ultra Premium */}
        <ChronosHeader />

        <main className="pt-20 px-4 md:px-6 lg:px-8 pb-8 overflow-x-hidden max-w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPanel}
              initial={{ opacity: 0, y: 30, scale: 0.97, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -30, scale: 0.97, filter: "blur(12px)" }}
              transition={{
                duration: 0.6,
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

      <FloatingSplineAIWidget />

      {/* Command Menu - Cmd+K para búsqueda rápida */}
      <CommandMenu />
    </div>
  )
}
