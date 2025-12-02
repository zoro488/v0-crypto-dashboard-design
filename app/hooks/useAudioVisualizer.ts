/**
 * 🎵 useAudioVisualizer - Hook de React para visualización de audio
 * 
 * Hook que proporciona datos de audio en tiempo real para visualizaciones
 * 
 * Características:
 * - Captura de micrófono automática
 * - Datos a 60fps
 * - Volumen, frecuencias y waveform
 * - Limpieza automática en unmount
 * 
 * @example
 * const { volume, isActive, start, stop } = useAudioVisualizer()
 * // volume = 0.0 - 1.0
 * 
 * @version 1.0.0
 * @author CHRONOS Team
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  AudioVisualizerService, 
  AudioVisualizerData, 
  AudioVisualizerConfig,
  getAudioVisualizer,
} from '@/app/lib/services/audio/AudioVisualizerService'
import { logger } from '@/app/lib/utils/logger'

// ============================================================================
// TIPOS
// ============================================================================

export interface UseAudioVisualizerOptions extends AudioVisualizerConfig {
  autoStart?: boolean       // Iniciar automáticamente al montar
  source?: 'microphone' | 'element'  // Fuente de audio
  audioElement?: HTMLAudioElement | null  // Elemento de audio si source='element'
}

export interface UseAudioVisualizerReturn {
  // Estado
  isActive: boolean
  isInitialized: boolean
  error: string | null
  
  // Datos de audio
  volume: number           // 0.0 - 1.0
  peak: number             // 0.0 - 1.0
  bass: number             // 0.0 - 1.0
  mid: number              // 0.0 - 1.0
  treble: number           // 0.0 - 1.0
  frequencyData: Uint8Array | null
  waveformData: Uint8Array | null
  
  // Acciones
  start: () => Promise<boolean>
  stop: () => void
  toggle: () => Promise<void>
}

// ============================================================================
// HOOK
// ============================================================================

export function useAudioVisualizer(
  options: UseAudioVisualizerOptions = {},
): UseAudioVisualizerReturn {
  const {
    autoStart = false,
    source = 'microphone',
    audioElement = null,
    ...config
  } = options

  // Estados
  const [isActive, setIsActive] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioData, setAudioData] = useState<AudioVisualizerData | null>(null)

  // Refs
  const serviceRef = useRef<AudioVisualizerService | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Inicializar servicio
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)

      // Crear servicio si no existe
      if (!serviceRef.current) {
        serviceRef.current = new AudioVisualizerService(config)
      }

      let success = false

      if (source === 'microphone') {
        success = await serviceRef.current.initWithMicrophone()
      } else if (source === 'element' && audioElement) {
        success = serviceRef.current.initWithAudioElement(audioElement)
      } else {
        throw new Error('Fuente de audio inválida o elemento no proporcionado')
      }

      if (success) {
        setIsInitialized(true)
        logger.info('[useAudioVisualizer] ✅ Inicializado', { 
          context: 'useAudioVisualizer', 
          data: { source },
        })
      }

      return success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      logger.error('[useAudioVisualizer] Error inicializando', err, { 
        context: 'useAudioVisualizer',
      })
      return false
    }
  }, [source, audioElement, config])

  // Iniciar captura
  const start = useCallback(async (): Promise<boolean> => {
    if (isActive) return true

    // Inicializar si es necesario
    if (!isInitialized) {
      const success = await initialize()
      if (!success) return false
    }

    // Suscribirse a datos
    if (serviceRef.current) {
      unsubscribeRef.current = serviceRef.current.subscribe((data) => {
        setAudioData(data)
      })

      serviceRef.current.start()
      setIsActive(true)
      logger.info('[useAudioVisualizer] ▶️ Captura iniciada', { context: 'useAudioVisualizer' })
      return true
    }

    return false
  }, [isActive, isInitialized, initialize])

  // Detener captura
  const stop = useCallback((): void => {
    if (serviceRef.current) {
      serviceRef.current.stop()
    }

    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    setIsActive(false)
    setAudioData(null)
    logger.info('[useAudioVisualizer] ⏹️ Captura detenida', { context: 'useAudioVisualizer' })
  }, [])

  // Toggle
  const toggle = useCallback(async (): Promise<void> => {
    if (isActive) {
      stop()
    } else {
      await start()
    }
  }, [isActive, start, stop])

  // Auto-start si está configurado
  useEffect(() => {
    if (autoStart) {
      start()
    }
  }, [autoStart, start])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      if (serviceRef.current) {
        serviceRef.current.destroy()
        serviceRef.current = null
      }
    }
  }, [])

  // Retorno
  return {
    // Estado
    isActive,
    isInitialized,
    error,
    
    // Datos de audio
    volume: audioData?.volume ?? 0,
    peak: audioData?.peak ?? 0,
    bass: audioData?.bass ?? 0,
    mid: audioData?.mid ?? 0,
    treble: audioData?.treble ?? 0,
    frequencyData: audioData?.frequencyData ?? null,
    waveformData: audioData?.waveformData ?? null,
    
    // Acciones
    start,
    stop,
    toggle,
  }
}

export default useAudioVisualizer
