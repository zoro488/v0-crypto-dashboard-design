'use client';

/**
 * HoldCalculator - Calculadora de Simulación "Hold vs Sell"
 * 
 * Permite al usuario simular escenarios:
 * - Vender hoy al precio actual
 * - Mantener X días basado en proyección
 * - Comparar ganancia potencial
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calculator,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { cn } from '@/frontend/app/lib/utils';
import { Button } from '@/frontend/app/components/ui/button';
import { Badge } from '@/frontend/app/components/ui/badge';
import { Slider } from '@/frontend/app/components/ui/slider';
import type { StrategyMode } from '@/frontend/app/lib/profit-engine/types/profit-engine.types';

// ============================================
// TIPOS
// ============================================

interface HoldCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: number;
  strategyMode: StrategyMode;
  projectedTrend?: 'bullish' | 'bearish' | 'neutral';
  volatilityPercent?: number;
}

interface ScenarioResult {
  label: string;
  price: number;
  totalMxn: number;
  difference: number;
  differencePercent: number;
  recommendation: 'recommended' | 'caution' | 'neutral';
  reason: string;
}

// ============================================
// CONSTANTES
// ============================================

const HOLD_PERIODS = [
  { days: 7, label: '1 Semana' },
  { days: 15, label: '15 Días' },
  { days: 30, label: '1 Mes' },
  { days: 60, label: '2 Meses' },
  { days: 90, label: '3 Meses' },
];

// Proyecciones basadas en análisis macro (simplificado)
const TREND_PROJECTIONS = {
  bullish: { weeklyChange: 0.015, volatility: 0.02 },  // +1.5% semanal
  bearish: { weeklyChange: -0.01, volatility: 0.025 }, // -1% semanal
  neutral: { weeklyChange: 0.003, volatility: 0.015 }, // +0.3% semanal
};

// ============================================
// FUNCIONES DE CÁLCULO
// ============================================

/**
 * Proyecta el precio futuro basado en tendencia y tiempo
 */
function projectPrice(
  currentPrice: number,
  days: number,
  trend: 'bullish' | 'bearish' | 'neutral'
): { projected: number; low: number; high: number } {
  const { weeklyChange, volatility } = TREND_PROJECTIONS[trend];
  const weeks = days / 7;
  
  // Proyección base usando interés compuesto
  const projected = currentPrice * Math.pow(1 + weeklyChange, weeks);
  
  // Rango de confianza basado en volatilidad
  const volatilityFactor = volatility * Math.sqrt(weeks);
  const low = projected * (1 - volatilityFactor);
  const high = projected * (1 + volatilityFactor);
  
  return {
    projected: Math.round(projected * 100) / 100,
    low: Math.round(low * 100) / 100,
    high: Math.round(high * 100) / 100,
  };
}

/**
 * Calcula el costo de oportunidad de mantener efectivo
 */
