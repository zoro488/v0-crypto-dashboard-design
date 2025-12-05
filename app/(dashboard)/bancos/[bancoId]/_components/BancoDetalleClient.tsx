'use client'

// ═══════════════════════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — BANCO DETALLE PANEL PREMIUM
// Panel individual de banco con 4 tabs: Ingresos, Gastos, Transferencias, Cortes
// Diseño ultra-premium con glassmorphism y animaciones avanzadas
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useTransition, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  FileText,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  MoreHorizontal,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, cn } from '@/app/_lib/utils'
import { BANCOS_CONFIG, type BancoConfig } from '@/app/lib/config/bancos.config'
import { useChronosStore } from '@/app/lib/store'
import { IngresoModal } from '@/app/_components/modals/IngresoModal'
import { GastoModal } from '@/app/_components/modals/GastoModal'
import { TransferenciaModal } from '@/app/_components/modals/TransferenciaModal'
import type { Banco, Movimiento as DbMovimiento } from '@/database/schema'
import type { BancoId } from '@/app/types'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

// Tipo simplificado de movimiento desde database
type Movimiento = DbMovimiento

interface BancoDetalleClientProps {
  banco: Banco
  movimientos: Movimiento[]
}

type TabId = 'ingresos' | 'gastos' | 'transferencias' | 'cortes'

