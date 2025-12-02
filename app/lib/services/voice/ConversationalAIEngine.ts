/**
 * 🤖 ConversationalAIEngine - Motor de IA Conversacional Avanzado
 * 
 * Sistema de conversación natural con:
 * - Contexto de conversación persistente
 * - Detección de intenciones
 * - Respuestas streaming
 * - Integración con herramientas del sistema
 * - Memoria de corto plazo
 */

import { logger } from '@/app/lib/utils/logger'
import type { PanelId } from '@/app/types'

// ============================================================================
// TIPOS
// ============================================================================

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    intent?: string
    entities?: Record<string, string>
    confidence?: number
    toolCalls?: string[]
    emotion?: 'neutral' | 'positive' | 'concerned' | 'excited'
  }
}

export interface ConversationContext {
  messages: ConversationMessage[]
  currentPanel?: PanelId
  lastQuery?: string
  userPreferences?: {
    preferVoice: boolean
    speakResponses: boolean
    language: string
  }
  sessionStart: Date
  messageCount: number
}

export interface AIResponse {
  content: string
  suggestions?: string[]
  actions?: {
    type: 'navigate' | 'create' | 'update' | 'delete' | 'report'
    target?: string
    data?: Record<string, unknown>
  }[]
  emotion?: 'neutral' | 'positive' | 'concerned' | 'excited'
  shouldSpeak?: boolean
}

export interface IntentResult {
  intent: string
  confidence: number
  entities: Record<string, string>
  requiresConfirmation: boolean
}

// ============================================================================
// PATRONES DE INTENCIÓN
// ============================================================================

const INTENT_PATTERNS: Array<{
  intent: string
  patterns: RegExp[]
  entities?: string[]
  requiresConfirmation?: boolean
}> = [
  // Navegación
  {
    intent: 'navigate',
    patterns: [
      /(?:ir|ve|abrir|muestra|lleva|abre)\s*(?:a|al|el)?\s*(?:panel\s*)?(?:de\s*)?(dashboard|ventas?|clientes?|distribuidores?|bancos?|almacén|almacen|reportes?|ia)/i,
      /(?:cambiar?|cambiar)\s*(?:a|al)\s*(?:panel\s*)?(?:de\s*)?(\w+)/i,
    ],
    entities: ['panel'],
  },
  // Consultas de datos
  {
    intent: 'query_sales',
    patterns: [
      /(?:cu[aá]nto|cu[aá]les|cu[aá]ntas)\s*(?:son|hay|tenemos)?\s*(?:las\s*)?ventas?/i,
      /(?:ventas?)\s*(?:de|del)?\s*(hoy|ayer|semana|mes|año)?/i,
      /(?:total|resumen)\s*(?:de\s*)?ventas?/i,
    ],
    entities: ['periodo'],
  },
  {
    intent: 'query_clients',
    patterns: [
      /(?:cu[aá]ntos?|lista|listar)\s*clientes?/i,
      /(?:clientes?)\s*(?:con\s*)?(?:deuda|activos|pendientes)/i,
      /(?:qui[eé]n|qui[eé]nes)\s*(?:nos?\s*)?debe/i,
    ],
    entities: ['filter'],
  },
  {
    intent: 'query_inventory',
    patterns: [
      /(?:inventario|stock|almac[eé]n)/i,
      /(?:productos?)\s*(?:sin\s*stock|bajo\s*stock|agotados?)/i,
      /(?:cu[aá]ntos?)\s*(?:productos?|unidades)/i,
    ],
    entities: ['filter'],
  },
  {
    intent: 'query_finances',
    patterns: [
      /(?:capital|saldo|dinero|fondos?)\s*(?:en\s*)?(?:bancos?|b[oó]vedas?)?/i,
      /(?:estado\s*)?financiero/i,
      /(?:cu[aá]nto\s*)?(?:hay|tenemos)\s*(?:en\s*)?(profit|leftie|azteca|monte|utilidades)/i,
    ],
    entities: ['banco'],
  },
  // Acciones de creación
  {
    intent: 'create_sale',
    patterns: [
      /(?:registrar?|crear?|nueva?)\s*venta/i,
      /(?:vender|venta\s*a)\s*(\w+)/i,
    ],
    requiresConfirmation: true,
    entities: ['cliente'],
  },
  {
    intent: 'create_payment',
    patterns: [
      /(?:registrar?|pagar?|hacer?)\s*(?:un\s*)?pago/i,
      /(?:pago\s*a)\s*(\w+)/i,
    ],
    requiresConfirmation: true,
    entities: ['destinatario'],
  },
  // Reportes
  {
    intent: 'generate_report',
    patterns: [
      /(?:generar?|crear?|hacer?)\s*(?:un\s*)?reporte/i,
      /(?:reporte|informe)\s*(?:de\s*)?(ventas?|financiero|inventario|clientes?)/i,
      /(?:exportar?)\s*(?:a\s*)?(pdf|excel)/i,
    ],
    entities: ['tipo', 'formato'],
  },
  // Análisis e insights
  {
    intent: 'analyze',
    patterns: [
      /(?:analizar?|an[aá]lisis|insights?)/i,
      /(?:c[oó]mo\s*)?(?:van?|est[aá]n?|va)\s*(?:las\s*)?(ventas?|finanzas?|negocio)/i,
      /(?:qu[eé]\s*)?(?:me\s*)?(?:recomiendas?|sugieres?)/i,
    ],
    entities: ['area'],
  },
  // Saludos y conversación
  {
    intent: 'greeting',
    patterns: [
      /^(?:hola|buenos?\s*(?:d[ií]as?|tardes?|noches?))/i,
      /^(?:qu[eé]\s*tal|c[oó]mo\s*est[aá]s?)/i,
    ],
  },
  {
    intent: 'help',
    patterns: [
      /(?:ayuda|ayudar?|help)/i,
      /(?:qu[eé]\s*)?puedes?\s*hacer/i,
      /(?:c[oó]mo)\s*(?:funciona|uso|te\s*uso)/i,
    ],
  },
  {
    intent: 'thanks',
    patterns: [
      /(?:gracias?|thank)/i,
      /(?:perfecto|excelente|genial)/i,
    ],
  },
]

