'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  BarChart3,
  LineChart,
  PieChart,
  FileText,
  Plus,
  Trash2,
  Settings,
  Eye,
  Download,
  Save,
  Share2,
  GripVertical,
  Layout,
  Database,
  Sparkles,
  Calendar,
  Filter,
  Move,
  Copy,
  MoreHorizontal,
  Layers,
  Type,
  Hash,
  Image as ImageIcon
} from 'lucide-react';
import logger from '@/app/lib/utils/logger';

// ============================================
// TIPOS E INTERFACES
// ============================================
type ComponentType = 'table' | 'bar-chart' | 'line-chart' | 'pie-chart' | 'kpi' | 'text' | 'image';

interface ReportComponent {
  id: string;
  type: ComponentType;
  title: string;
  config: ComponentConfig;
  position: { row: number; col: number };
  size: { width: number; height: number };
}

interface ComponentConfig {
  dataSource?: string;
  columns?: string[];
  filters?: Record<string, unknown>;
  chartConfig?: {
    xAxis?: string;
    yAxis?: string;
    series?: string[];
    colors?: string[];
  };
  kpiConfig?: {
    value: string;
    label: string;
    format: 'currency' | 'number' | 'percentage';
    comparison?: {
      type: 'previous-period' | 'target';
      value?: number;
    };
  };
  textConfig?: {
    content: string;
    fontSize?: 'sm' | 'md' | 'lg' | 'xl';
    alignment?: 'left' | 'center' | 'right';
  };
  imageConfig?: {
    src: string;
    alt: string;
  };
}

interface DataSource {
  id: string;
  name: string;
  collection: string;
  fields: { name: string; type: string }[];
}

interface ReportBuilderProps {
  onSave?: (report: ReportData) => void;
  initialReport?: ReportData;
}