interface TabConfig {
  id: TabId
  label: string
  icon: typeof TrendingUp
  gradient: string
  description: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const TABS: TabConfig[] = [
  { 
    id: 'ingresos', 
    label: 'Ingresos', 
    icon: TrendingUp, 
    gradient: 'from-emerald-500 to-green-600',
    description: 'Entradas de capital al banco'
  },
  { 
    id: 'gastos', 
    label: 'Gastos', 
    icon: TrendingDown, 
    gradient: 'from-red-500 to-rose-600',
    description: 'Salidas y pagos desde el banco'
  },
  { 
    id: 'transferencias', 
    label: 'Transferencias', 
    icon: ArrowRightLeft, 
    gradient: 'from-blue-500 to-indigo-600',
    description: 'Movimientos entre bancos'
  },
  { 
    id: 'cortes', 
    label: 'Cortes RF', 
    icon: FileText, 
    gradient: 'from-purple-500 to-violet-600',
    description: 'Reportes y balance de cuenta'
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function BancoDetalleClient({ banco: initialBanco, movimientos: initialMovimientos }: BancoDetalleClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('ingresos')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [isRefreshing, startRefresh] = useTransition()
  
  // Estados de modales
  const [isIngresoModalOpen, setIsIngresoModalOpen] = useState(false)
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false)
  const [isTransferenciaModalOpen, setIsTransferenciaModalOpen] = useState(false)
  
  // Conectar al store para datos reactivos del banco
  const storeBancos = useChronosStore(state => state.bancos)
  const storeMovimientos = useChronosStore(state => state.movimientos)
  const lastSync = useChronosStore(state => state.lastSync)
  
  // Usar capital del store si está disponible (más actualizado)
  const banco = useMemo(() => {
    const storeBanco = storeBancos[initialBanco.id as keyof typeof storeBancos]
    if (storeBanco) {
      return {
        ...initialBanco,
        capitalActual: storeBanco.capitalActual,
        historicoIngresos: storeBanco.historicoIngresos,
        historicoGastos: storeBanco.historicoGastos,
      }
    }
    return initialBanco
  }, [storeBancos, initialBanco, lastSync])
  
  // Movimientos vienen del servidor (schema diferente al store)
  const movimientos = initialMovimientos
  
  const config = BANCOS_CONFIG[banco.id as keyof typeof BANCOS_CONFIG]

  // Filtrar movimientos por tipo
  const ingresos = useMemo(() => 
    movimientos.filter(m => m.tipo === 'ingreso' || m.tipo === 'transferencia_entrada' || m.tipo === 'abono')
  , [movimientos])
  
  const gastos = useMemo(() => 
    movimientos.filter(m => m.tipo === 'gasto' || m.tipo === 'pago')
  , [movimientos])
  
  const transferencias = useMemo(() => 
    movimientos.filter(m => m.tipo === 'transferencia_entrada' || m.tipo === 'transferencia_salida')
  , [movimientos])

  // Calcular totales
  const totalIngresos = ingresos.reduce((sum, m) => sum + Math.abs(m.monto), 0)
  const totalGastos = gastos.reduce((sum, m) => sum + Math.abs(m.monto), 0)
  
  // KPI Cards data
  const kpiCards = [
    {
      title: 'Capital Actual',
      value: banco.capitalActual,
      icon: Wallet,
      gradient: 'from-purple-500 to-violet-600',
      change: '+12.5%',
      positive: true,
    },
    {
      title: 'Ingresos Históricos',
      value: banco.historicoIngresos,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-green-600',
      change: `+${ingresos.length} mov`,
      positive: true,
    },
    {
      title: 'Gastos Históricos',
      value: banco.historicoGastos,
      icon: TrendingDown,
      gradient: 'from-red-500 to-rose-600',
      change: `${gastos.length} mov`,
      positive: false,
    },
    {
      title: 'Balance Neto',
      value: banco.historicoIngresos - banco.historicoGastos,
      icon: DollarSign,
      gradient: (banco.historicoIngresos - banco.historicoGastos) >= 0 
        ? 'from-blue-500 to-cyan-600' 
        : 'from-orange-500 to-red-600',
      change: 'Calculado',
      positive: (banco.historicoIngresos - banco.historicoGastos) >= 0,
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative"
          >
            <div className={cn(
              'relative overflow-hidden rounded-2xl p-6',
              'bg-gradient-to-br border border-white/10',
              kpi.gradient,
              'transition-all duration-300',
              'hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20'
            )}>
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.3),transparent_50%)]" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <kpi.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className={cn(
                    'text-xs font-medium px-2 py-1 rounded-full',
                    kpi.positive ? 'bg-white/20 text-white' : 'bg-white/20 text-white'
                  )}>
                    {kpi.change}
                  </span>
                </div>
                <p className="text-white/70 text-sm font-medium mb-1">{kpi.title}</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {formatCurrency(kpi.value)}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 p-1 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabBg"
                  className={cn('absolute inset-0 rounded-lg bg-gradient-to-r', tab.gradient)}
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <tab.icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => startRefresh(() => {
              toast.success('Datos actualizados')
            })}
            disabled={isRefreshing}
            className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </button>
          
          {/* Botón Ingreso */}
          <button 
            onClick={() => setIsIngresoModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Ingreso
          </button>
          
          {/* Botón Gasto */}
          <button 
            onClick={() => setIsGastoModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Minus className="h-4 w-4" />
            Gasto
          </button>
          
          {/* Botón Transferencia */}
          <button 
            onClick={() => setIsTransferenciaModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Transferir
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por concepto, referencia, monto..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 transition-colors"
        />
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'ingresos' && (
            <TablaMovimientos 
              titulo="Ingresos"
              movimientos={ingresos}
              tipo="ingreso"
              searchQuery={searchQuery}
              bancoColor={config?.color || '#8B5CF6'}
            />
          )}
          {activeTab === 'gastos' && (
            <TablaMovimientos 
              titulo="Gastos"
              movimientos={gastos}
              tipo="gasto"
              searchQuery={searchQuery}
              bancoColor={config?.color || '#8B5CF6'}
            />
          )}
          {activeTab === 'transferencias' && (
            <TablaTransferencias 
              transferencias={transferencias}
              searchQuery={searchQuery}
              bancoId={banco.id as BancoId}
            />
          )}
          {activeTab === 'cortes' && (
            <PanelCortes 
              banco={banco}
              movimientos={movimientos}
            />
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Modales */}
      <IngresoModal 
        isOpen={isIngresoModalOpen} 
        onClose={() => setIsIngresoModalOpen(false)}
        bancoPreseleccionado={banco.id as BancoId}
      />
      <GastoModal 
        isOpen={isGastoModalOpen} 
        onClose={() => setIsGastoModalOpen(false)}
        bancoPreseleccionado={banco.id as BancoId}
      />
      <TransferenciaModal 
        isOpen={isTransferenciaModalOpen} 
        onClose={() => setIsTransferenciaModalOpen(false)}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

interface TablaMovimientosProps {
  titulo: string
  movimientos: Movimiento[]
  tipo: 'ingreso' | 'gasto'
  searchQuery: string
  bancoColor: string
}

function TablaMovimientos({ titulo, movimientos, tipo, searchQuery, bancoColor }: TablaMovimientosProps) {
  const filteredMovimientos = movimientos.filter(m => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      m.concepto?.toLowerCase().includes(query) ||
      m.referencia?.toLowerCase().includes(query) ||
      m.monto.toString().includes(query)
    )
  })

  const isIngreso = tipo === 'ingreso'
  const totalMonto = filteredMovimientos.reduce((sum, m) => sum + Math.abs(m.monto), 0)

  return (
    <div className="space-y-4">
      {/* Header con total */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          {isIngreso ? (
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-400" />
          )}
          <div>
            <p className="text-sm text-gray-400">Total {titulo}</p>
            <p className={cn(
              'text-xl font-bold font-mono',
              isIngreso ? 'text-emerald-400' : 'text-red-400'
            )}>
              {isIngreso ? '+' : '-'}{formatCurrency(totalMonto)}
            </p>
          </div>
        </div>
        <span className="text-sm text-gray-400">
          {filteredMovimientos.length} movimientos
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Concepto</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Referencia</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">TC</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Monto</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredMovimientos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="h-8 w-8 opacity-50" />
                    <p>No hay movimientos para mostrar</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMovimientos.slice(0, 20).map((mov, index) => (
                <motion.tr
                  key={mov.id || index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-white/5 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-sm text-gray-300">
                        {new Date(mov.fecha).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit'
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white font-medium truncate max-w-xs">
                      {mov.concepto || 'Sin concepto'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono px-2 py-1 rounded bg-white/5 text-purple-400">
                      {mov.referencia || '—'}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400">
                      —
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      'text-sm font-bold font-mono',
                      isIngreso ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {isIngreso ? '+' : '-'}{formatCurrency(Math.abs(mov.monto))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Aplicado
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 transition-all">
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
        
        {filteredMovimientos.length > 20 && (
          <div className="px-4 py-3 border-t border-white/10 bg-white/5 text-center">
            <button className="text-sm text-purple-400 hover:text-purple-300 font-medium">
              Ver todos los {filteredMovimientos.length} movimientos →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface TablaTransferenciasProps {
  transferencias: Movimiento[]
  searchQuery: string
  bancoId: BancoId
}

function TablaTransferencias({ transferencias, searchQuery, bancoId }: TablaTransferenciasProps) {
  const filteredTransferencias = transferencias.filter(t => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      t.concepto?.toLowerCase().includes(query) ||
      t.referencia?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <ArrowUpRight className="h-4 w-4" />
            <span className="text-sm">Transferencias Salientes</span>
          </div>
          <p className="text-xl font-bold text-white font-mono">
            {filteredTransferencias.filter(t => t.bancoOrigenId === bancoId).length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <ArrowDownRight className="h-4 w-4" />
            <span className="text-sm">Transferencias Entrantes</span>
          </div>
          <p className="text-xl font-bold text-white font-mono">
            {filteredTransferencias.filter(t => t.bancoDestinoId === bancoId).length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <ArrowRightLeft className="h-4 w-4" />
            <span className="text-sm">Total Transferencias</span>
          </div>
          <p className="text-xl font-bold text-white font-mono">
            {filteredTransferencias.length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Origen</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Destino</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Concepto</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Monto</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredTransferencias.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <ArrowRightLeft className="h-8 w-8 opacity-50" />
                    <p>No hay transferencias registradas</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransferencias.slice(0, 15).map((trans, index) => {
                const isOutgoing = trans.bancoOrigenId === bancoId
                const origenConfig = trans.bancoOrigenId ? BANCOS_CONFIG[trans.bancoOrigenId as keyof typeof BANCOS_CONFIG] : null
                const destinoConfig = trans.bancoDestinoId ? BANCOS_CONFIG[trans.bancoDestinoId as keyof typeof BANCOS_CONFIG] : null
                
                return (
                  <motion.tr
                    key={trans.id || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {new Date(trans.fecha).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{origenConfig?.icon || '🏦'}</span>
                        <span className="text-sm text-white">{origenConfig?.nombre || trans.bancoOrigenId || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ChevronRight className={cn(
                        'h-4 w-4 mx-auto',
                        isOutgoing ? 'text-red-400' : 'text-green-400'
                      )} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{destinoConfig?.icon || '🏦'}</span>
                        <span className="text-sm text-white">{destinoConfig?.nombre || trans.bancoDestinoId || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 truncate max-w-xs">
                      {trans.concepto || 'Transferencia entre bancos'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        'text-sm font-bold font-mono',
                        isOutgoing ? 'text-red-400' : 'text-green-400'
                      )}>
                        {isOutgoing ? '-' : '+'}{formatCurrency(Math.abs(trans.monto))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Completada
                      </span>
                    </td>
                  </motion.tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface PanelCortesProps {
  banco: Banco
  movimientos: Movimiento[]
}

function PanelCortes({ banco, movimientos }: PanelCortesProps) {
  // Generar cortes automáticos por mes
  const cortesMensuales = useMemo(() => {
    const meses: Record<string, { ingresos: number; gastos: number; movimientos: number }> = {}
    
    movimientos.forEach(m => {
      const fecha = new Date(m.fecha)
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      
      if (!meses[key]) {
        meses[key] = { ingresos: 0, gastos: 0, movimientos: 0 }
      }
      
      if (m.tipo === 'ingreso' || m.monto > 0) {
        meses[key].ingresos += Math.abs(m.monto)
      } else {
        meses[key].gastos += Math.abs(m.monto)
      }
      meses[key].movimientos++
    })
    
    return Object.entries(meses)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([periodo, data]) => ({
        periodo,
        ...data,
        balance: data.ingresos - data.gastos
      }))
  }, [movimientos])

  return (
    <div className="space-y-6">
      {/* Estado Actual del Banco */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-400" />
          Estado Actual de Cuenta
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-sm text-gray-400 mb-1">Capital Actual</p>
            <p className="text-2xl font-bold text-white font-mono">
              {formatCurrency(banco.capitalActual)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-sm text-gray-400 mb-1">Total Ingresos</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono">
              +{formatCurrency(banco.historicoIngresos)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-sm text-gray-400 mb-1">Total Gastos</p>
            <p className="text-2xl font-bold text-red-400 font-mono">
              -{formatCurrency(banco.historicoGastos)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-sm text-gray-400 mb-1">Balance</p>
            <p className={cn(
              'text-2xl font-bold font-mono',
              (banco.historicoIngresos - banco.historicoGastos) >= 0 ? 'text-blue-400' : 'text-orange-400'
            )}>
              {formatCurrency(banco.historicoIngresos - banco.historicoGastos)}
            </p>
          </div>
        </div>
      </div>

      {/* Cortes Mensuales */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Cortes Mensuales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cortesMensuales.slice(0, 6).map((corte, index) => {
            const [year, month] = corte.periodo.split('-')
            const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
            
            return (
              <motion.div
                key={corte.periodo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white capitalize">{monthName}</h4>
                  <span className="text-xs text-gray-400">{corte.movimientos} mov</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Ingresos</span>
                    <span className="text-emerald-400 font-mono">+{formatCurrency(corte.ingresos)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Gastos</span>
                    <span className="text-red-400 font-mono">-{formatCurrency(corte.gastos)}</span>
                  </div>
                  <div className="h-px bg-white/10 my-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white font-medium">Balance</span>
                    <span className={cn(
                      'font-bold font-mono',
                      corte.balance >= 0 ? 'text-blue-400' : 'text-orange-400'
                    )}>
                      {formatCurrency(corte.balance)}
                    </span>
                  </div>
                </div>
                
                <button className="mt-3 w-full py-2 rounded-lg bg-white/5 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100">
                  Ver detalle →
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3">
        <button className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          <FileText className="h-4 w-4" />
          Generar Corte Actual
        </button>
        <button className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
          <Download className="h-4 w-4" />
          Exportar PDF
        </button>
      </div>
    </div>
  )
}
