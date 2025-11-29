"use client"

import { motion } from "framer-motion"
import { DollarSign, TrendingUp, BarChart3, History } from "lucide-react"
import CurrencyExchangeWidget from "@/app/components/widgets/CurrencyExchangeWidget"

export default function BentoCasaCambio() {
  const inventory = {
    usd: 50000,
    mxn: 850000,
  }

  const recentTransactions = [
    { id: 1, type: "Venta", amount: 1000, rate: 17.43, profit: 300, time: "10:30 AM" },
    { id: 2, type: "Compra", amount: 2500, rate: 17.08, profit: 750, time: "11:15 AM" },
    { id: 3, type: "Venta", amount: 500, rate: 17.45, profit: 150, time: "12:00 PM" },
    { id: 4, type: "Compra", amount: 3000, rate: 17.1, profit: 900, time: "1:45 PM" },
  ]

  const dailyStats = {
    volume: 15000,
    transactions: 24,
    profit: 5250,
    avgSpread: 0.32,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Casa de Cambio</h1>
          <p className="text-white/60">Sistema de tipo de cambio USD/MXN con análisis en tiempo real</p>
        </div>
        <DollarSign className="w-12 h-12 text-emerald-400" />
      </motion.div>

      {/* Exchange Rate Widget */}
      <CurrencyExchangeWidget inventory={inventory} />

      {/* Daily Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          className="crystal-card p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Volumen Diario</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">${dailyStats.volume.toLocaleString()}</div>
          <div className="text-xs text-emerald-400 mt-1">USD</div>
        </motion.div>

        <motion.div
          className="crystal-card p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Transacciones</span>
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">{dailyStats.transactions}</div>
          <div className="text-xs text-blue-400 mt-1">Hoy</div>
        </motion.div>

        <motion.div
          className="crystal-card p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Ganancia</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white">${dailyStats.profit.toLocaleString()}</div>
          <div className="text-xs text-emerald-400 mt-1">MXN</div>
        </motion.div>

        <motion.div
          className="crystal-card p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Spread Promedio</span>
            <History className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white">${dailyStats.avgSpread.toFixed(2)}</div>
          <div className="text-xs text-cyan-400 mt-1">MXN</div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        className="crystal-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3 className="text-xl font-semibold text-white mb-4">Transacciones Recientes</h3>
        <div className="space-y-3">
          {recentTransactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tx.type === "Venta" ? "bg-rose-500/20" : "bg-emerald-500/20"
                  }`}
                >
                  <DollarSign className={`w-5 h-5 ${tx.type === "Venta" ? "text-rose-400" : "text-emerald-400"}`} />
                </div>
                <div>
                  <div className="font-medium text-white">{tx.type} USD</div>
                  <div className="text-sm text-white/60">{tx.time}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-white">${tx.amount.toLocaleString()} USD</div>
                <div className="text-sm text-emerald-400">+${tx.profit} MXN</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
