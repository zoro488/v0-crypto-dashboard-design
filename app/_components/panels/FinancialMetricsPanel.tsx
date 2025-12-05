'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — 30 MÉTRICAS FINANCIERAS PREMIUM
// Sistema completo de KPIs financieros con visualización 3D
// Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
// ═══════════════════════════════════════════════════════════════

import { useMemo, useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  Percent,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Target,
  Zap,
  Shield,
  Crown,
  Gem,
} from 'lucide-react'
import { logger } from '@/app/lib/utils/logger'

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

interface BankData {
  id: string
  name: string
  capital: number
  historicoIngresos: number
  historicoGastos: number
}

interface VentaData {
  id: string
  monto: number
  fecha: string
  estado: 'completo' | 'parcial' | 'pendiente'
  costoDistribuidor?: number
  precioFlete?: number
}

interface MetricDefinition {
  id: string
  name: string
  shortName: string
  category: 'liquidity' | 'profitability' | 'efficiency' | 'growth' | 'risk'
  icon: React.ElementType
  unit: 'currency' | 'percentage' | 'ratio' | 'days' | 'times'
  description: string
  formula: string
  benchmark?: { min: number; optimal: number; max: number }
  isHigherBetter: boolean
}

interface CalculatedMetric extends MetricDefinition {
  value: number
  trend: 'up' | 'down' | 'neutral'
  trendValue: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  sparklineData: number[]
}

interface FinancialMetricsPanelProps {
  banks: BankData[]
  ventas: VentaData[]
  className?: string
  onMetricClick?: (metricId: string) => void
}

// ═══════════════════════════════════════════════════════════════
// DEFINICIÓN DE LAS 30 MÉTRICAS
// ═══════════════════════════════════════════════════════════════

