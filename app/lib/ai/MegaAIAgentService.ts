/**
 * 🧠 MegaAIAgentService - Servicio de IA Conversacional Ultra-Avanzado
 * 
 * Este servicio proporciona capacidades de IA completas para:
 * - Comprensión de lenguaje natural en español
 * - Ejecución de comandos del sistema
 * - Automatización de formularios
 * - Análisis de datos y reportes
 * - Integración con Firebase/Firestore
 * - Gestión de ventas, clientes, distribuidores, bancos, almacén
 */

import { logger } from '@/app/lib/utils/logger'

// Tipos de intención del usuario
export type IntentType = 
  | 'query_ventas' 
  | 'query_clientes' 
  | 'query_distribuidores'
  | 'query_bancos'
  | 'query_almacen'
  | 'query_ordenes'
  | 'crear_venta'
  | 'crear_cliente'
  | 'crear_distribuidor'
  | 'crear_orden_compra'
  | 'registrar_pago'
  | 'transferir_banco'
  | 'generar_reporte'
  | 'analizar_datos'
  | 'navegar_panel'
  | 'ayuda'
  | 'saludo'
  | 'desconocido'

// Estructura de mensaje
export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    intent?: IntentType
    entities?: Record<string, unknown>
    action?: AIAction
    suggestions?: string[]
  }
}

// Acción a ejecutar
export interface AIAction {
  type: 'query' | 'create' | 'update' | 'delete' | 'navigate' | 'export' | 'none'
  target: string
  params?: Record<string, unknown>
  requiresConfirmation?: boolean
}

// Resultado de análisis de intención
export interface IntentAnalysisResult {
  intent: IntentType
  confidence: number
  entities: Record<string, unknown>
  action: AIAction
}

// Contexto de la conversación
export interface ConversationContext {
  userId: string
  sessionId: string
  history: AIMessage[]
  currentPanel?: string
  lastAction?: AIAction
  userPreferences?: Record<string, unknown>
}

