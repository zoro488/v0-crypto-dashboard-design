/**
 * 🎤 useAdvancedVoiceAI - Hook Avanzado de IA Conversacional con Voz
 * 
 * Hook ultra-optimizado que integra:
 * - VoiceEngine para reconocimiento y síntesis de voz natural
 * - ConversationalAIEngine para procesamiento inteligente
 * - Gestión de estados robusta
 * - Navegación por voz
 * - Comandos de sistema
 * 
 * @example
 * const { 
 *   state, messages, input,
 *   startListening, stopListening,
 *   sendMessage, speak,
 *   isVoiceSupported
 * } = useAdvancedVoiceAI()
 */

'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { VoiceEngine, getVoiceEngine, VoiceEvent, VoiceState } from '@/app/lib/services/voice/VoiceEngine'
import { ConversationalAIEngine, getConversationalAI, ConversationMessage, AIResponse } from '@/app/lib/services/voice/ConversationalAIEngine'
import { logger } from '@/app/lib/utils/logger'
import type { PanelId } from '@/app/types'

// ============================================================================
// TIPOS
// ============================================================================

export type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

export interface VoiceAIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isInterim?: boolean
  suggestions?: string[]
  emotion?: 'neutral' | 'positive' | 'concerned' | 'excited'
}

export interface UseAdvancedVoiceAIOptions {
  autoSpeak?: boolean
  language?: string
  voiceRate?: number
  voicePitch?: number
  onNavigate?: (panel: PanelId) => void
  onStateChange?: (state: AssistantState) => void
  onError?: (error: string) => void
}

export interface UseAdvancedVoiceAIReturn {
  // Estados
  state: AssistantState
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  error: string | null
  
  // Mensajes
  messages: VoiceAIMessage[]
  input: string
  interimTranscript: string
  suggestions: string[]
  
  // Acciones
  setInput: (value: string) => void
  sendMessage: (text?: string) => Promise<void>
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
  speak: (text: string) => Promise<void>
  stopSpeaking: () => void
  clearMessages: () => void
  
  // Capacidades
  isVoiceSupported: boolean
  isSynthesisSupported: boolean
  availableVoices: SpeechSynthesisVoice[]
  
