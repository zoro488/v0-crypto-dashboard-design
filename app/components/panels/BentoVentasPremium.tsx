'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, Plus, DollarSign, Users, Package, CheckCircle2, Clock, 
  ArrowUpRight, ArrowDownRight, Sparkles, Target, Zap, BarChart3, 
  PieChart as PieChartIcon, Eye, Edit, Trash2, CreditCard, Wallet,
  ShoppingBag, Receipt, Calendar, Search, Filter, X,
} from 'lucide-react'
// ═══════════════════════════════════════════════════════════════════════════
// 🔴 TESLA 2025 DESIGN SYSTEM - Componentes Premium
// ═══════════════════════════════════════════════════════════════════════════
import { 
  ButtonTesla,
  ButtonUltra,
  CardTesla, 
  StatCard as StatCardTesla,
  ModalTesla, 
  Badge as BadgeTesla,
  SkeletonDashboard,
  DESIGN_TOKENS,
  formatCurrency,
} from '@/app/components/ui/tesla-index'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { 
  AnimatedCounter, 
  GlowButton, 
  Tilt3D, 
  SkeletonTable, 
  Pulse, 
  ShineEffect,
  haptic,
} from '@/app/components/ui/microinteractions'
import { useState, useMemo, useCallback, memo, useEffect } from 'react'
import { useLocalVentas, useLocalClientes, useLocalOrdenesCompra, useLocalKPIs, useInitializeData } from '@/app/lib/store/useDataStore'
import { CreateVentaModalPremium } from '@/app/components/modals/CreateVentaModalPremium'
import { SalesFlowDiagram } from '@/app/components/visualizations/SalesFlowDiagram'
import { PremiumDataTable, Column, TableAction } from '@/app/components/ui/PremiumDataTable'
import { QuickStatWidget } from '@/app/components/widgets/QuickStatWidget'
import { MiniChartWidget } from '@/app/components/widgets/MiniChartWidget'
import { ActivityFeedWidget, ActivityItem } from '@/app/components/widgets/ActivityFeedWidget'
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { SafeChartContainer, SAFE_ANIMATION_PROPS, SAFE_PIE_PROPS } from '@/app/components/ui/SafeChartContainer'
import { logger } from '@/app/lib/utils/logger'

// ═══════════════════════════════════════════════════════════════════════════
// 🌑 OBSIDIAN GLASS PREMIUM COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
import SalesCockpit from '@/app/components/premium/sales/SalesCockpit'
import ObsidianDistributionSlider from '@/app/components/premium/sales/ObsidianDistributionSlider'
import HolographicProductSearch from '@/app/components/premium/sales/HolographicProductSearch'

// ============================================================================
// INTERFACES
// ============================================================================
interface VentaData {
  id: string
  precioTotalVenta?: number
  montoPagado?: number
  montoRestante?: number
  estadoPago?: 'completo' | 'parcial' | 'pendiente'
  cliente?: string
  clienteId?: string
  fecha?: string
  producto?: string
  cantidad?: number
  precioVentaUnidad?: number
  distribuidor?: string
  [key: string]: unknown
}

interface VentaProfileModalProps {
  venta: VentaData | null
  isOpen: boolean
  onClose: () => void
}