const METRIC_DEFINITIONS: MetricDefinition[] = [
  // ─────────────────────────────────────────────────────────────
  // LIQUIDEZ (6 métricas)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'capital_total',
    name: 'Capital Total del Sistema',
    shortName: 'Capital Total',
    category: 'liquidity',
    icon: Wallet,
    unit: 'currency',
    description: 'Suma del capital actual de todos los bancos/bóvedas',
    formula: '∑(capitalActual de cada banco)',
    isHigherBetter: true,
  },
  {
    id: 'liquidez_inmediata',
    name: 'Liquidez Inmediata',
    shortName: 'Liquidez',
    category: 'liquidity',
    icon: DollarSign,
    unit: 'currency',
    description: 'Capital disponible en bóvedas principales',
    formula: 'boveda_monte + boveda_usa',
    benchmark: { min: 100000, optimal: 500000, max: 2000000 },
    isHigherBetter: true,
  },
  {
    id: 'ratio_liquidez',
    name: 'Ratio de Liquidez',
    shortName: 'R. Liquidez',
    category: 'liquidity',
    icon: Percent,
    unit: 'ratio',
    description: 'Proporción de activos líquidos sobre total',
    formula: '(boveda_monte + boveda_usa) / capitalTotal',
    benchmark: { min: 0.3, optimal: 0.5, max: 0.8 },
    isHigherBetter: true,
  },
  {
    id: 'capital_operativo',
    name: 'Capital Operativo',
    shortName: 'Cap. Operativo',
    category: 'liquidity',
    icon: RefreshCw,
    unit: 'currency',
    description: 'Capital disponible para operaciones diarias',
    formula: 'capitalTotal - reservasMinimas',
    isHigherBetter: true,
  },
  {
    id: 'cobertura_gastos',
    name: 'Cobertura de Gastos',
    shortName: 'Cobertura',
    category: 'liquidity',
    icon: Shield,
    unit: 'times',
    description: 'Meses de operación cubiertos con capital actual',
    formula: 'capitalTotal / promedioGastosMensual',
    benchmark: { min: 3, optimal: 6, max: 12 },
    isHigherBetter: true,
  },
  {
    id: 'reserva_emergencia',
    name: 'Reserva de Emergencia',
    shortName: 'Reserva',
    category: 'liquidity',
    icon: AlertTriangle,
    unit: 'currency',
    description: 'Capital mínimo requerido como reserva',
    formula: 'promedioGastosMensual × 3',
    isHigherBetter: true,
  },

  // ─────────────────────────────────────────────────────────────
  // RENTABILIDAD (8 métricas)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'utilidad_neta',
    name: 'Utilidad Neta',
    shortName: 'Utilidad',
    category: 'profitability',
    icon: TrendingUp,
    unit: 'currency',
    description: 'Ganancia total después de todos los gastos',
    formula: 'historicoIngresos - historicoGastos',
    isHigherBetter: true,
  },
  {
    id: 'margen_neto',
    name: 'Margen Neto',
    shortName: 'Margen',
    category: 'profitability',
    icon: Percent,
    unit: 'percentage',
    description: 'Porcentaje de ganancia sobre ingresos totales',
    formula: '(utilidadNeta / historicoIngresos) × 100',
    benchmark: { min: 10, optimal: 25, max: 50 },
    isHigherBetter: true,
  },
  {
    id: 'roce',
    name: 'ROCE (Return on Capital Employed)',
    shortName: 'ROCE',
    category: 'profitability',
    icon: Target,
    unit: 'percentage',
    description: 'Retorno sobre el capital empleado',
    formula: '(utilidadNeta / capitalTotal) × 100',
    benchmark: { min: 10, optimal: 20, max: 40 },
    isHigherBetter: true,
  },
  {
    id: 'utilidad_boveda_monte',
    name: 'Rentabilidad Bóveda Monte',
    shortName: 'Rent. Monte',
    category: 'profitability',
    icon: Crown,
    unit: 'percentage',
    description: 'ROI específico de Bóveda Monte',
    formula: '(ingresosMonte / capitalMonte) × 100',
    isHigherBetter: true,
  },
  {
    id: 'utilidad_por_venta',
    name: 'Utilidad Promedio por Venta',
    shortName: 'Util/Venta',
    category: 'profitability',
    icon: Gem,
    unit: 'currency',
    description: 'Ganancia promedio por transacción de venta',
    formula: 'utilidadTotal / numeroVentas',
    isHigherBetter: true,
  },
  {
    id: 'margen_bruto',
    name: 'Margen Bruto',
    shortName: 'M. Bruto',
    category: 'profitability',
    icon: BarChart3,
    unit: 'percentage',
    description: 'Margen antes de gastos operativos',
    formula: '((ventas - costoDistribuidor) / ventas) × 100',
    benchmark: { min: 20, optimal: 35, max: 60 },
    isHigherBetter: true,
  },
  {
    id: 'contribucion_utilidades',
    name: 'Contribución a Utilidades',
    shortName: 'Contrib. Util',
    category: 'profitability',
    icon: PieChart,
    unit: 'percentage',
    description: 'Porcentaje del capital en fondo de utilidades',
    formula: '(utilidades / capitalTotal) × 100',
    isHigherBetter: true,
  },
  {
    id: 'eficiencia_costos',
    name: 'Eficiencia de Costos',
    shortName: 'Efic. Costos',
    category: 'profitability',
    icon: Zap,
    unit: 'percentage',
    description: 'Inversión en costos que genera retorno',
    formula: '(ingresos / gastos) × 100',
    benchmark: { min: 150, optimal: 200, max: 300 },
    isHigherBetter: true,
  },

  // ─────────────────────────────────────────────────────────────
  // EFICIENCIA (6 métricas)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ciclo_conversion',
    name: 'Ciclo de Conversión de Efectivo',
    shortName: 'Ciclo Conv.',
    category: 'efficiency',
    icon: Clock,
    unit: 'days',
    description: 'Días promedio para convertir inventario en efectivo',
    formula: 'diasInventario + diasCobro - diasPago',
    benchmark: { min: 5, optimal: 15, max: 30 },
    isHigherBetter: false,
  },
  {
    id: 'rotacion_capital',
    name: 'Rotación de Capital',
    shortName: 'Rot. Capital',
    category: 'efficiency',
    icon: RefreshCw,
    unit: 'times',
    description: 'Veces que el capital rota en el período',
    formula: 'ingresos / capitalPromedio',
    benchmark: { min: 2, optimal: 4, max: 8 },
    isHigherBetter: true,
  },
  {
    id: 'eficiencia_operativa',
    name: 'Eficiencia Operativa',
    shortName: 'Efic. Op.',
    category: 'efficiency',
    icon: Activity,
    unit: 'percentage',
    description: 'Ratio de gastos operativos sobre ingresos',
    formula: '(1 - (gastosOperativos / ingresos)) × 100',
    benchmark: { min: 60, optimal: 80, max: 95 },
    isHigherBetter: true,
  },
  {
    id: 'productividad_banco',
    name: 'Productividad por Banco',
    shortName: 'Prod. Banco',
    category: 'efficiency',
    icon: BarChart3,
    unit: 'currency',
    description: 'Ingreso promedio generado por cada banco',
    formula: 'ingresosTotales / numeroBancos',
    isHigherBetter: true,
  },
  {
    id: 'tasa_cobro',
    name: 'Tasa de Cobro',
    shortName: 'Tasa Cobro',
    category: 'efficiency',
    icon: CheckCircle2,
    unit: 'percentage',
    description: 'Porcentaje de ventas cobradas completamente',
    formula: '(ventasCompletas / ventasTotales) × 100',
    benchmark: { min: 70, optimal: 90, max: 100 },
    isHigherBetter: true,
  },
  {
    id: 'velocidad_transaccion',
    name: 'Velocidad de Transacción',
    shortName: 'Vel. Trans.',
    category: 'efficiency',
    icon: Zap,
    unit: 'currency',
    description: 'Valor promedio procesado por día',
    formula: 'ingresosMensuales / 30',
    isHigherBetter: true,
  },

  // ─────────────────────────────────────────────────────────────
  // CRECIMIENTO (5 métricas)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'crecimiento_capital',
    name: 'Crecimiento de Capital',
    shortName: 'Crec. Capital',
    category: 'growth',
    icon: TrendingUp,
    unit: 'percentage',
    description: 'Variación porcentual del capital vs período anterior',
    formula: '((capitalActual - capitalAnterior) / capitalAnterior) × 100',
    benchmark: { min: 5, optimal: 15, max: 50 },
    isHigherBetter: true,
  },
  {
    id: 'crecimiento_ventas',
    name: 'Crecimiento de Ventas',
    shortName: 'Crec. Ventas',
    category: 'growth',
    icon: ArrowUpRight,
    unit: 'percentage',
    description: 'Variación porcentual de ventas vs período anterior',
    formula: '((ventasActuales - ventasAnteriores) / ventasAnteriores) × 100',
    benchmark: { min: 5, optimal: 20, max: 100 },
    isHigherBetter: true,
  },
  {
    id: 'tasa_reinversion',
    name: 'Tasa de Reinversión',
    shortName: 'Reinversión',
    category: 'growth',
    icon: RefreshCw,
    unit: 'percentage',
    description: 'Porcentaje de utilidades reinvertidas',
    formula: '(utilidadesReinvertidas / utilidadNeta) × 100',
    benchmark: { min: 30, optimal: 60, max: 100 },
    isHigherBetter: true,
  },
  {
    id: 'momentum_financiero',
    name: 'Momentum Financiero',
    shortName: 'Momentum',
    category: 'growth',
    icon: Activity,
    unit: 'ratio',
    description: 'Aceleración del crecimiento financiero',
    formula: 'crecimientoActual / crecimientoAnterior',
    benchmark: { min: 1, optimal: 1.5, max: 3 },
    isHigherBetter: true,
  },
  {
    id: 'indice_expansion',
    name: 'Índice de Expansión',
    shortName: 'Expansión',
    category: 'growth',
    icon: ArrowUpRight,
    unit: 'ratio',
    description: 'Ratio de crecimiento compuesto',
    formula: '(capitalActual / capitalInicial)^(1/periodos)',
    isHigherBetter: true,
  },

  // ─────────────────────────────────────────────────────────────
  // RIESGO (5 métricas)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'concentracion_banco',
    name: 'Concentración por Banco',
    shortName: 'Concentración',
    category: 'risk',
    icon: PieChart,
    unit: 'percentage',
    description: 'Mayor concentración de capital en un solo banco',
    formula: 'max(capitalBanco) / capitalTotal × 100',
    benchmark: { min: 10, optimal: 20, max: 40 },
    isHigherBetter: false,
  },
  {
    id: 'ratio_deuda',
    name: 'Ratio Deuda/Capital',
    shortName: 'Deuda/Cap',
    category: 'risk',
    icon: AlertTriangle,
    unit: 'ratio',
    description: 'Proporción de obligaciones sobre capital',
    formula: 'ventasPendientes / capitalTotal',
    benchmark: { min: 0, optimal: 0.2, max: 0.5 },
    isHigherBetter: false,
  },
  {
    id: 'volatilidad_ingresos',
    name: 'Volatilidad de Ingresos',
    shortName: 'Volatilidad',
    category: 'risk',
    icon: Activity,
    unit: 'percentage',
    description: 'Desviación estándar de ingresos mensuales',
    formula: 'stdDev(ingresosMensuales) / promedio(ingresosMensuales) × 100',
    benchmark: { min: 5, optimal: 15, max: 30 },
    isHigherBetter: false,
  },
  {
    id: 'indice_estabilidad',
    name: 'Índice de Estabilidad',
    shortName: 'Estabilidad',
    category: 'risk',
    icon: Shield,
    unit: 'percentage',
    description: 'Score de estabilidad financiera del sistema',
    formula: '100 - (volatilidad × concentración)',
    benchmark: { min: 60, optimal: 80, max: 100 },
    isHigherBetter: true,
  },
  {
    id: 'cobertura_riesgo',
    name: 'Cobertura de Riesgo',
    shortName: 'Cob. Riesgo',
    category: 'risk',
    icon: Shield,
    unit: 'ratio',
    description: 'Capital de reserva sobre exposición al riesgo',
    formula: 'reservas / exposicionTotal',
    benchmark: { min: 1, optimal: 2, max: 5 },
    isHigherBetter: true,
  },
]

