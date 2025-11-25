"use client"

import { useState } from "react"
import { Plus, FileDown, Eye, Edit, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/frontend/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/app/components/ui/card"
import { Badge } from "@/frontend/app/components/ui/badge"
import { DataTable } from "@/frontend/app/components/ui/data-table"
import { StatsCard } from "@/frontend/app/components/ui/stats-card"
import { CreateOrdenCompraModal } from "@/frontend/app/components/modals/CreateOrdenCompraModal"
import type { ColumnDef } from "@tanstack/react-table"
import { motion } from "framer-motion"

type OrdenCompra = {
  id: string
  numero: string
  fecha: string
  distribuidor: string
  total: number
  estado: "pendiente" | "parcial" | "completo"
  productos: number
  banco: string
}

const ordenesData: OrdenCompra[] = [
  {
    id: "1",
    numero: "OC0001",
    fecha: "2024-01-15",
    distribuidor: "Distribuidor A",
    total: 45000,
    estado: "completo",
    productos: 5,
    banco: "Bóveda Monte",
  },
  {
    id: "2",
    numero: "OC0002",
    fecha: "2024-01-16",
    distribuidor: "Distribuidor B",
    total: 32000,
    estado: "parcial",
    productos: 3,
    banco: "Utilidades",
  },
  {
    id: "3",
    numero: "OC0003",
    fecha: "2024-01-17",
    distribuidor: "Distribuidor C",
    total: 58000,
    estado: "pendiente",
    productos: 7,
    banco: "Bóveda USA",
  },
]

const columns: ColumnDef<OrdenCompra>[] = [
  {
    accessorKey: "numero",
    header: "Número",
    cell: ({ row }) => <div className="font-mono font-semibold text-blue-400">{row.getValue("numero")}</div>,
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
    accessorKey: "distribuidor",
    header: "Distribuidor",
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
    accessorKey: "banco",
    header: "Banco",
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string
      const badgeConfig = {
        pendiente: { label: "Pendiente", className: "bg-orange-500/20 text-orange-400", icon: Clock },
        parcial: { label: "Parcial", className: "bg-blue-500/20 text-blue-400", icon: Clock },
        completo: { label: "Completo", className: "bg-green-500/20 text-green-400", icon: CheckCircle },
      }
      const config = badgeConfig[estado as keyof typeof badgeConfig]
      const Icon = config.icon
      return (
        <Badge className={config.className}>
          <Icon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
]

export default function OrdenesCompra() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Órdenes de Compra</h1>
          <p className="text-slate-400 mt-1">Gestiona las órdenes de compra a distribuidores</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5 bg-transparent backdrop-blur-xl"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-purple-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Orden
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Órdenes" value={245} subtitle="Desde inicio" gradient="from-blue-500 to-cyan-500" />
        <StatsCard
          title="Pendientes"
          value={23}
          subtitle="Por pagar"
          gradient="from-orange-500 to-red-500"
          badgeColor="orange"
        />
        <StatsCard
          title="Este Mes"
          value={1245000}
          prefix="$"
          subtitle="+15.3% vs mes anterior"
          gradient="from-green-500 to-emerald-500"
          change={15.3}
        />
        <StatsCard title="Distribuidores" value={6} subtitle="Activos" gradient="from-purple-500 to-pink-500" />
      </div>

      {/* Tabla */}
      <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Historial de Órdenes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={ordenesData} searchKey="numero" searchPlaceholder="Buscar por número..." />
        </CardContent>
      </Card>

      <CreateOrdenCompraModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  )
}