interface ReportData {
  id?: string;
  name: string;
  description: string;
  components: ReportComponent[];
  filters: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// CONFIGURACIÓN
// ============================================
const COMPONENT_TYPES: { type: ComponentType; icon: typeof Table; label: string; color: string }[] = [
  { type: 'table', icon: Table, label: 'Tabla', color: 'bg-blue-500' },
  { type: 'bar-chart', icon: BarChart3, label: 'Barras', color: 'bg-green-500' },
  { type: 'line-chart', icon: LineChart, label: 'Líneas', color: 'bg-purple-500' },
  { type: 'pie-chart', icon: PieChart, label: 'Pastel', color: 'bg-pink-500' },
  { type: 'kpi', icon: Hash, label: 'KPI', color: 'bg-amber-500' },
  { type: 'text', icon: Type, label: 'Texto', color: 'bg-slate-500' },
  { type: 'image', icon: ImageIcon, label: 'Imagen', color: 'bg-cyan-500' },
];

const DATA_SOURCES: DataSource[] = [
  {
    id: 'ventas',
    name: 'Ventas',
    collection: 'ventas',
    fields: [
      { name: 'fecha', type: 'date' },
      { name: 'cliente', type: 'string' },
      { name: 'distribuidor', type: 'string' },
      { name: 'precioTotalVenta', type: 'number' },
      { name: 'metodoPago', type: 'string' },
      { name: 'estado', type: 'string' },
    ]
  },
  {
    id: 'ordenes_compra',
    name: 'Órdenes de Compra',
    collection: 'ordenes_compra',
    fields: [
      { name: 'fecha', type: 'date' },
      { name: 'proveedor', type: 'string' },
      { name: 'costoTotal', type: 'number' },
      { name: 'estado', type: 'string' },
    ]
  },
  {
    id: 'distribuidores',
    name: 'Distribuidores',
    collection: 'distribuidores',
    fields: [
      { name: 'nombre', type: 'string' },
      { name: 'creditoTotal', type: 'number' },
      { name: 'creditoDisponible', type: 'number' },
      { name: 'deudaActual', type: 'number' },
    ]
  },
  {
    id: 'clientes',
    name: 'Clientes',
    collection: 'clientes',
    fields: [
      { name: 'nombre', type: 'string' },
      { name: 'email', type: 'string' },
      { name: 'telefono', type: 'string' },
      { name: 'totalCompras', type: 'number' },
    ]
  },
  {
    id: 'almacen',
    name: 'Almacén / Productos',
    collection: 'almacen',
    fields: [
      { name: 'nombre', type: 'string' },
      { name: 'stockActual', type: 'number' },
      { name: 'stockMinimo', type: 'number' },
      { name: 'precioVenta', type: 'number' },
      { name: 'precioCompra', type: 'number' },
    ]
  },
  {
    id: 'bancos',
    name: 'Bancos',
    collection: 'bancos',
    fields: [
      { name: 'nombre', type: 'string' },
      { name: 'saldoActual', type: 'number' },
      { name: 'tipo', type: 'string' },
    ]
  },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const ReportBuilder = ({ onSave, initialReport }: ReportBuilderProps) => {
  const [reportName, setReportName] = useState(initialReport?.name || 'Nuevo Reporte');
  const [reportDescription, setReportDescription] = useState(initialReport?.description || '');
  const [components, setComponents] = useState<ReportComponent[]>(initialReport?.components || []);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showComponentDialog, setShowComponentDialog] = useState(false);
  const [draggedType, setDraggedType] = useState<ComponentType | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Generar ID único
  const generateId = () => `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Agregar componente
  const addComponent = useCallback((type: ComponentType) => {
    const newComponent: ReportComponent = {
      id: generateId(),
      type,
      title: `${COMPONENT_TYPES.find(c => c.type === type)?.label || 'Componente'} ${components.length + 1}`,
      config: getDefaultConfig(type),
      position: { row: Math.floor(components.length / 2), col: components.length % 2 },
      size: { width: type === 'table' ? 2 : 1, height: 1 }
    };

    setComponents(prev => [...prev, newComponent]);
    setSelectedComponent(newComponent.id);
    setShowComponentDialog(false);
  }, [components.length]);

  // Configuración por defecto según tipo
  const getDefaultConfig = (type: ComponentType): ComponentConfig => {
    switch (type) {
      case 'table':
        return {
          dataSource: 'ventas',
          columns: ['fecha', 'cliente', 'precioTotalVenta', 'estado']
        };
      case 'bar-chart':
      case 'line-chart':
        return {
          dataSource: 'ventas',
          chartConfig: {
            xAxis: 'fecha',
            yAxis: 'precioTotalVenta',
            colors: ['#3b82f6', '#8b5cf6']
          }
        };
      case 'pie-chart':
        return {
          dataSource: 'ventas',
          chartConfig: {
            series: ['metodoPago'],
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
          }
        };
      case 'kpi':
        return {
          dataSource: 'ventas',
          kpiConfig: {
            value: 'precioTotalVenta',
            label: 'Total Ventas',
            format: 'currency',
            comparison: { type: 'previous-period' }
          }
        };
      case 'text':
        return {
          textConfig: {
            content: 'Escribe aquí tu texto...',
            fontSize: 'md',
            alignment: 'left'
          }
        };
      case 'image':
        return {
          imageConfig: {
            src: '',
            alt: 'Imagen del reporte'
          }
        };
      default:
        return {};
    }
  };

  // Eliminar componente
  const removeComponent = useCallback((id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    if (selectedComponent === id) {
      setSelectedComponent(null);
    }
  }, [selectedComponent]);

  // Duplicar componente
  const duplicateComponent = useCallback((id: string) => {
    const original = components.find(c => c.id === id);
    if (!original) return;

    const duplicate: ReportComponent = {
      ...original,
      id: generateId(),
      title: `${original.title} (copia)`,
      position: {
        row: original.position.row,
        col: (original.position.col + 1) % 2
      }
    };

    setComponents(prev => [...prev, duplicate]);
    setSelectedComponent(duplicate.id);
  }, [components]);

  // Actualizar configuración de componente
  const updateComponentConfig = useCallback((id: string, updates: Partial<ReportComponent>) => {
    setComponents(prev => prev.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ));
  }, []);

  // Guardar reporte
  const handleSave = useCallback(() => {
    const reportData: ReportData = {
      id: initialReport?.id,
      name: reportName,
      description: reportDescription,
      components,
      filters: {},
      updatedAt: new Date()
    };

    onSave?.(reportData);
    logger.info('Reporte guardado', { reportName, componentCount: components.length });
  }, [reportName, reportDescription, components, initialReport?.id, onSave]);

  // Componente seleccionado actual
  const currentComponent = useMemo(() =>
    components.find(c => c.id === selectedComponent),
    [components, selectedComponent]
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="flex h-full bg-slate-950">
      {/* Panel izquierdo - Componentes disponibles */}
      <div className="w-64 border-r border-slate-800 p-4 space-y-4 overflow-y-auto">
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Componentes
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {COMPONENT_TYPES.map(({ type, icon: Icon, label, color }) => (
              <motion.button
                key={type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addComponent(type)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 transition-colors"
                draggable
                onDragStart={() => setDraggedType(type)}
                onDragEnd={() => setDraggedType(null)}
              >
                <div className={`p-2 rounded-lg ${color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-slate-400">{label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Fuentes de Datos
          </h3>
          <div className="space-y-1">
            {DATA_SOURCES.map(source => (
              <div
                key={source.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/50 cursor-pointer text-sm text-slate-300"
              >
                <Database className="w-4 h-4 text-blue-400" />
                {source.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel central - Canvas del reporte */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b border-slate-800 p-4 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            <Input
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="w-64 bg-slate-800 border-slate-700 text-white"
              placeholder="Nombre del reporte"
            />
            <Badge variant="outline" className="text-slate-400 border-slate-700">
              {components.length} componentes
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              <Eye className="w-4 h-4 mr-1" />
              {isPreviewMode ? 'Editar' : 'Vista Previa'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Compartir
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            >
              <Save className="w-4 h-4 mr-1" />
              Guardar
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 p-6 overflow-auto"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (draggedType) {
              addComponent(draggedType);
            }
          }}
        >
          {components.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Layout className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Canvas vacío</p>
              <p className="text-sm text-center max-w-md">
                Arrastra componentes desde el panel izquierdo o haz clic en ellos para agregarlos al reporte.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 auto-rows-min">
              <AnimatePresence mode="popLayout">
                {components.map(component => (
                  <ReportComponentCard
                    key={component.id}
                    component={component}
                    isSelected={selectedComponent === component.id}
                    isPreview={isPreviewMode}
                    onSelect={() => setSelectedComponent(component.id)}
                    onRemove={() => removeComponent(component.id)}
                    onDuplicate={() => duplicateComponent(component.id)}
                    onUpdate={(updates) => updateComponentConfig(component.id, updates)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Panel derecho - Configuración */}
      {!isPreviewMode && selectedComponent && currentComponent && (
        <div className="w-80 border-l border-slate-800 p-4 overflow-y-auto bg-slate-900/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Configuración
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedComponent(null)}
              className="text-slate-500 hover:text-slate-300"
            >
              ✕
            </Button>
          </div>

          <ComponentConfigPanel
            component={currentComponent}
            onUpdate={(updates) => updateComponentConfig(currentComponent.id, updates)}
            dataSources={DATA_SOURCES}
          />
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPONENTE DE TARJETA EN EL CANVAS
// ============================================
interface ReportComponentCardProps {
  component: ReportComponent;
  isSelected: boolean;
  isPreview: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onUpdate: (updates: Partial<ReportComponent>) => void;
}

const ReportComponentCard = ({
  component,
  isSelected,
  isPreview,
  onSelect,
  onRemove,
  onDuplicate,
  onUpdate
}: ReportComponentCardProps) => {
  const typeConfig = COMPONENT_TYPES.find(c => c.type === component.type);
  const Icon = typeConfig?.icon || FileText;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`
        relative rounded-xl border transition-all overflow-hidden
        ${component.size.width === 2 ? 'col-span-2' : ''}
        ${isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/20 bg-slate-800/80'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
        }
        ${isPreview ? 'cursor-default' : 'cursor-pointer'}
      `}
      onClick={!isPreview ? onSelect : undefined}
    >
      {/* Header */}
      {!isPreview && (
        <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-slate-600 cursor-grab" />
            <div className={`p-1.5 rounded ${typeConfig?.color || 'bg-slate-600'}`}>
              <Icon className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-300">{component.title}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-300"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="h-7 w-7 p-0 text-slate-500 hover:text-red-400"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 min-h-[150px]">
        <ComponentPreview component={component} />
      </div>
    </motion.div>
  );
};

// ============================================
// PREVIEW DE COMPONENTE
// ============================================
const ComponentPreview = ({ component }: { component: ReportComponent }) => {
  switch (component.type) {
    case 'table':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2 text-xs font-medium text-slate-400 border-b border-slate-700 pb-2">
            {component.config.columns?.slice(0, 4).map(col => (
              <div key={col} className="truncate capitalize">{col}</div>
            ))}
          </div>
          {[1, 2, 3].map(row => (
            <div key={row} className="grid grid-cols-4 gap-2 text-xs text-slate-500">
              {component.config.columns?.slice(0, 4).map(col => (
                <div key={col} className="h-4 bg-slate-700/50 rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      );

    case 'bar-chart':
      return (
        <div className="flex items-end justify-around h-32 gap-2 pt-4">
          {[65, 40, 80, 55, 70].map((height, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              className="w-8 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
            />
          ))}
        </div>
      );

    case 'line-chart':
      return (
        <div className="h-32 flex items-center justify-center">
          <svg viewBox="0 0 100 40" className="w-full h-full">
            <polyline
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              points="0,35 20,25 40,30 60,15 80,20 100,10"
            />
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );

    case 'pie-chart':
      return (
        <div className="h-32 flex items-center justify-center">
          <svg viewBox="0 0 42 42" className="w-24 h-24">
            <circle
              cx="21"
              cy="21"
              r="15.91549430918954"
              fill="transparent"
              stroke="#3b82f6"
              strokeWidth="6"
              strokeDasharray="40 60"
              strokeDashoffset="25"
            />
            <circle
              cx="21"
              cy="21"
              r="15.91549430918954"
              fill="transparent"
              stroke="#10b981"
              strokeWidth="6"
              strokeDasharray="30 70"
              strokeDashoffset="85"
            />
            <circle
              cx="21"
              cy="21"
              r="15.91549430918954"
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth="6"
              strokeDasharray="30 70"
              strokeDashoffset="55"
            />
          </svg>
        </div>
      );

    case 'kpi':
      return (
        <div className="text-center py-4">
          <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            $124,500
          </p>
          <p className="text-sm text-slate-400 mt-2">
            {component.config.kpiConfig?.label || 'KPI'}
          </p>
          <div className="flex items-center justify-center gap-1 mt-2 text-emerald-400 text-xs">
            <span>↑ 12.5%</span>
            <span className="text-slate-500">vs periodo anterior</span>
          </div>
        </div>
      );

    case 'text':
      return (
        <div
          className={`text-slate-300 ${
            component.config.textConfig?.fontSize === 'lg' ? 'text-lg' :
            component.config.textConfig?.fontSize === 'xl' ? 'text-xl' :
            component.config.textConfig?.fontSize === 'sm' ? 'text-sm' : 'text-base'
          } ${
            component.config.textConfig?.alignment === 'center' ? 'text-center' :
            component.config.textConfig?.alignment === 'right' ? 'text-right' : 'text-left'
          }`}
        >
          {component.config.textConfig?.content || 'Texto de ejemplo'}
        </div>
      );

    case 'image':
      return (
        <div className="h-32 bg-slate-700/30 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-600">
          <div className="text-center">
            <ImageIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Imagen</p>
          </div>
        </div>
      );

    default:
      return null;
  }
};

// ============================================
// PANEL DE CONFIGURACIÓN
// ============================================
interface ComponentConfigPanelProps {
  component: ReportComponent;
  onUpdate: (updates: Partial<ReportComponent>) => void;
  dataSources: DataSource[];
}

const ComponentConfigPanel = ({ component, onUpdate, dataSources }: ComponentConfigPanelProps) => {
  const selectedSource = dataSources.find(ds => ds.id === component.config.dataSource);

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <Label className="text-slate-400 text-xs uppercase">Título</Label>
        <Input
          value={component.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="mt-1 bg-slate-800 border-slate-700 text-white"
        />
      </div>

      {/* Fuente de datos (para componentes que lo necesitan) */}
      {['table', 'bar-chart', 'line-chart', 'pie-chart', 'kpi'].includes(component.type) && (
        <div>
          <Label className="text-slate-400 text-xs uppercase">Fuente de Datos</Label>
          <Select
            value={component.config.dataSource}
            onValueChange={(value) => onUpdate({
              config: { ...component.config, dataSource: value }
            })}
          >
            <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Seleccionar fuente" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {dataSources.map(source => (
                <SelectItem key={source.id} value={source.id} className="text-white">
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Configuración específica por tipo */}
      {component.type === 'table' && selectedSource && (
        <div>
          <Label className="text-slate-400 text-xs uppercase">Columnas</Label>
          <div className="mt-2 space-y-2">
            {selectedSource.fields.map(field => (
              <label
                key={field.name}
                className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={component.config.columns?.includes(field.name)}
                  onChange={(e) => {
                    const columns = component.config.columns || [];
                    onUpdate({
                      config: {
                        ...component.config,
                        columns: e.target.checked
                          ? [...columns, field.name]
                          : columns.filter(c => c !== field.name)
                      }
                    });
                  }}
                  className="rounded border-slate-600 bg-slate-800 text-blue-500"
                />
                <span className="capitalize">{field.name}</span>
                <Badge variant="outline" className="text-xs border-slate-600 text-slate-500">
                  {field.type}
                </Badge>
              </label>
            ))}
          </div>
        </div>
      )}

      {component.type === 'kpi' && (
        <>
          <div>
            <Label className="text-slate-400 text-xs uppercase">Etiqueta</Label>
            <Input
              value={component.config.kpiConfig?.label || ''}
              onChange={(e) => onUpdate({
                config: {
                  ...component.config,
                  kpiConfig: { ...component.config.kpiConfig!, label: e.target.value }
                }
              })}
              className="mt-1 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-400 text-xs uppercase">Formato</Label>
            <Select
              value={component.config.kpiConfig?.format || 'number'}
              onValueChange={(value: 'currency' | 'number' | 'percentage') => onUpdate({
                config: {
                  ...component.config,
                  kpiConfig: { ...component.config.kpiConfig!, format: value }
                }
              })}
            >
              <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="currency" className="text-white">Moneda</SelectItem>
                <SelectItem value="number" className="text-white">Número</SelectItem>
                <SelectItem value="percentage" className="text-white">Porcentaje</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {component.type === 'text' && (
        <>
          <div>
            <Label className="text-slate-400 text-xs uppercase">Contenido</Label>
            <textarea
              value={component.config.textConfig?.content || ''}
              onChange={(e) => onUpdate({
                config: {
                  ...component.config,
                  textConfig: { ...component.config.textConfig!, content: e.target.value }
                }
              })}
              className="mt-1 w-full h-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm resize-none"
            />
          </div>
          <div>
            <Label className="text-slate-400 text-xs uppercase">Tamaño de Fuente</Label>
            <Select
              value={component.config.textConfig?.fontSize || 'md'}
              onValueChange={(value: 'sm' | 'md' | 'lg' | 'xl') => onUpdate({
                config: {
                  ...component.config,
                  textConfig: { ...component.config.textConfig!, fontSize: value }
                }
              })}
            >
              <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="sm" className="text-white">Pequeño</SelectItem>
                <SelectItem value="md" className="text-white">Mediano</SelectItem>
                <SelectItem value="lg" className="text-white">Grande</SelectItem>
                <SelectItem value="xl" className="text-white">Extra Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Tamaño del componente */}
      <div>
        <Label className="text-slate-400 text-xs uppercase">Ancho</Label>
        <div className="flex gap-2 mt-2">
          <Button
            variant={component.size.width === 1 ? 'default' : 'outline'}
            size="sm"
            onClick={() => onUpdate({ size: { ...component.size, width: 1 } })}
            className={component.size.width === 1
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300'
            }
          >
            1 columna
          </Button>
          <Button
            variant={component.size.width === 2 ? 'default' : 'outline'}
            size="sm"
            onClick={() => onUpdate({ size: { ...component.size, width: 2 } })}
            className={component.size.width === 2
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300'
            }
          >
            2 columnas
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;
