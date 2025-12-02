'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie,
  ComposedChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Treemap,
} from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Package, Users } from 'lucide-react'
import { PremiumCard } from '@/app/components/ui/PremiumCard'

interface AdvancedAnalyticsProps {
  ventas: any[]
  clientes: any[]
  ordenes: any[]
  className?: string
}

export function AdvancedAnalyticsDashboard({
  ventas = [],
  clientes = [],
  ordenes = [],
  className = '',
}: AdvancedAnalyticsProps) {
  
  // ANÁLISIS AUTOMÁTICO DE VENTAS
  const ventasAnalysis = useMemo(() => {
    if (!ventas.length) return null

    // Agrupar ventas por mes
    const ventasPorMes = ventas.reduce((acc, venta) => {
      const fecha = new Date(venta.fecha)
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      
      if (!acc[mes]) {
        acc[mes] = {
          mes,
          totalVentas: 0,
          totalIngresos: 0,
          totalUtilidades: 0,
          cantidadVentas: 0,
          promedioTicket: 0,
        }
      }
      
      acc[mes].totalVentas += venta.cantidad || 0
      acc[mes].totalIngresos += venta.ingreso || 0
      acc[mes].totalUtilidades += venta.utilidad || 0
      acc[mes].cantidadVentas += 1
      
      return acc
    }, {} as Record<string, any>)

    const ventasArray = Object.values(ventasPorMes).map((mes: any) => ({
      ...mes,
      promedioTicket: mes.totalIngresos / mes.cantidadVentas,
    }))

    // Top 10 clientes por volumen
    const clientesVolumen = ventas.reduce((acc, venta) => {
      const cliente = venta.cliente || 'Sin cliente'
      if (!acc[cliente]) {
        acc[cliente] = {
          nombre: cliente,
          cantidad: 0,
          ingresos: 0,
          utilidades: 0,
          transacciones: 0,
        }
      }
      
      acc[cliente].cantidad += venta.cantidad || 0
      acc[cliente].ingresos += venta.ingreso || 0
      acc[cliente].utilidades += venta.utilidad || 0
      acc[cliente].transacciones += 1
      
      return acc
    }, {} as Record<string, any>)

    const top10Clientes = Object.values(clientesVolumen)
      .sort((a: any, b: any) => b.ingresos - a.ingresos)
      .slice(0, 10)

    // Análisis por estado de pago
    const estadoPago = ventas.reduce((acc, venta) => {
      const estado = venta.estatus || 'Sin estado'
      if (!acc[estado]) {
        acc[estado] = {
          name: estado,
          value: 0,
          ingresos: 0,
          cantidad: 0,
        }
      }
      
      acc[estado].value += 1
      acc[estado].ingresos += venta.ingreso || 0
      acc[estado].cantidad += venta.cantidad || 0
      
      return acc
    }, {} as Record<string, any>)

    // Análisis de rentabilidad por OC
    const rentabilidadOC = ventas.reduce((acc, venta) => {
      const oc = venta.ocRelacionada || 'Sin OC'
      if (!acc[oc]) {
        acc[oc] = {
          oc,
          ventas: 0,
          ingresos: 0,
          utilidades: 0,
          margen: 0,
        }
      }
      
      acc[oc].ventas += venta.cantidad || 0
      acc[oc].ingresos += venta.ingreso || 0
      acc[oc].utilidades += venta.utilidad || 0
      
      return acc
    }, {} as Record<string, any>)

    Object.values(rentabilidadOC).forEach((oc: any) => {
      oc.margen = oc.ingresos > 0 ? (oc.utilidades / oc.ingresos) * 100 : 0
    })

    // KPIs principales
    const totalIngresos = ventas.reduce((sum, v) => sum + (v.ingreso || 0), 0)
    const totalUtilidades = ventas.reduce((sum, v) => sum + (v.utilidad || 0), 0)
    const totalUnidades = ventas.reduce((sum, v) => sum + (v.cantidad || 0), 0)
    const margenPromedio = totalIngresos > 0 ? (totalUtilidades / totalIngresos) * 100 : 0
    const ticketPromedio = totalIngresos / ventas.length
    
    const ventasPagadas = ventas.filter(v => v.estatus === 'Pagado')
    const ventasPendientes = ventas.filter(v => v.estatus === 'Pendiente')
    const tasaCobranza = ventas.length > 0 ? (ventasPagadas.length / ventas.length) * 100 : 0

    return {
      ventasPorMes: ventasArray,
      top10Clientes,
      estadoPago: Object.values(estadoPago),
      rentabilidadOC: Object.values(rentabilidadOC).slice(0, 9),
      kpis: {
        totalIngresos,
        totalUtilidades,
        totalUnidades,
        margenPromedio,
        ticketPromedio,
        tasaCobranza,
        ventasPagadas: ventasPagadas.length,
        ventasPendientes: ventasPendientes.length,
      },
    }
  }, [ventas])

  // PREDICCIÓN SIMPLE (Regresión lineal)
  const prediccion = useMemo(() => {
    if (!ventasAnalysis?.ventasPorMes || ventasAnalysis.ventasPorMes.length < 2) return null

    const datos = ventasAnalysis.ventasPorMes
    const n = datos.length
    
    // Calcular tendencia lineal
    const sumX = datos.reduce((sum: number, _: unknown, i: number) => sum + i, 0)
    const sumY = datos.reduce((sum: number, d: any) => sum + d.totalIngresos, 0)
    const sumXY = datos.reduce((sum: number, d: any, i: number) => sum + (i * d.totalIngresos), 0)
    const sumX2 = datos.reduce((sum: number, _: unknown, i: number) => sum + (i * i), 0)
    
    const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercepto = (sumY - pendiente * sumX) / n
    
    // Proyectar 3 meses
    const proximosMeses = []
    for (let i = 0; i < 3; i++) {
      const index = n + i
      const valorProyectado = pendiente * index + intercepto
      proximosMeses.push({
        mes: `Mes +${i + 1}`,
        proyeccion: Math.max(0, valorProyectado),
        tendencia: pendiente > 0 ? 'Creciente' : 'Decreciente',
      })
    }

    return {
      proximosMeses,
      crecimientoMensual: pendiente,
      tendencia: pendiente > 0 ? 'positive' : 'negative',
    }
  }, [ventasAnalysis])

  // ANÁLISIS DE CLIENTES
  const clientesAnalysis = useMemo(() => {
    if (!clientes.length) return null

    const totalDeuda = clientes.reduce((sum, c) => sum + (c.deuda || 0), 0)
    const totalAbonos = clientes.reduce((sum, c) => sum + (c.abonos || 0), 0)
    const clientesConDeuda = clientes.filter(c => (c.deuda || 0) > 0)
    const clientesAlDia = clientes.filter(c => (c.deuda || 0) === 0 || (c.pendiente || 0) <= 0)

    // Segmentación de clientes por deuda
    const segmentacion = clientes.map(c => {
      const deuda = c.deuda || 0
      let categoria = 'Sin deuda'
      let color = '#10b981'
      
      if (deuda > 500000) {
        categoria = 'Deuda Alta'
        color = '#ef4444'
      } else if (deuda > 200000) {
        categoria = 'Deuda Media'
        color = '#f59e0b'
      } else if (deuda > 0) {
        categoria = 'Deuda Baja'
        color = '#3b82f6'
      }

      return {
        cliente: c.cliente,
        deuda,
        abonos: c.abonos || 0,
        pendiente: c.pendiente || 0,
        categoria,
        color,
        riesgo: deuda > 500000 ? 'Alto' : deuda > 200000 ? 'Medio' : 'Bajo',
      }
    }).sort((a, b) => b.deuda - a.deuda)

    return {
      totalDeuda,
      totalAbonos,
      clientesConDeuda: clientesConDeuda.length,
      clientesAlDia: clientesAlDia.length,
      segmentacion: segmentacion.slice(0, 15),
      tasaRecuperacion: totalDeuda > 0 ? (totalAbonos / (totalDeuda + totalAbonos)) * 100 : 0,
    }
  }, [clientes])

  const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

  if (!ventasAnalysis) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <p className="text-white/60">No hay datos suficientes para análisis</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PremiumCard variant="neon" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm mb-1">Ingresos Totales</p>
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold text-white"
              >
                ${(ventasAnalysis.kpis.totalIngresos / 1000000).toFixed(2)}M
              </motion.p>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-semibold">
                  {ventasAnalysis.kpis.margenPromedio.toFixed(1)}% margen
                </span>
              </div>
            </div>
            <DollarSign className="w-12 h-12 text-cyan-400" />
          </div>
        </PremiumCard>

        <PremiumCard variant="glass" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm mb-1">Unidades Vendidas</p>
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold text-white"
              >
                {ventasAnalysis.kpis.totalUnidades.toLocaleString()}
              </motion.p>
              <div className="flex items-center gap-2 mt-2">
                <Package className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white/60">
                  {ventas.length} transacciones
                </span>
              </div>
            </div>
            <Package className="w-12 h-12 text-purple-400" />
          </div>
        </PremiumCard>

        <PremiumCard variant="gradient" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm mb-1">Tasa de Cobranza</p>
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold text-white"
              >
                {ventasAnalysis.kpis.tasaCobranza.toFixed(1)}%
              </motion.p>
              <div className="flex items-center gap-2 mt-2">
                {ventasAnalysis.kpis.tasaCobranza > 50 ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400 font-semibold">Saludable</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-400 font-semibold">Atención</span>
                  </>
                )}
              </div>
            </div>
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
        </PremiumCard>

        <PremiumCard variant="solid" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm mb-1">Ticket Promedio</p>
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold text-white"
              >
                ${(ventasAnalysis.kpis.ticketPromedio / 1000).toFixed(1)}k
              </motion.p>
              <div className="flex items-center gap-2 mt-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white/60">
                  por transacción
                </span>
              </div>
            </div>
            <DollarSign className="w-12 h-12 text-blue-400" />
          </div>
        </PremiumCard>
      </div>

      {/* Gráfica de Tendencia de Ventas */}
      <PremiumCard title="Tendencia de Ventas Mensuales" icon={TrendingUp} variant="glass">
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={ventasAnalysis.ventasPorMes}>
            <defs>
              <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="mes" stroke="#fff" opacity={0.6} />
            <YAxis stroke="#fff" opacity={0.6} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.9)',
                border: '1px solid rgba(6,182,212,0.5)',
                borderRadius: '12px',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="totalIngresos"
              stroke="#06b6d4"
              fillOpacity={1}
              fill="url(#colorIngresos)"
              name="Ingresos"
            />
            <Bar dataKey="totalUtilidades" fill="#10b981" name="Utilidades" />
            <Line
              type="monotone"
              dataKey="promedioTicket"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Ticket Promedio"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </PremiumCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Clientes */}
        <PremiumCard title="Top 10 Clientes" subtitle="Por volumen de ingresos" variant="neon">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={ventasAnalysis.top10Clientes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="#fff" opacity={0.6} />
              <YAxis type="category" dataKey="nombre" stroke="#fff" opacity={0.6} width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(6,182,212,0.5)',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="ingresos" fill="#06b6d4" radius={[0, 8, 8, 0]}>
                {ventasAnalysis.top10Clientes.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </PremiumCard>

        {/* Estado de Pagos */}
        <PremiumCard title="Distribución de Pagos" subtitle="Por estado" variant="gradient">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={ventasAnalysis.estadoPago}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {ventasAnalysis.estadoPago.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(6,182,212,0.5)',
                  borderRadius: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </PremiumCard>
      </div>

      {/* Predicción */}
      {prediccion && (
        <PremiumCard
          title="Proyección de Ventas"
          subtitle="Próximos 3 meses (Regresión Lineal)"
          variant="neon"
          badge={prediccion.tendencia === 'positive' ? 'Crecimiento' : 'Decrecimiento'}
          badgeColor={prediccion.tendencia === 'positive' ? '#10b981' : '#ef4444'}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prediccion.proximosMeses.map((mes: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20"
              >
                <p className="text-white/60 text-sm mb-1">{mes.mes}</p>
                <p className="text-2xl font-bold text-cyan-400">
                  ${(mes.proyeccion / 1000).toFixed(0)}k
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {prediccion.tendencia === 'positive' ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-xs text-white/60">{mes.tendencia}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </PremiumCard>
      )}

      {/* Análisis de Clientes con Deuda */}
      {clientesAnalysis && (
        <PremiumCard
          title="Análisis de Cartera"
          subtitle="Gestión de crédito y cobranza"
          variant="glass"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50">
              <p className="text-white/60 text-sm mb-1">Deuda Total</p>
              <p className="text-2xl font-bold text-white">
                ${(clientesAnalysis.totalDeuda / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/50">
              <p className="text-white/60 text-sm mb-1">Abonos Totales</p>
              <p className="text-2xl font-bold text-white">
                ${(clientesAnalysis.totalAbonos / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="p-4 rounded-xl bg-cyan-500/20 border border-cyan-500/50">
              <p className="text-white/60 text-sm mb-1">Tasa Recuperación</p>
              <p className="text-2xl font-bold text-white">
                {clientesAnalysis.tasaRecuperacion.toFixed(1)}%
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={clientesAnalysis.segmentacion}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="cliente" stroke="#fff" opacity={0.6} angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#fff" opacity={0.6} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(6,182,212,0.5)',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="deuda" fill="#ef4444" name="Deuda" radius={[8, 8, 0, 0]} />
              <Bar dataKey="abonos" fill="#10b981" name="Abonos" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </PremiumCard>
      )}
    </div>
  )
}
