'use client'

/**
 * CHRONOS 2026 - Dashboard Principal Ultra-Premium
 * El dashboard más avanzado con todas las tendencias 2026
 * 
 * Features:
 * - Hero Card gigante con parallax
 * - Bento Grid con KPIs
 * - Activity Feed real-time
 * - 3D Background inmersivo
 * - Animaciones premium
 * - AI Predictive Orb
 * - Mouse tracking orb
 * - FAB con physics
 */

import { memo, Suspense, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, Users, Package, DollarSign, 
  TrendingUp, Warehouse, FileText, Bot, 
} from 'lucide-react'

// Componentes Chronos 2026
import { 
  PageTransition, 
  StaggerContainer, 
  StaggerItem,
  CHRONOS_COLORS,
} from './index'
import HeroCard from './HeroCard'
import KPICard from './KPICard'
import GlassCard from './GlassCard'
import ActivityFeed from './ActivityFeed'
import FAB from './FAB'
import StatusIndicator from './StatusIndicator'

// Hooks de Firestore (del proyecto existente)
import { useFirestoreCRUD } from '@/app/hooks/useFirestoreCRUD'
import type { Venta, Cliente, OrdenCompra, Banco } from '@/app/types'

// Componentes 3D lazy loaded
const XRBackground = dynamic(() => import('./XRBackground'), { ssr: false })
const MouseLiquidOrb = dynamic(() => import('./MouseLiquidOrb'), { ssr: false })
const AIPredictiveOrb = dynamic(() => import('./AIPredictiveOrb'), { ssr: false })

// Loading skeleton
const LoadingSkeleton = memo(() => (
  <div className="animate-pulse">
    <div className="h-[280px] bg-white/5 rounded-3xl mb-8" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-[180px] bg-white/5 rounded-2xl" />
      ))}
    </div>
  </div>
))
LoadingSkeleton.displayName = 'LoadingSkeleton'

