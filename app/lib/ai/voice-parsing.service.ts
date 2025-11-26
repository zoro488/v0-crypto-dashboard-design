/**
 * 🎤 AI VOICE SERVICE - Vercel AI SDK Real-Time Voice
 * 
 * Servicio de voz conversacional de alta calidad usando:
 * - OpenAI Whisper para transcripción
 * - GPT-4 para parsing inteligente
 * - OpenAI TTS para respuestas de voz (opcional)
 * 
 * Flujo:
 * 1. Usuario habla → Whisper transcribe
 * 2. GPT-4 extrae datos estructurados (JSON)
 * 3. Se llenan los campos del formulario automáticamente
 */

"use server"

import { generateObject, generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

// ============================================
// SCHEMAS DE EXTRACCIÓN
// ============================================

/**
 * Schema para extraer datos de una venta desde voz
 */
const VentaVoiceSchema = z.object({
  intent: z.enum(["venta", "consulta", "otro"]).describe("Intención del usuario"),
  
  cliente: z.object({
    nombre: z.string().optional().describe("Nombre del cliente mencionado"),
    telefono: z.string().optional().describe("Teléfono si lo menciona"),
    esNuevo: z.boolean().default(false).describe("Si menciona que es cliente nuevo"),
  }).optional(),
  
  productos: z.array(z.object({
    nombre: z.string().describe("Nombre o descripción del producto"),
    cantidad: z.number().default(1).describe("Cantidad mencionada, default 1"),
    precioSugerido: z.number().optional().describe("Si menciona un precio específico"),
  })).optional().describe("Lista de productos mencionados"),
  
  pago: z.object({
    metodo: z.enum(["efectivo", "transferencia", "tarjeta", "credito"]).optional(),
    monto: z.number().optional().describe("Monto específico si lo menciona"),
    esCredito: z.boolean().default(false).describe("Si pide fiado o a crédito"),
  }).optional(),
  
  notas: z.string().optional().describe("Cualquier nota adicional mencionada"),
})

/**
 * Schema para extraer datos de una orden de compra
 */
const OrdenCompraVoiceSchema = z.object({
  intent: z.enum(["orden_compra", "consulta", "otro"]),
  
  distribuidor: z.object({
    nombre: z.string().optional(),
    esNuevo: z.boolean().default(false),
  }).optional(),
  
  productos: z.array(z.object({
    nombre: z.string(),
    cantidad: z.number().default(1),
    costoUnitario: z.number().optional(),
  })).optional(),
  
  costos: z.object({
    envio: z.number().optional(),
    total: z.number().optional(),
  }).optional(),
  
  pago: z.object({
    anticipo: z.number().optional(),
    esCredito: z.boolean().default(true),
  }).optional(),
})

/**
 * Schema para extraer datos de un producto nuevo
 */
const ProductoVoiceSchema = z.object({
  intent: z.enum(["nuevo_producto", "editar_producto", "consulta", "otro"]),
  
  producto: z.object({
    nombre: z.string().describe("Nombre del producto"),
    descripcion: z.string().optional(),
    categoria: z.string().optional(),
    sku: z.string().optional(),
  }).optional(),
  
  precios: z.object({
    compra: z.number().optional().describe("Precio de compra/costo"),
    venta: z.number().optional().describe("Precio de venta"),
    margen: z.number().optional().describe("Porcentaje de margen si lo menciona"),
  }).optional(),
  
  stock: z.object({
    inicial: z.number().optional(),
    minimo: z.number().optional(),
  }).optional(),
})

/**
 * Schema genérico para comandos de voz
 */
const ComandoGeneralSchema = z.object({
  tipo: z.enum([
    "nueva_venta",
    "nueva_orden_compra", 
    "nuevo_producto",
    "nuevo_cliente",
    "nuevo_distribuidor",
    "registrar_pago",
    "registrar_gasto",
    "consulta_stock",
    "consulta_deuda",
    "otro"
  ]).describe("Tipo de acción que el usuario quiere realizar"),
  
  confianza: z.number().min(0).max(1).describe("Nivel de confianza en la interpretación"),
  
  resumen: z.string().describe("Resumen breve de lo que el usuario pidió"),
  
  datosExtraidos: z.record(z.unknown()).optional().describe("Datos específicos extraídos"),
})

// ============================================
// FUNCIONES DE PARSING
// ============================================

export type VentaVoiceData = z.infer<typeof VentaVoiceSchema>
export type OrdenCompraVoiceData = z.infer<typeof OrdenCompraVoiceSchema>
export type ProductoVoiceData = z.infer<typeof ProductoVoiceSchema>
export type ComandoGeneral = z.infer<typeof ComandoGeneralSchema>

/**
 * Parsea un comando de voz para una VENTA
 */
export async function parseVentaFromVoice(transcript: string): Promise<{
  success: boolean
  data?: VentaVoiceData
  error?: string
}> {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4-turbo"),
      schema: VentaVoiceSchema,
      prompt: `Eres un asistente de ventas en una tienda/negocio mexicano. 
      
Analiza este comando de voz y extrae los datos para llenar un formulario de venta:

"${transcript}"

CONTEXTO DEL NEGOCIO:
- Es una casa de cambio / tienda que vende productos variados
- Los clientes pueden ser nuevos o existentes
- Se acepta efectivo, transferencia, tarjeta o crédito (fiado)
- Si no mencionan cantidad, asume 1
- Si dicen "fiado", "me lo apuntas", "a crédito" → esCredito = true

EJEMPLOS:
- "Véndele a Juan dos iPhones y un cargador" → cliente: Juan, productos: [{iPhone, 2}, {cargador, 1}]
- "El señor Pérez quiere 3 laptops, paga en efectivo" → cliente: Pérez, productos: [{laptop, 3}], pago: efectivo
- "Cliente nuevo, María García, lleva una bocina, lo pone a crédito" → cliente nuevo: María García, productos: [{bocina, 1}], esCredito: true`,
    })

    return { success: true, data: object }
  } catch (error) {
    console.error("Error parsing venta voice:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error al procesar el comando de voz" 
    }
  }
}

