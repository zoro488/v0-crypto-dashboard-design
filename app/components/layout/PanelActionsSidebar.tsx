'use client'

/**
 * 🎛️ PANEL ACTIONS SIDEBAR - Apple/Tesla/Grok Style
 * 
 * Sidebar contextual que aparece en cada panel con:
 * - Acciones rápidas específicas del panel
 * - Botones de registro (Nueva Venta, Nueva Orden, etc.)
 * - Widget de IA integrado Grok-style
 * - Estadísticas rápidas del panel
 * - Filtros y búsqueda contextual
 * 
 * Diseño: Glassmorphism ultra-refinado
 * Animaciones: Framer Motion spring physics
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback } from 'react'
import {
  Plus,
  DollarSign,
  Package,
  Users,
  ArrowRightLeft,
  FileText,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Sparkles,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  X,
  Mic,
  Send,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import type { PanelId } from '@/app/types'

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface ActionButton {
  id: string
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  badge?: string | number
}

interface QuickStat {
  label: string
  value: string | number
  trend?: number
  icon: LucideIcon
}

interface PanelActionsSidebarProps {
  panelId: PanelId
  isOpen: boolean
  onClose: () => void
  onAction: (actionId: string) => void
  stats?: QuickStat[]
  className?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE ACCIONES POR PANEL
// ═══════════════════════════════════════════════════════════════════════════════

const panelActions: Record<string, ActionButton[]> = {
  dashboard: [
    { id: 'new-sale', label: 'Nueva Venta', icon: DollarSign, onClick: () => {}, variant: 'primary' },
    { id: 'new-order', label: 'Nueva Orden', icon: Package, onClick: () => {}, variant: 'secondary' },
    { id: 'transfer', label: 'Transferencia', icon: ArrowRightLeft, onClick: () => {}, variant: 'ghost' },
    { id: 'report', label: 'Generar Reporte', icon: FileText, onClick: () => {}, variant: 'ghost' },
  ],
  ventas: [
    { id: 'new-sale', label: 'Registrar Venta', icon: DollarSign, onClick: () => {}, variant: 'primary' },
    { id: 'bulk-upload', label: 'Carga Masiva', icon: Upload, onClick: () => {}, variant: 'secondary' },
    { id: 'export', label: 'Exportar CSV', icon: Download, onClick: () => {}, variant: 'ghost' },
    { id: 'analytics', label: 'Análisis IA', icon: Sparkles, onClick: () => {}, variant: 'ghost' },
  ],
  ordenes: [
    { id: 'new-order', label: 'Nueva Orden', icon: Package, onClick: () => {}, variant: 'primary' },
    { id: 'pending', label: 'Pendientes', icon: Clock, onClick: () => {}, variant: 'secondary', badge: 5 },
    { id: 'complete', label: 'Completar', icon: CheckCircle, onClick: () => {}, variant: 'ghost' },
    { id: 'export', label: 'Exportar', icon: Download, onClick: () => {}, variant: 'ghost' },
  ],
  almacen: [
    { id: 'new-entry', label: 'Entrada Stock', icon: Plus, onClick: () => {}, variant: 'primary' },
    { id: 'new-exit', label: 'Salida Stock', icon: Package, onClick: () => {}, variant: 'secondary' },
    { id: 'inventory', label: 'Inventario', icon: BarChart3, onClick: () => {}, variant: 'ghost' },
    { id: 'alerts', label: 'Alertas Stock', icon: AlertCircle, onClick: () => {}, variant: 'ghost', badge: 3 },
  ],
  bancos: [
    { id: 'transfer', label: 'Transferencia', icon: ArrowRightLeft, onClick: () => {}, variant: 'primary' },
    { id: 'expense', label: 'Registrar Gasto', icon: TrendingDown, onClick: () => {}, variant: 'secondary' },
    { id: 'income', label: 'Registrar Ingreso', icon: TrendingUp, onClick: () => {}, variant: 'ghost' },
    { id: 'reconcile', label: 'Conciliar', icon: RefreshCw, onClick: () => {}, variant: 'ghost' },
  ],
  clientes: [
    { id: 'new-client', label: 'Nuevo Cliente', icon: Users, onClick: () => {}, variant: 'primary' },
    { id: 'payment', label: 'Registrar Abono', icon: DollarSign, onClick: () => {}, variant: 'secondary' },
    { id: 'debts', label: 'Ver Deudas', icon: FileText, onClick: () => {}, variant: 'ghost' },
    { id: 'export', label: 'Exportar', icon: Download, onClick: () => {}, variant: 'ghost' },
  ],
  distribuidores: [
    { id: 'new-dist', label: 'Nuevo Distribuidor', icon: Users, onClick: () => {}, variant: 'primary' },
    { id: 'payment', label: 'Abonar Deuda', icon: DollarSign, onClick: () => {}, variant: 'secondary' },
    { id: 'orders', label: 'Ver Órdenes', icon: Package, onClick: () => {}, variant: 'ghost' },
    { id: 'analytics', label: 'Análisis', icon: PieChart, onClick: () => {}, variant: 'ghost' },
  ],
  reportes: [
    { id: 'daily', label: 'Reporte Diario', icon: Calendar, onClick: () => {}, variant: 'primary' },
    { id: 'monthly', label: 'Reporte Mensual', icon: BarChart3, onClick: () => {}, variant: 'secondary' },
    { id: 'custom', label: 'Personalizado', icon: Settings, onClick: () => {}, variant: 'ghost' },
    { id: 'ai-insights', label: 'Insights IA', icon: Sparkles, onClick: () => {}, variant: 'ghost' },
  ],
  ia: [
    { id: 'chat', label: 'Chat IA', icon: MessageSquare, onClick: () => {}, variant: 'primary' },
    { id: 'analyze', label: 'Analizar Datos', icon: Sparkles, onClick: () => {}, variant: 'secondary' },
    { id: 'predict', label: 'Predicciones', icon: TrendingUp, onClick: () => {}, variant: 'ghost' },
    { id: 'automate', label: 'Automatizar', icon: RefreshCw, onClick: () => {}, variant: 'ghost' },
  ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Action Button
// ═══════════════════════════════════════════════════════════════════════════════

interface ActionButtonComponentProps {
  action: ActionButton
  onAction: (id: string) => void
}

const ActionButtonComponent = ({ action, onAction }: ActionButtonComponentProps) => {
  const Icon = action.icon
  
  const variantStyles = {
    primary: 'bg-[#E31911] hover:bg-[#CC1510] text-white shadow-lg shadow-red-500/20',
    secondary: 'bg-white/10 hover:bg-white/15 text-white border border-white/10',
    ghost: 'bg-transparent hover:bg-white/5 text-white/70 hover:text-white',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onAction(action.id)}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
        'text-sm font-medium',
        variantStyles[action.variant || 'ghost'],
      )}
    >
      <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
      <span className="flex-1 text-left">{action.label}</span>
      {action.badge && (
        <span className="px-2 py-0.5 text-xs font-bold bg-white/20 rounded-full">
          {action.badge}
        </span>
      )}
      <ChevronRight className="w-4 h-4 opacity-40" />
    </motion.button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Quick Stat Card
// ═══════════════════════════════════════════════════════════════════════════════

const QuickStatCard = ({ stat }: { stat: QuickStat }) => {
  const Icon = stat.icon
  
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4 text-white/40" strokeWidth={1.5} />
        {stat.trend !== undefined && (
          <span className={cn(
            'text-xs font-medium',
            stat.trend >= 0 ? 'text-green-400' : 'text-red-400',
          )}>
            {stat.trend >= 0 ? '+' : ''}{stat.trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{stat.value}</p>
      <p className="text-xs text-white/50 mt-1">{stat.label}</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Mini AI Chat Widget
// ═══════════════════════════════════════════════════════════════════════════════

const MiniAIWidget = () => {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E31911] to-[#8B0000] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-full bg-[#E31911]/30"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Asistente IA</p>
          <p className="text-[10px] text-white/40">Grok-powered</p>
        </div>
      </div>
      
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta algo..."
          className="w-full px-4 py-2.5 pr-20 bg-black/30 border border-white/10 rounded-xl 
                     text-sm text-white placeholder-white/30 outline-none
                     focus:border-white/20 transition-colors"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsListening(!isListening)}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              isListening ? 'bg-[#E31911] text-white' : 'text-white/40 hover:text-white',
            )}
          >
            <Mic className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 rounded-lg text-white/40 hover:text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
      
      <div className="mt-3 flex flex-wrap gap-1.5">
        {['Resumen del día', 'Stock bajo', 'Ventas pendientes'].map((suggestion) => (
          <button
            key={suggestion}
            className="px-2 py-1 text-[10px] text-white/50 bg-white/5 hover:bg-white/10 
                       rounded-md transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export function PanelActionsSidebar({
  panelId,
  isOpen,
  onClose,
  onAction,
  stats,
  className,
}: PanelActionsSidebarProps) {
  const actions = panelActions[panelId] || panelActions.dashboard
  const [searchQuery, setSearchQuery] = useState('')

  const defaultStats: QuickStat[] = stats || [
    { label: 'Total Hoy', value: '$45,230', trend: 12.5, icon: TrendingUp },
    { label: 'Operaciones', value: '24', trend: 8, icon: BarChart3 },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'fixed right-0 top-0 bottom-0 w-80 z-50',
              'bg-[#0A0A0A]/95 backdrop-blur-2xl',
              'border-l border-white/5',
              'flex flex-col',
              'shadow-2xl shadow-black/50',
              className,
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div>
                <h2 className="text-lg font-semibold text-white">Acciones</h2>
                <p className="text-xs text-white/40 capitalize">{panelId.replace('_', ' ')}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </motion.button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar acción..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl
                             text-sm text-white placeholder-white/30 outline-none
                             focus:border-white/10 transition-colors"
                />
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {/* Quick Stats */}
              <div className="p-4 border-b border-white/5">
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                  Resumen Rápido
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {defaultStats.map((stat, i) => (
                    <QuickStatCard key={i} stat={stat} />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-b border-white/5">
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                  Acciones Rápidas
                </p>
                <div className="space-y-1">
                  {actions.map((action) => (
                    <ActionButtonComponent
                      key={action.id}
                      action={action}
                      onAction={onAction}
                    />
                  ))}
                </div>
              </div>

              {/* More Options */}
              <div className="p-4 border-b border-white/5">
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                  Más Opciones
                </p>
                <div className="space-y-1">
                  <ActionButtonComponent
                    action={{ id: 'filter', label: 'Filtros Avanzados', icon: Filter, onClick: () => {}, variant: 'ghost' }}
                    onAction={onAction}
                  />
                  <ActionButtonComponent
                    action={{ id: 'refresh', label: 'Actualizar Datos', icon: RefreshCw, onClick: () => {}, variant: 'ghost' }}
                    onAction={onAction}
                  />
                  <ActionButtonComponent
                    action={{ id: 'settings', label: 'Configuración', icon: Settings, onClick: () => {}, variant: 'ghost' }}
                    onAction={onAction}
                  />
                </div>
              </div>
            </div>

            {/* AI Widget - Fixed at bottom */}
            <div className="p-4 border-t border-white/5 bg-black/30">
              <MiniAIWidget />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export default PanelActionsSidebar
