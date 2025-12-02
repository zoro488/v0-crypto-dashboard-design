/**
 * 🪝 useAIAssistant - Hook para Asistente IA Conversacional
 * 
 * Hook simplificado que integra:
 * - VoiceRecognitionService para voz
 * - API de chat para respuestas
 * - Integración con el store de la app
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '@/app/lib/store/useAppStore'
import type { PanelId } from '@/app/types'
import { logger } from '@/app/lib/utils/logger'
import '@/app/types/speech-recognition'

// Tipos
export type AIAssistantState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

export interface AIAssistantMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  suggestions?: string[]
}

export interface UseAIAssistantOptions {
  autoSpeak?: boolean
  language?: string
  onStateChange?: (state: AIAssistantState) => void
  onNavigate?: (panel: string) => void
}

export interface UseAIAssistantReturn {
  state: AIAssistantState
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  messages: AIAssistantMessage[]
  input: string
  setInput: (value: string) => void
  sendMessage: (text?: string) => Promise<void>
  startListening: () => void
  stopListening: () => void
  speak: (text: string) => void
  stopSpeaking: () => void
  clearMessages: () => void
  suggestions: string[]
  voiceSupported: boolean
  error: string | null
}

export function useAIAssistant(options: UseAIAssistantOptions = {}): UseAIAssistantReturn {
  const {
    autoSpeak = false,
    language = 'es-MX',
    onStateChange,
    onNavigate,
  } = options

  // Estados
  const [state, setState] = useState<AIAssistantState>('idle')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [messages, setMessages] = useState<AIAssistantMessage[]>([])
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Referencias
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)

  // Store de la app
  const { setCurrentPanel, setVoiceAgentStatus } = useAppStore()

  // Inicializar servicios de voz
  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI()
      recognitionRef.current.lang = language
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          setInput(finalTranscript)
          sendMessage(finalTranscript)
        }
      }

      recognitionRef.current.onstart = () => {
        setIsListening(true)
        setState('listening')
        setVoiceAgentStatus('listening')
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        if (state === 'listening') {
          setState('idle')
          setVoiceAgentStatus('idle')
        }
      }

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        setError(`Error de voz: ${event.error}`)
        setIsListening(false)
        setState('error')
      }

      setVoiceSupported(true)
    }

    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis
    }

    return () => {
      recognitionRef.current?.abort()
      synthesisRef.current?.cancel()
    }
  }, [language, state, setVoiceAgentStatus])

  // Notificar cambios de estado
  useEffect(() => {
    onStateChange?.(state)
  }, [state, onStateChange])

  // Enviar mensaje
  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || input
    if (!text.trim()) return

    setError(null)
    setState('processing')
    setIsProcessing(true)
    setVoiceAgentStatus('thinking')

    // Agregar mensaje del usuario
    const userMessage: AIAssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    // Detectar navegación
    const navigationMatch = text.match(/(?:ir a|abrir|muestra(?:me)?)\s+(?:el\s+)?(?:panel\s+)?(?:de\s+)?(\w+)/i)
    if (navigationMatch) {
      const panelMap: Record<string, PanelId> = {
        dashboard: 'dashboard',
        venta: 'ventas',
        ventas: 'ventas',
        cliente: 'clientes',
        clientes: 'clientes',
        distribuidor: 'distribuidores',
        distribuidores: 'distribuidores',
        banco: 'bancos',
        bancos: 'bancos',
        almacén: 'almacen',
        almacen: 'almacen',
        reporte: 'reportes',
        reportes: 'reportes',
        ia: 'ia',
      }
      
      const targetPanel = panelMap[navigationMatch[1].toLowerCase()]
      if (targetPanel) {
        setCurrentPanel(targetPanel)
        onNavigate?.(targetPanel)
      }
    }

    try {
      const response = await fetch('/api/ai/conversational', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          userId: 'user-001',
        }),
      })

      if (!response.ok) {
        throw new Error('Error en la respuesta del API')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          assistantContent += decoder.decode(value, { stream: true })
        }
      }

      const assistantMessage: AIAssistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantContent || 'Lo siento, no pude procesar tu solicitud.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])

      // Generar sugerencias basadas en la respuesta
      setSuggestions(['Ver más detalles', 'Exportar datos', 'Otra pregunta'])

      if (autoSpeak && assistantContent) {
        speak(assistantContent)
      }

      setState('idle')
      setVoiceAgentStatus('idle')
    } catch (err) {
      setError((err as Error).message)
      setState('error')
      logger.error('Error sending message', err, { context: 'useAIAssistant' })
    } finally {
      setIsProcessing(false)
    }
  }, [input, messages, autoSpeak, setCurrentPanel, onNavigate, setVoiceAgentStatus])

  // Control de voz
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Reconocimiento de voz no disponible')
      return
    }
    try {
      recognitionRef.current.start()
    } catch {
      logger.warn('Already listening', { context: 'useAIAssistant' })
    }
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const speak = useCallback((text: string) => {
    if (!synthesisRef.current) return
    synthesisRef.current.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language
    utterance.onstart = () => {
      setIsSpeaking(true)
      setState('speaking')
    }
    utterance.onend = () => {
      setIsSpeaking(false)
      setState('idle')
    }
    synthesisRef.current.speak(utterance)
  }, [language])

  const stopSpeaking = useCallback(() => {
    synthesisRef.current?.cancel()
    setIsSpeaking(false)
    setState('idle')
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setSuggestions([])
  }, [])

  return {
    state,
    isListening,
    isSpeaking,
    isProcessing,
    messages,
    input,
    setInput,
    sendMessage,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearMessages,
    suggestions,
    voiceSupported,
    error,
  }
}

export default useAIAssistant
