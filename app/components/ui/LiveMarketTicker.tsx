'use client'

/**
 * 📈 LIVE MARKET TICKER - Indicador de mercado en tiempo real
 * 
 * Componente que muestra métricas financieras en un ticker animado
 * con efectos premium y actualizaciones en tiempo real
 */

import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Activity, Zap, Clock, Wallet, CreditCard, type LucideIcon } from 'lucide-react'

interface TickerItem {
  id: string
  label: string
  value: string
  change: number
  icon: LucideIcon
  color: string
}

interface LiveMarketTickerProps {
  items?: TickerItem[]
  speed?: number
  className?: string
}

// Datos de ejemplo para el ticker
const defaultTickerItems: TickerItem[] = [
  { id: 'btc', label: 'Capital Total', value: '$2.4M', change: 2.34, icon: DollarSign, color: 'from-blue-500 to-cyan-500' },
  { id: 'eth', label: 'Ventas Hoy', value: '$45.2K', change: -1.23, icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
  { id: 'profit', label: 'Profit Mensual', value: '$128K', change: 5.67, icon: Zap, color: 'from-purple-500 to-pink-500' },
  { id: 'ordenes', label: 'Órdenes Activas', value: '24', change: 8.9, icon: Activity, color: 'from-orange-500 to-amber-500' },
  { id: 'bancos', label: 'Bóveda Monte', value: '$1.2M', change: 1.45, icon: Wallet, color: 'from-indigo-500 to-violet-500' },
  { id: 'transacciones', label: 'Transacciones', value: '156', change: 12.3, icon: CreditCard, color: 'from-pink-500 to-rose-500' },
]

// Componente de item individual del ticker
const TickerItemComponent = ({ item }: { item: TickerItem }) => {
  const IconComponent = item.icon
  const isPositive = item.change >= 0
  
  return (
    <motion.div
      className="flex items-center gap-4 px-6 py-3 min-w-fit"
      whileHover={{ scale: 1.02 }}
    >
      {/* Icon */}
      <motion.div 
        className={`p-2 rounded-xl bg-gradient-to-br ${item.color} shadow-lg`}
        animate={{
          boxShadow: [
            '0 0 20px rgba(59, 130, 246, 0.2)',
            '0 0 30px rgba(59, 130, 246, 0.4)',
            '0 0 20px rgba(59, 130, 246, 0.2)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <IconComponent className="w-4 h-4 text-white" />
      </motion.div>

      {/* Content */}
      <div className="flex flex-col">
        <span className="text-xs text-white/40 font-medium uppercase tracking-wider">
          {item.label}
        </span>
        <span className="text-lg font-bold text-white tracking-tight">
          {item.value}
        </span>
      </div>

      {/* Change Indicator */}
      <motion.div
        className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
          isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
        }`}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span className="text-xs font-bold">
          {isPositive ? '+' : ''}{item.change.toFixed(2)}%
        </span>
      </motion.div>

      {/* Separator */}
      <div className="w-px h-8 bg-white/10 mx-2" />
    </motion.div>
  )
}

// Componente principal del ticker
export function LiveMarketTicker({ 
  items = defaultTickerItems, 
  speed = 30,
  className = '', 
}: LiveMarketTickerProps) {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [isHovered, setIsHovered] = useState(false)

  // Actualizar hora
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Duplicar items para efecto infinito
  const duplicatedItems = useMemo(() => [...items, ...items], [items])

  return (
    <div 
      className={`relative overflow-hidden bg-black/40 backdrop-blur-xl border-y border-white/10 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-black to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-black to-transparent pointer-events-none" />

      {/* Live indicator */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-2">
        <motion.div
          className="w-2 h-2 rounded-full bg-green-500"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="text-xs text-white/60 font-medium uppercase tracking-wider hidden sm:inline">LIVE</span>
      </div>

      {/* Time display */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-2">
        <Clock className="w-3 h-3 text-white/40" />
        <span className="text-xs text-white/60 font-mono">{currentTime}</span>
      </div>

      {/* Ticker content */}
      <motion.div
        className="flex items-center py-2"
        animate={{
          x: isHovered ? 0 : [0, -(items.length * 250)],
        }}
        transition={{
          x: {
            duration: items.length * (speed / 10),
            repeat: Infinity,
            ease: 'linear',
          },
        }}
      >
        {duplicatedItems.map((item, index) => (
          <TickerItemComponent key={`${item.id}-${index}`} item={item} />
        ))}
      </motion.div>
    </div>
  )
}

// Componente de Ticker Vertical para sidebar
export function VerticalMarketTicker({ items = defaultTickerItems }: { items?: TickerItem[] }) {
  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((item, index) => {
        const ItemIconComponent = item.icon
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} group-hover:scale-110 transition-transform`}>
                <ItemIconComponent className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-lg font-bold text-white">{item.value}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              item.change >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
            }`}>
              {item.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="text-xs font-bold">{item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// Componente Mini Ticker para header
export function MiniMarketTicker({ items = defaultTickerItems.slice(0, 3) }: { items?: TickerItem[] }) {
  return (
    <div className="flex items-center gap-4">
      {items.map((item) => {
        const isPositive = item.change >= 0
        return (
          <motion.div
            key={item.id}
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-sm text-white/60">{item.label}</span>
            <span className="text-sm font-bold text-white">{item.value}</span>
            <span className={`text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{item.change.toFixed(1)}%
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

export default LiveMarketTicker
