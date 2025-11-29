"use client"

import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Activity } from "lucide-react"
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"

interface AIAnalyticsOverlayProps {
  isVisible: boolean
  data?: any
  type?: "sales" | "inventory" | "clients" | "predictions"
}

export function AIAnalyticsOverlay({ 
  isVisible, 
  data, 
  type = "sales" 
}: AIAnalyticsOverlayProps) {
  const mockSalesData = [
    { month: "Ene", value: 45000, prev: 42000 },
    { month: "Feb", value: 52000, prev: 45000 },
    { month: "Mar", value: 61000, prev: 52000 },
    { month: "Abr", value: 58000, prev: 61000 },
    { month: "May", value: 67000, prev: 58000 },
    { month: "Jun", value: 72000, prev: 67000 },
  ]

  const mockInventoryData = [
    { product: "Prod A", stock: 145 },
    { product: "Prod B", stock: 89 },
    { product: "Prod C", stock: 234 },
    { product: "Prod D", stock: 67 },
  ]

  const metrics = {
    sales: {
      title: "Análisis de Ventas",
      icon: TrendingUp,
      color: "from-emerald-500 to-green-600",
      data: mockSalesData,
      insights: [
        { label: "Incremento mensual", value: "+18.5%", trend: "up" },
        { label: "Ventas totales", value: "$355,000", trend: "up" },
        { label: "Predicción siguiente mes", value: "$78,000", trend: "up" },
      ]
    },
    inventory: {
      title: "Estado de Inventario",
      icon: Package,
      color: "from-blue-500 to-cyan-600",
      data: mockInventoryData,
      insights: [
        { label: "Total productos", value: "535", trend: "neutral" },
        { label: "Productos bajo stock", value: "2", trend: "down" },
        { label: "Rotación promedio", value: "23 días", trend: "up" },
      ]
    },
    clients: {
      title: "Análisis de Clientes",
      icon: Users,
      color: "from-purple-500 to-pink-600",
      data: mockSalesData,
      insights: [
        { label: "Clientes activos", value: "31", trend: "up" },
        { label: "Nuevos este mes", value: "5", trend: "up" },
        { label: "Tasa de retención", value: "94%", trend: "up" },
      ]
    },
    predictions: {
      title: "Predicciones IA",
      icon: Activity,
      color: "from-orange-500 to-red-600",
      data: mockSalesData,
      insights: [
        { label: "Probabilidad objetivo", value: "87%", trend: "up" },
        { label: "Tendencia mercado", value: "Alcista", trend: "up" },
        { label: "Riesgo", value: "Bajo", trend: "neutral" },
      ]
    }
  }

  const currentMetric = metrics[type]
  const Icon = currentMetric.icon

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: 50 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute top-4 right-4 w-[450px] z-30 pointer-events-auto"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${currentMetric.color} blur-2xl opacity-20 rounded-3xl`} />
            
            {/* Main card */}
            <motion.div
              className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
              layoutId={`analytics-${type}`}
            >
              {/* Animated background gradient */}
              <motion.div 
                className={`absolute inset-0 bg-gradient-to-br ${currentMetric.color} opacity-10`}
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 0],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />

              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${currentMetric.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{currentMetric.title}</h3>
                    <p className="text-sm text-white/60">Actualizado en tiempo real</p>
                  </div>
                </div>

                {/* Insights Grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {currentMetric.insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 backdrop-blur-xl rounded-xl p-3 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/60">{insight.label}</span>
                        {insight.trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                        {insight.trend === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
                      </div>
                      <p className="text-lg font-bold text-white">{insight.value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Chart */}
                <div className="h-[180px] bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                  {type === "inventory" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentMetric.data}>
                        <XAxis 
                          dataKey="product" 
                          stroke="#ffffff40" 
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="#ffffff40" 
                          fontSize={11}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(0,0,0,0.9)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            color: "#fff"
                          }}
                        />
                        <Bar 
                          dataKey="stock" 
                          fill="url(#colorGradient)" 
                          radius={[8, 8, 0, 0]}
                        />
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={currentMetric.data}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="month" 
                          stroke="#ffffff40" 
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="#ffffff40" 
                          fontSize={11}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(0,0,0,0.9)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            color: "#fff"
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="prev" 
                          stroke="#6366f1" 
                          fillOpacity={1} 
                          fill="url(#colorPrev)"
                          strokeWidth={2}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#10b981" 
                          fillOpacity={1} 
                          fill="url(#colorValue)"
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* AI Suggestion */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 animate-pulse" />
                    <div>
                      <p className="text-xs font-semibold text-blue-400 mb-1">IA Sugiere:</p>
                      <p className="text-xs text-white/80">
                        {type === "sales" && "Incrementa inventario en 15% para cubrir demanda proyectada del próximo mes."}
                        {type === "inventory" && "Producto D está bajo stock. Genera orden de compra en las próximas 48h."}
                        {type === "clients" && "5 clientes con alta probabilidad de compra. Envía campaña personalizada."}
                        {type === "predictions" && "Tendencia alcista confirmada. Considera expandir catálogo en Q3."}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
