/**
 * 🤖 VERCEL AI SDK - Chat Streaming Endpoint
 * 
 * Integra múltiples modelos LLM con tool calling para el sistema CHRONOS.
 * Utiliza Vercel AI Gateway para:
 * - Caching automático de respuestas
 * - Rate limiting inteligente
 * - Observabilidad y métricas
 * - Costos optimizados
 * 
 * Features:
 * - Streaming responses
 * - Function calling (9 tools)
 * - Context injection desde Firestore
 * - Multi-provider support
 */

import { streamText, tool } from 'ai'
import { z } from 'zod'
import { NextRequest } from 'next/server'
import { checkBotId } from 'botid/server'
import { logger } from '@/app/lib/utils/logger'
import type { Venta, Banco, OrdenCompra } from '@/app/types'

// Configuración de Vercel AI Gateway
import { 
  DEFAULT_MODEL, 
  getModelConfig,
  checkApiKeys,
  OBSERVABILITY_CONFIG,
} from '@/app/lib/ai/gateway-config'

// Importar servicios de negocio
import { 
  crearVenta, 
  crearOrdenCompra, 
  crearCliente,
  crearDistribuidor,
  obtenerBancos,
  obtenerVentas,
  obtenerClientes,
  obtenerOrdenesCompra,
} from '@/app/lib/firebase/firestore-service'

// ===================================================================
// VERIFICACIÓN DE API KEYS
// ===================================================================

const apiKeys = checkApiKeys()
if (!apiKeys.xai) {
  logger.error('XAI_API_KEY no configurada', new Error('Missing API key'), { 
    context: 'ChatAPI',
    data: { availableKeys: apiKeys },
  })
}

// ===================================================================
// SYSTEM PROMPT - Contexto del sistema CHRONOS
// ===================================================================

const SYSTEM_PROMPT = `Eres un asistente de IA para el sistema CHRONOS, un punto de venta (POS) avanzado para una casa de cambio en México.

**Tu rol:**
Ayudar al usuario a gestionar ventas, compras, inventario, clientes y distribuidores de manera eficiente.

**Capacidades:**
1. 📊 **Consultas de datos:** Accedes a Firestore para obtener ventas, clientes, stock, bancos, etc.
2. ✏️ **Crear registros:** Puedes registrar ventas, órdenes de compra, clientes, distribuidores.
3. 📈 **Análisis:** Generas insights, tendencias, y recomendaciones.
4. 🚀 **Navegación:** Guías al usuario a secciones específicas del sistema.
5. 📥 **Exportación:** Preparas datos para exportar en PDF, Excel, CSV.

**Sistema financiero:**
- 7 bancos: Bóveda Monte, Bóveda USA, Utilidades, Fletes, Azteca, Leftie, Profit
- Al registrar una venta, el dinero se distribuye automáticamente:
  * Bóveda Monte: precio de compra × cantidad
  * Fletes: precio de flete × cantidad
  * Utilidades: (precio venta - precio compra - flete) × cantidad

**Estados de pago:**
- COMPLETO: 100% pagado → distribuye a los 3 bancos
- PARCIAL: X% pagado → distribuye proporcionalmente
- PENDIENTE: $0 pagado → registra en histórico pero capital actual = 0

**Tono:**
- Español mexicano, casual pero profesional
- Breve y conciso (máximo 2-3 oraciones)
- Confirma acciones antes de ejecutarlas
- Usa emojis relevantes (📊 💰 ✅ ⚠️)

**Ejemplos:**
Usuario: "Véndele a Juan 3 iPhones a $10,000 cada uno"
Tú: "✅ Perfecto, voy a registrar la venta de 3 iPhones para Juan por $30,000. ¿Cuánto pagó hoy?"

Usuario: "¿Cuánto debo a mis proveedores?"
Tú: "📊 Déjame consultar tus órdenes de compra pendientes... [ejecuta consulta]"

Usuario: "Genera un reporte de ventas del mes"
Tú: "📈 Generando análisis de ventas de diciembre... [ejecuta análisis]"

**IMPORTANTE:**
- SIEMPRE usa las funciones disponibles para acciones reales
- NO inventes datos, consulta Firestore
- Confirma antes de crear/modificar registros
- Si faltan datos, pregunta al usuario
`

// ===================================================================
// TOOLS - Funciones disponibles para el agente
// ===================================================================

