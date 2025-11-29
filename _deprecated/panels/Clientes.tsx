"use client"
import { Plus, FileDown, Users, TrendingUp, ShoppingCart, DollarSign, Eye, Edit, Phone, MapPin } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { DataTable } from "@/app/components/ui/data-table"
import { StatsCard } from "@/app/components/ui/stats-card"
import type { ColumnDef } from "@tanstack/react-table"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar"

type Cliente = {
  id: string
  nombre: string
  contacto: string
  telefono: string
  email: string
  direccion: string
  totalVentas: number
  saldoPendiente: number
  ultimaVenta: string
  estado: "activo" | "moroso" | "inactivo"
}

const clientesData: Cliente[] = [
  {
    id: "1",
    nombre: "Bódega M-P",
    contacto: "Pedro Martínez",
    telefono: "+52 555 111 2222",
    email: "pedro@bodegamp.com",
    direccion: "Av. Principal 123, CDMX",
    totalVentas: 245000,
    saldoPendiente: 0,
    ultimaVenta: "2024-01-21",
    estado: "activo",
  },
  {
    id: "2",
    nombre: "Valle",
    contacto: "Ana Valle",
    telefono: "+52 555 222 3333",
    email: "ana@valle.com",
    direccion: "Calle Comercio 456, CDMX",
    totalVentas: 180000,
    saldoPendiente: 12000,
    ultimaVenta: "2024-01-20",
    estado: "activo",
  },
  {
    id: "3",
    nombre: "Súper Centro",
    contacto: "Luis González",
    telefono: "+52 555 333 4444",
    email: "luis@supercentro.com",
    direccion: "Boulevard Norte 789, CDMX",
    totalVentas: 320000,
    saldoPendiente: 45000,
    ultimaVenta: "2024-01-15",
    estado: "moroso",
  },
]

const columns: ColumnDef<Cliente>[] = [
  {
    accessorKey: "nombre",
    header: "Cliente",
    cell: ({ row }) => {
      const nombre = row.getValue("nombre") as string
      const initials = nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-500">
            <AvatarFallback className="bg-transparent text-white font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-white">{nombre}</div>
            <div className="text-xs text-slate-500">{row.original.contacto}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-slate-300">
        <Phone className="h-3 w-3 text-slate-500" />
        {row.getValue("telefono")}
      </div>
    ),
  },
  {
    accessorKey: "direccion",
    header: "Dirección",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-slate-300 max-w-xs">
        <MapPin className="h-3 w-3 text-slate-500 flex-shrink-0" />
        <span className="truncate">{row.getValue("direccion")}</span>
      </div>
    ),
  },
  {
    accessorKey: "totalVentas",
    header: "Total Ventas",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("totalVentas"))
      return <div className="font-semibold text-green-400">${amount.toLocaleString("es-MX")}</div>
    },
  },
  {
    accessorKey: "saldoPendiente",
    header: "Saldo Pendiente",
    cell: ({ row }) => {
      const saldo = Number.parseFloat(row.getValue("saldoPendiente"))
      return (
        <div className={`font-semibold ${saldo > 0 ? "text-orange-400" : "text-slate-500"}`}>
          ${saldo.toLocaleString("es-MX")}
        </div>
      )
    },
  },
  {
    accessorKey: "ultimaVenta",
    header: "Última Venta",
    cell: ({ row }) => {
      const fecha = new Date(row.getValue("ultimaVenta"))
      return <div className="text-slate-300">{fecha.toLocaleDateString("es-MX")}</div>
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string
      const config = {
        activo: { label: "Activo", className: "bg-green-500/20 text-green-400" },
        moroso: { label: "Moroso", className: "bg-orange-500/20 text-orange-400" },
        inactivo: { label: "Inactivo", className: "bg-slate-500/20 text-slate-400" },
      }
      const { label, className } = config[estado as keyof typeof config]
      return <Badge className={className}>{label}</Badge>
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: () => (
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

export default function Clientes() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 mt-1">Gestiona tu cartera de clientes</p>
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
            Nuevo Cliente
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Clientes"
          value={clientesData.length}
          icon={Users}
        />
        <StatsCard
          title="Ventas Totales"
          value={745000}
          prefix="$"
          icon={ShoppingCart}
        />
        <StatsCard
          title="Saldo Pendiente"
          value={57000}
          prefix="$"
          icon={TrendingUp}
        />
        <StatsCard
          title="Promedio por Cliente"
          value={248333}
          prefix="$"
          icon={DollarSign}
        />
      </div>

      {/* Tabla */}
      <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Listado de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={clientesData} searchKey="nombre" searchPlaceholder="Buscar cliente..." />
        </CardContent>
      </Card>
    </div>
  )
}
