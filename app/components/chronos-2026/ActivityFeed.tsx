'use client'

/**
 * CHRONOS 2026 - Activity Feed Premium
 * Feed de actividad reciente tipo Twitter/Linear
 * 
 * Features:
 * - Real-time updates
 * - Smooth animations
 * - Iconos de estado
 * - Timestamps relativos
 * - Empty state premium
 */

import { memo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { 
  ShoppingCart, Users, Package, DollarSign, 
  TrendingUp, AlertCircle, CheckCircle, Clock,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import GlassCard from './GlassCard'
import { CHRONOS_COLORS, CHRONOS_ANIMATIONS } from '@/app/lib/constants/chronos-2026'

interface ActivityItem {
  id: string
  type: 'venta' | 'cliente' | 'orden' | 'banco' | 'stock' | 'alerta' | 'exito'
  title: string
  description?: string
  timestamp: Date
  amount?: number
  status?: 'pending' | 'completed' | 'warning'
}

interface ActivityFeedProps {
  items: ActivityItem[]
  maxItems?: number
  className?: string
  title?: string
  showHeader?: boolean
}

const iconMap = {
  venta: ShoppingCart,
  cliente: Users,
  orden: Package,
  banco: DollarSign,
  stock: Package,
  alerta: AlertCircle,
  exito: CheckCircle,
}

const colorMap = {
  venta: CHRONOS_COLORS.success,
  cliente: CHRONOS_COLORS.primary,
  orden: CHRONOS_COLORS.accent,
  banco: CHRONOS_COLORS.info,
  stock: CHRONOS_COLORS.warning,
  alerta: CHRONOS_COLORS.danger,
  exito: CHRONOS_COLORS.success,
}

const statusColorMap = {
  pending: CHRONOS_COLORS.warning,
  completed: CHRONOS_COLORS.success,
  warning: CHRONOS_COLORS.danger,
}

// Item individual
const ActivityItemComponent = memo(({ 
  item, 
  index,
  prefersReducedMotion,
}: { 
  item: ActivityItem
  index: number
  prefersReducedMotion: boolean | null
}) => {
  const Icon = iconMap[item.type]
  const color = colorMap[item.type]
  
  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={prefersReducedMotion ? {} : { opacity: 0, x: 20 }}
      transition={{ 
        delay: index * 0.05,
        duration: CHRONOS_ANIMATIONS.duration.normal,
        ease: CHRONOS_ANIMATIONS.ease.smooth,
      }}
      className="group flex items-start gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-colors"
    >
      {/* Icon */}
      <div 
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-white truncate">{item.title}</p>
          {item.amount && (
            <span 
              className="flex-shrink-0 text-sm font-semibold"
              style={{ color }}
            >
              ${item.amount.toLocaleString()}
            </span>
          )}
        </div>
        
        {item.description && (
          <p className="text-sm text-white/50 mt-0.5 truncate">
            {item.description}
          </p>
        )}
        
        <div className="flex items-center gap-2 mt-2">
          <Clock className="w-3 h-3 text-white/30" />
          <span className="text-xs text-white/40">
            {formatDistanceToNow(item.timestamp, { 
              addSuffix: true, 
              locale: es, 
            })}
          </span>
          
          {item.status && (
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: `${statusColorMap[item.status]}20`,
                color: statusColorMap[item.status],
              }}
            >
              {item.status === 'pending' && 'Pendiente'}
              {item.status === 'completed' && 'Completado'}
              {item.status === 'warning' && 'Atención'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
})
ActivityItemComponent.displayName = 'ActivityItemComponent'

// Empty state
const EmptyState = memo(() => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-12 px-4"
  >
    <motion.div
      animate={{ 
        scale: [1, 1.1, 1],
        rotate: [0, 5, -5, 0],
      }}
      transition={{ 
        duration: 4, 
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
      style={{ 
        background: `linear-gradient(135deg, ${CHRONOS_COLORS.primary}30, ${CHRONOS_COLORS.accent}30)`, 
      }}
    >
      <Sparkles className="w-8 h-8 text-white/60" />
    </motion.div>
    
    <p className="text-white/60 text-center font-medium">
      No hay actividad reciente
    </p>
    <p className="text-white/40 text-sm text-center mt-1">
      Las nuevas acciones aparecerán aquí
    </p>
  </motion.div>
))
EmptyState.displayName = 'EmptyState'

function ActivityFeed({ 
  items, 
  maxItems = 10,
  className = '',
  title = 'Actividad Reciente',
  showHeader = true,
}: ActivityFeedProps) {
  const prefersReducedMotion = useReducedMotion()
  const displayItems = items.slice(0, maxItems)
  
  return (
    <GlassCard 
      className={cn('overflow-hidden', className)} 
      padding="none"
    >
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <h3 className="font-semibold text-white">{title}</h3>
          {items.length > 0 && (
            <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
      )}
      
      <div className="max-h-[400px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {displayItems.length > 0 ? (
            displayItems.map((item, index) => (
              <ActivityItemComponent
                key={item.id}
                item={item}
                index={index}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))
          ) : (
            <EmptyState />
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  )
}

export default memo(ActivityFeed)
