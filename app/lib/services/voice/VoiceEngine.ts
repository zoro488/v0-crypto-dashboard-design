/**
 * 🎙️ VoiceEngine - Motor de Voz Ultra-Avanzado para CHRONOS
 * 
 * Sistema de síntesis y reconocimiento de voz de alta calidad:
 * - Voces naturales con prosodia avanzada
 * - Reconocimiento continuo con VAD (Voice Activity Detection)
 * - Soporte para comandos de voz en español
 * - Colas de reproducción inteligentes
 * - Gestión de estado robusta
 */

import { logger } from '@/app/lib/utils/logger'

// ============================================================================
// TIPOS
// ============================================================================

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

export interface VoiceConfig {
  language: string
  voiceName?: string
  rate: number
  pitch: number
  volume: number
  continuous: boolean
  interimResults: boolean
  autoStop: boolean
  silenceTimeout: number
}

export interface VoiceEvent {
  type: 'start' | 'end' | 'result' | 'error' | 'speech_start' | 'speech_end'
  transcript?: string
  isFinal?: boolean
  confidence?: number
  error?: string
}

export type VoiceEventHandler = (event: VoiceEvent) => void

// ============================================================================
// CONFIGURACIÓN POR DEFECTO
// ============================================================================

const DEFAULT_CONFIG: VoiceConfig = {
  language: 'es-MX',
  voiceName: undefined, // Selección automática de mejor voz
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  continuous: false,
  interimResults: true,
  autoStop: true,
  silenceTimeout: 3000,
}

// Voces preferidas en español (ordenadas por calidad)
const PREFERRED_VOICES = [
  'Microsoft Sabina Online (Natural) - Spanish (Mexico)',
  'Google español',
  'Paulina',
  'Diego',
  'Monica',
  'es-MX',
  'es-ES',
]

// ============================================================================
// VOICE ENGINE CLASS
// ============================================================================

export class VoiceEngine {
  private config: VoiceConfig
  private recognition: SpeechRecognition | null = null
  private synthesis: SpeechSynthesis | null = null
  private selectedVoice: SpeechSynthesisVoice | null = null
  private utteranceQueue: SpeechSynthesisUtterance[] = []
  private state: VoiceState = 'idle'
  private eventHandlers: Set<VoiceEventHandler> = new Set()
  private silenceTimer: NodeJS.Timeout | null = null
  private isInitialized = false
  private isSpeaking = false
  private lastTranscript = ''

  constructor(config: Partial<VoiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true

    try {
      // Verificar soporte del navegador
      if (typeof window === 'undefined') {
        logger.warn('VoiceEngine: Window no disponible', { context: 'VoiceEngine' })
        return false
      }

      // Inicializar reconocimiento de voz
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognitionAPI) {
        this.recognition = new SpeechRecognitionAPI()
        this.setupRecognition()
      } else {
        logger.warn('SpeechRecognition no soportado', { context: 'VoiceEngine' })
      }

      // Inicializar síntesis de voz
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis
        await this.loadBestVoice()
      } else {
        logger.warn('SpeechSynthesis no soportado', { context: 'VoiceEngine' })
      }

      this.isInitialized = true
      logger.info('VoiceEngine inicializado correctamente', { 
        context: 'VoiceEngine',
        data: { 
          hasRecognition: !!this.recognition, 
          hasSynthesis: !!this.synthesis,
          voice: this.selectedVoice?.name, 
        },
      })