// ============================================================================
// COMPONENTE: Modal de Perfil de Venta
// ============================================================================
const VentaProfileModal = memo(function VentaProfileModal({ 
  venta, isOpen, onClose, 
}: VentaProfileModalProps) {
  const [activeTab, setActiveTab] = useState('detalles')

  if (!venta) return null

  const estadoConfig = {
    completo: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2, label: 'Completo' },
    parcial: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock, label: 'Parcial' },
    pendiente: { color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: Clock, label: 'Pendiente' },
  }

  const estado = venta.estadoPago || 'pendiente'
  const config = estadoConfig[estado] || estadoConfig.pendiente
  const porcentajePago = venta.precioTotalVenta ? 
    Math.round((venta.montoPagado || 0) / venta.precioTotalVenta * 100) : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800/50 text-white p-0 overflow-hidden">
        {/* Header con gradiente */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-transparent">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="relative flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold">{venta.id}</h2>
                <BadgeTesla variant={estado === 'completo' ? 'success' : estado === 'parcial' ? 'warning' : 'error'}>
                  {React.createElement(config.icon, { className: 'w-3 h-3 mr-1' })}
                  {config.label}
                </BadgeTesla>
              </div>
              <p className="text-white/60">Cliente: {venta.cliente || 'Sin asignar'}</p>
              <p className="text-white/40 text-sm mt-1">{venta.fecha || 'Sin fecha'}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-400">
                ${(venta.precioTotalVenta || 0).toLocaleString()}
              </p>
              <p className="text-sm text-white/60">Valor total de venta</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-zinc-800/50">
          <div className="flex gap-4">
            {[
              { id: 'detalles', label: 'Detalles', icon: Receipt },
              { id: 'pagos', label: 'Pagos', icon: CreditCard },
              { id: 'distribucion', label: 'Distribución', icon: PieChartIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'text-green-400 border-green-400'
                    : 'text-white/60 border-transparent hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {activeTab === 'detalles' && (
            <div className="grid grid-cols-2 gap-6">
              {/* Info de Venta */}
              <div className="space-y-4">
                <h4 className="font-semibold text-white/80 flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-400" />
                  Información de Venta
                </h4>
                <div className="space-y-3 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
                  <InfoRow label="ID Venta" value={venta.id} />
                  <InfoRow label="Producto" value={venta.producto || 'Producto estándar'} />
                  <InfoRow label="Cantidad" value={`${venta.cantidad || 0} unidades`} />
                  <InfoRow 
                    label="Precio Unitario" 
                    value={`$${(venta.precioVentaUnidad || 0).toLocaleString()}`} 
                  />
                  <InfoRow label="Distribuidor" value={venta.distribuidor || 'Sin asignar'} />
                </div>
              </div>

              {/* Info de Cliente */}
              <div className="space-y-4">
                <h4 className="font-semibold text-white/80 flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Cliente
                </h4>
                <div className="space-y-3 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
                  <InfoRow label="Cliente" value={venta.cliente || 'Sin asignar'} />
                  <InfoRow label="ID Cliente" value={venta.clienteId || '-'} />
                  <InfoRow label="Fecha Venta" value={venta.fecha || '-'} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pagos' && (
            <div className="space-y-6">
              {/* Barra de progreso de pago */}
              <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800/50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-white">Estado de Pago</h4>
                  <span className="text-2xl font-bold text-green-400">{porcentajePago}%</span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${porcentajePago}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full ${
                      porcentajePago >= 100 
                        ? 'bg-gradient-to-r from-emerald-500 to-green-400' 
                        : porcentajePago > 0 
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          : 'bg-gradient-to-r from-rose-500 to-red-400'
                    }`}
                  />
                </div>
              </div>

              {/* Detalles de pago */}
              <div className="grid grid-cols-3 gap-4">
                <StatCard
                  label="Total Venta"
                  value={`$${(venta.precioTotalVenta || 0).toLocaleString()}`}
                  icon={DollarSign}
                  color="cyan"
                />
                <StatCard
                  label="Monto Pagado"
                  value={`$${(venta.montoPagado || 0).toLocaleString()}`}
                  icon={CheckCircle2}
                  color="green"
                />
                <StatCard
                  label="Monto Restante"
                  value={`$${(venta.montoRestante || 0).toLocaleString()}`}
                  icon={Clock}
                  color={venta.montoRestante && venta.montoRestante > 0 ? 'amber' : 'green'}
                />
              </div>
            </div>
          )}

          {activeTab === 'distribucion' && (
            <div className="space-y-6">
              <p className="text-white/60 text-sm">
                Distribución automática de fondos según la lógica del sistema CHRONOS.
              </p>
              
              {/* Explicación de distribución */}
              <div className="space-y-3">
                {[
                  { 
                    label: 'Bóveda Monte (Costo)', 
                    value: (venta.cantidad || 0) * 6300, 
                    color: 'from-blue-500 to-cyan-500',
                    desc: 'Precio compra × cantidad',
                  },
                  { 
                    label: 'Flete Sur', 
                    value: (venta.cantidad || 0) * 500, 
                    color: 'from-orange-500 to-amber-500',
                    desc: 'Flete × cantidad',
                  },
                  { 
                    label: 'Utilidades (Ganancia)', 
                    value: ((venta.precioVentaUnidad || 10000) - 6300 - 500) * (venta.cantidad || 0), 
                    color: 'from-green-500 to-emerald-500',
                    desc: '(Precio venta - costo - flete) × cantidad',
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/80">{item.label}</span>
                      <span className="text-lg font-bold text-white">${item.value.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-white/40">{item.desc}</p>
                    <div className="h-2 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${item.color}`} style={{ width: '100%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
})

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center">
    <span className="text-white/50 text-sm">{label}</span>
    <span className="text-white font-medium">{value}</span>
  </div>
)

const StatCard = ({ 
  label, value, icon: Icon, color, 
}: { 
  label: string; value: string; icon: React.ElementType; color: 'cyan' | 'green' | 'amber' | 'red' 
}) => {
  type ColorKey = 'cyan' | 'green' | 'amber' | 'red'
  const colorMap: Record<ColorKey, string> = {
    cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    amber: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
    red: 'from-rose-500/20 to-red-500/20 border-rose-500/30',
  }
  const iconColorMap: Record<ColorKey, string> = {
    cyan: 'text-cyan-400',
    green: 'text-green-400',
    amber: 'text-amber-400',
    red: 'text-rose-400',
  }
  
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} rounded-xl p-4 border`}>
      <div className="flex items-center gap-2 mb-2">
        {React.createElement(Icon, { className: `w-4 h-4 ${iconColorMap[color]}` })}
        <span className="text-white/60 text-sm">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default memo(function BentoVentasPremium() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCockpitOpen, setIsCockpitOpen] = useState(false)
  const [selectedVenta, setSelectedVenta] = useState<VentaData | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month'>('week')

  // ═══════════════════════════════════════════════════════════════════════════
  // USAR STORE LOCAL EN LUGAR DE FIREBASE
  // ═══════════════════════════════════════════════════════════════════════════
  const { data: ventasDataRaw, loading, isConnected } = useLocalVentas()
  const { data: clientes } = useLocalClientes()
  const { data: ordenesCompra, ordenesConStock } = useLocalOrdenesCompra()
  const { initialized, inicializarDatosPrueba } = useInitializeData()
  const ventasData = ventasDataRaw as unknown as VentaData[]
  
  // Inicializar datos de prueba si no hay datos
  // DESACTIVADO - Usuario quiere sistema limpio
  // useEffect(() => {
  //   if (!initialized && ventasData.length === 0 && clientes.length === 0) {
  //     logger.info('[BentoVentasPremium] Inicializando datos de prueba', { context: 'BentoVentasPremium' })
  //     inicializarDatosPrueba()
  //   }
  // }, [initialized, ventasData.length, clientes.length, inicializarDatosPrueba])
  
  // Log para verificar conexión
  useEffect(() => {
    if (isConnected) {
      logger.info(`[BentoVentasPremium] Store local conectado: ${ventasData.length} ventas`, { context: 'BentoVentasPremium' })
    }
  }, [ventasData.length, isConnected])

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTRICAS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const metrics = useMemo(() => {
    const totalVentas = ventasData.reduce((acc, v) => acc + (v.precioTotalVenta || 0), 0)
    const totalCobrado = ventasData.reduce((acc, v) => acc + (v.montoPagado || 0), 0)
    const totalPendiente = ventasData.reduce((acc, v) => acc + (v.montoRestante || 0), 0)
    const ventasPendientes = ventasData.filter((v) => v.estadoPago === 'pendiente').length
    const ventasCompletas = ventasData.filter((v) => v.estadoPago === 'completo').length
    const ventasParciales = ventasData.filter((v) => v.estadoPago === 'parcial').length
    const promedioVenta = ventasData.length > 0 ? totalVentas / ventasData.length : 0
    const tasaCobro = totalVentas > 0 ? (totalCobrado / totalVentas) * 100 : 0
    
    return {
      totalVentas,
      totalCobrado,
      totalPendiente,
      ventasPendientes,
      ventasCompletas,
      ventasParciales,
      promedioVenta,
      tasaCobro,
    }
  }, [ventasData])

  // Datos para gráficos - DATOS REALES agrupados por día de la semana
  const chartData = useMemo(() => {
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
    const datosPorDia = diasSemana.map(dia => ({ name: dia, ventas: 0, cobrado: 0 }))
    
    ventasData.forEach(venta => {
      if (venta.fecha) {
        let fecha: Date
        if (typeof venta.fecha === 'string') {
          fecha = new Date(venta.fecha)
        } else if (typeof venta.fecha === 'object' && venta.fecha !== null) {
          // Podría ser Firestore Timestamp o Date
          const f = venta.fecha as unknown
          if (f && typeof f === 'object' && 'seconds' in (f as Record<string, unknown>)) {
            fecha = new Date((f as { seconds: number }).seconds * 1000)
          } else {
            fecha = new Date()
          }
        } else {
          fecha = new Date()
        }
        const diaSemana = fecha.getDay()
        datosPorDia[diaSemana].ventas += venta.precioTotalVenta || 0
        datosPorDia[diaSemana].cobrado += venta.montoPagado || 0
      }
    })
    
    // Reordenar para empezar en Lunes
    return [...datosPorDia.slice(1), datosPorDia[0]]
  }, [ventasData])

  const pieData = useMemo(() => [
    { name: 'Completas', value: metrics.ventasCompletas, color: '#22c55e' },
    { name: 'Parciales', value: metrics.ventasParciales, color: '#eab308' },
    { name: 'Pendientes', value: metrics.ventasPendientes, color: '#ef4444' },
  ], [metrics.ventasCompletas, metrics.ventasParciales, metrics.ventasPendientes])

  // Activity feed
  const recentActivity: ActivityItem[] = useMemo(() => {
    return ventasData.slice(0, 5).map((venta, i) => ({
      id: venta.id || `venta-${i}`,
      type: venta.estadoPago === 'completo' ? 'pago' : 'venta',
      title: `Venta ${venta.id}`,
      description: `${venta.cliente || 'Cliente'} - $${(venta.precioTotalVenta || 0).toLocaleString()}`,
      timestamp: venta.fecha ? new Date(venta.fecha) : new Date(),
      status: venta.estadoPago === 'completo' ? 'success' : venta.estadoPago === 'parcial' ? 'pending' : 'pending',
    }))
  }, [ventasData])

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE TABLA PREMIUM
  // ═══════════════════════════════════════════════════════════════════════════
  
  const columns: Column<VentaData>[] = useMemo(() => [
    { 
      key: 'id', 
      header: 'ID Venta', 
      sortable: true,
      type: 'badge',
      width: '120px',
    },
    { 
      key: 'fecha', 
      header: 'Fecha', 
      sortable: true,
      type: 'date',
      width: '120px',
    },
    { 
      key: 'cliente', 
      header: 'Cliente', 
      sortable: true,
      type: 'avatar',
      width: '180px',
    },
    { 
      key: 'cantidad', 
      header: 'Cantidad', 
      sortable: true,
      type: 'number',
      width: '100px',
    },
    { 
      key: 'precioTotalVenta', 
      header: 'Total', 
      sortable: true,
      type: 'currency',
      width: '140px',
    },
    { 
      key: 'montoPagado', 
      header: 'Pagado', 
      sortable: true,
      type: 'currency',
      width: '140px',
    },
    { 
      key: 'montoRestante', 
      header: 'Pendiente', 
      sortable: true,
      type: 'currency',
      width: '140px',
    },
    { 
      key: 'estadoPago', 
      header: 'Estado', 
      sortable: true,
      type: 'status',
      width: '120px',
    },
  ], [])

  const tableActions: TableAction<VentaData>[] = useMemo(() => [
    {
      id: 'view',
      label: 'Ver Detalles',
      icon: Eye,
      onClick: (venta) => {
        setSelectedVenta(venta)
        setIsProfileOpen(true)
        logger.info('Ver venta', { context: 'BentoVentasPremium', data: { ventaId: venta.id } })
      },
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: Edit,
      onClick: (venta) => {
        logger.info('Editar venta', { context: 'BentoVentasPremium', data: { ventaId: venta.id } })
      },
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      variant: 'danger',
      onClick: (venta) => {
        logger.info('Eliminar venta', { context: 'BentoVentasPremium', data: { ventaId: venta.id } })
      },
    },
  ], [])

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <SkeletonDashboard />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6 space-y-6">
      {/* Banner de estado de datos */}
      {!initialized && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4"
        >
          <p className="text-violet-400 text-sm">💾 Sistema funcionando con almacenamiento local (sin Firebase)</p>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl" />
            <TrendingUp className="w-12 h-12 text-green-400 relative" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Ventas Premium
            </h1>
            <p className="text-zinc-400 text-sm">Gestión avanzada de ventas y cobros</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Botón Cockpit Premium */}
          <ButtonUltra
            variant="glass"
            size="md"
            icon={Sparkles}
            glow
            onClick={() => setIsCockpitOpen(true)}
          >
            Cockpit
          </ButtonUltra>
          <ButtonUltra
            variant="success"
            size="md"
            icon={Plus}
            glow
            pulse
            onClick={() => setIsModalOpen(true)}
          >
            Nueva Venta
          </ButtonUltra>
        </div>
      </motion.div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <QuickStatWidget
          title="Total Ventas"
          value={ventasData.length}
          change={12.5}
          icon={Package}
          color="green"
          sparklineData={chartData.map(d => d.ventas / 10000)}
          delay={0.1}
        />
        <QuickStatWidget
          title="Valor Total"
          value={metrics.totalVentas}
          prefix="$"
          change={18.3}
          icon={DollarSign}
          color="cyan"
          sparklineData={chartData.map(d => d.ventas)}
          delay={0.2}
        />
        <QuickStatWidget
          title="Cobrado"
          value={metrics.totalCobrado}
          prefix="$"
          change={15.2}
          icon={Wallet}
          color="green"
          sparklineData={chartData.map(d => d.cobrado)}
          delay={0.3}
        />
        <QuickStatWidget
          title="Por Cobrar"
          value={metrics.totalPendiente}
          prefix="$"
          change={-5.1}
          icon={Clock}
          color="orange"
          sparklineData={chartData.map(d => d.ventas - d.cobrado)}
          delay={0.4}
        />
        <QuickStatWidget
          title="Tasa de Cobro"
          value={metrics.tasaCobro}
          suffix="%"
          change={8.7}
          icon={Target}
          color="purple"
          sparklineData={[65, 70, 72, 75, 78, 82, metrics.tasaCobro]}
          delay={0.5}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Ventas vs Cobrado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-2xl blur-2xl" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-green-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-bold text-white">Rendimiento Semanal</h3>
                </div>
                <p className="text-sm text-zinc-400 mt-1">Ventas vs Cobrado</p>
              </div>
              <div className="flex gap-2">
                {(['day', 'week', 'month'] as const).map((range) => (
                  <ButtonUltra
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    variant={selectedTimeRange === range ? 'success' : 'ghost'}
                    size="xs"
                    glow={selectedTimeRange === range}
                  >
                    {range === 'day' ? 'Día' : range === 'week' ? 'Semana' : 'Mes'}
                  </ButtonUltra>
                ))}
              </div>
            </div>
            
            <div style={{ width: '100%', minWidth: 200, height: 280, minHeight: 200 }}>
              <SafeChartContainer height={280} minHeight={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVentasP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCobradoP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `$${(v/1000)}K`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.9)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVentasP)"
                    name="Ventas"
                    {...SAFE_ANIMATION_PROPS}
                  />
                  <Area
                    type="monotone"
                    dataKey="cobrado"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCobradoP)"
                    name="Cobrado"
                    {...SAFE_ANIMATION_PROPS}
                  />
                </AreaChart>
              </SafeChartContainer>
            </div>
          </div>
        </motion.div>
        
        {/* Distribución de Estados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 rounded-2xl blur-2xl" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 h-full">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Estado de Pagos</h3>
            </div>
            
            <div style={{ width: '100%', minWidth: 120, height: 200, minHeight: 150 }}>
              <SafeChartContainer height={200} minHeight={150}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    {...SAFE_PIE_PROPS}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </SafeChartContainer>
            </div>
            
            <div className="space-y-3 mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-zinc-400">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mini Charts y Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <MiniChartWidget
          title="Promedio por Venta"
          subtitle={`$${Math.round(metrics.promedioVenta / 1000)}K`}
          type="area"
          data={chartData.map(d => ({ name: d.name, value: d.ventas / 7 }))}
          color="cyan"
        />
        <MiniChartWidget
          title="Ventas Completas"
          subtitle={`${metrics.ventasCompletas} ventas`}
          type="donut"
          data={pieData}
          color="green"
        />
        <MiniChartWidget
          title="Meta Mensual"
          subtitle="78% alcanzado"
          type="bar"
          data={chartData.slice(0, 5).map(d => ({ name: d.name, value: d.ventas / 5000 }))}
          color="purple"
        />
        <ActivityFeedWidget
          title="Actividad Reciente"
          activities={recentActivity}
          maxItems={3}
        />
      </div>

      {/* Tabla Premium de Ventas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <PremiumDataTable
          data={ventasData}
          columns={columns}
          actions={tableActions}
          title="Registro de Ventas"
          subtitle={`${ventasData.length} ventas registradas`}
          color="green"
          searchPlaceholder="Buscar venta, cliente..."
          onRowClick={(venta) => {
            setSelectedVenta(venta)
            setIsProfileOpen(true)
          }}
          emptyMessage="No hay ventas registradas"
        />
      </motion.div>

      {/* Sales Flow Diagram */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl blur-2xl" />
        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white">Flujo de Ventas</h3>
            <p className="text-sm text-zinc-400">Visualización de procesos de ventas en tiempo real</p>
          </div>
          <SalesFlowDiagram width={900} height={500} className="w-full" />
        </div>
      </motion.div>

      {/* Modales */}
      <CreateVentaModalPremium open={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Sales Cockpit Premium Modal */}
      <SalesCockpit
        isOpen={isCockpitOpen}
        onClose={() => setIsCockpitOpen(false)}
        onConfirm={async (saleData) => {
          logger.info('Venta creada desde Cockpit', { context: 'BentoVentasPremium', data: saleData })
          setIsCockpitOpen(false)
        }}
        products={[]}
        clients={[]}
      />
      
      <VentaProfileModal
        venta={selectedVenta}
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false)
          setSelectedVenta(null)
        }}
      />
    </div>
  )
})
