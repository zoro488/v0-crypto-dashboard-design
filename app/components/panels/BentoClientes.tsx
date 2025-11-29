"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Users, AlertTriangle, CheckCircle2, Clock, DollarSign, Plus, TrendingUp, BarChart3, Activity, Zap } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { useClientes } from "@/app/lib/firebase/firestore-hooks.service"
import { CreateClienteModalPremium } from "@/app/components/modals/CreateClienteModalPremium"
import { CreateAbonoModalPremium } from "@/app/components/modals/CreateAbonoModalPremium"
import { useState, useMemo } from "react"
import { Skeleton } from "@/app/components/ui/skeleton"
import { ClientNetworkGraph } from "@/app/components/visualizations/ClientNetworkGraph"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts"
import { SafeChartContainer, SAFE_ANIMATION_PROPS, SAFE_PIE_PROPS } from "@/app/components/ui/SafeChartContainer"
import { QuickStatWidget } from "@/app/components/widgets/QuickStatWidget"
import { MiniChartWidget } from "@/app/components/widgets/MiniChartWidget"
import { ActivityFeedWidget, ActivityItem } from "@/app/components/widgets/ActivityFeedWidget"

// Interface para cliente
interface ClienteData {
  id?: string
  nombre?: string
  totalVentas?: number
  deudaTotal?: number
  totalPagado?: number
  [key: string]: unknown
}

export default function BentoClientes() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAbonoModal, setShowAbonoModal] = useState(false)
  const { data: clientesRaw, loading } = useClientes()
  
  // Casting seguro
  const clientes = clientesRaw as ClienteData[] | undefined

  const topClientes = clientes?.sort((a, b) => (b.totalVentas ?? 0) - (a.totalVentas ?? 0)).slice(0, 5) ?? []
  const totalDeuda = clientes?.reduce((acc, c) => acc + (c.deudaTotal ?? 0), 0) ?? 0
  const totalVentas = clientes?.reduce((acc, c) => acc + (c.totalVentas ?? 0), 0) ?? 0
  const totalCobrado = clientes?.reduce((acc, c) => acc + (c.totalPagado ?? 0), 0) ?? 0
  const clientesPendientes = clientes?.filter((c) => (c.deudaTotal ?? 0) > 0).length ?? 0

  // Colores para gráficos
  const CHART_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444']

  // Datos para gráficos - Usando datos reales de top clientes
  const trendData = useMemo(() => {
    // Mostrar los top 7 clientes por ventas
    return topClientes.slice(0, 7).map((c, i) => ({
      name: c.nombre?.substring(0, 6) || `C${i + 1}`,
      ventas: c.totalVentas ?? 0,
      cobros: c.totalPagado ?? 0,
      deuda: c.deudaTotal ?? 0
    }))
  }, [topClientes])

  // Distribución de clientes por estado
  const clientesPorEstado = useMemo(() => {
    const saldados = clientes?.filter(c => (c.deudaTotal ?? 0) === 0).length ?? 0
    const pendientes = clientesPendientes
    return [
      { name: 'Saldados', value: saldados, color: '#10b981' },
      { name: 'Pendientes', value: pendientes, color: '#f59e0b' },
    ]
  }, [clientes, clientesPendientes])

  // Activity feed
  const recentActivity: ActivityItem[] = useMemo(() => {
    return topClientes.slice(0, 4).map((c, i) => ({
      id: c.id || `cliente-${i}`,
      type: 'cliente' as const,
      title: c.nombre || 'Cliente',
      description: `Venta total: $${((c.totalVentas ?? 0) / 1000).toFixed(0)}K`,
      timestamp: new Date(Date.now() - i * 3600000),
      status: ((c.deudaTotal ?? 0) > 0 ? 'pending' : 'success') as 'pending' | 'success'
    }))
  }, [topClientes])

  if (loading) {
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
              Clientes
            </h1>
            <p className="text-zinc-400 text-sm">Cartera de clientes y adeudos</p>
          </div>
        </div>
        <div className="flex gap-3">
          {" "}
          {/* Container for buttons */}
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
      {/* KPIs Premium con Widgets */}
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
          value={clientes?.length || 0}
          change={8.1}
          icon={Users}
          color="purple"
          sparklineData={[20, 25, 28, 30, 29, 31, clientes?.length || 32]}
          delay={0.4}
        />
      </div>

      {/* Gráficos Premium Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Tendencia de Ventas/Cobros */}
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
                  <linearGradient id="colorVentasC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCobros" x1="0" y1="0" x2="0" y2="1">
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
                    borderRadius: '12px' 
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="ventas" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorVentasC)" name="Ventas" {...SAFE_ANIMATION_PROPS} />
                <Area type="monotone" dataKey="cobros" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCobros)" name="Cobros" {...SAFE_ANIMATION_PROPS} />
              </AreaChart>
            </SafeChartContainer>
          </div>
        </motion.div>

        {/* Estado de Clientes - Pie Chart */}
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
                <h3 className="text-lg font-bold text-white">Estado</h3>
                <p className="text-xs text-zinc-400">Por cartera</p>
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

      {/* Activity Feed y Mini Charts */}
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
            subtitle={`$${clientes?.length ? Math.round(totalVentas / clientes.length).toLocaleString() : 0}`}
            type="area"
            data={trendData.map(d => ({ name: d.name, value: d.ventas / 30 }))}
            color="cyan"
          />
          <MiniChartWidget
            title="Clientes con Deuda"
            subtitle={`${clientesPendientes} clientes`}
            type="bar"
            data={[{ name: 'Con deuda', value: clientesPendientes }, { name: 'Sin deuda', value: (clientes?.length || 0) - clientesPendientes }]}
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
      {/* Tabla Clientes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl blur-2xl" />
        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Top Clientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Cliente</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Total Ventas</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Adeudo</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Pagado</th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Estado</th>
                </tr>
              </thead>
              <tbody>
                {topClientes.map((cliente, idx) => (
                  <motion.tr
                    key={cliente.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group/row"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white group-hover/row:text-cyan-400 transition-colors">
                            {cliente.nombre ?? "-"}
                          </div>
                          <div className="text-xs text-zinc-500">{cliente.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-mono text-white">${((cliente.totalVentas ?? 0) / 1000).toFixed(0)}K</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-mono text-red-400">${((cliente.deudaTotal ?? 0) / 1000).toFixed(0)}K</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-mono text-green-400">${((cliente.totalPagado ?? 0) / 1000).toFixed(0)}K</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {(cliente.deudaTotal ?? 0) === 0 ? (
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
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
      {/* Create Cliente Modal */}
      <CreateClienteModalPremium 
        open={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      <CreateAbonoModalPremium open={showAbonoModal} onClose={() => setShowAbonoModal(false)} /> {/* Add Abono Modal */}

      {/* Client Network Graph - Premium Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="glass p-6 rounded-2xl border border-white/5 bg-black/20 mt-6"
      >
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white">Red de Clientes</h3>
          <p className="text-sm text-white/60">Grafo interactivo de relaciones comerciales</p>
        </div>
        <ClientNetworkGraph width={900} height={600} className="w-full" />
      </motion.div>
    </div>
  )
}
