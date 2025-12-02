/**
 * 🤖 HOOK DE CHAT IA AVANZADO - CHRONOS SYSTEM
 * 
 * Sistema conversacional en tiempo real con soporte para:
 * - Streaming de respuestas
 * - Historial persistente (Convex)
 * - Tool calling
 * - Contexto de sistema dinámico
 * - Memoria de conversación
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useChatMessages, useChatMutations } from './useConvex'

// Tipos para el chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

export interface UseChatAIOptions {
  userId?: string;
  systemPrompt?: string;
  onToolCall?: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  maxHistoryLength?: number;
  persistHistory?: boolean;
}

export function useChatAI(options: UseChatAIOptions = {}) {
  const {
    userId,
    systemPrompt = SYSTEM_PROMPT_CHRONOS,
    onToolCall,
    maxHistoryLength = 50,
    persistHistory = true,
  } = options

  // Estado local
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)

  // Convex para persistencia
  const convexMessages = useChatMessages(userId, maxHistoryLength)
  const { addMessage: addConvexMessage, clearHistory: clearConvexHistory } = useChatMutations()

  // Sincronizar con Convex cuando los mensajes cambian
  useEffect(() => {
    if (convexMessages && convexMessages.length > 0 && messages.length === 0) {
      const formattedMessages: ChatMessage[] = convexMessages.map(m => ({
        id: m._id as string,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
        toolCalls: m.toolCalls?.map(tc => ({
          name: tc.name,
          arguments: typeof tc.arguments === 'string' 
            ? JSON.parse(tc.arguments) as Record<string, unknown>
            : tc.arguments as Record<string, unknown>,
          result: tc.result,
        })),
      }))
      setMessages(formattedMessages)
    }
  }, [convexMessages])

  // Enviar mensaje con streaming
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    setError(null)
    setIsLoading(true)
    setStreamingContent('')

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])

    // Persistir en Convex si está habilitado
    if (persistHistory) {
      try {
        await addConvexMessage({
          role: 'user',
          content,
          userId,
        })
      } catch (e) {
        console.warn('Error persistiendo mensaje:', e)
      }
    }

    // Preparar el historial para la API
    const historyForApi = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }))

    try {
      abortControllerRef.current = new AbortController()

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...historyForApi,
            { role: 'user', content },
          ],
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      // Procesar streaming
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      // Agregar mensaje vacío del asistente para streaming
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      }

      setMessages(prev => [...prev, assistantMessage])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          fullContent += chunk
          setStreamingContent(fullContent)

          // Actualizar el mensaje en tiempo real
          setMessages(prev => 
            prev.map(m => 
              m.id === assistantMessage.id 
                ? { ...m, content: fullContent }
                : m,
            ),
          )
        }
      }

      // Marcar como completado
      setMessages(prev => 
        prev.map(m => 
          m.id === assistantMessage.id 
            ? { ...m, content: fullContent, isStreaming: false }
            : m,
        ),
      )

      // Persistir respuesta
      if (persistHistory && fullContent) {
        try {
          await addConvexMessage({
            role: 'assistant',
            content: fullContent,
            userId,
          })
        } catch (e) {
          console.warn('Error persistiendo respuesta:', e)
        }
      }

    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        console.log('Solicitud cancelada')
      } else {
        setError(e instanceof Error ? e.message : 'Error desconocido')
      }
    } finally {
      setIsLoading(false)
      setStreamingContent('')
    }
  }, [messages, isLoading, systemPrompt, userId, persistHistory, addConvexMessage])

  // Cancelar streaming
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
    setStreamingContent('')
  }, [])

  // Limpiar historial
  const clearHistory = useCallback(async () => {
    setMessages([])
    if (persistHistory) {
      try {
        await clearConvexHistory({ userId })
      } catch (e) {
        console.warn('Error limpiando historial:', e)
      }
    }
  }, [userId, persistHistory, clearConvexHistory])

  // Estadísticas útiles
  const stats = useMemo(() => ({
    messageCount: messages.length,
    userMessages: messages.filter(m => m.role === 'user').length,
    assistantMessages: messages.filter(m => m.role === 'assistant').length,
    lastActivity: messages.length > 0 
      ? messages[messages.length - 1].timestamp 
      : null,
  }), [messages])

  return {
    messages,
    isLoading,
    error,
    streamingContent,
    sendMessage,
    cancel,
    clearHistory,
    stats,
  }
}

// ===== SYSTEM PROMPT OPTIMIZADO PARA CHRONOS =====

const SYSTEM_PROMPT_CHRONOS = `Eres el Asistente IA de CHRONOS, un sistema empresarial de gestión financiera de clase mundial.

## TU PERSONALIDAD
- Profesional pero cercano y empático
- Eficiente y directo en tus respuestas
- Siempre proactivo ofreciendo soluciones

## CONTEXTO DEL SISTEMA
CHRONOS gestiona:
- 7 Bancos/Bóvedas: Bóveda Monte, Bóveda USA, Profit, Leftie, Azteca, Flete Sur, Utilidades
- Ventas con distribución automática a 3 bancos (Monte=costo, FleteSur=flete, Utilidades=ganancia)
- Clientes con seguimiento de deudas y abonos
- Órdenes de compra con stock y pagos a distribuidores
- Movimientos financieros en tiempo real

## TUS CAPACIDADES
1. **Consultas**: Ventas, clientes, bancos, stock, movimientos
2. **Operaciones**: Registrar ventas, crear órdenes, registrar pagos
3. **Análisis**: Tendencias, proyecciones, alertas
4. **Reportes**: Resúmenes ejecutivos, estadísticas

## REGLAS IMPORTANTES
- Responde SIEMPRE en español
- Usa formato Markdown para mejor legibilidad
- Si necesitas datos, usa las herramientas disponibles
- Confirma operaciones financieras antes de ejecutarlas
- Proporciona contexto y explicaciones claras

## EJEMPLOS DE INTERACCIÓN
Usuario: "¿Cuánto tenemos en bóvedas?"
Tú: Consultaré los capitales actuales... [usa herramienta]
"💰 **Resumen de Capitales:**
- Bóveda Monte: $XXX,XXX
- Bóveda USA: $XX,XXX
- Total: $XXX,XXX"

Usuario: "Registra venta a Juan por 10 unidades a $10,000 c/u"
Tú: "📝 **Confirmo los datos de la venta:**
- Cliente: Juan
- Cantidad: 10 unidades
- Precio unitario: $10,000
- Total: $100,000

¿Procedo con el registro?"`

export default useChatAI