/**
 * Parsea un comando de voz para una ORDEN DE COMPRA
 */
export async function parseOrdenCompraFromVoice(transcript: string): Promise<{
  success: boolean
  data?: OrdenCompraVoiceData
  error?: string
}> {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4-turbo"),
      schema: OrdenCompraVoiceSchema,
      prompt: `Eres un asistente de compras/inventario en un negocio mexicano.

Analiza este comando de voz y extrae los datos para crear una orden de compra a proveedor:

"${transcript}"

CONTEXTO:
- Compramos a distribuidores/proveedores
- Las órdenes pueden ser a crédito o con anticipo
- Si mencionan "pedirle a [nombre]" → es el distribuidor
- Extrae costos si los menciona

EJEMPLOS:
- "Pídele a Distribuidora López 50 cargadores a 100 pesos cada uno" → distribuidor: López, productos: [{cargador, 50, $100}]
- "Orden de compra: 20 laptops del proveedor TechMex, costo total 200 mil" → distribuidor: TechMex, productos: [{laptop, 20}], total: 200000`,
    })

    return { success: true, data: object }
  } catch (error) {
    console.error("Error parsing orden compra voice:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error al procesar" 
    }
  }
}

/**
 * Parsea un comando de voz para un PRODUCTO NUEVO
 */
export async function parseProductoFromVoice(transcript: string): Promise<{
  success: boolean
  data?: ProductoVoiceData
  error?: string
}> {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4-turbo"),
      schema: ProductoVoiceSchema,
      prompt: `Eres un asistente de inventario en un negocio.

Analiza este comando de voz y extrae los datos para crear/editar un producto:

"${transcript}"

CONTEXTO:
- Necesitamos: nombre, precio compra (costo), precio venta, stock inicial
- Si dicen "con 30% de ganancia" → calcular precio venta
- Si dicen "costo X, venta Y" → extraer ambos precios

EJEMPLOS:
- "Nuevo producto iPhone 15, costo 18 mil, lo vendo en 22 mil, tengo 5" → nombre: iPhone 15, compra: 18000, venta: 22000, stock: 5
- "Agrega bocina JBL, me costó 800 pesos, le pongo 30% de margen" → nombre: bocina JBL, compra: 800, margen: 30`,
    })

    return { success: true, data: object }
  } catch (error) {
    console.error("Error parsing producto voice:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error al procesar" 
    }
  }
}

/**
 * Detecta la INTENCIÓN GENERAL de un comando de voz
 * Útil para saber qué modal abrir
 */
export async function detectarIntencion(transcript: string): Promise<{
  success: boolean
  data?: ComandoGeneral
  error?: string
}> {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4-turbo"),
      schema: ComandoGeneralSchema,
      prompt: `Eres un asistente inteligente de un sistema de punto de venta.

Analiza este comando de voz y determina QUÉ QUIERE HACER el usuario:

"${transcript}"

ACCIONES POSIBLES:
- nueva_venta: Quiere vender algo a un cliente
- nueva_orden_compra: Quiere pedir mercancía a un proveedor
- nuevo_producto: Quiere agregar un producto al inventario
- nuevo_cliente: Quiere registrar un cliente nuevo
- nuevo_distribuidor: Quiere registrar un proveedor nuevo
- registrar_pago: Quiere registrar un abono/pago
- registrar_gasto: Quiere registrar un gasto
- consulta_stock: Pregunta por existencias
- consulta_deuda: Pregunta por deudas de clientes
- otro: Otra cosa

INDICADORES:
- "vende", "véndele", "lleva", "compró" → nueva_venta
- "pídele", "ordena", "compra a proveedor" → nueva_orden_compra
- "nuevo producto", "agrega al inventario" → nuevo_producto
- "cliente nuevo", "registra a" → nuevo_cliente
- "abono", "pago de", "pagó" → registrar_pago
- "gasto de", "pagamos por" → registrar_gasto`,
    })

    return { success: true, data: object }
  } catch (error) {
    console.error("Error detecting intent:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error al procesar" 
    }
  }
}

/**
 * Genera una respuesta de voz conversacional (TTS)
 */
export async function generarRespuestaVoz(
  contexto: string,
  accionRealizada: string
): Promise<{ success: boolean; mensaje: string }> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4-turbo"),
      prompt: `Eres un asistente de voz amigable en un negocio mexicano.
      
Genera una respuesta CORTA y NATURAL (máximo 2 oraciones) para confirmar esta acción:

Contexto: ${contexto}
Acción: ${accionRealizada}

La respuesta debe ser:
- En español mexicano casual pero profesional
- Confirmar la acción brevemente
- Sonar natural, como si hablaras con un amigo

Ejemplos de tono:
- "Listo, ya quedó registrada la venta de Juan por 5 mil pesos."
- "Perfecto, agregué el iPhone al carrito. ¿Algo más?"
- "Ya está, el cliente nuevo quedó guardado."`,
    })

    return { success: true, mensaje: text }
  } catch (error) {
    return { 
      success: false, 
      mensaje: "Listo, procesado correctamente." 
    }
  }
}

// ============================================
// TIPOS EXPORTADOS
// ============================================

export type {
  VentaVoiceData,
  OrdenCompraVoiceData,
  ProductoVoiceData,
  ComandoGeneral,
}
