'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, AlertCircle, CheckCircle2, Clock, DollarSign, Package, Plus, TrendingUp, BarChart3, Activity, Truck, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { useDistribuidores, useOrdenesCompra } from '@/app/lib/firebase/firestore-hooks.service'
import { eliminarDistribuidor } from '@/app/lib/services/unified-data-service'
import { CreateDistribuidorModalPremium } from '@/app/components/modals/CreateDistribuidorModalPremium'
import { CreatePagoDistribuidorModalPremium } from '@/app/components/modals/CreatePagoDistribuidorModalPremium'
import { DeleteConfirmModal } from '@/app/components/modals/DeleteConfirmModal'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { SafeChartContainer, SAFE_ANIMATION_PROPS, SAFE_PIE_PROPS } from '@/app/components/ui/SafeChartContainer'
import { QuickStatWidget } from '@/app/components/widgets/QuickStatWidget'
import { MiniChartWidget } from '@/app/components/widgets/MiniChartWidget'
import { ActivityFeedWidget, ActivityItem } from '@/app/components/widgets/ActivityFeedWidget'
import { useToast } from '@/app/hooks/use-toast'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { logger } from '@/app/lib/utils/logger'

// Interface para distribuidor
interface DistribuidorData {
  id?: string
  nombre?: string
  totalOrdenesCompra?: number
  deudaTotal?: number
  totalPagado?: number
  [key: string]: unknown
}

