'use client'

/**
 * ProfitCommandCenter - Centro de Comando de Rentabilidad
 * 
 * Dashboard principal para toma de decisiones de arbitraje financiero
 * USD/MXN/USDT con datos en tiempo real.
 */

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  DollarSign,
  Bitcoin,
  Building2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Zap,
  Shield,
  Target,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Progress } from '@/app/components/ui/progress'
import { Skeleton } from '@/app/components/ui/skeleton'

// Hooks del sistema
import { useMarketData } from '@/app/hooks/useMarketData'
import { useTreasury } from '@/app/hooks/useTreasury'

// Componentes del sistema
import { ArbitrageGauge } from './ArbitrageGauge'
import { HoldCalculator } from './HoldCalculator'
import { TrendForecastChart } from './TrendForecastChart'

// ============================================
// TIPOS
// ============================================

interface PriceTickerProps {
  title: string;
  price: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  premium?: number;
  isHighlighted?: boolean;
  highlightColor?: 'green' | 'blue' | 'amber';
  badge?: string;
}

interface StrategyBadgeProps {
  mode: 'LONG_USD_DURATION' | 'HIGH_VELOCITY_SALES' | 'NEUTRAL';
  reason: string;
}

// ============================================
// SUBCOMPONENTES
// ============================================

/**
 * Ticker de precio individual
 */
const PriceTicker: React.FC<PriceTickerProps> = ({
  title,
  price,
  icon,
  trend = 'neutral',
  premium,
  isHighlighted = false,
  highlightColor = 'green',
  badge,
}) => {
  const trendIcon = trend === 'up' 
    ? <TrendingUp className="h-4 w-4 text-emerald-500" />
    : trend === 'down'
    ? <TrendingDown className="h-4 w-4 text-red-500" />
    : <Activity className="h-4 w-4 text-zinc-400" />

  const glowColors = {
    green: 'shadow-emerald-500/20 border-emerald-500/50',
    blue: 'shadow-blue-500/20 border-blue-500/50',
    amber: 'shadow-amber-500/20 border-amber-500/50',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-xl border bg-zinc-900/50 p-4 transition-all duration-300',
        isHighlighted && `shadow-lg ${glowColors[highlightColor]}`,
        !isHighlighted && 'border-zinc-800 hover:border-zinc-700',
      )}
    >
      {/* Badge de oportunidad */}
      {badge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-2 -right-2"
        >
          <Badge 
            className={cn(
              'text-xs font-semibold',
              highlightColor === 'green' && 'bg-emerald-500 text-white',
              highlightColor === 'blue' && 'bg-blue-500 text-white',
              highlightColor === 'amber' && 'bg-amber-500 text-black',
            )}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {badge}
          </Badge>
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'p-2 rounded-lg',
            isHighlighted ? 'bg-emerald-500/10' : 'bg-zinc-800',
          )}>
            {icon}
          </div>
          <span className="text-sm text-zinc-400">{title}</span>
        </div>
        {trendIcon}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white">
            ${price.toFixed(2)}
          </span>
          <span className="text-sm text-zinc-500">MXN</span>
        </div>
        
        {premium !== undefined && premium !== 0 && (
          <div className={cn(
            'text-xs font-medium',
            premium > 0 ? 'text-emerald-400' : 'text-red-400',
          )}>
            {premium > 0 ? '+' : ''}{premium.toFixed(2)} vs mercado
          </div>
        )}
      </div>

      {/* Efecto de brillo animado */}
      {isHighlighted && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        />
      )}
    </motion.div>
  )
}

/**
 * Badge de estrategia recomendada
 */
const StrategyBadge: React.FC<StrategyBadgeProps> = ({ mode, reason }) => {
  const config = {
    LONG_USD_DURATION: {
      label: 'MANTENER USD',
      icon: <Shield className="h-4 w-4" />,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      description: 'Estrategia defensiva',
    },
    HIGH_VELOCITY_SALES: {
      label: 'VENDER RÁPIDO',
      icon: <Zap className="h-4 w-4" />,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      description: 'Alta velocidad de ventas',
    },
    NEUTRAL: {
      label: 'NEUTRAL',
      icon: <Target className="h-4 w-4" />,
      color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
      description: 'Operar según demanda',
    },
  }

  const { label, icon, color, description } = config[mode]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'inline-flex items-center gap-3 px-4 py-2 rounded-lg border',
        color,
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-semibold">{label}</span>
      </div>
      <div className="h-4 w-px bg-current opacity-30" />
      <span className="text-xs opacity-80">{description}</span>
    </motion.div>
  )
}

