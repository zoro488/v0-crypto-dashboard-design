/**
 * 🎙️ HYBRID VOICE ENGINE - CHRONOS SYSTEM
 * 
 * Motor de voz híbrido que combina:
 * - Deepgram Nova-2 WebSocket (STT primario - latencia <300ms)
 * - Web Speech API (fallback)
 * - ElevenLabs Turbo v2.5 (TTS primario)
 * - Web Speech Synthesis (TTS fallback)
 * 
 * Características:
 * - Reconexión automática (5 intentos con backoff exponencial)
 * - Fallback automático entre proveedores
 * - Soporte offline con Web Speech API
 * - Cancelación de eco integrada
 * 
 * @version 1.0.0
 * @author CHRONOS Team
 */

import { logger } from '@/app/lib/utils/logger'
import { 
  DeepgramRealtimeClient, 
  TranscriptEvent, 
  getDeepgramClient, 
  destroyDeepgramClient, 
} from './DeepgramRealtimeClient'

// ============================================================================
// TIPOS
// ============================================================================

export type VoiceEngineState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
export type STTProvider = 'deepgram' | 'webspeech' | 'none'
export type TTSProvider = 'elevenlabs' | 'openai' | 'google' | 'webspeech' | 'none'

export interface HybridVoiceConfig {
  // STT Config
  deepgramApiKey?: string
  sttLanguage?: string
  useFallbackSTT?: boolean
  
  // TTS Config
  elevenlabsApiKey?: string
  elevenlabsVoiceId?: string
  openaiApiKey?: string
  ttsLanguage?: string
  useFallbackTTS?: boolean
  
  // General
  autoSpeak?: boolean
  volume?: number
  rate?: number
  pitch?: number
}

export interface VoiceEvent {
  type: 'start' | 'end' | 'result' | 'error' | 'speech_start' | 'speech_end' | 'connected' | 'disconnected'
  transcript?: string
  isFinal?: boolean
  confidence?: number
  latencyMs?: number
  error?: string
  provider?: STTProvider | TTSProvider
}

export type VoiceEventHandler = (event: VoiceEvent) => void

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const DEFAULT_CONFIG: HybridVoiceConfig = {
  sttLanguage: 'es',
  ttsLanguage: 'es-MX',
  useFallbackSTT: true,
  useFallbackTTS: true,
  autoSpeak: true,
  volume: 1.0,
  rate: 1.0,
  pitch: 1.0,
}

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'
const ELEVENLABS_DEFAULT_VOICE = 'nPczCjzI2devNBz1zQrb' // Brian - voz masculina profesional

// ============================================================================
// HYBRID VOICE ENGINE
// ============================================================================

export class HybridVoiceEngine {
  private config: HybridVoiceConfig
  private state: VoiceEngineState = 'idle'
  private eventHandlers: Set<VoiceEventHandler> = new Set()
  
  // STT
  private deepgramClient: DeepgramRealtimeClient | null = null
  private webSpeechRecognition: SpeechRecognition | null = null
  private activeSTTProvider: STTProvider = 'none'
  private mediaRecorder: MediaRecorder | null = null
  private audioStream: MediaStream | null = null
  
  // TTS
  private webSpeechSynthesis: SpeechSynthesis | null = null
  private selectedVoice: SpeechSynthesisVoice | null = null
  private audioContext: AudioContext | null = null
  private currentAudio: HTMLAudioElement | null = null
  private activeTTSProvider: TTSProvider = 'none'
  
  private isInitialized = false

  constructor(config: Partial<HybridVoiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true
    if (typeof window === 'undefined') return false

    try {
      // Inicializar STT
      await this.initializeSTT()
      
      // Inicializar TTS
      await this.initializeTTS()

      this.isInitialized = true
      logger.info('[HybridVoice] ✅ Inicializado', {
        context: 'HybridVoiceEngine',
        data: {
          stt: this.activeSTTProvider,
          tts: this.activeTTSProvider,
        },
      })

      return true
    } catch (error) {
      logger.error('[HybridVoice] Error inicializando', error, { context: 'HybridVoiceEngine' })
      return false
    }
  }

