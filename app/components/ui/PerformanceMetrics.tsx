"use client"

/**
 * 🎯 PERFORMANCE METRICS - Panel de métricas de rendimiento premium
 * 
 * Visualizaciones avanzadas de KPIs con animaciones y efectos 3D
 */

import { motion } from "framer-motion"
import { useState, useMemo } from "react"
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
} from "lucide-react"
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Cell,
} from "recharts"

// ============================================================
// TIPOS
// ============================================================
interface MetricData {
  label: string
  value: number
  target: number
  unit?: string
  trend: "up" | "down" | "stable"
  color: string
}

interface PerformanceMetricsProps {
  className?: string
}

// ============================================================
// DATOS DE MÉTRICAS
// ============================================================
const metricsData: MetricData[] = [
  { label: "Margen Bruto", value: 42, target: 45, unit: "%", trend: "up", color: "#3b82f6" },
  { label: "Rotación Stock", value: 78, target: 85, unit: "%", trend: "up", color: "#10b981" },
  { label: "Satisfacción", value: 94, target: 90, unit: "%", trend: "up", color: "#8b5cf6" },
  { label: "Cumplimiento", value: 89, target: 95, unit: "%", trend: "down", color: "#f59e0b" },
]

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

// Gauge circular individual
const CircularGauge = ({ metric, index }: { metric: MetricData; index: number }) => {
  const percentage = (metric.value / metric.target) * 100
  const isAboveTarget = metric.value >= metric.target

  const gaugeData = [
    { name: "value", value: percentage, fill: metric.color },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="relative flex flex-col items-center"
    >
      {/* Gauge */}
      <div className="relative w-24 h-24 md:w-28 md:h-28">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            data={gaugeData}
          >
            <RadialBar
              background={{ fill: "rgba(255,255,255,0.1)" }}
              dataKey="value"
              cornerRadius={10}
            >
              <Cell fill={metric.color} />
            </RadialBar>
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-xl md:text-2xl font-bold text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 + 0.3 }}
          >
            {metric.value}{metric.unit}
          </motion.span>
        </div>
      </div>

      {/* Label & Status */}
      <div className="mt-2 text-center">
        <p className="text-xs md:text-sm text-white/60 font-medium">{metric.label}</p>
        <div className="flex items-center justify-center gap-1 mt-1">
          {isAboveTarget ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-3 h-3 text-amber-400" />
          )}
          <span className={`text-[10px] ${isAboveTarget ? "text-emerald-400" : "text-amber-400"}`}>
            {isAboveTarget ? "En objetivo" : `${metric.target}${metric.unit} objetivo`}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// Barra de progreso horizontal
const HorizontalProgressBar = ({ 
  label, 
  value, 
  maxValue, 
  color,
  index 
}: { 
  label: string
  value: number
  maxValue: number
  color: string
  index: number 
}) => {
  const percentage = (value / maxValue) * 100

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60">{label}</span>
        <span className="text-xs font-bold text-white">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ delay: index * 0.1 + 0.2, duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  )
}

// Status Badge
const StatusBadge = ({ 
  status, 
  label 
}: { 
  status: "success" | "warning" | "error" | "info"
  label: string 
}) => {
  const statusConfig = {
    success: { icon: CheckCircle2, color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    warning: { icon: AlertTriangle, color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    error: { icon: XCircle, color: "bg-red-500/15 text-red-400 border-red-500/30" },
    info: { icon: Activity, color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.color}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">{label}</span>
    </motion.div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function PerformanceMetrics({ className = "" }: PerformanceMetricsProps) {
  const [activeTab, setActiveTab] = useState<"gauges" | "progress">("gauges")

  // Datos de progreso
  const progressData = useMemo(() => [
    { label: "Ventas Diarias", value: 45200, maxValue: 60000, color: "#3b82f6" },
    { label: "Órdenes Procesadas", value: 87, maxValue: 100, color: "#10b981" },
    { label: "Entregas Completadas", value: 42, maxValue: 50, color: "#8b5cf6" },
    { label: "Nuevos Clientes", value: 12, maxValue: 20, color: "#f59e0b" },
    { label: "Devoluciones", value: 3, maxValue: 10, color: "#ef4444" },
  ], [])

  return (
    <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Performance Metrics
          </h3>
          <p className="text-xs md:text-sm text-white/40">KPIs en tiempo real</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
          {(["gauges", "progress"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab === "gauges" ? "Gauges" : "Progreso"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === "gauges" ? (
        <>
          {/* Circular Gauges */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            {metricsData.map((metric, index) => (
              <CircularGauge key={metric.label} metric={metric} index={index} />
            ))}
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
            <StatusBadge status="success" label="Sistema Operativo" />
            <StatusBadge status="info" label="247 Transacciones Hoy" />
            <StatusBadge status="warning" label="3 Alertas Pendientes" />
          </div>
        </>
      ) : (
        <>
          {/* Progress Bars */}
          <div className="space-y-4">
            {progressData.map((item, index) => (
              <HorizontalProgressBar key={item.label} {...item} index={index} />
            ))}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">+23%</p>
              <p className="text-xs text-white/40">vs Ayer</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">$1.2M</p>
              <p className="text-xs text-white/40">Esta Semana</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">94%</p>
              <p className="text-xs text-white/40">Eficiencia</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// COMPONENTE MINI PARA SIDEBAR
// ============================================================
export function MiniPerformanceWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-500/10 via-black to-blue-500/10 backdrop-blur-xl border border-white/10 rounded-2xl p-4 overflow-hidden relative"
    >
      {/* Animated glow */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(circle at 20% 20%, rgba(139,92,246,0.2) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 80%, rgba(59,130,246,0.2) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 20%, rgba(139,92,246,0.2) 0%, transparent 50%)",
          ]
        }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20">
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-sm font-bold text-white">Rendimiento</span>
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="w-4 h-4 text-yellow-400" />
          </motion.div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 rounded-xl bg-white/5">
            <p className="text-lg font-bold text-emerald-400">92%</p>
            <p className="text-[10px] text-white/40">Eficiencia</p>
          </div>
          <div className="p-2 rounded-xl bg-white/5">
            <p className="text-lg font-bold text-blue-400">+15%</p>
            <p className="text-[10px] text-white/40">Crecimiento</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default PerformanceMetrics
