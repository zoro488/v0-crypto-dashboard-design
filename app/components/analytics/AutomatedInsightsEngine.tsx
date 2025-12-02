'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb,
  Target, Zap, CheckCircle, XCircle, ArrowRight, Sparkles,
} from 'lucide-react'
import { PremiumCard } from '@/app/components/ui/PremiumCard'
import { logger } from '@/app/lib/utils/logger'

interface Insight {
  id: string
  tipo: 'oportunidad' | 'riesgo' | 'recomendacion' | 'alerta' | 'tendencia'
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

interface AutomatedInsightsProps {
  ventas: any[]
  clientes: any[]
  ordenes: any[]
  bancos: any[]
  className?: string
}

export function AutomatedInsightsEngine({
  ventas = [],
  clientes = [],
  ordenes = [],
  bancos = [],
  className = '',
}: AutomatedInsightsProps) {
  const [filtroActivo, setFiltroActivo] = useState<string>('todos')

  // MOTOR DE ANÁLISIS AUTOMÁTICO
  const insights = useMemo(() => {
    const insightsGenerados: Insight[] = []

    logger.info('Iniciando análisis automático de insights', {
      context: 'AutomatedInsightsEngine',
      data: { ventas: ventas.length, clientes: clientes.length, ordenes: ordenes.length },
    })

    // 1. ANÁLISIS DE VENTAS
    if (ventas.length >= 3) {
      // Detectar tendencia de ventas
      const ultimasMeses = ventas.slice(-3)
      const penultimasMeses = ventas.slice(-6, -3)
      
      const ingresoUltimos = ultimasMeses.reduce((sum, v) => sum + (v.ingreso || 0), 0)
      const ingresoPenultimos = penultimasMeses.reduce((sum, v) => sum + (v.ingreso || 0), 0)
      
      const crecimiento = ingresoPenultimos > 0 
        ? ((ingresoUltimos - ingresoPenultimos) / ingresoPenultimos) * 100 
        : 0

      if (crecimiento > 10) {
        insightsGenerados.push({
          id: 'venta-crecimiento',
          tipo: 'tendencia',
          prioridad: 'alta',
          titulo: 'Crecimiento Acelerado Detectado',
          descripcion: `Las ventas han aumentado ${crecimiento.toFixed(1)}% en los últimos meses`,
          impacto: `Proyección de ${((ingresoUltimos / ultimasMeses.length) * 12).toFixed(0)} ingresos anuales`,
          acciones: [
            'Aumentar inventario para demanda creciente',
            'Expandir capacidad de distribución',
            'Considerar nuevos distribuidores',
          ],
          metricas: {
            valorActual: ingresoUltimos,
            valorEsperado: ingresoPenultimos,
            diferencia: crecimiento,
          },
        })
      } else if (crecimiento < -10) {
        insightsGenerados.push({
          id: 'venta-decrecimiento',
          tipo: 'riesgo',
          prioridad: 'alta',
          titulo: 'Alerta: Disminución de Ventas',
          descripcion: `Las ventas han caído ${Math.abs(crecimiento).toFixed(1)}% en el último periodo`,
          impacto: 'Reducción significativa en ingresos proyectados',
          acciones: [
            'Revisar estrategia de precios',
            'Analizar competencia y mercado',
            'Implementar campañas promocionales',
            'Contactar clientes inactivos',
          ],
          metricas: {
            valorActual: ingresoUltimos,
            valorEsperado: ingresoPenultimos,
            diferencia: crecimiento,
          },
        })
      }

      // Análisis de ventas pendientes
      const ventasPendientes = ventas.filter(v => v.estatus === 'Pendiente')
      const montoPendiente = ventasPendientes.reduce((sum, v) => sum + (v.ingreso || 0), 0)
      const tasaPendiente = (ventasPendientes.length / ventas.length) * 100

      if (tasaPendiente > 40) {
        insightsGenerados.push({
          id: 'cobranza-baja',
          tipo: 'alerta',
          prioridad: 'alta',
          titulo: 'Tasa de Cobranza Crítica',
          descripcion: `${tasaPendiente.toFixed(1)}% de ventas están pendientes de pago (${montoPendiente.toFixed(0)} MXN)`,
          impacto: 'Riesgo de flujo de caja insuficiente',
          acciones: [
            'Implementar sistema de recordatorios automáticos',
            'Ofrecer incentivos por pronto pago',
            'Revisar políticas de crédito',
            'Priorizar cobranza a clientes con mayor deuda',
          ],
        })
      }

      // Detectar top cliente con mayor volumen
      const clientesPorVolumen = ventas.reduce((acc, v) => {
        const cliente = v.cliente || 'Desconocido'
        if (!acc[cliente]) acc[cliente] = { ingresos: 0, cantidad: 0 }
        acc[cliente].ingresos += v.ingreso || 0
        acc[cliente].cantidad += v.cantidad || 0
        return acc
      }, {} as Record<string, any>)

      const topCliente = Object.entries(clientesPorVolumen)
        .sort(([, a], [, b]) => (b as any).ingresos - (a as any).ingresos)[0]

      if (topCliente) {
        const [nombre, datos] = topCliente as [string, any]
        const porcentajeTotal = (datos.ingresos / ventas.reduce((sum, v) => sum + (v.ingreso || 0), 0)) * 100

        if (porcentajeTotal > 30) {
          insightsGenerados.push({
            id: 'concentracion-cliente',
            tipo: 'riesgo',
            prioridad: 'media',
            titulo: 'Alta Concentración de Ingresos',
            descripcion: `${porcentajeTotal.toFixed(1)}% de ingresos provienen de un solo cliente: ${nombre}`,
            impacto: 'Vulnerabilidad ante pérdida de cliente principal',
            acciones: [
              'Diversificar cartera de clientes',
              'Fortalecer relación con cliente principal',
              'Buscar nuevos clientes de gran volumen',
            ],
          })
        }
      }
    }

    // 2. ANÁLISIS DE CLIENTES CON DEUDA
    if (clientes.length > 0) {
      const clientesConDeuda = clientes.filter(c => (c.deuda || 0) > 0)
      const deudaTotal = clientesConDeuda.reduce((sum, c) => sum + (c.deuda || 0), 0)
      const clientesRiesgoAlto = clientesConDeuda.filter(c => (c.deuda || 0) > 500000)

      if (clientesRiesgoAlto.length > 0) {
        insightsGenerados.push({
          id: 'clientes-riesgo-alto',
          tipo: 'alerta',
          prioridad: 'alta',
          titulo: 'Clientes en Riesgo Alto Detectados',
          descripcion: `${clientesRiesgoAlto.length} clientes con deuda mayor a $500,000`,
          impacto: `Exposición total: $${(deudaTotal / 1000000).toFixed(2)}M`,
          acciones: [
            'Establecer planes de pago estructurados',
            'Suspender crédito adicional hasta regularización',
            'Reuniones directas con clientes en riesgo',
            'Evaluar garantías y respaldos',
          ],
        })
      }

      // Detectar clientes con saldo negativo (sobrepago)
      const clientesSobrepago = clientes.filter(c => (c.deuda || 0) < 0)
      if (clientesSobrepago.length > 0) {
        const montoSobrepago = Math.abs(clientesSobrepago.reduce((sum, c) => sum + (c.deuda || 0), 0))
        insightsGenerados.push({
          id: 'sobrepagos-detectados',
          tipo: 'oportunidad',
          prioridad: 'media',
          titulo: 'Saldos a Favor Detectados',
          descripcion: `${clientesSobrepago.length} clientes con saldo positivo ($${(montoSobrepago / 1000).toFixed(1)}k)`,
          impacto: 'Oportunidad para ventas adicionales sin crédito',
          acciones: [
            'Ofrecer productos adicionales usando saldo',
            'Aplicar descuentos en próximas compras',
            'Regularizar contabilidad de pagos',
          ],
        })
      }
    }

    // 3. ANÁLISIS DE ÓRDENES DE COMPRA
    if (ordenes.length > 0) {
      const ordenesConDeuda = ordenes.filter(o => (o.deuda || 0) > 0)
      const deudaOrdenes = ordenesConDeuda.reduce((sum, o) => sum + (o.deuda || 0), 0)

      if (deudaOrdenes > 1000000) {
        insightsGenerados.push({
          id: 'deuda-proveedores',
          tipo: 'alerta',
          prioridad: 'alta',
          titulo: 'Deuda con Proveedores Elevada',
          descripcion: `Deuda pendiente con proveedores: $${(deudaOrdenes / 1000000).toFixed(2)}M`,
          impacto: 'Riesgo de corte de suministro',
          acciones: [
            'Priorizar pago a proveedores críticos',
            'Negociar plazos extendidos',
            'Liquidar órdenes con mayor antigüedad',
            'Evaluar rotación de inventario',
          ],
        })
      }

      // Detectar órdenes con sobrepago
      const ordenesSobrepago = ordenes.filter(o => (o.deuda || 0) < 0)
      if (ordenesSobrepago.length > 0) {
        insightsGenerados.push({
          id: 'sobrepago-proveedores',
          tipo: 'recomendacion',
          prioridad: 'baja',
          titulo: 'Pagos Anticipados a Proveedores',
          descripcion: `${ordenesSobrepago.length} órdenes con pago anticipado`,
          impacto: 'Capital inmovilizado con proveedores',
          acciones: [
            'Solicitar devolución de excedentes',
            'Aplicar a próximas compras',
            'Negociar mejores precios por anticipos',
          ],
        })
      }
    }

    // 4. ANÁLISIS DE BANCOS (Si está disponible)
    if (bancos.length > 0) {
      const bancosConSaldoBajo = bancos.filter(b => (b.capitalActual || 0) < 100000)
      
      if (bancosConSaldoBajo.length > 0) {
        insightsGenerados.push({
          id: 'liquidez-baja',
          tipo: 'riesgo',
          prioridad: 'alta',
          titulo: 'Liquidez Baja en Algunas Bóvedas',
          descripcion: `${bancosConSaldoBajo.length} bóvedas con menos de $100k`,
          impacto: 'Capacidad operativa limitada',
          acciones: [
            'Redistribuir capital entre bóvedas',
            'Acelerar cobranza de pendientes',
            'Posponer gastos no críticos',
            'Evaluar líneas de crédito',
          ],
        })
      }
    }

    // 5. RECOMENDACIONES GENERALES
    if (ventas.length > 10 && clientes.length > 5) {
      const margenPromedio = ventas.reduce((sum, v) => {
        const margen = v.ingreso > 0 ? (v.utilidad / v.ingreso) : 0
        return sum + margen
      }, 0) / ventas.length

      if (margenPromedio < 0.20) {
        insightsGenerados.push({
          id: 'margen-bajo',
          tipo: 'recomendacion',
          prioridad: 'media',
          titulo: 'Margen de Utilidad por Debajo del Óptimo',
          descripcion: `Margen promedio: ${(margenPromedio * 100).toFixed(1)}% (objetivo: >20%)`,
          impacto: 'Rentabilidad reducida del negocio',
          acciones: [
            'Revisar estructura de costos',
            'Negociar mejores precios con distribuidores',
            'Optimizar costos de flete',
            'Ajustar precios de venta',
          ],
        })
      }
    }

    logger.info(`Análisis completado: ${insightsGenerados.length} insights generados`, {
      context: 'AutomatedInsightsEngine',
      data: { total: insightsGenerados.length },
    })

    return insightsGenerados
  }, [ventas, clientes, ordenes, bancos])

  const insightsFiltrados = useMemo(() => {
    if (filtroActivo === 'todos') return insights
    return insights.filter(i => i.tipo === filtroActivo)
  }, [insights, filtroActivo])

  const estadisticas = useMemo(() => ({
    oportunidades: insights.filter(i => i.tipo === 'oportunidad').length,
    riesgos: insights.filter(i => i.tipo === 'riesgo').length,
    alertas: insights.filter(i => i.tipo === 'alerta').length,
    recomendaciones: insights.filter(i => i.tipo === 'recomendacion').length,
    tendencias: insights.filter(i => i.tipo === 'tendencia').length,
  }), [insights])

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'oportunidad': return <Target className="w-5 h-5" />
      case 'riesgo': return <AlertTriangle className="w-5 h-5" />
      case 'alerta': return <XCircle className="w-5 h-5" />
      case 'recomendacion': return <Lightbulb className="w-5 h-5" />
      case 'tendencia': return <TrendingUp className="w-5 h-5" />
      default: return <Brain className="w-5 h-5" />
    }
  }

  const getColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'oportunidad': return 'from-green-500/20 to-emerald-500/10 border-green-500/50 text-green-400'
      case 'riesgo': return 'from-red-500/20 to-rose-500/10 border-red-500/50 text-red-400'
      case 'alerta': return 'from-amber-500/20 to-orange-500/10 border-amber-500/50 text-amber-400'
      case 'recomendacion': return 'from-blue-500/20 to-cyan-500/10 border-blue-500/50 text-blue-400'
      case 'tendencia': return 'from-purple-500/20 to-violet-500/10 border-purple-500/50 text-purple-400'
      default: return 'from-gray-500/20 to-slate-500/10 border-gray-500/50 text-gray-400'
    }
  }

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return <span className="px-2 py-1 text-xs font-bold bg-red-500/30 text-red-300 rounded-full">Alta</span>
      case 'media': return <span className="px-2 py-1 text-xs font-bold bg-amber-500/30 text-amber-300 rounded-full">Media</span>
      case 'baja': return <span className="px-2 py-1 text-xs font-bold bg-blue-500/30 text-blue-300 rounded-full">Baja</span>
      default: return null
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con Estadísticas */}
      <PremiumCard variant="neon" className="relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          style={{ backgroundSize: '200% 200%' }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
              <Brain className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Motor de Insights Automático</h2>
              <p className="text-white/60">Análisis inteligente en tiempo real</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFiltroActivo('todos')}
              className={`p-4 rounded-xl backdrop-blur-xl border transition-all ${
                filtroActivo === 'todos'
                  ? 'bg-cyan-500/30 border-cyan-500'
                  : 'bg-white/5 border-white/20 hover:border-cyan-500/50'
              }`}
            >
              <Sparkles className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{insights.length}</p>
              <p className="text-xs text-white/60">Total</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFiltroActivo('oportunidad')}
              className={`p-4 rounded-xl backdrop-blur-xl border transition-all ${
                filtroActivo === 'oportunidad'
                  ? 'bg-green-500/30 border-green-500'
                  : 'bg-white/5 border-white/20 hover:border-green-500/50'
              }`}
            >
              <Target className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{estadisticas.oportunidades}</p>
              <p className="text-xs text-white/60">Oportunidades</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFiltroActivo('riesgo')}
              className={`p-4 rounded-xl backdrop-blur-xl border transition-all ${
                filtroActivo === 'riesgo'
                  ? 'bg-red-500/30 border-red-500'
                  : 'bg-white/5 border-white/20 hover:border-red-500/50'
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{estadisticas.riesgos}</p>
              <p className="text-xs text-white/60">Riesgos</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFiltroActivo('alerta')}
              className={`p-4 rounded-xl backdrop-blur-xl border transition-all ${
                filtroActivo === 'alerta'
                  ? 'bg-amber-500/30 border-amber-500'
                  : 'bg-white/5 border-white/20 hover:border-amber-500/50'
              }`}
            >
              <XCircle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{estadisticas.alertas}</p>
              <p className="text-xs text-white/60">Alertas</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFiltroActivo('recomendacion')}
              className={`p-4 rounded-xl backdrop-blur-xl border transition-all ${
                filtroActivo === 'recomendacion'
                  ? 'bg-blue-500/30 border-blue-500'
                  : 'bg-white/5 border-white/20 hover:border-blue-500/50'
              }`}
            >
              <Lightbulb className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{estadisticas.recomendaciones}</p>
              <p className="text-xs text-white/60">Recomendaciones</p>
            </motion.button>
          </div>
        </div>
      </PremiumCard>

      {/* Lista de Insights */}
      <AnimatePresence mode="wait">
        {insightsFiltrados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-12 text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-xl font-semibold text-white">No hay insights en esta categoría</p>
            <p className="text-white/60 mt-2">El sistema está funcionando óptimamente</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-4">
            {insightsFiltrados.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br border ${getColorTipo(insight.tipo)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-black/30">
                      {getIconoTipo(insight.tipo)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{insight.titulo}</h3>
                        {getPrioridadBadge(insight.prioridad)}
                      </div>
                      <p className="text-white/80">{insight.descripcion}</p>
                      <p className="text-sm text-white/60 mt-2">
                        <strong>Impacto:</strong> {insight.impacto}
                      </p>
                    </div>
                  </div>
                </div>

                {insight.metricas && (
                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 rounded-xl bg-black/20">
                    <div>
                      <p className="text-xs text-white/60 mb-1">Valor Actual</p>
                      <p className="text-lg font-bold text-white">
                        ${(insight.metricas.valorActual / 1000).toFixed(0)}k
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60 mb-1">Valor Esperado</p>
                      <p className="text-lg font-bold text-white">
                        ${(insight.metricas.valorEsperado / 1000).toFixed(0)}k
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60 mb-1">Diferencia</p>
                      <p className={`text-lg font-bold ${insight.metricas.diferencia > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {insight.metricas.diferencia > 0 ? '+' : ''}{insight.metricas.diferencia.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Acciones Recomendadas:
                  </p>
                  <ul className="space-y-2">
                    {insight.acciones.map((accion, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        className="flex items-center gap-2 text-sm text-white/80"
                      >
                        <ArrowRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        {accion}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
