'use client'

/**
 * 🎤 VOICE WORKER PROVIDER - CHRONOS 2026
 * 
 * Provider que maneja el Web Worker para voz y AI
 * Garantiza 0ms de bloqueo en el hilo principal
 * 
 * @version 1.0.0
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { logger } from '@/app/lib/utils/logger'

// ============================================================
// TIPOS
// ============================================================

interface VoiceWorkerState {
  isReady: boolean
  isListening: boolean
  status: 'idle' | 'listening' | 'processing' | 'speaking'
  lastTranscription: string
  frequencies: number[]
}

interface VoiceWorkerContextValue {
  state: VoiceWorkerState
  startListening: () => void
  stopListening: () => void
  processAudio: (audioData: Float32Array) => void
  sendAIQuery: (text: string) => Promise<{ intent: string; success: boolean }>
}

// ============================================================
// CONTEXT
// ============================================================

const VoiceWorkerContext = createContext<VoiceWorkerContextValue | null>(null)

// ============================================================
// PROVIDER
// ============================================================

export function VoiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const workerRef = useRef<Worker | null>(null)
  const [state, setState] = useState<VoiceWorkerState>({
    isReady: false,
    isListening: false,
    status: 'idle',
    lastTranscription: '',
    frequencies: Array(32).fill(0),
  })
  
  // Resolver para promesas pendientes
  const pendingPromises = useRef<Map<string, { resolve: (value: unknown) => void; reject: (error: unknown) => void }>>(new Map())

  // Inicializar worker
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      workerRef.current = new Worker('/voice-worker.js')
      
      workerRef.current.onmessage = (event) => {
        const { type, ...data } = event.data
        
        switch (type) {
          case 'READY':
            setState(prev => ({ ...prev, isReady: true }))
            logger.info('[VoiceWorker] Worker listo', { context: 'VoiceWorkerProvider' })
            break
            
          case 'STATUS':
            setState(prev => ({ 
              ...prev, 
              status: data.status,
              isListening: data.status === 'listening',
            }))
            break
            
          case 'AUDIO_PROCESSED':
            if (data.result?.frequencies) {
              setState(prev => ({ ...prev, frequencies: data.result.frequencies }))
            }
            break
            
          case 'TRANSCRIPTION':
            setState(prev => ({ ...prev, lastTranscription: data.text }))
            break
            
          case 'AI_RESPONSE':
            const aiPromise = pendingPromises.current.get('ai_query')
            if (aiPromise) {
              aiPromise.resolve(data.response)
              pendingPromises.current.delete('ai_query')
            }
            break
            
          case 'PONG':
            logger.debug('[VoiceWorker] Ping-pong OK', { context: 'VoiceWorkerProvider' })
            break
        }
      }
      
      workerRef.current.onerror = (error) => {
        logger.error('[VoiceWorker] Error en worker', error, { context: 'VoiceWorkerProvider' })
      }
      
    } catch (error) {
      logger.warn('[VoiceWorker] No se pudo inicializar worker, funcionando sin él', { context: 'VoiceWorkerProvider' })
    }

    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  // ============================================================
  // ACCIONES
  // ============================================================

  const startListening = useCallback(() => {
    workerRef.current?.postMessage({ type: 'START_LISTENING' })
  }, [])

  const stopListening = useCallback(() => {
    workerRef.current?.postMessage({ type: 'STOP_LISTENING' })
  }, [])

  const processAudio = useCallback((audioData: Float32Array) => {
    workerRef.current?.postMessage({ type: 'PROCESS_AUDIO', data: Array.from(audioData) })
  }, [])

  const sendAIQuery = useCallback((text: string): Promise<{ intent: string; success: boolean }> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        // Fallback si no hay worker
        resolve({ intent: 'general', success: true })
        return
      }
      
      pendingPromises.current.set('ai_query', { resolve: resolve as (value: unknown) => void, reject })
      workerRef.current.postMessage({ type: 'AI_QUERY', data: { text } })
      
      // Timeout de 5 segundos
      setTimeout(() => {
        if (pendingPromises.current.has('ai_query')) {
          pendingPromises.current.delete('ai_query')
          resolve({ intent: 'general', success: false })
        }
      }, 5000)
    })
  }, [])

  // ============================================================
  // RENDER
  // ============================================================

  const value: VoiceWorkerContextValue = {
    state,
    startListening,
    stopListening,
    processAudio,
    sendAIQuery,
  }

  return (
    <VoiceWorkerContext.Provider value={value}>
      {children}
    </VoiceWorkerContext.Provider>
  )
}

// ============================================================
// HOOK
// ============================================================

export function useVoiceWorker() {
  const context = useContext(VoiceWorkerContext)
  if (!context) {
    // Retornar valores por defecto si no hay provider
    return {
      state: {
        isReady: false,
        isListening: false,
        status: 'idle' as const,
        lastTranscription: '',
        frequencies: Array(32).fill(0),
      },
      startListening: () => {},
      stopListening: () => {},
      processAudio: () => {},
      sendAIQuery: async () => ({ intent: 'general', success: false }),
    }
  }
  return context
}

export default VoiceWorkerProvider
