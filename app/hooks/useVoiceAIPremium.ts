/**
 * 🎤 useVoiceAIPremium - Hook de Voice AI con Error Handling Militar
 * 
 * Hook ultra-robusto que integra:
 * - Deepgram Nova-2 STT (<300ms latencia)
 * - ElevenLabs Turbo v2.5 TTS con emotion tags
 * - Retry automático con backoff exponencial
 * - Circuit breaker para servicios degradados
 * - Notificaciones contextuales de error
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useToast } from '@/app/hooks/use-toast'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { logger } from '@/app/lib/utils/logger'
import { 
  errorHandlingService, 
  withRetry, 
  type ChronosError,
} from '@/app/lib/services/error-handling.service'

// ============================================================================
// TIPOS
// ============================================================================

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
export type VoiceEmotion = 'neutral' | 'excited' | 'calm' | 'concerned' | 'professional'

export interface VoiceMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  emotion?: VoiceEmotion
}

export interface UseVoiceAIPremiumOptions {
  /** Reproducir respuestas automáticamente con TTS */
  autoSpeak?: boolean
  /** Idioma para STT (default: es-MX) */
  language?: string
  /** Emoción default para TTS */
  defaultEmotion?: VoiceEmotion
  /** Callback cuando hay comando reconocido */
  onCommand?: (text: string) => void
  /** Callback cuando hay respuesta de IA */
  onResponse?: (text: string, emotion?: VoiceEmotion) => void
  /** Callback en error */
  onError?: (error: ChronosError) => void
}

export interface UseVoiceAIPremiumReturn {
  // Estado
  state: VoiceState
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  isSupported: boolean
  transcript: string
  response: string
  error: ChronosError | null
  audioLevel: number
  
  // Historial
  messages: VoiceMessage[]
  
  // Acciones
  startListening: () => Promise<void>
  stopListening: () => void
  speak: (text: string, emotion?: VoiceEmotion) => Promise<void>
  cancelSpeech: () => void
  sendTextMessage: (text: string) => Promise<void>
  clearMessages: () => void
  reset: () => void
  
  // Estado de servicios
  servicesStatus: {
    stt: 'available' | 'degraded' | 'unavailable'
    tts: 'available' | 'degraded' | 'unavailable'
    ai: 'available' | 'degraded' | 'unavailable'
  }
}

// ============================================================================
// CONSTANTES
// ============================================================================

const SERVICES = {
  STT: 'voice-stt',
  TTS: 'voice-tts',
  AI: 'voice-ai',
} as const

// ============================================================================
// HOOK
// ============================================================================

