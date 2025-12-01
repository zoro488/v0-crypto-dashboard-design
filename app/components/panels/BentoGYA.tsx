'use client'

/**
 * 💰 PANEL GYA (GASTOS Y ABONOS) - CHRONOS SYSTEM
 * 
 * Panel centralizado para gestionar:
 * - Gastos: Egresos de cualquiera de los 7 bancos
 * - Abonos: Pagos parciales y totales de clientes/distribuidores
 * 
 * Características:
 * - Tabla interactiva con filtros y búsqueda
 * - Tabs por banco
 * - KPIs de gastos vs abonos
 * - Gráficos de tendencias
 * - Modales premium para crear gastos/abonos
 */

import { memo, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Plus,
  Search,
  Download,
  Calendar,
  Building2,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  Edit2,
  Trash2,
  Eye,
  DollarSign,
  RefreshCw,
  Banknote,
  User,
  Store,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/app/components/ui/dropdown-menu'
import { useGYAData } from '@/app/lib/firebase/firestore-hooks.service'
import { CreateGastoModalPremium } from '@/app/components/modals/CreateGastoModalPremium'
import { CreateAbonoModalPremium } from '@/app/components/modals/CreateAbonoModalPremium'
import { useToast } from '@/app/hooks/use-toast'
import { BANCOS } from '@/app/lib/constants'
import { cn } from '@/app/lib/utils'
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

// ============================================
// TIPOS
// ============================================

interface GastoAbonoRecord {
  id: string
  tipo: 'gasto' | 'abono'
  fecha: string | { seconds: number }
  monto: number
  origen?: string
  destino?: string
  bancoId?: string
  concepto?: string
  observaciones?: string
  cliente?: string
  distribuidor?: string
  tc?: number
  pesos?: number
  metodoPago?: string
  referencia?: string
  tipoMovimiento?: string
}

interface TooltipPayload {
  value: number
  name: string
  color: string
  dataKey?: string
}

// ============================================
// CONSTANTES
// ============================================

const TIPOS_FILTRO = [
  { id: 'todos', label: 'Todos', icon: Wallet },
  { id: 'gastos', label: 'Gastos', icon: TrendingDown },
  { id: 'abonos', label: 'Abonos', icon: TrendingUp },
]

const BANCOS_FILTRO = [
  { id: 'todos', nombre: 'Todos los Bancos', icono: '🏛️', color: 'gray' },
  ...BANCOS.map(b => ({ 
    id: b.id, 
    nombre: b.nombre, 
    icono: b.icon === 'building' ? '🏦' : 
           b.icon === 'flag' ? '🇺🇸' : 
           b.icon === 'diamond' ? '💎' :
           b.icon === 'truck' ? '🚚' :
           b.icon === 'store' ? '🏪' :
           b.icon === 'briefcase' ? '💼' : '💰',
    color: b.color.split(' ')[0].replace('from-', ''),
  })),
]

// ============================================
// UTILIDADES
// ============================================

const formatearMonto = (monto: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto)
}

