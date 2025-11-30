'use client'

/**
 * useVoiceInput - Hook para reconocimiento de voz usando Web Speech API
 * 
 * Este hook proporciona:
 * - Reconocimiento de voz en tiempo real
 * - Transcripción continua
 * - Detección de amplitud de audio
 * - Comandos de voz predefinidos
 * - Síntesis de voz para respuestas
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface VoiceCommand {
  trigger: string[] // Palabras o frases que activan el comando
  action: string    // ID de la acción a ejecutar
  description?: string
}

export interface UseVoiceInputOptions {
  language?: string              // Idioma (default: 'es-ES')
  continuous?: boolean           // Reconocimiento continuo
  interimResults?: boolean       // Resultados intermedios
  commands?: VoiceCommand[]      // Comandos de voz
  onCommand?: (action: string) => void  // Callback cuando se detecta comando
  onTranscript?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
  maxSilenceMs?: number          // Tiempo máximo de silencio antes de parar
}

export interface UseVoiceInputReturn {
  // Estado
  isListening: boolean
  isSupported: boolean
  transcript: string
  interimTranscript: string
  amplitude: number              // 0-1 intensidad de audio
  error: string | null
  
  // Controles
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
  resetTranscript: () => void
  
  // Síntesis de voz
  speak: (text: string, options?: SpeechOptions) => void
  stopSpeaking: () => void
  isSpeaking: boolean
}

export interface SpeechOptions {
  rate?: number      // 0.1-10
  pitch?: number     // 0-2
  volume?: number    // 0-1
  voice?: string     // Nombre de la voz
  lang?: string      // Idioma
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS GLOBALES PARA WEB SPEECH API
// ═══════════════════════════════════════════════════════════════════════════════

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  isFinal: boolean
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  onstart: () => void
  onend: () => void
  onspeechstart: () => void
  onspeechend: () => void
  onaudiostart: () => void
  onaudioend: () => void
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Obtener constructor de SpeechRecognition
// ═══════════════════════════════════════════════════════════════════════════════

function getSpeechRecognition(): (new () => ISpeechRecognition) | null {
  if (typeof window === 'undefined') return null
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionConstructor = (window as any).SpeechRecognition || 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).webkitSpeechRecognition
    
  return SpeechRecognitionConstructor || null
}

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null
  return window.speechSynthesis || null
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    language = 'es-ES',
    continuous = true,
    interimResults = true,
    commands = [],
    onCommand,
    onTranscript,
    onError,
    maxSilenceMs = 3000,
  } = options
  
  // Estado
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [amplitude, setAmplitude] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // Refs
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  // Check si es soportado
  const isSupported = useMemo(() => {
    return getSpeechRecognition() !== null
  }, [])
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // ANÁLISIS DE AUDIO PARA AMPLITUD
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      
      const updateAmplitude = () => {
        if (!analyserRef.current) return
        
        analyserRef.current.getByteFrequencyData(dataArray)
        
        // Calcular promedio normalizado (0-1)
        const sum = dataArray.reduce((a, b) => a + b, 0)
        const avg = sum / dataArray.length
        const normalized = Math.min(avg / 128, 1)
        
        setAmplitude(normalized)
        
        animationFrameRef.current = requestAnimationFrame(updateAmplitude)
      }
      
      updateAmplitude()
    } catch (err) {
      const errorMsg = 'No se pudo acceder al micrófono'
      setError(errorMsg)
      onError?.(errorMsg)
    }
  }, [onError])
  
  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    
    analyserRef.current = null
    setAmplitude(0)
  }, [])
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // DETECCIÓN DE COMANDOS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const detectCommand = useCallback((text: string) => {
    const normalizedText = text.toLowerCase().trim()
    
    for (const command of commands) {
      for (const trigger of command.trigger) {
        if (normalizedText.includes(trigger.toLowerCase())) {
          onCommand?.(command.action)
          return true
        }
      }
    }
    
    return false
  }, [commands, onCommand])
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // INICIAR RECONOCIMIENTO
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const startListening = useCallback(() => {
    if (!isSupported) {
      const errorMsg = 'Reconocimiento de voz no soportado en este navegador'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }
    
    setError(null)
    
    const SpeechRecognitionConstructor = getSpeechRecognition()
    if (!SpeechRecognitionConstructor) return
    
    recognitionRef.current = new SpeechRecognitionConstructor()
    const recognition = recognitionRef.current
    
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = language
    recognition.maxAlternatives = 1
    
    // Evento: resultado de reconocimiento
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interim = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        
        if (result.isFinal) {
          finalTranscript += text
          
          // Detectar comandos
          detectCommand(text)
          
          // Callback
          onTranscript?.(text, true)
        } else {
          interim += text
        }
      }
      
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript)
      }
      
      setInterimTranscript(interim)
      
      if (interim) {
        onTranscript?.(interim, false)
      }
      
      // Reset timeout de silencio
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
      
      if (maxSilenceMs > 0) {
        silenceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && isListening) {
            // Reiniciar si es continuo
            if (continuous) {
              recognitionRef.current.stop()
              setTimeout(() => {
                if (recognitionRef.current) {
                  try {
                    recognitionRef.current.start()
                  } catch {
                    // Ignorar error si ya está iniciado
                  }
                }
              }, 100)
            }
          }
        }, maxSilenceMs)
      }
    }
    
    // Evento: error
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessages: Record<string, string> = {
        'not-allowed': 'Permiso de micrófono denegado',
        'no-speech': 'No se detectó voz',
        'network': 'Error de red',
        'audio-capture': 'No se encontró micrófono',
        'aborted': 'Reconocimiento abortado',
        'service-not-allowed': 'Servicio no permitido',
      }
      
      const errorMsg = errorMessages[event.error] || `Error: ${event.error}`
      
      // No reportar error de no-speech como crítico
      if (event.error !== 'no-speech') {
        setError(errorMsg)
        onError?.(errorMsg)
      }
    }
    
    // Evento: inicio
    recognition.onstart = () => {
      setIsListening(true)
      startAudioAnalysis()
    }
    
    // Evento: fin
    recognition.onend = () => {
      if (continuous && isListening) {
        // Reiniciar automáticamente si es continuo
        try {
          recognition.start()
        } catch {
          setIsListening(false)
          stopAudioAnalysis()
        }
      } else {
        setIsListening(false)
        stopAudioAnalysis()
      }
    }
    
    // Iniciar
    try {
      recognition.start()
    } catch (err) {
      const errorMsg = 'Error al iniciar reconocimiento de voz'
      setError(errorMsg)
      onError?.(errorMsg)
    }
  }, [
    isSupported, 
    continuous, 
    interimResults, 
    language, 
    maxSilenceMs,
    detectCommand, 
    onTranscript, 
    onError,
    startAudioAnalysis,
    stopAudioAnalysis,
    isListening,
  ])
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // DETENER RECONOCIMIENTO
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
    
    setIsListening(false)
    setInterimTranscript('')
    stopAudioAnalysis()
  }, [stopAudioAnalysis])
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // TOGGLE LISTENING
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // RESET TRANSCRIPT
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // SÍNTESIS DE VOZ
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const speak = useCallback((text: string, speechOptions: SpeechOptions = {}) => {
    const synthesis = getSpeechSynthesis()
    if (!synthesis) {
      const errorMsg = 'Síntesis de voz no soportada'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }
    
    // Cancelar cualquier síntesis en curso
    synthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    
    // Configurar opciones
    utterance.rate = speechOptions.rate ?? 1
    utterance.pitch = speechOptions.pitch ?? 1
    utterance.volume = speechOptions.volume ?? 1
    utterance.lang = speechOptions.lang ?? language
    
    // Buscar voz específica si se solicita
    if (speechOptions.voice) {
      const voices = synthesis.getVoices()
      const voice = voices.find(v => v.name === speechOptions.voice)
      if (voice) utterance.voice = voice
    }
    
    // Eventos
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    synthesis.speak(utterance)
  }, [language, onError])
  
  const stopSpeaking = useCallback(() => {
    const synthesis = getSpeechSynthesis()
    if (synthesis) {
      synthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    return () => {
      stopListening()
      stopSpeaking()
    }
  }, [stopListening, stopSpeaking])
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════════════════════
  
  return {
    // Estado
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    amplitude,
    error,
    
    // Controles
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    
    // Síntesis
    speak,
    stopSpeaking,
    isSpeaking,
  }
}

export default useVoiceInput
