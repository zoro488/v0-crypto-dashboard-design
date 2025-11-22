"use client"
import { Plus, FileDown, Users, TrendingUp, ShoppingBag, DollarSign, Eye, Edit, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { StatsCard } from "@/components/ui/stats-card"
import type { ColumnDef } from "@tanstack/react-table"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type Distribuidor = {
  id: string
  nombre: string
  contacto: string
  telefono: string
  email: string
  totalCompras: number
  ordenesActivas: number
  ultimaOrden: string
  estado: "activo" | "inactivo"
}

const distribuidoresData: Distribuidor[] = [
  {
    id: "1",
    nombre: "Distribuidor A",
    contacto: "Juan Pérez",
    telefono: "+52 555 123 4567",
    email: "juan@distribuidora.com",
    totalCompras: 450000,
    ordenesActivas: 3,
    ultimaOrden: "2024-01-20",
    estado: "activo",
  },
  {
    id: "2",
    nombre: "Distribuidor B",
    contacto: "María González",
    telefono: "+52 555 234 5678",
    email: "maria@distribb.com",
    totalCompras: 320000,
    ordenesActivas: 1,
    ultimaOrden: "2024-01-18",
    estado: "activo",
  },
  {
    id: "3",
    nombre: "Distribuidor C",
    contacto: "Carlos López",
    telefono: "+52 555 345 6789",
    email: "carlos@distc.com",
    totalCompras: 580000,
    ordenesActivas: 5,
    ultimaOrden: "2024-01-21",
    estado: "activo",
  },
]

const columns: ColumnDef<Distribuidor>[] = [
  {
    accessorKey: "nombre",
    header: "Distribuidor",
    cell: ({ row }) => {
      const nombre = row.getValue("nombre") as string
      const initials = nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500">
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
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-slate-300">
        <Mail className="h-3 w-3 text-slate-500" />
        {row.getValue("email")}
      </div>
    ),
  },
  {
    accessorKey: "totalCompras",
    header: "Total Compras",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("totalCompras"))
      return <div className="font-semibold text-green-400">${amount.toLocaleString("es-MX")}</div>
    },
  },
  {
    accessorKey: "ordenesActivas",
    header: "Órdenes Activas",
    cell: ({ row }) => {
      const ordenes = row.getValue("ordenesActivas") as number
      return (
        <Badge
          variant="outline"
          className={ordenes > 0 ? "border-orange-500 text-orange-400" : "border-slate-500 text-slate-400"}
        >
          {ordenes} {ordenes === 1 ? "orden" : "órdenes"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "ultimaOrden",
    header: "Última Orden",
    cell: ({ row }) => {
      const fecha = new Date(row.getValue("ultimaOrden"))
      return <div className="text-slate-300">{fecha.toLocaleDateString("es-MX")}</div>
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string
      return (
        <Badge className={estado === "activo" ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}>
          {estado === "activo" ? "Activo" : "Inactivo"}
        </Badge>
      )
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

export default function Distribuidores() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Distribuidores</h1>
          <p className="text-slate-400 mt-1">Gestiona tus proveedores y distribuidores</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5 bg-transparent backdrop-blur-xl"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-purple-500/20">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Distribuidor
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Distribuidores"
          value={distribuidoresData.length}
          icon={Users}
          gradient="from-blue-500 to-cyan-500"
          subtitle="Activos"
        />
        <StatsCard
          title="Compras Totales"
          value={1350000}
          prefix="$"
          icon={ShoppingBag}
          gradient="from-green-500 to-emerald-500"
          change={18.5}
        />
        <StatsCard
          title="Órdenes Activas"
          value={9}
          icon={TrendingUp}
          gradient="from-orange-500 to-red-500"
          subtitle="En proceso"
        />
        <StatsCard
          title="Promedio por Distribuidor"
          value={450000}
          prefix="$"
          icon={DollarSign}
          gradient="from-purple-500 to-pink-500"
        />
      </div>

      {/* Tabla */}
      <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Listado de Distribuidores</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={distribuidoresData}
            searchKey="nombre"
            searchPlaceholder="Buscar distribuidor..."
          />
        </CardContent>
      </Card>
    </div>
  )
}
