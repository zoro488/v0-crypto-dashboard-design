'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, AlertTriangle, CheckCircle2, Clock, DollarSign, Plus, TrendingUp, 
  BarChart3, Activity, Zap, Phone, Mail, MapPin, Calendar, FileText,
  X, Edit2, Eye, History, CreditCard, User, ShoppingCart,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { useClientes, useVentas } from '@/app/lib/firebase/firestore-hooks.service'
import { useFirestoreCRUD } from '@/app/hooks/useFirestoreCRUD'
import { CreateClienteModalPremium } from '@/app/components/modals/CreateClienteModalPremium'
import { CreateAbonoModalPremium } from '@/app/components/modals/CreateAbonoModalPremium'
import { Skeleton } from '@/app/components/ui/skeleton'
import { AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { SafeChartContainer, SAFE_ANIMATION_PROPS, SAFE_PIE_PROPS } from '@/app/components/ui/SafeChartContainer'
import { QuickStatWidget } from '@/app/components/widgets/QuickStatWidget'
import { MiniChartWidget } from '@/app/components/widgets/MiniChartWidget'
import { ActivityFeedWidget, ActivityItem } from '@/app/components/widgets/ActivityFeedWidget'
import { PremiumDataTable, Column, STATUS_CONFIGS } from '@/app/components/ui/PremiumDataTable'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Cliente, Venta } from '@/app/types'
import { cn } from '@/app/lib/utils'
import { logger } from '@/app/lib/utils/logger'
import { toast } from 'sonner'

// ============================================
// Types
// ============================================

interface ClienteData extends Record<string, unknown> {
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
}

interface ClienteProfileModalProps {
  cliente: ClienteData | null
  isOpen: boolean
  onClose: () => void
  onEdit: (cliente: ClienteData) => void
  ventas: Venta[]
}

// ============================================
// Client Profile Modal Component
// ============================================

