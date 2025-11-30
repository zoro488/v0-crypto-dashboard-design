'use client'

/**
 * TrendForecastChart - Gráfico de Tendencia con Proyección
 * 
 * Muestra el histórico del USD/MXN de los últimos 30 días
 * con una línea de proyección basada en SMA-50.
 */

import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  Legend,
} from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import type { MarketLiveFeed } from '@/app/lib/profit-engine/types/profit-engine.types'

// ============================================
// TIPOS
// ============================================

interface TrendForecastChartProps {
  historicalData: MarketLiveFeed[];
  currentPrice: number;
  showProjection?: boolean;
  projectionDays?: number;
  height?: number;
}

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  price: number;
  sma7?: number;
  sma30?: number;
  projected?: number;
  projectedLow?: number;
  projectedHigh?: number;
  isProjection?: boolean;
}

// ============================================
// FUNCIONES DE CÁLCULO
// ============================================

/**
 * Calcula la Media Móvil Simple (SMA)
 */
function calculateSMA(data: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = []
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(undefined)
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      result.push(Math.round((sum / period) * 100) / 100)
    }
  }
  
  return result
}

/**
 * Genera proyección futura basada en tendencia
 */
function generateProjection(
  lastPrice: number,
  lastSMA: number,
  days: number,
): { projected: number; low: number; high: number }[] {
  const results: { projected: number; low: number; high: number }[] = []
  const trend = (lastPrice - lastSMA) / lastSMA // Tendencia actual
  const volatility = 0.005 // 0.5% volatilidad diaria promedio
  
  let currentPrice = lastPrice
  
  for (let i = 1; i <= days; i++) {
    // Proyección con tendencia decreciente (mean reversion)
    const dailyChange = trend * Math.exp(-i * 0.1) * 0.003
    currentPrice = currentPrice * (1 + dailyChange)
    
    // Rango de confianza
    const confidenceRange = volatility * Math.sqrt(i)
    
    results.push({
      projected: Math.round(currentPrice * 100) / 100,
      low: Math.round(currentPrice * (1 - confidenceRange) * 100) / 100,
      high: Math.round(currentPrice * (1 + confidenceRange) * 100) / 100,
    })
  }
  
  return results
}

/**
 * Genera datos mock si no hay histórico real
 */
function generateMockData(currentPrice: number, days: number = 30): ChartDataPoint[] {
  const data: ChartDataPoint[] = []
  const basePrice = currentPrice * 0.98 // Empezar 2% abajo
  const volatility = 0.008
  
  let price = basePrice
  const today = new Date()
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Simular movimiento random con tendencia alcista ligera
    const change = (Math.random() - 0.48) * volatility
    price = price * (1 + change)
    
    data.push({
      date: date.toISOString(),
      dateLabel: date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
      price: Math.round(price * 100) / 100,
    })
  }
  
  // Asegurar que el último punto sea el precio actual
  if (data.length > 0) {
    data[data.length - 1].price = currentPrice
  }
  
  return data
}

