/**
 * AIPowerBIService - Dashboards Analíticos con IA
 * Capacidades:
 * - KPIs inteligentes con tendencias
 * - Visualizaciones interactivas
 * - Análisis predictivo
 * - Insights automáticos
 * - Recomendaciones accionables
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/frontend/app/lib/firebase/config';

// Tipos
export interface DashboardResult {
  success: boolean;
  dashboard?: Dashboard;
  error?: string;
}

export interface Dashboard {
  id: string;
  type: DashboardType;
  generatedAt: Date;
  filters: DashboardFilters;
  kpis: KPI[];
  visualizations: Visualization[];
  insights: Insight[];
  recommendations: Recommendation[];
}

export type DashboardType = 
  | 'ventas' 
  | 'compras' 
  | 'inventario' 
  | 'financiero' 
  | 'clientes'
  | 'general';

export interface DashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  timeframe?: string;
  banco?: string;
  categoria?: string;
  [key: string]: unknown;
}

export interface KPI {
  id: string;
  title: string;
  value: number;
  format: 'currency' | 'number' | 'percentage';
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
  changeLabel?: string;
  icon?: string;
  color?: string;
  sparklineData?: number[];
}

export interface Visualization {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'heatmap' | 'donut' | 'scatter';
  title: string;
  description?: string;
  data: ChartDataPoint[];
  config?: VisualizationConfig;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  category?: string;
  [key: string]: unknown;
}

export interface VisualizationConfig {
  xAxis?: string;
  yAxis?: string;
  colors?: string[];
  stacked?: boolean;
  showLegend?: boolean;
  showLabels?: boolean;
}

export interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'info' | 'critical';
  title: string;
  description: string;
  metric?: string;
  value?: number;
  change?: number;
  actions: string[];
  priority: number;
}

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact?: string;
  actions: string[];
  relatedKPIs?: string[];
}

export class AIPowerBIService {
  /**
   * Genera un dashboard completo con KPIs, visualizaciones e insights
   */
  async generateDashboard(
    userId: string,
    type: DashboardType | string,
    filters: DashboardFilters = {}
  ): Promise<DashboardResult> {
    try {
      const dashboardType = type as DashboardType;
      
      // Generar componentes del dashboard
      const [kpis, visualizations] = await Promise.all([
        this.generateKPIs(dashboardType, filters),
        this.generateVisualizations(dashboardType, filters)
      ]);

      // Generar insights basados en los datos
      const insights = this.generateInsights(kpis, visualizations, dashboardType);
      
      // Generar recomendaciones
      const recommendations = this.generateRecommendations(insights, dashboardType);

      const dashboard: Dashboard = {
        id: `dashboard_${Date.now()}`,
        type: dashboardType,
        generatedAt: new Date(),
        filters,
        kpis,
        visualizations,
        insights,
        recommendations
      };

      return {
        success: true,
        dashboard
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Genera KPIs inteligentes
   */
  private async generateKPIs(
    type: DashboardType,
    filters: DashboardFilters
  ): Promise<KPI[]> {
    const kpis: KPI[] = [];

    switch (type) {
      case 'ventas':
      case 'general':
        const ventasKPIs = await this.getVentasKPIs(filters);
        kpis.push(...ventasKPIs);
        break;

      case 'inventario':
        const inventarioKPIs = await this.getInventarioKPIs(filters);
        kpis.push(...inventarioKPIs);
        break;

      case 'financiero':
        const financieroKPIs = await this.getFinancieroKPIs(filters);
        kpis.push(...financieroKPIs);
        break;

      case 'clientes':
        const clientesKPIs = await this.getClientesKPIs(filters);
        kpis.push(...clientesKPIs);
        break;
    }

    // Para dashboard general, incluir KPIs de todas las áreas
    if (type === 'general') {
      const [inventario, financiero, clientes] = await Promise.all([
        this.getInventarioKPIs(filters),
        this.getFinancieroKPIs(filters),
        this.getClientesKPIs(filters)
      ]);
      kpis.push(...inventario, ...financiero, ...clientes);
    }

    return kpis;
  }

  /**
   * KPIs de Ventas
   */
  private async getVentasKPIs(filters: DashboardFilters): Promise<KPI[]> {
    const ventasRef = collection(db, 'ventas');
    const snapshot = await getDocs(ventasRef);
    const ventas = snapshot.docs.map(doc => doc.data());

    const totalVentas = ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    const numVentas = ventas.length;
    const ticketPromedio = numVentas > 0 ? totalVentas / numVentas : 0;

    // Calcular tendencia (últimos 7 días vs 7 días anteriores)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const ventasRecientes = ventas.filter(v => {
      const fecha = v.fecha?.toDate?.() || new Date(v.fecha);
      return fecha >= sevenDaysAgo;
    });

    const ventasAnteriores = ventas.filter(v => {
      const fecha = v.fecha?.toDate?.() || new Date(v.fecha);
      return fecha >= fourteenDaysAgo && fecha < sevenDaysAgo;
    });

    const totalReciente = ventasRecientes.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    const totalAnterior = ventasAnteriores.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    
    const cambio = totalAnterior > 0 
      ? ((totalReciente - totalAnterior) / totalAnterior) * 100 
      : 0;

    // Generar sparkline data (últimos 7 días)
    const sparklineData = this.generateSparklineData(ventas, 7);

    return [
      {
        id: 'total_ventas',
        title: 'Total Ventas',
        value: totalVentas,
        format: 'currency',
        trend: cambio > 0 ? 'up' : cambio < 0 ? 'down' : 'neutral',
        change: Math.abs(cambio),
        changeLabel: `${cambio >= 0 ? '+' : ''}${cambio.toFixed(1)}% vs semana anterior`,
        icon: 'TrendingUp',
        color: cambio >= 0 ? 'green' : 'red',
        sparklineData
      },
      {
        id: 'num_ventas',
        title: 'Número de Ventas',
        value: numVentas,
        format: 'number',
        icon: 'ShoppingCart',
        color: 'blue'
      },
      {
        id: 'ticket_promedio',
        title: 'Ticket Promedio',
        value: ticketPromedio,
        format: 'currency',
        icon: 'Receipt',
        color: 'purple'
      }
    ];
  }

  /**
   * KPIs de Inventario
   */
  private async getInventarioKPIs(filters: DashboardFilters): Promise<KPI[]> {
    const productosRef = collection(db, 'productos');
    const snapshot = await getDocs(productosRef);
    const productos = snapshot.docs.map(doc => doc.data());

    const totalProductos = productos.length;
    const stockBajo = productos.filter(p => 
      Number(p.stockActual) <= Number(p.stockMinimo)
    ).length;
    
    const valorInventario = productos.reduce((sum, p) => 
      sum + (Number(p.stockActual) || 0) * (Number(p.costo) || 0), 0
    );

    return [
      {
        id: 'valor_inventario',
        title: 'Valor Inventario',
        value: valorInventario,
        format: 'currency',
        icon: 'Package',
        color: 'indigo'
      },
      {
        id: 'total_productos',
        title: 'Total Productos',
        value: totalProductos,
        format: 'number',
        icon: 'Box',
        color: 'blue'
      },
      {
        id: 'stock_bajo',
        title: 'Productos Stock Bajo',
        value: stockBajo,
        format: 'number',
        trend: stockBajo > 5 ? 'down' : 'neutral',
        icon: 'AlertTriangle',
        color: stockBajo > 5 ? 'red' : 'orange'
      }
    ];
  }

  /**
   * KPIs Financieros
   */
  private async getFinancieroKPIs(filters: DashboardFilters): Promise<KPI[]> {
    const bancosRef = collection(db, 'bancos');
    const snapshot = await getDocs(bancosRef);
    const bancos = snapshot.docs.map(doc => doc.data());

    const capitalTotal = bancos.reduce((sum, b) => 
      sum + (Number(b.capitalActual) || Number(b.saldo) || 0), 0
    );

    const bancosActivos = bancos.filter(b => 
      (Number(b.capitalActual) || Number(b.saldo) || 0) > 0
    ).length;

    return [
      {
        id: 'capital_total',
        title: 'Capital Total Bancos',
        value: capitalTotal,
        format: 'currency',
        icon: 'Wallet',
        color: 'green'
      },
      {
        id: 'bancos_activos',
        title: 'Bancos Activos',
        value: bancosActivos,
        format: 'number',
        icon: 'Building2',
        color: 'blue'
      }
    ];
  }

  /**
   * KPIs de Clientes
   */
  private async getClientesKPIs(filters: DashboardFilters): Promise<KPI[]> {
    const clientesRef = collection(db, 'clientes');
    const snapshot = await getDocs(clientesRef);
    const clientes = snapshot.docs.map(doc => doc.data());

    const totalClientes = clientes.length;
    const clientesActivos = clientes.filter(c => c.estado === 'activo').length;

    return [
      {
        id: 'total_clientes',
        title: 'Total Clientes',
        value: totalClientes,
        format: 'number',
        icon: 'Users',
        color: 'purple'
      },
      {
        id: 'clientes_activos',
        title: 'Clientes Activos',
        value: clientesActivos,
        format: 'number',
        icon: 'UserCheck',
        color: 'green'
      }
    ];
  }

  /**
   * Genera visualizaciones
   */
  private async generateVisualizations(
    type: DashboardType,
    filters: DashboardFilters
  ): Promise<Visualization[]> {
    const visualizations: Visualization[] = [];

    switch (type) {
      case 'ventas':
      case 'general':
        // Tendencia de ventas (30 días)
        const ventasTrend = await this.getVentasTrendVisualization();
        visualizations.push(ventasTrend);
        
        // Top productos
        const topProductos = await this.getTopProductosVisualization();
        if (topProductos.data.length > 0) {
          visualizations.push(topProductos);
        }
        break;

      case 'inventario':
        // Distribución por categoría
        const distribucion = await this.getInventarioDistribucionVisualization();
        visualizations.push(distribucion);
        break;

      case 'financiero':
        // Distribución de capital
        const capitalDist = await this.getCapitalDistribucionVisualization();
        visualizations.push(capitalDist);
        break;
    }

    // Para dashboard general, agregar más visualizaciones
    if (type === 'general') {
      const [capitalDist, inventarioDist] = await Promise.all([
        this.getCapitalDistribucionVisualization(),
        this.getInventarioDistribucionVisualization()
      ]);
      visualizations.push(capitalDist, inventarioDist);
    }

    return visualizations;
  }

  /**
   * Visualización: Tendencia de ventas
   */
  private async getVentasTrendVisualization(): Promise<Visualization> {
    const ventasRef = collection(db, 'ventas');
    const snapshot = await getDocs(ventasRef);
    const ventas = snapshot.docs.map(doc => doc.data());

    // Agrupar por día
    const ventasPorDia: Record<string, number> = {};
    ventas.forEach(v => {
      const fecha = v.fecha?.toDate?.() || new Date(v.fecha);
      const dateStr = fecha.toISOString().split('T')[0];
      ventasPorDia[dateStr] = (ventasPorDia[dateStr] || 0) + (Number(v.total) || 0);
    });

    const data = Object.entries(ventasPorDia)
      .map(([date, value]) => ({ name: date, value, date }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Últimos 30 días

    return {
      id: 'ventas_trend',
      type: 'line',
      title: 'Tendencia de Ventas (30 días)',
      description: 'Evolución diaria de las ventas',
      data,
      config: {
        xAxis: 'date',
        yAxis: 'value',
        colors: ['#3b82f6'],
        showLegend: false
      }
    };
  }

  /**
   * Visualización: Top productos vendidos
   */
  private async getTopProductosVisualization(): Promise<Visualization> {
    const ventasRef = collection(db, 'ventas');
    const snapshot = await getDocs(ventasRef);
    const ventas = snapshot.docs.map(doc => doc.data());

    // Contar ventas por producto
    const ventasPorProducto: Record<string, number> = {};
    ventas.forEach(v => {
      const productos = v.productos || [];
      if (Array.isArray(productos)) {
        productos.forEach((p: { nombre?: string; cantidad?: number }) => {
          const nombre = p.nombre || 'Sin nombre';
          ventasPorProducto[nombre] = (ventasPorProducto[nombre] || 0) + (Number(p.cantidad) || 1);
        });
      }
    });

    const data = Object.entries(ventasPorProducto)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      id: 'top_productos',
      type: 'bar',
      title: 'Top 10 Productos Más Vendidos',
      data,
      config: {
        colors: ['#8b5cf6'],
        showLabels: true
      }
    };
  }

  /**
   * Visualización: Distribución de capital por banco
   */
  private async getCapitalDistribucionVisualization(): Promise<Visualization> {
    const bancosRef = collection(db, 'bancos');
    const snapshot = await getDocs(bancosRef);
    const bancos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const data = bancos
      .map(b => ({
        name: b.nombre || b.id,
        value: Number(b.capitalActual) || Number(b.saldo) || 0
      }))
      .filter(b => b.value > 0)
      .sort((a, b) => b.value - a.value);

    return {
      id: 'capital_distribucion',
      type: 'pie',
      title: 'Distribución de Capital por Banco',
      data,
      config: {
        colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'],
        showLegend: true,
        showLabels: true
      }
    };
  }

  /**
   * Visualización: Distribución de inventario
   */
  private async getInventarioDistribucionVisualization(): Promise<Visualization> {
    const productosRef = collection(db, 'productos');
    const snapshot = await getDocs(productosRef);
    const productos = snapshot.docs.map(doc => doc.data());

    // Agrupar por categoría
    const porCategoria: Record<string, number> = {};
    productos.forEach(p => {
      const categoria = p.categoria || 'Sin categoría';
      porCategoria[categoria] = (porCategoria[categoria] || 0) + (Number(p.stockActual) || 0);
    });

    const data = Object.entries(porCategoria)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      id: 'inventario_distribucion',
      type: 'donut',
      title: 'Stock por Categoría',
      data,
      config: {
        colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'],
        showLegend: true
      }
    };
  }

  /**
   * Genera insights basados en los datos
   */
  private generateInsights(
    kpis: KPI[],
    visualizations: Visualization[],
    type: DashboardType
  ): Insight[] {
    const insights: Insight[] = [];

    // Analizar KPIs para insights
    kpis.forEach(kpi => {
      // Crecimiento excepcional
      if (kpi.trend === 'up' && kpi.change && kpi.change > 20) {
        insights.push({
          id: `insight_${kpi.id}_growth`,
          type: 'positive',
          title: `Crecimiento Excepcional en ${kpi.title}`,
          description: `${kpi.title} ha aumentado ${kpi.change.toFixed(1)}% respecto al período anterior. Este es un indicador muy positivo.`,
          metric: kpi.title,
          value: kpi.value,
          change: kpi.change,
          actions: [
            'Analizar factores que contribuyeron al crecimiento',
            'Documentar estrategias exitosas',
            'Replicar tácticas en otras áreas'
          ],
          priority: 1
        });
      }

      // Caída significativa
      if (kpi.trend === 'down' && kpi.change && kpi.change > 15) {
        insights.push({
          id: `insight_${kpi.id}_decline`,
          type: 'warning',
          title: `Caída Detectada en ${kpi.title}`,
          description: `${kpi.title} ha disminuido ${kpi.change.toFixed(1)}%. Se recomienda investigar las causas.`,
          metric: kpi.title,
          value: kpi.value,
          change: -kpi.change,
          actions: [
            'Investigar causas de la caída',
            'Revisar procesos y estrategias',
            'Implementar acciones correctivas'
          ],
          priority: 2
        });
      }

      // Stock bajo crítico
      if (kpi.id === 'stock_bajo' && kpi.value > 5) {
        insights.push({
          id: 'insight_stock_critico',
          type: 'critical',
          title: 'Alerta: Productos con Stock Bajo',
          description: `Hay ${kpi.value} productos que requieren reabastecimiento urgente.`,
          metric: 'Productos bajo stock',
          value: kpi.value,
          actions: [
            'Generar órdenes de compra urgentes',
            'Contactar proveedores prioritarios',
            'Revisar tiempos de entrega'
          ],
          priority: 1
        });
      }
    });

    // Si no hay insights críticos, agregar uno informativo
    if (insights.length === 0) {
      insights.push({
        id: 'insight_general',
        type: 'info',
        title: 'Operaciones Normales',
        description: 'Todos los indicadores se encuentran dentro de los parámetros esperados.',
        actions: [
          'Continuar monitoreando métricas',
          'Establecer alertas personalizadas',
          'Revisar objetivos del período'
        ],
        priority: 3
      });
    }

    return insights.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Genera recomendaciones accionables
   */
  private generateRecommendations(
    insights: Insight[],
    type: DashboardType
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Basadas en insights
    insights.forEach(insight => {
      if (insight.type === 'critical') {
        recommendations.push({
          id: `rec_${insight.id}`,
          priority: 'high',
          title: `Acción Urgente: ${insight.title}`,
          description: insight.description,
          impact: 'Alto impacto en operaciones',
          actions: insight.actions,
          relatedKPIs: insight.metric ? [insight.metric] : []
        });
      }

      if (insight.type === 'warning') {
        recommendations.push({
          id: `rec_${insight.id}`,
          priority: 'medium',
          title: `Revisar: ${insight.title}`,
          description: insight.description,
          impact: 'Impacto moderado si no se atiende',
          actions: insight.actions,
          relatedKPIs: insight.metric ? [insight.metric] : []
        });
      }
    });

    // Recomendaciones generales por tipo de dashboard
    switch (type) {
      case 'ventas':
        recommendations.push({
          id: 'rec_ventas_growth',
          priority: 'low',
          title: 'Optimizar Estrategia de Ventas',
          description: 'Considera implementar promociones para incrementar el ticket promedio.',
          actions: [
            'Analizar productos complementarios',
            'Crear bundles de productos',
            'Implementar programa de lealtad'
          ]
        });
        break;

      case 'inventario':
        recommendations.push({
          id: 'rec_inventario_rotation',
          priority: 'medium',
          title: 'Optimizar Rotación de Inventario',
          description: 'Revisar productos con baja rotación para mejorar flujo de efectivo.',
          actions: [
            'Identificar productos estancados',
            'Crear promociones de liquidación',
            'Ajustar niveles de reorden'
          ]
        });
        break;
    }

    return recommendations;
  }

  /**
   * Genera datos para sparkline
   */
  private generateSparklineData(items: unknown[], days: number): number[] {
    const now = new Date();
    const data: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTotal = (items as Record<string, unknown>[]).reduce((sum, item) => {
        const itemDate = item.fecha?.toDate?.() || new Date(item.fecha as string);
        if (itemDate.toISOString().split('T')[0] === dateStr) {
          return sum + (Number(item.total) || 0);
        }
        return sum;
      }, 0);

      data.push(dayTotal);
    }

    return data;
  }

  /**
   * Obtiene un KPI específico en tiempo real
   */
  async getKPIRealtime(kpiId: string): Promise<KPI | null> {
    // Mapear KPI ID a función de obtención
    switch (kpiId) {
      case 'total_ventas':
        const ventasKPIs = await this.getVentasKPIs({});
        return ventasKPIs.find(k => k.id === kpiId) || null;

      case 'capital_total':
        const financieroKPIs = await this.getFinancieroKPIs({});
        return financieroKPIs.find(k => k.id === kpiId) || null;

      case 'stock_bajo':
        const inventarioKPIs = await this.getInventarioKPIs({});
        return inventarioKPIs.find(k => k.id === kpiId) || null;

      default:
        return null;
    }
  }
}