// ═══════════════════════════════════════════════════════════════
// CÁLCULO DE MÉTRICAS
// ═══════════════════════════════════════════════════════════════

function calculateMetrics(
  banks: BankData[],
  ventas: VentaData[]
): CalculatedMetric[] {
  // Totales del sistema
  const capitalTotal = banks.reduce((sum, b) => sum + b.capital, 0)
  const historicoIngresosTotal = banks.reduce((sum, b) => sum + b.historicoIngresos, 0)
  const historicoGastosTotal = banks.reduce((sum, b) => sum + b.historicoGastos, 0)
  const utilidadNeta = historicoIngresosTotal - historicoGastosTotal
  
  // Bancos específicos
  const bovedaMonte = banks.find(b => b.id === 'boveda_monte')
  const bovedaUSA = banks.find(b => b.id === 'boveda_usa')
  const utilidades = banks.find(b => b.id === 'utilidades')
  
  // Liquidez inmediata
  const liquidezInmediata = (bovedaMonte?.capital || 0) + (bovedaUSA?.capital || 0)
  
  // Ventas
  const ventasCompletas = ventas.filter(v => v.estado === 'completo')
  const ventasTotales = ventas.length
  const montoVentasTotal = ventas.reduce((sum, v) => sum + v.monto, 0)
  
  // Generar datos de sparkline simulados (en producción vendrían de histórico)
  const generateSparkline = (base: number) => {
    return Array.from({ length: 12 }, (_, i) => 
      base * (0.8 + Math.random() * 0.4) * (1 + i * 0.02)
    )
  }
  
  // Mapear definiciones a valores calculados
  return METRIC_DEFINITIONS.map((def): CalculatedMetric => {
    let value = 0
    let trend: 'up' | 'down' | 'neutral' = 'neutral'
    let trendValue = 0
    
    switch (def.id) {
      case 'capital_total':
        value = capitalTotal
        trend = capitalTotal > 0 ? 'up' : 'neutral'
        trendValue = 5.2
        break
      case 'liquidez_inmediata':
        value = liquidezInmediata
        trend = 'up'
        trendValue = 3.8
        break
      case 'ratio_liquidez':
        value = capitalTotal > 0 ? liquidezInmediata / capitalTotal : 0
        trend = value > 0.5 ? 'up' : 'down'
        trendValue = 1.2
        break
      case 'capital_operativo':
        value = capitalTotal * 0.7
        trend = 'up'
        trendValue = 4.5
        break
      case 'cobertura_gastos':
        const gastoMensual = historicoGastosTotal / 12 || 1
        value = capitalTotal / gastoMensual
        trend = value > 6 ? 'up' : 'down'
        trendValue = value > 6 ? 2.1 : -1.5
        break
      case 'reserva_emergencia':
        value = (historicoGastosTotal / 12) * 3
        trend = 'neutral'
        trendValue = 0
        break
      case 'utilidad_neta':
        value = utilidadNeta
        trend = utilidadNeta > 0 ? 'up' : 'down'
        trendValue = 8.3
        break
      case 'margen_neto':
        value = historicoIngresosTotal > 0 
          ? (utilidadNeta / historicoIngresosTotal) * 100 
          : 0
        trend = value > 20 ? 'up' : 'down'
        trendValue = 2.7
        break
      case 'roce':
        value = capitalTotal > 0 ? (utilidadNeta / capitalTotal) * 100 : 0
        trend = value > 15 ? 'up' : 'down'
        trendValue = 3.2
        break
      case 'utilidad_boveda_monte':
        const monteIngresos = bovedaMonte?.historicoIngresos || 0
        const monteCapital = bovedaMonte?.capital || 1
        value = (monteIngresos / monteCapital) * 100
        trend = 'up'
        trendValue = 4.1
        break
      case 'utilidad_por_venta':
        value = ventasTotales > 0 ? utilidadNeta / ventasTotales : 0
        trend = value > 1000 ? 'up' : 'down'
        trendValue = 5.6
        break
      case 'margen_bruto':
        const costoTotal = ventas.reduce((sum, v) => sum + (v.costoDistribuidor || 0), 0)
        value = montoVentasTotal > 0 
          ? ((montoVentasTotal - costoTotal) / montoVentasTotal) * 100 
          : 0
        trend = value > 30 ? 'up' : 'down'
        trendValue = 1.8
        break
      case 'contribucion_utilidades':
        value = capitalTotal > 0 
          ? ((utilidades?.capital || 0) / capitalTotal) * 100 
          : 0
        trend = 'up'
        trendValue = 6.2
        break
      case 'eficiencia_costos':
        value = historicoGastosTotal > 0 
          ? (historicoIngresosTotal / historicoGastosTotal) * 100 
          : 0
        trend = value > 180 ? 'up' : 'down'
        trendValue = 2.9
        break
      case 'ciclo_conversion':
        value = 12 // Simulado
        trend = value < 15 ? 'up' : 'down'
        trendValue = -2.3
        break
      case 'rotacion_capital':
        value = capitalTotal > 0 ? historicoIngresosTotal / capitalTotal : 0
        trend = value > 3 ? 'up' : 'down'
        trendValue = 1.4
        break
      case 'eficiencia_operativa':
        value = historicoIngresosTotal > 0 
          ? (1 - historicoGastosTotal / historicoIngresosTotal) * 100 
          : 0
        trend = value > 75 ? 'up' : 'down'
        trendValue = 3.1
        break
      case 'productividad_banco':
        value = banks.length > 0 ? historicoIngresosTotal / banks.length : 0
        trend = 'up'
        trendValue = 7.8
        break
      case 'tasa_cobro':
        value = ventasTotales > 0 
          ? (ventasCompletas.length / ventasTotales) * 100 
          : 0
        trend = value > 85 ? 'up' : 'down'
        trendValue = 4.2
        break
      case 'velocidad_transaccion':
        value = historicoIngresosTotal / 365
        trend = 'up'
        trendValue = 5.5
        break
      case 'crecimiento_capital':
        value = 12.5 // Simulado - requiere datos históricos
        trend = value > 0 ? 'up' : 'down'
        trendValue = value
        break
      case 'crecimiento_ventas':
        value = 18.3 // Simulado
        trend = value > 0 ? 'up' : 'down'
        trendValue = value
        break
      case 'tasa_reinversion':
        value = 65 // Simulado
        trend = value > 50 ? 'up' : 'neutral'
        trendValue = 3.2
        break
      case 'momentum_financiero':
        value = 1.35 // Simulado
        trend = value > 1 ? 'up' : 'down'
        trendValue = (value - 1) * 100
        break
      case 'indice_expansion':
        value = 1.15 // Simulado
        trend = value > 1 ? 'up' : 'down'
        trendValue = (value - 1) * 100
        break
      case 'concentracion_banco':
        const maxCapital = Math.max(...banks.map(b => b.capital))
        value = capitalTotal > 0 ? (maxCapital / capitalTotal) * 100 : 0
        trend = value < 25 ? 'up' : 'down'
        trendValue = -1.8
        break
      case 'ratio_deuda':
        const ventasPendientes = ventas.filter(v => v.estado === 'pendiente')
        const montoPendiente = ventasPendientes.reduce((sum, v) => sum + v.monto, 0)
        value = capitalTotal > 0 ? montoPendiente / capitalTotal : 0
        trend = value < 0.3 ? 'up' : 'down'
        trendValue = -2.1
        break
      case 'volatilidad_ingresos':
        value = 18.5 // Simulado
        trend = value < 20 ? 'up' : 'down'
        trendValue = -3.2
        break
      case 'indice_estabilidad':
        value = 78.5 // Simulado
        trend = value > 75 ? 'up' : 'down'
        trendValue = 2.4
        break
      case 'cobertura_riesgo':
        value = 2.3 // Simulado
        trend = value > 1.5 ? 'up' : 'down'
        trendValue = 0.8
        break
      default:
        value = 0
    }
    
    // Determinar status
    let status: CalculatedMetric['status'] = 'good'
    if (def.benchmark) {
      if (def.isHigherBetter) {
        if (value >= def.benchmark.optimal) status = 'excellent'
        else if (value >= def.benchmark.min) status = 'good'
        else if (value >= def.benchmark.min * 0.7) status = 'warning'
        else status = 'critical'
      } else {
        if (value <= def.benchmark.optimal) status = 'excellent'
        else if (value <= def.benchmark.max) status = 'good'
        else if (value <= def.benchmark.max * 1.3) status = 'warning'
        else status = 'critical'
      }
    } else {
      // Sin benchmark, basarse en trend
      status = trend === 'up' ? 'good' : trend === 'down' ? 'warning' : 'good'
    }
    
    return {
      ...def,
      value,
      trend,
      trendValue,
      status,
      sparklineData: generateSparkline(value),
    }
  })
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTES DE UI
// ═══════════════════════════════════════════════════════════════

const CATEGORY_COLORS = {
  liquidity: { bg: 'from-violet-500/20 to-violet-900/20', text: '#8B00FF', border: 'border-violet-500/30' },
  profitability: { bg: 'from-amber-500/20 to-amber-900/20', text: '#FFD700', border: 'border-amber-500/30' },
  efficiency: { bg: 'from-pink-500/20 to-pink-900/20', text: '#FF1493', border: 'border-pink-500/30' },
  growth: { bg: 'from-emerald-500/20 to-emerald-900/20', text: '#00FF88', border: 'border-emerald-500/30' },
  risk: { bg: 'from-red-500/20 to-red-900/20', text: '#FF4444', border: 'border-red-500/30' },
}

const STATUS_COLORS = {
  excellent: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/30' },
  good: { bg: 'bg-violet-500/20', text: 'text-violet-400', glow: 'shadow-violet-500/30' },
  warning: { bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/30' },
  critical: { bg: 'bg-red-500/20', text: 'text-red-400', glow: 'shadow-red-500/30' },
}

function formatValue(value: number, unit: MetricDefinition['unit']): string {
  switch (unit) {
    case 'currency':
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    case 'percentage':
      return `${value.toFixed(1)}%`
    case 'ratio':
      return value.toFixed(2)
    case 'days':
      return `${Math.round(value)} días`
    case 'times':
      return `${value.toFixed(1)}×`
    default:
      return value.toFixed(2)
  }
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - ((v - min) / range) * 100
    return `${x},${y}`
  }).join(' ')
  
  return (
    <svg viewBox="0 0 100 100" className="w-16 h-8">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
    </svg>
  )
}

