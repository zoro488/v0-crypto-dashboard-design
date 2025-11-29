'use client'

import { motion } from 'framer-motion'
import { Package, TrendingDown } from 'lucide-react'
import { useState, useEffect } from 'react'

interface CircularProgressWidgetProps {
  title: string
  value: number
  max: number
  unit?: string
  change?: number
  color?: string
}

export default function CircularProgressWidget({
  title,
  value,
  max,
  unit = '',
  change = 0,
  color = 'from-violet-500 to-purple-400',
}: CircularProgressWidgetProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 200)
    return () => clearTimeout(timer)
  }, [value])

  const percentage = Math.min((animatedValue / max) * 100, 100)
  const circumference = 2 * Math.PI * 58
  const strokeDashoffset = circumference - (circumference * percentage) / 100

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative col-span-6 md:col-span-3 h-[280px] rounded-[32px] overflow-hidden cursor-pointer group"
    >
      {/* Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-transparent backdrop-blur-xl border border-white/10" />

      <div className="relative h-full p-6 flex flex-col items-center justify-center">
        {/* Circular Progress */}
        <div className="relative">
          <svg className="w-32 h-32 -rotate-90">
            {/* Background Circle */}
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-white/10"
            />

            {/* Progress Circle */}
            <motion.circle
              cx="64"
              cy="64"
              r="58"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                strokeDasharray: circumference,
              }}
            />

            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={animatedValue}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-bold text-white"
            >
              {animatedValue}
            </motion.div>
            <span className="text-white/50 text-xs mt-1">{unit}</span>
          </div>

          {/* Icon Badge */}
          <motion.div
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={{ duration: 0.6 }}
            className={`absolute -top-2 -right-2 p-2 rounded-xl bg-gradient-to-br ${color} shadow-lg`}
          >
            <Package className="w-4 h-4 text-white" />
          </motion.div>
        </div>

        {/* Title */}
        <h4 className="text-white/60 text-sm font-medium text-center mt-4 mb-2">{title}</h4>

        {/* Change Indicator */}
        {change !== 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-1 px-2 py-1 rounded-full ${
              change < 0 ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
            }`}
          >
            <TrendingDown className={`w-3 h-3 ${change >= 0 ? 'rotate-180' : ''}`} />
            <span className="text-xs font-bold">{Math.abs(change)}%</span>
          </motion.div>
        )}
      </div>

      {/* Glow Effect */}
      <motion.div
        animate={{
          opacity: isHovered ? 0.3 : 0,
          scale: isHovered ? 1.5 : 1,
        }}
        className={`absolute inset-0 bg-gradient-to-br ${color} blur-3xl pointer-events-none`}
      />
    </motion.div>
  )
}