  private async initializeSTT(): Promise<void> {
    // Intentar Deepgram primero
    if (this.config.deepgramApiKey) {
      try {
        this.deepgramClient = getDeepgramClient(this.config.deepgramApiKey)
        this.activeSTTProvider = 'deepgram'
        logger.info('[HybridVoice] STT: Deepgram Nova-2', { context: 'HybridVoiceEngine' })
        return
      } catch (error) {
        logger.warn('[HybridVoice] Deepgram no disponible, usando fallback', { context: 'HybridVoiceEngine' })
      }
    }

    // Fallback a Web Speech API
    if (this.config.useFallbackSTT) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognitionAPI) {
        this.webSpeechRecognition = new SpeechRecognitionAPI()
        this.setupWebSpeechRecognition()
        this.activeSTTProvider = 'webspeech'
        logger.info('[HybridVoice] STT: Web Speech API (fallback)', { context: 'HybridVoiceEngine' })
      }
    }
  }

  private setupWebSpeechRecognition(): void {
    if (!this.webSpeechRecognition) return

    this.webSpeechRecognition.lang = this.config.sttLanguage === 'es' ? 'es-MX' : this.config.sttLanguage!
    this.webSpeechRecognition.continuous = false
    this.webSpeechRecognition.interimResults = true
    this.webSpeechRecognition.maxAlternatives = 1

    this.webSpeechRecognition.onstart = () => {
      this.setState('listening')
      this.emit({ type: 'start', provider: 'webspeech' })
    }

    this.webSpeechRecognition.onend = () => {
      if (this.state === 'listening') {
        this.setState('idle')
      }
      this.emit({ type: 'end', provider: 'webspeech' })
    }

    this.webSpeechRecognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''
      let confidence = 0

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
          confidence = result[0].confidence || 0.9
        } else {
          interimTranscript += result[0].transcript
        }
      }

      if (finalTranscript) {
        this.emit({
          type: 'result',
          transcript: finalTranscript.trim(),
          isFinal: true,
          confidence,
          provider: 'webspeech',
        })
      } else if (interimTranscript) {
        this.emit({
          type: 'result',
          transcript: interimTranscript.trim(),
          isFinal: false,
          provider: 'webspeech',
        })
      }
    }

    this.webSpeechRecognition.onerror = (event) => {
      const ignoredErrors = ['no-speech', 'aborted']
      if (!ignoredErrors.includes(event.error)) {
        this.emit({ type: 'error', error: event.error, provider: 'webspeech' })
      }
    }
  }

  private async initializeTTS(): Promise<void> {
    // Verificar si tenemos API keys para servicios premium
    if (this.config.elevenlabsApiKey) {
      this.activeTTSProvider = 'elevenlabs'
      logger.info('[HybridVoice] TTS: ElevenLabs Turbo v2.5', { context: 'HybridVoiceEngine' })
    } else if (this.config.openaiApiKey) {
      this.activeTTSProvider = 'openai'
      logger.info('[HybridVoice] TTS: OpenAI TTS', { context: 'HybridVoiceEngine' })
    }

    // Siempre inicializar Web Speech como fallback
    if ('speechSynthesis' in window) {
      this.webSpeechSynthesis = window.speechSynthesis
      await this.loadVoices()
      if (!this.activeTTSProvider || this.activeTTSProvider === 'none') {
        this.activeTTSProvider = 'webspeech'
      }
    }
  }

  private async loadVoices(): Promise<void> {
    if (!this.webSpeechSynthesis) return

    return new Promise((resolve) => {
      const selectVoice = () => {
        const voices = this.webSpeechSynthesis!.getVoices()
        // Preferir voces naturales en español
        const preferredVoices = [
          'Microsoft Sabina Online (Natural)',
          'Google español',
          'Paulina',
          'Diego',
        ]
        
        for (const preferred of preferredVoices) {
          const voice = voices.find(v => v.name.includes(preferred))
          if (voice) {
            this.selectedVoice = voice
            break
          }
        }

        if (!this.selectedVoice) {
          this.selectedVoice = voices.find(v => v.lang.startsWith('es')) || voices[0]
        }
        resolve()
      }

      if (this.webSpeechSynthesis && this.webSpeechSynthesis.getVoices().length > 0) {
        selectVoice()
      } else if (this.webSpeechSynthesis) {
        this.webSpeechSynthesis.onvoiceschanged = selectVoice
        setTimeout(selectVoice, 500)
      } else {
        resolve()
      }
    })
  }

  // ============================================================================
  // RECONOCIMIENTO DE VOZ (STT)
  // ============================================================================

  async startListening(): Promise<boolean> {
    if (this.state === 'listening') return true
    
    // Detener TTS si está hablando
    if (this.state === 'speaking') {
      this.stopSpeaking()
    }

    if (this.activeSTTProvider === 'deepgram') {
      return this.startDeepgramListening()
    } else if (this.activeSTTProvider === 'webspeech') {
      return this.startWebSpeechListening()
    }

    logger.warn('[HybridVoice] No hay proveedor STT disponible', { context: 'HybridVoiceEngine' })
    return false
  }

  private async startDeepgramListening(): Promise<boolean> {
    if (!this.deepgramClient) return false

    try {
      // Obtener stream de audio
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Conectar a Deepgram
      await this.deepgramClient.connect((event: TranscriptEvent) => {
        this.handleDeepgramEvent(event)
      })

      // Crear MediaRecorder para enviar chunks de audio
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.deepgramClient?.isConnected) {
          this.deepgramClient.send(event.data)
        }
      }

      this.mediaRecorder.start(100) // Enviar cada 100ms para baja latencia
      this.setState('listening')
      this.emit({ type: 'start', provider: 'deepgram' })
      
      return true
    } catch (error) {
      logger.error('[HybridVoice] Error iniciando Deepgram', error, { context: 'HybridVoiceEngine' })
      
      // Fallback a Web Speech
      if (this.config.useFallbackSTT && this.webSpeechRecognition) {
        logger.info('[HybridVoice] Fallback a Web Speech API', { context: 'HybridVoiceEngine' })
        this.activeSTTProvider = 'webspeech'
        return this.startWebSpeechListening()
      }
      
      return false
    }
  }

  private handleDeepgramEvent(event: TranscriptEvent): void {
    switch (event.type) {
      case 'connected':
        this.emit({ type: 'connected', provider: 'deepgram' })
        break
      case 'disconnected':
        this.emit({ type: 'disconnected', provider: 'deepgram' })
        break
      case 'interim':
      case 'final':
        this.emit({
          type: 'result',
          transcript: event.transcript,
          isFinal: event.isFinal,
          confidence: event.confidence,
          latencyMs: event.latencyMs,
          provider: 'deepgram',
        })
        break
      case 'error':
        this.emit({ type: 'error', error: event.error, provider: 'deepgram' })
        break
    }
  }

  private startWebSpeechListening(): boolean {
    if (!this.webSpeechRecognition) return false

    try {
      this.webSpeechRecognition.start()
      return true
    } catch {
      return false
    }
  }

  stopListening(): void {
    // Detener Deepgram
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop())
      this.audioStream = null
    }
    if (this.deepgramClient?.isConnected) {
      this.deepgramClient.disconnect()
    }

    // Detener Web Speech
    if (this.webSpeechRecognition) {
      try {
        this.webSpeechRecognition.stop()
      } catch {
        // Ignorar
      }
    }

    this.setState('idle')
  }

  // ============================================================================
  // SÍNTESIS DE VOZ (TTS) CON FALLBACK AUTOMÁTICO
  // ============================================================================

  async speak(text: string, options?: { emotion?: string }): Promise<void> {
    const cleanText = this.preprocessText(text)
    
    // Intentar ElevenLabs primero
    if (this.activeTTSProvider === 'elevenlabs' || this.config.elevenlabsApiKey) {
      try {
        await this.speakWithElevenLabs(cleanText, options?.emotion)
        return
      } catch (error) {
        logger.warn('[HybridVoice] ElevenLabs falló, intentando OpenAI', { context: 'HybridVoiceEngine' })
      }
    }

    // Fallback a OpenAI
    if (this.config.openaiApiKey) {
      try {
        await this.speakWithOpenAI(cleanText)
        return
      } catch (error) {
        logger.warn('[HybridVoice] OpenAI falló, usando Web Speech', { context: 'HybridVoiceEngine' })
      }
    }

    // Fallback final a Web Speech
    if (this.config.useFallbackTTS) {
      await this.speakWithWebSpeech(cleanText, options?.emotion)
    }
  }

  private async speakWithElevenLabs(text: string, emotion?: string): Promise<void> {
    if (!this.config.elevenlabsApiKey) {
      throw new Error('ElevenLabs API key no configurada')
    }

    this.setState('speaking')

    // Mapear emociones a configuración de voz
    const voiceSettings = this.getElevenLabsVoiceSettings(emotion)

    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${this.config.elevenlabsVoiceId || ELEVENLABS_DEFAULT_VOICE}/stream`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.config.elevenlabsApiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5', // Modelo más rápido y natural
          voice_settings: voiceSettings,
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`ElevenLabs error: ${response.status}`)
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    
    await this.playAudio(audioUrl)
    URL.revokeObjectURL(audioUrl)
    
    this.setState('idle')
  }

  private getElevenLabsVoiceSettings(emotion?: string): Record<string, number | boolean> {
    const baseSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true,
    }

    switch (emotion) {
      case 'excited':
        return { ...baseSettings, stability: 0.3, style: 0.8 }
      case 'concerned':
        return { ...baseSettings, stability: 0.7, style: 0.3 }
      case 'calm':
        return { ...baseSettings, stability: 0.8, style: 0.2 }
      case 'professional':
        return { ...baseSettings, stability: 0.6, style: 0.4 }
      default:
        return baseSettings
    }
  }

  private async speakWithOpenAI(text: string): Promise<void> {
    if (!this.config.openaiApiKey) {
      throw new Error('OpenAI API key no configurada')
    }

    this.setState('speaking')

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'nova',
        input: text,
        speed: this.config.rate || 1.0,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI TTS error: ${response.status}`)
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    
    await this.playAudio(audioUrl)
    URL.revokeObjectURL(audioUrl)
    
    this.setState('idle')
  }

  private async speakWithWebSpeech(text: string, emotion?: string): Promise<void> {
    if (!this.webSpeechSynthesis) {
      throw new Error('Web Speech Synthesis no disponible')
    }

    this.setState('speaking')

    return new Promise((resolve, reject) => {
      this.webSpeechSynthesis!.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice
      }
      
      utterance.lang = this.config.ttsLanguage || 'es-MX'
      utterance.volume = this.config.volume || 1.0
      
      // Ajustar según emoción
      switch (emotion) {
        case 'excited':
          utterance.rate = 1.1
          utterance.pitch = 1.15
          break
        case 'concerned':
          utterance.rate = 0.95
          utterance.pitch = 0.9
          break
        case 'calm':
          utterance.rate = 0.9
          utterance.pitch = 0.95
          break
        default:
          utterance.rate = this.config.rate || 1.0
          utterance.pitch = this.config.pitch || 1.0
      }

      utterance.onend = () => {
        this.setState('idle')
        resolve()
      }

      utterance.onerror = (event) => {
        if (event.error !== 'interrupted' && event.error !== 'canceled') {
          this.setState('error')
          reject(new Error(event.error))
        } else {
          resolve()
        }
      }

      this.webSpeechSynthesis!.speak(utterance)
    })
  }

  private async playAudio(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(url)
      this.currentAudio.volume = this.config.volume || 1.0
      
      this.currentAudio.onended = () => {
        this.currentAudio = null
        resolve()
      }
      
      this.currentAudio.onerror = (error) => {
        this.currentAudio = null
        reject(error)
      }
      
      this.currentAudio.play().catch(reject)
    })
  }

  stopSpeaking(): void {
    // Detener audio HTML5
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }

    // Detener Web Speech
    if (this.webSpeechSynthesis) {
      this.webSpeechSynthesis.cancel()
    }

    this.setState('idle')
  }

  private preprocessText(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, '$1 pesos')
      .replace(/(\d+)%/g, '$1 por ciento')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // ============================================================================
  // EVENTOS Y ESTADO
  // ============================================================================

  on(handler: VoiceEventHandler): () => void {
    this.eventHandlers.add(handler)
    return () => this.eventHandlers.delete(handler)
  }

  private emit(event: VoiceEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event)
      } catch (error) {
        logger.error('[HybridVoice] Error en event handler', error, { context: 'HybridVoiceEngine' })
      }
    })
  }

  private setState(newState: VoiceEngineState): void {
    if (this.state !== newState) {
      this.state = newState
    }
  }

  getState(): VoiceEngineState {
    return this.state
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  isSupported(): { stt: boolean; tts: boolean } {
    return {
      stt: this.activeSTTProvider !== 'none',
      tts: this.activeTTSProvider !== 'none',
    }
  }

  getProviders(): { stt: STTProvider; tts: TTSProvider } {
    return {
      stt: this.activeSTTProvider,
      tts: this.activeTTSProvider,
    }
  }

  destroy(): void {
    this.stopListening()
    this.stopSpeaking()
    destroyDeepgramClient()
    this.eventHandlers.clear()
    this.isInitialized = false
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let hybridEngineInstance: HybridVoiceEngine | null = null

export function getHybridVoiceEngine(config?: Partial<HybridVoiceConfig>): HybridVoiceEngine {
  if (!hybridEngineInstance) {
    hybridEngineInstance = new HybridVoiceEngine(config)
  }
  return hybridEngineInstance
}

export function destroyHybridVoiceEngine(): void {
  if (hybridEngineInstance) {
    hybridEngineInstance.destroy()
    hybridEngineInstance = null
  }
}

export default HybridVoiceEngine
