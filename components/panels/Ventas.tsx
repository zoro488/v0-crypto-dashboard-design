"use client"
import { Plus, FileDown, DollarSign, TrendingUp, Users, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { StatsCard } from "@/components/ui/stats-card"
import type { ColumnDef } from "@tanstack/react-table"
import { motion } from "framer-motion"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type Venta = {
  id: string
  numero: string
  fecha: string
  cliente: string
  total: number
  saldoPendiente: number
  estado: "completo" | "parcial" | "pendiente"
  productos: number
}

const ventasData: Venta[] = [
  {
    id: "1",
    numero: "V0001",
    fecha: "2024-01-20",
    cliente: "Bódega M-P",
    total: 12500,
    saldoPendiente: 0,
    estado: "completo",
    productos: 3,
  },
  {
    id: "2",
    numero: "V0002",
    fecha: "2024-01-20",
    cliente: "Valle",
    total: 8200,
    saldoPendiente: 2000,
    estado: "parcial",
    productos: 2,
  },
  {
    id: "3",
    numero: "V0003",
    fecha: "2024-01-21",
    cliente: "Súper Centro",
    total: 15000,
    saldoPendiente: 15000,
    estado: "pendiente",
    productos: 5,
  },
]

const ventasSemanalesData = [
  { dia: "Lun", ventas: 45000 },
  { dia: "Mar", ventas: 52000 },
  { dia: "Mié", ventas: 48000 },
  { dia: "Jue", ventas: 61000 },
  { dia: "Vie", ventas: 70000 },
  { dia: "Sáb", ventas: 85000 },
  { dia: "Dom", ventas: 72000 },
]

const columns: ColumnDef<Venta>[] = [
  {
    accessorKey: "numero",
    header: "Número",
    cell: ({ row }) => <div className="font-mono font-semibold text-green-400">{row.getValue("numero")}</div>,
  },
  {
    accessorKey: "fecha",
    header: "Fecha",
    cell: ({ row }) => {
      const fecha = new Date(row.getValue("fecha"))
      return <div>{fecha.toLocaleDateString("es-MX")}</div>
    },
  },
  {
    accessorKey: "cliente",
    header: "Cliente",
  },
  {
    accessorKey: "productos",
    header: "Productos",
    cell: ({ row }) => (
      <Badge variant="outline" className="border-white/20">
        {row.getValue("productos")} items
      </Badge>
    ),
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("total"))
      return <div className="font-semibold text-green-400">${amount.toLocaleString("es-MX")}</div>
    },
  },
  {
    accessorKey: "saldoPendiente",
    header: "Saldo Pendiente",
    cell: ({ row }) => {
      const saldo = Number.parseFloat(row.getValue("saldoPendiente"))
      return <div className={saldo > 0 ? "text-orange-400" : "text-slate-500"}>${saldo.toLocaleString("es-MX")}</div>
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string
      const badgeConfig = {
        pendiente: { label: "Pendiente", className: "bg-orange-500/20 text-orange-400" },
        parcial: { label: "Parcial", className: "bg-blue-500/20 text-blue-400" },
        completo: { label: "Completo", className: "bg-green-500/20 text-green-400" },
      }
      const config = badgeConfig[estado as keyof typeof badgeConfig]
      return <Badge className={config.className}>{config.label}</Badge>
    },
  },
]

export default function Ventas() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Ventas</h1>
          <p className="text-slate-400 mt-1">Gestiona las ventas a clientes</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5 bg-transparent backdrop-blur-xl"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Venta
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Ventas del Día"
          value={72000}
          prefix="$"
          change={12.5}
          icon={DollarSign}
          gradient="from-green-500 to-emerald-500"
        />
        <StatsCard
          title="Ventas del Mes"
          value={1850000}
          prefix="$"
          change={8.3}
          icon={TrendingUp}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatsCard
          title="Clientes Activos"
          value={45}
          icon={Users}
          gradient="from-purple-500 to-pink-500"
          subtitle="Este mes"
        />
        <StatsCard
          title="Productos Vendidos"
          value={328}
          icon={Package}
          gradient="from-orange-500 to-red-500"
          subtitle="Esta semana"
        />
      </div>

      {/* Chart */}
      <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Ventas de la Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={ventasSemanalesData}>
              <defs>
                <linearGradient id="ventasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="dia" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#f1f5f9" }}
              />
              <Area type="monotone" dataKey="ventas" stroke="#10b981" fill="url(#ventasGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Historial de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={ventasData} searchKey="numero" searchPlaceholder="Buscar por número..." />
        </CardContent>
      </Card>
    </div>
  )
}
