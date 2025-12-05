'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🎯 CHRONOS INFINITY - DASHBOARD SHOWCASE
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Página de demostración de todos los componentes INFINITY
 * Muestra el sistema de diseño premium con integración 3D
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { motion } from 'framer-motion'
import { 
  DollarSign, Package, Users, Activity,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  Sparkles, Zap, Shield, Clock
} from 'lucide-react'

// Componentes 3D
import CosmicFluidBackground from '@/app/components/3d/CosmicFluidBackground'
import InfinityOrb from '@/app/components/3d/InfinityOrb'

// Componentes UI
import GlassCard3D, { HeroGlassCard } from '@/app/components/chronos-infinity/GlassCard3D'
import MagneticButton, { 
  PrimaryButton, 
  SecondaryButton, 
  GoldButton,
  GhostButton 
} from '@/app/components/chronos-infinity/MagneticButton'
import InfinityAIWidget from '@/app/components/chronos-infinity/InfinityAIWidget'

// Animaciones
import { staggerContainer, staggerItem } from '@/app/components/chronos-infinity/motion-variants'

// Design System
import { INFINITY_COLORS, INFINITY_GRADIENTS } from '@/app/lib/constants/infinity-design-system'

// ════════════════════════════════════════════════════════════════════════════════════════
// TIPOS LOCALES
// ════════════════════════════════════════════════════════════════════════════════════════
interface KPIData {
  id: string
  title: string
  value: string
  change: number
  trend: 'up' | 'down'
  icon: typeof DollarSign
}

interface MetricData {
  label: string
  value: string
  percentage: number
}

interface AlertData {
  id: string
  type: 'success' | 'warning' | 'info'
  title: string
  message: string
}

// ════════════════════════════════════════════════════════════════════════════════════════
// DATOS DE DEMO
// ════════════════════════════════════════════════════════════════════════════════════════
const DEMO_KPIS: KPIData[] = [
  { id: 'ventas', title: 'Ventas Totales', value: '$1,245,890', change: 12.5, trend: 'up', icon: DollarSign },
  { id: 'ordenes', title: 'Órdenes Activas', value: '342', change: -3.2, trend: 'down', icon: Package },
  { id: 'clientes', title: 'Clientes Nuevos', value: '1,847', change: 28.4, trend: 'up', icon: Users },
  { id: 'utilidades', title: 'Utilidades', value: '$384,250', change: 15.8, trend: 'up', icon: Activity },
]

const DEMO_METRICS: MetricData[] = [
  { label: 'Bóveda Monte', value: '$523,400', percentage: 42 },
  { label: 'Bóveda USA', value: '$287,650', percentage: 23 },
  { label: 'Profit Pool', value: '$198,340', percentage: 16 },
  { label: 'Leftie Bank', value: '$142,800', percentage: 12 },
  { label: 'Azteca', value: '$93,700', percentage: 7 },
]

const DEMO_ALERTS: AlertData[] = [
  { id: '1', type: 'success', title: 'Meta alcanzada', message: 'Las ventas del mes superaron el objetivo en 15%' },
  { id: '2', type: 'warning', title: 'Inventario bajo', message: '5 productos con stock crítico' },
  { id: '3', type: 'info', title: 'Actualización', message: 'Nueva versión del sistema disponible' },
]

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTES LOCALES
// ════════════════════════════════════════════════════════════════════════════════════════
function KPICard({ kpi, delay = 0 }: { kpi: KPIData; delay?: number }) {
  const Icon = kpi.icon
  const isPositive = kpi.trend === 'up'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <GlassCard3D glowColor={isPositive ? 'gold' : 'pink'}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ 
                background: INFINITY_GRADIENTS.primary,
                boxShadow: `0 4px 15px ${INFINITY_COLORS.violetGlow}`,
              }}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(kpi.change)}%
            </div>
          </div>
          <p className="text-sm text-white/60 mb-1">{kpi.title}</p>
          <p className="text-2xl font-bold text-white">{kpi.value}</p>
        </div>
      </GlassCard3D>
    </motion.div>
  )
}

