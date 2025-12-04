/**
 * 🔊 ELEVENLABS TTS CLIENT - Error Handling Militar Grade
 * 
 * Cliente para Text-to-Speech con ElevenLabs
 * Características:
 * - Voces premium de alta calidad
 * - Latencia optimizada con Turbo v2.5
 * - Streaming de audio para respuesta instantánea
 * - Emotion tags para personalidad de voz
 * - Fallback a Web Speech API
 * - Error handling completo con Sentry
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

import { logger } from '@/app/lib/utils/logger'

// =====================================================================
// TIPOS
// =====================================================================

export type VoiceEmotion = 'neutral' | 'excited' | 'calm' | 'concerned' | 'professional'
export type ElevenLabsVoice = 
  | 'rachel' // Profesional femenina
  | 'drew' // Profesional masculina
  | 'clyde' // Casual masculina
  | 'domi' // Fuerte femenina
  | 'bella' // Suave femenina
  | 'antoni' // Neutral masculina
  | 'arnold' // Profunda masculina
  | 'adam' // Narrativa masculina
  | 'josh' // Joven masculina
  | 'elli' // Joven femenina
  | 'sam' // Rasposa masculina

export interface ElevenLabsConfig {
  apiKey?: string
  voiceId?: ElevenLabsVoice | string
  modelId?: 'eleven_turbo_v2_5' | 'eleven_multilingual_v2' | 'eleven_monolingual_v1'
  stability?: number // 0-1
  similarityBoost?: number // 0-1
  style?: number // 0-1
  useSpeakerBoost?: boolean
  optimizeStreamingLatency?: 0 | 1 | 2 | 3 | 4
  outputFormat?: 'mp3_44100' | 'mp3_22050' | 'pcm_16000' | 'pcm_22050' | 'pcm_44100'
  onAudioStart?: () => void
  onAudioEnd?: () => void
  onError?: (error: Error) => void
}

export type ElevenLabsState = 
  | 'idle' 
  | 'loading' 
  | 'playing' 
  | 'error'

export interface VoiceMapping {
  id: string
  name: string
  description: string
  emotion: VoiceEmotion
}

// =====================================================================
// CONSTANTES
// =====================================================================

// IDs reales de ElevenLabs (obtenidos de su API)
export const VOICE_IDS: Record<ElevenLabsVoice, string> = {
  rachel: '21m00Tcm4TlvDq8ikWAM',
  drew: '29vD33N1CtxCmqQRPOHJ',
  clyde: '2EiwWnXFnvU5JabPnv8n',
  domi: 'AZnzlk1XvdvUeBnXmlld',
  bella: 'EXAVITQu4vr4xnSDxMaL',
  antoni: 'ErXwobaYiN019PkySvjV',
  arnold: 'VR6AewLTigWG4xSOukaG',
  adam: 'pNInz6obpgDQGcFmaJgB',
  josh: 'TxGEqnHWrfWFTfGW9XjX',
  elli: 'MF3mGyEYCl7XYWbV9V6O',
  sam: 'yoZ06aMxZJJ28mfd3POQ',
}

const VOICE_SETTINGS_BY_EMOTION: Record<VoiceEmotion, { stability: number; similarity: number; style: number }> = {
  neutral: { stability: 0.5, similarity: 0.75, style: 0.0 },
  excited: { stability: 0.3, similarity: 0.8, style: 0.7 },
  calm: { stability: 0.8, similarity: 0.6, style: 0.2 },
  concerned: { stability: 0.6, similarity: 0.7, style: 0.4 },
  professional: { stability: 0.7, similarity: 0.75, style: 0.3 },
}

// =====================================================================
// ELEVENLABS TTS CLIENT
// =====================================================================

export class ElevenLabsTTSClient {
  private config: ElevenLabsConfig
  private audioContext: AudioContext | null = null
  private currentSource: AudioBufferSourceNode | null = null
  private audioQueue: AudioBuffer[] = []
  private isPlaying = false
  private state: ElevenLabsState = 'idle'
  
  constructor(config: ElevenLabsConfig = {}) {
    this.config = {
      voiceId: 'rachel',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.0,
      useSpeakerBoost: true,
      optimizeStreamingLatency: 3,
      outputFormat: 'mp3_44100',
      ...config,
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // MÉTODOS PÚBLICOS
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Sintetiza texto a voz y lo reproduce
   */
  async speak(text: string, emotion: VoiceEmotion = 'neutral'): Promise<void> {
    if (!text.trim()) {
      logger.warn('[ElevenLabsTTS] Texto vacío, ignorando', { context: 'ElevenLabsTTS' })
      return
    }

    try {
      this.updateState('loading')
      
      // Obtener audio desde API route
      const audioBlob = await this.synthesize(text, emotion)
      
      // Reproducir audio
      await this.playAudio(audioBlob)
      
    } catch (error) {
      this.handleError(error as Error)
      
      // Fallback a Web Speech API
      logger.warn('[ElevenLabsTTS] Usando Web Speech API como fallback', { context: 'ElevenLabsTTS' })
      this.speakWithWebSpeech(text)
    }
  }

  /**
   * Sintetiza texto y retorna el Blob de audio (sin reproducir)
   */
  async synthesize(text: string, emotion: VoiceEmotion = 'neutral'): Promise<Blob> {
    const settings = VOICE_SETTINGS_BY_EMOTION[emotion]
    
    // Resolver voiceId
    const voiceId = typeof this.config.voiceId === 'string' && 
                    Object.keys(VOICE_IDS).includes(this.config.voiceId)
      ? VOICE_IDS[this.config.voiceId as ElevenLabsVoice]
      : this.config.voiceId || VOICE_IDS.rachel
    
    const response = await fetch('/api/voice/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voiceId,
        modelId: this.config.modelId,
        voiceSettings: {
          stability: settings.stability,
          similarity_boost: settings.similarity,
          style: settings.style,
          use_speaker_boost: this.config.useSpeakerBoost,
        },
        emotion,
        outputFormat: this.config.outputFormat,
        optimizeStreamingLatency: this.config.optimizeStreamingLatency,
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`TTS_API_ERROR: ${errorData.error || response.statusText}`)
    }
    
    const audioBlob = await response.blob()
    
    if (audioBlob.size === 0) {
      throw new Error('TTS_EMPTY_RESPONSE: Respuesta de audio vacía')
    }
    
    logger.info('[ElevenLabsTTS] Audio sintetizado', {
      context: 'ElevenLabsTTS',
      data: { textLength: text.length, audioSize: audioBlob.size, emotion },
    })
    
    return audioBlob
  }

  /**
   * Detiene la reproducción actual
   */
  stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop()
      } catch {
        // Ignorar errores al detener
      }
      this.currentSource = null
    }
    this.audioQueue = []
    this.isPlaying = false
    this.updateState('idle')
  }

  /**
   * Obtiene el estado actual
   */
  getState(): ElevenLabsState {
    return this.state
  }

  /**
   * Verifica si está reproduciendo
   */
  getIsPlaying(): boolean {
    return this.isPlaying
  }

  /**
   * Cambia la voz
   */
  setVoice(voiceId: ElevenLabsVoice | string): void {
    this.config.voiceId = voiceId
  }

  /**
   * Obtiene lista de voces disponibles
   */
  static getAvailableVoices(): VoiceMapping[] {
    return [
      { id: 'rachel', name: 'Rachel', description: 'Profesional femenina', emotion: 'professional' },
      { id: 'drew', name: 'Drew', description: 'Profesional masculina', emotion: 'professional' },
      { id: 'bella', name: 'Bella', description: 'Suave y calmada', emotion: 'calm' },
      { id: 'antoni', name: 'Antoni', description: 'Neutral masculina', emotion: 'neutral' },
      { id: 'domi', name: 'Domi', description: 'Energética femenina', emotion: 'excited' },
      { id: 'adam', name: 'Adam', description: 'Narrativa masculina', emotion: 'neutral' },
      { id: 'josh', name: 'Josh', description: 'Joven masculina', emotion: 'neutral' },
      { id: 'elli', name: 'Elli', description: 'Joven femenina', emotion: 'excited' },
      { id: 'arnold', name: 'Arnold', description: 'Voz profunda', emotion: 'calm' },
      { id: 'clyde', name: 'Clyde', description: 'Casual masculina', emotion: 'neutral' },
      { id: 'sam', name: 'Sam', description: 'Rasposa masculina', emotion: 'concerned' },
    ]
  }

  // ─────────────────────────────────────────────────────────────────────
  // MÉTODOS PRIVADOS
  // ─────────────────────────────────────────────────────────────────────

  private async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Inicializar AudioContext si no existe
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
        }
        
        // Decodificar audio
        const arrayBuffer = await audioBlob.arrayBuffer()
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
        
        // Crear source y reproducir
        this.currentSource = this.audioContext.createBufferSource()
        this.currentSource.buffer = audioBuffer
        this.currentSource.connect(this.audioContext.destination)
        
        this.currentSource.onended = () => {
          this.isPlaying = false
          this.updateState('idle')
          this.config.onAudioEnd?.()
          resolve()
        }
        
        this.isPlaying = true
        this.updateState('playing')
        this.config.onAudioStart?.()
        
        this.currentSource.start(0)
        
      } catch (error) {
        reject(error)
      }
    })
  }

  private speakWithWebSpeech(text: string): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      logger.error('[ElevenLabsTTS] Web Speech API no disponible', new Error('No Speech Synthesis'), { context: 'ElevenLabsTTS' })
      return
    }
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-MX'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    // Buscar voz en español
    const voices = window.speechSynthesis.getVoices()
    const spanishVoice = voices.find(v => v.lang.startsWith('es'))
    if (spanishVoice) {
      utterance.voice = spanishVoice
    }
    
    utterance.onstart = () => {
      this.isPlaying = true
      this.updateState('playing')
      this.config.onAudioStart?.()
    }
    
    utterance.onend = () => {
      this.isPlaying = false
      this.updateState('idle')
      this.config.onAudioEnd?.()
    }
    
    utterance.onerror = (event) => {
      this.handleError(new Error(`WEB_SPEECH_ERROR: ${event.error}`))
    }
    
    window.speechSynthesis.speak(utterance)
    
    logger.info('[ElevenLabsTTS] Web Speech fallback usado', { context: 'ElevenLabsTTS' })
  }

  private handleError(error: Error): void {
    this.updateState('error')
    this.isPlaying = false
    
    logger.error('[ElevenLabsTTS] Error crítico', error, { context: 'ElevenLabsTTS' })
    
    // Capturar en Sentry si está disponible
    if (typeof window !== 'undefined') {
      const win = window as unknown as { Sentry?: { captureException: (e: Error, opts?: Record<string, unknown>) => void } }
      if (win.Sentry) {
        win.Sentry.captureException(error, { tags: { section: 'elevenlabs_tts' } })
      }
    }
    
    this.config.onError?.(error)
  }

  private updateState(newState: ElevenLabsState): void {
    this.state = newState
  }
}

