"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertTriangle, ArrowUpDown } from "lucide-react"

interface ExchangeRate {
  rate: number
  timestamp: Date
  change24h: number
  rsi: number
  macd: { value: number; signal: number; histogram: number }
  bollingerBands: { upper: number; middle: number; lower: number }
}

interface CurrencyExchangeWidgetProps {
  inventory: {
    usd: number
    mxn: number
  }
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function CurrencyExchangeWidget({
  inventory,
  autoRefresh = true,
  refreshInterval = 30000,
}: CurrencyExchangeWidgetProps) {
  const [rate, setRate] = useState<ExchangeRate>({
    rate: 17.25,
    timestamp: new Date(),
    change24h: 0.32,
    rsi: 52,
    macd: { value: 0.05, signal: 0.03, histogram: 0.02 },
    bollingerBands: { upper: 17.45, middle: 17.25, lower: 17.05 },
  })

  const [spread, setSpread] = useState(0.3)
  const [buyRate, setBuyRate] = useState(17.08)
  const [sellRate, setSellRate] = useState(17.43)

  useEffect(() => {
    const inventoryTotal = inventory.usd + inventory.mxn / rate.rate
    const usdPercentage = inventory.usd / inventoryTotal

    let dynamicSpread = 0.3 // Base spread

    // Adjust for volatility
    if (Math.abs(rate.change24h) > 0.15) {
      dynamicSpread += 0.1 // High volatility
    } else if (Math.abs(rate.change24h) < 0.05) {
      dynamicSpread -= 0.05 // Low volatility
    }

    // Adjust for inventory imbalance
    if (usdPercentage > 0.6) {
      dynamicSpread -= 0.05 // Too much USD, incentivize sales
    } else if (usdPercentage < 0.4) {
      dynamicSpread += 0.05 // Too little USD, disincentivize sales
    }

    setSpread(dynamicSpread)
    setBuyRate(rate.rate - dynamicSpread / 2)
    setSellRate(rate.rate + dynamicSpread / 2)
  }, [rate, inventory])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Simulate rate update (in production, fetch from API)
      const randomChange = (Math.random() - 0.5) * 0.1
      setRate((prev) => ({
        ...prev,
        rate: prev.rate + randomChange,
        change24h: prev.change24h + randomChange,
        timestamp: new Date(),
      }))
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  const inventoryTotal = inventory.usd + inventory.mxn / rate.rate
  const usdPercentage = (inventory.usd / inventoryTotal) * 100
  const mxnPercentage = 100 - usdPercentage

  const getTradingSignal = () => {
    if (rate.rsi < 30) return { signal: "BUY", color: "text-emerald-400", confidence: 85 }
    if (rate.rsi > 70) return { signal: "SELL", color: "text-rose-400", confidence: 85 }
    if (rate.macd.histogram > 0.05) return { signal: "BUY", color: "text-emerald-400", confidence: 70 }
    if (rate.macd.histogram < -0.05) return { signal: "SELL", color: "text-rose-400", confidence: 70 }
    return { signal: "HOLD", color: "text-blue-400", confidence: 50 }
  }

  const signal = getTradingSignal()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Current Rate Card */}
      <motion.div
        className="crystal-card p-6 ambient-glow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white/90">USD/MXN</h3>
          <DollarSign className="w-5 h-5 text-blue-400" />
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-4xl font-bold text-white">${rate.rate.toFixed(4)}</div>
            <div className="flex items-center gap-2 mt-2">
              {rate.change24h >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-400" />
              )}
              <span className={`text-sm ${rate.change24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {rate.change24h >= 0 ? "+" : ""}
                {rate.change24h.toFixed(2)}%
              </span>
              <span className="text-xs text-white/40">24h</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">Compra</span>
              <span className="text-lg font-semibold text-emerald-400">${buyRate.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">Venta</span>
              <span className="text-lg font-semibold text-rose-400">${sellRate.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">Spread</span>
              <span className="text-sm font-medium text-blue-400">${spread.toFixed(2)} MXN</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Technical Analysis Card */}
      <motion.div
        className="crystal-card p-6 ambient-glow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white/90">Análisis Técnico</h3>
          <Activity className="w-5 h-5 text-purple-400" />
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/60">RSI (14)</span>
              <span
                className={`text-sm font-medium ${
                  rate.rsi < 30 ? "text-emerald-400" : rate.rsi > 70 ? "text-rose-400" : "text-blue-400"
                }`}
              >
                {rate.rsi.toFixed(1)}
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  rate.rsi < 30 ? "bg-emerald-500" : rate.rsi > 70 ? "bg-rose-500" : "bg-blue-500"
                }`}
                style={{ width: `${rate.rsi}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/60">MACD</span>
              <span className={`text-sm font-medium ${rate.macd.histogram > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {rate.macd.histogram >= 0 ? "↑" : "↓"} {Math.abs(rate.macd.histogram).toFixed(4)}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Señal</span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${signal.color}`}>{signal.signal}</span>
                <span className="text-xs text-white/40">{signal.confidence}%</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Inventory Status Card */}
      <motion.div
        className="crystal-card p-6 ambient-glow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white/90">Inventario</h3>
          <ArrowUpDown className="w-5 h-5 text-cyan-400" />
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/60">USD</span>
              <span className="text-lg font-semibold text-white">${inventory.usd.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${usdPercentage}%` }}
                />
              </div>
              <span className="text-xs text-white/60 w-12 text-right">{usdPercentage.toFixed(1)}%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/60">MXN</span>
              <span className="text-lg font-semibold text-white">${inventory.mxn.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${mxnPercentage}%` }}
                />
              </div>
              <span className="text-xs text-white/60 w-12 text-right">{mxnPercentage.toFixed(1)}%</span>
            </div>
          </div>

          {(usdPercentage > 70 || usdPercentage < 30) && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-300">
                {usdPercentage > 70
                  ? "Inventario USD alto. Considera vender."
                  : "Inventario USD bajo. Considera comprar."}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