export function useVoiceAIPremium(
  options: UseVoiceAIPremiumOptions = {},
): UseVoiceAIPremiumReturn {
  const {
    autoSpeak = true,
    language = 'es-MX',
    defaultEmotion = 'neutral',
    onCommand,
    onResponse,
    onError,
  } = options

  // Toast
  const { toast } = useToast()
  
  // Store
  const { setVoiceAgentStatus } = useAppStore()

  // Estado
  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [error, setError] = useState<ChronosError | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [servicesStatus, setServicesStatus] = useState({
    stt: 'available' as const,
    tts: 'available' as const,
    ai: 'available' as const,
  })

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const isMountedRef = useRef(true)

  // Derivados
  const isListening = state === 'listening'
  const isSpeaking = state === 'speaking'
  const isProcessing = state === 'processing'
  const isSupported = typeof window !== 'undefined' && 
    !!(navigator.mediaDevices?.getUserMedia)

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      cleanupAudio()
    }
  }, [])

  // Sync con store
  useEffect(() => {
    const storeStatus = state === 'listening' ? 'listening'
      : state === 'processing' ? 'thinking'
      : state === 'speaking' ? 'speaking'
      : 'idle'
    setVoiceAgentStatus(storeStatus)
  }, [state, setVoiceAgentStatus])

  // ============================================================================
  // HELPERS
  // ============================================================================

  const updateState = useCallback((newState: VoiceState) => {
    if (isMountedRef.current) {
      setState(newState)
    }
  }, [])

  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close().catch(() => {})
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    setAudioLevel(0)
  }, [])

  const handleError = useCallback((err: unknown, serviceName: string) => {
    const chronosError = errorHandlingService.create(err, { service: serviceName })
    
    if (isMountedRef.current) {
      setError(chronosError)
      updateState('error')
      
      // Actualizar estado del servicio
      const serviceKey = serviceName === SERVICES.STT ? 'stt'
        : serviceName === SERVICES.TTS ? 'tts'
        : 'ai'
      setServicesStatus(prev => ({ ...prev, [serviceKey]: 'degraded' }))
      
      // Toast
      const toastConfig = errorHandlingService.getToastConfig(chronosError)
      toast({
        title: toastConfig.title,
        description: toastConfig.description,
        variant: toastConfig.variant,
      })
      
      onError?.(chronosError)
    }
    
    logger.error(`[VoiceAIPremium] Error en ${serviceName}`, err, {
      context: 'useVoiceAIPremium',
    })
    
    // Recuperar después de 3 segundos
    setTimeout(() => {
      if (isMountedRef.current) {
        setError(null)
        updateState('idle')
      }
    }, 3000)
  }, [toast, onError, updateState])

  // ============================================================================
  // ANÁLISIS DE AUDIO
  // ============================================================================

  const startAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

      const updateLevel = () => {
        if (!analyserRef.current || !isMountedRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setAudioLevel(average / 255)
        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }

      updateLevel()
    } catch {
      logger.warn('[VoiceAIPremium] Audio analysis no disponible', {
        context: 'useVoiceAIPremium',
      })
    }
  }, [])

  // ============================================================================
  // STT - TRANSCRIPCIÓN
  // ============================================================================

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    return withRetry(async () => {
      // Convertir a base64
      const arrayBuffer = await audioBlob.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64 = btoa(binary)

      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: base64,
          language,
          format: audioBlob.type.split('/')[1] || 'webm',
        }),
      })

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`)
      }

      const result = await response.json()
      return result.text
    }, SERVICES.STT, { maxRetries: 2 })
  }, [language])

  // ============================================================================
  // TTS - SÍNTESIS
  // ============================================================================

  const synthesizeAndPlay = useCallback(async (
    text: string,
    emotion: VoiceEmotion = defaultEmotion,
  ): Promise<void> => {
    return withRetry(async () => {
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: 'chronos',
          emotion,
        }),
      })

      if (!response.ok) {
        throw new Error(`Synthesis failed: ${response.status}`)
      }

      const result = await response.json()
      
      // Crear blob de audio
      const byteCharacters = atob(result.audio)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const audioBlob = new Blob([new Uint8Array(byteNumbers)], { 
        type: `audio/${result.format}`,
      })
      const audioUrl = URL.createObjectURL(audioBlob)

      // Reproducir
      return new Promise<void>((resolve, reject) => {
        const audio = new Audio(audioUrl)
        currentAudioRef.current = audio
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          currentAudioRef.current = null
          resolve()
        }
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl)
          currentAudioRef.current = null
          reject(new Error('Error reproduciendo audio'))
        }
        
        audio.play().catch(reject)
      })
    }, SERVICES.TTS, { maxRetries: 2 })
  }, [defaultEmotion])

  // ============================================================================
  // AI PROCESSING
  // ============================================================================

  const processWithAI = useCallback(async (text: string): Promise<{ content: string; emotion: VoiceEmotion }> => {
    return withRetry(async () => {
      const response = await fetch('/api/ai/conversational', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
        }),
      })

      if (!response.ok) {
        throw new Error(`AI processing failed: ${response.status}`)
      }

      // Leer respuesta (puede ser stream)
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let content = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          content += decoder.decode(value, { stream: true })
        }
      } else {
        const json = await response.json()
        content = json.content || json.text || ''
      }

      // Determinar emoción basada en contenido
      let emotion: VoiceEmotion = 'neutral'
      const lowerContent = content.toLowerCase()
      if (lowerContent.includes('excelente') || lowerContent.includes('felicidades') || lowerContent.includes('!')) {
        emotion = 'excited'
      } else if (lowerContent.includes('error') || lowerContent.includes('problema') || lowerContent.includes('atención')) {
        emotion = 'concerned'
      } else if (lowerContent.includes('recomiendo') || lowerContent.includes('análisis')) {
        emotion = 'professional'
      }

      return { content, emotion }
    }, SERVICES.AI, { maxRetries: 2 })
  }, [])

  // ============================================================================
  // ACCIONES PÚBLICAS
  // ============================================================================

  const startListening = useCallback(async () => {
    if (!isSupported) {
      handleError(new Error('Grabación de audio no soportada'), SERVICES.STT)
      return
    }

    try {
      setError(null)
      updateState('listening')
      audioChunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      })

      startAudioAnalysis(stream)

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
        stream.getTracks().forEach(track => track.stop())
        cleanupAudio()

        if (audioChunksRef.current.length === 0) {
          updateState('idle')
          return
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })

        try {
          updateState('processing')
          
          // 1. Transcribir
          const transcribedText = await transcribeAudio(audioBlob)
          if (!isMountedRef.current) return
          
          setTranscript(transcribedText)
          onCommand?.(transcribedText)

          // Agregar mensaje del usuario
          const userMessage: VoiceMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: transcribedText,
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, userMessage])

          // 2. Procesar con AI
          const aiResult = await processWithAI(transcribedText)
          if (!isMountedRef.current) return

          setResponse(aiResult.content)
          onResponse?.(aiResult.content, aiResult.emotion)

          // Agregar mensaje del asistente
          const assistantMessage: VoiceMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: aiResult.content,
            timestamp: new Date(),
            emotion: aiResult.emotion,
          }
          setMessages(prev => [...prev, assistantMessage])

          // 3. Sintetizar y reproducir
          if (autoSpeak) {
            updateState('speaking')
            await synthesizeAndPlay(aiResult.content, aiResult.emotion)
          }

          updateState('idle')

        } catch (err) {
          handleError(err, SERVICES.STT)
        }
      }

      mediaRecorderRef.current.start(100)

      logger.info('[VoiceAIPremium] Grabación iniciada', {
        context: 'useVoiceAIPremium',
      })

    } catch (err) {
      handleError(err, SERVICES.STT)
    }
  }, [
    isSupported,
    startAudioAnalysis,
    cleanupAudio,
    transcribeAudio,
    processWithAI,
    synthesizeAndPlay,
    autoSpeak,
    handleError,
    onCommand,
    onResponse,
    updateState,
  ])

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop()
    }
    cleanupAudio()
  }, [cleanupAudio])

  const speak = useCallback(async (text: string, emotion?: VoiceEmotion) => {
    if (!text) return

    try {
      setError(null)
      updateState('speaking')
      await synthesizeAndPlay(text, emotion || defaultEmotion)
      updateState('idle')
    } catch (err) {
      handleError(err, SERVICES.TTS)
    }
  }, [synthesizeAndPlay, defaultEmotion, handleError, updateState])

  const cancelSpeech = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    updateState('idle')
  }, [updateState])

  const sendTextMessage = useCallback(async (text: string) => {
    if (!text.trim()) return

    try {
      setError(null)
      setTranscript(text)
      onCommand?.(text)

      // Agregar mensaje del usuario
      const userMessage: VoiceMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, userMessage])

      updateState('processing')

      const aiResult = await processWithAI(text)
      if (!isMountedRef.current) return

      setResponse(aiResult.content)
      onResponse?.(aiResult.content, aiResult.emotion)

      // Agregar mensaje del asistente
      const assistantMessage: VoiceMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: aiResult.content,
        timestamp: new Date(),
        emotion: aiResult.emotion,
      }
      setMessages(prev => [...prev, assistantMessage])

      if (autoSpeak) {
        updateState('speaking')
        await synthesizeAndPlay(aiResult.content, aiResult.emotion)
      }

      updateState('idle')

    } catch (err) {
      handleError(err, SERVICES.AI)
    }
  }, [processWithAI, synthesizeAndPlay, autoSpeak, handleError, onCommand, onResponse, updateState])

  const clearMessages = useCallback(() => {
    setMessages([])
    setTranscript('')
    setResponse('')
  }, [])

  const reset = useCallback(() => {
    cleanupAudio()
    setMessages([])
    setTranscript('')
    setResponse('')
    setError(null)
    updateState('idle')
    setServicesStatus({
      stt: 'available',
      tts: 'available',
      ai: 'available',
    })
  }, [cleanupAudio, updateState])

  // ============================================================================
  // RETORNO
  // ============================================================================

  return {
    // Estado
    state,
    isListening,
    isSpeaking,
    isProcessing,
    isSupported,
    transcript,
    response,
    error,
    audioLevel,
    
    // Historial
    messages,
    
    // Acciones
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    sendTextMessage,
    clearMessages,
    reset,
    
    // Estado de servicios
    servicesStatus,
  }
}

export default useVoiceAIPremium