/**
 * Panel de alertas del tesoro
 */
const TreasuryAlerts: React.FC<{ 
  alerts: Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    acknowledged: boolean;
  }>;
  onAcknowledge: (id: string) => void;
}> = ({ alerts, onAcknowledge }) => {
  const activeAlerts = alerts.filter(a => !a.acknowledged)
  
  if (activeAlerts.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {activeAlerts.slice(0, 3).map((alert) => (
        <motion.div
          key={alert.id}
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className={cn(
            'flex items-center justify-between p-3 rounded-lg border',
            alert.type === 'critical' && 'bg-red-500/10 border-red-500/30',
            alert.type === 'warning' && 'bg-amber-500/10 border-amber-500/30',
            alert.type === 'info' && 'bg-blue-500/10 border-blue-500/30',
          )}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className={cn(
              'h-4 w-4',
              alert.type === 'critical' && 'text-red-500',
              alert.type === 'warning' && 'text-amber-500',
              alert.type === 'info' && 'text-blue-500',
            )} />
            <div>
              <p className="text-sm font-medium text-white">{alert.title}</p>
              <p className="text-xs text-zinc-400">{alert.message}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAcknowledge(alert.id)}
            className="text-zinc-400 hover:text-white"
          >
            Entendido
          </Button>
        </motion.div>
      ))}
    </motion.div>
  )
}

/**
 * Indicador de salud del inventario
 */