// Mapeo de paneles
const PANEL_MAP: Record<string, PanelId> = {
  dashboard: 'dashboard',
  venta: 'ventas',
  ventas: 'ventas',
  cliente: 'clientes',
  clientes: 'clientes',
  distribuidor: 'distribuidores',
  distribuidores: 'distribuidores',
  banco: 'bancos',
  bancos: 'bancos',
  almacen: 'almacen',
  almacén: 'almacen',
  reporte: 'reportes',
  reportes: 'reportes',
  ia: 'ia',
}

// ============================================================================
// CONVERSATIONAL AI ENGINE
// ============================================================================

export class ConversationalAIEngine {
  private context: ConversationContext
  private abortController: AbortController | null = null
  private apiEndpoint = '/api/ai/conversational'

  constructor() {
    this.context = {
      messages: [],
      sessionStart: new Date(),
      messageCount: 0,
      userPreferences: {
        preferVoice: true,
        speakResponses: true,
        language: 'es-MX',
      },
    }
  }

  // ============================================================================
  // DETECCIÓN DE INTENCIÓN
  // ============================================================================

  detectIntent(text: string): IntentResult {
    const normalizedText = text.toLowerCase().trim()

    for (const { intent, patterns, entities = [], requiresConfirmation = false } of INTENT_PATTERNS) {
      for (const pattern of patterns) {
        const match = normalizedText.match(pattern)
        if (match) {
          const extractedEntities: Record<string, string> = {}
          
          // Extraer entidades del match
          if (match.length > 1 && entities.length > 0) {
            entities.forEach((entity, index) => {
              if (match[index + 1]) {
                extractedEntities[entity] = match[index + 1]
              }
            })
          }

          // Extraer panel para navegación
          if (intent === 'navigate') {
            const panelMatch = normalizedText.match(/(dashboard|ventas?|clientes?|distribuidores?|bancos?|almac[eé]n|reportes?|ia)/i)
            if (panelMatch) {
              const panelKey = panelMatch[1].toLowerCase().replace('é', 'e')
              extractedEntities.panel = PANEL_MAP[panelKey] || panelKey
            }
          }

          logger.debug('Intención detectada', { 
            context: 'ConversationalAI', 
            data: { intent, entities: extractedEntities, text: normalizedText }, 
          })

          return {
            intent,
            confidence: 0.85,
            entities: extractedEntities,
            requiresConfirmation,
          }
        }
      }
    }

    return {
      intent: 'general_query',
      confidence: 0.5,
      entities: {},
      requiresConfirmation: false,
    }
  }

  // ============================================================================
  // PROCESAMIENTO DE MENSAJES
  // ============================================================================

  async processMessage(userText: string): Promise<AIResponse> {
    // Cancelar solicitud anterior si existe
    if (this.abortController) {
      this.abortController.abort()
    }
    this.abortController = new AbortController()

    // Detectar intención localmente primero
    const intent = this.detectIntent(userText)
    
    // Agregar mensaje del usuario al contexto
    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date(),
      metadata: {
        intent: intent.intent,
        entities: intent.entities,
        confidence: intent.confidence,
      },
    }
    this.context.messages.push(userMessage)
    this.context.messageCount++
    this.context.lastQuery = userText

    try {
      // Respuestas rápidas para intenciones simples
      const quickResponse = this.getQuickResponse(intent)
      if (quickResponse) {
        return this.createResponse(quickResponse, intent)
      }

      // Llamar al API para respuestas complejas
      const response = await this.callAPI(userText)
      return this.createResponse(response, intent)

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw error
      }

      logger.error('Error procesando mensaje', error, { context: 'ConversationalAI' })
      
