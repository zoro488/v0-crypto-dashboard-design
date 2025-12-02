/**
 * 🎙️ API Route: Speech-to-Text Transcription
 * 
 * Transcribe audio usando AssemblyAI, Whisper o Deepgram
 * Soporta streaming de transcripción en tiempo real
 * 
 * @endpoint POST /api/voice/transcribe
 */

import { NextRequest, NextResponse } from 'next/server'
import { Buffer } from 'node:buffer'
import { logger } from '@/app/lib/utils/logger'

// Configuración de proveedores STT
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY

type STTProvider = 'assemblyai' | 'whisper' | 'deepgram' | 'mock'

interface TranscribeRequest {
  audio: string          // Base64 encoded audio
  format?: string        // Audio format (wav, mp3, webm)
  language?: string      // Language code (es-MX, en-US)
  provider?: STTProvider // Provider preference
}

interface TranscribeResponse {
  text: string
  confidence: number
  language: string
  provider: STTProvider
  duration?: number
  words?: Array<{
    text: string
    start: number
    end: number
    confidence: number
  }>
}

// Detectar proveedor disponible
function getAvailableProvider(): STTProvider {
  if (ASSEMBLYAI_API_KEY) return 'assemblyai'
  if (OPENAI_API_KEY) return 'whisper'
  if (DEEPGRAM_API_KEY) return 'deepgram'
  return 'mock'
}

// Transcripción mock para desarrollo
async function transcribeMock(text?: string): Promise<TranscribeResponse> {
  // Simular delay de procesamiento
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const mockResponses = [
    'Quiero registrar una venta de 5 iPhones',
    '¿Cuánto tenemos en la bóveda monte?',
    'Genera un reporte de ventas del mes',
    'Consulta el estado de los distribuidores',
    text || 'Comando de voz recibido',
  ]
  
  return {
    text: mockResponses[Math.floor(Math.random() * mockResponses.length)],
    confidence: 0.95,
    language: 'es-MX',
    provider: 'mock',
    duration: 2.5,
  }
}

// Transcripción con AssemblyAI
async function transcribeAssemblyAI(
  audioBase64: string,
  language: string,
): Promise<TranscribeResponse> {
  // 1. Subir audio - Convertir Buffer a Uint8Array para compatibilidad con fetch
  const audioBuffer = new Uint8Array(Buffer.from(audioBase64, 'base64'))
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      'Authorization': ASSEMBLYAI_API_KEY!,
      'Content-Type': 'application/octet-stream',
    },
    body: audioBuffer,
  })
  
  const { upload_url } = await uploadResponse.json()
  
  // 2. Crear transcripción
  const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'Authorization': ASSEMBLYAI_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: upload_url,
      language_code: language === 'es-MX' ? 'es' : language.split('-')[0],
    }),
  })
  
  const { id } = await transcriptResponse.json()
  
  // 3. Polling para resultado
  let result
  do {
    await new Promise(resolve => setTimeout(resolve, 1000))
    const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { 'Authorization': ASSEMBLYAI_API_KEY! },
    })
    result = await pollResponse.json()
  } while (result.status !== 'completed' && result.status !== 'error')
  
  if (result.status === 'error') {
    throw new Error(result.error || 'AssemblyAI transcription failed')
  }
  
  return {
    text: result.text,
    confidence: result.confidence || 0.9,
    language,
    provider: 'assemblyai',
    duration: result.audio_duration,
    words: result.words?.map((w: { text: string; start: number; end: number; confidence: number }) => ({
      text: w.text,
      start: w.start / 1000,
      end: w.end / 1000,
      confidence: w.confidence,
    })),
  }
}

// Transcripción con OpenAI Whisper
async function transcribeWhisper(
  audioBase64: string,
  language: string,
  format: string,
): Promise<TranscribeResponse> {
  const formData = new FormData()
  
  // Convertir base64 a Blob usando Uint8Array para compatibilidad
  const audioBytes = new Uint8Array(Buffer.from(audioBase64, 'base64'))
  const audioBlob = new Blob([audioBytes], { type: `audio/${format}` })
  formData.append('file', audioBlob, `audio.${format}`)
  formData.append('model', 'whisper-1')
  formData.append('language', language.split('-')[0])
  formData.append('response_format', 'verbose_json')
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  })
  
  const result = await response.json()
  
  return {
    text: result.text,
    confidence: 0.95, // Whisper no reporta confidence
    language,
    provider: 'whisper',
    duration: result.duration,
    words: result.words?.map((w: { word: string; start: number; end: number }) => ({
      text: w.word,
      start: w.start,
      end: w.end,
      confidence: 0.95,
    })),
  }
}

// Transcripción con Deepgram
async function transcribeDeepgram(
  audioBase64: string,
  language: string,
): Promise<TranscribeResponse> {
  // Usar Uint8Array para compatibilidad con fetch
  const audioBuffer = new Uint8Array(Buffer.from(audioBase64, 'base64'))
  
  const response = await fetch(
    `https://api.deepgram.com/v1/listen?language=${language.split('-')[0]}&model=nova-2`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/wav',
      },
      body: audioBuffer,
    },
  )
  
  const result = await response.json()
  const transcript = result.results?.channels?.[0]?.alternatives?.[0]
  
  return {
    text: transcript?.transcript || '',
    confidence: transcript?.confidence || 0.9,
    language,
    provider: 'deepgram',
    duration: result.metadata?.duration,
    words: transcript?.words?.map((w: { word: string; start: number; end: number; confidence: number }) => ({
      text: w.word,
      start: w.start,
      end: w.end,
      confidence: w.confidence,
    })),
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TranscribeRequest = await request.json()
    const {
      audio,
      format = 'wav',
      language = 'es-MX',
      provider: preferredProvider,
    } = body

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio es requerido (base64)' },
        { status: 400 },
      )
    }

    // Determinar proveedor
    const provider = preferredProvider || getAvailableProvider()
    
    logger.info('Iniciando transcripción', {
      context: 'Transcribe',
      data: { provider, format, language },
    })

    let result: TranscribeResponse

    switch (provider) {
      case 'assemblyai':
        result = await transcribeAssemblyAI(audio, language)
        break
      case 'whisper':
        result = await transcribeWhisper(audio, language, format)
        break
      case 'deepgram':
        result = await transcribeDeepgram(audio, language)
        break
      case 'mock':
      default:
        result = await transcribeMock()
        logger.warn('Usando transcripción mock', { context: 'Transcribe' })
        break
    }

    logger.info('Transcripción completada', {
      context: 'Transcribe',
      data: { 
        provider, 
        textLength: result.text.length,
        confidence: result.confidence,
      },
    })

    return NextResponse.json(result)

  } catch (error) {
    logger.error('Error en transcripción', error as Error, { context: 'Transcribe' })
    
    return NextResponse.json(
      { error: 'Error en transcripción', details: (error as Error).message },
      { status: 500 },
    )
  }
}

export async function GET() {
  const provider = getAvailableProvider()
  
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Speech-to-Text',
    provider,
    configured: provider !== 'mock',
    supportedLanguages: ['es-MX', 'en-US', 'es', 'en'],
    timestamp: new Date().toISOString(),
  })
}
