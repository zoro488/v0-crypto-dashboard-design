/**
 * 🧠 useAI Hook - React Hook para AI Conversacional
 * 
 * Hook optimizado para:
 * - Chat con AI (streaming y no-streaming)
 * - Voice conversation (STT + AI + TTS)
 * - Historial de mensajes
 * - Estado de carga y errores
 * - Auto-retry con exponential backoff
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { logger } from '@/app/lib/utils/logger'
import { aiOrchestrator, type AIMessage, type AICompletionOptions, type VoiceOptions } from './orchestrator'
import { useVoice } from './voice/useVoice'

// =====================================================================
// TIPOS
// =====================================================================

export interface UseAIOptions extends AICompletionOptions {
  systemPrompt?: string
  autoSpeak?: boolean // Auto TTS para respuestas
  voiceOptions?: VoiceOptions
  onMessageStart?: () => void
  onMessageComplete?: (message: string) => void
  persistHistory?: boolean
  historyKey?: string
}

export interface ChatMessage extends AIMessage {
  id: string
  timestamp: number
  isStreaming?: boolean
  error?: string
}

export interface UseAIReturn {
  // Chat
  messages: ChatMessage[]
  isLoading: boolean
  isStreaming: boolean
  error: Error | null
  
  // Acciones chat
  sendMessage: (content: string) => Promise<void>
  streamMessage: (content: string) => Promise<void>
  clearHistory: () => void
  regenerateLast: () => Promise<void>
  
  // Voz
  isListening: boolean
  isSpeaking: boolean
  startVoiceChat: () => Promise<void>
  stopVoiceChat: () => void
  speak: (text: string) => Promise<void>
  
  // Utilidades
  stopGeneration: () => void
  stats: { requestCount: number; averageLatency: number }
}

// =====================================================================
// HOOK PRINCIPAL
// =====================================================================

export function useAI(options: UseAIOptions = {}): UseAIReturn {
  const {
    systemPrompt = 'Eres CHRONOS, un asistente financiero experto para un sistema de distribución. Respondes en español de manera concisa y profesional.',
    autoSpeak = false,
    voiceOptions = {},
    onMessageStart,
    onMessageComplete,
    persistHistory = false,
    historyKey = 'chronos_chat_history',
    ...completionOptions
  } = options

  // Estado
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const streamBufferRef = useRef('')
  
  // Hook de voz
  const voice = useVoice({
    tts: {
      voiceId: voiceOptions.voice || 'rachel',
    },
    autoDetectEmotion: true,
  })

  // ─────────────────────────────────────────────────────────────────────
  // PERSISTENCIA
  // ─────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    if (persistHistory && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(historyKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          setMessages(parsed)
        }
      } catch {
        // Ignorar errores de parsing
      }
    }
  }, [persistHistory, historyKey])

  useEffect(() => {
    if (persistHistory && typeof window !== 'undefined' && messages.length > 0) {
      // Solo guardar los últimos 50 mensajes
      const toSave = messages.slice(-50)
      localStorage.setItem(historyKey, JSON.stringify(toSave))
    }
  }, [messages, persistHistory, historyKey])

  // ─────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ─────────────────────────────────────────────────────────────────────
  
  const generateId = useCallback(() => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>): string => {
    const id = generateId()
    const newMessage: ChatMessage = {
      ...message,
      id,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, newMessage])
    return id
  }, [generateId])

  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ))
  }, [])

  const getAIMessages = useCallback((): AIMessage[] => {
    return messages
      .filter(m => !m.error)
      .map(({ role, content }) => ({ role, content }))
  }, [messages])

  // ─────────────────────────────────────────────────────────────────────
  // ENVIAR MENSAJE (sin streaming)
  // ─────────────────────────────────────────────────────────────────────
  
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return
    
    setError(null)
    setIsLoading(true)
    onMessageStart?.()
    
    // Agregar mensaje del usuario
    addMessage({ role: 'user', content })
    
    // ID para mensaje del asistente
    const assistantId = addMessage({ role: 'assistant', content: '', isStreaming: true })
    
    try {
      const aiMessages = [...getAIMessages(), { role: 'user' as const, content }]
      
      const response = await aiOrchestrator.complete(aiMessages, {
        ...completionOptions,
        systemPrompt,
        cache: true,
      })
      
      updateMessage(assistantId, { 
        content: response.content,
        isStreaming: false,
      })
      
      onMessageComplete?.(response.content)
      
      // Auto TTS
      if (autoSpeak) {
        await voice.speak(response.content, voiceOptions.emotion)
      }
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      updateMessage(assistantId, { 
        content: 'Error al generar respuesta.',
        error: errorMsg,
        isStreaming: false,
      })
      setError(err as Error)
      logger.error('[useAI] Error en sendMessage', err as Error, { context: 'AI' })
    } finally {
      setIsLoading(false)
    }
  }, [
    isLoading, addMessage, getAIMessages, updateMessage, 
    completionOptions, systemPrompt, autoSpeak, voice, 
    voiceOptions, onMessageStart, onMessageComplete
  ])

  // ─────────────────────────────────────────────────────────────────────
  // ENVIAR MENSAJE (con streaming)
  // ─────────────────────────────────────────────────────────────────────
  
  const streamMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading || isStreaming) return
    
    setError(null)
    setIsLoading(true)
    setIsStreaming(true)
    streamBufferRef.current = ''
    onMessageStart?.()
    
    // Agregar mensaje del usuario
    addMessage({ role: 'user', content })
    
    // ID para mensaje del asistente
    const assistantId = addMessage({ role: 'assistant', content: '', isStreaming: true })
    
    abortControllerRef.current = new AbortController()
    
    try {
      const aiMessages = [...getAIMessages(), { role: 'user' as const, content }]
      
      for await (const chunk of aiOrchestrator.stream(aiMessages, {
        ...completionOptions,
        systemPrompt,
      })) {
        streamBufferRef.current += chunk
        updateMessage(assistantId, { content: streamBufferRef.current })
      }
      
      updateMessage(assistantId, { isStreaming: false })
      onMessageComplete?.(streamBufferRef.current)
      
      // Auto TTS
      if (autoSpeak) {
        await voice.speak(streamBufferRef.current, voiceOptions.emotion)
      }
      
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        updateMessage(assistantId, { 
          content: streamBufferRef.current || 'Generación cancelada.',
          isStreaming: false,
        })
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
        updateMessage(assistantId, { 
          content: 'Error al generar respuesta.',
          error: errorMsg,
          isStreaming: false,
        })
        setError(err as Error)
        logger.error('[useAI] Error en streamMessage', err as Error, { context: 'AI' })
      }
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [
    isLoading, isStreaming, addMessage, getAIMessages, updateMessage,
    completionOptions, systemPrompt, autoSpeak, voice, 
    voiceOptions, onMessageStart, onMessageComplete
  ])

  // ─────────────────────────────────────────────────────────────────────
  // VOZ
  // ─────────────────────────────────────────────────────────────────────
  
  const startVoiceChat = useCallback(async () => {
    try {
      voice.resetTranscript()
      await voice.startListening()
      
      // Escuchar hasta que haya silencio
      // El transcript final se usará para enviar mensaje
    } catch (err) {
      setError(err as Error)
      logger.error('[useAI] Error iniciando voz', err as Error, { context: 'AI' })
    }
  }, [voice])

  const stopVoiceChat = useCallback(async () => {
    voice.stopListening()
    
    // Enviar transcript como mensaje
    const transcript = voice.transcript.trim()
    if (transcript) {
      await sendMessage(transcript)
    }
  }, [voice, sendMessage])

  const speak = useCallback(async (text: string) => {
    await voice.speak(text, voiceOptions.emotion)
  }, [voice, voiceOptions])

  // ─────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ─────────────────────────────────────────────────────────────────────
  
  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const clearHistory = useCallback(() => {
    setMessages([])
    if (persistHistory && typeof window !== 'undefined') {
      localStorage.removeItem(historyKey)
    }
  }, [persistHistory, historyKey])

  const regenerateLast = useCallback(async () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMessage) return
    
    // Remover última respuesta
    setMessages(prev => {
      // Find last assistant index manually for ES5 compatibility
      let lastAssistantIndex = -1
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].role === 'assistant') {
          lastAssistantIndex = i
          break
        }
      }
      if (lastAssistantIndex > -1) {
        return prev.slice(0, lastAssistantIndex)
      }
      return prev
    })
    
    // Regenerar
    await streamMessage(lastUserMessage.content)
  }, [messages, streamMessage])

  // ─────────────────────────────────────────────────────────────────────
  // RETURN
  // ─────────────────────────────────────────────────────────────────────
  
  return {
    // Chat
    messages,
    isLoading,
    isStreaming,
    error,
    
    // Acciones chat
    sendMessage,
    streamMessage,
    clearHistory,
    regenerateLast,
    
    // Voz
    isListening: voice.isListening,
    isSpeaking: voice.isSpeaking,
    startVoiceChat,
    stopVoiceChat,
    speak,
    
    // Utilidades
    stopGeneration,
    stats: aiOrchestrator.getStats(),
  }
}

// =====================================================================
// HOOK SIMPLIFICADO PARA COMPLETIONS
// =====================================================================

export function useAICompletion(options: AICompletionOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const complete = useCallback(async (prompt: string): Promise<string> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await aiOrchestrator.complete(
        [{ role: 'user', content: prompt }],
        options,
      )
      return response.content
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [options])
  
  return { complete, isLoading, error }
}

export default useAI
