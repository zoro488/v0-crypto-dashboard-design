'use client'

/**
 * 📊 ANALYTICS AVANZADOS - Tesla 2025 Design System
 * 
 * Componente unificado y optimizado con:
 * - KPIs con predicción (regresión lineal)
 * - Top 10 clientes
 * - Análisis de cartera de deuda
 * - Motor de insights automáticos
 * - Diseño Tesla 2025 puro
 */

import { useMemo, useState, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Line, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  DollarSign, Package, Users, Target, Lightbulb, Brain,
  Zap, ArrowRight, ChevronRight, Sparkles, XCircle,
  type LucideIcon,
} from 'lucide-react'
import { CardTesla, StatCard, DESIGN_TOKENS, formatCurrency } from '@/app/components/ui/tesla-index'
import { logger } from '@/app/lib/utils/logger'

// ============================================================================
// TIPOS
// ============================================================================
interface AnalyticsData {
  ventas: VentaData[]
  clientes: ClienteData[]
  ordenes: OrdenData[]
}

interface VentaData {
  fecha: string
  ingreso?: number
  utilidad?: number
  cantidad?: number
  cliente?: string
  estatus?: string
  bovedaMonte?: number
  flete?: number
}

interface ClienteData {
  cliente?: string
  deuda?: number
  abonos?: number
  pendiente?: number
}

interface OrdenData {
  deuda?: number
  cantidad?: number
  costoDistribuidor?: number
}

interface Insight {
  id: string
  tipo: 'oportunidad' | 'riesgo' | 'alerta' | 'recomendacion' | 'tendencia'
  prioridad: 'alta' | 'media' | 'baja'
  titulo: string
  descripcion: string
  impacto: string
  acciones: string[]
  metricas?: {
    valorActual: number
    valorEsperado: number
    diferencia: number
  }
}