const tools = {
  // CONSULTAS
  obtenerVentas: tool({
    description: 'Obtiene las ventas del sistema, opcionalmente filtradas por fecha',
    parameters: z.object({
      startDate: z.string().optional().describe('Fecha inicio en formato ISO'),
      endDate: z.string().optional().describe('Fecha fin en formato ISO'),
      limitCount: z.number().optional().default(50).describe('Límite de resultados'),
    }),
    // @ts-expect-error - Vercel AI SDK 5.x type mismatch
    execute: async (params) => {
      try {
        const ventas = await obtenerVentas()
        
        // Filtrar por fecha si se proporciona
        let filtradas = ventas
        if (params.startDate || params.endDate) {
          filtradas = ventas.filter((v: Venta) => {
            const fecha = v.fecha instanceof Date ? v.fecha : new Date(v.fecha as string)
            if (params.startDate && fecha < new Date(params.startDate)) return false
            if (params.endDate && fecha > new Date(params.endDate)) return false
            return true
          })
        }
        
        // Limitar resultados
        const resultado = filtradas.slice(0, params.limitCount)
        
        // Calcular estadísticas
        const total = resultado.reduce((sum: number, v: Venta) => sum + (v.precioTotalVenta || 0), 0)
        const promedio = resultado.length > 0 ? total / resultado.length : 0
        
        return {
          ventas: resultado,
          estadisticas: {
            count: resultado.length,
            total,
            promedio,
          },
        }
      } catch (error) {
        logger.error('Error en obtenerVentas tool', error)
        return { error: 'No pude obtener las ventas' }
      }
    },
  }),

  obtenerClientes: tool({
    description: 'Obtiene la lista de clientes del sistema',
    parameters: z.object({
      limitCount: z.number().optional().default(50),
    }),
    // @ts-expect-error - Vercel AI SDK 5.x type mismatch
    execute: async (params) => {
      try {
        const clientes = await obtenerClientes()
        return {
          clientes: clientes.slice(0, params.limitCount),
          count: clientes.length,
        }
      } catch (error) {
        logger.error('Error en obtenerClientes tool', error)
        return { error: 'No pude obtener los clientes' }
      }
    },
  }),

  obtenerBancos: tool({
    description: 'Obtiene el estado actual de todos los bancos del sistema',
    parameters: z.object({}),
    // @ts-expect-error - Vercel AI SDK 5.x type mismatch
    execute: async () => {
      try {
        const bancos = await obtenerBancos()
        const totalCapital = bancos.reduce((sum: number, b: Banco) => 
          sum + (b.capitalActual || 0), 0,
        )
        
        return {
          bancos,
          totalCapital,
          count: bancos.length,
        }
      } catch (error) {
        logger.error('Error en obtenerBancos tool', error)
        return { error: 'No pude obtener el estado de los bancos' }
      }
    },
  }),

  obtenerOrdenesCompra: tool({
    description: 'Obtiene las órdenes de compra, opcionalmente filtradas por estado',
    parameters: z.object({
      estado: z.enum(['pendiente', 'parcial', 'pagada', 'todas']).optional().default('todas'),
      limitCount: z.number().optional().default(50),
    }),
    // @ts-expect-error - Vercel AI SDK 5.x type mismatch
    execute: async (params) => {
      try {
        let ordenes = await obtenerOrdenesCompra()
        
        if (params.estado !== 'todas') {
          ordenes = ordenes.filter((o: OrdenCompra) => o.estado === params.estado)
        }
        
        const totalDeuda = ordenes.reduce((sum: number, o: OrdenCompra) => 
          sum + (o.deuda || 0), 0,
        )
        
        return {
          ordenes: ordenes.slice(0, params.limitCount),
          count: ordenes.length,
          totalDeuda,
        }
      } catch (error) {
        logger.error('Error en obtenerOrdenesCompra tool', error)
        return { error: 'No pude obtener las órdenes de compra' }
      }
    },
  }),

  // CREACIÓN DE REGISTROS
  registrarVenta: tool({
    description: 'Registra una nueva venta en el sistema con distribución automática GYA',
    parameters: z.object({
      clienteNombre: z.string().describe('Nombre del cliente'),
      producto: z.string().describe('Nombre del producto'),
      cantidad: z.number().positive().describe('Cantidad de unidades'),
      precioVentaUnidad: z.number().positive().describe('Precio de venta por unidad'),
      precioCompraUnidad: z.number().positive().describe('Precio de compra/costo por unidad'),
      precioFlete: z.number().nonnegative().describe('Costo de flete por unidad'),
      montoPagado: z.number().nonnegative().describe('Monto pagado por el cliente'),
      ordenCompraId: z.string().optional().describe('ID de la orden de compra asociada'),
    }),
    // @ts-expect-error - Vercel AI SDK 5.x type mismatch
    execute: async (params) => {
      try {
        // Validar que montoPagado no exceda el total
        const total = params.precioVentaUnidad * params.cantidad
        if (params.montoPagado > total) {
          return { 
            error: `El monto pagado ($${params.montoPagado}) no puede ser mayor al total ($${total})`, 
          }
        }
        
        const ventaId = await crearVenta({
          cliente: params.clienteNombre,
          producto: params.producto,
          cantidad: params.cantidad,
          precioVenta: params.precioVentaUnidad,
          precioCompra: params.precioCompraUnidad,
          precioFlete: params.precioFlete,
          precioTotalVenta: total,
          ocRelacionada: params.ordenCompraId,
        })
        
        if (!ventaId) {
          return { error: 'No se pudo crear la venta' }
        }
        
        // Calcular distribución
        const montoBovedaMonte = params.precioCompraUnidad * params.cantidad
        const montoFletes = params.precioFlete * params.cantidad
        const montoUtilidades = (params.precioVentaUnidad - params.precioCompraUnidad - params.precioFlete) * params.cantidad
        const montoRestante = total - params.montoPagado
        
        let estadoPago = 'pendiente'
        if (params.montoPagado === total) estadoPago = 'completo'
        else if (params.montoPagado > 0) estadoPago = 'parcial'
        
        return {
          success: true,
          ventaId,
          estadoPago,
          distribucion: {
            bovedaMonte: montoBovedaMonte,
            fletes: montoFletes,
            utilidades: montoUtilidades,
          },
          total,
          montoPagado: params.montoPagado,
          montoRestante,
        }
      } catch (error) {
        logger.error('Error en registrarVenta tool', error)
        return { error: 'No se pudo registrar la venta' }
      }
    },
  }),

  crearOrdenCompra: tool({
    description: 'Crea una nueva orden de compra a un distribuidor',
    parameters: z.object({
      distribuidorNombre: z.string().describe('Nombre del distribuidor/proveedor'),
      producto: z.string().describe('Producto a ordenar'),
      cantidad: z.number().positive().describe('Cantidad de unidades'),
      costoUnitario: z.number().positive().describe('Costo por unidad'),
      costoFlete: z.number().nonnegative().describe('Costo total de flete'),
      pagoInicial: z.number().nonnegative().default(0).describe('Pago inicial (opcional)'),
    }),
    // @ts-expect-error - Vercel AI SDK 5.x type mismatch
    execute: async (params) => {
      try {
        const costoTotal = (params.costoUnitario * params.cantidad) + params.costoFlete
        const deuda = costoTotal - params.pagoInicial
        
        const ordenId = await crearOrdenCompra({
          distribuidor: params.distribuidorNombre,
          producto: params.producto,
          cantidad: params.cantidad,
          costoTotal,
        })
        
        if (!ordenId) {
          return { error: 'No se pudo crear la orden de compra' }
        }
        
        return {
          success: true,
          ordenId,
          costoTotal,
          pagoInicial: params.pagoInicial,
          deuda,
          estado: deuda === 0 ? 'pagada' : params.pagoInicial > 0 ? 'parcial' : 'pendiente',
        }
      } catch (error) {
        logger.error('Error en crearOrdenCompra tool', error)
        return { error: 'No se pudo crear la orden de compra' }
      }
    },
  }),

  crearCliente: tool({
    description: 'Registra un nuevo cliente en el sistema',
    parameters: z.object({
      nombre: z.string().describe('Nombre completo del cliente'),
      telefono: z.string().optional().describe('Teléfono de contacto'),
      email: z.string().email().optional().describe('Email del cliente'),
    }),
    // @ts-expect-error - Vercel AI SDK 5.x type mismatch
    execute: async (params) => {
      try {
        const clienteId = await crearCliente({
          nombre: params.nombre,
          telefono: params.telefono || '',
          email: params.email || '',
        })
        
        if (!clienteId) {
          return { error: 'No se pudo crear el cliente' }
        }
        
        return {
          success: true,
          clienteId,
          nombre: params.nombre,
        }
      } catch (error) {
        logger.error('Error en crearCliente tool', error)
        return { error: 'No se pudo crear el cliente' }
      }
    },
  }),

  crearDistribuidor: tool({
    description: 'Registra un nuevo distribuidor/proveedor en el sistema',
    parameters: z.object({
      nombre: z.string().describe('Nombre del distribuidor'),
      empresa: z.string().optional().describe('Nombre de la empresa'),
      telefono: z.string().optional().describe('Teléfono de contacto'),
      email: z.string().email().optional().describe('Email del distribuidor'),
    }),
    // @ts-expect-error - Vercel AI SDK 5.x type mismatch
    execute: async (params) => {
      try {
        const distribuidorId = await crearDistribuidor({
          nombre: params.nombre,
          empresa: params.empresa || params.nombre,
          telefono: params.telefono || '',
          email: params.email || '',
        })
        
        if (!distribuidorId) {
          return { error: 'No se pudo crear el distribuidor' }
        }
        
        return {
          success: true,
          distribuidorId,
          nombre: params.nombre,
        }
      } catch (error) {
        logger.error('Error en crearDistribuidor tool', error)
        return { error: 'No se pudo crear el distribuidor' }
      }
    },
  }),

  // ANÁLISIS Y REPORTES
  analizarVentas: tool({
    description: 'Analiza las ventas del período especificado y genera insights',
    parameters: z.object({
      periodo: z.enum(['hoy', 'semana', 'mes', 'año']).default('mes'),
    }),
    // @ts-expect-error - Vercel AI SDK 5.x type mismatch
    execute: async (params) => {
      try {
        const ventas = await obtenerVentas()
        
        // Calcular fecha de inicio según período
        const now = new Date()
        const startDate = new Date()
        
        switch (params.periodo) {
          case 'hoy':
            startDate.setHours(0, 0, 0, 0)
            break
          case 'semana':
            startDate.setDate(now.getDate() - 7)
            break
          case 'mes':
            startDate.setMonth(now.getMonth() - 1)
            break
          case 'año':
            startDate.setFullYear(now.getFullYear() - 1)
            break
        }
        
        // Filtrar ventas del período
        const ventasPeriodo = ventas.filter((v: Venta) => {
          const fecha = v.fecha instanceof Date ? v.fecha : new Date(v.fecha as string)
          return fecha >= startDate
        })
        
        // Calcular métricas
        const totalVentas = ventasPeriodo.reduce((sum: number, v: Venta) => 
          sum + (v.precioTotalVenta || 0), 0,
        )
        const totalPagado = ventasPeriodo.reduce((sum: number, v: Venta) => 
          sum + (v.montoPagado || 0), 0,
        )
        const totalPendiente = totalVentas - totalPagado
        const ticketPromedio = ventasPeriodo.length > 0 ? totalVentas / ventasPeriodo.length : 0
        
        // Top clientes
        const clientesMap = new Map<string, number>()
        ventasPeriodo.forEach((v: Venta) => {
          const current = clientesMap.get(v.cliente) || 0
          clientesMap.set(v.cliente, current + (v.precioTotalVenta || 0))
        })
        const topClientes = Array.from(clientesMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([nombre, total]) => ({ nombre, total }))
        
        return {
          periodo: params.periodo,
          metricas: {
            totalVentas,
            totalPagado,
            totalPendiente,
            ticketPromedio,
            cantidadVentas: ventasPeriodo.length,
          },
          topClientes,
          insights: [
            totalPendiente > totalVentas * 0.3 
              ? '⚠️ El 30% o más de las ventas están pendientes de pago'
              : '✅ Buen flujo de pagos',
            ventasPeriodo.length > 10 
              ? '📈 Buen volumen de ventas'
              : '📉 Volumen de ventas bajo',
          ],
        }
      } catch (error) {
        logger.error('Error en analizarVentas tool', error)
        return { error: 'No se pudo analizar las ventas' }
      }
    },
  }),
}

