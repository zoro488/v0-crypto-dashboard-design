/**
 * 🎤 VoiceRecognitionService - Servicio de Reconocimiento de Voz
 * 
 * Proporciona capacidades de voz bidireccionales:
 * - Reconocimiento de voz (Speech-to-Text) con Web Speech API
 * - Síntesis de voz (Text-to-Speech) para respuestas del asistente
 * - Comandos de voz para navegación y automatización
 */

import { logger } from '@/app/lib/utils/logger'
import '@/app/types/speech-recognition'

// Estado del reconocimiento de voz
export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

// Resultado de reconocimiento
export interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

// Configuración del servicio
export interface VoiceConfig {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  voiceRate: number
  voicePitch: number
  voiceVolume: number
}

// Callback para eventos de voz
export type VoiceEventCallback = (event: string, data?: unknown) => void

/**
 * Servicio de reconocimiento y síntesis de voz
 */
export class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null
  private synthesis: SpeechSynthesis | null = null
  private state: VoiceState = 'idle'
  private config: VoiceConfig
  private callbacks: Map<string, VoiceEventCallback[]> = new Map()
  private isSupported: boolean = false

  constructor(config?: Partial<VoiceConfig>) {
    this.config = {
      language: 'es-MX',
      continuous: false,
      interimResults: true,
      maxAlternatives: 3,
      voiceRate: 1,
      voicePitch: 1,
      voiceVolume: 1,
      ...config,
    }

    this.initialize()
  }

  /**
   * Inicializa el servicio de voz
   */
  private initialize(): void {
    // Verificar soporte del navegador
    if (typeof window === 'undefined') {
      logger.warn('VoiceRecognitionService: No window object', { context: 'VoiceRecognitionService' })
      return
    }

    // Speech Recognition
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI()
      this.setupRecognition()
      this.isSupported = true
      logger.info('Speech Recognition initialized', { context: 'VoiceRecognitionService' })
    } else {
      logger.warn('Speech Recognition not supported', { context: 'VoiceRecognitionService' })
    }

    // Speech Synthesis
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis
      logger.info('Speech Synthesis initialized', { context: 'VoiceRecognitionService' })
    } else {
      logger.warn('Speech Synthesis not supported', { context: 'VoiceRecognitionService' })
    }
  }

  /**
   * Configura el reconocimiento de voz
   */
  private setupRecognition(): void {
    if (!this.recognition) return

    this.recognition.lang = this.config.language
    this.recognition.continuous = this.config.continuous
    this.recognition.interimResults = this.config.interimResults
    this.recognition.maxAlternatives = this.config.maxAlternatives

    // Evento: Resultado de reconocimiento
    this.recognition.onresult = (event) => {
      const results: VoiceRecognitionResult[] = []

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        results.push({
          transcript: result[0].transcript,
          confidence: result[0].confidence,
          isFinal: result.isFinal,
        })
      }

      this.emit('result', results)

      // Si es resultado final, procesar
      if (results.some(r => r.isFinal)) {
        const finalTranscript = results.find(r => r.isFinal)?.transcript || ''
        this.emit('transcript', finalTranscript)
        logger.info('Voice transcript', { context: 'VoiceRecognitionService', data: { transcript: finalTranscript } })
      }
    }

    // Evento: Inicio de reconocimiento
    this.recognition.onstart = () => {
      this.state = 'listening'
      this.emit('stateChange', this.state)
      logger.info('Voice recognition started', { context: 'VoiceRecognitionService' })
    }

    // Evento: Fin de reconocimiento
    this.recognition.onend = () => {
      // Solo cambiar a idle si no estamos en modo continuo
      if (!this.config.continuous) {
        this.state = 'idle'
        this.emit('stateChange', this.state)
      }
      this.emit('end')
      logger.info('Voice recognition ended', { context: 'VoiceRecognitionService' })
    }

    // Evento: Error
    this.recognition.onerror = (event) => {
      this.state = 'error'
      this.emit('stateChange', this.state)
      this.emit('error', event.error)
      logger.error('Voice recognition error', new Error(event.error), { context: 'VoiceRecognitionService' })
    }

    // Evento: Sin coincidencia
    this.recognition.onnomatch = () => {
      this.emit('noMatch')
      logger.warn('No speech match found', { context: 'VoiceRecognitionService' })
    }

    // Evento: Inicio de sonido
    this.recognition.onsoundstart = () => {
      this.emit('soundStart')
    }

    // Evento: Fin de sonido
    this.recognition.onsoundend = () => {
      this.emit('soundEnd')
    }

    // Evento: Inicio de habla
    this.recognition.onspeechstart = () => {
      this.emit('speechStart')
    }

    // Evento: Fin de habla
    this.recognition.onspeechend = () => {
      this.emit('speechEnd')
    }
  }

  /**
   * Inicia el reconocimiento de voz
   */
  startListening(): boolean {
    if (!this.recognition) {
      logger.error('Speech recognition not available', new Error('Not supported'), { context: 'VoiceRecognitionService' })
      return false
    }

    if (this.state === 'listening') {
      logger.warn('Already listening', { context: 'VoiceRecognitionService' })
      return true
    }

    try {
      this.recognition.start()
      return true
    } catch (error) {
      logger.error('Failed to start listening', error as Error, { context: 'VoiceRecognitionService' })
      return false
    }
  }

  /**
   * Detiene el reconocimiento de voz
   */
  stopListening(): void {
    if (this.recognition && this.state === 'listening') {
      this.recognition.stop()
    }
  }

  /**
   * Aborta el reconocimiento de voz
   */
  abortListening(): void {
    if (this.recognition) {
      this.recognition.abort()
      this.state = 'idle'
      this.emit('stateChange', this.state)
    }
  }

  /**
   * Sintetiza texto a voz
   */
  speak(text: string, options?: Partial<{ rate: number; pitch: number; volume: number; voice: string }>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not available'))
        return
      }

      // Cancelar cualquier síntesis en curso
      this.synthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = this.config.language
      utterance.rate = options?.rate ?? this.config.voiceRate
      utterance.pitch = options?.pitch ?? this.config.voicePitch
      utterance.volume = options?.volume ?? this.config.voiceVolume

      // Buscar voz en español
      const voices = this.synthesis.getVoices()
      const spanishVoice = voices.find(v => v.lang.startsWith('es')) || 
                          voices.find(v => v.name.toLowerCase().includes('spanish'))
      
      if (spanishVoice) {
        utterance.voice = spanishVoice
      }

      // Si se especificó una voz por nombre
      if (options?.voice) {
        const selectedVoice = voices.find(v => v.name === options.voice)
        if (selectedVoice) {
          utterance.voice = selectedVoice
        }
      }

      utterance.onstart = () => {
        this.state = 'speaking'
        this.emit('stateChange', this.state)
        this.emit('speakStart')
      }

      utterance.onend = () => {
        this.state = 'idle'
        this.emit('stateChange', this.state)
        this.emit('speakEnd')
        resolve()
      }

      utterance.onerror = (event) => {
        this.state = 'error'
        this.emit('stateChange', this.state)
        this.emit('speakError', event.error)
        reject(new Error(event.error))
      }

      this.synthesis.speak(utterance)
      logger.info('Speaking text', { context: 'VoiceRecognitionService', data: { length: text.length } })
    })
  }

  /**
   * Detiene la síntesis de voz
   */
  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
      this.state = 'idle'
      this.emit('stateChange', this.state)
    }
  }

  /**
   * Pausa la síntesis de voz
   */
  pauseSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.pause()
    }
  }

  /**
   * Reanuda la síntesis de voz
   */
  resumeSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.resume()
    }
  }

  /**
   * Obtiene las voces disponibles
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return []
    return this.synthesis.getVoices()
  }

  /**
   * Obtiene las voces en español
   */
  getSpanishVoices(): SpeechSynthesisVoice[] {
    return this.getAvailableVoices().filter(v => v.lang.startsWith('es'))
  }

  /**
   * Registra callback para evento
   */
  on(event: string, callback: VoiceEventCallback): void {
    const callbacks = this.callbacks.get(event) || []
    callbacks.push(callback)
    this.callbacks.set(event, callbacks)
  }

  /**
   * Remueve callback de evento
   */
  off(event: string, callback: VoiceEventCallback): void {
    const callbacks = this.callbacks.get(event) || []
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
      this.callbacks.set(event, callbacks)
    }
  }

  /**
   * Emite evento
   */
  private emit(event: string, data?: unknown): void {
    const callbacks = this.callbacks.get(event) || []
    callbacks.forEach(callback => callback(event, data))
  }

  /**
   * Obtiene el estado actual
   */
  getState(): VoiceState {
    return this.state
  }

  /**
   * Verifica si el servicio está soportado
   */
  getIsSupported(): boolean {
    return this.isSupported
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config }
    
    if (this.recognition) {
      this.recognition.lang = this.config.language
      this.recognition.continuous = this.config.continuous
      this.recognition.interimResults = this.config.interimResults
      this.recognition.maxAlternatives = this.config.maxAlternatives
    }
  }

  /**
   * Limpia todos los listeners
   */
  cleanup(): void {
    this.callbacks.clear()
    this.stopListening()
    this.stopSpeaking()
  }
}

// Instancia singleton
let voiceServiceInstance: VoiceRecognitionService | null = null

export function getVoiceRecognition(config?: Partial<VoiceConfig>): VoiceRecognitionService {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceRecognitionService(config)
  }
  return voiceServiceInstance
}

export default VoiceRecognitionService
