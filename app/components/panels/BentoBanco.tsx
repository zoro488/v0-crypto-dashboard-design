'use client'

import { useState, useMemo, useCallback, useEffect, type FC, type ReactNode } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Scissors,
  Plus,
  Send,
  Search,
  Filter,
  Calendar,
  Download,
  ChevronDown,
  Wallet,
  Activity,
  BarChart3,
  Zap,
  Edit2,
  Trash2,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react'
// ═══════════════════════════════════════════════════════════════════════════
// 🔴 TESLA 2025 DESIGN SYSTEM - Componentes Premium
// ═══════════════════════════════════════════════════════════════════════════
import { 
  ButtonTesla,
  CardTesla,
  SkeletonDashboard,
  DESIGN_TOKENS,
} from '@/app/components/ui/tesla-index'
import { BANCOS } from '@/app/lib/constants'
import { useAppStore } from '@/app/lib/store/useAppStore'
import SimpleCurrencyWidget from '@/app/components/widgets/SimpleCurrencyWidget'
import { CreateGastoModalPremium } from '@/app/components/modals/CreateGastoModalPremium'
import { CreateTransferenciaModalPremium } from '@/app/components/modals/CreateTransferenciaModalPremium'
import { CreateIngresoModalPremium } from '@/app/components/modals/CreateIngresoModalPremium'
import { useToast } from '@/app/hooks/use-toast'
import { logger } from '@/app/lib/utils/logger'
import { FinancialRiverFlow } from '@/app/components/visualizations/FinancialRiverFlow'
import type { Movimiento, CorteBancario as CorteBancarioType } from '@/app/types'

// ═══════════════════════════════════════════════════════════════════════════
// 🌑 OBSIDIAN GLASS PREMIUM COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
import BankVaultPanel from '@/app/components/premium/banks/BankVaultPanel'

import {
  useIngresosBanco,
  useGastos,
  useTransferencias,
  useCorteBancario,
} from '@/app/lib/firebase/firestore-hooks.service'
import { 
  AnimatedCounter, 
  GlowButton, 
  Tilt3D, 
  SkeletonTable, 
  Pulse, 
  ShineEffect,
  haptic,
} from '@/app/components/ui/microinteractions'
import { Skeleton } from '@/app/components/ui/skeleton'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { SafeChartContainer, SAFE_ANIMATION_PROPS, SAFE_PIE_PROPS } from '@/app/components/ui/SafeChartContainer'
import { QuickStatWidget } from '@/app/components/widgets/QuickStatWidget'
import { MiniChartWidget } from '@/app/components/widgets/MiniChartWidget'
import { ActivityFeedWidget, ActivityItem } from '@/app/components/widgets/ActivityFeedWidget'

// Interfaces para tipado - Actualizadas con campos del JSON migrado
interface IngresoBanco {
  id?: string
  fecha?: string | Date | { seconds: number }
  cliente?: string
  ingreso?: number
  monto?: number
  concepto?: string
  observaciones?: string
  tc?: number
  dolares?: number
  destino?: string
  bancoId?: string
}

interface GastoBanco {
  id?: string
  fecha?: string | Date | { seconds: number }
  origen?: string
  gasto?: number
  monto?: number
  concepto?: string
  observaciones?: string
  destino?: string
  tc?: number
  pesos?: number
  bancoId?: string
}

interface CorteBancario {
  id?: string
  numero?: number
  fecha?: string | Date | { seconds: number }
  corte?: number
  capitalFinal?: number
  bancoId?: string
}

interface TransferenciaBanco {
  id?: string
  fecha?: string | Date | { seconds: number }
  origen?: string
  destino?: string
  bancoOrigenId?: string
  bancoDestinoId?: string
  monto?: number
  concepto?: string
  observaciones?: string
  tc?: number
  pesos?: number
}

// Helper para formatear fecha - Maneja Timestamps de Firestore
const formatDate = (date: string | Date | { seconds: number } | undefined): string => {
  if (!date) return '-'
  try {
    // Manejar Timestamp de Firestore
    if (typeof date === 'object' && 'seconds' in date) {
      return new Date(date.seconds * 1000).toLocaleDateString('es-MX')
    }
    return new Date(date as string | Date).toLocaleDateString('es-MX')
  } catch {
    return '-'
  }
}

// Helper para formatear números
const formatNumber = (value: number | undefined): string => {
  return (value ?? 0).toLocaleString()
}