// =====================================================================
// UTILIDADES DE EMOTION TAGS
// =====================================================================

/**
 * Analiza el sentimiento del texto y sugiere una emoción
 */
export function detectEmotion(text: string): VoiceEmotion {
  const lowerText = text.toLowerCase()
  
  // Patrones de emoción
  const patterns: Record<VoiceEmotion, RegExp[]> = {
    excited: [
      /¡.*!/,
      /excelente|genial|increíble|fantástico|maravilloso|perfecto/,
      /felicidades|enhorabuena|bravo/,
    ],
    concerned: [
      /error|problema|fallo|alerta|urgente|cuidado/,
      /no se puede|imposible|falló/,
      /advertencia|atención/,
    ],
    calm: [
      /tranquilo|calma|listo|preparado|completado/,
      /sin problemas|todo bien|correcto/,
    ],
    professional: [
      /informe|reporte|análisis|resumen|estadísticas/,
      /según|conforme|de acuerdo/,
    ],
    neutral: [],
  }
  
  for (const [emotion, regexList] of Object.entries(patterns)) {
    for (const regex of regexList) {
      if (regex.test(lowerText)) {
        return emotion as VoiceEmotion
      }
    }
  }
  
  return 'neutral'
}

/**
 * Formatea texto con tags de emoción para ElevenLabs
 */
export function formatWithEmotionTags(text: string, emotion: VoiceEmotion): string {
  // ElevenLabs no usa tags especiales, pero podemos ajustar puntuación
  switch (emotion) {
    case 'excited':
      return text.replace(/\.$/, '!')
    case 'concerned':
      return `${text}...`
    case 'calm':
      return text.replace(/!/g, '.')
    default:
      return text
  }
}

// =====================================================================
// FACTORY FUNCTION
// =====================================================================

export function createElevenLabsClient(config?: ElevenLabsConfig): ElevenLabsTTSClient {
  return new ElevenLabsTTSClient(config)
}

export default ElevenLabsTTSClient
