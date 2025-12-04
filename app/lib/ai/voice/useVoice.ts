/**
 * 🎤 USE VOICE - Hook React para Voz Conversacional
 * 
 * Hook unificado para STT (Deepgram) + TTS (ElevenLabs)
 * con manejo completo de estado y errores.
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { logger } from '@/app/lib/utils/logger'
import { 
  DeepgramSTTClient, 
  WebSpeechFallback, 
  type DeepgramConfig, 
  type DeepgramState 
} from './deepgram'
import { 
  ElevenLabsTTSClient, 
  detectEmotion, 
  type ElevenLabsConfig, 
  type ElevenLabsState,
  type VoiceEmotion 
} from './elevenlabs'

// =====================================================================
// TIPOS
// =====================================================================

export interface UseVoiceConfig {
  stt?: DeepgramConfig
  tts?: ElevenLabsConfig
  autoDetectEmotion?: boolean
  useFallback?: boolean
}

export interface UseVoiceReturn {
  // Estado
  isListening: boolean
  isSpeaking: boolean
  sttState: DeepgramState
  ttsState: ElevenLabsState
  transcript: string
  interimTranscript: string
  error: Error | null
  
  // Acciones STT
  startListening: () => Promise<void>
  stopListening: () => void
  resetTranscript: () => void
  
  // Acciones TTS
  speak: (text: string, emotion?: VoiceEmotion) => Promise<void>
  stopSpeaking: () => void
  
  // Conversación
  askAndListen: (prompt: string, emotion?: VoiceEmotion) => Promise<string>
}

// =====================================================================
// HOOK PRINCIPAL
// =====================================================================

export function useVoice(config: UseVoiceConfig = {}): UseVoiceReturn {
  // Estado
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [sttState, setSttState] = useState<DeepgramState>('idle')
  const [ttsState, setTtsState] = useState<ElevenLabsState>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<Error | null>(null)
  
  // Refs para clientes
  const sttClientRef = useRef<DeepgramSTTClient | null>(null)
  const ttsClientRef = useRef<ElevenLabsTTSClient | null>(null)
  const webSpeechRef = useRef<WebSpeechFallback | null>(null)
  const usingFallbackRef = useRef(false)
  
  // ─────────────────────────────────────────────────────────────────────
  // INICIALIZACIÓN
  // ─────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    // Inicializar cliente TTS
    ttsClientRef.current = new ElevenLabsTTSClient({
      ...config.tts,
      onAudioStart: () => setIsSpeaking(true),
      onAudioEnd: () => setIsSpeaking(false),
      onError: (err) => {
        setError(err)
        setIsSpeaking(false)
      },
    })
    
    // Cleanup
    return () => {
      sttClientRef.current?.stop()
      ttsClientRef.current?.stop()
      webSpeechRef.current?.stop()
    }
  }, [config.tts])
  
  // ─────────────────────────────────────────────────────────────────────
  // CALLBACKS STT
  // ─────────────────────────────────────────────────────────────────────
  
  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      setTranscript(prev => prev ? `${prev} ${text}` : text)
      setInterimTranscript('')
    } else {
      setInterimTranscript(text)
    }
  }, [])
  
  const handleSttError = useCallback((err: Error) => {
    setError(err)
    setIsListening(false)
    
    // Intentar fallback si está habilitado
    if (config.useFallback !== false) {
      logger.warn('[useVoice] Activando Web Speech fallback', { context: 'useVoice' })
      usingFallbackRef.current = true
      
      webSpeechRef.current = new WebSpeechFallback(
        handleTranscript,
        (fallbackErr) => {
          setError(fallbackErr)
          setIsListening(false)
        }
      )
      webSpeechRef.current.start()
      setIsListening(true)
    }
  }, [config.useFallback, handleTranscript])
  
  const handleStateChange = useCallback((state: DeepgramState) => {
    setSttState(state)
    setIsListening(state === 'listening')
  }, [])
  
  // ─────────────────────────────────────────────────────────────────────
  // ACCIONES STT
  // ─────────────────────────────────────────────────────────────────────
  
  const startListening = useCallback(async () => {
    try {
      setError(null)
      usingFallbackRef.current = false
      
      // Crear nuevo cliente STT
      sttClientRef.current = new DeepgramSTTClient({
        ...config.stt,
        onTranscript: handleTranscript,
        onError: handleSttError,
        onStateChange: handleStateChange,
      })
      
      await sttClientRef.current.start()
      
      logger.info('[useVoice] Escucha iniciada', { context: 'useVoice' })
      
    } catch (err) {
      handleSttError(err as Error)
    }
  }, [config.stt, handleTranscript, handleSttError, handleStateChange])
  
  const stopListening = useCallback(() => {
    if (usingFallbackRef.current) {
      webSpeechRef.current?.stop()
    } else {
      sttClientRef.current?.stop()
    }
    setIsListening(false)
    setSttState('idle')
    
    logger.info('[useVoice] Escucha detenida', { context: 'useVoice' })
  }, [])
  
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])
  
  // ─────────────────────────────────────────────────────────────────────
  // ACCIONES TTS
  // ─────────────────────────────────────────────────────────────────────
  
  const speak = useCallback(async (text: string, emotion?: VoiceEmotion) => {
    if (!ttsClientRef.current) {
      logger.error('[useVoice] Cliente TTS no inicializado', new Error('TTS not initialized'), { context: 'useVoice' })
      return
    }
    
    try {
      setError(null)
      
      // Auto-detectar emoción si está habilitado
      const finalEmotion = emotion || (config.autoDetectEmotion !== false ? detectEmotion(text) : 'neutral')
      
      await ttsClientRef.current.speak(text, finalEmotion)
      
    } catch (err) {
      setError(err as Error)
    }
  }, [config.autoDetectEmotion])
  
  const stopSpeaking = useCallback(() => {
    ttsClientRef.current?.stop()
    setIsSpeaking(false)
  }, [])
  
  // ─────────────────────────────────────────────────────────────────────
  // CONVERSACIÓN
  // ─────────────────────────────────────────────────────────────────────
  
  const askAndListen = useCallback(async (prompt: string, emotion?: VoiceEmotion): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. Reproducir prompt
        await speak(prompt, emotion)
        
        // 2. Esperar un momento
        await new Promise(r => setTimeout(r, 500))
        
        // 3. Iniciar escucha
        resetTranscript()
        await startListening()
        
        // 4. Escuchar por silencio (timeout de 5 segundos sin habla)
        let lastTranscript = ''
        let silenceCount = 0
        
        const checkInterval = setInterval(() => {
          const currentTranscript = transcript
          
          if (currentTranscript === lastTranscript && currentTranscript) {
            silenceCount++
            if (silenceCount >= 10) { // 5 segundos de silencio
              clearInterval(checkInterval)
              stopListening()
              resolve(currentTranscript)
            }
          } else {
            silenceCount = 0
            lastTranscript = currentTranscript
          }
        }, 500)
        
        // Timeout máximo de 30 segundos
        setTimeout(() => {
          clearInterval(checkInterval)
          stopListening()
          resolve(transcript || '')
        }, 30000)
        
      } catch (err) {
        reject(err)
      }
    })
  }, [speak, startListening, stopListening, resetTranscript, transcript])
  
  // ─────────────────────────────────────────────────────────────────────
  // RETURN
  // ─────────────────────────────────────────────────────────────────────
  
  return {
    // Estado
    isListening,
    isSpeaking,
    sttState,
    ttsState,
    transcript,
    interimTranscript,
    error,
    
    // Acciones STT
    startListening,
    stopListening,
    resetTranscript,
    
    // Acciones TTS
    speak,
    stopSpeaking,
    
    // Conversación
    askAndListen,
  }
}

// =====================================================================
// HOOK SIMPLIFICADO PARA SOLO STT
// =====================================================================

export function useVoiceRecognition(config?: DeepgramConfig) {
  const voice = useVoice({ stt: config })
  
  return {
    isListening: voice.isListening,
    state: voice.sttState,
    transcript: voice.transcript,
    interimTranscript: voice.interimTranscript,
    error: voice.error,
    startListening: voice.startListening,
    stopListening: voice.stopListening,
    resetTranscript: voice.resetTranscript,
  }
}

// =====================================================================
// HOOK SIMPLIFICADO PARA SOLO TTS
// =====================================================================

export function useTextToSpeech(config?: ElevenLabsConfig) {
  const voice = useVoice({ tts: config })
  
  return {
    isSpeaking: voice.isSpeaking,
    state: voice.ttsState,
    error: voice.error,
    speak: voice.speak,
    stopSpeaking: voice.stopSpeaking,
  }
}

export default useVoice