// ============================================
// TOOLTIP PERSONALIZADO
// ============================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null

  const mainPrice = payload.find(p => p.dataKey === 'price' || p.dataKey === 'projected')
  const sma7 = payload.find(p => p.dataKey === 'sma7')
  const sma30 = payload.find(p => p.dataKey === 'sma30')
  const isProjection = payload.some(p => p.dataKey === 'projected')

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-zinc-400 mb-2">{label}</p>
      
      {mainPrice && (
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: isProjection ? '#f59e0b' : '#10b981' }}
          />
          <span className="text-sm text-white font-mono">
            ${mainPrice.value.toFixed(2)}
          </span>
          {isProjection && (
            <span className="text-xs text-amber-400">(Proyección)</span>
          )}
        </div>
      )}
      
      {sma7 && sma7.value && (
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-zinc-400">SMA 7:</span>
          <span className="text-white font-mono">${sma7.value.toFixed(2)}</span>
        </div>
      )}
      
      {sma30 && sma30.value && (
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-purple-400" />
          <span className="text-zinc-400">SMA 30:</span>
          <span className="text-white font-mono">${sma30.value.toFixed(2)}</span>
        </div>
      )}
    </div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const TrendForecastChart: React.FC<TrendForecastChartProps> = ({
  historicalData,
  currentPrice,
  showProjection = true,
  projectionDays = 7,
  height = 300,
}) => {
  // Preparar datos del gráfico
  const chartData = useMemo(() => {
    // Usar datos históricos o generar mock
    let baseData: ChartDataPoint[]
    
    if (historicalData.length > 5) {
      baseData = historicalData.map(feed => ({
        date: feed.timestamp,
        dateLabel: new Date(feed.timestamp).toLocaleDateString('es-MX', { 
          day: '2-digit', 
          month: 'short', 
        }),
        price: feed.sources.banxico_fix,
      }))
    } else {
      baseData = generateMockData(currentPrice, 30)
    }

    // Calcular SMAs
    const prices = baseData.map(d => d.price)
    const sma7Values = calculateSMA(prices, 7)
    const sma30Values = calculateSMA(prices, Math.min(30, prices.length))

    // Añadir SMAs a los datos
    baseData = baseData.map((d, i) => ({
      ...d,
      sma7: sma7Values[i],
      sma30: sma30Values[i],
    }))

    // Generar proyección si está habilitada
    if (showProjection && baseData.length > 0) {
      const lastPoint = baseData[baseData.length - 1]
      const lastSMA = lastPoint.sma30 ?? lastPoint.sma7 ?? lastPoint.price
      const projections = generateProjection(lastPoint.price, lastSMA, projectionDays)

      const today = new Date()
      projections.forEach((proj, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() + i + 1)
        
        baseData.push({
          date: date.toISOString(),
          dateLabel: date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
          price: proj.projected,
          projected: proj.projected,
          projectedLow: proj.low,
          projectedHigh: proj.high,
          isProjection: true,
        })
      })
    }

    return baseData
  }, [historicalData, currentPrice, showProjection, projectionDays])

  // Calcular tendencia
  const trend = useMemo(() => {
    if (chartData.length < 2) return { direction: 'neutral' as const, percent: 0 }
    
    const historicalOnly = chartData.filter(d => !d.isProjection)
    if (historicalOnly.length < 2) return { direction: 'neutral' as const, percent: 0 }
    
    const first = historicalOnly[0].price
    const last = historicalOnly[historicalOnly.length - 1].price
    const percent = ((last - first) / first) * 100
    
    return {
      direction: percent > 0.5 ? 'up' as const : percent < -0.5 ? 'down' as const : 'neutral' as const,
      percent: Math.round(percent * 100) / 100,
    }
  }, [chartData])

  // Calcular dominio del eje Y
  const yDomain = useMemo(() => {
    const allPrices = chartData.flatMap(d => [
      d.price,
      d.projectedLow,
      d.projectedHigh,
      d.sma7,
      d.sma30,
    ]).filter((v): v is number => v !== undefined)
    
    const min = Math.min(...allPrices)
    const max = Math.max(...allPrices)
    const padding = (max - min) * 0.1
    
    return [
      Math.floor((min - padding) * 100) / 100,
      Math.ceil((max + padding) * 100) / 100,
    ]
  }, [chartData])

  return (
    <div className="space-y-4">
      {/* Indicador de tendencia */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {trend.direction === 'up' && (
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          )}
          {trend.direction === 'down' && (
            <TrendingDown className="h-5 w-5 text-red-500" />
          )}
          {trend.direction === 'neutral' && (
            <Minus className="h-5 w-5 text-zinc-500" />
          )}
          <span className={cn(
            'text-sm font-medium',
            trend.direction === 'up' && 'text-emerald-400',
            trend.direction === 'down' && 'text-red-400',
            trend.direction === 'neutral' && 'text-zinc-400',
          )}>
            {trend.direction === 'up' && `+${trend.percent}% en 30 días`}
            {trend.direction === 'down' && `${trend.percent}% en 30 días`}
            {trend.direction === 'neutral' && 'Sin cambio significativo'}
          </span>
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">Precio</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-zinc-400">SMA 7</span>
          </div>
          {showProjection && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-zinc-400">Proyección</span>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart 
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              {/* Gradiente para área de proyección */}
              <linearGradient id="projectionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              
              {/* Gradiente para área principal */}
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#27272a" 
              vertical={false}
            />
            
            <XAxis
              dataKey="dateLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            
            <YAxis
              domain={yDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              width={60}
            />
            
            <Tooltip content={<CustomTooltip />} />

            {/* Línea de referencia del precio actual */}
            <ReferenceLine
              y={currentPrice}
              stroke="#52525b"
              strokeDasharray="5 5"
              label={{
                value: `Actual: $${currentPrice.toFixed(2)}`,
                position: 'right',
                fill: '#71717a',
                fontSize: 10,
              }}
            />

            {/* Área de confianza de proyección */}
            {showProjection && (
              <Area
                type="monotone"
                dataKey="projectedHigh"
                stroke="transparent"
                fill="url(#projectionGradient)"
                connectNulls
              />
            )}

            {/* Línea SMA 30 */}
            <Line
              type="monotone"
              dataKey="sma30"
              stroke="#a855f7"
              strokeWidth={1}
              dot={false}
              strokeDasharray="5 5"
              connectNulls
            />

            {/* Línea SMA 7 */}
            <Line
              type="monotone"
              dataKey="sma7"
              stroke="#60a5fa"
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />

            {/* Línea de precio principal */}
            <Line
              type="monotone"
              dataKey="price"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#10b981' }}
            />

            {/* Línea de proyección */}
            {showProjection && (
              <Line
                type="monotone"
                dataKey="projected"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Nota de proyección */}
      {showProjection && (
        <p className="text-xs text-zinc-500 text-center">
          La proyección (línea punteada) está basada en media móvil y tendencia actual. 
          No garantiza resultados futuros.
        </p>
      )}
    </div>
  )
}

export default TrendForecastChart
