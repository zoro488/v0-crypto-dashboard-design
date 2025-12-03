'use client'

import { useAppStore } from '@/app/lib/store/useAppStore'
import ChronosHeader from '@/app/components/layout/ChronosHeader'
// GrokAIOrb movido a layout.tsx para posición fixed global
import { FirestoreSetupAlert } from '@/app/components/ui/FirestoreSetupAlert'
import { CommandMenu } from '@/app/components/CommandMenu'
import { SystemShowcase } from '@/app/components/ui/SystemShowcase'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, lazy, Suspense } from 'react'
import { useOptimizedPerformance } from '@/app/lib/hooks/useOptimizedPerformance'
import { ScrollProgress, ScrollReveal } from '@/app/components/ui/ScrollReveal'
import { QuickStats3D } from '@/app/components/ui/QuickStats3D'
import { useFirestoreCRUD } from '@/app/hooks/useFirestoreCRUD'
import type { Venta, Cliente, OrdenCompra, Banco } from '@/app/types'
import dynamic from 'next/dynamic'
import { 
  ShoppingCart, Users, FileText, 
  TrendingUp, Wallet,
} from 'lucide-react'

// 🎙️ AI Premium Widget con Orbe Reactivo a Voz (carga dinámica)
const AIPremiumWidget = dynamic(
  () => import('@/app/components/ai/AIPremiumWidget'),
  { ssr: false },
)

// Nuevo Dashboard Premium con animación CHRONOS
const ChronosDashboard = lazy(() => import('@/app/components/panels/ChronosDashboard'))

// 🔮 Nuevo Dashboard Obsidian Glass Ultra-Premium
const ObsidianDashboard = lazy(() => import('@/app/components/panels/ObsidianDashboard'))

// 🚀 CHRONOS 2026 - Dashboard Ultra-Premium con tendencias 2026
const Dashboard2026 = lazy(() => import('@/app/components/chronos-2026/Dashboard2026'))

// 🔥 CHRONOS 2026 ULTRA - EL DISEÑO MÁS AVANZADO Y PREMIUM DEL MUNDO
const Dashboard2026Ultra = lazy(() => import('@/app/components/chronos-2026-ultra/Dashboard2026Ultra'))

// Paneles Premium - TODOS los paneles usan versiones Premium con componentes 3D avanzados
const BentoOrdenesCompraPremium = lazy(() => import('@/app/components/panels/BentoOrdenesCompraPremium'))
const BentoBanco = lazy(() => import('@/app/components/panels/BentoBanco'))
const BentoVentasPremium = lazy(() => import('@/app/components/panels/BentoVentasPremium'))
const BentoAlmacenPremium = lazy(() => import('@/app/components/panels/BentoAlmacenPremium'))
const BentoReportesPremium = lazy(() => import('@/app/components/panels/BentoReportesPremium'))
const BentoClientesPremium = lazy(() => import('@/app/components/panels/BentoClientesPremium'))
const BentoDistribuidoresPremium = lazy(() => import('@/app/components/panels/BentoDistribuidoresPremium'))

// Panel IA Elevado Premium con AIBrainVisualizer y Neural Engine
const BentoIAElevated = lazy(() => import('@/app/components/panels/BentoIAElevated'))