      return {
        content: 'Lo siento, hubo un problema procesando tu solicitud. ¿Podrías intentarlo de nuevo?',
        emotion: 'concerned',
        shouldSpeak: true,
      }
    }
  }

  private getQuickResponse(intent: IntentResult): string | null {
    switch (intent.intent) {
      case 'greeting':
        const greetings = [
          '¡Hola! Soy Chronos, tu asistente. ¿En qué puedo ayudarte hoy?',
          '¡Buenos días! Estoy listo para asistirte. ¿Qué necesitas?',
          '¡Hola! ¿Qué te gustaría hacer hoy?',
        ]
        return greetings[Math.floor(Math.random() * greetings.length)]

      case 'thanks':
        const thanks = [
          '¡Con gusto! Si necesitas algo más, aquí estaré.',
          '¡De nada! ¿Hay algo más en lo que pueda ayudarte?',
          '¡Es un placer! No dudes en preguntar si necesitas algo.',
        ]
        return thanks[Math.floor(Math.random() * thanks.length)]

      case 'help':
        return `Puedo ayudarte con muchas cosas:

📊 **Consultas**: "¿Cuántas ventas hay hoy?", "¿Quién nos debe?"
🧭 **Navegación**: "Ir a ventas", "Abrir panel de clientes"
📝 **Acciones**: "Registrar venta", "Generar reporte"
📈 **Análisis**: "¿Cómo van las ventas?", "Analizar finanzas"

Solo pregúntame lo que necesites.`

      default:
        return null
    }
  }

  private async callAPI(userText: string): Promise<string> {
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: this.context.messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content,
        })),
        userId: 'user-001',
      }),
      signal: this.abortController?.signal,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    // Leer streaming
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let content = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
      }
    }

    return content || 'No pude obtener una respuesta. Intenta de nuevo.'
  }

  private createResponse(content: string, intent: IntentResult): AIResponse {
    const response: AIResponse = {
      content,
      shouldSpeak: this.context.userPreferences?.speakResponses ?? true,
      emotion: this.detectEmotion(content),
      suggestions: this.generateSuggestions(intent),
      actions: this.extractActions(intent),
    }

    // Agregar respuesta al contexto
    const assistantMessage: ConversationMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      metadata: {
        emotion: response.emotion,
      },
    }
    this.context.messages.push(assistantMessage)

    return response
  }

  private detectEmotion(content: string): 'neutral' | 'positive' | 'concerned' | 'excited' {
    const lowerContent = content.toLowerCase()
    
    if (/error|problema|cuidado|atención|bajo|crítico/i.test(lowerContent)) {
      return 'concerned'
    }
    if (/excelente|fantástico|increíble|récord|máximo/i.test(lowerContent)) {
      return 'excited'
    }
    if (/perfecto|listo|completado|éxito|bien/i.test(lowerContent)) {
      return 'positive'
    }
    
    return 'neutral'
  }

  private generateSuggestions(intent: IntentResult): string[] {
    switch (intent.intent) {
      case 'query_sales':
        return ['Ver detalle por cliente', 'Comparar con ayer', 'Exportar reporte']
      case 'query_clients':
        return ['Ver clientes con deuda', 'Agregar nuevo cliente', 'Enviar recordatorio']
      case 'query_inventory':
        return ['Ver productos críticos', 'Generar orden de compra', 'Ver almacén']
      case 'query_finances':
        return ['Ver movimientos', 'Hacer transferencia', 'Generar estado financiero']
      case 'navigate':
        return ['Volver al dashboard', '¿Qué más puedo hacer?']
      default:
        return ['Ver dashboard', 'Consultar ventas', 'Estado de bancos']
    }
  }

  private extractActions(intent: IntentResult): AIResponse['actions'] {
    const actions: AIResponse['actions'] = []

    if (intent.intent === 'navigate' && intent.entities.panel) {
      actions.push({
        type: 'navigate',
        target: intent.entities.panel,
      })
    }

    if (intent.intent === 'generate_report') {
      actions.push({
        type: 'report',
        data: {
          tipo: intent.entities.tipo || 'general',
          formato: intent.entities.formato || 'pdf',
        },
      })
    }

    return actions.length > 0 ? actions : undefined
  }

  // ============================================================================
  // GESTIÓN DE CONTEXTO
  // ============================================================================

  setCurrentPanel(panel: PanelId): void {
    this.context.currentPanel = panel
  }

  clearContext(): void {
    this.context = {
      messages: [],
      sessionStart: new Date(),
      messageCount: 0,
      userPreferences: this.context.userPreferences,
    }
  }

  getContext(): ConversationContext {
    return { ...this.context }
  }

  getRecentMessages(count: number = 5): ConversationMessage[] {
    return this.context.messages.slice(-count)
  }

  cancelCurrentRequest(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let aiEngineInstance: ConversationalAIEngine | null = null

export function getConversationalAI(): ConversationalAIEngine {
  if (!aiEngineInstance) {
    aiEngineInstance = new ConversationalAIEngine()
  }
  return aiEngineInstance
}
