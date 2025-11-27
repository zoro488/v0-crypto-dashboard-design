"use client"

import { useState } from "react"
import { Plus, FileDown, Package, TrendingUp, TrendingDown, DollarSign, Target, Filter } from "lucide-react"
import { Button } from "@/frontend/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/app/components/ui/card"
import { Badge } from "@/frontend/app/components/ui/badge"
import { DataTable } from "@/frontend/app/components/ui/data-table"
import { AnimatedNumber } from "@/frontend/app/components/ui/animated-number"
import { Input } from "@/frontend/app/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/app/components/ui/tabs"
import type { ColumnDef } from "@tanstack/react-table"
import { motion } from "framer-motion"
import {
  productosAlmacen,
  entradasAlmacen,
  salidasAlmacen,
  modificacionesAlmacen,
  type ProductoAlmacen,
  type EntradaAlmacen,
  type SalidaAlmacen,
  type ModificacionAlmacen,
} from "@/frontend/app/lib/data/warehouse-data"

export default function Almacen() {
  const [activeTab, setActiveTab] = useState("entradas")

  const totalEntradas = entradasAlmacen.reduce((sum, e) => sum + e.cantidad, 0)
  const valorEntradas = entradasAlmacen.reduce((sum, e) => sum + e.total, 0)

  const totalSalidas = salidasAlmacen.reduce((sum, s) => sum + s.cantidad, 0)
  const valorSalidas = salidasAlmacen.reduce((sum, s) => sum + s.total, 0)

  const stockActualCantidad = productosAlmacen.reduce((sum, p) => sum + p.stockActual, 0)
  const valorStockActual = productosAlmacen.reduce((sum, p) => sum + p.stockActual * p.precioCompra, 0)

  const potencialVentas = productosAlmacen.reduce((sum, p) => sum + p.stockActual * p.precioVenta, 0)
  // </CHANGE>

  // Columns for Entradas table
  const columnasEntradas: ColumnDef<EntradaAlmacen>[] = [
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) => (
        <div className="text-slate-300 font-mono text-sm">
          {new Date(row.getValue("fecha")).toLocaleDateString("es-MX")}
        </div>
      ),
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const tipo = row.getValue("tipo") as string
        const config = {
          compra: { label: "Compra", className: "bg-blue-500/20 text-blue-400" },
          ajuste: { label: "Ajuste", className: "bg-purple-500/20 text-purple-400" },
          devolucion: { label: "Devolución", className: "bg-orange-500/20 text-orange-400" },
        }
        const { label, className } = config[tipo as keyof typeof config]
        return <Badge className={className}>{label}</Badge>
      },
    },
    {
      accessorKey: "distribuidor",
      header: "Distribuidor",
      cell: ({ row }) => <div className="text-white font-medium">{row.getValue("distribuidor") || "-"}</div>,
    },
    {
      accessorKey: "productoNombre",
      header: "Producto",
      cell: ({ row }) => <div className="text-slate-300">{row.getValue("productoNombre")}</div>,
    },
    {
      accessorKey: "cantidad",
      header: "Cantidad",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-400" />
          <span className="text-green-400 font-bold">{row.getValue("cantidad")}</span>
        </div>
      ),
    },
    {
      accessorKey: "precioUnitario",
      header: "Precio Unit.",
      cell: ({ row }) => {
        const precio = Number.parseFloat(row.getValue("precioUnitario"))
        return <div className="text-slate-300">${precio.toLocaleString("es-MX")}</div>
      },
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => {
        const total = Number.parseFloat(row.getValue("total"))
        return <div className="text-white font-bold">${total.toLocaleString("es-MX")}</div>
      },
    },
  ]

  // Columns for Salidas table
  const columnasSalidas: ColumnDef<SalidaAlmacen>[] = [
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) => (
        <div className="text-slate-300 font-mono text-sm">
          {new Date(row.getValue("fecha")).toLocaleDateString("es-MX")}
        </div>
      ),
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const tipo = row.getValue("tipo") as string
        const config = {
          venta: { label: "Venta", className: "bg-green-500/20 text-green-400" },
          ajuste: { label: "Ajuste", className: "bg-purple-500/20 text-purple-400" },
          merma: { label: "Merma", className: "bg-red-500/20 text-red-400" },
        }
        const { label, className } = config[tipo as keyof typeof config]
        return <Badge className={className}>{label}</Badge>
      },
    },
    {
      accessorKey: "cliente",
      header: "Cliente",
      cell: ({ row }) => <div className="text-white font-medium">{row.getValue("cliente") || "-"}</div>,
    },
    {
      accessorKey: "productoNombre",
      header: "Producto",
      cell: ({ row }) => <div className="text-slate-300">{row.getValue("productoNombre")}</div>,
    },
    {
      accessorKey: "cantidad",
      header: "Cantidad",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-red-400" />
          <span className="text-red-400 font-bold">{row.getValue("cantidad")}</span>
        </div>
      ),
    },
    {
      accessorKey: "precioVenta",
      header: "Precio Venta",
      cell: ({ row }) => {
        const precio = Number.parseFloat(row.getValue("precioVenta"))
        return <div className="text-slate-300">${precio.toLocaleString("es-MX")}</div>
      },
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => {
        const total = Number.parseFloat(row.getValue("total"))
        return <div className="text-white font-bold">${total.toLocaleString("es-MX")}</div>
      },
    },
  ]

  // Columns for Stock Actual table
  const columnasStock: ColumnDef<ProductoAlmacen>[] = [
    {
      accessorKey: "codigo",
      header: "Código",
      cell: ({ row }) => <div className="font-mono font-semibold text-blue-400">{row.getValue("codigo")}</div>,
    },
    {
      accessorKey: "nombre",
      header: "Producto",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-white">{row.getValue("nombre")}</div>
          <div className="text-xs text-slate-500">{row.original.categoria}</div>
        </div>
      ),
    },
    {
      accessorKey: "stockActual",
      header: "Stock Actual",
      cell: ({ row }) => {
        const stock = row.getValue("stockActual") as number
        return (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-purple-400" />
            <span className="text-white font-bold text-lg">{stock}</span>
            <span className="text-xs text-slate-500">{row.original.unidad}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "precioCompra",
      header: "Precio Compra",
      cell: ({ row }) => {
        const precio = Number.parseFloat(row.getValue("precioCompra"))
        return <div className="text-slate-300">${precio.toLocaleString("es-MX")}</div>
      },
    },
    {
      accessorKey: "precioVenta",
      header: "Precio Venta",
      cell: ({ row }) => {
        const precio = Number.parseFloat(row.getValue("precioVenta"))
        return <div className="text-green-400 font-semibold">${precio.toLocaleString("es-MX")}</div>
      },
    },
    {
      id: "valorStock",
      header: "Valor en Stock",
      cell: ({ row }) => {
        const valor = row.original.stockActual * row.original.precioCompra
        return <div className="text-white font-bold">${valor.toLocaleString("es-MX")}</div>
      },
    },
    {
      id: "potencial",
      header: "Potencial Venta",
      cell: ({ row }) => {
        const potencial = row.original.stockActual * row.original.precioVenta
        return <div className="text-green-400 font-bold">${potencial.toLocaleString("es-MX")}</div>
      },
    },
  ]

  // Columns for Modificaciones table
  const columnasModificaciones: ColumnDef<ModificacionAlmacen>[] = [
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) => (
        <div className="text-slate-300 font-mono text-sm">
          {new Date(row.getValue("fecha")).toLocaleDateString("es-MX")}
        </div>
      ),
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const tipo = row.getValue("tipo") as string
        const config = {
          entrada: { label: "Entrada", className: "bg-green-500/20 text-green-400" },
          salida: { label: "Salida", className: "bg-red-500/20 text-red-400" },
          ajuste: { label: "Ajuste", className: "bg-purple-500/20 text-purple-400" },
        }
        const { label, className } = config[tipo as keyof typeof config]
        return <Badge className={className}>{label}</Badge>
      },
    },
    {
      accessorKey: "productoNombre",
      header: "Producto",
      cell: ({ row }) => <div className="text-white font-medium">{row.getValue("productoNombre")}</div>,
    },
    {
      accessorKey: "cantidadAnterior",
      header: "Cantidad Anterior",
      cell: ({ row }) => <div className="text-slate-400">{row.getValue("cantidadAnterior")}</div>,
    },
    {
      accessorKey: "cantidadNueva",
      header: "Cantidad Nueva",
      cell: ({ row }) => <div className="text-white font-semibold">{row.getValue("cantidadNueva")}</div>,
    },
    {
      accessorKey: "diferencia",
      header: "Diferencia",
      cell: ({ row }) => {
        const diff = row.getValue("diferencia") as number
        const isPositive = diff > 0
        return (
          <div className={`font-bold flex items-center gap-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}
            {diff}
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </div>
        )
      },
    },
    {
      accessorKey: "motivo",
      header: "Motivo",
      cell: ({ row }) => <div className="text-slate-300 text-sm">{row.getValue("motivo")}</div>,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Almacén e Inventario
          </h1>
          <p className="text-slate-400 mt-1">Control completo de entradas, salidas y stock</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5 bg-transparent backdrop-blur-xl"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Entradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">
                  <AnimatedNumber value={totalEntradas} />
                  <span className="text-sm text-slate-400 ml-2">unidades</span>
                </div>
                <div className="text-xs text-green-400">Valor: ${valorEntradas.toLocaleString("es-MX")} USD</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/20 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Total Salidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">
                  <AnimatedNumber value={totalSalidas} />
                  <span className="text-sm text-slate-400 ml-2">unidades</span>
                </div>
                <div className="text-xs text-red-400">Valor: ${valorSalidas.toLocaleString("es-MX")} USD</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-400 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Stock Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">
                  <AnimatedNumber value={stockActualCantidad} />
                  <span className="text-sm text-slate-400 ml-2">unidades</span>
                </div>
                <div className="text-xs text-purple-400">Valor: ${valorStockActual.toLocaleString("es-MX")} USD</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-400 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Potencial de Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">${(potencialVentas / 1000).toFixed(0)}K</div>
                <div className="text-xs text-yellow-400">Si se vende todo el stock actual</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      {/* </CHANGE> */}

      <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Gestión de Almacén</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Buscar..."
                className="w-[200px] bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
              <Button
                variant="outline"
                size="icon"
                className="border-white/10 text-white hover:bg-white/5 bg-transparent"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/5 p-1">
              <TabsTrigger
                value="entradas"
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Entradas
              </TabsTrigger>
              <TabsTrigger
                value="salidas"
                className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Salidas
              </TabsTrigger>
              <TabsTrigger
                value="stock"
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
              >
                <Package className="h-4 w-4 mr-2" />
                Stock Actual
              </TabsTrigger>
              <TabsTrigger
                value="modificaciones"
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Modificaciones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="entradas" className="mt-6">
              <DataTable columns={columnasEntradas} data={entradasAlmacen} searchKey="productoNombre" />
            </TabsContent>

            <TabsContent value="salidas" className="mt-6">
              <DataTable columns={columnasSalidas} data={salidasAlmacen} searchKey="productoNombre" />
            </TabsContent>

            <TabsContent value="stock" className="mt-6">
              <DataTable columns={columnasStock} data={productosAlmacen} searchKey="nombre" />
            </TabsContent>

            <TabsContent value="modificaciones" className="mt-6">
              <DataTable columns={columnasModificaciones} data={modificacionesAlmacen} searchKey="productoNombre" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {/* </CHANGE> */}
    </div>
  )
}
