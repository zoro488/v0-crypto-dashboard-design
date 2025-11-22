"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Plus,
  ArrowLeftRight,
  FileDown,
  Eye,
  DollarSign,
  Receipt,
  History,
  Filter,
  Download,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { StatsCard } from "@/components/ui/stats-card"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ColumnDef } from "@tanstack/react-table"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { Banco } from "@/types"

interface PanelBancoProps {
  banco: Banco
}

type Ingreso = {
  id: string
  fecha: string
  tipo: "venta" | "transferencia" | "otro"
  origen: string
  concepto: string
  monto: number
  referencia: string
  saldoDespues: number
}

type Gasto = {
  id: string
  fecha: string
  tipo: "compra" | "transferencia" | "operativo" | "otro"
  destino: string
  concepto: string
  monto: number
  referencia: string
  saldoDespues: number
}

type Corte = {
  id: string
  periodo: string
  fechaInicio: string
  fechaFin: string
  capitalInicial: number
  ingresos: number
  gastos: number
  transferenciaEntrada: number
  transferenciaSalida: number
  capitalFinal: number
  diferencia: number
  variacion: number
  estado: "abierto" | "cerrado"
}

type Transferencia = {
  id: string
  fecha: string
  tipo: "entrada" | "salida"
  bancoOrigen: string
  bancoDestino: string
  monto: number
  concepto: string
  referencia: string
  estado: "completada" | "pendiente" | "cancelada"
}

const ingresosData: Ingreso[] = [
  {
    id: "ING-001",
    fecha: "2024-01-20T14:30:00",
    tipo: "venta",
    origen: "Cliente Robalo",
    concepto: "Pago venta VENTA-2025-10-06-Robalo-74",
    monto: 264000,
    referencia: "V-074",
    saldoDespues: 1847320,
  },
  {
    id: "ING-002",
    fecha: "2024-01-20T11:15:00",
    tipo: "transferencia",
    origen: "Banco Fletes",
    concepto: "Transferencia de Fletes",
    monto: 50000,
    referencia: "TRF-012",
    saldoDespues: 1583320,
  },
  {
    id: "ING-003",
    fecha: "2024-01-19T16:45:00",
    tipo: "venta",
    origen: "Cliente Lamas",
    concepto: "Pago venta parcial",
    monto: 142000,
    referencia: "V-095",
    saldoDespues: 1533320,
  },
]

const gastosData: Gasto[] = [
  {
    id: "GAS-001",
    fecha: "2024-01-20T10:00:00",
    tipo: "compra",
    destino: "Distribuidor PACMAN",
    concepto: "Pago orden de compra OC0008",
    monto: 3074400,
    referencia: "OC-008",
    saldoDespues: 1391320,
  },
  {
    id: "GAS-002",
    fecha: "2024-01-19T14:20:00",
    tipo: "operativo",
    destino: "Gastos operativos",
    concepto: "Gastos mensuales oficina",
    monto: 15000,
    referencia: "GOP-023",
    saldoDespues: 4465720,
  },
]

const cortesData: Corte[] = [
  {
    id: "CORTE-2024-01",
    periodo: "Enero 2024",
    fechaInicio: "2024-01-01",
    fechaFin: "2024-01-31",
    capitalInicial: 1200000,
    ingresos: 2500000,
    gastos: 1850000,
    transferenciaEntrada: 150000,
    transferenciaSalida: 200000,
    capitalFinal: 1800000,
    diferencia: 600000,
    variacion: 50,
    estado: "cerrado",
  },
  {
    id: "CORTE-2024-02",
    periodo: "Febrero 2024",
    fechaInicio: "2024-02-01",
    fechaFin: "2024-02-29",
    capitalInicial: 1800000,
    ingresos: 1900000,
    gastos: 1650000,
    transferenciaEntrada: 100000,
    transferenciaSalida: 303100,
    capitalFinal: 1847320,
    diferencia: 47320,
    variacion: 2.63,
    estado: "abierto",
  },
]