// Patrones de intención para NLU en español
const INTENT_PATTERNS: Record<IntentType, RegExp[]> = {
  query_ventas: [
    /(?:ver|mostrar|consultar|dame|cuáles|cuantas|listar)\s*(?:las\s*)?ventas?/i,
    /ventas?\s*(?:de\s*)?(?:hoy|ayer|esta\s*semana|este\s*mes)/i,
    /(?:cuánto|cuanto)\s*(?:se\s*)?(?:vendió|vendio|ha\s*vendido)/i,
    /(?:resumen|reporte)\s*(?:de\s*)?ventas?/i,
    /top\s*(?:productos?|clientes?)\s*(?:vendidos?)?/i,
  ],
  query_clientes: [
    /(?:ver|mostrar|consultar|dame|listar)\s*(?:los\s*)?clientes?/i,
    /(?:cuántos|cuantos)\s*clientes?\s*(?:tenemos|hay)/i,
    /(?:buscar|encontrar)\s*cliente/i,
    /clientes?\s*(?:con\s*)?deuda/i,
    /clientes?\s*(?:activos?|inactivos?)/i,
  ],
  query_distribuidores: [
    /(?:ver|mostrar|consultar|dame|listar)\s*(?:los\s*)?distribuidores?/i,
    /(?:cuántos|cuantos)\s*distribuidores?\s*(?:tenemos|hay)/i,
    /distribuidores?\s*(?:con\s*)?(?:deuda|crédito)/i,
    /(?:proveedores?|distribuidores?)/i,
  ],
  query_bancos: [
    /(?:ver|mostrar|consultar|dame)\s*(?:el\s*)?(?:estado|saldo)\s*(?:de\s*)?(?:los\s*)?bancos?/i,
    /(?:cuánto|cuanto)\s*(?:hay|tenemos)\s*(?:en\s*)?(?:el\s*)?banco/i,
    /capital\s*(?:total|disponible)/i,
    /(?:bóveda|boveda)\s*(?:monte|usa)/i,
    /(?:fletes?|utilidades?)/i,
    /(?:transferencias?|movimientos?)\s*(?:de\s*)?banco/i,
  ],
  query_almacen: [
    /(?:ver|mostrar|consultar|dame)\s*(?:el\s*)?(?:stock|inventario|almacén|almacen)/i,
    /productos?\s*(?:con\s*)?(?:stock\s*)?(?:bajo|crítico|critico)/i,
    /(?:cuántos|cuantos)\s*productos?\s*(?:hay|tenemos)/i,
    /(?:entradas?|salidas?)\s*(?:de\s*)?almacén/i,
  ],
  query_ordenes: [
    /(?:ver|mostrar|consultar|dame|listar)\s*(?:las\s*)?órdenes?\s*(?:de\s*)?compra/i,
    /(?:cuántas|cuantas)\s*órdenes?\s*(?:pendientes?|hay)/i,
    /ordenes?\s*(?:por\s*)?(?:pagar|recibir)/i,
  ],
  crear_venta: [
    /(?:crear|registrar|hacer|nueva)\s*(?:una\s*)?venta/i,
    /vender\s*(?:a|para)/i,
    /(?:quiero|necesito)\s*(?:hacer|registrar)\s*(?:una\s*)?venta/i,
  ],
  crear_cliente: [
    /(?:crear|registrar|agregar|nuevo)\s*(?:un\s*)?cliente/i,
    /(?:dar\s*de\s*)?alta\s*(?:a\s*)?(?:un\s*)?cliente/i,
  ],
  crear_distribuidor: [
    /(?:crear|registrar|agregar|nuevo)\s*(?:un\s*)?distribuidor/i,
    /(?:dar\s*de\s*)?alta\s*(?:a\s*)?(?:un\s*)?(?:distribuidor|proveedor)/i,
  ],
  crear_orden_compra: [
    /(?:crear|registrar|hacer|nueva)\s*(?:una\s*)?orden\s*(?:de\s*)?compra/i,
    /(?:pedir|ordenar)\s*(?:a|de)\s*(?:proveedor|distribuidor)/i,
    /(?:comprar|pedir)\s*(?:productos?|mercancía)/i,
  ],
  registrar_pago: [
    /(?:registrar|anotar|agregar)\s*(?:un\s*)?(?:pago|abono)/i,
    /(?:cliente|distribuidor)\s*(?:pagó|pago|abonó|abono)/i,
    /(?:recibir|recibimos)\s*(?:pago|dinero)/i,
  ],
  transferir_banco: [
    /(?:transferir|mover|pasar)\s*(?:dinero|fondos)\s*(?:de|a)\s*banco/i,
    /(?:hacer|realizar)\s*(?:una\s*)?transferencia/i,
    /(?:de\s*)?(?:bóveda|boveda|fletes?|utilidades?)\s*(?:a|hacia)/i,
  ],
  generar_reporte: [
    /(?:generar|crear|hacer|exportar)\s*(?:un\s*)?reporte/i,
    /(?:descargar|exportar)\s*(?:datos?|información|excel|pdf)/i,
    /reporte\s*(?:de\s*)?(?:ventas?|clientes?|inventario)/i,
  ],
  analizar_datos: [
    /(?:analizar|análisis|analisis)\s*(?:de\s*)?(?:datos?|ventas?|tendencias?)/i,
    /(?:insights?|predicciones?|proyecciones?)/i,
    /(?:cómo|como)\s*(?:va|van)\s*(?:las\s*)?ventas?/i,
    /tendencias?\s*(?:de\s*)?(?:ventas?|productos?)/i,
  ],
  navegar_panel: [
    /(?:ir|ve|abrir|mostrar|llevar)\s*(?:a|al)\s*(?:panel\s*)?(?:de\s*)?(dashboard|ventas?|clientes?|distribuidores?|bancos?|almacén|reportes?|ia)/i,
    /(?:abre|muestra)\s*(?:el\s*)?panel\s*(?:de\s*)?\w+/i,
    /(?:cambia|cambiar)\s*(?:a|al)\s*panel/i,
  ],
  ayuda: [
    /(?:ayuda|help|qué\s*puedes?\s*hacer)/i,
    /(?:cómo|como)\s*(?:funciona|uso|se\s*usa)/i,
    /(?:qué|que)\s*(?:comandos?|opciones?)\s*(?:hay|tengo)/i,
    /(?:explicar?|explícame|explicame)/i,
  ],
  saludo: [
    /^(?:hola|hey|buenas?|qué\s*tal|buenos?\s*días?|buenas?\s*tardes?|buenas?\s*noches?)/i,
    /(?:cómo|como)\s*(?:estás?|estas?)/i,
  ],
  desconocido: [],
}

