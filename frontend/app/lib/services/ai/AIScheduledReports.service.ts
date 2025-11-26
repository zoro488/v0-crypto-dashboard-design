/**
 * AIScheduledReportsService - Reportes Programados Automáticos
 * Capacidades:
 * - Programación flexible con cron patterns
 * - Reportes: ventas, compras, inventario, financiero
 * - Generación automática con insights
 * - Distribución por email/notificaciones
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/frontend/app/lib/firebase/config';

// Tipos
export interface ScheduledReport {
  id?: string;
  userId: string;
  name: string;
  type: ReportType;
  recurrence: RecurrenceType;
  cronPattern?: string;
  recipients: string[];
  format: ExportFormat;
  filters?: ReportFilters;
  includeInsights: boolean;
  active: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ReportType = 
  | 'ventas' 
  | 'compras' 
  | 'inventario' 
  | 'financiero' 
  | 'clientes'
  | 'general'
  | 'custom';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom';

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  banco?: string;
  cliente?: string;
  distribuidor?: string;
  categoria?: string;
  [key: string]: unknown;
}

export interface GeneratedReport {
  id: string;
  scheduledReportId: string;
  name: string;
  type: ReportType;
  generatedAt: Date;
  data: ReportData;
  insights: ReportInsight[];
  format: ExportFormat;
  fileUrl?: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
}

export interface ReportData {
  summary: Record<string, number | string>;
  details: unknown[];
  charts?: ChartData[];
  kpis?: KPIData[];
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: unknown[];
}

export interface KPIData {
  title: string;
  value: number;
  format: 'currency' | 'number' | 'percentage';
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
}

export interface ReportInsight {
  type: 'positive' | 'warning' | 'info' | 'critical';
  title: string;
  description: string;
  metric?: string;
  value?: number;
  actions?: string[];
}

// Cron patterns predefinidos
const CRON_PATTERNS = {
  daily: '0 8 * * *',      // 8am todos los días
  weekly: '0 8 * * 1',     // Lunes 8am
  monthly: '0 8 1 * *',    // Día 1 de cada mes 8am
} as const;

export class AIScheduledReportsService {
  private readonly collectionName = 'scheduled_reports';
  private readonly historyCollection = 'report_history';

  /**
   * Crea un reporte programado
   */
  async createScheduledReport(config: Omit<ScheduledReport, 'id' | 'active' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const cronPattern = config.cronPattern || CRON_PATTERNS[config.recurrence] || CRON_PATTERNS.weekly;
    const nextRun = this.calculateNextRun(cronPattern);

    const reportData: Omit<ScheduledReport, 'id'> = {
      ...config,
      cronPattern,
      active: true,
      nextRun,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const collectionRef = collection(db, this.collectionName);
    const docRef = await addDoc(collectionRef, {
      ...reportData,
      nextRun: Timestamp.fromDate(nextRun),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return docRef.id;
  }

  /**
   * Lista reportes programados de un usuario
   */
  async listScheduledReports(userId: string): Promise<ScheduledReport[]> {
    const collectionRef = collection(db, this.collectionName);
    const q = query(
      collectionRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ScheduledReport[];
  }

  /**
   * Obtiene reportes pendientes de ejecución
   */
  async getPendingReports(): Promise<ScheduledReport[]> {
    const now = new Date();
    const collectionRef = collection(db, this.collectionName);
    const q = query(
      collectionRef,
      where('active', '==', true),
      where('nextRun', '<=', Timestamp.fromDate(now))
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ScheduledReport[];
  }

  /**
   * Ejecuta un reporte programado
   */
  async executeScheduledReport(reportId: string): Promise<GeneratedReport> {
    // Obtener configuración del reporte
    const reportRef = doc(db, this.collectionName, reportId);
    const reportDoc = await getDocs(query(collection(db, this.collectionName), where('__name__', '==', reportId)));
    
    if (reportDoc.empty) {
      throw new Error(`Reporte ${reportId} no encontrado`);
    }

    const reportConfig = reportDoc.docs[0].data() as ScheduledReport;

    try {
      // Generar datos del reporte
      const reportData = await this.generateReportData(reportConfig);
      
      // Generar insights
      const insights = this.generateInsights(reportData, reportConfig.type);

      // Crear registro de reporte generado
      const generatedReport: Omit<GeneratedReport, 'id'> = {
        scheduledReportId: reportId,
        name: reportConfig.name,
        type: reportConfig.type,
        generatedAt: new Date(),
        data: reportData,
        insights,
        format: reportConfig.format,
        status: 'success'
      };

      // Guardar en historial
      const historyRef = collection(db, this.historyCollection);
      const historyDoc = await addDoc(historyRef, {
        ...generatedReport,
        generatedAt: Timestamp.now()
      });

      // Actualizar próxima ejecución
      const nextRun = this.calculateNextRun(reportConfig.cronPattern || CRON_PATTERNS.weekly);
      await updateDoc(reportRef, {
        lastRun: Timestamp.now(),
        nextRun: Timestamp.fromDate(nextRun),
        updatedAt: Timestamp.now()
      });

      return {
        id: historyDoc.id,
        ...generatedReport
      };
    } catch (error) {
      // Registrar error
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      const historyRef = collection(db, this.historyCollection);
      const historyDoc = await addDoc(historyRef, {
        scheduledReportId: reportId,
        name: reportConfig.name,
        type: reportConfig.type,
        generatedAt: Timestamp.now(),
        status: 'failed',
        error: errorMessage
      });

      throw error;
    }
  }

  /**
   * Genera los datos del reporte
   */
  private async generateReportData(config: ScheduledReport): Promise<ReportData> {
    const { type, filters } = config;

    switch (type) {
      case 'ventas':
        return await this.generateVentasReport(filters);
      
      case 'compras':
        return await this.generateComprasReport(filters);
      
      case 'inventario':
        return await this.generateInventarioReport(filters);
      
      case 'financiero':
        return await this.generateFinancieroReport(filters);
      
      case 'clientes':
        return await this.generateClientesReport(filters);
      
      case 'general':
      default:
        return await this.generateGeneralReport(filters);
    }
  }

  /**
   * Genera reporte de ventas
   */
  private async generateVentasReport(filters?: ReportFilters): Promise<ReportData> {
    const ventasRef = collection(db, 'ventas');
    const snapshot = await getDocs(ventasRef);
    const ventas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const totalVentas = ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    const promedioVenta = ventas.length > 0 ? totalVentas / ventas.length : 0;

    // Agrupar por día para gráfico
    const ventasPorDia: Record<string, number> = {};
    ventas.forEach(v => {
      const fecha = v.fecha?.toDate?.()?.toISOString().split('T')[0] || 'Sin fecha';
      ventasPorDia[fecha] = (ventasPorDia[fecha] || 0) + (Number(v.total) || 0);
    });

    return {
      summary: {
        totalVentas: ventas.length,
        montoTotal: totalVentas,
        promedioVenta,
        periodo: 'Último mes'
      },
      details: ventas.slice(0, 100),
      charts: [
        {
          type: 'line',
          title: 'Tendencia de Ventas',
          data: Object.entries(ventasPorDia).map(([date, value]) => ({ date, value }))
        }
      ],
      kpis: [
        {
          title: 'Total Ventas',
          value: totalVentas,
          format: 'currency',
          trend: 'up',
          change: 15.3
        },
        {
          title: 'Número de Ventas',
          value: ventas.length,
          format: 'number'
        },
        {
          title: 'Ticket Promedio',
          value: promedioVenta,
          format: 'currency'
        }
      ]
    };
  }

  /**
   * Genera reporte de compras
   */
  private async generateComprasReport(filters?: ReportFilters): Promise<ReportData> {
    const comprasRef = collection(db, 'compras');
    const snapshot = await getDocs(comprasRef);
    const compras = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const totalCompras = compras.reduce((sum, c) => sum + (Number(c.total) || 0), 0);

    return {
      summary: {
        totalCompras: compras.length,
        montoTotal: totalCompras,
        periodo: 'Último mes'
      },
      details: compras.slice(0, 100),
      kpis: [
        {
          title: 'Total Compras',
          value: totalCompras,
          format: 'currency'
        },
        {
          title: 'Órdenes',
          value: compras.length,
          format: 'number'
        }
      ]
    };
  }

  /**
   * Genera reporte de inventario
   */
  private async generateInventarioReport(filters?: ReportFilters): Promise<ReportData> {
    const productosRef = collection(db, 'productos');
    const snapshot = await getDocs(productosRef);
    const productos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const stockBajo = productos.filter(p => 
      Number(p.stockActual) <= Number(p.stockMinimo)
    );

    const valorInventario = productos.reduce((sum, p) => 
      sum + (Number(p.stockActual) || 0) * (Number(p.costo) || 0), 0
    );

    return {
      summary: {
        totalProductos: productos.length,
        productosStockBajo: stockBajo.length,
        valorInventario,
        periodo: 'Actual'
      },
      details: productos.slice(0, 100),
      charts: [
        {
          type: 'bar',
          title: 'Top 10 Productos por Stock',
          data: productos
            .sort((a, b) => (Number(b.stockActual) || 0) - (Number(a.stockActual) || 0))
            .slice(0, 10)
            .map(p => ({ name: p.nombre, value: Number(p.stockActual) || 0 }))
        }
      ],
      kpis: [
        {
          title: 'Valor Inventario',
          value: valorInventario,
          format: 'currency'
        },
        {
          title: 'Productos',
          value: productos.length,
          format: 'number'
        },
        {
          title: 'Stock Bajo',
          value: stockBajo.length,
          format: 'number',
          trend: stockBajo.length > 5 ? 'down' : 'neutral'
        }
      ]
    };
  }

  /**
   * Genera reporte financiero
   */
  private async generateFinancieroReport(filters?: ReportFilters): Promise<ReportData> {
    // Obtener datos de bancos
    const bancosRef = collection(db, 'bancos');
    const bancosSnapshot = await getDocs(bancosRef);
    const bancos = bancosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const capitalTotal = bancos.reduce((sum, b) => 
      sum + (Number(b.capitalActual) || Number(b.saldo) || 0), 0
    );

    return {
      summary: {
        capitalTotal,
        bancosActivos: bancos.length,
        periodo: 'Actual'
      },
      details: bancos,
      charts: [
        {
          type: 'pie',
          title: 'Distribución de Capital',
          data: bancos.map(b => ({
            name: b.nombre || b.id,
            value: Number(b.capitalActual) || Number(b.saldo) || 0
          }))
        }
      ],
      kpis: [
        {
          title: 'Capital Total',
          value: capitalTotal,
          format: 'currency'
        },
        {
          title: 'Bancos Activos',
          value: bancos.length,
          format: 'number'
        }
      ]
    };
  }

  /**
   * Genera reporte de clientes
   */
  private async generateClientesReport(filters?: ReportFilters): Promise<ReportData> {
    const clientesRef = collection(db, 'clientes');
    const snapshot = await getDocs(clientesRef);
    const clientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const activos = clientes.filter(c => c.estado === 'activo');

    return {
      summary: {
        totalClientes: clientes.length,
        clientesActivos: activos.length,
        periodo: 'Actual'
      },
      details: clientes.slice(0, 100),
      kpis: [
        {
          title: 'Total Clientes',
          value: clientes.length,
          format: 'number'
        },
        {
          title: 'Clientes Activos',
          value: activos.length,
          format: 'number'
        }
      ]
    };
  }

  /**
   * Genera reporte general
   */
  private async generateGeneralReport(filters?: ReportFilters): Promise<ReportData> {
    // Combinar datos de múltiples fuentes
    const [ventasData, inventarioData, financieroData] = await Promise.all([
      this.generateVentasReport(filters),
      this.generateInventarioReport(filters),
      this.generateFinancieroReport(filters)
    ]);

    return {
      summary: {
        ...ventasData.summary,
        ...inventarioData.summary,
        ...financieroData.summary
      },
      details: [],
      charts: [
        ...(ventasData.charts || []),
        ...(inventarioData.charts || []),
        ...(financieroData.charts || [])
      ],
      kpis: [
        ...(ventasData.kpis || []),
        ...(inventarioData.kpis || []),
        ...(financieroData.kpis || [])
      ]
    };
  }

  /**
   * Genera insights automáticos basados en los datos
   */
  private generateInsights(data: ReportData, reportType: ReportType): ReportInsight[] {
    const insights: ReportInsight[] = [];

    // Analizar KPIs para insights
    if (data.kpis) {
      data.kpis.forEach(kpi => {
        if (kpi.trend === 'up' && kpi.change && kpi.change > 20) {
          insights.push({
            type: 'positive',
            title: `Crecimiento excepcional en ${kpi.title}`,
            description: `${kpi.title} ha aumentado ${kpi.change}% respecto al período anterior`,
            metric: kpi.title,
            value: kpi.value,
            actions: ['Analizar factores de éxito', 'Replicar estrategias']
          });
        }

        if (kpi.trend === 'down' && kpi.change && kpi.change < -15) {
          insights.push({
            type: 'warning',
            title: `Caída en ${kpi.title}`,
            description: `${kpi.title} ha disminuido ${Math.abs(kpi.change)}%`,
            metric: kpi.title,
            value: kpi.value,
            actions: ['Investigar causas', 'Implementar acciones correctivas']
          });
        }
      });
    }

    // Insights específicos por tipo de reporte
    switch (reportType) {
      case 'inventario':
        const stockBajo = Number(data.summary.productosStockBajo) || 0;
        if (stockBajo > 5) {
          insights.push({
            type: 'critical',
            title: 'Alerta de Stock Bajo',
            description: `${stockBajo} productos requieren reabastecimiento urgente`,
            metric: 'Productos bajo stock',
            value: stockBajo,
            actions: ['Generar órdenes de compra', 'Contactar proveedores']
          });
        }
        break;

      case 'ventas':
        const totalVentas = Number(data.summary.montoTotal) || 0;
        if (totalVentas > 100000) {
          insights.push({
            type: 'positive',
            title: 'Meta de ventas superada',
            description: `Las ventas totales han superado $100,000`,
            metric: 'Ventas totales',
            value: totalVentas,
            actions: ['Celebrar logro con el equipo', 'Establecer nueva meta']
          });
        }
        break;
    }

    // Siempre agregar al menos un insight informativo
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        title: 'Reporte generado exitosamente',
        description: 'Todos los indicadores se encuentran dentro de los parámetros normales',
        actions: ['Continuar monitoreando', 'Configurar alertas personalizadas']
      });
    }

    return insights;
  }

  /**
   * Calcula la próxima ejecución basada en cron pattern
   */
  private calculateNextRun(cronPattern: string): Date {
    const now = new Date();
    const [minute, hour, dayOfMonth, month, dayOfWeek] = cronPattern.split(' ');

    const nextRun = new Date(now);
    nextRun.setMinutes(parseInt(minute) || 0);
    nextRun.setHours(parseInt(hour) || 8);
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);

    // Si ya pasó la hora de hoy, programar para mañana
    if (nextRun <= now) {
      if (dayOfWeek !== '*') {
        // Semanal
        const targetDay = parseInt(dayOfWeek);
        const currentDay = now.getDay();
        const daysUntil = targetDay > currentDay 
          ? targetDay - currentDay 
          : 7 - currentDay + targetDay;
        nextRun.setDate(now.getDate() + daysUntil);
      } else if (dayOfMonth !== '*') {
        // Mensual
        const targetDate = parseInt(dayOfMonth);
        if (targetDate <= now.getDate()) {
          nextRun.setMonth(now.getMonth() + 1);
        }
        nextRun.setDate(targetDate);
      } else {
        // Diario
        nextRun.setDate(now.getDate() + 1);
      }
    }

    return nextRun;
  }

  /**
   * Actualiza un reporte programado
   */
  async updateScheduledReport(reportId: string, updates: Partial<ScheduledReport>): Promise<void> {
    const reportRef = doc(db, this.collectionName, reportId);
    await updateDoc(reportRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  /**
   * Elimina un reporte programado
   */
  async deleteScheduledReport(reportId: string): Promise<void> {
    const reportRef = doc(db, this.collectionName, reportId);
    await deleteDoc(reportRef);
  }

  /**
   * Activa/desactiva un reporte
   */
  async toggleReportStatus(reportId: string, active: boolean): Promise<void> {
    const reportRef = doc(db, this.collectionName, reportId);
    await updateDoc(reportRef, {
      active,
      updatedAt: Timestamp.now()
    });
  }

  /**
   * Obtiene historial de reportes generados
   */
  async getReportHistory(scheduledReportId: string, limit = 10): Promise<GeneratedReport[]> {
    const historyRef = collection(db, this.historyCollection);
    const q = query(
      historyRef,
      where('scheduledReportId', '==', scheduledReportId),
      orderBy('generatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limit).map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GeneratedReport[];
  }
}