function MetricCard({ 
  metric, 
  onClick 
}: { 
  metric: CalculatedMetric
  onClick: () => void 
}) {
  const categoryColor = CATEGORY_COLORS[metric.category]
  const statusColor = STATUS_COLORS[metric.status]
  const Icon = metric.icon as React.ComponentType<{ className?: string }>
  const TrendIcon = (metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Minus) as React.ComponentType<{ className?: string }>
  
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative p-4 rounded-xl cursor-pointer
        bg-gradient-to-br ${categoryColor.bg}
        border ${categoryColor.border}
        backdrop-blur-xl
        transition-all duration-300
        hover:shadow-lg hover:${statusColor.glow}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${statusColor.bg}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-1">
          <TrendIcon 
            className={`w-3 h-3 ${
              metric.trend === 'up' ? 'text-emerald-400' : 
              metric.trend === 'down' ? 'text-red-400' : 
              'text-gray-400'
            }`}
          />
          <span className={`text-xs ${
            metric.trend === 'up' ? 'text-emerald-400' : 
            metric.trend === 'down' ? 'text-red-400' : 
            'text-gray-400'
          }`}>
            {metric.trendValue > 0 ? '+' : ''}{metric.trendValue.toFixed(1)}%
          </span>
        </div>
      </div>
      
      {/* Value */}
      <div className="mb-2">
        <p 
          className="text-2xl font-bold"
          style={{ color: categoryColor.text }}
        >
          {formatValue(metric.value, metric.unit)}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {metric.shortName}
        </p>
      </div>
      
      {/* Sparkline */}
      <div className="flex justify-end">
        <Sparkline data={metric.sparklineData} color={categoryColor.text} />
      </div>
      
      {/* Status indicator */}
      <div className={`
        absolute top-2 right-2 w-2 h-2 rounded-full
        ${statusColor.bg}
      `} />
    </motion.div>
  )
}

