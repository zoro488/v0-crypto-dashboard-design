/**
 * 🎵 AUDIO VISUALIZER SERVICE - CHRONOS SYSTEM
 * 
 * Servicio para capturar datos de audio en tiempo real usando Web Audio API
 * 
 * Características:
 * - AnalyserNode para frecuencias en tiempo real
 * - Waveform data para visualizaciones
 * - Detección de volumen (RMS)
 * - Soporte para micrófono y audio output
 * - Optimizado para 60fps
 * 
 * @version 1.0.0
 * @author CHRONOS Team
 */

import { logger } from '@/app/lib/utils/logger'

// ============================================================================
// TIPOS
// ============================================================================

export interface AudioVisualizerData {
  volume: number           // 0.0 - 1.0 (RMS normalizado)
  frequencyData: Uint8Array
  waveformData: Uint8Array
  peak: number             // 0.0 - 1.0 (pico máximo)
  bass: number             // 0.0 - 1.0 (frecuencias bajas)
  mid: number              // 0.0 - 1.0 (frecuencias medias)
  treble: number           // 0.0 - 1.0 (frecuencias altas)
}

export interface AudioVisualizerConfig {
  fftSize?: number         // Resolución FFT (default: 256)
  smoothingTimeConstant?: number  // Suavizado (default: 0.8)
  minDecibels?: number     // Umbral mínimo (default: -90)
  maxDecibels?: number     // Umbral máximo (default: -10)
}

export type AudioVisualizerCallback = (data: AudioVisualizerData) => void
export type AudioSource = 'microphone' | 'audio-element' | 'media-stream'

// ============================================================================
// CONSTANTES
// ============================================================================

const DEFAULT_CONFIG: Required<AudioVisualizerConfig> = {
  fftSize: 256,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
}

// ============================================================================
// CLASE PRINCIPAL
// ============================================================================

export class AudioVisualizerService {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null = null
  private mediaStream: MediaStream | null = null
  private animationFrameId: number | null = null
  private callbacks: Set<AudioVisualizerCallback> = new Set()
  private config: Required<AudioVisualizerConfig>
  private isRunning = false
  private frequencyData: Uint8Array<ArrayBuffer> | null = null
  private waveformData: Uint8Array<ArrayBuffer> | null = null

