"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
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
} from "lucide-react"
import { useState, useMemo } from "react"
import { BANCOS } from "@/frontend/app/lib/constants"
import SimpleCurrencyWidget from "@/frontend/app/components/widgets/SimpleCurrencyWidget"
import CreateGastoModal from "@/frontend/app/components/modals/CreateGastoModal"
import CreateTransferenciaModal from "@/frontend/app/components/modals/CreateTransferenciaModal"
import CreateIngresoModal from "@/frontend/app/components/modals/CreateIngresoModal"
import { FinancialRiverFlow } from "@/frontend/app/components/visualizations/FinancialRiverFlow"
import {
  useIngresosBanco,
  useGastos,
  useTransferencias,
  useCorteBancario,
} from "@/frontend/app/lib/firebase/firestore-hooks.service"
import { Skeleton } from "@/frontend/app/components/ui/skeleton"
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts"
import { QuickStatWidget } from "@/app/components/widgets/QuickStatWidget"
import { MiniChartWidget } from "@/app/components/widgets/MiniChartWidget"
import { ActivityFeedWidget, ActivityItem } from "@/app/components/widgets/ActivityFeedWidget"

// Interfaces para tipado
interface MovimientoBanco {
  id?: string
  monto?: number
  fecha?: string | Date
  descripcion?: string
  concepto?: string
  bancoOrigen?: string
  bancoDestino?: string
  [key: string]: unknown
}

interface CorteBancarioDetalle {
  id?: string
  periodo?: string
  fechaInicio?: string | Date
  fechaFin?: string | Date
  capitalInicial?: number
  capitalFinal?: number
  diferencia?: number
  variacion?: number
  [key: string]: unknown
}

// Helper para formatear fecha
const formatDate = (date: string | Date | undefined): string => {
  if (!date) return "-"
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return "-"
  }
}

// Helper para formatear números
const formatNumber = (value: number | undefined): string => {
  return (value ?? 0).toLocaleString()
}

const tabs = [
  { id: "ingresos", label: "Ingresos", icon: TrendingUp },
  { id: "gastos", label: "Gastos", icon: TrendingDown },
  { id: "cortes", label: "Cortes", icon: Scissors },
  { id: "transferencias", label: "Transferencias", icon: ArrowLeftRight },
]

