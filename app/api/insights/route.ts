/**
 * 📊 API Route: Dashboard AI Insights
 * Análisis inteligente de métricas
 */

import { checkBotId } from 'botid/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/app/lib/utils/logger'

interface DashboardMetrics {
  ventasTotales: number
  gastos: number
  utilidades: number
  tendencia: 'up' | 'down' | 'stable'
}

interface ReportData {
  periodo: string
  ventas: number
  ventasAnterior: number
  gastos: number
  clientes: number
}

interface DashboardInsight {
  titulo: string
  descripcion: string
  tipo: 'alerta' | 'oportunidad' | 'info' | 'exito'
  prioridad: number
  acciones: string[]
}

export async function POST(request: NextRequest) {
  // 🔒 Verificación BotID
  const verification = await checkBotId()
  
  if (verification.isBot) {
    logger.warn('Bot detectado en /api/insights', { context: 'InsightsAPI' })
    return NextResponse.json(
      { error: 'Acceso denegado' },
      { status: 403 },
    )
  }

  try {
    const body = await request.json()
    const { type, metrics, reportData } = body as {
      type: 'analyze' | 'report'
      metrics?: DashboardMetrics
      reportData?: ReportData
    }

    switch (type) {
      case 'analyze': {
        if (!metrics) {
          return NextResponse.json(
            { error: 'Métricas requeridas' },
            { status: 400 },
          )
        }
        
        // Generate insights based on metrics
        const insights: DashboardInsight[] = []
        
        // Analyze profitability
        const margen = ((metrics.utilidades / metrics.ventasTotales) * 100).toFixed(1)
        if (parseFloat(margen) > 20) {
          insights.push({
            titulo: 'Margen Saludable',
            descripcion: `Margen de utilidad del ${margen}% está por encima del objetivo`,
            tipo: 'exito',
            prioridad: 8,
            acciones: ['Mantener estrategia de precios', 'Considerar expansión'],
          })
        } else if (parseFloat(margen) < 10) {
          insights.push({
            titulo: 'Margen Bajo',
            descripcion: `Margen de utilidad del ${margen}% requiere atención`,
            tipo: 'alerta',
            prioridad: 9,
            acciones: ['Revisar costos operativos', 'Evaluar precios de venta'],
          })
        }
        
        // Analyze trend
        if (metrics.tendencia === 'up') {
          insights.push({
            titulo: 'Tendencia Positiva',
            descripcion: 'Las ventas muestran crecimiento sostenido',
            tipo: 'oportunidad',
            prioridad: 7,
            acciones: ['Capitalizar el momentum', 'Aumentar inventario'],
          })
        } else if (metrics.tendencia === 'down') {
          insights.push({
            titulo: 'Tendencia Negativa',
            descripcion: 'Las ventas muestran decrecimiento',
            tipo: 'alerta',
            prioridad: 10,
            acciones: ['Revisar estrategia comercial', 'Analizar competencia'],
          })
        }
        
        return NextResponse.json({ insights })
      }
      
      case 'report': {
        if (!reportData) {
          return NextResponse.json(
            { error: 'Datos de reporte requeridos' },
            { status: 400 },
          )
        }
        
        const crecimiento = ((reportData.ventas - reportData.ventasAnterior) / reportData.ventasAnterior * 100).toFixed(1)
        const utilidadNeta = reportData.ventas - reportData.gastos
        
        const report = `
# Reporte Ejecutivo CHRONOS
## Período: ${reportData.periodo}

### Resumen Financiero
- **Ventas Totales:** $${reportData.ventas.toLocaleString()}
- **Crecimiento:** ${crecimiento}% vs período anterior
- **Gastos Operativos:** $${reportData.gastos.toLocaleString()}
- **Utilidad Neta:** $${utilidadNeta.toLocaleString()}

### Clientes
- **Clientes Activos:** ${reportData.clientes}
- **Ticket Promedio:** $${(reportData.ventas / Math.max(reportData.clientes, 1)).toFixed(0)}

### Recomendaciones
1. ${parseFloat(crecimiento) > 0 ? 'Mantener estrategia actual' : 'Revisar estrategia de ventas'}
2. Optimizar gastos operativos
3. Fortalecer relación con clientes top

---
*Generado automáticamente por CHRONOS AI*
        `.trim()
        
        return NextResponse.json({ report })
      }
      
      default:
        return NextResponse.json(
          { error: 'Tipo de análisis no válido' },
          { status: 400 },
        )
    }
  } catch (error) {
    logger.error('Error en /api/insights', error as Error, { context: 'InsightsAPI' })
    return NextResponse.json(
      { error: 'Error generando insights' },
      { status: 500 },
    )
  }
}