function AlertCard({ alert, delay = 0 }: { alert: AlertData; delay?: number }) {
  const colors = { success: INFINITY_COLORS.success, warning: INFINITY_COLORS.warning, info: INFINITY_COLORS.info }
  return (
    <motion.div
      className="p-4 rounded-xl border"
      style={{ background: INFINITY_COLORS.glassBg, borderColor: `${colors[alert.type]}33` }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <div className="flex items-start gap-3">
        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: colors[alert.type] }} />
        <div>
          <p className="text-sm font-medium text-white">{alert.title}</p>
          <p className="text-xs text-white/60">{alert.message}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════════════
export default function InfinityShowcasePage() {
  const [orbState, setOrbState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle')
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background 3D */}
      <div className="fixed inset-0 z-0">
        <CosmicFluidBackground energy={0.5} />
      </div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header 
          className="border-b backdrop-blur-xl"
          style={{ borderColor: INFINITY_COLORS.glassBorder, background: INFINITY_COLORS.glassBg }}
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <motion.div className="flex items-center gap-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Canvas camera={{ position: [0, 0, 3] }}>
                    <Suspense fallback={null}>
                      <ambientLight intensity={0.5} />
                      <InfinityOrb state="idle" scale={0.3} />
                    </Suspense>
                  </Canvas>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: INFINITY_GRADIENTS.textShine }}>
                    CHRONOS INFINITY
                  </h1>
                  <p className="text-xs text-white/50">Sistema Empresarial Premium 2026</p>
                </div>
              </motion.div>
              
              <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <GhostButton size="sm"><Shield className="w-4 h-4 mr-2" />Seguridad</GhostButton>
                <SecondaryButton size="sm"><Clock className="w-4 h-4 mr-2" />Historial</SecondaryButton>
                <GoldButton size="sm"><Sparkles className="w-4 h-4 mr-2" />Premium</GoldButton>
              </motion.div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Hero Section */}
          <motion.section className="mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <HeroGlassCard className="p-8">
              <div className="flex items-center justify-between">
                <div className="max-w-lg">
                  <motion.h2 
                    className="text-4xl font-bold mb-4 bg-clip-text text-transparent"
                    style={{ backgroundImage: INFINITY_GRADIENTS.textShine }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Bienvenido al Sistema INFINITY
                  </motion.h2>
                  <motion.p className="text-white/70 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    Dashboard empresarial de próxima generación con visualizaciones 3D, inteligencia artificial integrada y diseño premium.
                  </motion.p>
                  <motion.div className="flex gap-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <PrimaryButton size="lg"><Zap className="w-5 h-5 mr-2" />Comenzar</PrimaryButton>
                    <SecondaryButton size="lg">Ver Demo</SecondaryButton>
                  </motion.div>
                </div>
                
                <div className="w-64 h-64">
                  <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
                    <Suspense fallback={null}>
                      <ambientLight intensity={0.3} />
                      <pointLight position={[5, 5, 5]} intensity={0.5} color="#8B00FF" />
                      <InfinityOrb state={orbState} showRings glowIntensity={1.5} />
                    </Suspense>
                  </Canvas>
                </div>
              </div>
            </HeroGlassCard>
          </motion.section>
          
          {/* KPIs Grid */}
          <motion.section className="mb-12" variants={staggerContainer} initial="hidden" animate="visible">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" style={{ color: INFINITY_COLORS.violet }} />
              Indicadores Clave
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {DEMO_KPIS.map((kpi, i) => <KPICard key={kpi.id} kpi={kpi} delay={i * 0.1} />)}
            </div>
          </motion.section>
          
          {/* Metrics & Alerts */}
          <motion.section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12" variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={staggerItem} className="lg:col-span-2">
              <GlassCard3D className="h-full">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <PieChart className="w-5 h-5" style={{ color: INFINITY_COLORS.gold }} />
                    Distribución de Capital
                  </h3>
                  <div className="space-y-4">
                    {DEMO_METRICS.map((m, i) => (
                      <motion.div key={m.label} className="flex items-center gap-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 + 0.5 }}>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-white/70">{m.label}</span>
                            <span className="text-sm font-medium text-white">{m.value}</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: INFINITY_COLORS.glassBgHover }}>
                            <motion.div className="h-full rounded-full" style={{ background: INFINITY_GRADIENTS.primary }} initial={{ width: 0 }} animate={{ width: `${m.percentage}%` }} transition={{ duration: 1, delay: i * 0.1 + 0.7 }} />
                          </div>
                        </div>
                        <span className="text-sm font-bold" style={{ color: INFINITY_COLORS.violet }}>{m.percentage}%</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </GlassCard3D>
            </motion.div>
            
            <motion.div variants={staggerItem}>
              <GlassCard3D className="h-full">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5" style={{ color: INFINITY_COLORS.pink }} />
                    Alertas Recientes
                  </h3>
                  <div className="space-y-4">
                    {DEMO_ALERTS.map((a, i) => <AlertCard key={a.id} alert={a} delay={i * 0.15 + 0.6} />)}
                  </div>
                </div>
              </GlassCard3D>
            </motion.div>
          </motion.section>
          
          {/* Buttons Showcase */}
          <motion.section className="mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <GlassCard3D>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" style={{ color: INFINITY_COLORS.gold }} />
                  Componentes Interactivos
                </h3>
                <div className="flex flex-wrap gap-4">
                  <PrimaryButton><Zap className="w-4 h-4 mr-2" />Primario</PrimaryButton>
                  <SecondaryButton>Secundario</SecondaryButton>
                  <GoldButton><Sparkles className="w-4 h-4 mr-2" />Premium</GoldButton>
                  <GhostButton>Ghost</GhostButton>
                  <MagneticButton variant="primary" isLoading>Cargando...</MagneticButton>
                </div>
                <div className="mt-6 flex gap-4">
                  {(['idle', 'listening', 'thinking', 'speaking'] as const).map((s) => (
                    <button key={s} onClick={() => setOrbState(s)} className="px-3 py-1 text-sm rounded-lg capitalize" style={{ background: orbState === s ? INFINITY_COLORS.violet : INFINITY_COLORS.glassBgHover, color: 'white' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard3D>
          </motion.section>
        </main>
      </div>
      
      <InfinityAIWidget />
    </div>
  )
}