  // Configuración
  setAutoSpeak: (value: boolean) => void
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useAdvancedVoiceAI(
  options: UseAdvancedVoiceAIOptions = {},
): UseAdvancedVoiceAIReturn {
  const {
    autoSpeak = true,
    language = 'es-MX',
    voiceRate = 1.0,
    voicePitch = 1.0,
    onNavigate,
    onStateChange,
    onError,
  } = options

  // Estados
  const [state, setState] = useState<AssistantState>('idle')
  const [messages, setMessages] = useState<VoiceAIMessage[]>([])
  const [input, setInput] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(autoSpeak)
  const [voiceSupport, setVoiceSupport] = useState({ recognition: false, synthesis: false })
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  // Referencias
  const voiceEngineRef = useRef<VoiceEngine | null>(null)
  const aiEngineRef = useRef<ConversationalAIEngine | null>(null)
  const isMountedRef = useRef(true)
  const processingRef = useRef(false)

  // Store
  const { setCurrentPanel, setVoiceAgentStatus } = useAppStore()

  // Derivados
  const isListening = state === 'listening'
  const isSpeaking = state === 'speaking'
  const isProcessing = state === 'processing'

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================

  useEffect(() => {
    isMountedRef.current = true

    const initializeEngines = async () => {
      try {
        // Inicializar VoiceEngine
        voiceEngineRef.current = getVoiceEngine({
          language,
          rate: voiceRate,
          pitch: voicePitch,
        })
        await voiceEngineRef.current.initialize()

        // Verificar soporte
        const support = voiceEngineRef.current.isSupported()
        setVoiceSupport(support)
        setAvailableVoices(voiceEngineRef.current.getAvailableVoices())

        // Inicializar ConversationalAIEngine
        aiEngineRef.current = getConversationalAI()

        // Suscribirse a eventos de voz
        const unsubscribe = voiceEngineRef.current.on(handleVoiceEvent)

        logger.info('AdvancedVoiceAI inicializado', { 
          context: 'useAdvancedVoiceAI',
          data: support, 
        })

        return () => {
          unsubscribe()
        }
      } catch (err) {
        logger.error('Error inicializando AdvancedVoiceAI', err, { context: 'useAdvancedVoiceAI' })
        setError('Error al inicializar el sistema de voz')
      }
    }

    initializeEngines()

    return () => {
      isMountedRef.current = false
    }
  }, [language, voiceRate, voicePitch])

  // ============================================================================
  // MANEJADORES DE EVENTOS
  // ============================================================================

  const handleVoiceEvent = useCallback((event: VoiceEvent) => {
    if (!isMountedRef.current) return

    switch (event.type) {
      case 'start':
        updateState('listening')
        setInterimTranscript('')
        break

      case 'end':
        if (state === 'listening') {
          updateState('idle')
        }
        break

      case 'result':
        if (event.isFinal && event.transcript) {
          setInput(event.transcript)
          setInterimTranscript('')
          // Procesar mensaje automáticamente
          processUserMessage(event.transcript)
        } else if (event.transcript) {
          setInterimTranscript(event.transcript)
        }
        break

      case 'error':
        handleError(event.error || 'Error de reconocimiento de voz')
        break
    }
  }, [state])

  const updateState = useCallback((newState: AssistantState) => {
    setState(newState)
    onStateChange?.(newState)
    
    // Actualizar store
    const storeStatus = newState === 'listening' ? 'listening' 
      : newState === 'processing' ? 'thinking'
      : newState === 'speaking' ? 'speaking'
      : 'idle'
    setVoiceAgentStatus(storeStatus)
  }, [onStateChange, setVoiceAgentStatus])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    updateState('error')
    onError?.(errorMessage)
    
    // Limpiar error después de 5 segundos
    setTimeout(() => {
      if (isMountedRef.current) {
        setError(null)
        updateState('idle')
      }
    }, 5000)
  }, [onError, updateState])

  // ============================================================================
  // PROCESAMIENTO DE MENSAJES
  // ============================================================================

  const processUserMessage = useCallback(async (text: string) => {
    if (processingRef.current || !text.trim()) return
    processingRef.current = true

    updateState('processing')
    setError(null)

    // Agregar mensaje del usuario
    const userMessage: VoiceAIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    try {
      // Procesar con AI Engine
      const response = await aiEngineRef.current?.processMessage(text)
      
      if (!isMountedRef.current) return

      if (response) {
        // Agregar respuesta del asistente
        const assistantMessage: VoiceAIMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          suggestions: response.suggestions,
          emotion: response.emotion,
        }
        setMessages(prev => [...prev, assistantMessage])
        setSuggestions(response.suggestions || [])

        // Ejecutar acciones
        if (response.actions) {
          for (const action of response.actions) {
            if (action.type === 'navigate' && action.target) {
              setCurrentPanel(action.target as PanelId)
              onNavigate?.(action.target as PanelId)
            }
          }
        }

        // Hablar respuesta si está habilitado
        if (autoSpeakEnabled && response.shouldSpeak !== false) {
          await speakResponse(response.content, response.emotion)
        } else {
          updateState('idle')
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        logger.error('Error procesando mensaje', err, { context: 'useAdvancedVoiceAI' })
        handleError('Error al procesar tu mensaje')
      }
    } finally {
      processingRef.current = false
      if (state !== 'speaking') {
        updateState('idle')
      }
    }
  }, [autoSpeakEnabled, setCurrentPanel, onNavigate, updateState, handleError, state])

  const speakResponse = useCallback(async (text: string, emotion?: string) => {
    if (!voiceEngineRef.current) return

    updateState('speaking')
    
    try {
      if (emotion && emotion !== 'neutral') {
        await voiceEngineRef.current.speakWithEmotion(
          text, 
          emotion as 'excited' | 'concerned' | 'calm',
        )
      } else {
        await voiceEngineRef.current.speak(text)
      }
    } catch {
      // Silently handle speech errors
    } finally {
      if (isMountedRef.current) {
        updateState('idle')
      }
    }
  }, [updateState])

  // ============================================================================
  // ACCIONES PÚBLICAS
  // ============================================================================

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || input
    if (messageText.trim()) {
      await processUserMessage(messageText)
    }
  }, [input, processUserMessage])

  const startListening = useCallback(() => {
    if (voiceEngineRef.current) {
      voiceEngineRef.current.startListening()
    }
  }, [])

  const stopListening = useCallback(() => {
    if (voiceEngineRef.current) {
      voiceEngineRef.current.stopListening()
    }
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const speak = useCallback(async (text: string) => {
    await speakResponse(text)
  }, [speakResponse])

  const stopSpeaking = useCallback(() => {
    if (voiceEngineRef.current) {
      voiceEngineRef.current.stopSpeaking()
    }
    updateState('idle')
  }, [updateState])

  const clearMessages = useCallback(() => {
    setMessages([])
    setSuggestions([])
    aiEngineRef.current?.clearContext()
  }, [])

  const setAutoSpeak = useCallback((value: boolean) => {
    setAutoSpeakEnabled(value)
  }, [])

  // ============================================================================
  // MENSAJE DE BIENVENIDA
  // ============================================================================

  useEffect(() => {
    // Agregar mensaje de bienvenida al iniciar
    if (messages.length === 0) {
      const welcomeMessage: VoiceAIMessage = {
        id: 'welcome',
        role: 'assistant',
        content: '¡Hola! Soy Chronos, tu asistente inteligente. Puedes hablarme o escribirme para consultar datos, navegar por el sistema o ejecutar acciones. ¿En qué puedo ayudarte?',
        timestamp: new Date(),
        suggestions: ['Ver ventas de hoy', 'Estado de bancos', '¿Qué puedes hacer?'],
      }
      setMessages([welcomeMessage])
      setSuggestions(welcomeMessage.suggestions || [])
    }
  }, [])

  // ============================================================================
  // RETORNO
  // ============================================================================

  return useMemo(() => ({
    // Estados
    state,
    isListening,
    isSpeaking,
    isProcessing,
    error,
    
    // Mensajes
    messages,
    input,
    interimTranscript,
    suggestions,
    
    // Acciones
    setInput,
    sendMessage,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    clearMessages,
    
    // Capacidades
    isVoiceSupported: voiceSupport.recognition,
    isSynthesisSupported: voiceSupport.synthesis,
    availableVoices,
    
    // Configuración
    setAutoSpeak,
  }), [
    state,
    isListening,
    isSpeaking,
    isProcessing,
    error,
    messages,
    input,
    interimTranscript,
    suggestions,
    sendMessage,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    clearMessages,
    voiceSupport,
    availableVoices,
    setAutoSpeak,
  ])
}

export default useAdvancedVoiceAI