// ============================================================================
// CONSTANTES TESLA
// ============================================================================
const CHART_COLORS = ['#E31911', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#06B6D4']
const { colors, radii, shadows } = DESIGN_TOKENS

// ============================================================================
// COMPONENTES AUXILIARES OPTIMIZADOS
// ============================================================================

// Tooltip Tesla para gráficos
const TeslaTooltip = memo(({ active, payload, label }: { 
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string 
}) => {
  if (!active || !payload?.length) return null
  
  return (
    <div 
      className="backdrop-blur-xl border shadow-xl"
      style={{
        backgroundColor: 'rgba(28, 28, 30, 0.95)',
        borderColor: colors.border,
        borderRadius: radii.md,
        padding: '12px 16px',
      }}
    >
      <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs" style={{ color: colors.textSecondary }}>{entry.name}:</span>
          <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
})
TeslaTooltip.displayName = 'TeslaTooltip'

// Badge de prioridad
const PriorityBadge = memo(({ priority }: { priority: 'alta' | 'media' | 'baja' }) => {
  const config = {
    alta: { bg: 'rgba(227, 25, 17, 0.2)', text: '#FF453A' },
    media: { bg: 'rgba(245, 158, 11, 0.2)', text: '#F59E0B' },
    baja: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3B82F6' },
  }
  const { bg, text } = config[priority]
  
  return (
    <span 
      className="px-2 py-1 text-xs font-bold rounded-full uppercase"
      style={{ backgroundColor: bg, color: text }}
    >
      {priority}
    </span>
  )
})
PriorityBadge.displayName = 'PriorityBadge'

// Icono por tipo de insight
const getInsightIcon = (tipo: string): LucideIcon => {
  const icons: Record<string, LucideIcon> = {
    oportunidad: Target,
    riesgo: AlertTriangle,
    alerta: XCircle,
    recomendacion: Lightbulb,
    tendencia: TrendingUp,
  }
  return icons[tipo] || Brain
}

// Color por tipo de insight
const getInsightColors = (tipo: string): { bg: string; border: string; icon: string } => {
  const configs: Record<string, { bg: string; border: string; icon: string }> = {
    oportunidad: { 
      bg: 'rgba(16, 185, 129, 0.1)', 
      border: 'rgba(16, 185, 129, 0.3)', 
      icon: '#10B981', 
    },
    riesgo: { 
      bg: 'rgba(227, 25, 17, 0.1)', 
      border: 'rgba(227, 25, 17, 0.3)', 
      icon: '#E31911', 
    },
    alerta: { 
      bg: 'rgba(245, 158, 11, 0.1)', 
      border: 'rgba(245, 158, 11, 0.3)', 
      icon: '#F59E0B', 
    },
    recomendacion: { 
      bg: 'rgba(59, 130, 246, 0.1)', 
      border: 'rgba(59, 130, 246, 0.3)', 
      icon: '#3B82F6', 
    },
    tendencia: { 
      bg: 'rgba(139, 92, 246, 0.1)', 
      border: 'rgba(139, 92, 246, 0.3)', 
      icon: '#8B5CF6', 
    },
  }
  return configs[tipo] || configs.recomendacion
}

// ============================================================================
// HOOKS DE ANÁLISIS
// ============================================================================

function useVentasAnalysis(ventas: VentaData[]) {
  return useMemo(() => {
    if (!ventas.length) return null

    // Agrupar por mes
    const ventasPorMes = ventas.reduce((acc, venta) => {
      const fecha = new Date(venta.fecha)
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      
      if (!acc[mes]) {
        acc[mes] = { mes, totalIngresos: 0, totalUtilidades: 0, cantidadVentas: 0 }
      }
      
      acc[mes].totalIngresos += venta.ingreso || 0
      acc[mes].totalUtilidades += venta.utilidad || 0
      acc[mes].cantidadVentas += 1
      
      return acc
    }, {} as Record<string, { mes: string; totalIngresos: number; totalUtilidades: number; cantidadVentas: number }>)

    const ventasArray = Object.values(ventasPorMes).map((mes) => ({
      ...mes,
      promedioTicket: mes.totalIngresos / mes.cantidadVentas,
    }))

    // Top 10 clientes
    const clientesVolumen = ventas.reduce((acc, venta) => {
      const cliente = venta.cliente || 'Sin cliente'
      if (!acc[cliente]) {
        acc[cliente] = { nombre: cliente, ingresos: 0, transacciones: 0 }
      }
      acc[cliente].ingresos += venta.ingreso || 0
      acc[cliente].transacciones += 1
      return acc
    }, {} as Record<string, { nombre: string; ingresos: number; transacciones: number }>)

    const top10Clientes = Object.values(clientesVolumen)
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 10)

    // Estado de pago
    const estadoPago = ventas.reduce((acc, venta) => {
      const estado = venta.estatus || 'Sin estado'
      if (!acc[estado]) acc[estado] = { name: estado, value: 0 }
      acc[estado].value += 1
      return acc
    }, {} as Record<string, { name: string; value: number }>)

    // KPIs
    const totalIngresos = ventas.reduce((sum, v) => sum + (v.ingreso || 0), 0)
    const totalUtilidades = ventas.reduce((sum, v) => sum + (v.utilidad || 0), 0)
    const totalUnidades = ventas.reduce((sum, v) => sum + (v.cantidad || 0), 0)
    const margenPromedio = totalIngresos > 0 ? (totalUtilidades / totalIngresos) * 100 : 0
    const ticketPromedio = totalIngresos / ventas.length
    
    const ventasPagadas = ventas.filter(v => v.estatus === 'Pagado')
    const tasaCobranza = ventas.length > 0 ? (ventasPagadas.length / ventas.length) * 100 : 0

    return {
      ventasPorMes: ventasArray,
      top10Clientes,
      estadoPago: Object.values(estadoPago),
      kpis: {
        totalIngresos,
        totalUtilidades,
        totalUnidades,
        margenPromedio,
        ticketPromedio,
        tasaCobranza,
      },
    }
  }, [ventas])
}

function usePrediccion(ventasPorMes: Array<{ totalIngresos: number }> | undefined) {
  return useMemo(() => {
    if (!ventasPorMes || ventasPorMes.length < 2) return null

    const n = ventasPorMes.length
    
    // Regresión lineal simple
    const sumX = ventasPorMes.reduce((sum, _, i) => sum + i, 0)
    const sumY = ventasPorMes.reduce((sum, d) => sum + d.totalIngresos, 0)
    const sumXY = ventasPorMes.reduce((sum, d, i) => sum + (i * d.totalIngresos), 0)
    const sumX2 = ventasPorMes.reduce((sum, _, i) => sum + (i * i), 0)
    
    const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercepto = (sumY - pendiente * sumX) / n
    
    // Proyectar 3 meses
    const proximosMeses = Array.from({ length: 3 }, (_, i) => ({
      mes: `Mes +${i + 1}`,
      proyeccion: Math.max(0, pendiente * (n + i) + intercepto),
    }))

    return {
      proximosMeses,
      crecimientoMensual: pendiente,
      tendencia: pendiente > 0 ? 'positive' as const : 'negative' as const,
    }
  }, [ventasPorMes])
}

function useClientesAnalysis(clientes: ClienteData[]) {
  return useMemo(() => {
    if (!clientes.length) return null

    const totalDeuda = clientes.reduce((sum, c) => sum + (c.deuda || 0), 0)
    const totalAbonos = clientes.reduce((sum, c) => sum + (c.abonos || 0), 0)
    const clientesConDeuda = clientes.filter(c => (c.deuda || 0) > 0)

    // Segmentación por nivel de deuda
    const segmentacion = clientes.map(c => {
      const deuda = c.deuda || 0
      let categoria = 'Sin deuda'
      let color: string = colors.success
      
      if (deuda > 500000) {
        categoria = 'Deuda Alta'
        color = colors.error
      } else if (deuda > 200000) {
        categoria = 'Deuda Media'
        color = colors.warning
      } else if (deuda > 0) {
        categoria = 'Deuda Baja'
        color = colors.info
      }

      return {
        cliente: c.cliente || 'Sin nombre',
        deuda,
        abonos: c.abonos || 0,
        categoria,
        color,
      }
    }).sort((a, b) => b.deuda - a.deuda).slice(0, 10)

    return {
      totalDeuda,
      totalAbonos,
      clientesConDeuda: clientesConDeuda.length,
      segmentacion,
      tasaRecuperacion: totalDeuda > 0 ? (totalAbonos / (totalDeuda + totalAbonos)) * 100 : 0,
    }
  }, [clientes])
}

function useInsightsEngine(data: AnalyticsData) {
  return useMemo(() => {
    const { ventas, clientes, ordenes } = data
    const insights: Insight[] = []

    logger.info('Generando insights automáticos', { 
      context: 'AdvancedAnalyticsTesla',
      data: { ventas: ventas.length, clientes: clientes.length }, 
    })

    // Análisis de tendencia de ventas
    if (ventas.length >= 6) {
      const ultimos = ventas.slice(-3).reduce((s, v) => s + (v.ingreso || 0), 0)
      const anteriores = ventas.slice(-6, -3).reduce((s, v) => s + (v.ingreso || 0), 0)
      const crecimiento = anteriores > 0 ? ((ultimos - anteriores) / anteriores) * 100 : 0

      if (Math.abs(crecimiento) > 10) {
        insights.push({
          id: 'trend',
          tipo: crecimiento > 0 ? 'tendencia' : 'riesgo',
          prioridad: 'alta',
          titulo: crecimiento > 0 ? 'Crecimiento Acelerado' : 'Alerta: Caída de Ventas',
          descripcion: `Las ventas ${crecimiento > 0 ? 'aumentaron' : 'cayeron'} ${Math.abs(crecimiento).toFixed(1)}%`,
          impacto: `Proyección anual afectada en ${((Math.abs(crecimiento) / 100) * ultimos * 4).toFixed(0)} MXN`,
          acciones: crecimiento > 0 
            ? ['Aumentar inventario', 'Expandir distribución']
            : ['Revisar precios', 'Campañas promocionales'],
          metricas: { valorActual: ultimos, valorEsperado: anteriores, diferencia: crecimiento },
        })
      }
    }

    // Análisis de cobranza
    const ventasPendientes = ventas.filter(v => v.estatus === 'Pendiente')
    const tasaPendiente = ventas.length > 0 ? (ventasPendientes.length / ventas.length) * 100 : 0

    if (tasaPendiente > 40) {
      const montoPendiente = ventasPendientes.reduce((s, v) => s + (v.ingreso || 0), 0)
      insights.push({
        id: 'cobranza',
        tipo: 'alerta',
        prioridad: 'alta',
        titulo: 'Tasa de Cobranza Crítica',
        descripcion: `${tasaPendiente.toFixed(0)}% de ventas pendientes (${formatCurrency(montoPendiente)})`,
        impacto: 'Riesgo de flujo de caja',
        acciones: ['Recordatorios automáticos', 'Incentivos pronto pago', 'Revisar políticas de crédito'],
      })
    }

    // Clientes de alto riesgo
    const clientesRiesgo = clientes.filter(c => (c.deuda || 0) > 500000)
    if (clientesRiesgo.length > 0) {
      const deudaTotal = clientesRiesgo.reduce((s, c) => s + (c.deuda || 0), 0)
      insights.push({
        id: 'clientes-riesgo',
        tipo: 'alerta',
        prioridad: 'alta',
        titulo: `${clientesRiesgo.length} Clientes en Riesgo Alto`,
        descripcion: `Exposición total: ${formatCurrency(deudaTotal)}`,
        impacto: 'Alto riesgo de cartera incobrable',
        acciones: ['Planes de pago estructurados', 'Suspender crédito adicional', 'Reuniones directas'],
      })
    }

    // Deuda con proveedores
    const deudaOrdenes = ordenes.filter(o => (o.deuda || 0) > 0).reduce((s, o) => s + (o.deuda || 0), 0)
    if (deudaOrdenes > 1000000) {
      insights.push({
        id: 'deuda-proveedores',
        tipo: 'riesgo',
        prioridad: 'alta',
        titulo: 'Deuda con Proveedores Elevada',
        descripcion: `Pendiente: ${formatCurrency(deudaOrdenes)}`,
        impacto: 'Riesgo de corte de suministro',
        acciones: ['Priorizar pagos críticos', 'Negociar plazos', 'Optimizar inventario'],
      })
    }

    // Oportunidad de clientes con sobrepago
    const clientesSobrepago = clientes.filter(c => (c.deuda || 0) < 0)
    if (clientesSobrepago.length > 0) {
      const saldoFavor = Math.abs(clientesSobrepago.reduce((s, c) => s + (c.deuda || 0), 0))
      insights.push({
        id: 'sobrepago',
        tipo: 'oportunidad',
        prioridad: 'media',
        titulo: 'Saldos a Favor Detectados',
        descripcion: `${clientesSobrepago.length} clientes con ${formatCurrency(saldoFavor)} a favor`,
        impacto: 'Oportunidad de ventas adicionales',
        acciones: ['Ofrecer productos', 'Aplicar descuentos', 'Regularizar contabilidad'],
      })
    }

    return insights
  }, [data])
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
interface AdvancedAnalyticsTeslaProps {
  ventas?: Array<Record<string, unknown>>
  clientes?: Array<Record<string, unknown>>
  ordenes?: Array<Record<string, unknown>>
  className?: string
}

export function AdvancedAnalyticsTesla({
  ventas = [],
  clientes = [],
  ordenes = [],
  className = '',
}: AdvancedAnalyticsTeslaProps) {
  const [activeTab, setActiveTab] = useState<'kpis' | 'insights' | 'cartera'>('kpis')
  
  // Cast a tipos específicos internos (compatible con DocumentData de Firebase)
  const ventasTyped = ventas as unknown as VentaData[]
  const clientesTyped = clientes as unknown as ClienteData[]
  const ordenesTyped = ordenes as unknown as OrdenData[]
  
  const ventasAnalysis = useVentasAnalysis(ventasTyped)
  const prediccion = usePrediccion(ventasAnalysis?.ventasPorMes)
  const clientesAnalysis = useClientesAnalysis(clientesTyped)
  const insights = useInsightsEngine({ ventas: ventasTyped, clientes: clientesTyped, ordenes: ordenesTyped })

  const tabs = [
    { id: 'kpis', label: 'KPIs & Predicción', icon: TrendingUp },
    { id: 'insights', label: 'Insights IA', icon: Brain, count: insights.length },
    { id: 'cartera', label: 'Cartera', icon: Users },
  ] as const

  if (!ventasAnalysis) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <p style={{ color: colors.textSecondary }}>No hay datos suficientes para análisis</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab Navigation Tesla Style */}
      <div 
        className="flex items-center gap-2 p-1 rounded-xl"
        style={{ backgroundColor: colors.surface }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium text-sm"
              style={{
                backgroundColor: isActive ? colors.surfaceElevated : 'transparent',
                color: isActive ? colors.textPrimary : colors.textSecondary,
              }}
            >
              <Icon size={16} />
              {tab.label}
              {'count' in tab && tab.count > 0 && (
                <span 
                  className="px-1.5 py-0.5 text-xs rounded-full"
                  style={{ 
                    backgroundColor: colors.accent, 
                    color: colors.textPrimary, 
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* TAB: KPIs & Predicción */}
        {activeTab === 'kpis' && (
          <motion.div
            key="kpis"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Ingresos Totales"
                value={`$${(ventasAnalysis.kpis.totalIngresos / 1000000).toFixed(2)}M`}
                subtitle={`${ventasAnalysis.kpis.margenPromedio.toFixed(1)}% margen`}
                trend={ventasAnalysis.kpis.margenPromedio > 15 
                  ? { value: ventasAnalysis.kpis.margenPromedio, direction: 'up' }
                  : { value: ventasAnalysis.kpis.margenPromedio, direction: 'down' }
                }
                icon={<DollarSign size={20} />}
              />
              <StatCard
                title="Unidades Vendidas"
                value={ventasAnalysis.kpis.totalUnidades.toLocaleString()}
                subtitle={`${ventas.length} transacciones`}
                icon={<Package size={20} />}
              />
              <StatCard
                title="Tasa de Cobranza"
                value={`${ventasAnalysis.kpis.tasaCobranza.toFixed(0)}%`}
                subtitle={ventasAnalysis.kpis.tasaCobranza > 50 ? 'Saludable' : 'Atención'}
                trend={ventasAnalysis.kpis.tasaCobranza > 50
                  ? { value: ventasAnalysis.kpis.tasaCobranza, direction: 'up' }
                  : { value: ventasAnalysis.kpis.tasaCobranza, direction: 'down' }
                }
                icon={<CheckCircle size={20} />}
              />
              <StatCard
                title="Ticket Promedio"
                value={`$${(ventasAnalysis.kpis.ticketPromedio / 1000).toFixed(0)}k`}
                subtitle="por transacción"
                icon={<Users size={20} />}
              />
            </div>

            {/* Gráfica de Tendencia */}
            <CardTesla>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                  Tendencia de Ventas
                </h3>
                {prediccion && (
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: prediccion.tendencia === 'positive' 
                        ? 'rgba(16, 185, 129, 0.2)' 
                        : 'rgba(227, 25, 17, 0.2)',
                      color: prediccion.tendencia === 'positive' ? colors.success : colors.error,
                    }}
                  >
                    {prediccion.tendencia === 'positive' ? '↑ Crecimiento' : '↓ Decrecimiento'}
                  </span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={ventasAnalysis.ventasPorMes}>
                  <defs>
                    <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.accent} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis dataKey="mes" stroke={colors.textSecondary} fontSize={12} />
                  <YAxis stroke={colors.textSecondary} fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<TeslaTooltip />} />
                  <Area type="monotone" dataKey="totalIngresos" fill="url(#gradIngresos)" stroke={colors.accent} strokeWidth={2} name="Ingresos" />
                  <Line type="monotone" dataKey="totalUtilidades" stroke={colors.success} strokeWidth={2} dot={false} name="Utilidades" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardTesla>

            {/* Predicción + Top Clientes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Predicción */}
              {prediccion && (
                <CardTesla>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={18} style={{ color: colors.accent }} />
                    <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                      Proyección 3 Meses
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {prediccion.proximosMeses.map((mes, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 rounded-xl text-center"
                        style={{ backgroundColor: colors.surface }}
                      >
                        <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>{mes.mes}</p>
                        <p className="text-xl font-bold" style={{ color: colors.accent }}>
                          ${(mes.proyeccion / 1000).toFixed(0)}k
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </CardTesla>
              )}

              {/* Top 10 Clientes */}
              <CardTesla>
                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
                  Top 10 Clientes
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ventasAnalysis.top10Clientes.slice(0, 5)} layout="vertical">
                    <XAxis type="number" stroke={colors.textSecondary} fontSize={10} />
                    <YAxis type="category" dataKey="nombre" stroke={colors.textSecondary} width={80} fontSize={10} />
                    <Tooltip content={<TeslaTooltip />} />
                    <Bar dataKey="ingresos" radius={[0, 4, 4, 0]} name="Ingresos">
                      {ventasAnalysis.top10Clientes.slice(0, 5).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardTesla>
            </div>
          </motion.div>
        )}

        {/* TAB: Insights IA */}
        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Header de insights */}
            <CardTesla className="relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent}20, transparent)`,
                }}
              />
              <div className="relative flex items-center gap-4">
                <div 
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${colors.accent}20` }}
                >
                  <Brain size={24} style={{ color: colors.accent }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                    Motor de Insights Automático
                  </h2>
                  <p style={{ color: colors.textSecondary }}>
                    {insights.length} insights detectados
                  </p>
                </div>
              </div>
            </CardTesla>

            {/* Lista de Insights */}
            {insights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle size={48} style={{ color: colors.success }} className="mb-4" />
                <p className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                  Todo en orden
                </p>
                <p style={{ color: colors.textSecondary }}>
                  No hay alertas o recomendaciones pendientes
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight, index) => {
                  const Icon = getInsightIcon(insight.tipo)
                  const insightColors = getInsightColors(insight.tipo)
                  
                  return (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <CardTesla 
                        className="border"
                        style={{ 
                          backgroundColor: insightColors.bg,
                          borderColor: insightColors.border,
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                          >
                            <Icon size={20} style={{ color: insightColors.icon }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
                                {insight.titulo}
                              </h3>
                              <PriorityBadge priority={insight.prioridad} />
                            </div>
                            <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                              {insight.descripcion}
                            </p>
                            <p className="text-xs mb-3" style={{ color: colors.textMuted }}>
                              <strong>Impacto:</strong> {insight.impacto}
                            </p>
                            
                            {/* Métricas */}
                            {insight.metricas && (
                              <div 
                                className="grid grid-cols-3 gap-3 mb-3 p-3 rounded-lg"
                                style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                              >
                                <div>
                                  <p className="text-xs" style={{ color: colors.textMuted }}>Actual</p>
                                  <p className="font-semibold" style={{ color: colors.textPrimary }}>
                                    ${(insight.metricas.valorActual / 1000).toFixed(0)}k
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs" style={{ color: colors.textMuted }}>Anterior</p>
                                  <p className="font-semibold" style={{ color: colors.textPrimary }}>
                                    ${(insight.metricas.valorEsperado / 1000).toFixed(0)}k
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs" style={{ color: colors.textMuted }}>Cambio</p>
                                  <p 
                                    className="font-semibold"
                                    style={{ 
                                      color: insight.metricas.diferencia > 0 ? colors.success : colors.error, 
                                    }}
                                  >
                                    {insight.metricas.diferencia > 0 ? '+' : ''}{insight.metricas.diferencia.toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {/* Acciones */}
                            <div>
                              <p className="text-xs font-medium mb-2 flex items-center gap-1" style={{ color: colors.textPrimary }}>
                                <Zap size={12} /> Acciones recomendadas:
                              </p>
                              <ul className="space-y-1">
                                {insight.acciones.map((accion, i) => (
                                  <li key={i} className="flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
                                    <ArrowRight size={12} style={{ color: insightColors.icon }} />
                                    {accion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </CardTesla>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB: Cartera */}
        {activeTab === 'cartera' && clientesAnalysis && (
          <motion.div
            key="cartera"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* KPIs de Cartera */}
            <div className="grid grid-cols-3 gap-4">
              <CardTesla className="text-center">
                <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>Deuda Total</p>
                <p className="text-2xl font-bold" style={{ color: colors.error }}>
                  ${(clientesAnalysis.totalDeuda / 1000000).toFixed(2)}M
                </p>
              </CardTesla>
              <CardTesla className="text-center">
                <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>Abonos</p>
                <p className="text-2xl font-bold" style={{ color: colors.success }}>
                  ${(clientesAnalysis.totalAbonos / 1000000).toFixed(2)}M
                </p>
              </CardTesla>
              <CardTesla className="text-center">
                <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>Recuperación</p>
                <p className="text-2xl font-bold" style={{ color: colors.info }}>
                  {clientesAnalysis.tasaRecuperacion.toFixed(1)}%
                </p>
              </CardTesla>
            </div>

            {/* Gráfica de Cartera */}
            <CardTesla>
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
                Top Clientes por Deuda
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={clientesAnalysis.segmentacion}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis dataKey="cliente" stroke={colors.textSecondary} fontSize={10} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke={colors.textSecondary} fontSize={10} />
                  <Tooltip content={<TeslaTooltip />} />
                  <Bar dataKey="deuda" name="Deuda" radius={[4, 4, 0, 0]}>
                    {clientesAnalysis.segmentacion.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                  <Bar dataKey="abonos" fill={colors.success} name="Abonos" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardTesla>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdvancedAnalyticsTesla
