/**
 * useAI Hook - Hook unificado para servicios de IA
 * Proporciona acceso a todos los servicios de IA desde componentes React
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { MegaAIAgentService } from '@/app/lib/services/ai/MegaAIAgent.service'
import { AIScheduledReportsService } from '@/app/lib/services/ai/AIScheduledReports.service'
import { AIFormAutomationService } from '@/app/lib/services/ai/AIFormAutomation.service'
import { AIPowerBIService } from '@/app/lib/services/ai/AIPowerBI.service'
import { UserLearningService } from '@/app/lib/services/ai/UserLearning.service'

// Tipos locales para el hook
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AIResponse {
  message: string;
  type?: string;
  confidence?: number;
  data?: unknown;
  visualizations?: unknown[];
  suggestions?: string[];
}

interface UseAIState {
  isLoading: boolean;
  error: string | null;
  conversationHistory: Message[];
}

export interface UseAIResult extends UseAIState {
  // Chat principal
  sendMessage: (message: string, context?: { userId?: string }) => Promise<AIResponse | null>;
  clearConversation: () => void;
  
  // Insights y KPIs
  getInsights: () => Promise<unknown>;
  getKPIs: () => Promise<unknown>;
  getPredictions: (type: string, months?: number) => Promise<unknown>;
  
  // Instancias de servicios
  services: {
    megaAI: MegaAIAgentService;
    reports: AIScheduledReportsService;
    forms: AIFormAutomationService;
    powerBI: AIPowerBIService;
    learning: UserLearningService;
  };
}

/**
 * Hook principal para interactuar con servicios de IA
 */
export function useAI(userId: string = 'default-user'): UseAIResult {
  const [state, setState] = useState<UseAIState>({
    isLoading: false,
    error: null,
    conversationHistory: [],
  })

  // Crear instancias de servicios (memoizadas)
  const services = useMemo(() => ({
    megaAI: new MegaAIAgentService(userId),
    reports: new AIScheduledReportsService(),
    forms: new AIFormAutomationService(),
    powerBI: new AIPowerBIService(),
    learning: new UserLearningService(),
  }), [userId])

  /**
   * Enviar mensaje al agente IA
   */
  const sendMessage = useCallback(async (
    message: string, 
    context?: { userId?: string },
  ): Promise<AIResponse | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await services.megaAI.sendMessage({
        message,
        userId: context?.userId || userId,
        context: {},
      })

      // Agregar mensajes al historial
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message || '',
        timestamp: new Date(),
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        conversationHistory: [...prev.conversationHistory, userMessage, assistantMessage],
      }))

      return {
        message: response.message || '',
        type: response.type,
        data: response.data,
        visualizations: response.visualizations,
        suggestions: response.suggestions,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return null
    }
  }, [services.megaAI, userId])

  /**
   * Limpiar historial de conversación
   */
  const clearConversation = useCallback(() => {
    setState(prev => ({ ...prev, conversationHistory: [] }))
  }, [])

  /**
   * Obtener insights de IA
   */
  const getInsights = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      // Retornar datos simulados mientras se implementa el servicio completo
      setState(prev => ({ ...prev, isLoading: false }))
      return {
        insights: [
          { type: 'success', title: 'Tendencia Positiva', description: 'Incremento del 18% en ventas' },
          { type: 'info', title: 'Predicción', description: 'Alcanzar 76K en ventas próximo mes' },
          { type: 'warning', title: 'Stock Bajo', description: 'Reponer inventario en 3 productos' },
        ],
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return null
    }
  }, [])

  /**
   * Obtener KPIs generados por IA
   */
  const getKPIs = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      setState(prev => ({ ...prev, isLoading: false }))
      return {
        totalVentas: 3378700,
        totalCompras: 14678900,
        clientesActivos: 31,
        utilidades: 337870,
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return null
    }
  }, [])

  /**
   * Obtener predicciones
   */
  const getPredictions = useCallback(async (type: string, months: number = 6) => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      setState(prev => ({ ...prev, isLoading: false }))
      return {
        predictions: Array.from({ length: months }, (_, i) => ({
          value: 45000 + i * 5000 + Math.random() * 3000,
          predicted: 48000 + i * 5500,
        })),
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return null
    }
  }, [])

  return {
    ...state,
    sendMessage,
    clearConversation,
    getInsights,
    getKPIs,
    getPredictions,
    services,
  }
}

export default useAI
