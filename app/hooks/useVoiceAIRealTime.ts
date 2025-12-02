/**
 * 🎤 useVoiceAI Hook - Real-Time Voice Interaction
 * 
 * Hook para integrar interacción por voz con el sistema CHRONOS:
 * - Grabación de audio
 * - Transcripción en tiempo real
 * - Respuestas de voz
 * - Comandos de voz para acciones
 * 
 * @example
 * ```tsx
 * const { 
 *   isListening, 
 *   startListening, 
 *   stopListening,
 *   transcript,
 *   speak 
 * } = useVoiceAI()
 * 
 * <button onClick={isListening ? stopListening : startListening}>
 *   {isListening ? '🔴 Grabando...' : '🎤 Hablar'}
 * </button>
 * ```
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { VoiceAgent, type VoiceAgentState, isAudioRecordingSupported } from '@/app/lib/ai/voice'
import { logger } from '@/app/lib/utils/logger'

// =====================================================================
// TIPOS
// =====================================================================

export interface UseVoiceAIOptions {
  /** Reproducir respuestas automáticamente */
  autoSpeak?: boolean
  /** Idioma para reconocimiento */
  language?: string
  /** Callback cuando se detecta comando */
  onCommand?: (text: string) => void
  /** Callback cuando hay respuesta */
  onResponse?: (text: string) => void
  /** Callback en error */
  onError?: (error: Error) => void
}

export interface UseVoiceAIReturn {
  // Estado
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  isSupported: boolean
  status: VoiceAgentState['status']
  transcript: string
  response: string
  error: string | null
  
  // Acciones
  startListening: () => Promise<void>
  stopListening: () => Promise<void>
  toggleListening: () => Promise<void>
  speak: (text: string) => Promise<void>
  cancelSpeech: () => void
  reset: () => void
  
  // Audio Levels (para visualización)
  audioLevel: number
}

// =====================================================================
// HOOK
// =====================================================================

export function useVoiceAI(options: UseVoiceAIOptions = {}): UseVoiceAIReturn {
  const {
    autoSpeak = true,
    language = 'es-MX',
    onCommand,
    onResponse,
    onError,
  } = options

  // Estado
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<VoiceAgentState['status']>('idle')
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)

  // Refs
  const voiceAgentRef = useRef<VoiceAgent | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Verificar soporte
  const isSupported = typeof window !== 'undefined' && isAudioRecordingSupported()

  // Inicializar VoiceAgent
  useEffect(() => {
    voiceAgentRef.current = new VoiceAgent({
      onStateChange: (state) => {
        setStatus(state.status)
        setTranscript(state.transcript)
        setResponse(state.response)
        setIsListening(state.isListening)
        setIsSpeaking(state.isSpeaking)
        if (state.error) setError(state.error)
      },
    })

    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Analizar nivel de audio (para visualización)
  const startAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

      const updateLevel = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setAudioLevel(average / 255)
        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }

      updateLevel()
    } catch (err) {
      logger.warn('Audio analysis not available', { context: 'useVoiceAI' })
    }
  }, [])

  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    setAudioLevel(0)
  }, [])

  // Iniciar grabación
  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Grabación de audio no soportada')
      onError?.(new Error('Audio recording not supported'))
      return
    }

    try {
      setError(null)
      setIsListening(true)
      setStatus('listening')
      audioChunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Iniciar análisis de audio
      startAudioAnalysis(stream)

      // Configurar MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4'
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType })

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        // Detener stream
        stream.getTracks().forEach(track => track.stop())
        stopAudioAnalysis()

        if (audioChunksRef.current.length === 0) {
          setIsListening(false)
          setStatus('idle')
          return
        }

        // Crear blob de audio
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        
        try {
          setIsProcessing(true)
          setStatus('processing')

          // Procesar con VoiceAgent
          const responseText = await voiceAgentRef.current?.processVoiceCommand(audioBlob)
          
          if (responseText) {
            onCommand?.(transcript)
            onResponse?.(responseText)
          }

        } catch (err) {
          const errorMsg = (err as Error).message
          setError(errorMsg)
          onError?.(err as Error)
          logger.error('Error procesando voz', err as Error, { context: 'useVoiceAI' })
        } finally {
          setIsProcessing(false)
          setIsListening(false)
          setStatus('idle')
        }
      }

      mediaRecorderRef.current.start(100) // Chunks de 100ms

      logger.info('Grabación iniciada', { context: 'useVoiceAI' })

    } catch (err) {
      const errorMsg = (err as Error).message
      setError(errorMsg)
      setIsListening(false)
      setStatus('error')
      onError?.(err as Error)
      logger.error('Error iniciando grabación', err as Error, { context: 'useVoiceAI' })
    }
  }, [isSupported, startAudioAnalysis, stopAudioAnalysis, transcript, onCommand, onResponse, onError])

  // Detener grabación
  const stopListening = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    stopAudioAnalysis()
    setIsListening(false)
    logger.info('Grabación detenida', { context: 'useVoiceAI' })
  }, [stopAudioAnalysis])

  // Toggle
  const toggleListening = useCallback(async () => {
    if (isListening) {
      await stopListening()
    } else {
      await startListening()
    }
  }, [isListening, startListening, stopListening])

  // Sintetizar voz
  const speak = useCallback(async (text: string) => {
    if (!text) return

    try {
      setIsSpeaking(true)
      setStatus('speaking')

      const voiceService = await import('@/app/lib/ai/voice').then(m => m.voiceService)
      const result = await voiceService.synthesize(text)
      
      // Reproducir audio
      const audio = new Audio(result.audioUrl)
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve()
        audio.onerror = reject
        audio.play().catch(reject)
      })

      URL.revokeObjectURL(result.audioUrl)

    } catch (err) {
      logger.error('Error sintetizando voz', err as Error, { context: 'useVoiceAI' })
      // No es crítico, continuar sin error
    } finally {
      setIsSpeaking(false)
      setStatus('idle')
    }
  }, [])

  // Cancelar síntesis
  const cancelSpeech = useCallback(() => {
    // En una implementación completa, cancelaríamos el audio
    setIsSpeaking(false)
    setStatus('idle')
  }, [])

  // Reset
  const reset = useCallback(() => {
    voiceAgentRef.current?.reset()
    setIsListening(false)
    setIsSpeaking(false)
    setIsProcessing(false)
    setStatus('idle')
    setTranscript('')
    setResponse('')
    setError(null)
    setAudioLevel(0)
  }, [])

  return {
    // Estado
    isListening,
    isSpeaking,
    isProcessing,
    isSupported,
    status,
    transcript,
    response,
    error,
    audioLevel,
    
    // Acciones
    startListening,
    stopListening,
    toggleListening,
    speak,
    cancelSpeech,
    reset,
  }
}

export default useVoiceAI
