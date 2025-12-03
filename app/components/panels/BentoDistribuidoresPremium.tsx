'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, AlertCircle, CheckCircle2, Clock, DollarSign, Plus, TrendingUp, 
  BarChart3, Activity, Package, Phone, Mail, MapPin, Calendar, FileText,
  X, Edit2, Eye, History, CreditCard, Truck, ShoppingBag,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { ButtonUltra } from '@/app/components/ui/ButtonUltra'
import { Badge } from '@/app/components/ui/badge'
import { useRealtimeDistribuidores, useRealtimeOrdenesCompra } from '@/app/hooks/useRealtimeCollection'
import { useFirestoreCRUD } from '@/app/hooks/useFirestoreCRUD'
import {
  AnimatedCounter,
  GlowButton,
  Tilt3D,
  SkeletonTable,
  haptic,
} from '@/app/components/ui/microinteractions'
import { CreateDistribuidorModalPremium } from '@/app/components/modals/CreateDistribuidorModalPremium'
import { CreatePagoDistribuidorModalPremium } from '@/app/components/modals/CreatePagoDistribuidorModalPremium'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert'
import { AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { SafeChartContainer, SAFE_ANIMATION_PROPS, SAFE_PIE_PROPS } from '@/app/components/ui/SafeChartContainer'
import { QuickStatWidget } from '@/app/components/widgets/QuickStatWidget'
import { MiniChartWidget } from '@/app/components/widgets/MiniChartWidget'
import { ActivityFeedWidget, ActivityItem } from '@/app/components/widgets/ActivityFeedWidget'
import { PremiumDataTable, Column } from '@/app/components/ui/PremiumDataTable'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Distribuidor, OrdenCompra } from '@/app/types'
import { cn } from '@/app/lib/utils'
import { logger } from '@/app/lib/utils/logger'

// ═══════════════════════════════════════════════════════════════════════════
// 🌑 OBSIDIAN GLASS PREMIUM COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
import EntityRelationshipManager from '@/app/components/premium/crm/EntityRelationshipManager'
import { toast } from 'sonner'

// ============================================
// Types
// ============================================

interface DistribuidorData extends Record<string, unknown> {
  id: string
  nombre: string
  empresa?: string
  contacto?: string
  telefono?: string
  email?: string
  direccion?: string
  totalOrdenesCompra: number
  deudaTotal: number
  totalPagado: number
  numeroOrdenes: number
  ultimaOrden?: Date | string
  estado: 'activo' | 'inactivo' | 'suspendido'
  ordenesActivas?: OrdenCompra[]
}

interface DistribuidorProfileModalProps {
  distribuidor: DistribuidorData | null
  isOpen: boolean
  onClose: () => void
  onEdit: (distribuidor: DistribuidorData) => void
  ordenes: OrdenCompra[]
}

// ============================================
// Distribuidor Profile Modal Component
// ============================================

