"use client"

import { motion } from "framer-motion"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface InteractiveChartProps {
  data: any[]
  dataKey: string
  title: string
  color?: string
  gradientId?: string
}

export function InteractiveChart({
  data,
  dataKey,
  title,
  color = "#3b82f6",
  gradientId = "colorValue",
}: InteractiveChartProps) {
  const [isHovered, setIsHovered] = useState(false)

  const firstValue = data[0]?.[dataKey] || 0
  const lastValue = data[data.length - 1]?.[dataKey] || 0
  const percentChange = ((lastValue - firstValue) / firstValue) * 100
  const isPositive = percentChange >= 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative p-6 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden group"
    >
      {/* Glow Effect */}
      <motion.div
        animate={{
          opacity: isHovered ? 0.3 : 0.1,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.3 }}
        className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl"
        style={{ backgroundColor: color }}
      />

      {/* Header */}
      <div className="relative z-10 mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-white">${lastValue.toLocaleString()}</span>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
              }`}
            >
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="text-sm font-semibold">{Math.abs(percentChange).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative z-10 h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="name" stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                backdropFilter: "blur(10px)",
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
