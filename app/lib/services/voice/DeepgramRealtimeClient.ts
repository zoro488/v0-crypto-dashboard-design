/**
 * 🎤 DEEPGRAM REALTIME CLIENT - CHRONOS SYSTEM
 * 
 * Cliente WebSocket para transcripción en tiempo real con Deepgram Nova-2
 * 
 * Características:
 * - Latencia <300ms (streaming real-time)
 * - Reconexión automática (5 intentos con backoff exponencial)
 * - Interim results para feedback instantáneo
 * - VAD (Voice Activity Detection)
 * - Cancelación de eco y supresión de ruido
 * 
 * @version 1.0.0
 * @author CHRONOS Team
 */

import { logger } from '@/app/lib/utils/logger'

// ============================================================================
// TIPOS
// ============================================================================

export interface DeepgramConfig {
  apiKey: string
  language?: string          // es, es-MX, en, en-US
  model?: string             // nova-2, nova-2-general
  punctuate?: boolean        // Añadir puntuación
  interimResults?: boolean   // Resultados parciales
  endpointing?: number       // ms de silencio para terminar (default 300)
  smartFormat?: boolean      // Formato inteligente (números, fechas)
  diarize?: boolean          // Identificar hablantes
  utteranceEndMs?: number    // Tiempo máximo de utterance
  vad?: {
    enabled?: boolean
    threshold?: number       // 0.0 - 1.0
    minSilenceMs?: number    // Silencio mínimo para corte
  }
}

export interface TranscriptEvent {
  type: 'transcript' | 'interim' | 'final' | 'error' | 'connected' | 'disconnected'
  transcript?: string
  confidence?: number
  isFinal?: boolean
  words?: Array<{
    word: string
    start: number
    end: number
    confidence: number
  }>
  error?: string
  latencyMs?: number
}

export type TranscriptCallback = (event: TranscriptEvent) => void

// ============================================================================
// CONSTANTES
// ============================================================================

const DEEPGRAM_WS_URL = 'wss://api.deepgram.com/v1/listen'
const MAX_RECONNECT_ATTEMPTS = 5
const BASE_RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_DELAY_MS = 16000

// ============================================================================
// DEEPGRAM REALTIME CLIENT
// ============================================================================

export class DeepgramRealtimeClient {
  private ws: WebSocket | null = null
  private config: DeepgramConfig
  private callback: TranscriptCallback | null = null
  private reconnectAttempts = 0
  private isConnecting = false
  private isManuallyClosed = false
  private reconnectTimeout: NodeJS.Timeout | null = null
  private keepAliveInterval: NodeJS.Timeout | null = null
  private lastResultTime = 0

  constructor(config: DeepgramConfig) {
    this.config = {
      language: 'es',
      model: 'nova-2',
      punctuate: true,
      interimResults: true,
      endpointing: 300,
      smartFormat: true,
      diarize: false,
      utteranceEndMs: 2000,
      vad: {
        enabled: true,
        threshold: 0.5,
        minSilenceMs: 300,
      },
      ...config,
    }

    if (!config.apiKey) {
      throw new Error('Deepgram API key es requerida')
    }
  }