// Mapeo de paneles para navegación
const PANEL_MAPPING: Record<string, string> = {
  dashboard: 'dashboard',
  inicio: 'dashboard',
  principal: 'dashboard',
  ventas: 'ventas',
  venta: 'ventas',
  clientes: 'clientes',
  cliente: 'clientes',
  distribuidores: 'distribuidores',
  distribuidor: 'distribuidores',
  proveedores: 'distribuidores',
  bancos: 'bancos',
  banco: 'bancos',
  financiero: 'bancos',
  'bóveda': 'boveda_monte',
  boveda: 'boveda_monte',
  'bóveda monte': 'boveda_monte',
  'boveda monte': 'boveda_monte',
  usa: 'boveda_usa',
  'banco usa': 'boveda_usa',
  fletes: 'flete_sur',
  'flete sur': 'flete_sur',
  utilidades: 'utilidades',
  almacén: 'almacen',
  almacen: 'almacen',
  inventario: 'almacen',
  stock: 'almacen',
  productos: 'almacen',
  reportes: 'reportes',
  reporte: 'reportes',
  ordenes: 'ordenes_compra',
  órdenes: 'ordenes_compra',
  'ordenes compra': 'ordenes_compra',
  'órdenes compra': 'ordenes_compra',
  ia: 'ia',
  'inteligencia artificial': 'ia',
  asistente: 'ia',
}

/**
 * Clase principal del servicio MegaAIAgent
 */
export class MegaAIAgentService {
  private context: ConversationContext
  private systemPrompt: string

  constructor(userId: string, sessionId?: string) {
    this.context = {
      userId,
      sessionId: sessionId || `session_${Date.now()}`,
      history: [],
    }
    
    this.systemPrompt = `Eres Chronos, un asistente de IA empresarial ultra-avanzado para el sistema de gestión CHRONOS.

Tu rol es:
1. Ayudar a los usuarios a gestionar ventas, clientes, distribuidores, bancos e inventario
2. Responder consultas sobre datos del sistema de manera clara y concisa
3. Ejecutar comandos y automatizar tareas cuando se solicite
4. Proporcionar análisis e insights sobre el negocio
5. Guiar a los usuarios en el uso del sistema

Reglas:
- Siempre responde en español mexicano profesional
- Sé conciso pero informativo
- Usa emojis apropiados para mejorar la legibilidad
- Proporciona sugerencias de acciones relacionadas
- Si no entiendes algo, pide clarificación amablemente
- Para acciones que modifiquen datos, pide confirmación

Capacidades del sistema:
- 7 bancos/bóvedas: Monte, USA, Profit, Leftie, Azteca, Flete Sur, Utilidades
- Gestión de ventas con distribución automática entre bancos (80-10-10)
- Control de clientes y distribuidores con crédito
- Inventario con trazabilidad completa
- Órdenes de compra y pagos
- Reportes y análisis con IA`
  }

