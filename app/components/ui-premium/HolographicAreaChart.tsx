'use client'

import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { memo, useState, useCallback, useRef, useMemo, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HOLOGRAPHIC AREA CHART - Holographic Liquid Charts
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Gráfico que parece luz líquida flotando en el vacío:
 * - Sin ejes visibles (flotación pura)
 * - Línea con gradiente y glow SVG
 * - Relleno con gradiente de opacidad
 * - Crosshair láser con punto pulsante
 * - Tooltip de cristal flotante
 */

interface DataPoint {
  fecha: string
  monto: number
  profit?: number
  label?: string
}

interface HolographicAreaChartProps {
  data: DataPoint[]
  height?: number
  variant?: 'cyan' | 'emerald' | 'amethyst' | 'sapphire' | 'gold' | 'ruby'
  showProfit?: boolean
  animationDuration?: number
  className?: string
}

// Tooltip personalizado de cristal flotante
const CrystalTooltip = memo(function CrystalTooltip({
  active,
  payload,
  label,
  variant,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
  variant: string
}) {
  const colorMap: Record<string, string> = {
    cyan: '#06b6d4',
    emerald: '#10b981',
    amethyst: '#8b5cf6',
    sapphire: '#3b82f6',
    gold: '#f59e0b',
    ruby: '#ef4444',
  }
  
  const accentColor = colorMap[variant] || colorMap.cyan
  
  if (!active || !payload || payload.length === 0) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="relative z-50"
      style={{
        background: 'rgba(10, 10, 15, 0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '16px',
        padding: '16px 20px',
        border: `1px solid ${accentColor}40`,
        boxShadow: `
          0 0 30px ${accentColor}20,
          0 20px 40px -10px rgba(0, 0, 0, 0.6),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `,
      }}
    >
      {/* Glow neón en borde superior */}
      <div 
        className="absolute inset-x-0 -top-[1px] h-[1px] rounded-t-2xl"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          boxShadow: `0 0 10px ${accentColor}`,
        }}
      />
      
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 font-medium">
        {label}
      </p>
      
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-3 mb-1 last:mb-0">
          <motion.div
            className="w-2.5 h-2.5 rounded-full"
            style={{ 
              backgroundColor: entry.color,
              boxShadow: `0 0 10px ${entry.color}80`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.8, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span 
            className="text-xl font-bold"
            style={{ 
              fontFamily: "'JetBrains Mono', monospace",
              fontVariantNumeric: 'tabular-nums',
              color: '#ffffff',
            }}
          >
            ${entry.value.toLocaleString()}
          </span>
          <span className="text-xs text-white/30 capitalize">{entry.name}</span>
        </div>
      ))}
    </motion.div>
  )
})

