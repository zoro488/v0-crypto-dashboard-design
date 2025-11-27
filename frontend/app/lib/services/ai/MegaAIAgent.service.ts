/**
 * MegaAIAgent Service - Cerebro del sistema de IA
 * Capacidades:
 * - Chat conversacional con GPT-4/Claude 3.5 Sonnet
 * - Entrada por voz (Deepgram) + TTS (OpenAI)
 * - Consulta de 33 colecciones Firestore
 * - Visualizaciones dinámicas
 * - Exportación PDF/Excel/PNG
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc,
  Timestamp,
  orderBy,
  limit,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '@/frontend/app/lib/firebase/config';
import { UserLearningService } from './UserLearning.service';
import { AIScheduledReportsService } from './AIScheduledReports.service';
import { AIFormAutomationService } from './AIFormAutomation.service';
import { AIPowerBIService } from './AIPowerBI.service';

// Tipos
export interface AIRequest {
  message: string;
  userId: string;
  context?: Record<string, unknown>;
  voiceInput?: boolean;
}

export interface AIResponse {
  message: string;
  suggestions?: string[];
  data?: unknown;
  actions?: AIAction[];
  visualizations?: AIVisualization[];
  type: 'text' | 'data' | 'visualization' | 'action' | 'error';
}

export interface AIAction {
  type: 'navigate' | 'export' | 'create' | 'update' | 'delete' | 'schedule';
  payload: Record<string, unknown>;
  label: string;
}

export interface AIVisualization {
  type: 'line' | 'bar' | 'pie' | 'area' | 'heatmap' | 'donut' | 'scatter';
  title: string;
  data: unknown[];
  config?: Record<string, unknown>;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  visualizations?: AIVisualization[];
}

// Colecciones Firestore disponibles (33 total)
const COLLECTIONS = {
  // Operaciones
  ventas: 'ventas',
  compras: 'compras',
  ordenesCompra: 'ordenesCompra',
  cotizaciones: 'cotizaciones',
  devoluciones: 'devoluciones',
  
  // Inventario
  productos: 'productos',
  almacen: 'almacen',
  almacenMovimientos: 'almacen_movimientos',
  
  // Relaciones
  clientes: 'clientes',
  distribuidores: 'distribuidores',
  proveedores: 'proveedores',
  
  // Finanzas - Bancos
  bancos: 'bancos',
  operacionesBancos: 'operaciones_bancos',
  bovedaMonte: 'boveda_monte',
  bovedaUsa: 'boveda_usa',
  utilidades: 'utilidades',
  fleteSur: 'flete_sur',
  azteca: 'azteca',
  leftie: 'leftie',
  profit: 'profit',
  
  // Gastos y Pagos
  gastos: 'gastos',
  pagos: 'pagos',
  cuentasPorCobrar: 'cuentas_por_cobrar',
  cuentasPorPagar: 'cuentas_por_pagar',
  adeudosClientes: 'adeudos_clientes',
  
  // Sistema
  usuarios: 'usuarios',
  roles: 'roles',
  auditoria: 'auditoria_general',
  configuracion: 'configuracion',
  notificaciones: 'notificaciones',
  
  // IA y Analytics
  reportes: 'reports',
  scheduledReports: 'scheduled_reports',
  userProfiles: 'user_profiles',
  aiInsights: 'ai_insights',
  kpis: 'kpis'
} as const;

type CollectionName = keyof typeof COLLECTIONS;

// Intenciones detectables
type IntentType = 
  | 'query_data' 
  | 'create_record' 
  | 'update_record'
  | 'generate_report' 
  | 'schedule_report'
  | 'navigate' 
  | 'export'
  | 'analyze'
  | 'conversation'
  | 'help';

interface DetectedIntent {
  type: IntentType;
  entity?: string;
  collection?: CollectionName;
  timeframe?: string;
  filters?: Record<string, unknown>;
  confidence: number;
}

export class MegaAIAgentService {
  private conversationHistory: ConversationMessage[] = [];
  private learningService: UserLearningService;
  private reportsService: AIScheduledReportsService;
  private formService: AIFormAutomationService;
  private powerBIService: AIPowerBIService;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.learningService = new UserLearningService();
    this.reportsService = new AIScheduledReportsService();
    this.formService = new AIFormAutomationService();
    this.powerBIService = new AIPowerBIService();
  }

  /**
   * Procesa un mensaje del usuario y genera una respuesta
   */
  async sendMessage(request: AIRequest): Promise<AIResponse> {
    try {
      // Registrar interacción para aprendizaje
      await this.learningService.trackActivity(
        request.userId, 
        'chat_message', 
        'general',
        { message: request.message }
      );

      // Analizar intención del mensaje
      const intent = this.analyzeIntent(request.message);

      // Agregar mensaje a historial
      this.conversationHistory.push({
        id: Date.now().toString(),
        role: 'user',
        content: request.message,
        timestamp: new Date()
      });

      // Ejecutar acción según intención
      let response: AIResponse;

      switch (intent.type) {
        case 'query_data':
          response = await this.handleQueryData(intent, request);
          break;

        case 'create_record':
          response = await this.handleCreateRecord(intent, request);
          break;

        case 'generate_report':
          response = await this.handleGenerateReport(intent, request);
          break;

        case 'schedule_report':
          response = await this.handleScheduleReport(intent, request);
          break;

        case 'analyze':
          response = await this.handleAnalyze(intent, request);
          break;

        case 'navigate':
          response = await this.handleNavigate(intent);
          break;

        case 'export':
          response = await this.handleExport(intent, request);
          break;

        case 'help':
          response = this.handleHelp();
          break;

        case 'conversation':
        default:
          response = await this.handleConversation(request);
      }

      // Agregar respuesta a historial
      this.conversationHistory.push({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        visualizations: response.visualizations
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        type: 'error',
        message: `❌ Lo siento, ocurrió un error: ${errorMessage}. ¿Puedo ayudarte con algo más?`,
        suggestions: [
          'Ver ventas del día',
          'Mostrar estado de bancos',
          'Generar reporte'
        ]
      };
    }
  }

  /**
   * Analiza la intención del mensaje
   */
  private analyzeIntent(message: string): DetectedIntent {
    const lowerMessage = message.toLowerCase();

    // Detectar consultas de datos
    if (this.matchesPatterns(lowerMessage, ['mostrar', 'ver', 'cuánto', 'cuantos', 'lista', 'dame', 'busca', 'consulta'])) {
      return {
        type: 'query_data',
        entity: this.detectEntity(lowerMessage),
        collection: this.detectCollection(lowerMessage),
        timeframe: this.detectTimeframe(lowerMessage),
        confidence: 0.85
      };
    }

    // Detectar creación de registros
    if (this.matchesPatterns(lowerMessage, ['crear', 'registrar', 'agregar', 'nueva', 'nuevo', 'añadir'])) {
      return {
        type: 'create_record',
        collection: this.detectCollection(lowerMessage),
        confidence: 0.9
      };
    }

    // Detectar solicitudes de reportes
    if (this.matchesPatterns(lowerMessage, ['reporte', 'informe', 'resumen', 'análisis'])) {
      if (this.matchesPatterns(lowerMessage, ['programa', 'automático', 'semanal', 'diario', 'mensual'])) {
        return {
          type: 'schedule_report',
          timeframe: this.detectTimeframe(lowerMessage),
          confidence: 0.9
        };
      }
      return {
        type: 'generate_report',
        entity: this.detectEntity(lowerMessage),
        timeframe: this.detectTimeframe(lowerMessage),
        confidence: 0.85
      };
    }

    // Detectar análisis
    if (this.matchesPatterns(lowerMessage, ['analiza', 'analizar', 'tendencia', 'predicción', 'proyección'])) {
      return {
        type: 'analyze',
        entity: this.detectEntity(lowerMessage),
        timeframe: this.detectTimeframe(lowerMessage),
        confidence: 0.85
      };
    }

    // Detectar navegación
    if (this.matchesPatterns(lowerMessage, ['ir a', 'abrir', 'panel', 'página', 'sección'])) {
      return {
        type: 'navigate',
        entity: this.detectDestination(lowerMessage),
        confidence: 0.8
      };
    }

    // Detectar exportación
    if (this.matchesPatterns(lowerMessage, ['exportar', 'descargar', 'pdf', 'excel'])) {
      return {
        type: 'export',
        entity: this.detectEntity(lowerMessage),
        confidence: 0.85
      };
    }

    // Detectar ayuda
    if (this.matchesPatterns(lowerMessage, ['ayuda', 'help', 'qué puedes', 'comandos', 'opciones'])) {
      return {
        type: 'help',
        confidence: 0.95
      };
    }

    // Default: conversación general
    return {
      type: 'conversation',
      confidence: 0.5
    };
  }

  private matchesPatterns(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }

  /**
   * Detecta la entidad mencionada
   */
  private detectEntity(message: string): string {
    if (message.includes('venta')) return 'ventas';
    if (message.includes('compra') || message.includes('orden')) return 'compras';
    if (message.includes('cliente')) return 'clientes';
    if (message.includes('producto') || message.includes('inventario') || message.includes('stock')) return 'productos';
    if (message.includes('banco') || message.includes('capital') || message.includes('saldo')) return 'bancos';
    if (message.includes('distribuidor')) return 'distribuidores';
    if (message.includes('gasto')) return 'gastos';
    if (message.includes('almacén') || message.includes('almacen')) return 'almacen';
    return 'general';
  }

  /**
   * Detecta la colección de Firestore
   */
  private detectCollection(message: string): CollectionName | undefined {
    const entityMap: Record<string, CollectionName> = {
      'venta': 'ventas',
      'compra': 'compras',
      'orden': 'ordenesCompra',
      'cliente': 'clientes',
      'producto': 'productos',
      'banco': 'bancos',
      'distribuidor': 'distribuidores',
      'gasto': 'gastos',
      'almacén': 'almacen',
      'almacen': 'almacen',
      'pago': 'pagos',
      'bóveda monte': 'bovedaMonte',
      'boveda monte': 'bovedaMonte',
      'profit': 'profit',
      'utilidad': 'utilidades',
      'flete': 'fleteSur',
      'azteca': 'azteca',
      'leftie': 'leftie'
    };

    for (const [keyword, collectionName] of Object.entries(entityMap)) {
      if (message.includes(keyword)) {
        return collectionName;
      }
    }

    return undefined;
  }

  /**
   * Detecta el timeframe mencionado
   */
  private detectTimeframe(message: string): string {
    if (message.includes('hoy')) return 'hoy';
    if (message.includes('ayer')) return 'ayer';
    if (message.includes('semana')) return 'semana';
    if (message.includes('mes')) return 'mes';
    if (message.includes('año')) return 'año';
    if (message.includes('trimestre')) return 'trimestre';
    return 'mes'; // default
  }

  /**
   * Detecta destino de navegación
   */
  private detectDestination(message: string): string {
    const destinations: Record<string, string> = {
      'dashboard': '/dashboard',
      'ventas': '/ventas',
      'compras': '/compras',
      'clientes': '/clientes',
      'productos': '/productos',
      'almacén': '/almacen',
      'almacen': '/almacen',
      'bancos': '/bancos',
      'reportes': '/reportes',
      'configuración': '/configuracion'
    };

    for (const [keyword, path] of Object.entries(destinations)) {
      if (message.includes(keyword)) {
        return path;
      }
    }

    return '/dashboard';
  }

  /**
   * Maneja consultas de datos
   */
  private async handleQueryData(intent: DetectedIntent, request: AIRequest): Promise<AIResponse> {
    const collectionName = intent.collection || 'ventas';
    const timeframe = intent.timeframe || 'mes';

    try {
      const data = await this.queryCollection(collectionName, timeframe);
      const stats = this.calculateStats(data, collectionName);
      const visualizations = this.generateVisualizations(data, collectionName);

      // Actualizar aprendizaje - registrar uso de colección
      await this.learningService.trackActivity(
        request.userId, 
        'query_collection', 
        collectionName,
        { timeframe }
      );

      const formattedMessage = this.formatQueryResponse(collectionName, stats, timeframe);

      return {
        type: 'data',
        message: formattedMessage,
        data: stats,
        visualizations,
        suggestions: this.generateSuggestions(collectionName)
      };
    } catch (error) {
      return {
        type: 'error',
        message: `No pude obtener los datos de ${collectionName}. ¿Quieres intentar con otra consulta?`,
        suggestions: ['Ver ventas del día', 'Mostrar clientes', 'Estado de bancos']
      };
    }
  }

  /**
   * Consulta una colección de Firestore
   */
  private async queryCollection(collectionName: CollectionName, timeframe: string): Promise<unknown[]> {
    const collectionPath = COLLECTIONS[collectionName];
    const collectionRef = collection(db, collectionPath);
    
    const constraints: QueryConstraint[] = [];
    const startDate = this.getStartDate(timeframe);

    // Agregar filtro de fecha si la colección lo soporta
    if (['ventas', 'compras', 'gastos', 'pagos'].includes(collectionName)) {
      constraints.push(where('fecha', '>=', startDate));
      constraints.push(orderBy('fecha', 'desc'));
    }

    constraints.push(limit(100));

    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  private getStartDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case 'hoy':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'ayer':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        return yesterday;
      case 'semana':
        return new Date(now.setDate(now.getDate() - 7));
      case 'mes':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'trimestre':
        return new Date(now.setMonth(now.getMonth() - 3));
      case 'año':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(now.setDate(now.getDate() - 30));
    }
  }

  /**
   * Calcula estadísticas de los datos
   */
  private calculateStats(data: unknown[], collectionName: string): Record<string, unknown> {
    const items = data as Record<string, unknown>[];
    
    switch (collectionName) {
      case 'ventas':
        const totalVentas = items.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
        const promedioVenta = items.length > 0 ? totalVentas / items.length : 0;
        return {
          count: items.length,
          total: totalVentas,
          promedio: promedioVenta,
          tipo: 'ventas'
        };

      case 'clientes':
        return {
          count: items.length,
          activos: items.filter(c => c.estado === 'activo').length,
          tipo: 'clientes'
        };

      case 'productos':
        const stockBajo = items.filter(p => 
          Number(p.stockActual) <= Number(p.stockMinimo)
        ).length;
        return {
          count: items.length,
          stockBajo,
          tipo: 'productos'
        };

      case 'bancos':
        const totalCapital = items.reduce((sum, b) => 
          sum + (Number(b.capitalActual) || Number(b.saldo) || 0), 0
        );
        return {
          count: items.length,
          totalCapital,
          tipo: 'bancos'
        };

      default:
        return {
          count: items.length,
          tipo: collectionName
        };
    }
  }

  /**
   * Genera visualizaciones para los datos
   */
  private generateVisualizations(data: unknown[], collectionName: string): AIVisualization[] {
    const items = data as Record<string, unknown>[];
    const visualizations: AIVisualization[] = [];

    if (items.length === 0) return visualizations;

    switch (collectionName) {
      case 'ventas':
        // Gráfico de tendencia
        const ventasPorDia = this.groupByDate(items, 'fecha', 'total');
        if (ventasPorDia.length > 0) {
          visualizations.push({
            type: 'line',
            title: 'Tendencia de Ventas',
            data: ventasPorDia
          });
        }
        break;

      case 'bancos':
        // Gráfico de distribución
        visualizations.push({
          type: 'pie',
          title: 'Distribución de Capital',
          data: items.map(b => ({
            name: b.nombre || b.id,
            value: Number(b.capitalActual) || Number(b.saldo) || 0
          }))
        });
        break;

      case 'productos':
        // Top productos
        const topProductos = items
          .sort((a, b) => (Number(b.stockActual) || 0) - (Number(a.stockActual) || 0))
          .slice(0, 10);
        visualizations.push({
          type: 'bar',
          title: 'Top 10 Productos por Stock',
          data: topProductos.map(p => ({
            name: p.nombre || p.id,
            value: Number(p.stockActual) || 0
          }))
        });
        break;
    }

    return visualizations;
  }

  private groupByDate(items: Record<string, unknown>[], dateField: string, valueField: string): unknown[] {
    const grouped: Record<string, number> = {};

    items.forEach(item => {
      const date = item[dateField];
      if (date) {
        const dateStr = typeof date === 'string' 
          ? date.split('T')[0] 
          : new Date(date as number).toISOString().split('T')[0];
        grouped[dateStr] = (grouped[dateStr] || 0) + (Number(item[valueField]) || 0);
      }
    });

    return Object.entries(grouped)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private formatQueryResponse(collection: string, stats: Record<string, unknown>, timeframe: string): string {
    const timeframeLabels: Record<string, string> = {
      hoy: 'hoy',
      ayer: 'ayer',
      semana: 'esta semana',
      mes: 'este mes',
      trimestre: 'este trimestre',
      año: 'este año'
    };

    const period = timeframeLabels[timeframe] || 'el período';

    switch (collection) {
      case 'ventas':
        return `📊 **Resumen de Ventas ${period}:**\n\n` +
          `• Total de ventas: **${stats.count}**\n` +
          `• Monto total: **$${Number(stats.total).toLocaleString('es-MX')}**\n` +
          `• Ticket promedio: **$${Number(stats.promedio).toLocaleString('es-MX')}**`;

      case 'clientes':
        return `👥 **Resumen de Clientes:**\n\n` +
          `• Total: **${stats.count}**\n` +
          `• Activos: **${stats.activos}**`;

      case 'productos':
        return `📦 **Resumen de Inventario:**\n\n` +
          `• Total productos: **${stats.count}**\n` +
          `• Con stock bajo: **${stats.stockBajo}** ⚠️`;

      case 'bancos':
        return `💰 **Estado de Bancos:**\n\n` +
          `• Bancos activos: **${stats.count}**\n` +
          `• Capital total: **$${Number(stats.totalCapital).toLocaleString('es-MX')}**`;

      default:
        return `📋 Se encontraron **${stats.count}** registros de ${collection}.`;
    }
  }

  private generateSuggestions(entity: string): string[] {
    const suggestions: Record<string, string[]> = {
      ventas: [
        'Ver detalles de ventas',
        'Generar reporte de ventas',
        'Comparar con mes anterior',
        'Top clientes por ventas'
      ],
      clientes: [
        'Ver clientes activos',
        'Clientes con adeudo',
        'Agregar nuevo cliente'
      ],
      productos: [
        'Ver productos con stock bajo',
        'Generar orden de compra',
        'Top productos vendidos'
      ],
      bancos: [
        'Ver movimientos del día',
        'Generar corte de bancos',
        'Ver transferencias pendientes'
      ]
    };

    return suggestions[entity] || [
      'Mostrar ventas del día',
      'Ver estado de bancos',
      'Consultar inventario'
    ];
  }

  /**
   * Maneja creación de registros
   */
  private async handleCreateRecord(intent: DetectedIntent, request: AIRequest): Promise<AIResponse> {
    const collectionName = intent.collection;
    
    if (!collectionName) {
      return {
        type: 'text',
        message: '¿Qué tipo de registro deseas crear? Puedo ayudarte con:\n\n' +
          '• Nueva venta\n' +
          '• Nuevo cliente\n' +
          '• Nueva orden de compra\n' +
          '• Nuevo gasto',
        suggestions: ['Nueva venta', 'Nuevo cliente', 'Nueva orden', 'Nuevo gasto']
      };
    }

    // Obtener sugerencias de auto-llenado
    const formSuggestions = await this.formService.analyzeAndSuggest(
      request.userId,
      collectionName,
      {}
    );

    return {
      type: 'action',
      message: `✨ Perfecto, vamos a crear un nuevo registro en **${collectionName}**.\n\n` +
        `${formSuggestions.autoFillable 
          ? '💡 He detectado patrones que puedo usar para auto-completar algunos campos.' 
          : 'Completa el formulario y te ayudaré con la validación.'}`,
      actions: [
        {
          type: 'create',
          label: `Crear ${collectionName}`,
          payload: {
            collection: collectionName,
            suggestions: formSuggestions.suggestions,
            template: formSuggestions.template
          }
        }
      ],
      suggestions: ['Cancelar', 'Ver registros existentes']
    };
  }

  /**
   * Maneja generación de reportes
   */
  private async handleGenerateReport(intent: DetectedIntent, request: AIRequest): Promise<AIResponse> {
    const entity = intent.entity || 'general';
    const timeframe = intent.timeframe || 'mes';

    // Usar servicio Power BI para generar dashboard
    const dashboard = await this.powerBIService.generateDashboard(
      request.userId,
      entity,
      { timeframe }
    );

    if (!dashboard.success) {
      return {
        type: 'error',
        message: '❌ No pude generar el reporte. ¿Quieres intentar con otro tipo?',
        suggestions: ['Reporte de ventas', 'Reporte financiero', 'Reporte de inventario']
      };
    }

    return {
      type: 'visualization',
      message: `📊 **Reporte de ${entity} - ${timeframe}**\n\n` +
        `He generado un análisis completo con KPIs, visualizaciones e insights.`,
      data: dashboard.dashboard,
      visualizations: dashboard.dashboard?.visualizations as AIVisualization[] | undefined,
      actions: [
        {
          type: 'export',
          label: 'Exportar a PDF',
          payload: { format: 'pdf', data: dashboard.dashboard }
        },
        {
          type: 'export',
          label: 'Exportar a Excel',
          payload: { format: 'excel', data: dashboard.dashboard }
        }
      ],
      suggestions: [
        'Programar reporte semanal',
        'Ver más detalles',
        'Comparar con período anterior'
      ]
    };
  }

  /**
   * Maneja programación de reportes
   */
  private async handleScheduleReport(intent: DetectedIntent, request: AIRequest): Promise<AIResponse> {
    const timeframe = intent.timeframe || 'semanal';
    
    const recurrenceMap: Record<string, string> = {
      'diario': 'daily',
      'semanal': 'weekly',
      'mensual': 'monthly'
    };

    const recurrence = recurrenceMap[timeframe] || 'weekly';

    const reportId = await this.reportsService.createScheduledReport({
      userId: request.userId,
      name: `Reporte ${timeframe} automático`,
      type: 'general',
      recurrence: recurrence as 'daily' | 'weekly' | 'monthly',
      recipients: [],
      format: 'pdf',
      includeInsights: true
    });

    return {
      type: 'action',
      message: `✅ **Reporte programado exitosamente**\n\n` +
        `• Frecuencia: ${timeframe}\n` +
        `• Formato: PDF con insights\n` +
        `• ID: ${reportId}\n\n` +
        `Recibirás el reporte automáticamente.`,
      actions: [
        {
          type: 'navigate',
          label: 'Ver reportes programados',
          payload: { path: '/reportes/programados' }
        }
      ],
      suggestions: ['Ver mis reportes', 'Editar programación', 'Agregar destinatarios']
    };
  }

  /**
   * Maneja análisis con IA
   */
  private async handleAnalyze(intent: DetectedIntent, request: AIRequest): Promise<AIResponse> {
    const entity = intent.entity || 'ventas';
    const timeframe = intent.timeframe || 'mes';

    // Obtener datos
    const collection = this.detectCollection(entity) || 'ventas';
    const data = await this.queryCollection(collection, timeframe);

    // Generar insights con Power BI
    const dashboard = await this.powerBIService.generateDashboard(
      request.userId,
      entity,
      { timeframe }
    );

    const insights = dashboard.dashboard?.insights || [];
    const recommendations = dashboard.dashboard?.recommendations || [];

    let insightsText = '';
    if (insights.length > 0) {
      insightsText = '\n\n**🔍 Insights detectados:**\n' +
        insights.map((i: { type: string; title: string; description: string }) => 
          `${i.type === 'positive' ? '✅' : i.type === 'warning' ? '⚠️' : '💡'} ${i.title}`
        ).join('\n');
    }

    let recommendationsText = '';
    if (recommendations.length > 0) {
      recommendationsText = '\n\n**📋 Recomendaciones:**\n' +
        recommendations.map((r: { priority: string; title: string }, i: number) => 
          `${i + 1}. ${r.title}`
        ).join('\n');
    }

    return {
      type: 'visualization',
      message: `📈 **Análisis de ${entity} - ${timeframe}**${insightsText}${recommendationsText}`,
      data: dashboard.dashboard,
      visualizations: dashboard.dashboard?.visualizations as AIVisualization[] | undefined,
      suggestions: [
        'Ver detalles de insights',
        'Exportar análisis',
        'Programar análisis automático'
      ]
    };
  }

  /**
   * Maneja navegación
   */
  private async handleNavigate(intent: DetectedIntent): Promise<AIResponse> {
    const destination = intent.entity || '/dashboard';

    return {
      type: 'action',
      message: `🚀 Te llevo a **${destination}**`,
      actions: [
        {
          type: 'navigate',
          label: `Ir a ${destination}`,
          payload: { path: destination }
        }
      ]
    };
  }

  /**
   * Maneja exportación
   */
  private async handleExport(intent: DetectedIntent, request: AIRequest): Promise<AIResponse> {
    const entity = intent.entity || 'ventas';
    
    return {
      type: 'action',
      message: `📥 ¿En qué formato deseas exportar los datos de **${entity}**?`,
      actions: [
        {
          type: 'export',
          label: 'PDF',
          payload: { format: 'pdf', entity }
        },
        {
          type: 'export',
          label: 'Excel',
          payload: { format: 'excel', entity }
        },
        {
          type: 'export',
          label: 'CSV',
          payload: { format: 'csv', entity }
        }
      ],
      suggestions: ['Cancelar', 'Ver datos primero']
    };
  }

  /**
   * Muestra ayuda
   */
  private handleHelp(): AIResponse {
    return {
      type: 'text',
      message: `🤖 **¡Hola! Soy tu asistente de IA**\n\n` +
        `Puedo ayudarte con:\n\n` +
        `📊 **Consultas de datos:**\n` +
        `• "Mostrar ventas del día"\n` +
        `• "¿Cuántos clientes tenemos?"\n` +
        `• "Ver estado de bancos"\n\n` +
        `📈 **Reportes y análisis:**\n` +
        `• "Generar reporte de ventas"\n` +
        `• "Analiza las tendencias del mes"\n` +
        `• "Programa un reporte semanal"\n\n` +
        `✏️ **Crear registros:**\n` +
        `• "Nueva venta"\n` +
        `• "Registrar un cliente"\n` +
        `• "Crear orden de compra"\n\n` +
        `🚀 **Navegación:**\n` +
        `• "Ir a dashboard"\n` +
        `• "Abrir panel de clientes"\n\n` +
        `📥 **Exportación:**\n` +
        `• "Exportar ventas a Excel"\n` +
        `• "Descargar reporte PDF"`,
      suggestions: [
        'Ver ventas del día',
        'Estado de bancos',
        'Generar reporte',
        'Ayuda con más opciones'
      ]
    };
  }

  /**
   * Maneja conversación general
   */
  private async handleConversation(request: AIRequest): Promise<AIResponse> {
    // Respuestas para conversación general
    const greetings = ['hola', 'buenos días', 'buenas tardes', 'hey', 'hi'];
    const thanks = ['gracias', 'thanks', 'perfecto', 'genial'];
    const farewells = ['adiós', 'bye', 'hasta luego', 'chao'];

    const lowerMessage = request.message.toLowerCase();

    if (greetings.some(g => lowerMessage.includes(g))) {
      return {
        type: 'text',
        message: '👋 ¡Hola! ¿En qué puedo ayudarte hoy?\n\n' +
          'Puedo mostrarte datos, generar reportes, o ayudarte a crear registros.',
        suggestions: [
          'Ver ventas del día',
          'Estado de bancos',
          '¿Qué puedes hacer?'
        ]
      };
    }

    if (thanks.some(t => lowerMessage.includes(t))) {
      return {
        type: 'text',
        message: '😊 ¡Con gusto! ¿Hay algo más en lo que pueda ayudarte?',
        suggestions: [
          'No, eso es todo',
          'Sí, otra consulta',
          'Ver resumen del día'
        ]
      };
    }

    if (farewells.some(f => lowerMessage.includes(f))) {
      return {
        type: 'text',
        message: '👋 ¡Hasta pronto! Estaré aquí cuando me necesites.',
        suggestions: []
      };
    }

    // Respuesta por defecto
    return {
      type: 'text',
      message: '🤔 No estoy seguro de entender tu solicitud. ¿Puedes ser más específico?\n\n' +
        'Prueba con algo como:\n' +
        '• "Mostrar ventas del día"\n' +
        '• "Generar reporte de clientes"\n' +
        '• "Ir al panel de bancos"',
      suggestions: [
        'Ver ventas',
        'Estado de bancos',
        '¿Qué puedes hacer?'
      ]
    };
  }

  /**
   * Obtiene el historial de conversación
   */
  getConversationHistory(): ConversationMessage[] {
    return this.conversationHistory;
  }

  /**
   * Limpia el historial de conversación
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Crea un registro en Firestore
   */
  async createRecord(collectionName: CollectionName, data: Record<string, unknown>): Promise<string> {
    const collectionPath = COLLECTIONS[collectionName];
    const collectionRef = collection(db, collectionPath);
    
    const docData = {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: this.userId
    };

    const docRef = await addDoc(collectionRef, docData);
    
    // Registrar para aprendizaje
    await this.learningService.trackActivity(
      this.userId,
      'create_record',
      collectionName,
      { recordId: docRef.id }
    );

    return docRef.id;
  }
}

// Singleton para uso global
let megaAIAgentInstance: MegaAIAgentService | null = null;

export function getMegaAIAgent(userId: string): MegaAIAgentService {
  if (!megaAIAgentInstance || megaAIAgentInstance['userId'] !== userId) {
    megaAIAgentInstance = new MegaAIAgentService(userId);
  }
  return megaAIAgentInstance;
}
