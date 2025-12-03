'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🧑‍💼 BENTO CLIENTES - Panel Unificado Premium
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Panel de gestión de clientes con sistema de diseño unificado CHRONOS.
 * Utiliza el UnifiedPanelSystem para consistencia UI/UX.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, AlertTriangle, CheckCircle2, Clock, DollarSign, Plus, TrendingUp, 
  Phone, Mail, MapPin, User, ShoppingCart, Eye, Edit2, X, Search, Filter,
  BarChart3, Activity, CreditCard, History,
} from 'lucide-react'
import {
  PanelContainer,
  PanelHeader,
  UnifiedCard,
  StatCard,
  UnifiedButton,
  UnifiedTable,
  UnifiedTabs,
  UnifiedBadge,
  ChartContainer,
  ActivityItem,
  EmptyState,
  SkeletonDashboard,
  CHRONOS_TOKENS,
  useCountUp,
  type ColorVariant,
} from '@/app/components/ui/UnifiedPanelSystem'
import { useRealtimeClientes, useRealtimeVentas } from '@/app/hooks/useRealtimeCollection'
import { CreateClienteModalPremium } from '@/app/components/modals/CreateClienteModalPremium'
import { CreateAbonoModalPremium } from '@/app/components/modals/CreateAbonoModalPremium'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import { cn } from '@/app/lib/utils'
import { logger } from '@/app/lib/utils/logger'
import type { Cliente, Venta } from '@/app/types'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface ClienteData {
  id: string
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
  totalVentas: number
  deudaTotal: number
  totalPagado: number
  numeroCompras: number
  ultimaCompra?: Date | string
  estado: 'activo' | 'inactivo'
  observaciones?: string
  [key: string]: unknown  // Index signature para compatibilidad con UnifiedTable
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const CHART_COLORS = ['#00F5FF', '#FF00AA', '#8B5CF6', '#10B981', '#F59E0B']

const TABS = [
  { id: 'todos', label: 'Todos', icon: Users },
  { id: 'activos', label: 'Activos', icon: CheckCircle2 },
  { id: 'deudores', label: 'Con Deuda', icon: AlertTriangle },
  { id: 'inactivos', label: 'Inactivos', icon: Clock },
]

// ═══════════════════════════════════════════════════════════════════════════
// MODAL DE PERFIL DE CLIENTE
// ═══════════════════════════════════════════════════════════════════════════

function ClienteProfileModal({ 
  cliente, 
  isOpen, 
  onClose,
  ventas,
}: { 
  cliente: ClienteData | null
  isOpen: boolean
  onClose: () => void
  ventas: Venta[]
}) {
  const clienteVentas = useMemo(() => {
    if (!cliente) return []
    return ventas.filter(v => v.clienteId === cliente.id)
  }, [cliente, ventas])

  const tasaCobro = useMemo(() => {
    if (!cliente) return 0
    return cliente.totalVentas > 0 
      ? Math.round((cliente.totalPagado / cliente.totalVentas) * 100) 
      : 0
  }, [cliente])

  if (!cliente) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[rgba(10,10,15,0.95)] backdrop-blur-xl border-white/[0.08] max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Perfil del Cliente</DialogTitle>
        </DialogHeader>
        
        {/* Header del Perfil */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-pink-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-white/[0.03] rounded-2xl p-6 border border-white/[0.08]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{cliente.nombre}</h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-white/50">
                    {cliente.telefono && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {cliente.telefono}
                      </span>
                    )}
                    {cliente.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {cliente.email}
                      </span>
                    )}
                  </div>
                  <UnifiedBadge 
                    variant={cliente.estado === 'activo' ? 'success' : 'default'}
                    size="sm"
                  >
                    {cliente.estado === 'activo' ? 'Cliente Activo' : 'Inactivo'}
                  </UnifiedBadge>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Compras', value: cliente.totalVentas, prefix: '$', variant: 'cyan' as const },
            { label: 'Total Pagado', value: cliente.totalPagado, prefix: '$', variant: 'emerald' as const },
            { label: 'Deuda', value: cliente.deudaTotal, prefix: '$', variant: 'rose' as const },
            { label: 'Tasa Cobro', value: tasaCobro, suffix: '%', variant: 'violet' as const },
          ].map((stat, i) => (
            <div 
              key={i}
              className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]"
            >
              <p className="text-xs text-white/40 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-white">
                {stat.prefix}{stat.value.toLocaleString()}{stat.suffix}
              </p>
            </div>
          ))}
        </div>

        {/* Historial de Compras */}
        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            Últimas Compras
          </h3>
          {clienteVentas.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {clienteVentas.slice(0, 5).map((venta, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
                >
                  <div>
                    <p className="text-sm text-white">Venta #{venta.id?.slice(-4)}</p>
                    <p className="text-xs text-white/40">
                      {venta.fecha instanceof Date 
                        ? venta.fecha.toLocaleDateString('es-MX')
                        : new Date(venta.fecha as string).toLocaleDateString('es-MX')
                      }
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">
                    ${(venta.totalVenta || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40 text-center py-4">Sin compras registradas</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function BentoClientesUnified() {
  // Estado
  const [activeTab, setActiveTab] = useState('todos')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteData | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Data
  const { data: clientesRaw = [], loading: loadingClientes, isConnected } = useRealtimeClientes()
  const { data: ventasRaw = [], loading: loadingVentas } = useRealtimeVentas()
  
  const clientes = clientesRaw as unknown as Cliente[]
  const ventas = ventasRaw as unknown as Venta[]

  // Log conexión
  useEffect(() => {
    if (isConnected) {
      logger.info(`[BentoClientes] Conectado: ${clientes.length} clientes`, { context: 'BentoClientes' })
    }
  }, [clientes.length, isConnected])

  // Procesar clientes con datos calculados
  const clientesData: ClienteData[] = useMemo(() => {
    return clientes.map(cliente => {
      const clienteVentas = ventas.filter(v => v.clienteId === cliente.id)
      const totalVentas = clienteVentas.reduce((sum, v) => sum + (v.totalVenta || v.precioTotalVenta || 0), 0)
      const totalPagado = clienteVentas.reduce((sum, v) => sum + (v.montoPagado || 0), 0)
      const deudaTotal = totalVentas - totalPagado
      const ultimaCompraRaw = clienteVentas.length > 0 
        ? clienteVentas[0].fecha 
        : undefined
      
      // Convertir FirestoreTimestamp a Date si es necesario
      const ultimaCompra = ultimaCompraRaw && typeof ultimaCompraRaw === 'object' && 'toDate' in ultimaCompraRaw
        ? ultimaCompraRaw.toDate()
        : ultimaCompraRaw as Date | string | undefined

      return {
        id: cliente.id || '',
        nombre: cliente.nombre || 'Sin nombre',
        telefono: cliente.telefono,
        email: cliente.email,
        direccion: cliente.direccion,
        totalVentas,
        deudaTotal: Math.max(0, deudaTotal),
        totalPagado,
        numeroCompras: clienteVentas.length,
        ultimaCompra,
        estado: deudaTotal > 0 ? 'activo' : (clienteVentas.length > 0 ? 'activo' : 'inactivo'),
        observaciones: cliente.observaciones,
      }
    })
  }, [clientes, ventas])

  // Filtrar por tab y búsqueda
  const filteredClientes = useMemo(() => {
    let filtered = [...clientesData]
    
    // Filtrar por tab
    switch (activeTab) {
      case 'activos':
        filtered = filtered.filter(c => c.estado === 'activo')
        break
      case 'deudores':
        filtered = filtered.filter(c => c.deudaTotal > 0)
        break
      case 'inactivos':
        filtered = filtered.filter(c => c.estado === 'inactivo')
        break
    }
    
    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c => 
        c.nombre.toLowerCase().includes(query) ||
        c.telefono?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query),
      )
    }
    
    return filtered
  }, [clientesData, activeTab, searchQuery])

  // Métricas
  const metrics = useMemo(() => {
    const totalClientes = clientesData.length
    const clientesActivos = clientesData.filter(c => c.estado === 'activo').length
    const totalDeuda = clientesData.reduce((sum, c) => sum + c.deudaTotal, 0)
    const totalVentas = clientesData.reduce((sum, c) => sum + c.totalVentas, 0)
    const clientesConDeuda = clientesData.filter(c => c.deudaTotal > 0).length
    const promedioCompras = totalClientes > 0 
      ? Math.round(totalVentas / totalClientes) 
      : 0

    return { totalClientes, clientesActivos, totalDeuda, totalVentas, clientesConDeuda, promedioCompras }
  }, [clientesData])

  // Datos para gráficos
  const pieData = useMemo(() => [
    { name: 'Activos', value: metrics.clientesActivos, color: '#10B981' },
    { name: 'Con Deuda', value: metrics.clientesConDeuda, color: '#F43F5E' },
    { name: 'Inactivos', value: metrics.totalClientes - metrics.clientesActivos, color: '#6B7280' },
  ], [metrics])

  const topClientes = useMemo(() => {
    return [...clientesData]
      .sort((a, b) => b.totalVentas - a.totalVentas)
      .slice(0, 5)
      .map(c => ({ name: c.nombre.slice(0, 15), value: c.totalVentas }))
  }, [clientesData])

  // Handlers
  const handleViewProfile = useCallback((cliente: ClienteData) => {
    setSelectedCliente(cliente)
    setIsProfileOpen(true)
  }, [])

  const handleAddAbono = useCallback((cliente: ClienteData) => {
    setSelectedCliente(cliente)
    setIsAbonoModalOpen(true)
  }, [])

  // Columnas de tabla
  const columns = useMemo(() => [
    {
      key: 'nombre',
      header: 'Cliente',
      render: (value: unknown, row: ClienteData) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
            <User className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="font-medium text-white">{row.nombre}</p>
            <p className="text-xs text-white/40">{row.telefono || 'Sin teléfono'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'totalVentas',
      header: 'Total Compras',
      render: (value: unknown) => (
        <span className="font-mono text-white">${(value as number).toLocaleString()}</span>
      ),
    },
    {
      key: 'deudaTotal',
      header: 'Deuda',
      render: (value: unknown) => {
        const deuda = value as number
        return (
          <span className={cn(
            'font-mono',
            deuda > 0 ? 'text-rose-400' : 'text-emerald-400',
          )}>
            ${deuda.toLocaleString()}
          </span>
        )
      },
    },
    {
      key: 'numeroCompras',
      header: 'Compras',
      render: (value: unknown) => (
        <UnifiedBadge variant="info" size="sm">
          {value as number} compras
        </UnifiedBadge>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (value: unknown) => (
        <UnifiedBadge 
          variant={value === 'activo' ? 'success' : 'default'}
          icon={value === 'activo' ? CheckCircle2 : Clock}
          size="sm"
        >
          {value === 'activo' ? 'Activo' : 'Inactivo'}
        </UnifiedBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (_: unknown, row: ClienteData) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleViewProfile(row) }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-cyan-400"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.deudaTotal > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleAddAbono(row) }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-emerald-400"
            >
              <CreditCard className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ], [handleViewProfile, handleAddAbono])

  // Loading
  if (loadingClientes || loadingVentas) {
    return (
      <PanelContainer>
        <SkeletonDashboard />
      </PanelContainer>
    )
  }

  return (
    <PanelContainer>
      {/* Header */}
      <PanelHeader
        title="Gestión de Clientes"
        subtitle="CRM integrado con análisis de cartera"
        icon={Users}
        variant="cyan"
        badge={`${metrics.totalClientes} clientes`}
        actions={
          <UnifiedButton
            variant="primary"
            icon={Plus}
            onClick={() => setIsCreateModalOpen(true)}
            colorVariant="cyan"
          >
            Nuevo Cliente
          </UnifiedButton>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Clientes"
          value={metrics.totalClientes}
          icon={Users}
          variant="cyan"
          trend={8.5}
          sparklineData={[45, 52, 48, 55, 60, 58, 65]}
          index={0}
        />
        <StatCard
          title="Clientes Activos"
          value={metrics.clientesActivos}
          icon={CheckCircle2}
          variant="emerald"
          trend={12.3}
          sparklineData={[30, 35, 38, 42, 45, 48, 52]}
          index={1}
        />
        <StatCard
          title="Total en Ventas"
          value={metrics.totalVentas}
          prefix="$"
          icon={DollarSign}
          variant="violet"
          trend={15.7}
          sparklineData={[80, 95, 88, 102, 110, 118, 125]}
          index={2}
        />
        <StatCard
          title="Cartera Vencida"
          value={metrics.totalDeuda}
          prefix="$"
          icon={AlertTriangle}
          variant="rose"
          trend={-5.2}
          sparklineData={[50, 48, 52, 45, 42, 38, 35]}
          index={3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución de Clientes */}
        <ChartContainer
          title="Distribución"
          subtitle="Estado de clientes"
          icon={Activity}
          variant="cyan"
          height={220}
        >
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
                contentStyle={{
                  background: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-white/50">{item.name}</span>
              </div>
            ))}
          </div>
        </ChartContainer>

        {/* Top Clientes */}
        <div className="lg:col-span-2">
          <ChartContainer
            title="Top Clientes"
            subtitle="Por volumen de compras"
            icon={BarChart3}
            variant="violet"
            height={220}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topClientes} layout="vertical">
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100}
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
              />
              <Bar 
                dataKey="value" 
                fill="url(#barGradient)"
                radius={[0, 8, 8, 0]}
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#00F5FF" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <UnifiedTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="cyan"
        />
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30"
          />
        </div>
      </div>

      {/* Table */}
      <UnifiedCard padding="lg" hover={false}>
        {filteredClientes.length > 0 ? (
          <UnifiedTable
            data={filteredClientes}
            columns={columns}
            onRowClick={handleViewProfile}
            variant="cyan"
          />
        ) : (
          <EmptyState
            icon={Users}
            title="No hay clientes"
            description={searchQuery 
              ? `No se encontraron clientes con "${searchQuery}"`
              : 'Aún no tienes clientes registrados'
            }
            action={{
              label: 'Agregar Cliente',
              onClick: () => setIsCreateModalOpen(true),
            }}
            variant="cyan"
          />
        )}
      </UnifiedCard>

      {/* Modales */}
      <CreateClienteModalPremium
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {selectedCliente && (
        <CreateAbonoModalPremium
          open={isAbonoModalOpen}
          onClose={() => {
            setIsAbonoModalOpen(false)
            setSelectedCliente(null)
          }}
          preselectedCliente={{
            id: selectedCliente.id,
            nombre: selectedCliente.nombre,
            deuda: selectedCliente.deudaTotal,
            abonos: selectedCliente.totalPagado,
            pendiente: selectedCliente.deudaTotal,
          }}
        />
      )}

      <ClienteProfileModal
        cliente={selectedCliente}
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false)
          setSelectedCliente(null)
        }}
        ventas={ventas}
      />
    </PanelContainer>
  )
}