function DistribuidorProfileModal({ distribuidor, isOpen, onClose, onEdit, ordenes }: DistribuidorProfileModalProps) {
  // Hooks deben estar antes de cualquier return condicional
  const distribuidorOrdenes = useMemo(() => {
    if (!distribuidor) return []
    return ordenes.filter(o => o.distribuidorId === distribuidor.id)
  }, [distribuidor, ordenes])

  const tasaPago = useMemo(() => {
    if (!distribuidor) return 0
    return distribuidor.totalOrdenesCompra > 0 
      ? Math.round((distribuidor.totalPagado / distribuidor.totalOrdenesCompra) * 100) 
      : 0
  }, [distribuidor])

  // Datos para mini gráficos
  const ordenesPorMes = useMemo(() => {
    const meses: Record<string, number> = {}
    distribuidorOrdenes.forEach(o => {
      const fecha = o.fecha instanceof Date ? o.fecha : new Date(o.fecha as string)
      const mes = fecha.toLocaleDateString('es-MX', { month: 'short' })
      meses[mes] = (meses[mes] || 0) + (o.costoTotal || 0)
    })
    return Object.entries(meses).map(([name, value]) => ({ name, value }))
  }, [distribuidorOrdenes])

  const stockData = useMemo(() => {
    return distribuidorOrdenes.slice(0, 5).map(o => ({
      name: o.id?.slice(-4) || 'OC',
      stock: o.stockActual || 0,
      inicial: o.stockInicial || o.cantidad || 0,
    }))
  }, [distribuidorOrdenes])

  if (!distribuidor) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-900/95 backdrop-blur-xl border-zinc-800/50 max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Perfil del Distribuidor</DialogTitle>
        </DialogHeader>
        
        {/* Header del Perfil */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-zinc-800/50 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center border border-purple-500/20">
                  <Building2 className="w-10 h-10 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{distribuidor.nombre}</h2>
                  {distribuidor.empresa && (
                    <p className="text-sm text-zinc-400">{distribuidor.empresa}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
                    {distribuidor.telefono && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {distribuidor.telefono}
                      </span>
                    )}
                    {distribuidor.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {distribuidor.email}
                      </span>
                    )}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'mt-2',
                      distribuidor.estado === 'activo' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : distribuidor.estado === 'suspendido'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
                    )}
                  >
                    {distribuidor.estado === 'activo' ? 'Proveedor Activo' : 
                     distribuidor.estado === 'suspendido' ? 'Suspendido' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <ButtonUltra
                  variant="glass"
                  size="sm"
                  onClick={() => onEdit(distribuidor)}
                  icon={Edit2}
                >
                  Editar
                </ButtonUltra>
                <ButtonUltra
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  icon={X}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas del Distribuidor */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <DollarSign className="w-4 h-4 text-purple-400" />
              Total Compras
            </div>
            <div className="text-2xl font-bold text-white">
              ${distribuidor.totalOrdenesCompra.toLocaleString()}
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Total Pagado
            </div>
            <div className="text-2xl font-bold text-green-400">
              ${distribuidor.totalPagado.toLocaleString()}
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              Adeudo
            </div>
            <div className="text-2xl font-bold text-orange-400">
              ${distribuidor.deudaTotal.toLocaleString()}
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <Package className="w-4 h-4 text-cyan-400" />
              # Órdenes
            </div>
            <div className="text-2xl font-bold text-cyan-400">
              {distribuidor.numeroOrdenes || distribuidorOrdenes.length}
            </div>
          </div>
        </div>

        {/* Tabs con detalles */}
        <Tabs defaultValue="ordenes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800/50">
            <TabsTrigger value="ordenes" className="data-[state=active]:bg-purple-500/20">
              <History className="w-4 h-4 mr-2" />
              Órdenes
            </TabsTrigger>
            <TabsTrigger value="estadisticas" className="data-[state=active]:bg-purple-500/20">
              <BarChart3 className="w-4 h-4 mr-2" />
              Estadísticas
            </TabsTrigger>
            <TabsTrigger value="info" className="data-[state=active]:bg-purple-500/20">
              <FileText className="w-4 h-4 mr-2" />
              Información
            </TabsTrigger>
          </TabsList>

          {/* Tab Órdenes */}
          <TabsContent value="ordenes" className="mt-4">
            <div className="bg-zinc-800/30 rounded-xl p-4 max-h-64 overflow-auto">
              {distribuidorOrdenes.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay órdenes registradas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {distribuidorOrdenes.slice(0, 10).map((orden, idx) => (
                    <div 
                      key={orden.id || idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          orden.estado === 'pagado' ? 'bg-green-400' :
                          orden.estado === 'parcial' ? 'bg-yellow-400' : 'bg-red-400',
                        )} />
                        <div>
                          <div className="font-medium text-white text-sm">
                            {orden.id} - {orden.cantidad} unidades - ${orden.costoTotal?.toLocaleString()}
                          </div>
                          <div className="text-xs text-zinc-500 flex items-center gap-2">
                            <span>
                              {orden.fecha instanceof Date 
                                ? orden.fecha.toLocaleDateString('es-MX')
                                : new Date(orden.fecha as string).toLocaleDateString('es-MX')
                              }
                            </span>
                            <span className="text-cyan-400">
                              Stock: {orden.stockActual || 0}/{orden.stockInicial || orden.cantidad}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn(
                        'text-xs',
                        orden.estado === 'pagado' 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : orden.estado === 'parcial'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20',
                      )}>
                        {orden.estado || 'pendiente'}
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
                <h4 className="text-sm font-medium text-zinc-400 mb-3">Compras por Mes</h4>
                <SafeChartContainer height={120} minHeight={100}>
                  <BarChart data={ordenesPorMes.length > 0 ? ordenesPorMes : [{ name: 'Sin datos', value: 0 }]}>
                    <XAxis dataKey="name" stroke="#fff" opacity={0.3} fontSize={10} />
                    <YAxis stroke="#fff" opacity={0.3} fontSize={10} />
                    <Tooltip 
                      contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '8px' }}
                      formatter={(v: number) => [`$${v.toLocaleString()}`, 'Compras']}
                    />
                    <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} {...SAFE_ANIMATION_PROPS} />
                  </BarChart>
                </SafeChartContainer>
              </div>
              <div className="bg-zinc-800/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-zinc-400 mb-3">Tasa de Pago</h4>
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
                        strokeDasharray={`${tasaPago * 2.51} 251`}
                        className="text-purple-400"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
                      {tasaPago}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Stock por OC */}
            <div className="bg-zinc-800/30 rounded-xl p-4 mt-4">
              <h4 className="text-sm font-medium text-zinc-400 mb-3">Stock por Orden</h4>
              <SafeChartContainer height={120} minHeight={100}>
                <BarChart data={stockData.length > 0 ? stockData : [{ name: 'N/A', stock: 0, inicial: 0 }]}>
                  <XAxis dataKey="name" stroke="#fff" opacity={0.3} fontSize={10} />
                  <YAxis stroke="#fff" opacity={0.3} fontSize={10} />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '8px' }}
                  />
                  <Bar dataKey="inicial" fill="#3b82f6" name="Inicial" radius={[4, 4, 0, 0]} {...SAFE_ANIMATION_PROPS} />
                  <Bar dataKey="stock" fill="#06b6d4" name="Actual" radius={[4, 4, 0, 0]} {...SAFE_ANIMATION_PROPS} />
                </BarChart>
              </SafeChartContainer>
            </div>
          </TabsContent>

          {/* Tab Info */}
          <TabsContent value="info" className="mt-4">
            <div className="bg-zinc-800/30 rounded-xl p-4 space-y-4">
              {distribuidor.contacto && (
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-zinc-400">Contacto</div>
                    <div className="text-white">{distribuidor.contacto}</div>
                  </div>
                </div>
              )}
              {distribuidor.direccion && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-zinc-400">Dirección</div>
                    <div className="text-white">{distribuidor.direccion}</div>
                  </div>
                </div>
              )}
              {distribuidor.ultimaOrden && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-zinc-400">Última Orden</div>
                    <div className="text-white">
                      {distribuidor.ultimaOrden instanceof Date 
                        ? distribuidor.ultimaOrden.toLocaleDateString('es-MX')
                        : new Date(distribuidor.ultimaOrden).toLocaleDateString('es-MX')
                      }
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <div className="text-sm text-zinc-400">ID Distribuidor</div>
                  <div className="text-white font-mono text-sm">{distribuidor.id}</div>
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

export default function BentoDistribuidoresPremium() {
  // State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [selectedDistribuidor, setSelectedDistribuidor] = useState<DistribuidorData | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [internalLoading, setInternalLoading] = useState(true)

  // Data hooks - TIEMPO REAL
  const { data: distribuidoresRaw, loading: loadingDist, error: errorDist, remove } = useFirestoreCRUD<Distribuidor>('distribuidores')
  const { data: ordenesCompraRaw = [], loading: loadingOC, error: errorOC, isConnected } = useRealtimeOrdenesCompra()

  // Log para verificar tiempo real
  useEffect(() => {
    if (isConnected) {
      logger.info(`[BentoDistribuidoresPremium] Conectado en tiempo real: ${distribuidoresRaw.length} distribuidores, ${ordenesCompraRaw.length} OC`, { context: 'BentoDistribuidoresPremium' })
    }
  }, [distribuidoresRaw.length, ordenesCompraRaw.length, isConnected])

  // Loading timeout
  useEffect(() => {
    if (!loadingDist && !loadingOC) {
      setInternalLoading(false)
    }
    const timer = setTimeout(() => setInternalLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [loadingDist, loadingOC])

  const isLoading = internalLoading || (loadingDist && loadingOC)

  // Transform data
  const distribuidores = useMemo(() => {
    return (distribuidoresRaw || []).map(d => ({
      id: d.id || '',
      nombre: d.nombre || '',
      empresa: d.empresa,
      contacto: d.contacto,
      telefono: d.telefono,
      email: d.email,
      direccion: d.direccion,
      totalOrdenesCompra: d.totalOrdenesCompra || d.costoTotal || 0,
      deudaTotal: d.deudaTotal || d.pendiente || 0,
      totalPagado: d.totalPagado || d.abonos || 0,
      numeroOrdenes: d.numeroOrdenes || 0,
      ultimaOrden: d.ultimaOrden,
      estado: d.estado || 'activo',
      ordenesActivas: d.ordenesActivas,
    } as DistribuidorData))
  }, [distribuidoresRaw])

  // Cast seguro: ordenesCompraRaw tiene propiedades parciales, usamos unknown como paso intermedio
  const ordenes = (ordenesCompraRaw || []) as unknown as OrdenCompra[]

  // Stats
  const totalDeuda = distribuidores.reduce((acc, d) => acc + d.deudaTotal, 0)
  const totalOrdenesCompra = distribuidores.reduce((acc, d) => acc + d.totalOrdenesCompra, 0)
  const totalPagado = distribuidores.reduce((acc, d) => acc + d.totalPagado, 0)
  const distribuidoresPendientes = distribuidores.filter((d) => d.deudaTotal > 0).length

  // Trend data
  const trendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => ({
      name: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i],
      compras: Math.floor(Math.random() * 80000) + 40000,
      pagos: Math.floor(Math.random() * 60000) + 20000,
    }))
  }, [])

  // Status distribution
  const distribuidoresPorEstado = useMemo(() => {
    const saldados = distribuidores.filter(d => d.deudaTotal === 0).length
    return [
      { name: 'Saldados', value: saldados, color: '#10b981' },
      { name: 'Pendientes', value: distribuidoresPendientes, color: '#f59e0b' },
    ]
  }, [distribuidores, distribuidoresPendientes])

  // Recent activity
  const recentActivity: ActivityItem[] = useMemo(() => {
    return distribuidores
      .sort((a, b) => b.totalOrdenesCompra - a.totalOrdenesCompra)
      .slice(0, 4)
      .map((d, i) => ({
        id: d.id,
        type: 'compra' as const,
        title: d.nombre,
        description: `Compras: $${(d.totalOrdenesCompra / 1000).toFixed(0)}K | Deuda: $${(d.deudaTotal / 1000).toFixed(0)}K`,
        timestamp: new Date(Date.now() - i * 3600000),
        status: (d.deudaTotal > 0 ? 'pending' : 'success') as 'pending' | 'success',
      }))
  }, [distribuidores])

  // Table columns
  const columns: Column<DistribuidorData>[] = useMemo(() => [
    {
      key: 'nombre',
      header: 'Distribuidor',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="font-medium text-white">{row.nombre}</div>
            <div className="text-xs text-zinc-500">{row.empresa || row.contacto || row.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'totalOrdenesCompra',
      header: 'Total Compras',
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
      key: 'numeroOrdenes',
      header: 'Órdenes',
      align: 'center',
      render: (row) => (
        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
          {row.numeroOrdenes || 0}
        </Badge>
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
  const handleView = useCallback((distribuidor: DistribuidorData) => {
    setSelectedDistribuidor(distribuidor)
    setShowProfile(true)
  }, [])

  const handleEdit = useCallback((distribuidor: DistribuidorData) => {
    setSelectedDistribuidor(distribuidor)
    setShowEditModal(true)
    logger.info('Editando distribuidor', { context: 'BentoDistribuidores', data: { id: distribuidor.id, nombre: distribuidor.nombre } })
  }, [])

  const handleDelete = useCallback(async (distribuidor: DistribuidorData) => {
    try {
      await remove(distribuidor.id)
      toast.success(`Distribuidor "${distribuidor.nombre}" eliminado`)
      logger.info('Distribuidor eliminado', { context: 'BentoDistribuidores', data: { id: distribuidor.id } })
    } catch (error) {
      logger.error('Error al eliminar distribuidor', error)
      toast.error('Error al eliminar el distribuidor')
    }
  }, [remove])

  // Loading state
  if (isLoading) {
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
      {/* Error Alert */}
      {(errorDist || errorOC) && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <Alert variant="destructive" className="bg-red-900/20 border-red-900/50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de conexión</AlertTitle>
            <AlertDescription>
              No se pudieron cargar algunos datos. Verifique las reglas de Firestore.
            </AlertDescription>
          </Alert>
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
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl" />
            <Building2 className="w-12 h-12 text-purple-400 relative" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Distribuidores Premium
            </h1>
            <p className="text-zinc-400 text-sm">Gestión completa de proveedores y órdenes</p>
          </div>
        </div>
        <div className="flex gap-3">
          <ButtonUltra
            onClick={() => setShowPagoModal(true)}
            variant="success"
            icon={DollarSign}
            glow
          >
            Registrar Pago
          </ButtonUltra>
          <ButtonUltra
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            icon={Plus}
            glow
            pulse
          >
            Nuevo Distribuidor
          </ButtonUltra>
        </div>
      </motion.div>

      {/* KPIs Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStatWidget
          title="Total Compras"
          value={totalOrdenesCompra}
          prefix="$"
          change={15.3}
          icon={DollarSign}
          color="purple"
          sparklineData={trendData.map(d => d.compras)}
          delay={0.1}
        />
        <QuickStatWidget
          title="Adeudo Total"
          value={totalDeuda}
          prefix="$"
          change={-8.7}
          icon={AlertCircle}
          color="orange"
          sparklineData={trendData.map(d => d.compras - d.pagos)}
          delay={0.2}
        />
        <QuickStatWidget
          title="Total Pagado"
          value={totalPagado}
          prefix="$"
          change={22.1}
          icon={CheckCircle2}
          color="green"
          sparklineData={trendData.map(d => d.pagos)}
          delay={0.3}
        />
        <QuickStatWidget
          title="Órdenes Activas"
          value={ordenes.filter(o => o.estado !== 'cancelado').length}
          change={12.5}
          icon={Package}
          color="cyan"
          sparklineData={[8, 12, 10, 15, 13, 18, ordenes.length]}
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
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Compras vs Pagos</h3>
                  <p className="text-xs text-zinc-400">Últimos 7 días</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                <Activity className="w-3 h-3 mr-1" /> Actualizado
              </Badge>
            </div>
            <SafeChartContainer height={220} minHeight={180}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorComprasDP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPagosDP" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="compras" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorComprasDP)" name="Compras" {...SAFE_ANIMATION_PROPS} />
                <Area type="monotone" dataKey="pagos" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPagosDP)" name="Pagos" {...SAFE_ANIMATION_PROPS} />
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
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-rose-500/5 rounded-2xl blur-xl" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-pink-500/20">
                <BarChart3 className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Cartera</h3>
                <p className="text-xs text-zinc-400">Estado proveedores</p>
              </div>
            </div>
            <SafeChartContainer height={150} minHeight={120}>
              <PieChart>
                <Pie
                  data={distribuidoresPorEstado}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={4}
                  dataKey="value"
                  {...SAFE_PIE_PROPS}
                >
                  {distribuidoresPorEstado.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </SafeChartContainer>
            <div className="flex justify-center gap-6 mt-2">
              {distribuidoresPorEstado.map((item, i) => (
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
          title="Actividad Proveedores"
          activities={recentActivity}
          maxItems={4}
        />
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <MiniChartWidget
            title="Tasa de Pago"
            subtitle={`${Math.round((totalPagado / Math.max(totalOrdenesCompra, 1)) * 100)}%`}
            type="donut"
            data={[{ name: 'Pagado', value: totalPagado }, { name: 'Pendiente', value: totalDeuda }]}
            color="green"
          />
          <MiniChartWidget
            title="Promedio Orden"
            subtitle={`$${ordenes.length ? Math.round(totalOrdenesCompra / ordenes.length).toLocaleString() : 0}`}
            type="area"
            data={trendData.map((d, i) => ({ name: `S${i + 1}`, value: d.compras / 10 }))}
            color="purple"
          />
          <MiniChartWidget
            title="Con Adeudo"
            subtitle={`${distribuidoresPendientes} proveedores`}
            type="bar"
            data={[{ name: 'Con adeudo', value: distribuidoresPendientes }, { name: 'Al día', value: distribuidores.length - distribuidoresPendientes }]}
            color="orange"
          />
          <MiniChartWidget
            title="Total Proveedores"
            subtitle={`${distribuidores.length} activos`}
            type="line"
            data={[5, 7, 8, 9, 10, 11, distribuidores.length].map((v, i) => ({ name: `M${i + 1}`, value: v }))}
            color="pink"
          />
        </div>
      </div>

      {/* Premium Data Table */}
      <PremiumDataTable
        data={distribuidores}
        columns={columns}
        title="Directorio de Distribuidores"
        subtitle={`${distribuidores.length} proveedores registrados`}
        icon={Building2}
        color="purple"
        onAdd={() => setShowCreateModal(true)}
        addLabel="Nuevo Distribuidor"
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Buscar distribuidor..."
        pageSize={10}
        showPagination
        showSearch
        emptyMessage="No hay distribuidores registrados"
        emptyIcon={Building2}
      />

      {/* Modals */}
      <CreateDistribuidorModalPremium 
        open={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      <CreatePagoDistribuidorModalPremium 
        open={showPagoModal} 
        onClose={() => setShowPagoModal(false)} 
      />
      <DistribuidorProfileModal
        distribuidor={selectedDistribuidor}
        isOpen={showProfile}
        onClose={() => {
          setShowProfile(false)
          setSelectedDistribuidor(null)
        }}
        onEdit={(d) => {
          setShowProfile(false)
          handleEdit(d)
        }}
        ordenes={ordenes}
      />
    </div>
  )
}
