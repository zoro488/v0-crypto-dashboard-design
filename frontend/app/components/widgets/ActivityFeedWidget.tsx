"use client"

/**
 * 🌊 ACTIVITY FEED WIDGET - Feed de Actividad en Tiempo Real Premium
 * 
 * Componente para mostrar actividad reciente con:
 * - Animaciones de entrada suaves
 * - Agrupación por tiempo
 * - Iconos dinámicos por tipo
 * - Efectos de hover premium
 * - Auto-scroll con nuevas entradas
 */

import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  LucideIcon
} from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

// ============================================================================
// TIPOS
// ============================================================================
export type ActivityType = 
  | 'venta' 
  | 'compra' 
  | 'transferencia' 
  | 'stock' 
  | 'cliente' 
  | 'pago' 
  | 'alerta' 
  | 'sistema'

export interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  description?: string
  amount?: number
  timestamp: Date
  status?: 'success' | 'pending' | 'error'
  metadata?: Record<string, unknown>
}

interface ActivityFeedWidgetProps {
  activities: ActivityItem[]
  maxItems?: number
  showTimestamps?: boolean
  showAmounts?: boolean
  animated?: boolean
  autoScroll?: boolean
  title?: string
  className?: string
  onItemClick?: (activity: ActivityItem) => void
}

// ============================================================================
// CONFIGURACIÓN POR TIPO DE ACTIVIDAD
// ============================================================================
const activityConfig: Record<ActivityType, { 
  icon: LucideIcon
  color: string
  bgColor: string
  label: string 
}> = {
  venta: { 
    icon: TrendingUp, 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/20',
    label: 'Venta'
  },
  compra: { 
    icon: ShoppingCart, 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/20',
    label: 'Compra'
  },
  transferencia: { 
    icon: ArrowRightLeft, 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/20',
    label: 'Transferencia'
  },
  stock: { 
    icon: Package, 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/20',
    label: 'Stock'
  },
  cliente: { 
    icon: Users, 
    color: 'text-pink-400', 
    bgColor: 'bg-pink-500/20',
    label: 'Cliente'
  },
  pago: { 
    icon: DollarSign, 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/20',
    label: 'Pago'
  },
  alerta: { 
    icon: AlertCircle, 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/20',
    label: 'Alerta'
  },
  sistema: { 
    icon: Bell, 
    color: 'text-slate-400', 
    bgColor: 'bg-slate-500/20',
    label: 'Sistema'
  }
}

// ============================================================================
// UTILIDAD PARA FORMATO DE TIEMPO
// ============================================================================
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `hace ${minutes} min`
  if (hours < 24) return `hace ${hours}h`
  if (days < 7) return `hace ${days}d`
  
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

// ============================================================================
// COMPONENTE DE ITEM INDIVIDUAL
// ============================================================================
function ActivityItemComponent({ 
  activity, 
  showTimestamp, 
  showAmount,
  onClick,
  index 
}: { 
  activity: ActivityItem
  showTimestamp: boolean
  showAmount: boolean
  onClick?: (activity: ActivityItem) => void
  index: number
}) {
  const config = activityConfig[activity.type]
  const Icon = config.icon
  
  const StatusIcon = activity.status === 'success' 
    ? CheckCircle2 
    : activity.status === 'error' 
      ? AlertCircle 
      : Clock
  
  const statusColor = activity.status === 'success'
    ? 'text-emerald-400'
    : activity.status === 'error'
      ? 'text-red-400'
      : 'text-amber-400'
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{ 
        x: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        transition: { duration: 0.2 }
      }}
      onClick={() => onClick?.(activity)}
      className={`
        flex items-center gap-3 p-3 rounded-xl
        border border-transparent hover:border-white/5
        transition-colors duration-200
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Icono de tipo */}
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className={`
          w-10 h-10 rounded-xl ${config.bgColor}
          flex items-center justify-center flex-shrink-0
        `}
      >
        <Icon className={`w-5 h-5 ${config.color}`} />
      </motion.div>
      
      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">
            {activity.title}
          </span>
          {activity.status && (
            <StatusIcon className={`w-3.5 h-3.5 ${statusColor} flex-shrink-0`} />
          )}
        </div>
        
        {activity.description && (
          <p className="text-xs text-white/40 truncate mt-0.5">
            {activity.description}
          </p>
        )}
      </div>
      
      {/* Monto y tiempo */}
      <div className="flex flex-col items-end flex-shrink-0">
        {showAmount && activity.amount !== undefined && (
          <span className={`
            text-sm font-mono font-semibold
            ${activity.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}
          `}>
            {activity.amount >= 0 ? '+' : ''}${Math.abs(activity.amount).toLocaleString()}
          </span>
        )}
        
        {showTimestamp && (
          <span className="text-xs text-white/30 mt-0.5">
            {formatRelativeTime(activity.timestamp)}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export function ActivityFeedWidget({
  activities,
  maxItems = 10,
  showTimestamps = true,
  showAmounts = true,
  animated = true,
  autoScroll = true,
  title = 'Actividad Reciente',
  className = '',
  onItemClick
}: ActivityFeedWidgetProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [prevLength, setPrevLength] = useState(activities.length)
  
  // Auto-scroll cuando hay nuevas actividades
  useEffect(() => {
    if (autoScroll && activities.length > prevLength && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
    setPrevLength(activities.length)
  }, [activities.length, autoScroll, prevLength])
  
  // Limitar items mostrados
  const displayedActivities = activities.slice(0, maxItems)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`
        rounded-2xl bg-zinc-900/60 backdrop-blur-xl
        border border-white/5
        overflow-hidden
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        
        <span className="text-xs text-white/40">
          {activities.length} eventos
        </span>
      </div>
      
      {/* Lista de actividades */}
      <div 
        ref={scrollRef}
        className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
      >
        {displayedActivities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <Bell className="w-10 h-10 text-white/20 mb-3" />
            <p className="text-sm text-white/40">No hay actividad reciente</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="p-2 space-y-1">
              {displayedActivities.map((activity, index) => (
                <ActivityItemComponent
                  key={activity.id}
                  activity={activity}
                  showTimestamp={showTimestamps}
                  showAmount={showAmounts}
                  onClick={onItemClick}
                  index={animated ? index : 0}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
      
      {/* Footer con ver más */}
      {activities.length > maxItems && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 border-t border-white/5 text-center"
        >
          <button className="text-xs text-white/50 hover:text-white/80 transition-colors">
            Ver {activities.length - maxItems} más →
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

export default ActivityFeedWidget