const tabs = [
  { id: 'ingresos', label: 'Ingresos', icon: TrendingUp },
  { id: 'gastos', label: 'Gastos', icon: TrendingDown },
  { id: 'cortes', label: 'Cortes', icon: Scissors },
  { id: 'transferencias', label: 'Transferencias', icon: ArrowLeftRight },
]

export default function BentoBanco() {
  const { toast } = useToast()
  const { currentPanel } = useAppStore()
  const [activeTab, setActiveTab] = useState('ingresos')
  const [selectedBanco, setSelectedBanco] = useState(BANCOS[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [showVaultPanel, setShowVaultPanel] = useState(false)

  // Sincronizar banco seleccionado con el panel actual del store
  useEffect(() => {
    // Si el currentPanel es un ID de banco específico, seleccionarlo
    // Nota: currentPanel es PanelId, bancoId es BancoId - no son compatibles directamente
    // Solo cambiamos si es 'bancos' (vista general)
    if (currentPanel === 'bancos') {
      // Mantener el banco actualmente seleccionado
    }
  }, [currentPanel])

  const [showIngresoModal, setShowIngresoModal] = useState(false)
  const [showGastoModal, setShowGastoModal] = useState(false)
  const [showTransferenciaModal, setShowTransferenciaModal] = useState(false)

  const { data: ingresosRaw = [], loading: loadingIngresos } = useIngresosBanco(selectedBanco.id)
  const { data: gastosRaw = [], loading: loadingGastos } = useGastos(selectedBanco.id)
  const { data: transferenciasRaw = [], loading: loadingTransferencias } = useTransferencias(selectedBanco.id)
  const { data: cortesRaw = [], loading: loadingCortes } = useCorteBancario(selectedBanco.id)

  // Casting seguro a los tipos correctos
  const ingresos = ingresosRaw as IngresoBanco[]
  const gastos = gastosRaw as GastoBanco[]
  const transferencias = transferenciasRaw as TransferenciaBanco[]
  const cortes = cortesRaw as CorteBancario[]

  // Cálculos básicos - usando los campos correctos del JSON
  const totalIngresos = ingresos.reduce((sum, i) => sum + (i.ingreso ?? 0), 0)
  const totalGastos = gastos.reduce((sum, g) => sum + (g.gasto ?? 0), 0)
  const saldoActual = totalIngresos - totalGastos

  // ============================================
  // HANDLERS PARA ACCIONES DE TABLA
  // ============================================

  const handleEditIngreso = useCallback((ingreso: IngresoBanco) => {
    logger.info('Edit ingreso requested', { context: 'BentoBanco', data: { id: ingreso.id } })
    toast({
      title: '⚙️ Función en desarrollo',
      description: `Editar ingreso de ${ingreso.cliente || 'cliente'} - Próximamente disponible`,
    })
  }, [toast])

  const handleDeleteIngreso = useCallback((ingreso: IngresoBanco) => {
    logger.info('Delete ingreso requested', { context: 'BentoBanco', data: { id: ingreso.id } })
    toast({
      title: '🗑️ Confirmar eliminación',
      description: `¿Eliminar ingreso de $${formatNumber(ingreso.ingreso)}? Esta función estará disponible próximamente.`,
      variant: 'destructive',
    })
  }, [toast])

  const handleEditGasto = useCallback((gasto: GastoBanco) => {
    logger.info('Edit gasto requested', { context: 'BentoBanco', data: { id: gasto.id } })
    toast({
      title: '⚙️ Función en desarrollo',
      description: `Editar gasto de ${gasto.origen || 'varios'} - Próximamente disponible`,
    })
  }, [toast])

  const handleDeleteGasto = useCallback((gasto: GastoBanco) => {
    logger.info('Delete gasto requested', { context: 'BentoBanco', data: { id: gasto.id } })
    toast({
      title: '🗑️ Confirmar eliminación',
      description: `¿Eliminar gasto de $${formatNumber(gasto.gasto)}? Esta función estará disponible próximamente.`,
      variant: 'destructive',
    })
  }, [toast])

  const handleEditTransferencia = useCallback((trans: TransferenciaBanco) => {
    logger.info('Edit transferencia requested', { context: 'BentoBanco', data: { id: trans.id } })
    toast({
      title: '⚙️ Función en desarrollo',
      description: `Editar transferencia ${trans.origen} → ${trans.destino} - Próximamente disponible`,
    })
  }, [toast])

  const handleDeleteTransferencia = useCallback((trans: TransferenciaBanco) => {
    logger.info('Delete transferencia requested', { context: 'BentoBanco', data: { id: trans.id } })
    toast({
      title: '🗑️ Confirmar eliminación',
      description: `¿Eliminar transferencia de $${formatNumber(trans.monto)}? Esta función estará disponible próximamente.`,
      variant: 'destructive',
    })
  }, [toast])

  const handleExportData = useCallback(() => {
    const data = {
      banco: selectedBanco.nombre,
      fecha: new Date().toISOString(),
      ingresos,
      gastos,
      transferencias,
      cortes,
      totales: { totalIngresos, totalGastos, saldoActual },
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedBanco.id}_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    logger.info('Data exported', { context: 'BentoBanco', data: { banco: selectedBanco.id } })
    toast({
      title: '✅ Datos exportados',
      description: `Se descargó el archivo de ${selectedBanco.nombre}`,
    })
  }, [selectedBanco, ingresos, gastos, transferencias, cortes, totalIngresos, totalGastos, saldoActual, toast])

  // Datos para gráficos - DATOS REALES agrupados por día
  const trendData = useMemo(() => {
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const datosPorDia = diasSemana.map(dia => ({ name: dia, ingresos: 0, gastos: 0 }))
    
    // Procesar ingresos
    ingresos.forEach(ingreso => {
      const fecha = ingreso.fecha
      if (fecha) {
        let dateObj: Date
        if (typeof fecha === 'object' && 'seconds' in fecha) {
          dateObj = new Date((fecha as { seconds: number }).seconds * 1000)
        } else if (typeof fecha === 'string' || fecha instanceof Date) {
          dateObj = new Date(fecha)
        } else {
          return
        }
        const diaSemana = dateObj.getDay()
        datosPorDia[diaSemana].ingresos += ingreso.ingreso ?? ingreso.monto ?? 0
      }
    })
    
    // Procesar gastos
    gastos.forEach(gasto => {
      const fecha = gasto.fecha
      if (fecha) {
        let dateObj: Date
        if (typeof fecha === 'object' && 'seconds' in fecha) {
          dateObj = new Date((fecha as { seconds: number }).seconds * 1000)
        } else if (typeof fecha === 'string' || fecha instanceof Date) {
          dateObj = new Date(fecha)
        } else {
          return
        }
        const diaSemana = dateObj.getDay()
        datosPorDia[diaSemana].gastos += gasto.gasto ?? gasto.monto ?? 0
      }
    })
    
    // Reordenar para empezar en Lunes
    return [...datosPorDia.slice(1), datosPorDia[0]]
  }, [ingresos, gastos])

  // Distribución por tipo de movimiento
  const distribucionMovimientos = useMemo(() => [
    { name: 'Ingresos', value: totalIngresos || 1, color: '#10b981' },
    { name: 'Gastos', value: totalGastos || 1, color: '#ef4444' },
    { name: 'Transferencias', value: transferencias.reduce((sum, t) => sum + (t.monto ?? 0), 0) || 1, color: '#8b5cf6' },
  ], [totalIngresos, totalGastos, transferencias])

  // Activity feed - usando campos correctos
  const recentActivity: ActivityItem[] = useMemo(() => {
    const activities: ActivityItem[] = []
    
    ingresos.slice(0, 3).forEach((ing, i) => {
      const fecha = ing.fecha && typeof ing.fecha === 'object' && 'seconds' in ing.fecha 
        ? new Date(ing.fecha.seconds * 1000) 
        : new Date(ing.fecha as string || Date.now())
      
      activities.push({
        id: `ing-${ing.id || i}`,
        type: 'pago',
        title: `Ingreso de ${ing.cliente || 'Cliente'}`,
        description: `+$${(ing.ingreso ?? 0).toLocaleString()} - ${ing.concepto || 'Sin concepto'}`,
        timestamp: fecha,
        status: 'success',
      })
    })
    
    gastos.slice(0, 3).forEach((g, i) => {
      const fecha = g.fecha && typeof g.fecha === 'object' && 'seconds' in g.fecha 
        ? new Date(g.fecha.seconds * 1000) 
        : new Date(g.fecha as string || Date.now())
      
      activities.push({
        id: `gasto-${g.id || i}`,
        type: 'compra',
        title: `Gasto - ${g.origen || 'Varios'}`,
        description: `-$${(g.gasto ?? 0).toLocaleString()} - ${g.concepto || g.observaciones || 'Sin concepto'}`,
        timestamp: fecha,
        status: 'error',
      })
    })
    
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5)
  }, [ingresos, gastos])

  const loading = loadingIngresos || loadingGastos || loadingTransferencias || loadingCortes

  // Loading state DESPUÉS de todos los hooks
  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-black min-h-screen">
        <SkeletonDashboard />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-black min-h-screen">
      {/* Header with Bank Selector */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bento-full crystal-card p-8 relative overflow-hidden"
      >
        {/* Ambient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${selectedBanco.color} opacity-10`} />
        <div className="absolute inset-0 backdrop-blur-3xl" />

        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${selectedBanco.color} shadow-lg shadow-black/20`}>
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Gestión de Bancos</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-white/60">Banco Seleccionado:</span>
                <span className={`font-semibold text-transparent bg-clip-text bg-gradient-to-r ${selectedBanco.color}`}>
                  {selectedBanco.nombre}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Selector with improved visual feedback */}
          <div className="flex gap-2 flex-wrap justify-end max-w-2xl">
            {BANCOS.map((banco) => (
              <motion.button
                key={banco.id}
                onClick={() => setSelectedBanco(banco)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                  ${
                    selectedBanco.id === banco.id
                      ? 'bg-white/10 text-white shadow-lg shadow-black/10 ring-1 ring-white/20'
                      : 'glass text-white/40 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                {selectedBanco.id === banco.id && (
                  <motion.div
                    layoutId="activeBank"
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r ${banco.color} opacity-20`}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {selectedBanco.id === banco.id && <div className={'w-1.5 h-1.5 rounded-full bg-white'} />}
                  {banco.nombre}
                </span>
              </motion.button>
            ))}
            {/* Toggle Vault Panel Premium */}
            <motion.button
              onClick={() => setShowVaultPanel(!showVaultPanel)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ml-4
                ${showVaultPanel
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                  : 'glass text-purple-400 hover:text-white hover:bg-purple-500/10 border border-purple-500/30'
                }
              `}
            >
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {showVaultPanel ? 'Vista Clásica' : 'Vault Premium'}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Vista Premium Vault o Stats normales */}
        {showVaultPanel ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <BankVaultPanel
              banco={{
                ...selectedBanco,
                capitalActual: saldoActual,
                historicoIngresos: totalIngresos,
                historicoGastos: totalGastos,
              }}
              movimientos={[
                ...ingresos.map(i => ({ 
                  id: i.id || '', 
                  tipo: 'ingreso' as const, 
                  monto: i.ingreso || 0, 
                  fecha: i.fecha?.toString() || '', 
                  descripcion: i.concepto || '',
                  origen: selectedBanco.id,
                  destino: selectedBanco.id,
                })),
                ...gastos.map(g => ({ 
                  id: g.id || '', 
                  tipo: 'gasto' as const, 
                  monto: g.gasto || 0, 
                  fecha: g.fecha?.toString() || '', 
                  descripcion: g.concepto || g.origen || '',
                  origen: selectedBanco.id,
                  destino: selectedBanco.id,
                })),
              ] as unknown as Movimiento[]}
              cortes={cortes.map(c => ({
                id: c.id || '',
                bancoId: selectedBanco.id,
                fecha: (typeof c.fecha === 'string' ? c.fecha : new Date().toISOString()),
                saldoInicial: 0,
                saldoFinal: (c as unknown as { saldo?: number }).saldo || 0,
                estado: 'completado' as const,
                createdAt: new Date(),
              })) as unknown as CorteBancarioType[]}
              themeColor="purple"
            />
          </motion.div>
        ) : (
          <>
            {/* Selected Bank Stats Grid - NUEVO: Histórico Fijo vs Capital Actual */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Fila Principal: Histórico Fijo y Capital Actual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Histórico Fijo (Acumulativo - NUNCA disminuye) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent relative overflow-hidden"
                >
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-medium uppercase tracking-wider">
                      Fijo
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-amber-400/80 text-sm font-medium flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Histórico Acumulado
                    </span>
                  </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/40 text-xs uppercase mb-1">Total Ingresos</p>
                  <p className="text-2xl font-bold text-emerald-400">${totalIngresos.toLocaleString('en-US')}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase mb-1">Total Gastos</p>
                  <p className="text-2xl font-bold text-rose-400">${totalGastos.toLocaleString('en-US')}</p>
                </div>
              </div>
              <p className="text-amber-400/60 text-xs mt-3 italic">
                * Estos valores solo aumentan, nunca disminuyen
              </p>
            </motion.div>

            {/* Capital Actual (Dinámico = Ingresos - Gastos) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass p-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent relative overflow-hidden"
            >
              <div className="absolute top-2 right-2">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-medium uppercase tracking-wider">
                  Dinámico
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-cyan-400/80 text-sm font-medium flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Capital Actual
                </span>
              </div>
              <p className={`text-4xl font-bold tracking-tight ${saldoActual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${saldoActual.toLocaleString('en-US')}
              </p>
              <div className="flex items-center gap-2 mt-3 text-sm text-cyan-400/60">
                <span>=</span>
                <span className="text-emerald-400/60">${totalIngresos.toLocaleString()}</span>
                <span>-</span>
                <span className="text-rose-400/60">${totalGastos.toLocaleString()}</span>
              </div>
              <p className="text-cyan-400/60 text-xs mt-2 italic">
                * Las transferencias y gastos afectan este valor
              </p>
            </motion.div>
          </div>
          
          {/* Fila Secundaria: Métricas de Movimiento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-6 rounded-2xl border border-white/5 bg-black/20"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60 text-sm font-medium">Ingresos Período</span>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold text-emerald-400 tracking-tight">${totalIngresos.toLocaleString('en-US')}</p>
              <div className="w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: totalIngresos > 0 ? `${Math.min(100, (totalIngresos / (totalIngresos + totalGastos)) * 100)}%` : '0%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass p-6 rounded-2xl border border-white/5 bg-black/20"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60 text-sm font-medium">Gastos Período</span>
                <TrendingDown className="w-5 h-5 text-rose-400" />
              </div>
              <p className="text-3xl font-bold text-rose-400 tracking-tight">${totalGastos.toLocaleString('en-US')}</p>
              <div className="w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: totalGastos > 0 ? `${Math.min(100, (totalGastos / (totalIngresos + totalGastos)) * 100)}%` : '0%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass p-6 rounded-2xl border border-white/5 bg-black/20"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60 text-sm font-medium">Ratio Salud</span>
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <p className={`text-3xl font-bold tracking-tight ${
                totalGastos > 0 && totalIngresos / totalGastos >= 1.5 ? 'text-emerald-400' :
                totalGastos > 0 && totalIngresos / totalGastos >= 1 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {totalGastos > 0 ? (totalIngresos / totalGastos).toFixed(2) : '∞'}x
              </p>
              <div className="flex items-center gap-2 mt-2 text-sm text-white/40">
                <span>Ingresos / Gastos</span>
                {totalGastos > 0 && totalIngresos / totalGastos >= 1.5 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">Saludable</span>
                )}
              </div>
            </motion.div>
          </div>

          {selectedBanco.id === 'profit' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <SimpleCurrencyWidget />
            </motion.div>
          )}
            </motion.div>
          </>
        )}

        {/* Premium Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-6">
          <QuickStatWidget
            title="Saldo Disponible"
            value={saldoActual}
            prefix="$"
            change={12.5}
            icon={Wallet}
            color="green"
            sparklineData={trendData.map(d => d.ingresos - d.gastos)}
            delay={0.1}
          />
          <QuickStatWidget
            title="Ingresos del Período"
            value={totalIngresos}
            prefix="$"
            change={18.3}
            icon={TrendingUp}
            color="cyan"
            sparklineData={trendData.map(d => d.ingresos)}
            delay={0.2}
          />
          <QuickStatWidget
            title="Gastos del Período"
            value={totalGastos}
            prefix="$"
            change={-5.2}
            icon={TrendingDown}
            color="red"
            sparklineData={trendData.map(d => d.gastos)}
            delay={0.3}
          />
          <QuickStatWidget
            title="Transferencias"
            value={transferencias.length}
            change={8.1}
            icon={ArrowLeftRight}
            color="purple"
            sparklineData={[3, 5, 4, 7, 6, 8, transferencias.length]}
            delay={0.4}
          />
        </div>

        {/* Gráficos Premium */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Tendencia Ingresos vs Gastos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 glass p-6 rounded-2xl border border-white/5 bg-black/20"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Flujo de Caja</h3>
                  <p className="text-xs text-white/50">Ingresos vs Gastos - 7 días</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-white/60">Ingresos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-white/60">Gastos</span>
                </div>
              </div>
            </div>
            <div style={{ width: '100%', minWidth: 200, height: 200, minHeight: 200 }}>
            <SafeChartContainer height={200} minHeight={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorIngresosB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGastosB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#fff" opacity={0.3} fontSize={11} />
                <YAxis stroke="#fff" opacity={0.3} fontSize={11} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(15, 23, 42, 0.95)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '12px', 
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIngresosB)" name="Ingresos" {...SAFE_ANIMATION_PROPS} />
                <Area type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorGastosB)" name="Gastos" {...SAFE_ANIMATION_PROPS} />
              </AreaChart>
            </SafeChartContainer>
            </div>
          </motion.div>

          {/* Distribución Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass p-6 rounded-2xl border border-white/5 bg-black/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-violet-500/20">
                <BarChart3 className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Distribución</h3>
                <p className="text-xs text-white/50">Por tipo</p>
              </div>
            </div>
            <div style={{ width: '100%', minWidth: 120, height: 140, minHeight: 140 }}>
            <SafeChartContainer height={140} minHeight={140}>
              <PieChart>
                <Pie
                  data={distribucionMovimientos}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={4}
                  dataKey="value"
                  {...SAFE_PIE_PROPS}
                >
                  {distribucionMovimientos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </SafeChartContainer>
            </div>
            <div className="space-y-2 mt-2">
              {distribucionMovimientos.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    <span className="text-white/70">{item.name}</span>
                  </div>
                  <span className="text-white font-medium">${(item.value / 1000).toFixed(0)}K</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Activity Feed y Mini Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <ActivityFeedWidget
            title="Movimientos Recientes"
            activities={recentActivity}
            maxItems={4}
          />
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <MiniChartWidget
              title="Ratio Ingreso/Gasto"
              subtitle={`${totalGastos > 0 ? Math.round((totalIngresos / totalGastos) * 100) : 100}%`}
              type="donut"
              data={[{ name: 'Ingresos', value: totalIngresos }, { name: 'Gastos', value: totalGastos }]}
              color="green"
            />
            <MiniChartWidget
              title="Cortes Realizados"
              subtitle={`${cortes.length} cortes`}
              type="bar"
              data={cortes.slice(0, 5).map((c, i) => ({ name: `Corte ${i+1}`, value: c.capitalFinal || 0 }))}
              color="cyan"
            />
            <MiniChartWidget
              title="Promedio Ingreso"
              subtitle={`$${ingresos.length > 0 ? Math.round(totalIngresos / ingresos.length).toLocaleString() : 0}`}
              type="area"
              data={trendData.map(d => ({ name: d.name, value: d.ingresos / 5 }))}
              color="blue"
            />
            <MiniChartWidget
              title="Salud Financiera"
              subtitle={`${saldoActual > 0 ? 92 : 45}%`}
              type="line"
              data={trendData.map(d => ({ name: d.name, value: 80 + Math.random() * 15 }))}
              color="purple"
            />
          </div>
        </div>

        {/* Advanced Controls & Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-black/20 p-2 rounded-3xl backdrop-blur-xl border border-white/5">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all whitespace-nowrap relative
                  ${activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}
                `}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 rounded-2xl shadow-inner shadow-white/5"
                  />
                )}
                <tab.icon className={`w-4 h-4 relative z-10 ${activeTab === tab.id ? 'text-cyan-400' : ''}`} />
                <span className="relative z-10">{tab.label}</span>
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto px-2">
            <div className="relative flex-1 md:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="text"
                placeholder="Buscar transacción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/20 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 focus:bg-black/40 transition-all"
              />
            </div>
            <motion.button
              onClick={() => setFilterOpen(!filterOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2.5 rounded-xl border transition-all ${filterOpen ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-black/20 border-white/5 text-white/40 hover:text-white'}`}
            >
              <Filter className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportData}
              className="p-2.5 rounded-xl bg-black/20 border border-white/5 text-white/40 hover:text-white transition-colors"
              title="Exportar datos"
            >
              <Download className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Filter Panel (Expandable) */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass p-6 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Rango de Fecha</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <select className="w-full bg-black/20 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white appearance-none focus:outline-none focus:border-cyan-500/50">
                      <option>Últimos 30 días</option>
                      <option>Este Mes</option>
                      <option>Este Trimestre</option>
                      <option>Este Año</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                </div>
                {/* Add more filters here */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area with Glassmorphism */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="bento-full min-h-[500px]"
        >
          {activeTab === 'ingresos' && (
            <div className="crystal-card p-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex items-center justify-between p-6 relative z-10">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Ingresos Históricos</h3>
                  <p className="text-white/40 text-sm mt-1">Registro detallado de entradas de capital</p>
                </div>
                <ButtonTesla
                  variant="primary"
                  onClick={() => setShowIngresoModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Ingreso
                </ButtonTesla>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <TableHeader>Fecha</TableHeader>
                      <TableHeader>Cliente</TableHeader>
                      <TableHeader>Ingreso</TableHeader>
                      <TableHeader>Concepto</TableHeader>
                      <TableHeader>T.C.</TableHeader>
                      <TableHeader>Dólares</TableHeader>
                      <TableHeader>Observaciones</TableHeader>
                      <TableHeader>Acciones</TableHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ingresos.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-white/40">
                          No hay ingresos registrados para este banco
                        </td>
                      </tr>
                    ) : (
                      ingresos.map((ingreso, index) => (
                        <motion.tr
                          key={ingreso.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group/row hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-6 py-4 text-white/60 text-sm">{formatDate(ingreso.fecha)}</td>
                          <td className="px-6 py-4 text-white/80 font-medium">{ingreso.cliente ?? '-'}</td>
                          <td className="px-6 py-4 text-emerald-400 font-semibold">${formatNumber(ingreso.ingreso)}</td>
                          <td className="px-6 py-4 text-white/60">{ingreso.concepto ?? '-'}</td>
                          <td className="px-6 py-4 text-cyan-400 font-mono text-sm">{ingreso.tc ? `$${ingreso.tc.toFixed(2)}` : '-'}</td>
                          <td className="px-6 py-4 text-amber-400 font-mono">{ingreso.dolares ? `$${formatNumber(ingreso.dolares)}` : '-'}</td>
                          <td className="px-6 py-4 text-white/40 text-sm max-w-[200px] truncate">{ingreso.observaciones ?? '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEditIngreso(ingreso)}
                                className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors" 
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteIngreso(ingreso)}
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors" 
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination / Footer */}
              <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                <span>Mostrando {ingresos.length} registros</span>
                <div className="flex gap-2">
                  <span className="px-3 py-1 text-emerald-400 font-medium">
                    Total: ${formatNumber(ingresos.reduce((sum, ing) => sum + (ing.ingreso || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gastos' && (
            <div className="crystal-card p-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex items-center justify-between p-6 relative z-10">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Gastos Históricos</h3>
                  <p className="text-white/40 text-sm mt-1">Registro detallado de salidas de capital</p>
                </div>
                <ButtonTesla
                  variant="destructive"
                  onClick={() => setShowGastoModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  Registrar Gasto
                </ButtonTesla>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <TableHeader>Fecha</TableHeader>
                      <TableHeader>Origen</TableHeader>
                      <TableHeader>Gasto</TableHeader>
                      <TableHeader>T.C.</TableHeader>
                      <TableHeader>Pesos</TableHeader>
                      <TableHeader>Destino</TableHeader>
                      <TableHeader>Concepto</TableHeader>
                      <TableHeader>Observaciones</TableHeader>
                      <TableHeader>Acciones</TableHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {gastos.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-white/40">
                          No hay gastos registrados para este banco
                        </td>
                      </tr>
                    ) : (
                      gastos.map((gasto, index) => (
                        <motion.tr
                          key={gasto.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group/row hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-6 py-4 text-white/60 text-sm">{formatDate(gasto.fecha)}</td>
                          <td className="px-6 py-4 text-white/80 font-medium">{gasto.origen ?? '-'}</td>
                          <td className="px-6 py-4 text-rose-400 font-semibold">${formatNumber(gasto.gasto)}</td>
                          <td className="px-6 py-4 text-cyan-400 font-mono text-sm">{gasto.tc ? `$${gasto.tc.toFixed(2)}` : '-'}</td>
                          <td className="px-6 py-4 text-amber-400 font-mono">{gasto.pesos ? `$${formatNumber(gasto.pesos)}` : '-'}</td>
                          <td className="px-6 py-4 text-white/60">{gasto.destino ?? '-'}</td>
                          <td className="px-6 py-4 text-white/60">{gasto.concepto ?? '-'}</td>
                          <td className="px-6 py-4 text-white/40 text-sm max-w-[200px] truncate">{gasto.observaciones ?? '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEditGasto(gasto)}
                                className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors" 
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteGasto(gasto)}
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors" 
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer con totales */}
              <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                <span>Mostrando {gastos.length} registros</span>
                <div className="flex gap-2">
                  <span className="px-3 py-1 text-rose-400 font-medium">
                    Total: ${formatNumber(gastos.reduce((sum, g) => sum + (g.gasto || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cortes' && (
            <div className="crystal-card p-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center justify-between p-6 relative z-10">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Cortes de Cuenta</h3>
                  <p className="text-white/40 text-sm mt-1">Registro de cortes y balance actual</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <TableHeader>Número</TableHeader>
                      <TableHeader>Fecha</TableHeader>
                      <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                        Corte (RF Actual)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {cortes.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-white/40">
                          No hay cortes registrados para este banco
                        </td>
                      </tr>
                    ) : (
                      cortes.map((corte, index) => (
                        <motion.tr
                          key={corte.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group/row hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-4 px-6">
                            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                              #{corte.numero ?? index + 1}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-white/60 text-sm">
                            {formatDate(corte.fecha)}
                          </td>
                          <td className="py-4 px-6 text-right text-cyan-400 font-bold text-lg font-mono">
                            ${formatNumber(corte.corte)}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer con totales */}
              <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                <span>Mostrando {cortes.length} cortes</span>
                {cortes.length > 0 && (
                  <div className="flex gap-2">
                    <span className="px-3 py-1 text-cyan-400 font-medium">
                      Último Corte: ${formatNumber(cortes[cortes.length - 1]?.corte)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'transferencias' && (
            <div className="crystal-card p-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center justify-between p-6 relative z-10">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Transferencias</h3>
                  <p className="text-white/40 text-sm mt-1">Movimientos de capital entre bancos</p>
                </div>
                <ButtonTesla
                  variant="secondary"
                  onClick={() => setShowTransferenciaModal(true)}
                >
                  <Send className="w-4 h-4" />
                  Nueva Transferencia
                </ButtonTesla>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <TableHeader>Fecha</TableHeader>
                      <TableHeader>Origen</TableHeader>
                      <TableHeader>Destino</TableHeader>
                      <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                        Monto
                      </th>
                      <TableHeader>Concepto</TableHeader>
                      <TableHeader>Observaciones</TableHeader>
                      <TableHeader>Acciones</TableHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transferencias.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                          No hay transferencias registradas
                        </td>
                      </tr>
                    ) : (
                      transferencias.map((trans, index) => (
                        <motion.tr
                          key={trans.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group/row hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-4 px-6 text-white/60 text-sm">{formatDate(trans.fecha)}</td>
                          <td className="py-4 px-6">
                            <span className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-medium">
                              {trans.origen ?? '-'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                              {trans.destino ?? '-'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right text-purple-400 font-bold font-mono">
                            ${formatNumber(trans.monto)}
                          </td>
                          <td className="py-4 px-6 text-white/60 text-sm">{trans.concepto ?? '-'}</td>
                          <td className="py-4 px-6 text-white/40 text-sm max-w-[200px] truncate">{trans.observaciones ?? '-'}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEditTransferencia(trans)}
                                className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors" 
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteTransferencia(trans)}
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors" 
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer con totales */}
              <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                <span>Mostrando {transferencias.length} transferencias</span>
                <div className="flex gap-2">
                  <span className="px-3 py-1 text-purple-400 font-medium">
                    Total: ${formatNumber(transferencias.reduce((sum, t) => sum + (t.monto || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Modals */}
      {showIngresoModal && <CreateIngresoModalPremium open={showIngresoModal} onClose={() => setShowIngresoModal(false)} />}
      {showGastoModal && <CreateGastoModalPremium open={showGastoModal} onClose={() => setShowGastoModal(false)} />}
      {showTransferenciaModal && (
        <CreateTransferenciaModalPremium open={showTransferenciaModal} onClose={() => setShowTransferenciaModal(false)} />
      )}

      {/* Financial River Flow - Premium Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass p-6 rounded-2xl border border-white/5 bg-black/20 mt-6"
      >
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white">Flujo Financiero</h3>
          <p className="text-sm text-white/60">Movimiento de dinero entre cuentas bancarias</p>
        </div>
        <FinancialRiverFlow width={900} height={600} className="w-full" />
      </motion.div>
    </div>
  )
}

// Helper component for Table Headers
const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">{children}</th>
)

// Helper component for Status Badges
const StatusBadge = ({
  status,
  type = 'info',
}: { status: string; type?: 'success' | 'warning' | 'error' | 'info' }) => {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md ${styles[type]}`}
    >
      {status}
    </span>
  )
}