function Dashboard2026() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [aiState, setAiState] = useState<'idle' | 'thinking' | 'success'>('idle')
  
  // Cargar datos desde Firestore
  const { data: ventas = [], loading: loadingVentas } = useFirestoreCRUD<Venta>('ventas')
  const { data: clientes = [], loading: loadingClientes } = useFirestoreCRUD<Cliente>('clientes')
  const { data: ordenes = [], loading: loadingOrdenes } = useFirestoreCRUD<OrdenCompra>('ordenes_compra')
  const { data: bancos = [], loading: loadingBancos } = useFirestoreCRUD<Banco>('bancos')
  
  const isLoading = loadingVentas || loadingClientes || loadingOrdenes || loadingBancos
  
  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalVentas = ventas.reduce((acc, v) => acc + (v.precioTotalVenta || 0), 0)
    const totalClientes = clientes.length
    const totalOrdenes = ordenes.length
    const capitalTotal = bancos.reduce((acc, b) => acc + (b.capitalActual || 0), 0)
    
    // Calcular ventas del mes
    const now = new Date()
    const ventasMes = ventas.filter(v => {
      const fecha = v.fecha instanceof Date ? v.fecha : 
                    typeof v.fecha === 'string' ? new Date(v.fecha) :
                    'toDate' in v.fecha ? v.fecha.toDate() : new Date()
      return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear()
    })
    const totalVentasMes = ventasMes.reduce((acc, v) => acc + (v.precioTotalVenta || 0), 0)
    
    // Utilidad neta (simplificado)
    const utilidadNeta = bancos
      .filter(b => b.id === 'utilidades')
      .reduce((acc, b) => acc + (b.capitalActual || 0), 0)
    
    return {
      totalVentas,
      totalClientes,
      totalOrdenes,
      capitalTotal,
      totalVentasMes,
      utilidadNeta,
      ventasMesCount: ventasMes.length,
    }
  }, [ventas, clientes, ordenes, bancos])
  
  // Generar actividad reciente
  const activityItems = useMemo(() => {
    const items: Array<{
      id: string
      type: 'venta' | 'cliente' | 'orden' | 'banco'
      title: string
      description?: string
      timestamp: Date
      amount?: number
      status?: 'pending' | 'completed' | 'warning'
    }> = []
    
    // Últimas 5 ventas
    ventas.slice(0, 5).forEach(v => {
      items.push({
        id: `venta-${v.id}`,
        type: 'venta',
        title: `Nueva venta: ${v.cliente || 'Cliente'}`,
        description: `${v.cantidad || 1} unidades`,
        timestamp: v.fecha instanceof Date ? v.fecha : 
                   typeof v.fecha === 'string' ? new Date(v.fecha) :
                   'toDate' in v.fecha ? v.fecha.toDate() : new Date(),
        amount: v.precioTotalVenta,
        status: v.estadoPago === 'completo' ? 'completed' : 'pending',
      })
    })
    
    // Últimos 3 clientes
    clientes.slice(0, 3).forEach(c => {
      items.push({
        id: `cliente-${c.id}`,
        type: 'cliente',
        title: `Nuevo cliente: ${c.nombre || 'Sin nombre'}`,
        description: c.direccion || 'Sin dirección',
        timestamp: c.createdAt instanceof Date ? c.createdAt : 
                   typeof c.createdAt === 'string' ? new Date(c.createdAt) :
                   c.createdAt && 'toDate' in c.createdAt ? c.createdAt.toDate() : new Date(),
      })
    })
    
    // Ordenar por fecha
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8)
  }, [ventas, clientes])
  
  // Formatear números
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }
  
  // Simular AI thinking al abrir sheet
  const handleFABClick = () => {
    setAiState('thinking')
    setIsSheetOpen(!isSheetOpen)
    
    if (!isSheetOpen) {
      setTimeout(() => setAiState('success'), 1500)
      setTimeout(() => setAiState('idle'), 3000)
    } else {
      setAiState('idle')
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <LoadingSkeleton />
      </div>
    )
  }
  
  return (
    <>
      {/* 3D Background */}
      <Suspense fallback={null}>
        <XRBackground />
      </Suspense>
      
      {/* Mouse tracking orb */}
      <Suspense fallback={null}>
        <MouseLiquidOrb />
      </Suspense>
      
      {/* AI Predictive Orb */}
      <Suspense fallback={null}>
        <AIPredictiveOrb state={aiState} />
      </Suspense>
      
      {/* Main content */}
      <PageTransition>
        <div className="relative z-10 min-h-screen p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          
          {/* Header with status */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-4">
              <h1 
                className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: CHRONOS_COLORS.gradientPrimary }}
              >
                CHRONOS 2026
              </h1>
              <StatusIndicator status="online" />
            </div>
          </motion.div>
          
          {/* Hero Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <HeroCard
              title="Capital Total"
              value={formatCurrency(stats.capitalTotal)}
              change={stats.ventasMesCount > 0 ? `+${stats.ventasMesCount} ventas este mes` : 'Sin actividad'}
              trend="up"
              subtitle="El sistema más avanzado del planeta"
            />
          </motion.div>
          
          {/* KPI Grid */}
          <StaggerContainer delay={0.2} stagger={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <StaggerItem>
                <KPICard
                  title="Ventas Totales"
                  value={formatCurrency(stats.totalVentas)}
                  change="+12.5%"
                  trend="up"
                  icon={<ShoppingCart className="w-full h-full" />}
                />
              </StaggerItem>
              
              <StaggerItem>
                <KPICard
                  title="Clientes"
                  value={stats.totalClientes.toString()}
                  change="+8.3%"
                  trend="up"
                  icon={<Users className="w-full h-full" />}
                />
              </StaggerItem>
              
              <StaggerItem>
                <KPICard
                  title="Órdenes Activas"
                  value={stats.totalOrdenes.toString()}
                  change={stats.totalOrdenes > 10 ? '+15%' : '-3%'}
                  trend={stats.totalOrdenes > 10 ? 'up' : 'down'}
                  icon={<Package className="w-full h-full" />}
                />
              </StaggerItem>
              
              <StaggerItem>
                <KPICard
                  title="Utilidad Neta"
                  value={formatCurrency(stats.utilidadNeta)}
                  change="+23.4%"
                  trend="up"
                  icon={<DollarSign className="w-full h-full" />}
                />
              </StaggerItem>
            </div>
          </StaggerContainer>
          
          {/* Secondary Grid */}
          <StaggerContainer delay={0.4} stagger={0.1}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Activity Feed */}
              <StaggerItem>
                <div className="lg:col-span-2">
                  <ActivityFeed 
                    items={activityItems}
                    title="Actividad Reciente"
                    maxItems={6}
                  />
                </div>
              </StaggerItem>
              
              {/* Quick Stats */}
              <StaggerItem>
                <GlassCard className="h-full">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Resumen del Mes
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Ventas del mes</span>
                      <span className="font-bold text-white">
                        {formatCurrency(stats.totalVentasMes)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Transacciones</span>
                      <span className="font-bold text-white">
                        {stats.ventasMesCount}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Ticket promedio</span>
                      <span className="font-bold text-white">
                        {stats.ventasMesCount > 0 
                          ? formatCurrency(stats.totalVentasMes / stats.ventasMesCount)
                          : '$0'
                        }
                      </span>
                    </div>
                    
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-medium">
                          +23.4% vs mes anterior
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </StaggerItem>
            </div>
          </StaggerContainer>
          
          {/* Footer text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center py-12 mt-8"
          >
            <p 
              className="text-xl md:text-2xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: CHRONOS_COLORS.gradientPrimary }}
            >
              El futuro de la gestión empresarial ya está aquí
            </p>
          </motion.div>
        </div>
      </PageTransition>
      
      {/* FAB */}
      <FAB 
        onClick={handleFABClick}
        isOpen={isSheetOpen}
      />
    </>
  )
}

export default memo(Dashboard2026)
