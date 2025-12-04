/**
 * 🎤 Voice AI Services - CHRONOS System
 * 
 * Servicios para interacción por voz:
 * - STT (Speech-to-Text) con Deepgram Nova-2 + Web Speech fallback
 * - TTS (Text-to-Speech) con ElevenLabs Turbo v2.5 + Web Speech fallback
 * - Voice Agent para comandos conversacionales
 * - Error handling militar-grade con Sentry
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

import { logger } from '@/app/lib/utils/logger'

// =====================================================================
// RE-EXPORTS DE MÓDULOS ESPECIALIZADOS
// =====================================================================

// Deepgram STT Client
export {
  DeepgramSTTClient,
  WebSpeechFallback,
  createDeepgramClient,
  type DeepgramConfig,
  type DeepgramState,
  type TranscriptionEvent,
} from './deepgram'

// ElevenLabs TTS Client
export {
  ElevenLabsTTSClient,
  createElevenLabsClient,
  detectEmotion,
  formatWithEmotionTags,
  VOICE_IDS,
  type ElevenLabsConfig,
  type ElevenLabsState,
  type ElevenLabsVoice,
  type VoiceEmotion,
  type VoiceMapping,
} from './elevenlabs'

// React Hooks
export {
  useVoice,
  useVoiceRecognition,
  useTextToSpeech,
  type UseVoiceConfig,
  type UseVoiceReturn,
} from './useVoice'

// =====================================================================
// TIPOS
// =====================================================================

export interface TranscriptionResult {
  text: string
  confidence: number
  language: string
  duration?: number
  words?: Array<{
    text: string
    start: number
    end: number
    confidence: number
  }>
}

export interface SynthesisResult {
  audioUrl: string
  duration?: number
}

export type VoiceAgentStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

export interface VoiceAgentState {
  status: VoiceAgentStatus
  transcript: string
  response: string
  error?: string
  isListening: boolean
  isSpeaking: boolean
}

export interface VoiceCommand {
  intent: string
  entities: Record<string, string | number>
  confidence: number
  rawText: string
}

// =====================================================================
// VOICE SERVICE CLIENT
// =====================================================================

/**
 * Cliente para los servicios de voz
 */
export class VoiceService {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  /**
   * Transcribe audio a texto
   */
  async transcribe(
    audioBlob: Blob,
    options: { language?: string } = {},
  ): Promise<TranscriptionResult> {
    try {
      // Convertir Blob a base64 (compatible con navegador)
      const arrayBuffer = await audioBlob.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64 = btoa(binary)

      const response = await fetch(`${this.baseUrl}/api/voice/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: base64,
          language: options.language || 'es-MX',
          format: audioBlob.type.split('/')[1] || 'webm',
        }),
      })

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      logger.error('Error en transcripción', error as Error, { context: 'VoiceService' })
      throw error
    }
  }

  /**
   * Sintetiza texto a voz
   */
  async synthesize(
    text: string,
    options: { voice?: string; speed?: number } = {},
  ): Promise<SynthesisResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/voice/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: options.voice || 'chronos',
          speed: options.speed || 1.0,
        }),
      })

      if (!response.ok) {
        throw new Error(`Synthesis failed: ${response.status}`)
      }

      const data = await response.json()
      
      // Crear URL de audio desde base64
      const audioBlob = base64ToBlob(data.audio, `audio/${data.format}`)
      const audioUrl = URL.createObjectURL(audioBlob)

      return {
        audioUrl,
        duration: data.duration,
      }
    } catch (error) {
      logger.error('Error en síntesis', error as Error, { context: 'VoiceService' })
      throw error
    }
  }

  /**
   * Obtener token de Twilio para llamadas
   */
  async getVoiceToken(identity: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/voice/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity }),
      })

      if (!response.ok) {
        throw new Error(`Token generation failed: ${response.status}`)
      }

      const data = await response.json()
      return data.token
    } catch (error) {
      logger.error('Error obteniendo token de voz', error as Error, { context: 'VoiceService' })
      throw error
    }
  }
}

// =====================================================================
// VOICE AGENT - Orquestador de comandos por voz
// =====================================================================

/**
 * Agente de voz que orquesta STT -> AI -> TTS
 */
export class VoiceAgent {
  private voiceService: VoiceService
  private aiEndpoint: string
  private onStateChange?: (state: VoiceAgentState) => void
  
  private state: VoiceAgentState = {
    status: 'idle',
    transcript: '',
    response: '',
    isListening: false,
    isSpeaking: false,
  }

  constructor(options: {
    baseUrl?: string
    aiEndpoint?: string
    onStateChange?: (state: VoiceAgentState) => void
  } = {}) {
    this.voiceService = new VoiceService(options.baseUrl || '')
    this.aiEndpoint = options.aiEndpoint || '/api/ai/conversational'
    this.onStateChange = options.onStateChange
  }

  private updateState(partial: Partial<VoiceAgentState>) {
    this.state = { ...this.state, ...partial }
    this.onStateChange?.(this.state)
  }

  /**
   * Procesa un comando de voz completo:
   * 1. Transcribe audio a texto
   * 2. Envía al AI para procesamiento
   * 3. Sintetiza respuesta a voz
   */
  async processVoiceCommand(audioBlob: Blob): Promise<string> {
    try {
      // 1. Transcribir
      this.updateState({ status: 'listening', isListening: true })
      const transcription = await this.voiceService.transcribe(audioBlob)
      this.updateState({ 
        transcript: transcription.text,
        status: 'processing',
        isListening: false,
      })

      // 2. Procesar con AI
      const aiResponse = await this.processWithAI(transcription.text)
      this.updateState({ response: aiResponse })

      // 3. Sintetizar respuesta
      this.updateState({ status: 'speaking', isSpeaking: true })
      const synthesis = await this.voiceService.synthesize(aiResponse)
      
      // 4. Reproducir audio
      await this.playAudio(synthesis.audioUrl)
      
      this.updateState({ 
        status: 'idle',
        isSpeaking: false,
      })

      return aiResponse

    } catch (error) {
      this.updateState({ 
        status: 'error',
        error: (error as Error).message,
        isListening: false,
        isSpeaking: false,
      })
      throw error
    }
  }

  /**
   * Procesa texto con el endpoint de AI
   */
  private async processWithAI(text: string): Promise<string> {
    const response = await fetch(this.aiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: text }],
      }),
    })

    if (!response.ok) {
      throw new Error(`AI processing failed: ${response.status}`)
    }

    // Leer stream de respuesta
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let result = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        result += decoder.decode(value, { stream: true })
      }
    }

    return result
  }

  /**
   * Reproduce audio desde URL
   */
  private async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl)
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        resolve()
      }
      audio.onerror = (e) => reject(e)
      audio.play().catch(reject)
    })
  }

  /**
   * Obtiene el estado actual
   */
  getState(): VoiceAgentState {
    return { ...this.state }
  }

  /**
   * Reinicia el estado del agente
   */
  reset() {
    this.updateState({
      status: 'idle',
      transcript: '',
      response: '',
      error: undefined,
      isListening: false,
      isSpeaking: false,
    })
  }
}

// =====================================================================
// UTILIDADES
// =====================================================================

/**
 * Convierte base64 a Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

/**
 * Detecta si el navegador soporta grabación de audio
 */
export function isAudioRecordingSupported(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  )
}

/**
 * Detecta si el navegador soporta Web Speech API
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  return !!(
    (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
      .SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  )
}

// =====================================================================
// EXPORTS
// =====================================================================

export const voiceService = new VoiceService()

export default VoiceAgent
