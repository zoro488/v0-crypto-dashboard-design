/**
 * 🔊 API Route: Text-to-Speech Synthesis
 * 
 * Sintetiza voz usando ElevenLabs, Google TTS o OpenAI TTS
 * Retorna audio para reproducción en el cliente
 * 
 * @endpoint POST /api/voice/synthesize
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/app/lib/utils/logger'

// Configuración de proveedores TTS
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY

type TTSProvider = 'elevenlabs' | 'openai' | 'google' | 'mock'

interface SynthesizeRequest {
  text: string
  voice?: string          // Voice ID o nombre
  language?: string       // es-MX, en-US
  speed?: number          // 0.5 - 2.0
  provider?: TTSProvider  // Provider preference
  emotion?: 'neutral' | 'excited' | 'calm' | 'concerned' | 'professional'  // Emotion tag para ElevenLabs
  stability?: number      // 0.0 - 1.0 (ElevenLabs)
  clarity?: number        // 0.0 - 1.0 (ElevenLabs)
}

interface SynthesizeResponse {
  audio: string           // Base64 encoded audio
  format: string          // mp3, wav
  duration?: number
  provider: TTSProvider
}

// Voces disponibles por proveedor
const VOICES = {
  elevenlabs: {
    'chronos': 'TxGEqnHWrfWFTfGW9XjX',  // Josh voice
    'male': 'TxGEqnHWrfWFTfGW9XjX',
    'female': 'EXAVITQu4vr4xnSDxMaL',    // Bella voice
  },
  openai: {
    'chronos': 'alloy',
    'male': 'onyx',
    'female': 'nova',
  },
}

// Detectar proveedor disponible
function getAvailableProvider(): TTSProvider {
  if (ELEVENLABS_API_KEY) return 'elevenlabs'
  if (OPENAI_API_KEY) return 'openai'
  if (GOOGLE_TTS_API_KEY) return 'google'
  return 'mock'
}

// TTS Mock para desarrollo
async function synthesizeMock(_text: string): Promise<SynthesizeResponse> {
  // Simular delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Audio silencioso en base64 (1 segundo de silencio MP3)
  const silentMp3 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoJfxhAAAAAAAAAAAAAAAAAAAAAAD/+xDEAANUAACgAAAAAEAAADSAAAAE//tQxAADkAAAGkAAAAIAAANIAAAASAAAASjYz/+1DEAAM8AACgAAAAAoAAA0gAAABKQA=='
  
  return {
    audio: silentMp3,
    format: 'mp3',
    duration: 1,
    provider: 'mock',
  }
}

// TTS con ElevenLabs
async function synthesizeElevenLabs(
  text: string,
  voice: string,
  options: { emotion?: string; stability?: number; clarity?: number } = {},
): Promise<SynthesizeResponse> {
  const voiceId = VOICES.elevenlabs[voice as keyof typeof VOICES.elevenlabs] || VOICES.elevenlabs.chronos
  
  // Configuración de emoción para voice settings
  const emotionSettings: Record<string, { stability: number; similarity_boost: number; style?: number; use_speaker_boost?: boolean }> = {
    neutral: { stability: 0.5, similarity_boost: 0.75 },
    excited: { stability: 0.3, similarity_boost: 0.9, style: 0.8, use_speaker_boost: true },
    calm: { stability: 0.8, similarity_boost: 0.6, style: 0.2 },
    concerned: { stability: 0.6, similarity_boost: 0.8, style: 0.5 },
    professional: { stability: 0.7, similarity_boost: 0.7, style: 0.3 },
  }
  
  const emotion = options.emotion || 'neutral'
  const baseSettings = emotionSettings[emotion] || emotionSettings.neutral
  
  // Override con valores custom si se proporcionan
  const voiceSettings = {
    ...baseSettings,
    stability: options.stability ?? baseSettings.stability,
    similarity_boost: options.clarity ?? baseSettings.similarity_boost,
  }
  
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5', // Turbo v2.5 para menor latencia (<300ms)
        voice_settings: voiceSettings,
      }),
    },
  )
  
  if (!response.ok) {
    throw new Error(`ElevenLabs error: ${response.status}`)
  }
  
  const audioBuffer = await response.arrayBuffer()
  const audioBase64 = Buffer.from(audioBuffer).toString('base64')
  
  return {
    audio: audioBase64,
    format: 'mp3',
    provider: 'elevenlabs',
  }
}

// TTS con OpenAI
async function synthesizeOpenAI(
  text: string,
  voice: string,
  speed: number,
): Promise<SynthesizeResponse> {
  const voiceName = VOICES.openai[voice as keyof typeof VOICES.openai] || VOICES.openai.chronos
  
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voiceName,
      speed,
      response_format: 'mp3',
    }),
  })
  
  if (!response.ok) {
    throw new Error(`OpenAI TTS error: ${response.status}`)
  }
  
  const audioBuffer = await response.arrayBuffer()
  const audioBase64 = Buffer.from(audioBuffer).toString('base64')
  
  return {
    audio: audioBase64,
    format: 'mp3',
    provider: 'openai',
  }
}

// TTS con Google
async function synthesizeGoogle(
  text: string,
  language: string,
): Promise<SynthesizeResponse> {
  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: language,
          name: language === 'es-MX' ? 'es-MX-Standard-A' : 'en-US-Standard-C',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
        },
      }),
    },
  )
  
  if (!response.ok) {
    throw new Error(`Google TTS error: ${response.status}`)
  }
  
  const result = await response.json()
  
  return {
    audio: result.audioContent,
    format: 'mp3',
    provider: 'google',
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SynthesizeRequest = await request.json()
    const {
      text,
      voice = 'chronos',
      language = 'es-MX',
      speed = 1.0,
      provider: preferredProvider,
      emotion = 'neutral',
      stability,
      clarity,
    } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Texto es requerido' },
        { status: 400 },
      )
    }

    // Limitar longitud del texto
    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Texto demasiado largo (máximo 5000 caracteres)' },
        { status: 400 },
      )
    }

    // Determinar proveedor
    const provider = preferredProvider || getAvailableProvider()
    
    logger.info('Iniciando síntesis de voz', {
      context: 'Synthesize',
      data: { provider, textLength: text.length, voice, emotion },
    })

    let result: SynthesizeResponse

    switch (provider) {
      case 'elevenlabs':
        result = await synthesizeElevenLabs(text, voice, { emotion, stability, clarity })
        break
      case 'openai':
        result = await synthesizeOpenAI(text, voice, speed)
        break
      case 'google':
        result = await synthesizeGoogle(text, language)
        break
      case 'mock':
      default:
        result = await synthesizeMock(text)
        logger.warn('Usando TTS mock', { context: 'Synthesize' })
        break
    }

    logger.info('Síntesis completada', {
      context: 'Synthesize',
      data: { provider, format: result.format },
    })

    return NextResponse.json(result)

  } catch (error) {
    logger.error('Error en síntesis', error as Error, { context: 'Synthesize' })
    
    return NextResponse.json(
      { error: 'Error en síntesis de voz', details: (error as Error).message },
      { status: 500 },
    )
  }
}

export async function GET() {
  const provider = getAvailableProvider()
  
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Text-to-Speech',
    provider,
    configured: provider !== 'mock',
    voices: ['chronos', 'male', 'female'],
    timestamp: new Date().toISOString(),
  })
}