function calculateOpportunityCost(
  amountUsd: number,
  days: number,
  annualRate: number = 0.05 // 5% anual aproximado
): number {
  const dailyRate = annualRate / 365;
  return amountUsd * dailyRate * days;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const HoldCalculator: React.FC<HoldCalculatorProps> = ({
  isOpen,
  onClose,
  currentPrice,
  strategyMode,
  projectedTrend = 'neutral',
  volatilityPercent = 2,
}) => {
  const [usdAmount, setUsdAmount] = useState(10000);
  const [holdDays, setHoldDays] = useState(30);

  // Determinar tendencia basada en estrategia
  const effectiveTrend = useMemo((): 'bullish' | 'bearish' | 'neutral' => {
    if (strategyMode === 'LONG_USD_DURATION') return 'bullish';
    if (strategyMode === 'HIGH_VELOCITY_SALES') return 'bearish';
    return projectedTrend;
  }, [strategyMode, projectedTrend]);

  // Calcular escenarios
  const scenarios = useMemo((): {
    sellToday: ScenarioResult;
    holdProjected: ScenarioResult;
    holdOptimistic: ScenarioResult;
    holdPessimistic: ScenarioResult;
  } => {
    const todayTotal = usdAmount * currentPrice;
    const projection = projectPrice(currentPrice, holdDays, effectiveTrend);
    const opportunityCost = calculateOpportunityCost(usdAmount, holdDays);

    // Escenario: Vender hoy
    const sellToday: ScenarioResult = {
      label: 'Vender Hoy',
      price: currentPrice,
      totalMxn: todayTotal,
      difference: 0,
      differencePercent: 0,
      recommendation: strategyMode === 'HIGH_VELOCITY_SALES' ? 'recommended' : 'neutral',
      reason: 'Liquidez inmediata, sin riesgo de mercado',
    };

    // Escenario: Hold proyectado
    const projectedTotal = usdAmount * projection.projected;
    const projectedDiff = projectedTotal - todayTotal - opportunityCost;
    const holdProjected: ScenarioResult = {
      label: `Mantener ${holdDays} días`,
      price: projection.projected,
      totalMxn: projectedTotal,
      difference: projectedDiff,
      differencePercent: (projectedDiff / todayTotal) * 100,
      recommendation: projectedDiff > todayTotal * 0.01 ? 'recommended' : 'neutral',
      reason: `Proyección media basada en tendencia ${effectiveTrend}`,
    };

    // Escenario optimista
    const optimisticTotal = usdAmount * projection.high;
    const optimisticDiff = optimisticTotal - todayTotal;
    const holdOptimistic: ScenarioResult = {
      label: 'Escenario Optimista',
      price: projection.high,
      totalMxn: optimisticTotal,
      difference: optimisticDiff,
      differencePercent: (optimisticDiff / todayTotal) * 100,
      recommendation: 'neutral',
      reason: 'Mejor caso con volatilidad favorable',
    };

    // Escenario pesimista
    const pessimisticTotal = usdAmount * projection.low;
    const pessimisticDiff = pessimisticTotal - todayTotal;
    const holdPessimistic: ScenarioResult = {
      label: 'Escenario Pesimista',
      price: projection.low,
      totalMxn: pessimisticTotal,
      difference: pessimisticDiff,
      differencePercent: (pessimisticDiff / todayTotal) * 100,
      recommendation: pessimisticDiff < -todayTotal * 0.02 ? 'caution' : 'neutral',
      reason: 'Peor caso con volatilidad adversa',
    };

    return {
      sellToday,
      holdProjected,
      holdOptimistic,
      holdPessimistic,
    };
  }, [usdAmount, currentPrice, holdDays, effectiveTrend, strategyMode]);

  // Determinar la mejor opción
  const bestOption = useMemo(() => {
    if (scenarios.holdProjected.difference > scenarios.sellToday.totalMxn * 0.015) {
      return 'hold';
    }
    if (scenarios.holdPessimistic.difference < -scenarios.sellToday.totalMxn * 0.02) {
      return 'sell';
    }
    return 'neutral';
  }, [scenarios]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Calculator className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Calculadora Hold vs Sell
                </h2>
                <p className="text-sm text-zinc-400">
                  Simula escenarios de venta
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Contenido */}
          <div className="p-6 space-y-6">
            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cantidad USD */}
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">
                  Dólares Disponibles
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="number"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-9 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Periodo de hold */}
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">
                  Periodo de Espera: {holdDays} días
                </label>
                <Slider
                  value={[holdDays]}
                  onValueChange={(values: number[]) => setHoldDays(values[0])}
                  min={7}
                  max={90}
                  step={1}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  {HOLD_PERIODS.map((period) => (
                    <button
                      key={period.days}
                      onClick={() => setHoldDays(period.days)}
                      className={cn(
                        'px-2 py-1 rounded transition-colors',
                        holdDays === period.days
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'hover:bg-zinc-800'
                      )}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Indicador de tendencia */}
            <div className={cn(
              'flex items-center gap-3 p-3 rounded-lg border',
              effectiveTrend === 'bullish' && 'bg-emerald-500/10 border-emerald-500/30',
              effectiveTrend === 'bearish' && 'bg-red-500/10 border-red-500/30',
              effectiveTrend === 'neutral' && 'bg-zinc-500/10 border-zinc-500/30'
            )}>
              {effectiveTrend === 'bullish' && <TrendingUp className="h-5 w-5 text-emerald-400" />}
              {effectiveTrend === 'bearish' && <TrendingDown className="h-5 w-5 text-red-400" />}
              {effectiveTrend === 'neutral' && <Info className="h-5 w-5 text-zinc-400" />}
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  Tendencia detectada: {effectiveTrend === 'bullish' ? 'Alcista (USD↑)' : effectiveTrend === 'bearish' ? 'Bajista (USD↓)' : 'Neutral'}
                </p>
                <p className="text-xs text-zinc-400">
                  Basado en análisis de spread TIIE/Fed y DXY
                </p>
              </div>
            </div>

            {/* Comparación de escenarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vender hoy */}
              <ScenarioCard
                scenario={scenarios.sellToday}
                isRecommended={bestOption === 'sell'}
                icon={<DollarSign className="h-5 w-5" />}
              />

              {/* Mantener (proyectado) */}
              <ScenarioCard
                scenario={scenarios.holdProjected}
                isRecommended={bestOption === 'hold'}
                icon={<Clock className="h-5 w-5" />}
                showRange={{
                  low: scenarios.holdPessimistic.totalMxn,
                  high: scenarios.holdOptimistic.totalMxn,
                }}
              />
            </div>

            {/* Resumen de decisión */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'p-4 rounded-lg border',
                bestOption === 'hold' && 'bg-emerald-500/10 border-emerald-500/30',
                bestOption === 'sell' && 'bg-blue-500/10 border-blue-500/30',
                bestOption === 'neutral' && 'bg-zinc-500/10 border-zinc-500/30'
              )}
            >
              <div className="flex items-start gap-3">
                {bestOption === 'hold' && (
                  <Sparkles className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                )}
                {bestOption === 'sell' && (
                  <CheckCircle2 className="h-6 w-6 text-blue-400 flex-shrink-0" />
                )}
                {bestOption === 'neutral' && (
                  <AlertTriangle className="h-6 w-6 text-amber-400 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-white">
                    {bestOption === 'hold' && '¿Puedes esperar? Ganarías más manteniendo.'}
                    {bestOption === 'sell' && 'Considera vender ahora para asegurar liquidez.'}
                    {bestOption === 'neutral' && 'La diferencia es mínima. Decide según tu necesidad de liquidez.'}
                  </p>
                  <p className="text-sm text-zinc-400 mt-1">
                    {bestOption === 'hold' && (
                      <>
                        Ganancia potencial extra: 
                        <span className="text-emerald-400 font-semibold ml-1">
                          +${Math.abs(scenarios.holdProjected.difference).toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN
                        </span>
                      </>
                    )}
                    {bestOption === 'sell' && (
                      <>
                        El mercado podría bajar. Asegura 
                        <span className="text-blue-400 font-semibold ml-1">
                          ${scenarios.sellToday.totalMxn.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN
                        </span>
                        {' '}hoy.
                      </>
                    )}
                    {bestOption === 'neutral' && (
                      <>
                        Diferencia proyectada: {scenarios.holdProjected.differencePercent.toFixed(2)}%
                      </>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-900/50">
            <p className="text-xs text-zinc-500">
              * Proyecciones basadas en tendencias históricas. No garantizan resultados futuros.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Registrar Decisión
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// SUBCOMPONENTES
// ============================================

interface ScenarioCardProps {
  scenario: ScenarioResult;
  isRecommended: boolean;
  icon: React.ReactNode;
  showRange?: { low: number; high: number };
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  isRecommended,
  icon,
  showRange,
}) => {
  return (
    <div className={cn(
      'p-4 rounded-lg border transition-all',
      isRecommended
        ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
        : 'bg-zinc-800/50 border-zinc-700'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'p-1.5 rounded',
            isRecommended ? 'bg-emerald-500/20' : 'bg-zinc-700'
          )}>
            {icon}
          </div>
          <span className="font-medium text-white">{scenario.label}</span>
        </div>
        {isRecommended && (
          <Badge className="bg-emerald-500 text-white">
            Recomendado
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">
            ${scenario.totalMxn.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-sm text-zinc-500">MXN</span>
        </div>

        <div className="text-sm text-zinc-400">
          @ ${scenario.price.toFixed(2)} MXN/USD
        </div>

        {scenario.difference !== 0 && (
          <div className={cn(
            'text-sm font-medium',
            scenario.difference > 0 ? 'text-emerald-400' : 'text-red-400'
          )}>
            {scenario.difference > 0 ? '+' : ''}
            ${Math.abs(scenario.difference).toLocaleString('es-MX', { maximumFractionDigits: 0 })} 
            ({scenario.differencePercent > 0 ? '+' : ''}{scenario.differencePercent.toFixed(2)}%)
          </div>
        )}

        {showRange && (
          <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-700">
            Rango: ${showRange.low.toLocaleString('es-MX', { maximumFractionDigits: 0 })} - ${showRange.high.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HoldCalculator;