  constructor(config?: AudioVisualizerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================

  /**
   * Inicializar con micrófono
   */
  async initWithMicrophone(): Promise<boolean> {
    try {
      // Solicitar acceso al micrófono
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      return this.initializeAudioContext(this.mediaStream)
    } catch (error) {
      logger.error('[AudioVisualizer] Error accediendo al micrófono', error, {
        context: 'AudioVisualizerService',
      })
      return false
    }
  }

  /**
   * Inicializar con MediaStream existente (ej: de Deepgram)
   */
  initWithMediaStream(stream: MediaStream): boolean {
    this.mediaStream = stream
    return this.initializeAudioContext(stream)
  }

  /**
   * Inicializar con elemento de audio HTML
   */
  initWithAudioElement(audioElement: HTMLAudioElement): boolean {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext()
      }

      // Crear analyser
      this.analyser = this.audioContext.createAnalyser()
      this.configureAnalyser()

      // Conectar elemento de audio
      this.source = this.audioContext.createMediaElementSource(audioElement)
      this.source.connect(this.analyser)
      this.analyser.connect(this.audioContext.destination) // Para que se escuche

      // Inicializar arrays
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
      this.waveformData = new Uint8Array(this.analyser.frequencyBinCount)

      logger.info('[AudioVisualizer] Inicializado con elemento de audio', {
        context: 'AudioVisualizerService',
      })

      return true
    } catch (error) {
      logger.error('[AudioVisualizer] Error inicializando con elemento de audio', error, {
        context: 'AudioVisualizerService',
      })
      return false
    }
  }

  /**
   * Configuración común del AudioContext
   */
  private initializeAudioContext(stream: MediaStream): boolean {
    try {
      // Crear AudioContext
      this.audioContext = new AudioContext()

      // Crear AnalyserNode
      this.analyser = this.audioContext.createAnalyser()
      this.configureAnalyser()

      // Crear source desde stream
      this.source = this.audioContext.createMediaStreamSource(stream)
      this.source.connect(this.analyser)

      // Inicializar arrays de datos
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
      this.waveformData = new Uint8Array(this.analyser.frequencyBinCount)

      logger.info('[AudioVisualizer] ✅ Inicializado correctamente', {
        context: 'AudioVisualizerService',
        data: { fftSize: this.config.fftSize },
      })

      return true
    } catch (error) {
      logger.error('[AudioVisualizer] Error inicializando', error, {
        context: 'AudioVisualizerService',
      })
      return false
    }
  }

  /**
   * Configurar AnalyserNode
   */
  private configureAnalyser(): void {
    if (!this.analyser) return

    this.analyser.fftSize = this.config.fftSize
    this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant
    this.analyser.minDecibels = this.config.minDecibels
    this.analyser.maxDecibels = this.config.maxDecibels
  }

  // ============================================================================
  // CONTROL
  // ============================================================================

  /**
   * Iniciar captura de datos
   */
  start(): void {
    if (this.isRunning || !this.analyser) return

    this.isRunning = true
    this.loop()

    logger.info('[AudioVisualizer] ▶️ Captura iniciada', { context: 'AudioVisualizerService' })
  }

  /**
   * Detener captura
   */
  stop(): void {
    this.isRunning = false

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    logger.info('[AudioVisualizer] ⏹️ Captura detenida', { context: 'AudioVisualizerService' })
  }

  /**
   * Loop de captura (60fps)
   */
  private loop = (): void => {
    if (!this.isRunning || !this.analyser || !this.frequencyData || !this.waveformData) return

    // Obtener datos
    this.analyser.getByteFrequencyData(this.frequencyData)
    this.analyser.getByteTimeDomainData(this.waveformData)

    // Calcular métricas
    const data = this.calculateMetrics()

    // Notificar callbacks
    this.callbacks.forEach(cb => {
      try {
        cb(data)
      } catch (error) {
        logger.error('[AudioVisualizer] Error en callback', error, {
          context: 'AudioVisualizerService',
        })
      }
    })

    // Siguiente frame
    this.animationFrameId = requestAnimationFrame(this.loop)
  }

  /**
   * Calcular métricas de audio
   */
  private calculateMetrics(): AudioVisualizerData {
    if (!this.frequencyData || !this.waveformData) {
      return {
        volume: 0,
        frequencyData: new Uint8Array(0),
        waveformData: new Uint8Array(0),
        peak: 0,
        bass: 0,
        mid: 0,
        treble: 0,
      }
    }

    // Calcular RMS (volumen)
    let sum = 0
    let peak = 0

    for (let i = 0; i < this.frequencyData.length; i++) {
      const normalized = this.frequencyData[i] / 255
      sum += normalized * normalized
      if (normalized > peak) peak = normalized
    }

    const volume = Math.sqrt(sum / this.frequencyData.length)

    // Calcular bandas de frecuencia
    const third = Math.floor(this.frequencyData.length / 3)
    
    // Bass (primero tercio)
    let bassSum = 0
    for (let i = 0; i < third; i++) {
      bassSum += this.frequencyData[i] / 255
    }
    const bass = bassSum / third

    // Mid (segundo tercio)
    let midSum = 0
    for (let i = third; i < third * 2; i++) {
      midSum += this.frequencyData[i] / 255
    }
    const mid = midSum / third

    // Treble (último tercio)
    let trebleSum = 0
    for (let i = third * 2; i < this.frequencyData.length; i++) {
      trebleSum += this.frequencyData[i] / 255
    }
    const treble = trebleSum / third

    return {
      volume,
      frequencyData: this.frequencyData,
      waveformData: this.waveformData,
      peak,
      bass,
      mid,
      treble,
    }
  }

  // ============================================================================
  // SUSCRIPCIÓN
  // ============================================================================

  /**
   * Suscribirse a datos de audio
   */
  subscribe(callback: AudioVisualizerCallback): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * Obtener datos actuales (snapshot)
   */
  getData(): AudioVisualizerData | null {
    if (!this.analyser || !this.frequencyData || !this.waveformData) return null

    this.analyser.getByteFrequencyData(this.frequencyData)
    this.analyser.getByteTimeDomainData(this.waveformData)

    return this.calculateMetrics()
  }

  // ============================================================================
  // LIMPIEZA
  // ============================================================================

  /**
   * Destruir servicio y liberar recursos
   */
  destroy(): void {
    this.stop()

    // Desconectar source
    if (this.source) {
      try {
        this.source.disconnect()
      } catch {
        // Ignorar
      }
      this.source = null
    }

    // Detener media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    // Cerrar AudioContext
    if (this.audioContext) {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }

    this.analyser = null
    this.callbacks.clear()

    logger.info('[AudioVisualizer] 🗑️ Destruido', { context: 'AudioVisualizerService' })
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Verificar si está corriendo
   */
  get running(): boolean {
    return this.isRunning
  }

  /**
   * Obtener configuración actual
   */
  getConfig(): Required<AudioVisualizerConfig> {
    return { ...this.config }
  }

  /**
   * Actualizar configuración
   */
  updateConfig(config: Partial<AudioVisualizerConfig>): void {
    this.config = { ...this.config, ...config }
    this.configureAnalyser()
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let visualizerInstance: AudioVisualizerService | null = null

export function getAudioVisualizer(config?: AudioVisualizerConfig): AudioVisualizerService {
  if (!visualizerInstance) {
    visualizerInstance = new AudioVisualizerService(config)
  }
  return visualizerInstance
}

export function destroyAudioVisualizer(): void {
  if (visualizerInstance) {
    visualizerInstance.destroy()
    visualizerInstance = null
  }
}

export default AudioVisualizerService