  /**
   * Analiza la intención del mensaje del usuario
   */
  analyzeIntent(message: string): IntentAnalysisResult {
    const normalizedMessage = message.toLowerCase().trim()
    let bestMatch: { intent: IntentType; confidence: number } = { 
      intent: 'desconocido', 
      confidence: 0, 
    }

    // Buscar coincidencias con patrones
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedMessage)) {
          const confidence = this.calculateConfidence(normalizedMessage, pattern)
          if (confidence > bestMatch.confidence) {
            bestMatch = { intent: intent as IntentType, confidence }
          }
        }
      }
    }

    // Si no hay coincidencia clara, intentar inferir
    if (bestMatch.confidence < 0.3) {
      bestMatch = this.inferIntent(normalizedMessage)
    }

    // Extraer entidades
    const entities = this.extractEntities(normalizedMessage, bestMatch.intent)
    
    // Determinar acción
    const action = this.determineAction(bestMatch.intent, entities)

    logger.info('Intent analyzed', { 
      context: 'MegaAIAgentService', 
      data: { message, intent: bestMatch.intent, confidence: bestMatch.confidence }, 
    })

    return {
      intent: bestMatch.intent,
      confidence: bestMatch.confidence,
      entities,
      action,
    }
  }

  /**
   * Calcula la confianza de una coincidencia
   */
  private calculateConfidence(message: string, pattern: RegExp): number {
    const match = message.match(pattern)
    if (!match) return 0
    
    // Mayor confianza si la coincidencia es más larga respecto al mensaje
    const matchLength = match[0].length
    const messageLength = message.length
    return Math.min(0.9, 0.5 + (matchLength / messageLength) * 0.5)
  }

  /**
   * Intenta inferir la intención si no hay coincidencia clara
   */
  private inferIntent(message: string): { intent: IntentType; confidence: number } {
    // Palabras clave secundarias
    const keywordMap: Record<string, IntentType> = {
      venta: 'query_ventas',
      vendí: 'query_ventas',
      cliente: 'query_clientes',
      distribuidor: 'query_distribuidores',
      proveedor: 'query_distribuidores',
      banco: 'query_bancos',
      dinero: 'query_bancos',
      capital: 'query_bancos',
      stock: 'query_almacen',
      producto: 'query_almacen',
      inventario: 'query_almacen',
      orden: 'query_ordenes',
      compra: 'query_ordenes',
      reporte: 'generar_reporte',
      análisis: 'analizar_datos',
      tendencia: 'analizar_datos',
    }

    for (const [keyword, intent] of Object.entries(keywordMap)) {
      if (message.includes(keyword)) {
        return { intent, confidence: 0.4 }
      }
    }

    return { intent: 'desconocido', confidence: 0 }
  }

  /**
   * Extrae entidades del mensaje
   */
  private extractEntities(message: string, intent: IntentType): Record<string, unknown> {
    const entities: Record<string, unknown> = {}

    // Extraer fechas
    const datePatterns = {
      hoy: new Date(),
      ayer: new Date(Date.now() - 86400000),
      'esta semana': 'current_week',
      'este mes': 'current_month',
      'este año': 'current_year',
    }
    
    for (const [pattern, value] of Object.entries(datePatterns)) {
      if (message.includes(pattern)) {
        entities.timeRange = value
      }
    }

    // Extraer montos (ej: $5000, 5,000 pesos)
    const montoMatch = message.match(/\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i)
    if (montoMatch) {
      entities.monto = parseFloat(montoMatch[1].replace(/,/g, ''))
    }

    // Extraer nombres de panel para navegación
    if (intent === 'navegar_panel') {
      for (const [keyword, panel] of Object.entries(PANEL_MAPPING)) {
        if (message.includes(keyword)) {
          entities.targetPanel = panel
          break
        }
      }
    }

    // Extraer cantidades
    const cantidadMatch = message.match(/(\d+)\s*(?:productos?|unidades?|piezas?)/i)
    if (cantidadMatch) {
      entities.cantidad = parseInt(cantidadMatch[1])
    }

    return entities
  }

  /**
   * Determina la acción a ejecutar basada en la intención
   */
  private determineAction(intent: IntentType, entities: Record<string, unknown>): AIAction {
    const actionMap: Record<IntentType, AIAction> = {
      query_ventas: { type: 'query', target: 'ventas', params: entities },
      query_clientes: { type: 'query', target: 'clientes', params: entities },
      query_distribuidores: { type: 'query', target: 'distribuidores', params: entities },
      query_bancos: { type: 'query', target: 'bancos', params: entities },
      query_almacen: { type: 'query', target: 'almacen', params: entities },
      query_ordenes: { type: 'query', target: 'ordenes_compra', params: entities },
      crear_venta: { type: 'create', target: 'venta', params: entities, requiresConfirmation: true },
      crear_cliente: { type: 'create', target: 'cliente', params: entities, requiresConfirmation: true },
      crear_distribuidor: { type: 'create', target: 'distribuidor', params: entities, requiresConfirmation: true },
      crear_orden_compra: { type: 'create', target: 'orden_compra', params: entities, requiresConfirmation: true },
      registrar_pago: { type: 'create', target: 'pago', params: entities, requiresConfirmation: true },
      transferir_banco: { type: 'create', target: 'transferencia', params: entities, requiresConfirmation: true },
      generar_reporte: { type: 'export', target: 'reporte', params: entities },
      analizar_datos: { type: 'query', target: 'analytics', params: entities },
      navegar_panel: { type: 'navigate', target: entities.targetPanel as string || 'dashboard' },
      ayuda: { type: 'none', target: 'help' },
      saludo: { type: 'none', target: 'greeting' },
      desconocido: { type: 'none', target: 'clarify' },
    }

    return actionMap[intent] || { type: 'none', target: 'unknown' }
  }

  /**
   * Genera respuesta basada en el análisis de intención
   */
  async generateResponse(
    message: string, 
    data?: Record<string, unknown>,
  ): Promise<{ response: string; action: AIAction; suggestions: string[] }> {
    const analysis = this.analyzeIntent(message)
    
    // Agregar mensaje al historial
    this.context.history.push({
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      metadata: { intent: analysis.intent, entities: analysis.entities },
    })

    let response: string
    let suggestions: string[] = []

    switch (analysis.intent) {
      case 'saludo':
        response = this.generateGreeting()
        suggestions = ['Resumen del día', 'Ver ventas', 'Estado de bancos', 'Inventario']
        break

      case 'ayuda':
        response = this.generateHelp()
        suggestions = ['Crear venta', 'Ver clientes', 'Generar reporte', 'Análisis de datos']
        break

      case 'query_ventas':
        response = this.generateVentasResponse(data, analysis.entities)
        suggestions = ['Ver detalle', 'Exportar Excel', 'Comparar con ayer', 'Top productos']
        break

      case 'query_clientes':
        response = this.generateClientesResponse(data, analysis.entities)
        suggestions = ['Clientes con deuda', 'Nuevo cliente', 'Ver morosos', 'Exportar lista']
        break

      case 'query_distribuidores':
        response = this.generateDistribuidoresResponse(data, analysis.entities)
        suggestions = ['Ver deudas', 'Registrar pago', 'Nueva orden', 'Crédito disponible']
        break

      case 'query_bancos':
        response = this.generateBancosResponse(data, analysis.entities)
        suggestions = ['Ver movimientos', 'Hacer transferencia', 'Generar corte', 'Historial']
        break

      case 'query_almacen':
        response = this.generateAlmacenResponse(data, analysis.entities)
        suggestions = ['Stock crítico', 'Reabastecer', 'Ver movimientos', 'Generar reporte']
        break

      case 'query_ordenes':
        response = this.generateOrdenesResponse(data, analysis.entities)
        suggestions = ['Órdenes pendientes', 'Nueva orden', 'Ver pagadas', 'Programar pago']
        break

      case 'crear_venta':
        response = '📝 ¡Perfecto! Vamos a crear una nueva venta.\n\n¿A qué cliente va dirigida esta venta? También puedo abrir el formulario de venta directamente.'
        suggestions = ['Abrir formulario', 'Buscar cliente', 'Ver últimas ventas']
        break

      case 'crear_cliente':
        response = '👤 Vamos a registrar un nuevo cliente.\n\n¿Cuál es el nombre del cliente? Puedo abrir el formulario de registro directo.'
        suggestions = ['Abrir formulario', 'Importar de Excel', 'Ver clientes recientes']
        break

      case 'crear_orden_compra':
        response = '📦 Vamos a crear una orden de compra.\n\n¿A qué distribuidor va dirigida? Puedo abrir el formulario o guiarte paso a paso.'
        suggestions = ['Abrir formulario', 'Ver stock bajo', 'Distribuidores disponibles']
        break

      case 'registrar_pago':
        response = '💰 Vamos a registrar un pago.\n\n¿Es un pago de cliente o a distribuidor? ¿Cuál es el monto?'
        suggestions = ['Pago de cliente', 'Pago a distribuidor', 'Ver pendientes']
        break

      case 'transferir_banco':
        response = '🏦 Vamos a realizar una transferencia entre bancos.\n\n¿De qué banco a cuál? ¿Cuál es el monto?'
        suggestions = ['Bóveda a Utilidades', 'Ver saldos', 'Historial transferencias']
        break

      case 'generar_reporte':
        response = '📊 ¡Excelente! Puedo generar varios tipos de reportes:\n\n• Reporte de ventas\n• Estado financiero\n• Inventario actual\n• Estado de cuenta\n\n¿Cuál necesitas?'
        suggestions = ['Reporte de ventas', 'Estado financiero', 'Inventario', 'Personalizado']
        break

      case 'analizar_datos':
        response = this.generateAnalyticsResponse(data, analysis.entities)
        suggestions = ['Ver tendencias', 'Predicciones', 'Comparar periodos', 'Descargar insights']
        break

      case 'navegar_panel':
        const targetPanel = analysis.entities.targetPanel as string
        response = `🧭 Te llevo al panel de ${targetPanel.replace('_', ' ').toUpperCase()}...`
        suggestions = ['Ver resumen', 'Acción rápida', 'Volver al inicio']
        break

      default:
        response = '🤔 No estoy seguro de entender tu solicitud. ¿Podrías reformularla?\n\nPuedo ayudarte con:\n• Consultas de ventas, clientes, inventario\n• Crear registros (ventas, clientes, órdenes)\n• Generar reportes\n• Análisis de datos'
        suggestions = ['Ver opciones', 'Ejemplos de comandos', 'Ayuda']
    }

    // Agregar respuesta al historial
    this.context.history.push({
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      metadata: { action: analysis.action, suggestions },
    })

    return { response, action: analysis.action, suggestions }
  }

  /**
   * Genera saludo personalizado
   */
  private generateGreeting(): string {
    const hora = new Date().getHours()
    let saludo = ''
    
    if (hora < 12) saludo = '¡Buenos días!'
    else if (hora < 18) saludo = '¡Buenas tardes!'
    else saludo = '¡Buenas noches!'
    
    return `${saludo} 👋\n\nSoy **Chronos**, tu asistente de IA para el sistema de gestión empresarial.\n\n¿En qué puedo ayudarte hoy? Puedo:\n\n📊 Consultar datos de ventas, clientes, inventario\n📝 Crear ventas, órdenes y registros\n🏦 Gestionar bancos y transferencias\n📈 Generar reportes y análisis\n🎯 Guiarte por el sistema`
  }

  /**
   * Genera mensaje de ayuda
   */
  private generateHelp(): string {
    return `🤖 **Comandos y capacidades de Chronos:**

📊 **Consultas:**
• "Ver ventas de hoy" - Muestra las ventas del día
• "¿Cuánto hay en bancos?" - Saldo de todos los bancos
• "Clientes con deuda" - Lista clientes morosos
• "Stock crítico" - Productos con bajo inventario

📝 **Crear registros:**
• "Nueva venta" - Inicia proceso de venta
• "Nuevo cliente" - Registra un cliente
• "Crear orden de compra" - Orden a proveedor
• "Registrar pago" - Pago de cliente/proveedor

🏦 **Operaciones bancarias:**
• "Transferir de bóveda a utilidades"
• "Ver movimientos del banco USA"
• "Generar corte de caja"

📈 **Reportes y análisis:**
• "Generar reporte de ventas"
• "Análisis de tendencias"
• "Exportar a Excel"

🧭 **Navegación:**
• "Ir al panel de clientes"
• "Abrir almacén"
• "Mostrar dashboard"

💡 **Tip:** Puedes hablarme naturalmente, entiendo español y el contexto de tu negocio.`
  }

  /**
   * Genera respuesta sobre ventas
   */
  private generateVentasResponse(data?: Record<string, unknown>, entities?: Record<string, unknown>): string {
    if (!data?.ventas) {
      return '📊 Para darte información de ventas, necesito acceder a los datos del sistema. Un momento...\n\n*Cargando datos de ventas...*'
    }

    const ventas = data.ventas as unknown[]
    const total = (ventas as { precioTotalVenta: number }[]).reduce((sum, v) => sum + v.precioTotalVenta, 0)
    
    return `📊 **Resumen de Ventas:**

• **Total ventas:** ${ventas.length} operaciones
• **Monto total:** $${total.toLocaleString('es-MX')}
• **Ticket promedio:** $${ventas.length > 0 ? (total / ventas.length).toLocaleString('es-MX') : 0}

¿Deseas ver más detalles o aplicar algún filtro?`
  }

  /**
   * Genera respuesta sobre clientes
   */
  private generateClientesResponse(data?: Record<string, unknown>, entities?: Record<string, unknown>): string {
    if (!data?.clientes) {
      return '👥 Cargando información de clientes...'
    }

    const clientes = data.clientes as { deudaTotal?: number }[]
    const conDeuda = clientes.filter(c => (c.deudaTotal || 0) > 0)
    const deudaTotal = clientes.reduce((sum, c) => sum + (c.deudaTotal || 0), 0)

    return `👥 **Resumen de Clientes:**

• **Total clientes:** ${clientes.length}
• **Clientes con deuda:** ${conDeuda.length}
• **Deuda total por cobrar:** $${deudaTotal.toLocaleString('es-MX')}

¿Necesitas ver la lista de clientes morosos o registrar un abono?`
  }

  /**
   * Genera respuesta sobre distribuidores
   */
  private generateDistribuidoresResponse(data?: Record<string, unknown>, entities?: Record<string, unknown>): string {
    if (!data?.distribuidores) {
      return '🚚 Cargando información de distribuidores...'
    }

    const distribuidores = data.distribuidores as { deudaTotal?: number; creditoTotal?: number }[]
    const deudaTotal = distribuidores.reduce((sum, d) => sum + (d.deudaTotal || 0), 0)

    return `🚚 **Resumen de Distribuidores:**

• **Total distribuidores:** ${distribuidores.length}
• **Deuda total a pagar:** $${deudaTotal.toLocaleString('es-MX')}

¿Deseas ver el detalle de algún distribuidor o registrar un pago?`
  }

  /**
   * Genera respuesta sobre bancos
   */
  private generateBancosResponse(data?: Record<string, unknown>, entities?: Record<string, unknown>): string {
    if (!data?.bancos) {
      return '🏦 Cargando información de bancos...'
    }

    const bancos = data.bancos as { nombre: string; saldo: number }[]
    const totalCapital = bancos.reduce((sum, b) => sum + b.saldo, 0)
    const detalle = bancos.map(b => `• **${b.nombre}:** $${b.saldo.toLocaleString('es-MX')}`).join('\n')

    return `🏦 **Estado Financiero:**

${detalle}

💰 **Capital Total:** $${totalCapital.toLocaleString('es-MX')}

¿Deseas ver movimientos o hacer una transferencia?`
  }

  /**
   * Genera respuesta sobre almacén
   */
  private generateAlmacenResponse(data?: Record<string, unknown>, entities?: Record<string, unknown>): string {
    if (!data?.productos) {
      return '📦 Cargando información de inventario...'
    }

    const productos = data.productos as { stockActual: number; valorUnitario: number }[]
    const stockBajo = productos.filter(p => p.stockActual < 10)
    const valorTotal = productos.reduce((sum, p) => sum + (p.stockActual * p.valorUnitario), 0)

    return `📦 **Estado del Inventario:**

• **Total productos:** ${productos.length}
• **Valor del inventario:** $${valorTotal.toLocaleString('es-MX')}
• **Productos con stock bajo:** ${stockBajo.length}

${stockBajo.length > 0 ? '⚠️ Hay productos que necesitan reabastecimiento.' : '✅ Inventario en buen estado.'}

¿Deseas ver los productos con stock crítico?`
  }

  /**
   * Genera respuesta sobre órdenes de compra
   */
  private generateOrdenesResponse(data?: Record<string, unknown>, entities?: Record<string, unknown>): string {
    if (!data?.ordenes) {
      return '📋 Cargando órdenes de compra...'
    }

    const ordenes = data.ordenes as { estado: string; precioTotal: number }[]
    const pendientes = ordenes.filter(o => o.estado === 'pendiente')
    const totalPendiente = pendientes.reduce((sum, o) => sum + o.precioTotal, 0)

    return `📋 **Órdenes de Compra:**

• **Total órdenes:** ${ordenes.length}
• **Pendientes:** ${pendientes.length}
• **Monto pendiente:** $${totalPendiente.toLocaleString('es-MX')}

¿Deseas ver el detalle de las órdenes pendientes o crear una nueva?`
  }

  /**
   * Genera respuesta de análisis
   */
  private generateAnalyticsResponse(data?: Record<string, unknown>, entities?: Record<string, unknown>): string {
    return `📈 **Análisis e Insights:**

Basado en los datos del sistema, puedo proporcionarte:

🔮 **Tendencias:**
• Comparación de ventas por periodo
• Productos más/menos vendidos
• Clientes más activos

📊 **Predicciones:**
• Proyección de ventas
• Stock necesario
• Flujo de caja estimado

💡 **Recomendaciones:**
• Productos a reabastecer
• Clientes para seguimiento
• Optimización de inventario

¿Qué tipo de análisis te gustaría ver?`
  }

  /**
   * Obtiene el historial de conversación
   */
  getHistory(): AIMessage[] {
    return [...this.context.history]
  }

  /**
   * Limpia el historial
   */
  clearHistory(): void {
    this.context.history = []
  }

  /**
   * Obtiene el contexto actual
   */
  getContext(): ConversationContext {
    return { ...this.context }
  }
}

// Instancia singleton
let megaAgentInstance: MegaAIAgentService | null = null

export function getMegaAIAgent(userId: string): MegaAIAgentService {
  if (!megaAgentInstance || megaAgentInstance.getContext().userId !== userId) {
    megaAgentInstance = new MegaAIAgentService(userId)
  }
  return megaAgentInstance
}

export default MegaAIAgentService
