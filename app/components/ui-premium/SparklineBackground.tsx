'use client'

import { motion } from 'framer-motion'
import { memo, useMemo } from 'react'

interface SparklineData {
  values: number[]
  color?: string
}

interface SparklineBackgroundProps {
  data?: SparklineData
  className?: string
  variant?: 'emerald' | 'sapphire' | 'amethyst' | 'cyan' | 'gold' | 'ruby'
}

/**
 * SparklineBackground - Gráfico de línea minimalista como fondo de tarjeta
 * 
 * Crea un gráfico sutil que cruza la tarjeta mostrando tendencia.
 * El vidrio perfecto no es plano - tiene vida interior.
 */
export const SparklineBackground = memo(function SparklineBackground({
  data,
  className = '',
  variant = 'sapphire',
}: SparklineBackgroundProps) {
  
  const colorMap = {
    emerald: '#10b981',
    sapphire: '#3b82f6',
    amethyst: '#8b5cf6',
    cyan: '#06b6d4',
    gold: '#f59e0b',
    ruby: '#ef4444',
  }
  
  const color = data?.color || colorMap[variant]
  
  // Generar datos aleatorios si no se proporcionan
  const values = useMemo(() => {
    if (data?.values && data.values.length > 0) {
      return data.values
    }
    // Generar 24 puntos de datos con tendencia ascendente
    const baseValues = []
    let current = 30 + Math.random() * 20
    for (let i = 0; i < 24; i++) {
      current += (Math.random() - 0.4) * 15
      current = Math.max(10, Math.min(90, current))
      baseValues.push(current)
    }
    return baseValues
  }, [data?.values])
  
  // Crear path SVG
  const { linePath, areaPath } = useMemo(() => {
    const width = 100
    const height = 100
    const padding = 5
    
    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)
    const range = maxValue - minValue || 1
    
    const points = values.map((value, index) => {
      const x = padding + (index / (values.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((value - minValue) / range) * (height - 2 * padding)
      return { x, y }
    })
    
    // Crear path suave con curvas bezier
    let linePath = `M ${points[0].x} ${points[0].y}`
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cpx = (prev.x + curr.x) / 2
      linePath += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y}, ${cpx} ${(prev.y + curr.y) / 2}`
    }
    
    // Último punto
    const last = points[points.length - 1]
    linePath += ` L ${last.x} ${last.y}`
    
    // Área bajo la curva
    const areaPath = `${linePath} L ${last.x} ${height} L ${points[0].x} ${height} Z`
    
    return { linePath, areaPath }
  }, [values])
  
  return (
    <motion.div 
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.15 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      <svg 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-[80%]"
        style={{ color }}
      >
        {/* Área de relleno con gradiente */}
        <defs>
          <linearGradient id={`sparkline-gradient-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Área de relleno */}
        <motion.path
          d={areaPath}
          fill={`url(#sparkline-gradient-${variant})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.8 }}
        />
        
        {/* Línea principal */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: 'easeOut' }}
        />
        
        {/* Punto final brillante */}
        <motion.circle
          cx={95}
          cy={values[values.length - 1] ? 50 : 30}
          r="1.5"
          fill="currentColor"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.5 }}
        >
          <animate
            attributeName="opacity"
            values="1;0.5;1"
            dur="2s"
            repeatCount="indefinite"
          />
        </motion.circle>
      </svg>
    </motion.div>
  )
})

export default SparklineBackground
