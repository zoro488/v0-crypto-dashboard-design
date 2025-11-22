"use client"

import { useState } from "react"
import { FileDown, Download, Calendar, TrendingUp, DollarSign, Package, Users, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

const ventasMensuales = [
  { mes: "Ene", ventas: 450000, compras: 280000, utilidad: 170000 },
  { mes: "Feb", ventas: 520000, compras: 310000, utilidad: 210000 },
  { mes: "Mar", ventas: 480000, compras: 295000, utilidad: 185000 },
  { mes: "Abr", ventas: 610000, compras: 350000, utilidad: 260000 },
  { mes: "May", ventas: 700000, compras: 420000, utilidad: 280000 },
  { mes: "Jun", ventas: 650000, compras: 390000, utilidad: 260000 },
]

const topProductos = [
  { nombre: "Producto A", ventas: 85000, cantidad: 450 },
  { nombre: "Producto B", ventas: 72000, cantidad: 380 },
  { nombre: "Producto C", ventas: 68000, cantidad: 350 },
  { nombre: "Producto D", ventas: 54000, cantidad: 290 },
  { nombre: "Producto E", ventas: 48000, cantidad: 260 },
]

const rendimientoBancos = [
  { banco: "Bóveda Monte", ingresos: 250000, egresos: 180000, saldo: 145000 },
  { banco: "Utilidades", ingresos: 180000, egresos: 120000, saldo: 85000 },
  { banco: "Profit", ingresos: 150000, egresos: 95000, saldo: 72000 },
  { banco: "Fletes", ingresos: 95000, egresos: 78000, saldo: 42000 },
]

export default function Reportes() {
  const [periodo, setPeriodo] = useState("mes")

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white">Reportes</h1>
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </div>
        <div className="flex gap-3">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10">
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mes</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="ano">Año</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5 bg-transparent backdrop-blur-xl"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exportar Todo
          </Button>
        </div>
      </motion.div>

      {/* Resumen Ejecutivo */}
      <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Resumen Ejecutivo - {periodo === "mes" ? "Este Mes" : "Esta Semana"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-white/70">Ventas Totales</p>
                  <p className="text-2xl font-bold text-white">$650K</p>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5%
              </Badge>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-white/70">Productos Vendidos</p>
                  <p className="text-2xl font-bold text-white">1,280</p>
                </div>
              </div>
              <Badge className="bg-blue-500/20 text-blue-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.3%
              </Badge>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-white/70">Clientes Activos</p>
                  <p className="text-2xl font-bold text-white">45</p>
                </div>
              </div>
              <Badge className="bg-purple-500/20 text-purple-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5 nuevos
              </Badge>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-white/70">Margen de Utilidad</p>
                  <p className="text-2xl font-bold text-white">40%</p>
                </div>
              </div>
              <Badge className="bg-orange-500/20 text-orange-400">Excelente</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Reportes */}
      <Tabs defaultValue="ventas" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-white/10">
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="bancos">Bancos</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas" className="space-y-6">
          <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Evolución de Ventas</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5 bg-transparent"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={ventasMensuales}>
                  <defs>
                    <linearGradient id="ventasGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="utilidadGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="mes" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    labelStyle={{ color: "#f1f5f9" }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    stroke="#10b981"
                    fill="url(#ventasGradient)"
                    strokeWidth={2}
                    name="Ventas"
                  />
                  <Area
                    type="monotone"
                    dataKey="utilidad"
                    stroke="#3b82f6"
                    fill="url(#utilidadGradient)"
                    strokeWidth={2}
                    name="Utilidad"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productos" className="space-y-6">
          <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Top Productos por Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topProductos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="nombre" type="category" stroke="#94a3b8" width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  />
                  <Bar dataKey="ventas" fill="#3b82f6" radius={[0, 8, 8, 0]} name="Ventas ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bancos" className="space-y-6">
          <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Rendimiento por Banco</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={rendimientoBancos}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="banco" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  />
                  <Legend />
                  <Bar dataKey="ingresos" fill="#10b981" radius={[8, 8, 0, 0]} name="Ingresos" />
                  <Bar dataKey="egresos" fill="#ef4444" radius={[8, 8, 0, 0]} name="Egresos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparativo" className="space-y-6">
          <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Análisis Comparativo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={ventasMensuales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="mes" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={3} name="Ventas" />
                  <Line type="monotone" dataKey="compras" stroke="#ef4444" strokeWidth={3} name="Compras" />
                  <Line type="monotone" dataKey="utilidad" stroke="#3b82f6" strokeWidth={3} name="Utilidad" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
