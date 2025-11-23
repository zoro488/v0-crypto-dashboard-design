"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp,
  Plus,
  DollarSign,
  Users,
  Package,
  CheckCircle2,
  Clock,
  Search,
  Download,
  Eye,
  ArrowUpRight,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useState, useMemo } from "react"
import { useVentasData } from "@/lib/firebase/firestore-hooks.service"
import { CreateVentaModal } from "@/components/modals/CreateVentaModal"
import { AnimatedCounter } from "@/components/ui/AnimatedCounter"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function BentoVentas() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEstado, setFilterEstado] = useState("todos")
  const [dateRange, setDateRange] = useState("30d")
  const [selectedVenta, setSelectedVenta] = useState<any>(null)

  const { data: ventasData, loading, error } = useVentasData()

  const filteredVentas = useMemo(() => {
    return ventasData.filter((v: any) => {
      const matchSearch =
        v.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.id?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchEstado = filterEstado === "todos" || v.estadoPago === filterEstado
      return matchSearch && matchEstado
    })
  }, [ventasData, searchTerm, filterEstado])

  const totalVentas = filteredVentas.reduce((acc: number, v: any) => acc + (v.precioTotalVenta || 0), 0)
  const totalCobrado = filteredVentas.reduce((acc: number, v: any) => acc + (v.montoPagado || 0), 0)
  const totalPendiente = filteredVentas.reduce((acc: number, v: any) => acc + (v.montoRestante || 0), 0)
  const ventasPendientes = filteredVentas.filter((v: any) => v.estadoPago === "pendiente").length
  const ventasCompletas = filteredVentas.filter((v: any) => v.estadoPago === "completo").length
  const tasaCobranza = totalVentas > 0 ? (totalCobrado / totalVentas) * 100 : 0

  // Mock data for charts
  const chartData = [
    { mes: "Ene", ventas: 4200000, cobrado: 3800000, pendiente: 400000 },
    { mes: "Feb", ventas: 5100000, cobrado: 4600000, pendiente: 500000 },
    { mes: "Mar", ventas: 6800000, cobrado: 6200000, pendiente: 600000 },
    { mes: "Abr", ventas: 7500000, cobrado: 7000000, pendiente: 500000 },
    { mes: "May", ventas: 8900000, cobrado: 8400000, pendiente: 500000 },
    { mes: "Jun", ventas: 9500000, cobrado: 9100000, pendiente: 400000 },
  ]

  const topClientes = useMemo(() => {
    const clienteVentas: any = {}
    filteredVentas.forEach((v: any) => {
      if (!clienteVentas[v.cliente]) {
        clienteVentas[v.cliente] = { cliente: v.cliente, total: 0, count: 0 }
      }
      clienteVentas[v.cliente].total += v.precioTotalVenta || 0
      clienteVentas[v.cliente].count += 1
    })
    return Object.values(clienteVentas)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 5)
  }, [filteredVentas])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-white/10 border-t-green-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <div className="text-white text-lg">Cargando ventas...</div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6 space-y-6">
      {/* Header with Advanced Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl" />
            <TrendingUp className="w-12 h-12 text-green-400 relative" />
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Ventas Premium
            </h1>
            <p className="text-zinc-400 text-sm flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Análisis avanzado de ventas y cobros
            </p>
          </div>
        </div>

        {/* Advanced Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Buscar cliente o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-900/50 border-zinc-800 w-64 focus:border-green-500/50 transition-colors"
            />
          </div>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-green-500/50 transition-colors"
          >
            <option value="todos">Todos los Estados</option>
            <option value="completo">Completas</option>
            <option value="parcial">Parciales</option>
            <option value="pendiente">Pendientes</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-green-500/50 transition-colors"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="all">Todo el tiempo</option>
          </select>

          <Button
            variant="outline"
            className="border-zinc-800 hover:border-green-500/50 hover:bg-green-500/10 bg-transparent"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>

          <Button
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Venta
          </Button>
        </div>
      </motion.div>

      {/* Advanced KPI Cards with Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ventas con mini chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="relative group cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-green-500/50 transition-colors overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8 text-green-400" />
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +12%
              </Badge>
            </div>
            <div className="mb-2">
              <AnimatedCounter value={filteredVentas.length} className="text-3xl font-bold text-white" />
            </div>
            <p className="text-sm text-zinc-400">Ventas Totales</p>
            {/* Mini sparkline */}
            <div className="mt-4 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.slice(-4)}>
                  <Area type="monotone" dataKey="ventas" stroke="#10b981" fill="url(#greenGradient)" strokeWidth={2} />
                  <defs>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Valor Total con progress ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="relative group cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-emerald-400" />
              <div className="relative w-12 h-12">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="#374151" strokeWidth="4" fill="none" />
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#10b981"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 126" }}
                    animate={{ strokeDasharray: `${126 * 0.85} 126` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                  85%
                </span>
              </div>
            </div>
            <div className="mb-2">
              <span className="text-3xl font-bold text-white">${(totalVentas / 1000000).toFixed(2)}M</span>
            </div>
            <p className="text-sm text-zinc-400">Valor Total Ventas</p>
          </div>
        </motion.div>

        {/* Cobrado con animación */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="relative group cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-lime-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-green-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle2 className="w-8 h-8 text-lime-400" />
              <Badge variant="outline" className="bg-lime-500/10 text-lime-400 border-lime-500/20">
                {tasaCobranza.toFixed(0)}%
              </Badge>
            </div>
            <div className="mb-2">
              <AnimatedCounter
                value={totalCobrado / 1000000}
                decimals={2}
                className="text-3xl font-bold text-white"
                suffix="M"
                prefix="$"
              />
            </div>
            <p className="text-sm text-zinc-400">Total Cobrado</p>
            <div className="mt-3 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-lime-500 to-green-400"
                initial={{ width: 0 }}
                animate={{ width: `${tasaCobranza}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Pendiente con alerta */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          className="relative group cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-yellow-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-yellow-400" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                  {ventasPendientes} pendientes
                </Badge>
              </motion.div>
            </div>
            <div className="mb-2">
              <AnimatedCounter
                value={totalPendiente / 1000000}
                decimals={2}
                className="text-3xl font-bold text-white"
                suffix="M"
                prefix="$"
              />
            </div>
            <p className="text-sm text-zinc-400">Por Cobrar</p>
          </div>
        </motion.div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas Trend Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-2xl blur-2xl" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-green-500/30 transition-colors">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Tendencia de Ventas (6 meses)
            </h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="mes" stroke="#ffffff40" />
                  <YAxis stroke="#ffffff40" />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(0,0,0,0.9)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      backdropFilter: "blur(12px)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorVentas)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Top Clientes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl blur-2xl" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-cyan-500/30 transition-colors">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Top 5 Clientes
            </h3>
            <div className="space-y-3">
              {topClientes.map((cliente: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                  whileHover={{ x: 5, scale: 1.02 }}
                  className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer group/item"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center font-bold text-white">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-white group-hover/item:text-cyan-400 transition-colors">
                        {cliente.cliente}
                      </div>
                      <div className="text-xs text-zinc-500">{cliente.count} ventas</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-white font-bold">${(cliente.total / 1000).toFixed(0)}K</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Interactive Table with Details View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-2xl blur-2xl" />
        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              Registro de Ventas
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                {filteredVentas.length} resultados
              </Badge>
            </h3>
          </div>

          <Tabs defaultValue="todas" className="w-full">
            <TabsList className="bg-zinc-800/50 backdrop-blur-xl mb-6">
              <TabsTrigger value="todas">Todas ({filteredVentas.length})</TabsTrigger>
              <TabsTrigger value="pendientes">Pendientes ({ventasPendientes})</TabsTrigger>
              <TabsTrigger value="completas">Completas ({ventasCompletas})</TabsTrigger>
            </TabsList>

            <TabsContent value="todas">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">ID</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Fecha</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Cliente</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Cantidad</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Total</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Pendiente</th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Estado</th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVentas.map((venta: any, idx: number) => (
                      <motion.tr
                        key={venta.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(0.9 + idx * 0.03, 1.5) }}
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                        className="border-b border-zinc-800/50 group/row cursor-pointer"
                        onClick={() => setSelectedVenta(venta)}
                      >
                        <td className="py-4 px-4">
                          <div className="font-mono text-sm text-green-400 group-hover/row:text-green-300 transition-colors">
                            {venta.id}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-zinc-400">{venta.fecha}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-white group-hover/row:text-green-400 transition-colors">
                            {venta.cliente}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            {venta.cantidad}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="font-mono text-white font-semibold">
                            ${((venta.precioTotalVenta || 0) / 1000).toFixed(0)}K
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="font-mono text-yellow-400 font-semibold">
                            ${((venta.montoRestante || 0) / 1000).toFixed(0)}K
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {venta.estadoPago === "completo" ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Completo
                            </Badge>
                          ) : venta.estadoPago === "parcial" ? (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                              <Clock className="w-3 h-3 mr-1" />
                              Parcial
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendiente
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-zinc-400 hover:text-green-400 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="pendientes">
              {/* Similar table filtered by pendientes */}
              <div className="text-center py-8 text-zinc-400">{ventasPendientes} ventas pendientes</div>
            </TabsContent>

            <TabsContent value="completas">
              {/* Similar table filtered by completas */}
              <div className="text-center py-8 text-zinc-400">{ventasCompletas} ventas completas</div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedVenta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVenta(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-2xl w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Detalles de Venta</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Cliente</p>
                  <p className="text-white font-medium">{selectedVenta.cliente}</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm mb-1">ID</p>
                  <p className="text-green-400 font-mono">{selectedVenta.id}</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Fecha</p>
                  <p className="text-white">{selectedVenta.fecha}</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Cantidad</p>
                  <p className="text-white font-semibold">{selectedVenta.cantidad} unidades</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Total Venta</p>
                  <p className="text-white font-bold text-xl">${(selectedVenta.precioTotalVenta / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Monto Pendiente</p>
                  <p className="text-yellow-400 font-bold text-xl">
                    ${(selectedVenta.montoRestante / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>
              <Button onClick={() => setSelectedVenta(null)} className="w-full mt-6">
                Cerrar
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateVentaModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