// Panel GYA (Gastos y Abonos) - Gestión centralizada de egresos e ingresos
const BentoGYA = lazy(() => import('@/app/components/panels/BentoGYA'))

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
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div 
        className="absolute inset-2 w-16 h-16 rounded-full border-4 border-white/5 border-b-blue-500"
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
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
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [0.8, 1, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
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
  const { currentPanel, setCurrentPanel } = useAppStore()
  const _showStats = true

  // Cargar datos para estadísticas
  const { data: ventas = [] } = useFirestoreCRUD<Venta>('ventas')
  const { data: clientes = [] } = useFirestoreCRUD<Cliente>('clientes')
  const { data: ordenes = [] } = useFirestoreCRUD<OrdenCompra>('ordenes_compra')
  const { data: bancos = [] } = useFirestoreCRUD<Banco>('bancos')

  useOptimizedPerformance()

  // Calcular estadísticas
  const totalVentas = ventas.reduce((acc, v) => acc + (v.precioTotalVenta || 0), 0)
  const totalClientes = clientes.length
  const totalOrdenes = ordenes.length
  const capitalTotal = bancos.reduce((acc, b) => acc + (b.capitalActual || 0), 0)
  const ventasMes = ventas.filter(v => {
    const fecha = v.fecha instanceof Date ? v.fecha : 
                  typeof v.fecha === 'string' ? new Date(v.fecha) :
                  'toDate' in v.fecha ? v.fecha.toDate() : new Date()
    const hoy = new Date()
    return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
  }).length

  const stats = [
    {
      id: 'ventas',
      label: 'Ventas Totales',
      value: `$${(totalVentas / 1000).toFixed(0)}k`,
      icon: <ShoppingCart className="w-6 h-6 text-green-400" />,
      color: '#10b981',
      trend: 12.5,
      onClick: () => setCurrentPanel('ventas'),
    },
    {
      id: 'clientes',
      label: 'Clientes',
      value: totalClientes,
      icon: <Users className="w-6 h-6 text-blue-400" />,
      color: '#3b82f6',
      trend: 8.3,
      onClick: () => setCurrentPanel('clientes'),
    },
    {
      id: 'ordenes',
      label: 'Órdenes',
      value: totalOrdenes,
      icon: <FileText className="w-6 h-6 text-purple-400" />,
      color: '#8b5cf6',
      trend: -2.1,
      onClick: () => setCurrentPanel('ordenes'),
    },
    {
      id: 'capital',
      label: 'Capital Total',
      value: `$${(capitalTotal / 1000).toFixed(0)}k`,
      icon: <Wallet className="w-6 h-6 text-cyan-400" />,
      color: '#06b6d4',
      trend: 15.7,
      onClick: () => setCurrentPanel('bancos'),
    },
    {
      id: 'ventas-mes',
      label: 'Ventas Este Mes',
      value: ventasMes,
      icon: <TrendingUp className="w-6 h-6 text-amber-400" />,
      color: '#f59e0b',
      trend: 23.4,
      onClick: () => setCurrentPanel('reportes'),
    },
  ]

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    document.body.classList.add('gpu-accelerated')
    
    // Añadir estilos de escalado global
    document.documentElement.style.setProperty('--viewport-scale', '1')

    // Pre-cargar fuentes
    if (document.fonts) {
      document.fonts.load('600 1em "Inter"')
    }

    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [currentPanel])

  // 🔮 Activar Obsidian Glass Dashboard (Ultra-Premium Experience)
  // 🚀 CHRONOS 2026 - El dashboard más avanzado (activar para experiencia completa 2026)
  // 🔥 CHRONOS 2026 ULTRA - EL DISEÑO MÁS AVANZADO Y PREMIUM DEL MUNDO 2025-2026
  const useChronos2026Ultra = true // ⭐ DISEÑO PREMIUM MUNDIAL ACTIVADO
  const useChronos2026 = false // Fallback legacy
  const useObsidianDashboard = false // Fallback a Obsidian si 2026 está desactivado

  const renderPanel = () => {
    switch (currentPanel) {
      case 'dashboard':
        // 🔥 CHRONOS 2026 ULTRA - EL DISEÑO MÁS AVANZADO DEL MUNDO
        if (useChronos2026Ultra) return <Dashboard2026Ultra />
        if (useChronos2026) return <Dashboard2026 />
        return useObsidianDashboard ? <ObsidianDashboard /> : <ChronosDashboard />
      case 'ordenes':
        return <BentoOrdenesCompraPremium />
      case 'ventas':
        return <BentoVentasPremium />
      case 'distribuidores':
        return <BentoDistribuidoresPremium />
      case 'clientes':
        return <BentoClientesPremium />
      case 'bancos':
      case 'boveda_monte':
      case 'boveda_usa':
      case 'utilidades':
      case 'flete_sur':
      case 'azteca':
      case 'leftie':
      case 'profit':
        return <BentoBanco />
      case 'almacen':
        return <BentoAlmacenPremium />
      case 'gya':
      case 'gastos':
      case 'abonos':
        return <BentoGYA />
      case 'reportes':
        return <BentoReportesPremium />
      case 'ia':
        return <BentoIAElevated />
      default:
        return useObsidianDashboard ? <ObsidianDashboard /> : <ChronosDashboard />
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
            ease: 'easeInOut',
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
            ease: 'easeInOut',
            delay: 2,
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
            ease: 'easeInOut',
            delay: 4,
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
            ease: 'easeInOut',
            delay: 6,
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
            backgroundSize: '50px 50px',
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
          {/* Quick Stats 3D */}
          {_showStats && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <ScrollReveal>
                <QuickStats3D stats={stats} />
              </ScrollReveal>
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPanel}
              initial={{ opacity: 0, y: 30, scale: 0.97, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -30, scale: 0.97, filter: 'blur(12px)' }}
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

      {/* 🤖 GrokAIOrb movido a layout.tsx para posición fixed global */}

      {/* 🎙️ AI Premium Widget - Orbe Reactivo a Voz */}
      <AIPremiumWidget position="bottom-right" />

      {/* Command Menu - Cmd+K para búsqueda rápida */}
      <CommandMenu />

      {/* System Showcase - Demostración Completa Interactiva */}
      <SystemShowcase onComplete={() => {
        // Demo completada
      }} />
    </div>
  )
}
