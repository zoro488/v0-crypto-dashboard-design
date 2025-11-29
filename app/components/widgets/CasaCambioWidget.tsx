/**
 * Widget de Casa de Cambio integrado en Profit Panel
 * Con indicadores técnicos RSI, MACD, Bollinger Bands
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  AlertTriangle,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { SafeChartContainer, SAFE_ANIMATION_PROPS } from "@/app/components/ui/SafeChartContainer";
import { casaCambioService } from '@/app/lib/services/casa-cambio.service';
import { AnimatedCounter, AnimatedBadge } from '@/app/components/ui/PremiumComponents';
import { logger } from '@/app/lib/utils/logger';

interface ExchangeRateData {
  currentRate: number;
  buyRate: number;
  sellRate: number;
  spread: number;
  historical: Array<{ date: string; value: number }>;
  indicators: {
    rsi: number;
    macd: { value: number; signal: number; histogram: number };
    bollinger: { upper: number; middle: number; lower: number };
  };
  alerts: Array<{ type: 'warning' | 'danger' | 'info'; message: string }>;
}

export default function CasaCambioWidget() {
  const [data, setData] = useState<ExchangeRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchExchangeData = async () => {
    try {
      setLoading(true);
      
      // Obtener datos en paralelo
      const [currentRate, historical] = await Promise.all([
        casaCambioService.getCurrentRate(),
        casaCambioService.getHistoricalRates(30),
      ]);

      // Calcular spread óptimo
      const { buy, sell, spread } = casaCambioService.calculateOptimalSpread(historical);

      // Calcular indicadores técnicos
      const indicators = casaCambioService.calculateTechnicalIndicators(historical);

      // Detectar alertas
      const alerts = casaCambioService.detectVolatilityAlerts(indicators, currentRate);

      setData({
        currentRate,
        buyRate: buy,
        sellRate: sell,
        spread,
        historical,
        indicators,
        alerts,
      });

      setLastUpdate(new Date());
    } catch (error) {
      logger.error('Error fetching exchange data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeData();

    if (autoRefresh) {
      // Actualizar cada 5 minutos
      const interval = setInterval(fetchExchangeData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading || !data) {
    return (
      <div className="glass p-6 rounded-2xl border border-white/5 animate-pulse">
        <div className="h-8 bg-white/5 rounded mb-4 w-48" />
        <div className="h-24 bg-white/5 rounded mb-4" />
        <div className="h-64 bg-white/5 rounded" />
      </div>
    );
  }

  const trend = data.historical.length > 1
    ? data.currentRate > data.historical[data.historical.length - 2].value
      ? 'up'
      : 'down'
    : 'neutral';

  const chartData = data.historical.map((item) => ({
    date: new Date(item.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
    rate: item.value,
    upper: data.indicators.bollinger.upper,
    middle: data.indicators.bollinger.middle,
    lower: data.indicators.bollinger.lower,
  }));

  return (
    <div className="space-y-6">
      {/* Header con tipo de cambio actual */}
      <div className="glass p-6 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Casa de Cambio</h3>
              <p className="text-sm text-white/50">
                Actualizado: {lastUpdate.toLocaleTimeString('es-MX')}
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchExchangeData()}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Tipo de cambio actual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-black/20 p-4 rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Tipo de Cambio</span>
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </div>
            <AnimatedCounter
              value={data.currentRate}
              prefix="$"
              decimals={4}
              className="text-3xl text-white"
            />
            <p className="text-xs text-white/40 mt-1">MXN por USD</p>
          </div>

          <div className="bg-black/20 p-4 rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Compra</span>
              <span className="text-xs text-blue-400 font-semibold">
                -{((data.spread / 2)).toFixed(2)}%
              </span>
            </div>
            <AnimatedCounter
              value={data.buyRate}
              prefix="$"
              decimals={4}
              className="text-3xl text-blue-400"
            />
            <p className="text-xs text-white/40 mt-1">Compramos dólares</p>
          </div>

          <div className="bg-black/20 p-4 rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Venta</span>
              <span className="text-xs text-green-400 font-semibold">
                +{(data.spread / 2).toFixed(2)}%
              </span>
            </div>
            <AnimatedCounter
              value={data.sellRate}
              prefix="$"
              decimals={4}
              className="text-3xl text-green-400"
            />
            <p className="text-xs text-white/40 mt-1">Vendemos dólares</p>
          </div>
        </div>

        {/* Spread y utilidad */}
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-xl border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white/60 text-sm block mb-1">Spread Actual</span>
              <span className="text-2xl font-bold text-green-400">{data.spread.toFixed(2)}%</span>
            </div>
            <div className="text-right">
              <span className="text-white/60 text-sm block mb-1">Utilidad por $1,000 USD</span>
              <span className="text-xl font-bold text-white">
                ${((data.sellRate - data.buyRate) * 1000).toFixed(2)} MXN
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico histórico con Bollinger Bands */}
      <div className="glass p-6 rounded-2xl border border-white/5">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Historial 30 días con Bollinger Bands
        </h4>
        <SafeChartContainer height={300} minHeight={200}>
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="date" stroke="#ffffff40" tick={{ fontSize: 12 }} />
            <YAxis
              stroke="#ffffff40"
              tick={{ fontSize: 12 }}
              domain={['dataMin - 0.2', 'dataMax + 0.2']}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
              }}
            />
            
            {/* Bollinger Bands */}
            <Line
              type="monotone"
              dataKey="upper"
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="Banda Superior"
              {...SAFE_ANIMATION_PROPS}
            />
            <Line
              type="monotone"
              dataKey="middle"
              stroke="#ffffff40"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="Media Móvil"
              {...SAFE_ANIMATION_PROPS}
            />
            <Line
              type="monotone"
              dataKey="lower"
              stroke="#10b981"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="Banda Inferior"
              {...SAFE_ANIMATION_PROPS}
            />
            
            {/* Precio actual */}
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Tipo de Cambio"
              {...SAFE_ANIMATION_PROPS}
            />
          </LineChart>
        </SafeChartContainer>
      </div>

      {/* Indicadores técnicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RSI */}
        <div className="glass p-4 rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60 text-sm">RSI (14)</span>
            <Info className="w-4 h-4 text-white/40" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {data.indicators.rsi.toFixed(1)}
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full ${
                data.indicators.rsi > 70
                  ? 'bg-red-500'
                  : data.indicators.rsi < 30
                  ? 'bg-green-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${data.indicators.rsi}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/40">
            <span>Sobreventa</span>
            <span>Neutral</span>
            <span>Sobrecompra</span>
          </div>
        </div>

        {/* MACD */}
        <div className="glass p-4 rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60 text-sm">MACD</span>
            <AnimatedBadge
              variant={data.indicators.macd.histogram > 0 ? 'success' : 'error'}
              pulse
            >
              {data.indicators.macd.histogram > 0 ? 'Alcista' : 'Bajista'}
            </AnimatedBadge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">MACD:</span>
              <span className="text-white font-mono">
                {data.indicators.macd.value.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Señal:</span>
              <span className="text-white font-mono">
                {data.indicators.macd.signal.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Histograma:</span>
              <span
                className={`font-mono font-bold ${
                  data.indicators.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {data.indicators.macd.histogram.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Bollinger Bands Info */}
        <div className="glass p-4 rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60 text-sm">Bandas Bollinger</span>
            <span className="text-xs text-white/40">(20, 2σ)</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-red-400">Superior:</span>
              <span className="text-white font-mono">
                ${data.indicators.bollinger.upper.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Media:</span>
              <span className="text-white font-mono">
                ${data.indicators.bollinger.middle.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-400">Inferior:</span>
              <span className="text-white font-mono">
                ${data.indicators.bollinger.lower.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas de volatilidad */}
      {data.alerts.length > 0 && (
        <div className="glass p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-semibold">Alertas de Mercado</span>
          </div>
          <div className="space-y-2">
            {data.alerts.map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border ${
                  alert.type === 'danger'
                    ? 'bg-red-500/10 border-red-500/30'
                    : alert.type === 'warning'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <p className="text-sm text-white">{alert.message}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