export default function BentoBanco() {
  const [activeTab, setActiveTab] = useState("ingresos")
  const [selectedBanco, setSelectedBanco] = useState(BANCOS[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)

  const [showIngresoModal, setShowIngresoModal] = useState(false)
  const [showGastoModal, setShowGastoModal] = useState(false)
  const [showTransferenciaModal, setShowTransferenciaModal] = useState(false)

  const { data: ingresosRaw = [], loading: loadingIngresos } = useIngresosBanco(selectedBanco.id)
  const { data: gastosRaw = [], loading: loadingGastos } = useGastos(selectedBanco.id)
  const { data: transferenciasRaw = [], loading: loadingTransferencias } = useTransferencias(selectedBanco.id)
  const { data: cortesRaw = [], loading: loadingCortes } = useCorteBancario(selectedBanco.id)

  // Casting seguro
  const ingresos = ingresosRaw as MovimientoBanco[]
  const gastos = gastosRaw as MovimientoBanco[]
  const transferencias = transferenciasRaw as MovimientoBanco[]
  const cortes = cortesRaw as CorteBancarioDetalle[]

  const loading = loadingIngresos || loadingGastos || loadingTransferencias || loadingCortes

  if (loading) {
    return (
      <div className="bento-container space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const totalIngresos = ingresos.reduce((sum, i) => sum + (i.monto ?? 0), 0)
  const totalGastos = gastos.reduce((sum, g) => sum + (g.monto ?? 0), 0)
  const saldoActual = totalIngresos - totalGastos

  // Datos para gráficos
  const trendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => ({
      name: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i],
      ingresos: Math.floor(Math.random() * 50000) + 20000,
      gastos: Math.floor(Math.random() * 30000) + 10000,
    }))
  }, [])

  // Distribución por tipo de movimiento
  const distribucionMovimientos = useMemo(() => [
    { name: 'Ingresos', value: totalIngresos, color: '#10b981' },
    { name: 'Gastos', value: totalGastos, color: '#ef4444' },
    { name: 'Transferencias', value: transferencias.reduce((sum, t) => sum + (t.monto ?? 0), 0), color: '#8b5cf6' },
  ], [totalIngresos, totalGastos, transferencias])

  // Activity feed
  const recentActivity: ActivityItem[] = useMemo(() => {
    const activities: ActivityItem[] = []
    
    ingresos.slice(0, 2).forEach((ing, i) => {
      activities.push({
        id: `ing-${ing.id || i}`,
        type: 'pago',
        title: 'Ingreso registrado',
        description: `+$${(ing.monto ?? 0).toLocaleString()} - ${ing.concepto || 'Sin concepto'}`,
        timestamp: ing.fecha ? new Date(ing.fecha as string) : new Date(),
        status: 'success'
      })
    })
    
    gastos.slice(0, 2).forEach((g, i) => {
      activities.push({
        id: `gasto-${g.id || i}`,
        type: 'compra',
        title: 'Gasto registrado',
        description: `-$${(g.monto ?? 0).toLocaleString()} - ${g.concepto || 'Sin concepto'}`,
        timestamp: g.fecha ? new Date(g.fecha as string) : new Date(),
        status: 'error'
      })
    })
    
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 4)
  }, [ingresos, gastos])

  return (
    <div className="p-6 space-y-6">
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
                      ? "bg-white/10 text-white shadow-lg shadow-black/10 ring-1 ring-white/20"
                      : "glass text-white/40 hover:text-white hover:bg-white/5"
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
                  {selectedBanco.id === banco.id && <div className={`w-1.5 h-1.5 rounded-full bg-white`} />}
                  {banco.nombre}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Selected Bank Stats Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-6 rounded-2xl border border-white/5 bg-black/20"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60 text-sm font-medium">Saldo Disponible</span>
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-4xl font-bold text-white tracking-tight">${saldoActual.toLocaleString("en-US")}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span>+12.5% vs mes anterior</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-6 rounded-2xl border border-white/5 bg-black/20"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60 text-sm font-medium">Ingresos Totales</span>
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white tracking-tight">${totalIngresos.toLocaleString("en-US")}</p>
              <div className="w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
                <div className="h-full w-[75%] bg-blue-500 rounded-full" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass p-6 rounded-2xl border border-white/5 bg-black/20"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60 text-sm font-medium">Gastos Totales</span>
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-3xl font-bold text-white tracking-tight">${totalGastos.toLocaleString("en-US")}</p>
              <div className="w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
                <div className="h-full w-[35%] bg-red-500 rounded-full" />
              </div>
            </motion.div>
          </div>

          {selectedBanco.id === "profit" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <SimpleCurrencyWidget />
            </motion.div>
          )}
        </motion.div>

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
            <ResponsiveContainer width="100%" height={200}>
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
                    borderRadius: '12px' 
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIngresosB)" name="Ingresos" />
                <Area type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorGastosB)" name="Gastos" />
              </AreaChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={distribucionMovimientos}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {distribucionMovimientos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
                  ${activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white hover:bg-white/5"}
                `}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 rounded-2xl shadow-inner shadow-white/5"
                  />
                )}
                <tab.icon className={`w-4 h-4 relative z-10 ${activeTab === tab.id ? "text-cyan-400" : ""}`} />
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
              className={`p-2.5 rounded-xl border transition-all ${filterOpen ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" : "bg-black/20 border-white/5 text-white/40 hover:text-white"}`}
            >
              <Filter className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl bg-black/20 border border-white/5 text-white/40 hover:text-white transition-colors"
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
              animate={{ height: "auto", opacity: 1 }}
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
          {activeTab === "ingresos" && (
            <div className="crystal-card p-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex items-center justify-between p-6 relative z-10">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Ingresos Históricos</h3>
                  <p className="text-white/40 text-sm mt-1">Registro detallado de entradas de capital</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-premium bg-emerald-500 hover:bg-emerald-400 text-white border-none flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                  onClick={() => setShowIngresoModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Ingreso
                </motion.button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <TableHeader>ID</TableHeader>
                      <TableHeader>Fecha</TableHeader>
                      <TableHeader>Origen</TableHeader>
                      <TableHeader>Monto</TableHeader>
                      <TableHeader>Concepto</TableHeader>
                      <TableHeader>Referencia</TableHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ingresos.map((ingreso, index) => (
                      <motion.tr
                        key={ingreso.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group/row hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4 text-white/80">{ingreso.id}</td>
                        <td className="px-6 py-4 text-white/60">{formatDate(ingreso.fecha)}</td>
                        <td className="px-6 py-4 text-white/80">{String(ingreso.origen ?? "-")}</td>
                        <td className="px-6 py-4 text-emerald-400 font-semibold">${formatNumber(ingreso.monto)}</td>
                        <td className="px-6 py-4 text-white/60">{ingreso.concepto ?? "-"}</td>
                        <td className="px-6 py-4 text-blue-400">{String(ingreso.referencia ?? "-")}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination / Footer */}
              <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                <span>Mostrando 1-10 de 145 registros</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded-lg hover:bg-white/5 transition-colors">Anterior</button>
                  <button className="px-3 py-1 rounded-lg bg-white/10 text-white">1</button>
                  <button className="px-3 py-1 rounded-lg hover:bg-white/5 transition-colors">2</button>
                  <button className="px-3 py-1 rounded-lg hover:bg-white/5 transition-colors">3</button>
                  <button className="px-3 py-1 rounded-lg hover:bg-white/5 transition-colors">Siguiente</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "gastos" && (
            <div className="crystal-card p-1 relative overflow-hidden group">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(244, 63, 94, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowGastoModal(true)}
                className="btn-premium bg-rose-500 hover:bg-rose-400 text-white border-none flex items-center gap-2 shadow-lg shadow-rose-900/20"
              >
                <Plus className="w-4 h-4" />
                Registrar Gasto
              </motion.button>
            </div>
          )}

          {activeTab === "cortes" && (
            <div className="crystal-card p-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center justify-between p-6 relative z-10">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Cortes de Cuenta</h3>
                  <p className="text-white/40 text-sm mt-1">Auditoría de balances periódicos</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <TableHeader>Periodo</TableHeader>
                      <TableHeader>Fecha Inicio</TableHeader>
                      <TableHeader>Fecha Fin</TableHeader>
                      <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                        Capital Inicial
                      </th>
                      <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                        Capital Final
                      </th>
                      <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                        Diferencia
                      </th>
                      <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                        Variación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {cortes.map((corte, index) => (
                      <motion.tr
                        key={corte.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group/row hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20`}
                          >
                            {corte.periodo ?? "-"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-white/60 text-sm">
                          {formatDate(corte.fechaInicio)}
                        </td>
                        <td className="py-4 px-6 text-white/60 text-sm">
                          {formatDate(corte.fechaFin)}
                        </td>
                        <td className="py-4 px-6 text-right text-white/60 font-mono text-sm">
                          ${formatNumber(corte.capitalInicial)}
                        </td>
                        <td className="py-4 px-6 text-right text-white font-bold text-sm">
                          ${formatNumber(corte.capitalFinal)}
                        </td>
                        <td
                          className={`py-4 px-6 text-right text-sm font-bold ${
                            (corte.diferencia ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {(corte.diferencia ?? 0) >= 0 ? "+" : ""}${formatNumber(corte.diferencia)}
                        </td>
                        <td
                          className={`py-4 px-6 text-right text-sm font-bold ${
                            (corte.variacion ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {(corte.variacion ?? 0) >= 0 ? "+" : ""}
                          {corte.variacion ?? 0}%
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "transferencias" && (
            <div className="crystal-card p-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center justify-between p-6 relative z-10">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Transferencias Internas</h3>
                  <p className="text-white/40 text-sm mt-1">Movimientos de capital entre bancos</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTransferenciaModal(true)}
                  className="btn-premium bg-purple-500 hover:bg-purple-400 text-white border-none flex items-center gap-2 shadow-lg shadow-purple-900/20"
                >
                  <Send className="w-4 h-4" />
                  Nueva Transferencia
                </motion.button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <TableHeader>ID</TableHeader>
                      <TableHeader>Fecha</TableHeader>
                      <TableHeader>Tipo</TableHeader>
                      <TableHeader>Origen</TableHeader>
                      <TableHeader>Destino</TableHeader>
                      <TableHeader>Monto</TableHeader>
                      <TableHeader>Concepto</TableHeader>
                      <TableHeader>Estado</TableHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transferencias.map((trans, index) => (
                      <motion.tr
                        key={trans.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group/row hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 px-6 text-white/80 text-sm font-medium">{trans.id}</td>
                        <td className="py-4 px-6 text-white/60">{formatDate(trans.fecha)}</td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              String(trans.tipo) === "entrada"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {String(trans.tipo ?? "-")}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-white/80 text-sm">{trans.bancoOrigen ?? "-"}</td>
                        <td className="py-4 px-6 text-white/80 text-sm">{trans.bancoDestino ?? "-"}</td>
                        <td className="py-4 px-6 text-right text-sm font-bold">${formatNumber(trans.monto)}</td>
                        <td className="py-4 px-6 text-white/60 text-sm">{trans.concepto ?? "-"}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400`}>
                            {String(trans.estado ?? "-")}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Modals */}
      {showIngresoModal && <CreateIngresoModal isOpen={showIngresoModal} onClose={() => setShowIngresoModal(false)} />}
      {showGastoModal && <CreateGastoModal isOpen={showGastoModal} onClose={() => setShowGastoModal(false)} />}
      {showTransferenciaModal && (
        <CreateTransferenciaModal isOpen={showTransferenciaModal} onClose={() => setShowTransferenciaModal(false)} />
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
  type = "info",
}: { status: string; type?: "success" | "warning" | "error" | "info" }) => {
  const styles = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md ${styles[type]}`}
    >
      {status}
    </span>
  )
}