function ClienteProfileModal({ cliente, isOpen, onClose, onEdit, ventas }: ClienteProfileModalProps) {
  // Calculamos los datos del cliente - hooks deben estar antes de cualquier return
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

  // Datos para mini gráficos del perfil
  const ventasPorMes = useMemo(() => {
    const meses: Record<string, number> = {}
    clienteVentas.forEach(v => {
      const fecha = v.fecha instanceof Date ? v.fecha : new Date(v.fecha as string)
      const mes = fecha.toLocaleDateString('es-MX', { month: 'short' })
      meses[mes] = (meses[mes] || 0) + (v.totalVenta || 0)
    })
    return Object.entries(meses).map(([name, value]) => ({ name, value }))
  }, [clienteVentas])

  if (!cliente) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-900/95 backdrop-blur-xl border-zinc-800/50 max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Perfil del Cliente</DialogTitle>
        </DialogHeader>
        
        {/* Header del Perfil */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-zinc-800/50 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center border border-cyan-500/20">
                  <User className="w-10 h-10 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{cliente.nombre}</h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
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
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'mt-2',
                      cliente.estado === 'activo' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
                    )}
                  >
                    {cliente.estado === 'activo' ? 'Cliente Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(cliente)}
                  className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas del Cliente */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              Total Compras
            </div>
            <div className="text-2xl font-bold text-white">
              ${cliente.totalVentas.toLocaleString()}
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Total Pagado
            </div>
            <div className="text-2xl font-bold text-green-400">
              ${cliente.totalPagado.toLocaleString()}
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Adeudo
            </div>
            <div className="text-2xl font-bold text-orange-400">
              ${cliente.deudaTotal.toLocaleString()}
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <ShoppingCart className="w-4 h-4 text-purple-400" />
              # Compras
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {cliente.numeroCompras || clienteVentas.length}
            </div>
          </div>
        </div>

        {/* Tabs con detalles */}
        <Tabs defaultValue="ventas" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800/50">
            <TabsTrigger value="ventas" className="data-[state=active]:bg-cyan-500/20">
              <History className="w-4 h-4 mr-2" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="estadisticas" className="data-[state=active]:bg-cyan-500/20">
              <BarChart3 className="w-4 h-4 mr-2" />
              Estadísticas
            </TabsTrigger>
            <TabsTrigger value="info" className="data-[state=active]:bg-cyan-500/20">
              <FileText className="w-4 h-4 mr-2" />
              Información
            </TabsTrigger>
          </TabsList>

          {/* Tab Ventas */}
          <TabsContent value="ventas" className="mt-4">
            <div className="bg-zinc-800/30 rounded-xl p-4 max-h-64 overflow-auto">
              {clienteVentas.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay ventas registradas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clienteVentas.slice(0, 10).map((venta, idx) => (
                    <div 
                      key={venta.id || idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          venta.estadoPago === 'completo' ? 'bg-green-400' :
                          venta.estadoPago === 'parcial' ? 'bg-yellow-400' : 'bg-red-400',
                        )} />
                        <div>
                          <div className="font-medium text-white text-sm">
                            {venta.cantidad} unidades - ${venta.totalVenta?.toLocaleString()}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {venta.fecha instanceof Date 
                              ? venta.fecha.toLocaleDateString('es-MX')
                              : new Date(venta.fecha as string).toLocaleDateString('es-MX')
                            }
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn(
                        'text-xs',
                        venta.estadoPago === 'completo' 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : venta.estadoPago === 'parcial'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20',
                      )}>
                        {venta.estadoPago || 'pendiente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab Estadísticas */}
          <TabsContent value="estadisticas" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-800/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-zinc-400 mb-3">Ventas por Mes</h4>
                <SafeChartContainer height={120} minHeight={100}>
                  <BarChart data={ventasPorMes.length > 0 ? ventasPorMes : [{ name: 'Sin datos', value: 0 }]}>
                    <XAxis dataKey="name" stroke="#fff" opacity={0.3} fontSize={10} />
                    <YAxis stroke="#fff" opacity={0.3} fontSize={10} />
                    <Tooltip 
                      contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '8px' }}
                      formatter={(v: number) => [`$${v.toLocaleString()}`, 'Ventas']}
                    />
                    <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} {...SAFE_ANIMATION_PROPS} />
                  </BarChart>
                </SafeChartContainer>
              </div>
              <div className="bg-zinc-800/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-zinc-400 mb-3">Tasa de Cobro</h4>
                <div className="flex items-center justify-center h-[120px]">
                  <div className="relative">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-zinc-700"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${tasaCobro * 2.51} 251`}
                        className="text-cyan-400"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
                      {tasaCobro}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab Info */}
          <TabsContent value="info" className="mt-4">
            <div className="bg-zinc-800/30 rounded-xl p-4 space-y-4">
              {cliente.direccion && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-zinc-400">Dirección</div>
                    <div className="text-white">{cliente.direccion}</div>
                  </div>
                </div>
              )}
              {cliente.ultimaCompra && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-zinc-400">Última Compra</div>
                    <div className="text-white">
                      {cliente.ultimaCompra instanceof Date 
                        ? cliente.ultimaCompra.toLocaleDateString('es-MX')
                        : new Date(cliente.ultimaCompra).toLocaleDateString('es-MX')
                      }
                    </div>
                  </div>
                </div>
              )}
              {cliente.observaciones && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-zinc-400">Observaciones</div>
                    <div className="text-white">{cliente.observaciones}</div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-cyan-400 mt-0.5" />
                <div>
                  <div className="text-sm text-zinc-400">ID Cliente</div>
                  <div className="text-white font-mono text-sm">{cliente.id}</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// Main Component
// ============================================

export default function BentoClientesPremium() {
  // State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAbonoModal, setShowAbonoModal] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteData | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Data hooks
  const { data: clientesRaw, loading, remove } = useFirestoreCRUD<Cliente>('clientes')
  const { data: ventasRaw } = useVentas()
  
  // Transform data
  const clientes = useMemo(() => {
    return (clientesRaw || []).map(c => ({
      id: c.id || '',
      nombre: c.nombre || '',
      telefono: c.telefono,
      email: c.email,
      direccion: c.direccion,
      totalVentas: c.totalVentas || 0,
      deudaTotal: c.deudaTotal || c.deuda || 0,
      totalPagado: c.totalPagado || c.abonos || 0,
      numeroCompras: c.numeroCompras || 0,
      ultimaCompra: c.ultimaCompra,
      estado: c.estado || 'activo',
      observaciones: c.observaciones,
    } as ClienteData))
  }, [clientesRaw])

  const ventas = (ventasRaw || []) as Venta[]

  // Stats
  const totalDeuda = clientes.reduce((acc, c) => acc + c.deudaTotal, 0)
  const totalVentas = clientes.reduce((acc, c) => acc + c.totalVentas, 0)
  const totalCobrado = clientes.reduce((acc, c) => acc + c.totalPagado, 0)
  const clientesPendientes = clientes.filter((c) => c.deudaTotal > 0).length

  // Trend data
  const trendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => ({
      name: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i],
      ventas: Math.floor(Math.random() * 50000) + 30000,
      cobros: Math.floor(Math.random() * 40000) + 20000,
    }))
  }, [])

  // Status distribution
  const clientesPorEstado = useMemo(() => {
    const saldados = clientes.filter(c => c.deudaTotal === 0).length
    return [
      { name: 'Saldados', value: saldados, color: '#10b981' },
      { name: 'Pendientes', value: clientesPendientes, color: '#f59e0b' },
    ]
  }, [clientes, clientesPendientes])

  // Recent activity
  const recentActivity: ActivityItem[] = useMemo(() => {
    return clientes
      .sort((a, b) => b.totalVentas - a.totalVentas)
      .slice(0, 4)
      .map((c, i) => ({
        id: c.id,
        type: 'cliente' as const,
        title: c.nombre,
        description: `Ventas: $${(c.totalVentas / 1000).toFixed(0)}K | Adeudo: $${(c.deudaTotal / 1000).toFixed(0)}K`,
        timestamp: new Date(Date.now() - i * 3600000),
        status: (c.deudaTotal > 0 ? 'pending' : 'success') as 'pending' | 'success',
      }))
  }, [clientes])

  // Table columns
  const columns: Column<ClienteData>[] = useMemo(() => [
    {
      key: 'nombre',
      header: 'Cliente',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="font-medium text-white">{row.nombre}</div>
            <div className="text-xs text-zinc-500">{row.telefono || row.email || row.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'totalVentas',
      header: 'Total Ventas',
      type: 'currency',
      sortable: true,
      align: 'right',
    },
    {
      key: 'deudaTotal',
      header: 'Adeudo',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className={cn('font-mono', row.deudaTotal > 0 ? 'text-red-400' : 'text-green-400')}>
          ${row.deudaTotal.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'totalPagado',
      header: 'Pagado',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-mono text-green-400">
          ${row.totalPagado.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      align: 'center',
      render: (row) => (
        row.deudaTotal === 0 ? (
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Saldado
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        )
      ),
    },
  ], [])

  // Handlers
  const handleView = useCallback((cliente: ClienteData) => {
    setSelectedCliente(cliente)
    setShowProfile(true)
  }, [])

  const handleEdit = useCallback((cliente: ClienteData) => {
    setSelectedCliente(cliente)
    setShowEditModal(true)
    logger.info('Editando cliente', { context: 'BentoClientes', data: { id: cliente.id, nombre: cliente.nombre } })
  }, [])

  const handleDelete = useCallback(async (cliente: ClienteData) => {
    try {
      await remove(cliente.id)
      toast.success(`Cliente "${cliente.nombre}" eliminado`)
      logger.info('Cliente eliminado', { context: 'BentoClientes', data: { id: cliente.id } })
    } catch (error) {
      logger.error('Error al eliminar cliente', error)
      toast.error('Error al eliminar el cliente')
    }
  }, [remove])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] p-6 space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-xl" />
            <Users className="w-12 h-12 text-cyan-400 relative" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Clientes Premium
            </h1>
            <p className="text-zinc-400 text-sm">Gestión completa de cartera y adeudos</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowAbonoModal(true)}
            variant="outline"
            className="border-green-500/20 hover:bg-green-500/10 text-green-400"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Registrar Abono
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </motion.div>

      {/* KPIs Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStatWidget
          title="Total Ventas"
          value={totalVentas}
          prefix="$"
          change={18.5}
          icon={DollarSign}
          color="cyan"
          sparklineData={trendData.map(d => d.ventas)}
          delay={0.1}
        />
        <QuickStatWidget
          title="Por Cobrar"
          value={totalDeuda}
          prefix="$"
          change={-5.2}
          icon={AlertTriangle}
          color="orange"
          sparklineData={trendData.map(d => d.ventas - d.cobros)}
          delay={0.2}
        />
        <QuickStatWidget
          title="Cobrado"
          value={totalCobrado}
          prefix="$"
          change={22.3}
          icon={CheckCircle2}
          color="green"
          sparklineData={trendData.map(d => d.cobros)}
          delay={0.3}
        />
        <QuickStatWidget
          title="Total Clientes"
          value={clientes.length}
          change={8.1}
          icon={Users}
          color="purple"
          sparklineData={[20, 25, 28, 30, 29, 31, clientes.length]}
          delay={0.4}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Ventas vs Cobros</h3>
                  <p className="text-xs text-zinc-400">Últimos 7 días</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                <Activity className="w-3 h-3 mr-1" /> En vivo
              </Badge>
            </div>
            <SafeChartContainer height={220} minHeight={180}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorVentasCP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCobrosP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#fff" opacity={0.3} fontSize={11} />
                <YAxis stroke="#fff" opacity={0.3} fontSize={11} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="ventas" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorVentasCP)" name="Ventas" {...SAFE_ANIMATION_PROPS} />
                <Area type="monotone" dataKey="cobros" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCobrosP)" name="Cobros" {...SAFE_ANIMATION_PROPS} />
              </AreaChart>
            </SafeChartContainer>
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-500/5 rounded-2xl blur-xl" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-violet-500/20">
                <BarChart3 className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Estado Cartera</h3>
                <p className="text-xs text-zinc-400">Por adeudo</p>
              </div>
            </div>
            <SafeChartContainer height={150} minHeight={120}>
              <PieChart>
                <Pie
                  data={clientesPorEstado}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={4}
                  dataKey="value"
                  {...SAFE_PIE_PROPS}
                >
                  {clientesPorEstado.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </SafeChartContainer>
            <div className="flex justify-center gap-6 mt-2">
              {clientesPorEstado.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-white/70">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Activity & Mini Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityFeedWidget
          title="Actividad de Clientes"
          activities={recentActivity}
          maxItems={4}
        />
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <MiniChartWidget
            title="Tasa de Cobro"
            subtitle={`${Math.round((totalCobrado / Math.max(totalVentas, 1)) * 100)}%`}
            type="donut"
            data={[{ name: 'Cobrado', value: totalCobrado }, { name: 'Pendiente', value: totalDeuda }]}
            color="green"
          />
          <MiniChartWidget
            title="Promedio por Cliente"
            subtitle={`$${clientes.length ? Math.round(totalVentas / clientes.length).toLocaleString() : 0}`}
            type="area"
            data={trendData.map(d => ({ name: d.name, value: d.ventas / 30 }))}
            color="cyan"
          />
          <MiniChartWidget
            title="Clientes con Deuda"
            subtitle={`${clientesPendientes} clientes`}
            type="bar"
            data={[{ name: 'Con deuda', value: clientesPendientes }, { name: 'Sin deuda', value: clientes.length - clientesPendientes }]}
            color="orange"
          />
          <MiniChartWidget
            title="Retención"
            subtitle="94%"
            type="line"
            data={trendData.map((d, i) => ({ name: d.name, value: 90 + Math.random() * 8 }))}
            color="purple"
          />
        </div>
      </div>

      {/* Premium Data Table */}
      <PremiumDataTable
        data={clientes}
        columns={columns}
        title="Directorio de Clientes"
        subtitle={`${clientes.length} clientes registrados`}
        icon={Users}
        color="cyan"
        onAdd={() => setShowCreateModal(true)}
        addLabel="Nuevo Cliente"
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Buscar cliente..."
        pageSize={10}
        showPagination
        showSearch
        emptyMessage="No hay clientes registrados"
        emptyIcon={Users}
      />

      {/* Modals */}
      <CreateClienteModalPremium 
        open={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      <CreateAbonoModalPremium 
        open={showAbonoModal} 
        onClose={() => setShowAbonoModal(false)} 
      />
      <ClienteProfileModal
        cliente={selectedCliente}
        isOpen={showProfile}
        onClose={() => {
          setShowProfile(false)
          setSelectedCliente(null)
        }}
        onEdit={(c) => {
          setShowProfile(false)
          handleEdit(c)
        }}
        ventas={ventas}
      />
    </div>
  )
}