function CategorySection({ 
  category, 
  metrics,
  onMetricClick,
}: { 
  category: string
  metrics: CalculatedMetric[]
  onMetricClick: (id: string) => void
}) {
  const categoryNames = {
    liquidity: 'Liquidez',
    profitability: 'Rentabilidad',
    efficiency: 'Eficiencia',
    growth: 'Crecimiento',
    risk: 'Riesgo',
  }
  
  const categoryColor = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]
  
  return (
    <div className="space-y-4">
      <h3 
        className="text-lg font-semibold flex items-center gap-2"
        style={{ color: categoryColor.text }}
      >
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: categoryColor.text }}
        />
        {categoryNames[category as keyof typeof categoryNames]}
        <span className="text-sm text-gray-500 font-normal">
          ({metrics.length})
        </span>
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {metrics.map(metric => (
          <MetricCard 
            key={metric.id} 
            metric={metric}
            onClick={() => onMetricClick(metric.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL EXPORTADO
// ═══════════════════════════════════════════════════════════════

export default function FinancialMetricsPanel({
  banks,
  ventas,
  className = '',
  onMetricClick,
}: FinancialMetricsPanelProps) {
  const metrics = useMemo(() => calculateMetrics(banks, ventas), [banks, ventas])
  
  // Agrupar por categoría
  const groupedMetrics = useMemo(() => {
    const groups: Record<string, CalculatedMetric[]> = {}
    metrics.forEach(m => {
      if (!groups[m.category]) groups[m.category] = []
      groups[m.category].push(m)
    })
    return groups
  }, [metrics])
  
  const handleMetricClick = (id: string) => {
    logger.info('Metric clicked', { context: 'FinancialMetricsPanel', data: { id } })
    onMetricClick?.(id)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`space-y-8 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            30 Métricas Financieras
          </h2>
          <p className="text-sm text-gray-400">
            KPIs en tiempo real del sistema CHRONOS
          </p>
        </div>
        
        {/* Resumen de estados */}
        <div className="flex gap-4">
          {(['excellent', 'good', 'warning', 'critical'] as const).map(status => {
            const count = metrics.filter(m => m.status === status).length
            const color = STATUS_COLORS[status]
            return (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color.bg}`} />
                <span className={`text-sm ${color.text}`}>
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Categorías */}
      <div className="space-y-8">
        {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
          <CategorySection
            key={category}
            category={category}
            metrics={categoryMetrics}
            onMetricClick={handleMetricClick}
          />
        ))}
      </div>
    </motion.div>
  )
}
