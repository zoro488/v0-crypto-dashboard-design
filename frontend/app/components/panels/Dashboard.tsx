"use client"

import { motion } from "framer-motion"
import { TrendingUp, ShoppingCart, AlertTriangle, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/app/components/ui/card"
import { Badge } from "@/frontend/app/components/ui/badge"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import { MOCK_DATA, BANCOS } from "@/frontend/app/lib/constants"

const ventasData = [
  { dia: "Lun", ventas: 45000, tendencia: 42000 },
  { dia: "Mar", ventas: 52000, tendencia: 48000 },
  { dia: "Mié", ventas: 48000, tendencia: 51000 },
  { dia: "Jue", ventas: 61000, tendencia: 55000 },
  { dia: "Vie", ventas: 70000, tendencia: 65000 },
  { dia: "Sáb", ventas: 85000, tendencia: 75000 },
  { dia: "Dom", ventas: 72000, tendencia: 70000 },
]

const distribucionBancosData = BANCOS.map((banco) => ({
  name: banco.nombre,
  value: Math.abs(banco.saldo),
  color: banco.color,
}))

const topProductosData = [
  { producto: "Producto A", ventas: 85000 },
  { producto: "Producto B", ventas: 72000 },
  { producto: "Producto C", ventas: 68000 },
  { producto: "Producto D", ventas: 54000 },
  { producto: "Producto E", ventas: 48000 },
]

export default function Dashboard() {
  const cambioVentas = ((MOCK_DATA.ventasHoy - MOCK_DATA.ventasAyer) / MOCK_DATA.ventasAyer) * 100
  const cambioCapital = ((MOCK_DATA.capitalTotal - MOCK_DATA.capitalMesAnterior) / MOCK_DATA.capitalMesAnterior) * 100

  return (
    <div className="p-6 space-y-6">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Ventas del Día"
          value={`$${MOCK_DATA.ventasHoy.toLocaleString("es-MX")}`}
          change={cambioVentas}
          icon={TrendingUp}
          gradient="from-blue-500 to-purple-600"
        />
        <KPICard
          title="Órdenes Pendientes"
          value={MOCK_DATA.ordenesPendientes.toString()}
          change={5}
          icon={ShoppingCart}
          gradient="from-orange-500 to-red-600"
          valuePrefix=""
        />
        <KPICard
          title="Stock Crítico"
          value={MOCK_DATA.stockCritico.toString()}
          change={-2}
          icon={AlertTriangle}
          gradient="from-red-500 to-pink-600"
          valuePrefix=""
          isNegativeGood
        />
        <KPICard
          title="Capital Total"
          value={`$${MOCK_DATA.capitalTotal.toLocaleString("es-MX")}`}
          change={cambioCapital}
          icon={Wallet}
          gradient="from-green-500 to-emerald-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventas Chart */}
        <Card className="lg:col-span-2 bg-slate-900/50 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              Ventas Semanales
              <Badge variant="outline" className="border-white/20 text-white">
                7 días
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={ventasData}>
                <defs>
                  <linearGradient id="ventasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="dia" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  labelStyle={{ color: "#f1f5f9" }}
                />
                <Area type="monotone" dataKey="ventas" stroke="#3b82f6" fill="url(#ventasGradient)" strokeWidth={2} />
                <Area
                  type="monotone"
                  dataKey="tendencia"
                  stroke="#10b981"
                  fill="none"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución Bancos */}
        <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Distribución de Capital</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distribucionBancosData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={(entry) => `${((entry.value / MOCK_DATA.capitalTotal) * 100).toFixed(0)}%`}
                >
                  {distribucionBancosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#${entry.name})`} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  formatter={(value: number) => `$${value.toLocaleString("es-MX")}`}
                />
                <defs>
                  {distribucionBancosData.map((entry, index) => (
                    <linearGradient key={index} id={entry.name} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.color.split(" ")[0].replace("from-", "#")} />
                    </linearGradient>
                  ))}
                </defs>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Productos */}
      <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Top Productos - Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProductosData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="producto" type="category" stroke="#94a3b8" width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                formatter={(value: number) => `$${value.toLocaleString("es-MX")}`}
              />
              <Bar dataKey="ventas" radius={[0, 8, 8, 0]}>
                {topProductosData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${220 - index * 20}, 70%, 50%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Actividad Reciente */}
      <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                tipo: "venta",
                desc: "Nueva venta registrada - Cliente: Bódega M-P",
                monto: "$12,500",
                tiempo: "hace 5 min",
                color: "text-green-400",
              },
              {
                tipo: "orden",
                desc: "Orden de compra creada - OC0010",
                monto: "$45,000",
                tiempo: "hace 15 min",
                color: "text-blue-400",
              },
              {
                tipo: "pago",
                desc: "Pago recibido - Cliente: Valle",
                monto: "$8,200",
                tiempo: "hace 1 hora",
                color: "text-purple-400",
              },
              {
                tipo: "transferencia",
                desc: "Transferencia entre bancos - Bóveda Monte → Utilidades",
                monto: "$25,000",
                tiempo: "hace 2 horas",
                color: "text-orange-400",
              },
            ].map((actividad, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-white text-sm">{actividad.desc}</p>
                  <p className="text-slate-500 text-xs mt-1">{actividad.tiempo}</p>
                </div>
                <p className={`font-semibold ${actividad.color}`}>{actividad.monto}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface KPICardProps {
  title: string
  value: string
  change: number
  icon: any
  gradient: string
  valuePrefix?: string
  isNegativeGood?: boolean
}

function KPICard({
  title,
  value,
  change,
  icon: Icon,
  gradient,
  valuePrefix = "$",
  isNegativeGood = false,
}: KPICardProps) {
  const isPositive = isNegativeGood ? change < 0 : change > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl hover:shadow-2xl transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <Badge variant={isPositive ? "default" : "destructive"} className="flex items-center gap-1">
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}%
            </Badge>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
          <p className="text-sm text-slate-400">{title}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