const transferenciasData: Transferencia[] = [
  {
    id: "TRF-001",
    fecha: "2024-01-20T15:00:00",
    tipo: "salida",
    bancoOrigen: "Bóveda Monte",
    bancoDestino: "Utilidades",
    monto: 50000,
    concepto: "Transferencia de utilidades mensuales",
    referencia: "TU-2024-01",
    estado: "completada",
  },
  {
    id: "TRF-002",
    fecha: "2024-01-19T12:30:00",
    tipo: "entrada",
    bancoOrigen: "Banco Azteca",
    bancoDestino: "Bóveda Monte",
    monto: 100000,
    concepto: "Reposición de capital operativo",
    referencia: "RCO-045",
    estado: "completada",
  },
]

const movimientosSemanales = [
  { dia: "Lun", ingresos: 245000, egresos: 132000 },
  { dia: "Mar", ingresos: 352000, egresos: 228000 },
  { dia: "Mié", ingresos: 448000, egresos: 335000 },
  { dia: "Jue", ingresos: 561000, egresos: 442000 },
  { dia: "Vie", ingresos: 470000, egresos: 338000 },
  { dia: "Sáb", ingresos: 355000, egresos: 225000 },
  { dia: "Dom", ingresos: 242000, egresos: 118000 },
]

export default function PanelBanco({ banco }: PanelBancoProps) {
  const [activeTab, setActiveTab] = useState("ingresos")
  const [periodo, setPeriodo] = useState("semana")

  const getGradientColors = (colorClass: string) => {
    const parts = colorClass.split(" ")
    const fromColor = parts.find((p) => p.startsWith("from-"))?.replace("from-", "") || "blue-500"
    const toColor = parts.find((p) => p.startsWith("to-"))?.replace("to-", "") || "purple-500"

    const colorMap: Record<string, string> = {
      "blue-500": "#3b82f6",
      "blue-600": "#2563eb",
      "blue-700": "#1d4ed8",
      "red-500": "#ef4444",
      "red-600": "#dc2626",
      "green-500": "#22c55e",
      "emerald-700": "#047857",
      "orange-500": "#f97316",
      "purple-500": "#a855f7",
      "purple-700": "#7e22ce",
      "cyan-500": "#06b6d4",
      "yellow-500": "#eab308",
      "amber-600": "#d97706",
      white: "#ffffff",
    }

    return {
      from: colorMap[fromColor] || "#3b82f6",
      to: colorMap[toColor] || "#7c3aed",
    }
  }

  const gradientColors = getGradientColors(banco.color)

  const ingresosColumns: ColumnDef<Ingreso>[] = [
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) => {
        const fecha = new Date(row.getValue("fecha"))
        return (
          <div className="flex flex-col">
            <span className="text-white font-medium">{fecha.toLocaleDateString("es-MX")}</span>
            <span className="text-xs text-slate-500">
              {fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const tipo = row.getValue("tipo") as string
        const config = {
          venta: { label: "Venta", className: "bg-green-500/20 text-green-400 border-green-500/30" },
          transferencia: { label: "Transferencia", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
          otro: { label: "Otro", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
        }
        const { label, className } = config[tipo as keyof typeof config]
        return <Badge className={`${className} border`}>{label}</Badge>
      },
    },
    {
      accessorKey: "origen",
      header: "Origen",
      cell: ({ row }) => (
        <div className="max-w-xs">
          <span className="text-slate-300">{row.getValue("origen")}</span>
        </div>
      ),
    },
    {
      accessorKey: "concepto",
      header: "Concepto",
      cell: ({ row }) => <div className="max-w-sm text-slate-400 text-sm">{row.getValue("concepto")}</div>,
    },
    {
      accessorKey: "referencia",
      header: "Referencia",
      cell: ({ row }) => (
        <div className="font-mono text-blue-400 text-sm font-semibold">{row.getValue("referencia")}</div>
      ),
    },
    {
      accessorKey: "monto",
      header: "Monto",
      cell: ({ row }) => {
        const monto = Number.parseFloat(row.getValue("monto"))
        return <div className="font-bold text-green-400 text-lg">+${monto.toLocaleString("es-MX")}</div>
      },
    },
    {
      accessorKey: "saldoDespues",
      header: "Saldo Después",
      cell: ({ row }) => {
        const saldo = Number.parseFloat(row.getValue("saldoDespues"))
        return <div className="text-white font-semibold">${saldo.toLocaleString("es-MX")}</div>
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: () => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const gastosColumns: ColumnDef<Gasto>[] = [
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) => {
        const fecha = new Date(row.getValue("fecha"))
        return (
          <div className="flex flex-col">
            <span className="text-white font-medium">{fecha.toLocaleDateString("es-MX")}</span>
            <span className="text-xs text-slate-500">
              {fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const tipo = row.getValue("tipo") as string
        const config = {
          compra: { label: "Compra", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
          transferencia: { label: "Transferencia", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
          operativo: { label: "Operativo", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
          otro: { label: "Otro", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
        }
        const { label, className } = config[tipo as keyof typeof config]
        return <Badge className={`${className} border`}>{label}</Badge>
      },
    },
    {
      accessorKey: "destino",
      header: "Destino",
      cell: ({ row }) => <div className="text-slate-300">{row.getValue("destino")}</div>,
    },
    {
      accessorKey: "concepto",
      header: "Concepto",
      cell: ({ row }) => <div className="max-w-sm text-slate-400 text-sm">{row.getValue("concepto")}</div>,
    },
    {
      accessorKey: "referencia",
      header: "Referencia",
      cell: ({ row }) => (
        <div className="font-mono text-orange-400 text-sm font-semibold">{row.getValue("referencia")}</div>
      ),
    },
    {
      accessorKey: "monto",
      header: "Monto",
      cell: ({ row }) => {
        const monto = Number.parseFloat(row.getValue("monto"))
        return <div className="font-bold text-red-400 text-lg">-${monto.toLocaleString("es-MX")}</div>
      },
    },
    {
      accessorKey: "saldoDespues",
      header: "Saldo Después",
      cell: ({ row }) => {
        const saldo = Number.parseFloat(row.getValue("saldoDespues"))
        return <div className="text-white font-semibold">${saldo.toLocaleString("es-MX")}</div>
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: () => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const cortesColumns: ColumnDef<Corte>[] = [
    {
      accessorKey: "periodo",
      header: "Periodo",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-white font-semibold">{row.getValue("periodo")}</span>
          <span className="text-xs text-slate-500">
            {new Date(row.original.fechaInicio).toLocaleDateString("es-MX")} -{" "}
            {new Date(row.original.fechaFin).toLocaleDateString("es-MX")}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "capitalInicial",
      header: "Capital Inicial",
      cell: ({ row }) => {
        const monto = Number.parseFloat(row.getValue("capitalInicial"))
        return <div className="text-slate-300 font-medium">${monto.toLocaleString("es-MX")}</div>
      },
    },
    {
      accessorKey: "ingresos",
      header: "Ingresos",
      cell: ({ row }) => {
        const monto = Number.parseFloat(row.getValue("ingresos"))
        return <div className="text-green-400 font-semibold">+${monto.toLocaleString("es-MX")}</div>
      },
    },
    {
      accessorKey: "gastos",
      header: "Gastos",
      cell: ({ row }) => {
        const monto = Number.parseFloat(row.getValue("gastos"))
        return <div className="text-red-400 font-semibold">-${monto.toLocaleString("es-MX")}</div>
      },
    },
    {
      accessorKey: "capitalFinal",
      header: "Capital Final",
      cell: ({ row }) => {
        const monto = Number.parseFloat(row.getValue("capitalFinal"))
        return <div className="text-white font-bold text-lg">${monto.toLocaleString("es-MX")}</div>
      },
    },
    {
      accessorKey: "diferencia",
      header: "Diferencia",
      cell: ({ row }) => {
        const monto = Number.parseFloat(row.getValue("diferencia"))
        const positivo = monto >= 0
        return (
          <div className={`font-bold ${positivo ? "text-green-400" : "text-red-400"}`}>
            {positivo ? "+" : ""}${monto.toLocaleString("es-MX")}
          </div>
        )
      },
    },
    {
      accessorKey: "variacion",
      header: "Variación %",
      cell: ({ row }) => {
        const variacion = Number.parseFloat(row.getValue("variacion"))
        const positivo = variacion >= 0
        return (
          <Badge
            className={
              positivo
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/30"
            }
          >
            {positivo ? "+" : ""}
            {variacion.toFixed(2)}%
          </Badge>
        )
      },
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const estado = row.getValue("estado") as string
        const config = {
          abierto: { label: "Abierto", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
          cerrado: { label: "Cerrado", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
        }
        const { label, className } = config[estado as keyof typeof config]
        return <Badge className={`${className} border`}>{label}</Badge>
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: () => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
          <Download className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const transferenciasColumns: ColumnDef<Transferencia>[] = [
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) => {
        const fecha = new Date(row.getValue("fecha"))
        return (
          <div className="flex flex-col">
            <span className="text-white font-medium">{fecha.toLocaleDateString("es-MX")}</span>
            <span className="text-xs text-slate-500">
              {fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const tipo = row.getValue("tipo") as string
        const config = {
          entrada: {
            label: "Entrada",
            className: "bg-green-500/20 text-green-400 border-green-500/30",
            icon: ArrowDownRight,
          },
          salida: {
            label: "Salida",
            className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
            icon: ArrowUpRight,
          },
        }
        const { label, className, icon: Icon } = config[tipo as keyof typeof config]
        return (
          <Badge className={`${className} border`}>
            <Icon className="h-3 w-3 mr-1" />
            {label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "bancoOrigen",
      header: "Banco Origen",
      cell: ({ row }) => <div className="text-slate-300 font-medium text-sm">{row.getValue("bancoOrigen")}</div>,
    },
    {
      accessorKey: "bancoDestino",
      header: "Banco Destino",
      cell: ({ row }) => <div className="text-slate-300 font-medium text-sm">{row.getValue("bancoDestino")}</div>,
    },
    {
      accessorKey: "monto",
      header: "Monto",
      cell: ({ row }) => {
        const monto = Number.parseFloat(row.getValue("monto"))
        const tipo = row.original.tipo
        return (
          <div className={`font-bold text-lg ${tipo === "entrada" ? "text-green-400" : "text-orange-400"}`}>
            {tipo === "entrada" ? "+" : "-"}${monto.toLocaleString("es-MX")}
          </div>
        )
      },
    },
    {
      accessorKey: "concepto",
      header: "Concepto",
      cell: ({ row }) => <div className="max-w-xs text-slate-400 text-sm">{row.getValue("concepto")}</div>,
    },
    {
      accessorKey: "referencia",
      header: "Referencia",
      cell: ({ row }) => (
        <div className="font-mono text-purple-400 text-sm font-semibold">{row.getValue("referencia")}</div>
      ),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const estado = row.getValue("estado") as string
        const config = {
          completada: { label: "Completada", className: "bg-green-500/20 text-green-400 border-green-500/30" },
          pendiente: { label: "Pendiente", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
          cancelada: { label: "Cancelada", className: "bg-red-500/20 text-red-400 border-red-500/30" },
        }
        const { label, className } = config[estado as keyof typeof config]
        return <Badge className={`${className} border`}>{label}</Badge>
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: () => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const totalIngresos = ingresosData.reduce((sum, i) => sum + i.monto, 0)
  const totalGastos = gastosData.reduce((sum, g) => sum + g.monto, 0)
  const totalTransferencias = transferenciasData.length
  const flujoNeto = totalIngresos - totalGastos

  return (
    <div className="p-6 space-y-6">
      {/* Header con Saldo Principal */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-8"
        style={{
          background: `linear-gradient(to bottom right, ${gradientColors.from}, ${gradientColors.to})`,
        }}
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30">
                <span className="text-white text-2xl font-bold">{banco.nombre[0]}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{banco.nombre}</h1>
                <p className="text-white/80 text-sm">Gestión de cuenta bancaria</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/20 bg-white/10 backdrop-blur-xl"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-xl border border-white/30">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Operación
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <p className="text-white/80 text-sm mb-2">Saldo Actual</p>
              <h2 className="text-4xl font-bold text-white">
                $<AnimatedNumber value={banco.saldo} />
              </h2>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <p className="text-white/80 text-sm mb-2">Flujo Neto</p>
              <h2 className={`text-3xl font-bold ${flujoNeto >= 0 ? "text-green-300" : "text-red-300"}`}>
                {flujoNeto >= 0 ? "+" : ""}${flujoNeto.toLocaleString("es-MX")}
              </h2>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <p className="text-white/80 text-sm mb-2">Transferencias</p>
              <h2 className="text-3xl font-bold text-white">
                <AnimatedNumber value={totalTransferencias} />
              </h2>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Ingresos Totales"
          value={totalIngresos}
          prefix="$"
          icon={ArrowDownRight}
          gradient="from-green-500 to-emerald-500"
          change={12.5}
        />
        <StatsCard
          title="Gastos Totales"
          value={totalGastos}
          prefix="$"
          icon={ArrowUpRight}
          gradient="from-red-500 to-pink-500"
          change={-8.3}
        />
        <StatsCard
          title="Transferencias"
          value={totalTransferencias}
          icon={ArrowLeftRight}
          gradient="from-blue-500 to-cyan-500"
          subtitle="Realizadas"
        />
        <StatsCard
          title="Promedio Diario"
          value={Math.round((totalIngresos - totalGastos) / 7)}
          prefix="$"
          icon={TrendingUp}
          gradient="from-purple-500 to-pink-500"
        />
      </div>

      {/* Chart */}
      <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Flujo de Movimientos</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={periodo === "semana" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodo("semana")}
                className={
                  periodo === "semana"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600"
                    : "border-white/10 text-white hover:bg-white/5"
                }
              >
                Semana
              </Button>
              <Button
                variant={periodo === "mes" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodo("mes")}
                className={
                  periodo === "mes"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600"
                    : "border-white/10 text-white hover:bg-white/5"
                }
              >
                Mes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={movimientosSemanales}>
              <defs>
                <linearGradient id="ingresosGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="egresosGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="dia" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#f1f5f9" }}
              />
              <Area type="monotone" dataKey="ingresos" stroke="#10b981" fill="url(#ingresosGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="egresos" stroke="#ef4444" fill="url(#egresosGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Operaciones del Banco</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 p-1">
              <TabsTrigger
                value="ingresos"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Ingresos
              </TabsTrigger>
              <TabsTrigger
                value="gastos"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Gastos
              </TabsTrigger>
              <TabsTrigger
                value="cortes"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
              >
                <History className="h-4 w-4 mr-2" />
                Cortes
              </TabsTrigger>
              <TabsTrigger
                value="transferencias"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Transferencias
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ingresos" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Input placeholder="Buscar ingreso..." className="w-[300px] bg-white/5 border-white/10 text-white" />
                  <Select>
                    <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Tipo de ingreso" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="venta">Ventas</SelectItem>
                      <SelectItem value="transferencia">Transferencias</SelectItem>
                      <SelectItem value="otro">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white hover:bg-white/5 bg-transparent"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
              <DataTable columns={ingresosColumns} data={ingresosData} searchKey="concepto" />
            </TabsContent>

            <TabsContent value="gastos" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Input placeholder="Buscar gasto..." className="w-[300px] bg-white/5 border-white/10 text-white" />
                  <Select>
                    <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Tipo de gasto" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="compra">Compras</SelectItem>
                      <SelectItem value="operativo">Operativos</SelectItem>
                      <SelectItem value="transferencia">Transferencias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white hover:bg-white/5 bg-transparent"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
              <DataTable columns={gastosColumns} data={gastosData} searchKey="concepto" />
            </TabsContent>

            <TabsContent value="cortes" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Input placeholder="Buscar corte..." className="w-[300px] bg-white/5 border-white/10 text-white" />
                  <Select>
                    <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="abierto">Abierto</SelectItem>
                      <SelectItem value="cerrado">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Generar Corte
                </Button>
              </div>
              <DataTable columns={cortesColumns} data={cortesData} searchKey="periodo" />
            </TabsContent>

            <TabsContent value="transferencias" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Buscar transferencia..."
                    className="w-[300px] bg-white/5 border-white/10 text-white"
                  />
                  <Select>
                    <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="entrada">Entradas</SelectItem>
                      <SelectItem value="salida">Salidas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="completada">Completadas</SelectItem>
                      <SelectItem value="pendiente">Pendientes</SelectItem>
                      <SelectItem value="cancelada">Canceladas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Transferencia
                </Button>
              </div>
              <DataTable columns={transferenciasColumns} data={transferenciasData} searchKey="concepto" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