      return true
    } catch (error) {
      logger.error('Error inicializando VoiceEngine', error, { context: 'VoiceEngine' })
      return false
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return

    this.recognition.lang = this.config.language
    this.recognition.continuous = this.config.continuous
    this.recognition.interimResults = this.config.interimResults
    this.recognition.maxAlternatives = 3

    this.recognition.onstart = () => {
      this.setState('listening')
      this.emit({ type: 'start' })
      logger.debug('Reconocimiento iniciado', { context: 'VoiceEngine' })
    }

    this.recognition.onend = () => {
      if (this.state === 'listening') {
        this.setState('idle')
      }
      this.emit({ type: 'end' })
      this.clearSilenceTimer()
    }

    this.recognition.onspeechstart = () => {
      this.emit({ type: 'speech_start' })
      this.resetSilenceTimer()
    }

    this.recognition.onspeechend = () => {
      this.emit({ type: 'speech_end' })
      if (this.config.autoStop) {
        this.startSilenceTimer()
      }
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = ''
      let maxConfidence = 0

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        const confidence = result[0].confidence || 0

        if (result.isFinal) {
          finalTranscript += transcript
          maxConfidence = Math.max(maxConfidence, confidence)
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        this.lastTranscript = finalTranscript
        this.emit({
          type: 'result',
          transcript: finalTranscript.trim(),
          isFinal: true,
          confidence: maxConfidence,
        })
        this.resetSilenceTimer()
      } else if (interimTranscript) {
        this.emit({
          type: 'result',
          transcript: interimTranscript.trim(),
          isFinal: false,
          confidence: 0,
        })
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const ignoredErrors = ['no-speech', 'aborted']
      if (!ignoredErrors.includes(event.error)) {
        this.setState('error')
        this.emit({ type: 'error', error: event.error })
        logger.error('Error de reconocimiento', { error: event.error }, { context: 'VoiceEngine' })
      }
    }
  }

  private async loadBestVoice(): Promise<void> {
    if (!this.synthesis) return

    return new Promise<void>((resolve) => {
      const selectVoice = () => {
        const voices = this.synthesis!.getVoices()
        if (voices.length === 0) return

        // Buscar la mejor voz disponible
        for (const preferredName of PREFERRED_VOICES) {
          const voice = voices.find(v => 
            v.name.includes(preferredName) || 
            v.lang.startsWith(preferredName),
          )
          if (voice) {
            this.selectedVoice = voice
            logger.info('Voz seleccionada', { 
              context: 'VoiceEngine', 
              data: { name: voice.name, lang: voice.lang }, 
            })
            break
          }
        }

        // Fallback a primera voz en español
        if (!this.selectedVoice) {
          this.selectedVoice = voices.find(v => v.lang.startsWith('es')) || voices[0]
        }

        resolve()
      }

      // Cargar voces (pueden estar disponibles inmediatamente o después)
      if (this.synthesis && this.synthesis.getVoices().length > 0) {
        selectVoice()
      } else if (this.synthesis) {
        this.synthesis.onvoiceschanged = selectVoice
        // Timeout para navegadores que no disparan el evento
        setTimeout(selectVoice, 500)
      } else {
        resolve()
      }
    })
  }

  // ============================================================================
  // GESTIÓN DE ESTADO
  // ============================================================================

  private setState(newState: VoiceState): void {
    if (this.state !== newState) {
      const oldState = this.state
      this.state = newState
      logger.debug('Estado cambiado', { 
        context: 'VoiceEngine', 
        data: { from: oldState, to: newState }, 
      })
    }
  }

  getState(): VoiceState {
    return this.state
  }

  // ============================================================================
  // EVENTOS
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
        logger.error('Error en handler de evento', error, { context: 'VoiceEngine' })
      }
    })
  }

  // ============================================================================
  // RECONOCIMIENTO DE VOZ
  // ============================================================================

  startListening(): boolean {
    if (!this.recognition) {
      logger.warn('Reconocimiento no disponible', { context: 'VoiceEngine' })
      return false
    }

    if (this.state === 'listening') {
      return true
    }

    // Detener síntesis si está hablando
    if (this.isSpeaking) {
      this.stopSpeaking()
    }

    try {
      this.recognition.start()
      return true
    } catch (error) {
      // Ya escuchando
      logger.debug('Reconocimiento ya activo', { context: 'VoiceEngine' })
      return true
    }
  }

  stopListening(): void {
    if (!this.recognition) return
    
    try {
      this.recognition.stop()
    } catch {
      // Ignorar error si ya está detenido
    }
    this.clearSilenceTimer()
  }

  private startSilenceTimer(): void {
    this.clearSilenceTimer()
    this.silenceTimer = setTimeout(() => {
      if (this.state === 'listening') {
        this.stopListening()
      }
    }, this.config.silenceTimeout)
  }

  private resetSilenceTimer(): void {
    if (this.silenceTimer) {
      this.clearSilenceTimer()
      this.startSilenceTimer()
    }
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
      this.silenceTimer = null
    }
  }

  // ============================================================================
  // SÍNTESIS DE VOZ
  // ============================================================================

  speak(text: string, options: Partial<VoiceConfig> = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Síntesis no disponible'))
        return
      }

      // Limpiar texto para mejor pronunciación
      const cleanText = this.preprocessText(text)

      // Cancelar síntesis anterior
      this.synthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(cleanText)
      
      // Configurar voz
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice
      }
      utterance.lang = options.language || this.config.language
      utterance.rate = options.rate ?? this.config.rate
      utterance.pitch = options.pitch ?? this.config.pitch
      utterance.volume = options.volume ?? this.config.volume

      utterance.onstart = () => {
        this.isSpeaking = true
        this.setState('speaking')
      }

      utterance.onend = () => {
        this.isSpeaking = false
        this.setState('idle')
        resolve()
      }

      utterance.onerror = (event) => {
        this.isSpeaking = false
        if (event.error !== 'interrupted' && event.error !== 'canceled') {
          this.setState('error')
          reject(new Error(event.error))
        } else {
          resolve()
        }
      }

      this.synthesis.speak(utterance)
    })
  }

  /**
   * Preprocesa el texto para mejorar la pronunciación natural
   */
  private preprocessText(text: string): string {
    return text
      // Eliminar markdown
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`(.*?)`/g, '$1')
      // Convertir emojis comunes a palabras
      .replace(/📈/g, '')
      .replace(/📊/g, '')
      .replace(/💡/g, '')
      .replace(/⚠️/g, 'atención, ')
      .replace(/✅/g, '')
      .replace(/❌/g, 'error, ')
      .replace(/🎯/g, '')
      .replace(/💰/g, '')
      .replace(/🏦/g, '')
      // Mejorar pronunciación de números
      .replace(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, '$1 pesos')
      .replace(/(\d+)%/g, '$1 por ciento')
      // Pausas naturales
      .replace(/\.\s+/g, '. ')
      .replace(/,\s*/g, ', ')
      // Limpiar espacios múltiples
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Habla con entonación emocional
   */
  speakWithEmotion(text: string, emotion: 'neutral' | 'excited' | 'concerned' | 'calm'): Promise<void> {
    const emotionConfig: Record<string, Partial<VoiceConfig>> = {
      neutral: { rate: 1.0, pitch: 1.0 },
      excited: { rate: 1.1, pitch: 1.15 },
      concerned: { rate: 0.95, pitch: 0.9 },
      calm: { rate: 0.9, pitch: 0.95 },
    }
    
    return this.speak(text, emotionConfig[emotion])
  }

  stopSpeaking(): void {
    if (!this.synthesis) return
    this.synthesis.cancel()
    this.utteranceQueue = []
    this.isSpeaking = false
    this.setState('idle')
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  isSupported(): { recognition: boolean; synthesis: boolean } {
    return {
      recognition: !!this.recognition,
      synthesis: !!this.synthesis,
    }
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis?.getVoices().filter(v => v.lang.startsWith('es')) || []
  }

  setVoice(voiceName: string): boolean {
    const voices = this.getAvailableVoices()
    const voice = voices.find(v => v.name === voiceName)
    if (voice) {
      this.selectedVoice = voice
      return true
    }
    return false
  }

  updateConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config }
    if (this.recognition) {
      this.recognition.lang = this.config.language
      this.recognition.continuous = this.config.continuous
      this.recognition.interimResults = this.config.interimResults
    }
  }

  destroy(): void {
    this.stopListening()
    this.stopSpeaking()
    this.eventHandlers.clear()
    this.clearSilenceTimer()
    this.recognition = null
    this.synthesis = null
    this.isInitialized = false
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let voiceEngineInstance: VoiceEngine | null = null

export function getVoiceEngine(config?: Partial<VoiceConfig>): VoiceEngine {
  if (!voiceEngineInstance) {
    voiceEngineInstance = new VoiceEngine(config)
  }
  return voiceEngineInstance
}

export function destroyVoiceEngine(): void {
  if (voiceEngineInstance) {
    voiceEngineInstance.destroy()
    voiceEngineInstance = null
  }
}