const InventoryHealth: React.FC<{
  score: number;
  status: 'healthy' | 'warning' | 'critical';
}> = ({ score, status }) => {
  const percentage = Math.round(score * 100)
  
  const statusConfig = {
    healthy: { color: 'bg-emerald-500', label: 'Saludable' },
    warning: { color: 'bg-amber-500', label: 'Atención' },
    critical: { color: 'bg-red-500', label: 'Crítico' },
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">Salud del Inventario</span>
        <Badge variant="outline" className={cn(
          'text-xs',
          status === 'healthy' && 'border-emerald-500/50 text-emerald-400',
          status === 'warning' && 'border-amber-500/50 text-amber-400',
          status === 'critical' && 'border-red-500/50 text-red-400',
        )}>
          {statusConfig[status].label}
        </Badge>
      </div>
      <div className="relative">
        <Progress value={percentage} className="h-2" />
        <span className="absolute right-0 -top-5 text-xs text-zinc-500">
          {percentage}%
        </span>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const ProfitCommandCenter: React.FC = () => {
  const [showCalculator, setShowCalculator] = useState(false)
  const [dollarsToSimulate, setDollarsToSimulate] = useState(10000)

  // Hooks de datos
  const { 
    prices, 
    arbitrage, 
    strategyMode, 
    strategyReason,
    loading: marketLoading, 
    error: marketError,
    refreshData,
    historicalFeeds,
  } = useMarketData()

  const {
    position,
    alerts,
    healthMetrics,
    loading: treasuryLoading,
    acknowledgeAlert,
  } = useTreasury(prices?.banxico ?? 18.50)

  // Determinar si hay oportunidad de arbitraje destacada
  const hasArbitrageOpportunity = useMemo(() => {
    return arbitrage?.isProfitable && 
           arbitrage.opportunity?.opportunity_level !== 'low'
  }, [arbitrage])

  // Calcular ganancia potencial
  const potentialProfit = useMemo(() => {
    if (!prices || !arbitrage) return null
    
    const physicalSale = dollarsToSimulate * prices.streetAverage
    const cryptoSale = dollarsToSimulate * prices.binanceUsdt
    
    return {
      physical: physicalSale,
      crypto: cryptoSale,
      difference: cryptoSale - physicalSale,
      bestOption: cryptoSale > physicalSale ? 'crypto' : 'physical',
    }
  }, [prices, arbitrage, dollarsToSimulate])

  // Loading state
  if (marketLoading || treasuryLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  // Error state
  if (marketError) {
    return (
      <Card className="bg-red-500/10 border-red-500/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-400">Error de conexión</h3>
              <p className="text-sm text-zinc-400">{marketError.message}</p>
            </div>
          </div>
          <Button onClick={refreshData} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con estrategia */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-500" />
            Panel Profit
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Centro de comando para arbitraje USD/MXN/USDT
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <StrategyBadge mode={strategyMode} reason={strategyReason} />
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            className="border-zinc-700"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alertas activas */}
      <AnimatePresence>
        <TreasuryAlerts 
          alerts={alerts} 
          onAcknowledge={acknowledgeAlert} 
        />
      </AnimatePresence>

      {/* Tickers de precios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PriceTicker
          title="Precio Físico (Ventanilla)"
          price={prices?.streetAverage ?? 0}
          icon={<Building2 className="h-5 w-5 text-zinc-400" />}
          trend={arbitrage?.physicalPremium ?? 0 > 0 ? 'up' : 'neutral'}
          premium={arbitrage?.physicalPremium}
        />
        
        <PriceTicker
          title="Precio Crypto (USDT P2P)"
          price={prices?.binanceUsdt ?? 0}
          icon={<Bitcoin className="h-5 w-5 text-amber-500" />}
          trend={arbitrage?.cryptoPremium ?? 0 > 0 ? 'up' : 'down'}
          premium={arbitrage?.cryptoPremium}
          isHighlighted={hasArbitrageOpportunity && arbitrage?.bestChannel === 'crypto'}
          highlightColor="green"
          badge={hasArbitrageOpportunity && arbitrage?.bestChannel === 'crypto' 
            ? 'OPORTUNIDAD' 
            : undefined}
        />
        
        <PriceTicker
          title="Precio Banxico (Fix)"
          price={prices?.banxico ?? 0}
          icon={<DollarSign className="h-5 w-5 text-blue-500" />}
          trend="neutral"
        />
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Gauge de arbitraje + Salud */}
        <div className="space-y-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-500" />
                Semáforo de Arbitraje
              </CardTitle>
              <CardDescription>
                Indicador de mejor canal de venta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArbitrageGauge
                cryptoPremium={arbitrage?.cryptoPremium ?? 0}
                physicalPremium={arbitrage?.physicalPremium ?? 0}
                bestChannel={arbitrage?.bestChannel ?? 'hold'}
              />
            </CardContent>
          </Card>

          {/* Salud del inventario */}
          {healthMetrics && (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-4">
                <InventoryHealth
                  score={healthMetrics.health_score}
                  status={healthMetrics.overall_status}
                />
                
                {/* Valor total */}
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Valor Total (USD)</span>
                    <span className="font-semibold text-white">
                      ${healthMetrics.total_value_usd.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna central: Gráfico de tendencia */}
        <div className="lg:col-span-2">
          <Card className="bg-zinc-900/50 border-zinc-800 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Tendencia USD/MXN
                  </CardTitle>
                  <CardDescription>
                    Últimos 30 días con proyección
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Actualizado hace 15 min
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <TrendForecastChart
                historicalData={historicalFeeds}
                currentPrice={prices?.banxico ?? 18.50}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Panel de acción rápida */}
      <Card className="bg-gradient-to-r from-zinc-900/80 to-zinc-800/50 border-zinc-700">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Calculadora rápida */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                Calculadora Rápida
              </h3>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="number"
                    value={dollarsToSimulate}
                    onChange={(e) => setDollarsToSimulate(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="USD disponibles"
                  />
                </div>
                
                {potentialProfit && (
                  <div className="text-sm">
                    <span className="text-zinc-400">Mejor opción: </span>
                    <span className={cn(
                      'font-semibold',
                      potentialProfit.bestOption === 'crypto' 
                        ? 'text-emerald-400' 
                        : 'text-blue-400',
                    )}>
                      {potentialProfit.bestOption === 'crypto' ? 'CRYPTO' : 'FÍSICO'}
                    </span>
                    {potentialProfit.difference !== 0 && (
                      <span className="text-emerald-400 ml-2">
                        (+${Math.abs(potentialProfit.difference).toFixed(2)} MXN)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-3">
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowCalculator(true)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Registrar Entrada USD
              </Button>
              <Button variant="outline" className="border-zinc-600">
                Simular Venta
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="outline" className="border-amber-600/50 text-amber-400">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Alertar Sucursal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de calculadora Hold */}
      <AnimatePresence>
        {showCalculator && (
          <HoldCalculator
            isOpen={showCalculator}
            onClose={() => setShowCalculator(false)}
            currentPrice={prices?.banxico ?? 18.50}
            strategyMode={strategyMode}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProfitCommandCenter
