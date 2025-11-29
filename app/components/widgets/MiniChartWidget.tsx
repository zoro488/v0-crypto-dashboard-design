"use client"

/**
 * 🔷 MINI CHART WIDGET - Gráficos Compactos Premium
 * 
 * Componente de gráficos compactos con:
 * - Múltiples tipos: area, line, bar, donut
 * - Animaciones de entrada elegantes
 * - Tooltips interactivos
 * - Gradientes dinámicos
 * - Diseño responsive
 */

import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

// ============================================================================
// TIPOS
// ============================================================================
type ChartType = 'area' | 'line' | 'bar' | 'donut'

interface DataPoint {
  name: string
  value: number
  value2?: number
  color?: string
  [key: string]: unknown // Permite propiedades adicionales para Recharts
}

interface MiniChartWidgetProps {
  title: string
  subtitle?: string
  data: DataPoint[]
  type?: ChartType
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'pink'
  secondaryColor?: string
  height?: number
  showAxis?: boolean
  showTooltip?: boolean
  showLegend?: boolean
  animated?: boolean
  className?: string
  delay?: number
}

// ============================================================================
// CONFIGURACIÓN DE COLORES
// ============================================================================
const colorConfig = {
  blue: { primary: '#3b82f6', secondary: '#06b6d4', gradient: 'from-blue-500 to-cyan-500' },
  green: { primary: '#10b981', secondary: '#22c55e', gradient: 'from-emerald-500 to-green-500' },
  purple: { primary: '#8b5cf6', secondary: '#a855f7', gradient: 'from-purple-500 to-violet-500' },
  orange: { primary: '#f97316', secondary: '#f59e0b', gradient: 'from-orange-500 to-amber-500' },
  cyan: { primary: '#06b6d4', secondary: '#14b8a6', gradient: 'from-cyan-500 to-teal-500' },
  pink: { primary: '#ec4899', secondary: '#f43f5e', gradient: 'from-pink-500 to-rose-500' }
}

// ============================================================================
// TOOLTIP PERSONALIZADO
// ============================================================================
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl"
    >
      {label && (
        <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">{label}</p>
      )}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-mono font-bold text-white">
            ${entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </motion.div>
  )
}

// ============================================================================
// COMPONENTE DE GRÁFICO DE ÁREA
// ============================================================================
function AreaChartComponent({ 
  data, 
  colors, 
  showAxis, 
  showTooltip,
  height 
}: { 
  data: DataPoint[]
  colors: { primary: string; secondary: string }
  showAxis: boolean
  showTooltip: boolean
  height: number
}) {
  const gradientId = `areaGrad-${colors.primary.replace('#', '')}`
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.primary} stopOpacity={0.4} />
            <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        
        {showAxis && (
          <>
            <XAxis 
              dataKey="name" 
              stroke="#ffffff20" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="#ffffff20" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(v) => `${v / 1000}k`}
            />
          </>
        )}
        
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        
        <Area
          type="monotone"
          dataKey="value"
          stroke={colors.primary}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          animationDuration={1500}
          animationEasing="ease-out"
        />
        
        {data[0]?.value2 !== undefined && (
          <Area
            type="monotone"
            dataKey="value2"
            stroke={colors.secondary}
            strokeWidth={2}
            fill="transparent"
            strokeDasharray="4 4"
            animationDuration={1500}
            animationBegin={300}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ============================================================================
// COMPONENTE DE GRÁFICO DE LÍNEA
// ============================================================================
function LineChartComponent({ 
  data, 
  colors, 
  showAxis, 
  showTooltip,
  height 
}: { 
  data: DataPoint[]
  colors: { primary: string; secondary: string }
  showAxis: boolean
  showTooltip: boolean
  height: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        {showAxis && (
          <>
            <XAxis 
              dataKey="name" 
              stroke="#ffffff20" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="#ffffff20" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
          </>
        )}
        
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        
        <Line
          type="monotone"
          dataKey="value"
          stroke={colors.primary}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: colors.primary }}
          animationDuration={1500}
        />
        
        {data[0]?.value2 !== undefined && (
          <Line
            type="monotone"
            dataKey="value2"
            stroke={colors.secondary}
            strokeWidth={2}
            dot={false}
            strokeDasharray="4 4"
            animationDuration={1500}
            animationBegin={300}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

// ============================================================================
// COMPONENTE DE GRÁFICO DE BARRAS
// ============================================================================
function BarChartComponent({ 
  data, 
  colors, 
  showAxis, 
  showTooltip,
  height 
}: { 
  data: DataPoint[]
  colors: { primary: string; secondary: string }
  showAxis: boolean
  showTooltip: boolean
  height: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        {showAxis && (
          <>
            <XAxis 
              dataKey="name" 
              stroke="#ffffff20" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="#ffffff20" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
          </>
        )}
        
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        
        <Bar 
          dataKey="value" 
          fill={colors.primary}
          radius={[4, 4, 0, 0]}
          animationDuration={1500}
        />
        
        {data[0]?.value2 !== undefined && (
          <Bar 
            dataKey="value2" 
            fill={colors.secondary}
            radius={[4, 4, 0, 0]}
            animationDuration={1500}
            animationBegin={300}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ============================================================================
// COMPONENTE DE GRÁFICO DONUT
// ============================================================================
function DonutChartComponent({ 
  data, 
  colors, 
  showTooltip,
  height 
}: { 
  data: DataPoint[]
  colors: { primary: string; secondary: string }
  showTooltip: boolean
  height: number
}) {
  const COLORS = [colors.primary, colors.secondary, '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6']
  
  // Total para mostrar en el centro
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            paddingAngle={3}
            dataKey="value"
            animationDuration={1500}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Centro con total */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-lg font-bold text-white font-mono">
            ${(total / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-white/40">Total</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export function MiniChartWidget({
  title,
  subtitle,
  data,
  type = 'area',
  color = 'blue',
  height = 120,
  showAxis = false,
  showTooltip = true,
  showLegend = false,
  animated = true,
  className = '',
  delay = 0
}: MiniChartWidgetProps) {
  const colors = colorConfig[color]
  
  // Componente de gráfico según tipo
  const ChartComponent = useMemo(() => {
    const props = {
      data,
      colors,
      showAxis,
      showTooltip,
      height
    }
    
    switch (type) {
      case 'line':
        return <LineChartComponent {...props} />
      case 'bar':
        return <BarChartComponent {...props} />
      case 'donut':
        return <DonutChartComponent {...props} />
      default:
        return <AreaChartComponent {...props} />
    }
  }, [type, data, colors, showAxis, showTooltip, height])
  
  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{ 
        y: -2,
        transition: { duration: 0.2 }
      }}
      className={`
        rounded-2xl bg-zinc-900/60 backdrop-blur-xl
        border border-white/5 hover:border-white/10
        overflow-hidden transition-colors duration-300
        ${className}
      `}
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {subtitle && (
              <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>
            )}
          </div>
          
          {/* Indicador de tipo */}
          <div className={`
            w-8 h-8 rounded-lg bg-gradient-to-br ${colors.gradient}
            flex items-center justify-center opacity-60
          `}>
            <span className="text-xs font-bold text-white uppercase">
              {type[0]}
            </span>
          </div>
        </div>
      </div>
      
      {/* Gráfico */}
      <div 
        className="px-2 pb-2 w-full" 
        style={{ minHeight: height, height, minWidth: 100 }}
      >
        {data.length > 0 ? ChartComponent : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
            Sin datos
          </div>
        )}
      </div>
      
      {/* Leyenda opcional */}
      {showLegend && (
        <div className="px-4 pb-3 flex flex-wrap gap-3">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ 
                  backgroundColor: item.color || 
                    (index === 0 ? colors.primary : colors.secondary) 
                }}
              />
              <span className="text-xs text-white/50">{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default MiniChartWidget
