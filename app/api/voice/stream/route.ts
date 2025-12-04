/**
 * 🎙️ DEEPGRAM WEBSOCKET STREAM - Proxy Seguro
 * 
 * Este endpoint actúa como proxy WebSocket para Deepgram,
 * protegiendo la API key del cliente.
 * 
 * NOTA: Next.js App Router no soporta WebSockets nativamente.
 * Para producción, usar:
 * 1. Edge Runtime con Durable Objects (Cloudflare)
 * 2. Separate WebSocket server
 * 3. Socket.io con adapter
 * 
 * Este endpoint proporciona una alternativa REST para transcripción.
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/app/lib/utils/logger'

// Configuración de Deepgram
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY
const DEEPGRAM_REST_URL = 'https://api.deepgram.com/v1/listen'

export async function POST(request: NextRequest) {
  try {
    // Obtener parámetros de la URL
    const searchParams = request.nextUrl.searchParams
    const language = searchParams.get('language') || 'es-MX'
    const model = searchParams.get('model') || 'nova-2'
    const smartFormat = searchParams.get('smart_format') === 'true'
    const punctuate = searchParams.get('punctuate') !== 'false'
    const diarize = searchParams.get('diarize') === 'true'
    
    // Verificar API key
    if (!DEEPGRAM_API_KEY) {
      logger.warn('[Deepgram Stream] API key no configurada, usando mock', { context: 'API' })
      
      // Mock response para desarrollo
      return NextResponse.json({
        type: 'Results',
        channel: {
          alternatives: [{
            transcript: '[Modo demo - configure DEEPGRAM_API_KEY]',
            confidence: 1.0,
            words: [],
          }],
        },
        is_final: true,
        metadata: {
          model_info: { name: 'mock' },
        },
      })
    }
    
    // Obtener audio del body
    const audioData = await request.arrayBuffer()
    
    if (!audioData || audioData.byteLength === 0) {
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      )
    }
    
    // Construir URL con parámetros
    const params = new URLSearchParams({
      language,
      model,
      smart_format: String(smartFormat),
      punctuate: String(punctuate),
      diarize: String(diarize),
    })
    
    const deepgramUrl = `${DEEPGRAM_REST_URL}?${params.toString()}`
    
    // Llamar a Deepgram
    const response = await fetch(deepgramUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm',
      },
      body: audioData,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      logger.error('[Deepgram Stream] Error de API', new Error(errorText), { context: 'API' })
      return NextResponse.json(
        { error: 'Deepgram API error', details: errorText },
        { status: response.status }
      )
    }
    
    const result = await response.json()
    
    // Formatear respuesta similar a WebSocket
    return NextResponse.json({
      type: 'Results',
      channel: result.results?.channels?.[0] || {
        alternatives: [{
          transcript: '',
          confidence: 0,
          words: [],
        }],
      },
      is_final: true,
      metadata: result.metadata,
    })
    
  } catch (error) {
    logger.error('[Deepgram Stream] Error en transcripción', error as Error, { context: 'API' })
    
    return NextResponse.json(
      { error: 'Stream processing failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// GET para verificar estado del endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    provider: 'deepgram',
    model: 'nova-2',
    websocket_note: 'WebSockets require separate server. Use POST for REST transcription.',
    hasApiKey: !!DEEPGRAM_API_KEY,
  })
}
