"use client"

import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion"
import { TrendingUp, Sparkles } from "lucide-react"
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts"
import { SafeChartContainer, SAFE_ANIMATION_PROPS } from "@/app/components/ui/SafeChartContainer"
import { useState } from "react"

interface RevenueWidgetProps {
  value: number
  change: number
  data: { time: string; value: number }[]
  sparkle?: boolean
}

export default function RevenueWidget({ value, change, data, sparkle = true }: RevenueWidgetProps) {
  const [isHovered, setIsHovered] = useState(false)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useTransform(mouseY, [-100, 100], [5, -5])
  const rotateY = useTransform(mouseX, [-100, 100], [-5, 5])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        mouseX.set(e.clientX - rect.left - rect.width / 2)
        mouseY.set(e.clientY - rect.top - rect.height / 2)
      }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="relative col-span-12 md:col-span-6 lg:col-span-4 h-[280px] rounded-[32px] overflow-hidden cursor-pointer"
    >
      {/* Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 backdrop-blur-xl border border-white/10" />

      {/* Animated Gradient Orbs */}
      <motion.div
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
          opacity: isHovered ? [0.3, 0.5, 0.3] : 0.2,
        }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/30 rounded-full blur-3xl"
      />

      <div className="relative h-full p-6 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 mb-2"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-white/60 text-sm font-medium tracking-wide">Ingresos Totales</span>
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-5xl font-bold text-white tracking-tight"
            >
              ${(value / 1000).toFixed(1)}K
            </motion.h3>
          </div>

          <AnimatePresence>
            {sparkle && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/25"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mini Chart */}
        <div className="h-20 w-full -mb-6 -mx-6">
          <SafeChartContainer height={80} minHeight={60}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    return (
                      <div className="bg-black/90 backdrop-blur-xl px-3 py-2 rounded-xl border border-white/10">
                        <p className="text-white font-bold">${payload[0].value}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGradient)" {...SAFE_ANIMATION_PROPS} />
            </AreaChart>
          </SafeChartContainer>
        </div>

        {/* Change Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 w-fit"
        >
          <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </motion.div>
          <span className="text-emerald-400 font-bold text-sm">+{change}%</span>
          <span className="text-white/50 text-xs">vs mes anterior</span>
        </motion.div>
      </div>

      {/* Shine Effect on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: "100%", opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            style={{ transform: "skewX(-20deg)" }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