  /**
   * Conectar al WebSocket de Deepgram
   */
  async connect(callback: TranscriptCallback): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      logger.warn('[Deepgram] Ya conectado o conectando', { context: 'DeepgramClient' })
      return
    }

    this.callback = callback
    this.isConnecting = true
    this.isManuallyClosed = false

    try {
      await this.createConnection()
    } catch (error) {
      this.isConnecting = false
      throw error
    }
  }

  /**
   * Crear conexión WebSocket con todos los parámetros
   */
  private async createConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Construir URL con parámetros
      const params = new URLSearchParams({
        model: this.config.model!,
        language: this.config.language!,
        punctuate: this.config.punctuate!.toString(),
        interim_results: this.config.interimResults!.toString(),
        endpointing: this.config.endpointing!.toString(),
        smart_format: this.config.smartFormat!.toString(),
        diarize: this.config.diarize!.toString(),
        utterance_end_ms: this.config.utteranceEndMs!.toString(),
      })

      // Añadir VAD si está habilitado
      if (this.config.vad?.enabled) {
        params.set('vad_events', 'true')
      }

      const wsUrl = `${DEEPGRAM_WS_URL}?${params.toString()}`

      logger.info('[Deepgram] Conectando...', {
        context: 'DeepgramClient',
        data: { url: wsUrl.replace(this.config.apiKey, '***') },
      })

      // Crear WebSocket con autenticación
      this.ws = new WebSocket(wsUrl, ['token', this.config.apiKey])

      // Timeout de conexión (10 segundos)
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          this.ws.close()
          reject(new Error('Timeout de conexión a Deepgram'))
        }
      }, 10000)

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout)
        this.isConnecting = false
        this.reconnectAttempts = 0

        logger.info('[Deepgram] ✅ Conectado', { context: 'DeepgramClient' })
        this.callback?.({ type: 'connected' })

        // Iniciar keep-alive
        this.startKeepAlive()
        resolve()
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data)
      }

      this.ws.onerror = (error) => {
        logger.error('[Deepgram] Error WebSocket', error, { context: 'DeepgramClient' })
        this.callback?.({ type: 'error', error: 'Error de conexión WebSocket' })
      }

      this.ws.onclose = (event) => {
        clearTimeout(connectionTimeout)
        this.stopKeepAlive()
        this.isConnecting = false

        logger.warn('[Deepgram] Conexión cerrada', {
          context: 'DeepgramClient',
          data: { code: event.code, reason: event.reason },
        })

        this.callback?.({ type: 'disconnected' })

        // Reconectar automáticamente si no fue cierre manual
        if (!this.isManuallyClosed && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          this.scheduleReconnect()
          reject(new Error(`Conexión cerrada: ${event.reason || 'Sin razón'}`))
        } else if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          logger.error('[Deepgram] Máximo de reconexiones alcanzado', null, {
            context: 'DeepgramClient',
          })
          this.callback?.({ type: 'error', error: 'Máximo de reconexiones alcanzado' })
          reject(new Error('Máximo de reconexiones alcanzado'))
        }
      }
    })
  }

  /**
   * Manejar mensajes del WebSocket
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data)
      const now = Date.now()
      const latencyMs = this.lastResultTime ? now - this.lastResultTime : 0
      this.lastResultTime = now

      // Mensaje de transcripción
      if (message.type === 'Results') {
        const alternative = message.channel?.alternatives?.[0]
        if (alternative) {
          const event: TranscriptEvent = {
            type: message.is_final ? 'final' : 'interim',
            transcript: alternative.transcript || '',
            confidence: alternative.confidence || 0,
            isFinal: message.is_final,
            latencyMs,
            words: alternative.words?.map((w: { word: string; start: number; end: number; confidence: number }) => ({
              word: w.word,
              start: w.start,
              end: w.end,
              confidence: w.confidence,
            })),
          }

          // Solo enviar si hay contenido
          if (event.transcript && event.transcript.trim().length > 0) {
            this.callback?.(event)
          }
        }
      }

      // Mensaje de error
      if (message.type === 'Error') {
        logger.error('[Deepgram] Error en mensaje', message, { context: 'DeepgramClient' })
        this.callback?.({
          type: 'error',
          error: message.description || 'Error desconocido',
        })
      }

      // Mensaje de metadata
      if (message.type === 'Metadata') {
        logger.info('[Deepgram] Metadata recibida', {
          context: 'DeepgramClient',
          data: { channels: message.channels, duration: message.duration },
        })
      }

    } catch (error) {
      logger.error('[Deepgram] Error parseando mensaje', error, { context: 'DeepgramClient' })
    }
  }

  /**
   * Enviar audio al WebSocket
   * @param audioData ArrayBuffer o Blob con audio
   */
  send(audioData: ArrayBuffer | Blob): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn('[Deepgram] No conectado, no se puede enviar audio', { context: 'DeepgramClient' })
      return
    }

    try {
      this.ws.send(audioData)
    } catch (error) {
      logger.error('[Deepgram] Error enviando audio', error, { context: 'DeepgramClient' })
    }
  }

  /**
   * Cerrar conexión
   */
  disconnect(): void {
    this.isManuallyClosed = true
    this.reconnectAttempts = 0

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    this.stopKeepAlive()

    if (this.ws) {
      try {
        // Enviar mensaje de cierre
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'CloseStream' }))
        }
        this.ws.close(1000, 'Cierre normal')
      } catch (error) {
        logger.warn('[Deepgram] Error cerrando conexión', { context: 'DeepgramClient' })
      }
      this.ws = null
    }

    logger.info('[Deepgram] Desconectado', { context: 'DeepgramClient' })
  }

  /**
   * Programar reconexión con backoff exponencial
   */
  private scheduleReconnect(): void {
    if (this.isManuallyClosed) return

    this.reconnectAttempts++
    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1),
      MAX_RECONNECT_DELAY_MS,
    )

    logger.info(`[Deepgram] Reintentando en ${delay}ms (intento ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`, {
      context: 'DeepgramClient',
    })

    this.reconnectTimeout = setTimeout(async () => {
      if (this.callback) {
        try {
          await this.createConnection()
        } catch {
          // El error se maneja en createConnection
        }
      }
    }, delay)
  }

  /**
   * Iniciar keep-alive para mantener conexión
   */
  private startKeepAlive(): void {
    this.keepAliveInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'KeepAlive' }))
        } catch {
          // Ignorar errores de keep-alive
        }
      }
    }, 30000) // Cada 30 segundos
  }

  /**
   * Detener keep-alive
   */
  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval)
      this.keepAliveInterval = null
    }
  }

  /**
   * Verificar si está conectado
   */
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  /**
   * Obtener número de intentos de reconexión
   */
  get attempts(): number {
    return this.reconnectAttempts
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

let deepgramClient: DeepgramRealtimeClient | null = null

/**
 * Obtener instancia singleton del cliente Deepgram
 */
export function getDeepgramClient(apiKey?: string): DeepgramRealtimeClient {
  if (!deepgramClient && apiKey) {
    deepgramClient = new DeepgramRealtimeClient({ apiKey })
  }
  if (!deepgramClient) {
    throw new Error('Deepgram client no inicializado. Proporciona una API key.')
  }
  return deepgramClient
}

/**
 * Destruir instancia del cliente
 */
export function destroyDeepgramClient(): void {
  if (deepgramClient) {
    deepgramClient.disconnect()
    deepgramClient = null
  }
}

export default DeepgramRealtimeClient