export default function BentoDistribuidores() {
  const { toast } = useToast()
  const { triggerDataRefresh } = useAppStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAbonoModal, setShowAbonoModal] = useState(false)
  const [editingDistribuidor, setEditingDistribuidor] = useState<DistribuidorData | null>(null)
  const [deletingDistribuidor, setDeletingDistribuidor] = useState<DistribuidorData | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { data: distribuidoresRaw, loading: loadingDist, error: errorDist } = useDistribuidores()
  const { data: ordenesCompra = [], loading: loadingOC, error: errorOC } = useOrdenesCompra()

  // Casting seguro
  const distribuidores = distribuidoresRaw as DistribuidorData[] | undefined

  const [internalLoading, setInternalLoading] = useState(true)

  useEffect(() => {
    if (!loadingDist && !loadingOC) {
      setInternalLoading(false)
    }
  }, [loadingDist, loadingOC, distribuidores, ordenesCompra, errorDist, errorOC])

  // Timeout de seguridad
  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalLoading) {
        setInternalLoading(false)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [internalLoading])

  const isLoading = internalLoading || (loadingDist && loadingOC) // Show loading if both are strictly loading, otherwise show what we have

  // Handlers para editar/eliminar
  const handleEditDistribuidor = useCallback((dist: DistribuidorData) => {
    setEditingDistribuidor(dist)
    setShowCreateModal(true)
  }, [])

  const handleDeleteDistribuidor = useCallback((dist: DistribuidorData) => {
    setDeletingDistribuidor(dist)
    setShowDeleteModal(true)
  }, [])

  const confirmDeleteDistribuidor = useCallback(async () => {
    if (!deletingDistribuidor?.id) return
    
    try {
      await eliminarDistribuidor(deletingDistribuidor.id)
      toast({
        title: '✅ Distribuidor eliminado',
        description: `${deletingDistribuidor.nombre} ha sido eliminado exitosamente`,
      })
      triggerDataRefresh()
    } catch (error) {
      logger.error('Error eliminando distribuidor', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar el distribuidor',
        variant: 'destructive',
      })
    }
  }, [deletingDistribuidor, toast, triggerDataRefresh])

  const handleCloseModal = useCallback(() => {
    setShowCreateModal(false)
    setEditingDistribuidor(null)
  }, [])

  const topDistribuidores = distribuidores
    ? [...distribuidores].sort((a, b) => (b.totalOrdenesCompra ?? 0) - (a.totalOrdenesCompra ?? 0)).slice(0, 5)
    : []

  const totalDeuda = distribuidores?.reduce((acc, d) => acc + (d.deudaTotal ?? 0), 0) ?? 0
  const totalOrdenesCompra = distribuidores?.reduce((acc, d) => acc + (d.totalOrdenesCompra ?? 0), 0) ?? 0
  const totalPagado = distribuidores?.reduce((acc, d) => acc + (d.totalPagado ?? 0), 0) ?? 0
  const distribuidoresPendientes = distribuidores?.filter((d) => (d.deudaTotal ?? 0) > 0).length ?? 0

  // Colores para gráficos
  const CHART_COLORS = ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

  // Datos para gráficos - Usando datos reales de top distribuidores
  const trendData = useMemo(() => {
    return topDistribuidores.slice(0, 7).map((d, i) => ({
      name: d.nombre?.substring(0, 6) || `D${i + 1}`,
      compras: d.totalOrdenesCompra ?? 0,
      pagos: d.totalPagado ?? 0,
      deuda: d.deudaTotal ?? 0,
    }))
  }, [topDistribuidores])

  // Distribución de proveedores por estado
  const distribuidoresPorEstado = useMemo(() => {
    const saldados = distribuidores?.filter(d => (d.deudaTotal ?? 0) === 0).length ?? 0
    const pendientes = distribuidoresPendientes
    return [
      { name: 'Saldados', value: saldados, color: '#10b981' },
      { name: 'Pendientes', value: pendientes, color: '#f59e0b' },
    ]
  }, [distribuidores, distribuidoresPendientes])

  // Activity feed
  const recentActivity: ActivityItem[] = useMemo(() => {
    return topDistribuidores.slice(0, 4).map((d, i) => ({
      id: d.id || `dist-${i}`,
      type: 'compra' as const,
      title: d.nombre || 'Distribuidor',
      description: `Compras: $${((d.totalOrdenesCompra ?? 0) / 1000).toFixed(0)}K | Deuda: $${((d.deudaTotal ?? 0) / 1000).toFixed(0)}K`,
      timestamp: new Date(Date.now() - i * 3600000),
      status: ((d.deudaTotal ?? 0) > 0 ? 'pending' : 'success') as 'pending' | 'success',
    }))
  }, [topDistribuidores])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] p-6 space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6 space-y-6">
      {(errorDist || errorOC) && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <Alert variant="destructive" className="bg-red-900/20 border-red-900/50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de conexión</AlertTitle>
            <AlertDescription>
              No se pudieron cargar algunos datos. Es posible que falten permisos de Firestore.
              {(errorDist || errorOC)?.includes('Missing or insufficient permissions') && (
                <span className="block mt-1 text-xs opacity-80">
                  Configure las reglas de seguridad en la consola de Firebase.
                </span>
              )}
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
              Distribuidores
            </h1>
            <p className="text-zinc-400 text-sm">Gestión completa de proveedores</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowAbonoModal(true)}
            variant="outline"
            className="border-green-500/20 hover:bg-green-500/10 text-green-400"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Registrar Pago
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Distribuidor
          </Button>
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
          value={ordenesCompra.length}
          change={12.5}
          icon={Package}
          color="cyan"
          sparklineData={[8, 12, 10, 15, 13, 18, ordenesCompra.length]}
          delay={0.4}
        />
      </div>

      {/* Gráficos Premium */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Tendencia */}
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
                  <linearGradient id="colorComprasD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPagosD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                <Area type="monotone" dataKey="compras" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorComprasD)" name="Compras" {...SAFE_ANIMATION_PROPS} />
                <Area type="monotone" dataKey="pagos" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPagosD)" name="Pagos" {...SAFE_ANIMATION_PROPS} />
              </AreaChart>
            </SafeChartContainer>
          </div>
        </motion.div>

        {/* Estado de Distribuidores - Pie */}
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

      {/* Activity Feed y Mini Charts */}
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
            subtitle={`$${ordenesCompra.length ? Math.round(totalOrdenesCompra / ordenesCompra.length).toLocaleString() : 0}`}
            type="area"
            data={trendData.map((d, i) => ({ name: `S${i + 1}`, value: d.compras / 10 }))}
            color="purple"
          />
          <MiniChartWidget
            title="Con Adeudo"
            subtitle={`${distribuidoresPendientes} proveedores`}
            type="bar"
            data={[{ name: 'Con adeudo', value: distribuidoresPendientes }, { name: 'Al día', value: (distribuidores?.length || 0) - distribuidoresPendientes }]}
            color="orange"
          />
          <MiniChartWidget
            title="Total Proveedores"
            subtitle={`${distribuidores?.length || 0} activos`}
            type="line"
            data={[5, 7, 8, 9, 10, 11, distribuidores?.length || 12].map((v, i) => ({ name: `M${i + 1}`, value: v }))}
            color="pink"
          />
        </div>
      </div>

      {/* Tabla Distribuidores */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl blur-2xl" />
        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Top Distribuidores</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Distribuidor</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Total Compras</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Adeudo</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Pagado</th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Órdenes</th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Estado</th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {topDistribuidores.map((dist, idx) => (
                  <motion.tr
                    key={dist.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group/row"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white group-hover/row:text-purple-400 transition-colors">
                            {dist.nombre ?? '-'}
                          </div>
                          <div className="text-xs text-zinc-500">{dist.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-mono text-white">${((dist.totalOrdenesCompra ?? 0) / 1000).toFixed(0)}K</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-mono text-red-400">${((dist.deudaTotal ?? 0) / 1000).toFixed(0)}K</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-mono text-green-400">${((dist.totalPagado ?? 0) / 1000).toFixed(0)}K</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                        {Array.isArray(dist.ordenesCompra) ? dist.ordenesCompra.length : 0}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {(dist.deudaTotal ?? 0) === 0 ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Saldado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDistribuidor(dist)}
                          className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDistribuidor(dist)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Create Distribuidor Modal */}
      <CreateDistribuidorModalPremium 
        open={showCreateModal} 
        onClose={handleCloseModal} 
      />
      <CreatePagoDistribuidorModalPremium open={showAbonoModal} onClose={() => setShowAbonoModal(false)} />

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeletingDistribuidor(null)
        }}
        onConfirm={confirmDeleteDistribuidor}
        title="¿Eliminar distribuidor?"
        description="Esta acción eliminará permanentemente el distribuidor. No se pueden eliminar distribuidores con órdenes pendientes."
        itemName={deletingDistribuidor?.nombre || ''}
        itemType="distribuidor"
      />
    </div>
  )
}
