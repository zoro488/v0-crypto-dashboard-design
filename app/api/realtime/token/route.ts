/**
 * 🔑 OPENAI REALTIME API - Token Endpoint
 * 
 * Genera tokens efímeros para conexiones WebRTC con OpenAI Realtime API.
 * Estos tokens expiran en 1 minuto y son seguros para enviar al cliente.
 * 
 * POST /api/realtime/token
 * 
 * @see https://platform.openai.com/docs/guides/realtime-webrtc
 */

import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/frontend/app/lib/utils/logger"

// Tipos para la respuesta de OpenAI
interface OpenAISessionResponse {
  id: string
  object: string
  model: string
  modalities: string[]
  instructions: string
  voice: string
  input_audio_format: string
  output_audio_format: string
  input_audio_transcription: {
    model: string
  } | null
  turn_detection: {
    type: string
    threshold: number
    prefix_padding_ms: number
    silence_duration_ms: number
    create_response: boolean
  } | null
  tools: Array<{
    type: string
    name: string
    description: string
    parameters: Record<string, unknown>
  }>
  tool_choice: string
  temperature: number
  max_response_output_tokens: number | "inf"
  client_secret: {
    value: string
    expires_at: number
  }
}

interface TokenRequestBody {
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"
  instructions?: string
  tools?: Array<{
    type: "function"
    name: string
    description: string
    parameters: Record<string, unknown>
  }>
}

export async function POST(request: NextRequest) {
  try {
    // Verificar API key
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      logger.error("OPENAI_API_KEY not configured")
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    // Parsear body opcional
    let body: TokenRequestBody = {}
    try {
      body = await request.json()
    } catch {
      // Body vacío es válido
    }

    // Configurar la sesión
    const sessionConfig = {
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: body.voice || "alloy",
      instructions: body.instructions || getDefaultInstructions(),
      tools: body.tools || getDefaultTools(),
      modalities: ["audio", "text"],
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      input_audio_transcription: {
        model: "whisper-1",
      },
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
        create_response: true,
      },
    }

    // Crear sesión efímera con OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionConfig),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error("OpenAI session creation failed", { status: response.status, error: errorText })
      
      return NextResponse.json(
        { error: "Failed to create OpenAI session", details: errorText },
        { status: response.status }
      )
    }

    const sessionData: OpenAISessionResponse = await response.json()

    // Retornar solo el token efímero (seguro para el cliente)
    return NextResponse.json({
      success: true,
      client_secret: sessionData.client_secret.value,
      expires_at: sessionData.client_secret.expires_at,
      session_id: sessionData.id,
      model: sessionData.model,
      voice: sessionData.voice,
    })

  } catch (error) {
    logger.error("Error in realtime token endpoint", error)
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Instrucciones por defecto para el agente de voz
 */
function getDefaultInstructions(): string {
  return `Eres un asistente de voz para el sistema CHRONOS, un punto de venta (POS) para una casa de cambio en México.

Tu rol es ayudar al usuario a:
1. Registrar ventas de manera rápida ("véndele a Juan 3 iPhones")
2. Crear órdenes de compra ("pídele a TechMex 50 cargadores")
3. Agregar productos al inventario
4. Consultar información (stock, deudas, ventas)

REGLAS:
- Responde SIEMPRE en español mexicano, casual pero profesional
- Sé breve y conciso (máximo 2-3 oraciones)
- Confirma las acciones antes de ejecutarlas
- Si no entiendes algo, pide aclaración
- Usa el tono amigable de un empleado de confianza

EJEMPLOS DE TONO:
- "Listo, ya quedó la venta de Juan."
- "Perfecto, agregué 3 iPhones al carrito. ¿Algo más?"
- "Espera, ¿dijiste 500 o 5000 pesos?"

Cuando detectes una intención clara, llama la función correspondiente.`
}

/**
 * Tools/funciones disponibles para el agente
 */
function getDefaultTools(): Array<{
  type: "function"
  name: string
  description: string
  parameters: Record<string, unknown>
}> {
  return [
    {
      type: "function",
      name: "registrar_venta",
      description: "Registra una nueva venta con cliente y productos",
      parameters: {
        type: "object",
        properties: {
          clienteNombre: {
            type: "string",
            description: "Nombre del cliente",
          },
          productos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nombre: { type: "string" },
                cantidad: { type: "number" },
                precio: { type: "number" },
              },
            },
            description: "Lista de productos vendidos",
          },
          metodoPago: {
            type: "string",
            enum: ["efectivo", "transferencia", "tarjeta", "credito"],
          },
          esCredito: {
            type: "boolean",
            description: "Si la venta es a crédito (fiado)",
          },
        },
        required: ["productos"],
      },
    },
    {
      type: "function",
      name: "crear_orden_compra",
      description: "Crea una orden de compra a un proveedor",
      parameters: {
        type: "object",
        properties: {
          distribuidorNombre: {
            type: "string",
            description: "Nombre del proveedor/distribuidor",
          },
          productos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nombre: { type: "string" },
                cantidad: { type: "number" },
                costo: { type: "number" },
              },
            },
          },
          costoTotal: {
            type: "number",
          },
        },
        required: ["productos"],
      },
    },
    {
      type: "function",
      name: "agregar_producto",
      description: "Agrega un nuevo producto al inventario",
      parameters: {
        type: "object",
        properties: {
          nombre: {
            type: "string",
            description: "Nombre del producto",
          },
          precioCompra: {
            type: "number",
            description: "Precio de compra/costo",
          },
          precioVenta: {
            type: "number",
            description: "Precio de venta",
          },
          stock: {
            type: "number",
            description: "Stock inicial",
          },
          categoria: {
            type: "string",
          },
        },
        required: ["nombre"],
      },
    },
    {
      type: "function",
      name: "consultar_stock",
      description: "Consulta el stock de un producto",
      parameters: {
        type: "object",
        properties: {
          productoNombre: {
            type: "string",
            description: "Nombre del producto a consultar",
          },
        },
        required: ["productoNombre"],
      },
    },
    {
      type: "function",
      name: "consultar_deuda_cliente",
      description: "Consulta cuánto debe un cliente",
      parameters: {
        type: "object",
        properties: {
          clienteNombre: {
            type: "string",
            description: "Nombre del cliente",
          },
        },
        required: ["clienteNombre"],
      },
    },
    {
      type: "function",
      name: "abrir_modal",
      description: "Abre un modal específico en la interfaz",
      parameters: {
        type: "object",
        properties: {
          tipo: {
            type: "string",
            enum: ["venta", "orden_compra", "producto", "cliente", "distribuidor"],
            description: "Tipo de modal a abrir",
          },
          datosIniciales: {
            type: "object",
            description: "Datos para prellenar el formulario",
          },
        },
        required: ["tipo"],
      },
    },
  ]
}
