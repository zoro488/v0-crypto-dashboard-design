"use client"

/**
 * 🎤 USE REALTIME VOICE - Hook para voz en tiempo real
 * 
 * Integración con OpenAI Realtime API para:
 * - Transcripción en tiempo real (streaming)
 * - Parsing inteligente de comandos
 * - Respuestas de voz (TTS)
 * 
 * Usa Web Speech API como fallback gratuito
 */

import { useState, useCallback, useRef, useEffect } from "react"
import { useToast } from "@/app/hooks/use-toast"
import { 
  parseVentaFromVoice, 
  parseOrdenCompraFromVoice,
  parseProductoFromVoice,
  detectarIntencion,
  type VentaVoiceData,
  type OrdenCompraVoiceData,
  type ProductoVoiceData,
  type ComandoGeneral,
} from "@/app/lib/ai/voice-parsing.service"

// ============================================
// TIPOS
// ============================================

export type VoiceMode = "venta" | "orden_compra" | "producto" | "general"

export interface VoiceState {
  isListening: boolean
  isProcessing: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  confidence: number
}

export interface VoiceResult<T> {
  success: boolean
  data?: T
  transcript: string
  error?: string
}

interface UseRealtimeVoiceOptions {
  mode?: VoiceMode
  language?: string
  continuous?: boolean
  onTranscript?: (transcript: string) => void
  onInterimTranscript?: (interim: string) => void
  onResult?: (result: VoiceResult<unknown>) => void
  onError?: (error: string) => void
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useRealtimeVoice(options: UseRealtimeVoiceOptions = {}) {
  const {
    mode = "general",
    language = "es-MX",
    continuous = false,
    onTranscript,
    onInterimTranscript,
    onResult,
    onError,
  } = options

  const { toast } = useToast()
  
  // Estado
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    transcript: "",
    interimTranscript: "",
    error: null,
    confidence: 0,
  })

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  /**
   * Verificar soporte de Web Speech API
   */
  const checkSupport = useCallback((): boolean => {
    if (typeof window === "undefined") return false
    
    const SpeechRecognition = (window as Window & { 
      SpeechRecognition?: typeof window.webkitSpeechRecognition
      webkitSpeechRecognition?: typeof window.webkitSpeechRecognition 
    }).SpeechRecognition || (window as Window & { 
      webkitSpeechRecognition?: typeof window.webkitSpeechRecognition 
    }).webkitSpeechRecognition

    if (!SpeechRecognition) {
      const errorMsg = "Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge."
      setState(prev => ({ ...prev, error: errorMsg }))
      onError?.(errorMsg)
      return false
    }
    
    return true
  }, [onError])

  /**
   * Procesar el transcript con IA según el modo
   */
  const processWithAI = useCallback(async (transcript: string) => {
    setState(prev => ({ ...prev, isProcessing: true }))

    try {
      let result: VoiceResult<unknown>

      switch (mode) {
        case "venta": {
          const ventaResult = await parseVentaFromVoice(transcript)
          result = {
            success: ventaResult.success,
            data: ventaResult.data,
            transcript,
            error: ventaResult.error,
          }
          break
        }
        
        case "orden_compra": {
          const ocResult = await parseOrdenCompraFromVoice(transcript)
          result = {
            success: ocResult.success,
            data: ocResult.data,
            transcript,
            error: ocResult.error,
          }
          break
        }
        
        case "producto": {
          const prodResult = await parseProductoFromVoice(transcript)
          result = {
            success: prodResult.success,
            data: prodResult.data,
            transcript,
            error: prodResult.error,
          }
          break
        }
        
        case "general":
        default: {
          const genResult = await detectarIntencion(transcript)
          result = {
            success: genResult.success,
            data: genResult.data,
            transcript,
            error: genResult.error,
          }
          break
        }
      }

      if (result.success) {
        toast({
          title: "🤖 Entendido",
          description: `Procesando: "${transcript.substring(0, 50)}..."`,
        })
      } else {
        toast({
          title: "⚠️ No entendí",
          description: result.error || "Intenta de nuevo con más claridad",
          variant: "destructive",
        })
      }

      onResult?.(result)
      return result

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Error procesando voz"
      setState(prev => ({ ...prev, error: errorMsg }))
      onError?.(errorMsg)
      
      return {
        success: false,
        transcript,
        error: errorMsg,
      }
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }))
    }
  }, [mode, toast, onResult, onError])

  /**
   * Iniciar escucha
   */
  const startListening = useCallback(() => {
    if (!checkSupport()) return

    // Limpiar reconocimiento anterior
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }

    const SpeechRecognition = (window as Window & { 
      SpeechRecognition?: typeof window.webkitSpeechRecognition
      webkitSpeechRecognition?: typeof window.webkitSpeechRecognition 
    }).SpeechRecognition || (window as Window & { 
      webkitSpeechRecognition?: typeof window.webkitSpeechRecognition 
    }).webkitSpeechRecognition

    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    // Configuración
    recognition.continuous = continuous
    recognition.interimResults = true
    recognition.lang = language
    recognition.maxAlternatives = 1

    // Resetear estado
    setState(prev => ({
      ...prev,
      isListening: true,
      transcript: "",
      interimTranscript: "",
      error: null,
      confidence: 0,
    }))

    // Event: Resultados
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ""
      let interimTranscript = ""
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

      // Actualizar estado con interim
      if (interimTranscript) {
        setState(prev => ({ ...prev, interimTranscript }))
        onInterimTranscript?.(interimTranscript)
      }

      // Si hay resultado final
      if (finalTranscript) {
        setState(prev => ({
          ...prev,
          transcript: prev.transcript + finalTranscript,
          interimTranscript: "",
          confidence: maxConfidence,
        }))
        onTranscript?.(finalTranscript)
      }
    }

    // Event: Error
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMsg = "Error de reconocimiento de voz"
      
      switch (event.error) {
        case "no-speech":
          errorMsg = "No se detectó voz. Habla más fuerte."
          break
        case "audio-capture":
          errorMsg = "No se pudo acceder al micrófono."
          break
        case "not-allowed":
          errorMsg = "Permiso de micrófono denegado."
          break
        case "network":
          errorMsg = "Error de red. Verifica tu conexión."
          break
        case "aborted":
          // Ignorar - fue cancelado intencionalmente
          return
      }

      setState(prev => ({ ...prev, error: errorMsg, isListening: false }))
      onError?.(errorMsg)
      
      toast({
        title: "Error de voz",
        description: errorMsg,
        variant: "destructive",
      })
    }

    // Event: Fin
    recognition.onend = () => {
      setState(prev => {
        // Si hay transcript, procesarlo con IA
        if (prev.transcript && !prev.isProcessing) {
          processWithAI(prev.transcript)
        }
        
        return { ...prev, isListening: false }
      })
    }

    // Iniciar
    try {
      recognition.start()
      
      toast({
        title: "🎤 Escuchando...",
        description: "Habla ahora. Di tu comando.",
      })

      // Auto-stop después de 10 segundos si no hay silencio
      if (!continuous) {
        timeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop()
          }
        }, 10000)
      }

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: "No se pudo iniciar el micrófono",
        isListening: false 
      }))
    }
  }, [checkSupport, continuous, language, processWithAI, onTranscript, onInterimTranscript, onError, toast])

  /**
   * Detener escucha
   */
  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    
    setState(prev => ({ ...prev, isListening: false }))
  }, [])

  /**
   * Toggle escucha
   */
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [state.isListening, startListening, stopListening])

  /**
   * Cancelar todo
   */
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }
    
    setState({
      isListening: false,
      isProcessing: false,
      transcript: "",
      interimTranscript: "",
      error: null,
      confidence: 0,
    })
  }, [])

  /**
   * Procesar un texto manualmente (útil para testing)
   */
  const processText = useCallback(async (text: string) => {
    setState(prev => ({ ...prev, transcript: text }))
    return processWithAI(text)
  }, [processWithAI])

  return {
    // Estado
    ...state,
    
    // Acciones
    startListening,
    stopListening,
    toggleListening,
    cancel,
    processText,
    
    // Helpers
    isSupported: typeof window !== "undefined" && 
      Boolean((window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition || 
              (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition),
  }
}

// ============================================
// TIPOS EXPORTADOS
// ============================================

export type { 
  VoiceState, 
  VoiceResult, 
  VentaVoiceData, 
  OrdenCompraVoiceData, 
  ProductoVoiceData,
  ComandoGeneral,
}