// Punto activo con pulso
const ActiveDot = memo(function ActiveDot({
  cx,
  cy,
  color,
}: {
  cx?: number
  cy?: number
  color: string
}) {
  if (cx === undefined || cy === undefined) return null
  
  return (
    <g>
      {/* Círculos concéntricos pulsantes */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={20}
        fill="none"
        stroke={color}
        strokeWidth={1}
        opacity={0.3}
        animate={{
          r: [12, 25, 12],
          opacity: [0.4, 0, 0.4],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.circle
        cx={cx}
        cy={cy}
        r={12}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.5}
        animate={{
          r: [8, 16, 8],
          opacity: [0.6, 0.2, 0.6],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
      />
      {/* Punto central */}
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={color}
        filter={`drop-shadow(0 0 8px ${color})`}
      />
      <circle
        cx={cx}
        cy={cy}
        r={2}
        fill="#ffffff"
      />
    </g>
  )
})

// Cursor crosshair láser
const LaserCursor = memo(function LaserCursor({
  points,
  color,
}: {
  points?: Array<{ x?: number; y?: number }>
  color: string
}) {
  if (!points || points.length === 0 || points[0].x === undefined) return null
  
  const x = points[0].x
  
  return (
    <g>
      {/* Línea vertical punteada brillante */}
      <line
        x1={x}
        y1={0}
        x2={x}
        y2="100%"
        stroke={color}
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.5}
        filter={`drop-shadow(0 0 4px ${color})`}
      />
    </g>
  )
})

export const HolographicAreaChart = memo(function HolographicAreaChart({
  data,
  height = 300,
  variant = 'cyan',
  showProfit = false,
  animationDuration = 1500,
  className = '',
}: HolographicAreaChartProps) {
  const [isAnimating, setIsAnimating] = useState(true)
  const chartRef = useRef<HTMLDivElement>(null)
  
  const colorMap = {
    cyan: { 
      primary: '#06b6d4', 
      secondary: '#0891b2',
      gradient: ['#06b6d4', '#0ea5e9', '#3b82f6'],
    },
    emerald: { 
      primary: '#10b981', 
      secondary: '#059669',
      gradient: ['#10b981', '#34d399', '#6ee7b7'],
    },
    amethyst: { 
      primary: '#8b5cf6', 
      secondary: '#7c3aed',
      gradient: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
    },
    sapphire: { 
      primary: '#3b82f6', 
      secondary: '#2563eb',
      gradient: ['#3b82f6', '#60a5fa', '#93c5fd'],
    },
    gold: { 
      primary: '#f59e0b', 
      secondary: '#d97706',
      gradient: ['#f59e0b', '#fbbf24', '#fcd34d'],
    },
    ruby: { 
      primary: '#ef4444', 
      secondary: '#dc2626',
      gradient: ['#ef4444', '#f87171', '#fca5a5'],
    },
  }
  
  const colors = colorMap[variant]
  const gradientId = useMemo(() => `holographic-gradient-${variant}-${Math.random()}`, [variant])
  const glowId = useMemo(() => `holographic-glow-${variant}-${Math.random()}`, [variant])
  
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), animationDuration + 500)
    return () => clearTimeout(timer)
  }, [animationDuration])
  
  if (!data || data.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-white/30">No hay datos disponibles</p>
      </div>
    )
  }
  
  return (
    <motion.div 
      ref={chartRef}
      className={`relative ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Glow ambiental de fondo */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 80%, ${colors.primary}15 0%, transparent 60%)`,
          filter: 'blur(40px)',
        }}
      />
      
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart 
          data={data}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <defs>
            {/* Gradiente para la línea */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={colors.gradient[0]} />
              <stop offset="50%" stopColor={colors.gradient[1]} />
              <stop offset="100%" stopColor={colors.gradient[2]} />
            </linearGradient>
            
            {/* Gradiente para el relleno */}
            <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.primary} stopOpacity={0.4} />
              <stop offset="50%" stopColor={colors.primary} stopOpacity={0.15} />
              <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
            </linearGradient>
            
            {/* Filtro de glow para la línea */}
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              />
              <feBlend in="SourceGraphic" mode="normal" />
            </filter>
          </defs>
          
          {/* Sin ejes visibles - flotación pura */}
          <XAxis dataKey="fecha" hide />
          <YAxis hide domain={['dataMin - 10%', 'dataMax + 10%']} />
          
          {/* Tooltip personalizado */}
          <Tooltip
            content={<CrystalTooltip variant={variant} />}
            cursor={<LaserCursor color={colors.primary} />}
            wrapperStyle={{ zIndex: 100 }}
          />
          
          {/* Área de profit si está habilitada */}
          {showProfit && (
            <Area
              type="monotone"
              dataKey="profit"
              stroke="transparent"
              fill={`url(#${gradientId}-fill)`}
              fillOpacity={0.3}
              animationDuration={animationDuration}
              animationEasing="ease-out"
            />
          )}
          
          {/* Área principal - El Relleno */}
          <Area
            type="monotone"
            dataKey="monto"
            stroke={`url(#${gradientId})`}
            strokeWidth={3}
            fill={`url(#${gradientId}-fill)`}
            fillOpacity={1}
            filter={`url(#${glowId})`}
            animationDuration={animationDuration}
            animationEasing="ease-out"
            activeDot={(props) => (
              <ActiveDot 
                cx={props.cx} 
                cy={props.cy} 
                color={colors.primary} 
              />
            )}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Labels sutiles en la parte inferior */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-6 pb-2 pointer-events-none">
        <span className="text-[10px] text-white/20 uppercase tracking-wider">
          {data[0]?.fecha}
        </span>
        <span className="text-[10px] text-white/20 uppercase tracking-wider">
          {data[data.length - 1]?.fecha}
        </span>
      </div>
      
      {/* Indicador de valor actual */}
      <motion.div
        className="absolute top-4 right-4 px-3 py-1.5 rounded-full"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: animationDuration / 1000 }}
        style={{
          background: `${colors.primary}20`,
          border: `1px solid ${colors.primary}40`,
        }}
      >
        <span 
          className="text-sm font-bold"
          style={{ 
            fontFamily: "'JetBrains Mono', monospace",
            color: colors.primary,
          }}
        >
          ${data[data.length - 1]?.monto.toLocaleString()}
        </span>
      </motion.div>
    </motion.div>
  )
})

export default HolographicAreaChart
