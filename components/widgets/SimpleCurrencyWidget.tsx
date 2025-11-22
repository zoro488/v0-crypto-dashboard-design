"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react"

export default function SimpleCurrencyWidget() {
  const [exchangeRate, setExchangeRate] = useState(19.45)
  const [trend, setTrend] = useState<"up" | "down">("up")
  const [beneficia, setBeneficia] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      const variation = (Math.random() - 0.5) * 0.1
      const newRate = Math.max(18.5, Math.min(20.5, exchangeRate + variation))
      setExchangeRate(newRate)
      setTrend(variation > 0 ? "up" : "down")
      // Beneficia si está entre 19.00 y 19.80 (zona óptima)
      setBeneficia(newRate >= 19.0 && newRate <= 19.8)
    }, 3000)

    return () => clearInterval(interval)
  }, [exchangeRate])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass p-4 rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/5 to-purple-500/5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-medium text-white/60 uppercase tracking-wider">USD / MXN</span>
        </div>
        {trend === "up" ? (
          <ArrowUpRight className="w-4 h-4 text-green-400" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-red-400" />
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <motion.span
          key={exchangeRate}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="text-2xl font-bold text-white tracking-tight"
        >
          ${exchangeRate.toFixed(2)}
        </motion.span>
        <span className="text-xs text-white/40">MXN</span>
      </div>

      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-1 text-xs font-medium ${trend === "up" ? "text-green-400" : "text-red-400"}`}
        >
          {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{trend === "up" ? "+" : "-"}0.03%</span>
        </div>

        <div
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
            beneficia
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {beneficia ? "Beneficia" : "No Óptimo"}
        </div>
      </div>
    </motion.div>
  )
}
