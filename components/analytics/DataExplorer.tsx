"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart3,
  LineChartIcon,
  PieChartIcon,
  Activity,
  Grid3X3,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { AnimatedCounter } from "@/components/ui/AnimatedCounter"

type ViewMode = "area" | "bar" | "line" | "pie" | "radar" | "heatmap"
type TimeRange = "7d" | "30d" | "90d" | "1y" | "all"

interface DataPoint {
  name: string
  value: number
  category?: string
  date?: string
  [key: string]: any
}

interface DataExplorerProps {
  title: string
  data: DataPoint[]
  metrics?: { key: string; label: string; color: string }[]
  defaultView?: ViewMode
  allowedViews?: ViewMode[]
  onExport?: () => void
  onRefresh?: () => void
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#f97316", "#84cc16"]

export function DataExplorer({
  title,
  data,
  metrics = [{ key: "value", label: "Value", color: "#3b82f6" }],
  defaultView = "area",
  allowedViews = ["area", "bar", "line", "pie", "radar"],
  onExport,
  onRefresh,
}: DataExplorerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView)
  const [timeRange, setTimeRange] = useState<TimeRange>("30d")
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(metrics.map((m) => m.key))
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) return { total: 0, average: 0, change: 0, trend: "neutral" as const }

    const values = data.map((d) => d.value || 0)
    const total = values.reduce((sum, v) => sum + v, 0)
    const average = total / values.length
    const firstValue = values[0]
    const lastValue = values[values.length - 1]
    const change = firstValue ? ((lastValue - firstValue) / firstValue) * 100 : 0
    const trend = change > 0 ? "up" : change < 0 ? "down" : "neutral"

    return { total, average, change, trend }
  }, [data])

  // Filter data by time range
  const filteredData = useMemo(() => {
    if (!data) return []

    const now = new Date()
    const ranges = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365,
      all: Number.MAX_SAFE_INTEGER,
    }

    const days = ranges[timeRange]
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    return data.filter((item) => {
      if (!item.date) return true
      const itemDate = new Date(item.date)
      return itemDate >= cutoff
    })
  }, [data, timeRange])

  // Render different chart types
  const renderChart = () => {
    const chartData = filteredData.length > 0 ? filteredData : data

    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    }

    switch (viewMode) {
      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...commonProps}>
              <defs>
                {metrics.map((metric, idx) => (
                  <linearGradient key={metric.key} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metric.color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff40" fontSize={11} tickLine={false} />
              <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                }}
              />
              {selectedMetrics.map((metricKey, idx) => {
                const metric = metrics.find((m) => m.key === metricKey)
                if (!metric) return null
                return (
                  <Area
                    key={metricKey}
                    type="monotone"
                    dataKey={metricKey}
                    stroke={metric.color}
                    strokeWidth={2}
                    fill={`url(#gradient-${idx})`}
                    animationDuration={1500}
                  />
                )
              })}
            </AreaChart>
          </ResponsiveContainer>
        )

      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff40" fontSize={11} tickLine={false} />
              <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                }}
              />
              {selectedMetrics.map((metricKey) => {
                const metric = metrics.find((m) => m.key === metricKey)
                if (!metric) return null
                return (
                  <Bar
                    key={metricKey}
                    dataKey={metricKey}
                    fill={metric.color}
                    radius={[8, 8, 0, 0]}
                    animationDuration={1200}
                  />
                )
              })}
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#ffffff40" fontSize={11} tickLine={false} />
              <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                }}
              />
              <Legend />
              {selectedMetrics.map((metricKey) => {
                const metric = metrics.find((m) => m.key === metricKey)
                if (!metric) return null
                return (
                  <Line
                    key={metricKey}
                    type="monotone"
                    dataKey={metricKey}
                    stroke={metric.color}
                    strokeWidth={3}
                    dot={{ fill: metric.color, r: 4 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
                animationDuration={1200}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      case "radar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid stroke="#ffffff20" />
              <PolarAngleAxis dataKey="name" stroke="#ffffff60" fontSize={11} />
              <PolarRadiusAxis stroke="#ffffff40" fontSize={10} />
              <Radar
                name={metrics[0]?.label || "Value"}
                dataKey={metrics[0]?.key || "value"}
                stroke={metrics[0]?.color || "#3b82f6"}
                fill={metrics[0]?.color || "#3b82f6"}
                fillOpacity={0.6}
                animationDuration={1500}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const viewIcons: Record<ViewMode, any> = {
    area: Activity,
    bar: BarChart3,
    line: LineChartIcon,
    pie: PieChartIcon,
    radar: Grid3X3,
    heatmap: Grid3X3,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden"
    >
      {/* Header with controls */}
      <div className="relative z-10 p-6 border-b border-zinc-800/50">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">Total:</span>
                <AnimatedCounter value={stats.total} className="text-lg font-bold text-white" />
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                  stats.trend === "up"
                    ? "bg-green-500/10 text-green-400"
                    : stats.trend === "down"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-zinc-500/10 text-zinc-400"
                }`}
              >
                {stats.trend === "up" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : stats.trend === "down" ? (
                  <TrendingDown className="w-4 h-4" />
                ) : null}
                <span className="text-sm font-semibold">{Math.abs(stats.change).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="p-2 bg-zinc-800/50 hover:bg-zinc-800 text-white rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 bg-zinc-800/50 hover:bg-zinc-800 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* View mode selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {allowedViews.map((mode) => {
            const Icon = viewIcons[mode]
            return (
              <motion.button
                key={mode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === mode
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm capitalize">{mode}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Filters panel */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="p-4 bg-zinc-800/30 rounded-lg space-y-4">
                {/* Time range selector */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Time Range</label>
                  <div className="flex gap-2">
                    {(["7d", "30d", "90d", "1y", "all"] as TimeRange[]).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1 rounded-lg text-sm transition-all ${
                          timeRange === range
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700"
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metric selector */}
                {metrics.length > 1 && (
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Metrics</label>
                    <div className="flex flex-wrap gap-2">
                      {metrics.map((metric) => {
                        const isSelected = selectedMetrics.includes(metric.key)
                        return (
                          <button
                            key={metric.key}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedMetrics(selectedMetrics.filter((m) => m !== metric.key))
                              } else {
                                setSelectedMetrics([...selectedMetrics, metric.key])
                              }
                            }}
                            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-all ${
                              isSelected ? "text-white" : "bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700"
                            }`}
                            style={isSelected ? { backgroundColor: metric.color } : {}}
                          >
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metric.color }} />
                            {metric.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chart area */}
      <div className="relative h-[400px] p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {renderChart()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Background glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          style={{ transform: "translate(50%, -50%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          style={{ transform: "translate(-50%, 50%)" }}
        />
      </div>
    </motion.div>
  )
}