const formatDate = (date: string | { seconds: number } | undefined): string => {
  if (!date) return '-'
  try {
    if (typeof date === 'object' && 'seconds' in date) {
      return new Date(date.seconds * 1000).toLocaleDateString('es-MX')
    }
    return new Date(date).toLocaleDateString('es-MX')
  } catch {
    return String(date)
  }
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function CustomTooltip({ active, payload, label }: { 
  active?: boolean
  payload?: TooltipPayload[]
  label?: string 
}) {
  if (!active || !payload) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl p-4 shadow-xl"
    >
      <p className="text-xs text-zinc-400 mb-3 font-medium">{label}</p>
      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-zinc-400">{entry.name}</span>
            </div>
            <span className="text-sm text-white font-mono font-medium">
              ${(entry.value / 1000).toFixed(1)}K
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default memo(function BentoGYA() {
  const { toast } = useToast()
  
  // Estados
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'gastos' | 'abonos'>('todos')
  const [bancoFiltro, setBancoFiltro] = useState('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month'>('month')
  
  // Modales
  const [showGastoModal, setShowGastoModal] = useState(false)
  const [showAbonoModal, setShowAbonoModal] = useState(false)

  // Datos de Firestore
  const { data: movimientosRaw, loading, error, refresh } = useGYAData()

  // Transformar datos
  const movimientos = useMemo(() => {
    return (movimientosRaw as GastoAbonoRecord[]).map(m => ({
      ...m,
      tipo: m.tipoMovimiento === 'gasto' || m.tipo === 'gasto' ? 'gasto' as const : 'abono' as const,
    }))
  }, [movimientosRaw])

  // Filtrar datos
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(m => {
      // Filtro por tipo
      if (tipoFiltro !== 'todos' && m.tipo !== tipoFiltro.slice(0, -1)) return false
      
      // Filtro por banco
      if (bancoFiltro !== 'todos' && m.bancoId !== bancoFiltro) return false
      
      // Filtro por búsqueda
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchConcepto = m.concepto?.toLowerCase().includes(query)
        const matchOrigen = m.origen?.toLowerCase().includes(query)
        const matchCliente = m.cliente?.toLowerCase().includes(query)
        if (!matchConcepto && !matchOrigen && !matchCliente) return false
      }
      
      return true
    })
  }, [movimientos, tipoFiltro, bancoFiltro, searchQuery])

  // Calcular métricas
  const metrics = useMemo(() => {
    const totalGastos = movimientos
      .filter(m => m.tipo === 'gasto')
      .reduce((sum, m) => sum + (m.monto || 0), 0)
    
    const totalAbonos = movimientos
      .filter(m => m.tipo === 'abono')
      .reduce((sum, m) => sum + (m.monto || 0), 0)
    
    const balance = totalAbonos - totalGastos
    
    const gastosHoy = movimientos
      .filter(m => {
        if (m.tipo !== 'gasto') return false
        const fecha = typeof m.fecha === 'object' && 'seconds' in m.fecha
          ? new Date(m.fecha.seconds * 1000)
          : new Date(m.fecha)
        const hoy = new Date()
        return fecha.toDateString() === hoy.toDateString()
      })
      .reduce((sum, m) => sum + (m.monto || 0), 0)

    const abonosHoy = movimientos
      .filter(m => {
        if (m.tipo !== 'abono') return false
        const fecha = typeof m.fecha === 'object' && 'seconds' in m.fecha
          ? new Date(m.fecha.seconds * 1000)
          : new Date(m.fecha)
        const hoy = new Date()
        return fecha.toDateString() === hoy.toDateString()
      })
      .reduce((sum, m) => sum + (m.monto || 0), 0)

    // Agrupar por banco
    const porBanco = BANCOS.reduce((acc, banco) => {
      acc[banco.id] = {
        gastos: movimientos.filter(m => m.tipo === 'gasto' && m.bancoId === banco.id)
          .reduce((sum, m) => sum + (m.monto || 0), 0),
        abonos: movimientos.filter(m => m.tipo === 'abono' && m.bancoId === banco.id)
          .reduce((sum, m) => sum + (m.monto || 0), 0),
      }
      return acc
    }, {} as Record<string, { gastos: number; abonos: number }>)

    return {
      totalGastos,
      totalAbonos,
      balance,
      gastosHoy,
      abonosHoy,
      numGastos: movimientos.filter(m => m.tipo === 'gasto').length,
      numAbonos: movimientos.filter(m => m.tipo === 'abono').length,
      porBanco,
    }
  }, [movimientos])

  // Datos para gráficos
  const chartData = useMemo(() => {
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
    const agrupado: Record<string, { gastos: number; abonos: number }> = {}
    
    diasSemana.forEach(dia => {
      agrupado[dia] = { gastos: 0, abonos: 0 }
    })
    
    movimientos.forEach(m => {
      const fecha = typeof m.fecha === 'object' && 'seconds' in m.fecha
        ? new Date(m.fecha.seconds * 1000)
        : new Date(m.fecha)
      const diaSemana = diasSemana[fecha.getDay()]
      
      if (agrupado[diaSemana]) {
        if (m.tipo === 'gasto') {
          agrupado[diaSemana].gastos += m.monto || 0
        } else {
          agrupado[diaSemana].abonos += m.monto || 0
        }
      }
    })
    
    const ordenDias = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
    return ordenDias.map(dia => ({
      name: dia,
      gastos: agrupado[dia].gastos,
      abonos: agrupado[dia].abonos,
    }))
  }, [movimientos])

  const pieData = useMemo(() => [
    { name: 'Gastos', value: metrics.totalGastos, color: '#ef4444' },
    { name: 'Abonos', value: metrics.totalAbonos, color: '#22c55e' },
  ], [metrics.totalGastos, metrics.totalAbonos])

  // Distribución por banco para gráfico
  const bancosChartData = useMemo(() => {
    return BANCOS.map(banco => ({
      name: banco.nombre.split(' ')[0],
      gastos: metrics.porBanco[banco.id]?.gastos || 0,
      abonos: metrics.porBanco[banco.id]?.abonos || 0,
    }))
  }, [metrics.porBanco])

  // Handlers
  const handleExportData = useCallback(() => {
    const data = {
      fecha: new Date().toISOString(),
      filtros: { tipo: tipoFiltro, banco: bancoFiltro },
      movimientos: movimientosFiltrados,
      totales: metrics,
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gya_export_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: '✅ Datos exportados',
      description: `Se exportaron ${movimientosFiltrados.length} registros`,
    })
  }, [movimientosFiltrados, metrics, tipoFiltro, bancoFiltro, toast])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-white/10 border-t-emerald-500 animate-spin" />
          <div className="text-white text-lg">Cargando Gastos y Abonos...</div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6 space-y-6">
      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4"
        >
          <p className="text-yellow-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          HEADER
          ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-purple-500/20 blur-xl" />
            <Wallet className="w-12 h-12 text-emerald-400 relative" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Gastos y Abonos
            </h1>
            <p className="text-zinc-400 text-sm">Gestión centralizada de egresos e ingresos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            className="border-white/10 text-white/70 hover:bg-white/5"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Registro
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
              <DropdownMenuItem 
                onClick={() => setShowGastoModal(true)}
                className="text-red-400 hover:bg-red-500/10 cursor-pointer"
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Registrar Gasto
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem 
                onClick={() => setShowAbonoModal(true)}
                className="text-green-400 hover:bg-green-500/10 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Registrar Abono
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════
          KPI CARDS
          ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Gastos */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-red-500/50 transition-colors">
            <TrendingDown className="w-8 h-8 text-red-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">
              {formatearMonto(metrics.totalGastos)}
            </div>
            <p className="text-sm text-zinc-400">Gastos Totales</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-red-400">
              <ArrowDownRight className="w-3 h-3" />
              <span>{metrics.numGastos} registros</span>
            </div>
          </div>
        </motion.div>

        {/* Total Abonos */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-green-500/50 transition-colors">
            <TrendingUp className="w-8 h-8 text-green-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">
              {formatearMonto(metrics.totalAbonos)}
            </div>
            <p className="text-sm text-zinc-400">Abonos Totales</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
              <ArrowUpRight className="w-3 h-3" />
              <span>{metrics.numAbonos} registros</span>
            </div>
          </div>
        </motion.div>

        {/* Balance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative group"
        >
          <div className={cn(
            'absolute inset-0 rounded-2xl blur-xl group-hover:blur-2xl transition-all',
            metrics.balance >= 0 
              ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10' 
              : 'bg-gradient-to-r from-red-500/10 to-rose-500/10',
          )} />
          <div className={cn(
            'relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 transition-colors',
            metrics.balance >= 0 ? 'hover:border-emerald-500/50' : 'hover:border-red-500/50',
          )}>
            <DollarSign className={cn('w-8 h-8 mb-4', metrics.balance >= 0 ? 'text-emerald-400' : 'text-red-400')} />
            <div className={cn('text-3xl font-bold mb-2', metrics.balance >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {metrics.balance >= 0 ? '+' : ''}{formatearMonto(metrics.balance)}
            </div>
            <p className="text-sm text-zinc-400">Balance Neto</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-zinc-500">
              <Sparkles className="w-3 h-3" />
              <span>Abonos - Gastos</span>
            </div>
          </div>
        </motion.div>

        {/* Gastos Hoy */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-orange-500/50 transition-colors">
            <Calendar className="w-8 h-8 text-orange-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">
              {formatearMonto(metrics.gastosHoy)}
            </div>
            <p className="text-sm text-zinc-400">Gastos Hoy</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-orange-400">
              <Clock className="w-3 h-3" />
              <span>Últimas 24h</span>
            </div>
          </div>
        </motion.div>

        {/* Abonos Hoy */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-colors">
            <Banknote className="w-8 h-8 text-cyan-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">
              {formatearMonto(metrics.abonosHoy)}
            </div>
            <p className="text-sm text-zinc-400">Abonos Hoy</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-cyan-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Recibidos hoy</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          GRÁFICOS
          ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Tendencia Semanal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-purple-500/5 rounded-2xl blur-2xl" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">Tendencia Semanal</h3>
                </div>
                <p className="text-sm text-zinc-400 mt-1">Gastos vs Abonos</p>
              </div>
              <div className="flex gap-2">
                {(['day', 'week', 'month'] as const).map((range) => (
                  <motion.button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      selectedTimeRange === range
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800/50 text-zinc-400 hover:text-white',
                    )}
                  >
                    {range === 'day' ? 'Día' : range === 'week' ? 'Semana' : 'Mes'}
                  </motion.button>
                ))}
              </div>
            </div>
            
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAbonos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `$${(v/1000)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="gastos"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorGastos)"
                    name="Gastos"
                  />
                  <Area
                    type="monotone"
                    dataKey="abonos"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAbonos)"
                    name="Abonos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-zinc-400">Gastos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-zinc-400">Abonos</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gráfico Pie - Distribución */}
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
              <h3 className="text-lg font-bold text-white">Distribución</h3>
            </div>
            
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatearMonto(value)}
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3 mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-zinc-400">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{formatearMonto(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TABLA DE MOVIMIENTOS
          ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-purple-500/5 rounded-2xl blur-2xl" />
        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden">
          
          {/* Toolbar */}
          <div className="p-4 border-b border-zinc-800/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Filtros de tipo */}
            <div className="flex items-center gap-2">
              {TIPOS_FILTRO.map((tipo) => (
                <Button
                  key={tipo.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTipoFiltro(tipo.id as typeof tipoFiltro)}
                  className={cn(
                    'transition-all',
                    tipoFiltro === tipo.id 
                      ? tipo.id === 'gastos' 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : tipo.id === 'abonos'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/10 text-white border border-white/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5',
                  )}
                >
                  <tipo.icon className="w-4 h-4 mr-2" />
                  {tipo.label}
                </Button>
              ))}
            </div>

            {/* Búsqueda y acciones */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Buscar por concepto, origen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-zinc-500"
                />
              </div>

              {/* Filtro por banco */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-white/10 text-white/70">
                    <Building2 className="w-4 h-4 mr-2" />
                    {BANCOS_FILTRO.find(b => b.id === bancoFiltro)?.nombre || 'Banco'}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                  {BANCOS_FILTRO.map((banco) => (
                    <DropdownMenuItem
                      key={banco.id}
                      onClick={() => setBancoFiltro(banco.id)}
                      className={cn(
                        'cursor-pointer',
                        bancoFiltro === banco.id && 'bg-white/10',
                      )}
                    >
                      <span className="mr-2">{banco.icono}</span>
                      {banco.nombre}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="border-white/10 text-white/70"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-black/20">
                  <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Tipo</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Fecha</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Concepto</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Origen/Cliente</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Banco</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-zinc-400">Monto</th>
                  <th className="text-center py-4 px-6 text-sm font-medium text-zinc-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {movimientosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                      <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No hay movimientos que coincidan con los filtros</p>
                    </td>
                  </tr>
                ) : (
                  movimientosFiltrados.slice(0, 20).map((mov, idx) => (
                    <motion.tr
                      key={mov.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + idx * 0.02 }}
                      className="border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors group/row"
                    >
                      <td className="py-4 px-6">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'font-medium',
                            mov.tipo === 'gasto' 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                              : 'bg-green-500/10 text-green-400 border-green-500/20',
                          )}
                        >
                          {mov.tipo === 'gasto' ? (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          )}
                          {mov.tipo === 'gasto' ? 'Gasto' : 'Abono'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-zinc-400">
                        {formatDate(mov.fecha)}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-white font-medium truncate max-w-[200px]">
                          {mov.concepto || 'Sin concepto'}
                        </p>
                        {mov.observaciones && (
                          <p className="text-xs text-zinc-500 truncate max-w-[200px]">
                            {mov.observaciones}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {mov.cliente ? (
                            <>
                              <User className="w-4 h-4 text-blue-400" />
                              <span className="text-white">{mov.cliente}</span>
                            </>
                          ) : mov.origen ? (
                            <>
                              <Store className="w-4 h-4 text-orange-400" />
                              <span className="text-white">{mov.origen}</span>
                            </>
                          ) : (
                            <span className="text-zinc-500">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {mov.bancoId ? (
                          <Badge variant="outline" className="bg-white/5 border-white/10">
                            {BANCOS.find(b => b.id === mov.bancoId)?.nombre || mov.bancoId}
                          </Badge>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={cn(
                          'font-mono font-bold text-lg',
                          mov.tipo === 'gasto' ? 'text-red-400' : 'text-green-400',
                        )}>
                          {mov.tipo === 'gasto' ? '-' : '+'}
                          {formatearMonto(mov.monto || 0)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-blue-500/20 text-blue-400">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-yellow-500/20 text-yellow-400">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-red-500/20 text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800/50 flex items-center justify-between text-sm text-zinc-500">
            <span>
              Mostrando {Math.min(20, movimientosFiltrados.length)} de {movimientosFiltrados.length} registros
            </span>
            <div className="flex items-center gap-4">
              <span className="text-red-400 font-medium">
                Gastos: {formatearMonto(movimientosFiltrados.filter(m => m.tipo === 'gasto').reduce((s, m) => s + (m.monto || 0), 0))}
              </span>
              <span className="text-green-400 font-medium">
                Abonos: {formatearMonto(movimientosFiltrados.filter(m => m.tipo === 'abono').reduce((s, m) => s + (m.monto || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════
          DISTRIBUCIÓN POR BANCO
          ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl blur-2xl" />
        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Distribución por Banco</h3>
          </div>

          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bancosChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `$${(v/1000)}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="gastos" stackId="a" fill="#ef4444" name="Gastos" />
                <Bar dataKey="abonos" stackId="a" fill="#22c55e" name="Abonos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-zinc-400">Gastos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-zinc-400">Abonos</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════
          MODALES
          ════════════════════════════════════════════════════════════════════ */}
      <CreateGastoModalPremium 
        open={showGastoModal} 
        onClose={() => setShowGastoModal(false)} 
        onSuccess={() => {
          refresh()
          toast({
            title: '✅ Gasto registrado',
            description: 'El gasto se ha registrado correctamente',
          })
        }}
      />

      <CreateAbonoModalPremium 
        open={showAbonoModal} 
        onClose={() => setShowAbonoModal(false)} 
        onSuccess={() => {
          refresh()
          toast({
            title: '✅ Abono registrado',
            description: 'El abono se ha registrado correctamente',
          })
        }}
      />
    </div>
  )
})