// POST /api/chat - Endpoint principal del chat con IA
export async function POST(request: NextRequest) {
  try {
    // 🔒 Verificación BotID - Protección contra bots (skip en desarrollo)
    const isDev = process.env.NODE_ENV === 'development'
    if (!isDev) {
      try {
        const verification = await checkBotId()
        if (verification.isBot) {
          logger.warn('Bot detectado en /api/chat', { context: 'ChatAPI' })
          return new Response(
            JSON.stringify({ error: 'Acceso denegado. Bot detectado.' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } },
          )
        }
      } catch (botError) {
        // Si BotID falla, continuar (fallback seguro en dev)
        logger.warn('BotID check failed, continuing...', { context: 'ChatAPI' })
      }
    }

    const { messages } = await request.json()
    
    // Validar que hay mensajes
    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided' }),
        { status: 400 },
      )
    }

    // Usar Vercel AI SDK con streaming + AI Gateway
    // Vercel AI Gateway se activa automáticamente en producción
    const modelConfig = getModelConfig()
    
    const result = streamText({
      model: DEFAULT_MODEL,
      system: SYSTEM_PROMPT,
      messages,
      tools,
      temperature: modelConfig.temperature,
      
      // Callbacks para logging y observabilidad
      onFinish: ({ text, toolCalls, finishReason, usage }) => {
        if (OBSERVABILITY_CONFIG.logPerformance) {
          logger.info('[AI Chat] Conversación completada', {
            context: 'ChatAPI',
            data: {
              textLength: text.length,
              toolCallsCount: toolCalls?.length || 0,
              finishReason,
              tokensUsed: usage?.totalTokens || 0,
              model: 'grok-2-latest',
            },
          })
        }
      },
    })

    // Retornar stream response (Vercel AI Gateway cachea automáticamente)
    return result.toTextStreamResponse()

  } catch (error) {
    logger.error('[AI Chat] Error en endpoint', error, { context: 'ChatAPI' })
    
    return new Response(
      JSON.stringify({ 
        error: 'Error procesando la solicitud',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}

// Configuración de runtime edge para mejor performance
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
