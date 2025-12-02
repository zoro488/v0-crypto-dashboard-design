'use client'

import { motion } from 'framer-motion'
import { 
  Inbox, 
  Database, 
  Plus, 
  FileText, 
  Users, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  type LucideIcon, 
} from 'lucide-react'

interface EmptyStateProps {
  /** Tipo de entidad para mostrar icono contextual */
  type?: 'ventas' | 'clientes' | 'ordenes' | 'productos' | 'general' | 'bancos' | 'reportes'
  /** Título principal */
  title?: string
  /** Descripción secundaria */
  description?: string
  /** Mostrar botón de acción */
  showAction?: boolean
  /** Texto del botón */
  actionText?: string
  /** Callback cuando se clickea el botón */
  onAction?: () => void
  /** Variante visual */
  variant?: 'default' | 'minimal' | 'card'
  /** Tamaño */
  size?: 'sm' | 'md' | 'lg'
}

const ICONS: Record<string, LucideIcon> = {
  ventas: TrendingUp,
  clientes: Users,
  ordenes: ShoppingCart,
  productos: Package,
  bancos: Database,
  reportes: FileText,
  general: Inbox,
}

const DEFAULTS: Record<string, { title: string; description: string; action: string }> = {
  ventas: {
    title: 'Sin ventas registradas',
    description: 'Registra tu primera venta para comenzar a visualizar datos',
    action: 'Nueva Venta',
  },
  clientes: {
    title: 'Sin clientes registrados',
    description: 'Agrega clientes para gestionar tu cartera',
    action: 'Nuevo Cliente',
  },
  ordenes: {
    title: 'Sin órdenes de compra',
    description: 'Crea órdenes de compra para gestionar tu inventario',
    action: 'Nueva Orden',
  },
  productos: {
    title: 'Sin productos en almacén',
    description: 'Agrega productos para comenzar a gestionar tu inventario',
    action: 'Nuevo Producto',
  },
  bancos: {
    title: 'Sin movimientos bancarios',
    description: 'Los movimientos aparecerán cuando registres ventas, compras o transferencias',
    action: 'Nueva Transferencia',
  },
  reportes: {
    title: 'Sin reportes generados',
    description: 'Genera reportes para analizar el rendimiento de tu negocio',
    action: 'Generar Reporte',
  },
  general: {
    title: 'Sin datos disponibles',
    description: 'No hay información para mostrar en este momento',
    action: 'Agregar',
  },
}

export function EmptyState({
  type = 'general',
  title,
  description,
  showAction = true,
  actionText,
  onAction,
  variant = 'default',
  size = 'md',
}: EmptyStateProps) {
  const Icon = ICONS[type] || ICONS.general
  const defaults = DEFAULTS[type] || DEFAULTS.general
  
  const displayTitle = title || defaults.title
  const displayDescription = description || defaults.description
  const displayAction = actionText || defaults.action

  const sizeClasses = {
    sm: { icon: 32, container: 'py-6 px-4', title: 'text-sm', desc: 'text-xs' },
    md: { icon: 48, container: 'py-10 px-6', title: 'text-base', desc: 'text-sm' },
    lg: { icon: 64, container: 'py-16 px-8', title: 'text-lg', desc: 'text-base' },
  }
  
  const sizes = sizeClasses[size]

  if (variant === 'minimal') {
    return (
      <div className={`flex flex-col items-center justify-center ${sizes.container} text-center`}>
        <Icon className="text-white/20 mb-3" size={sizes.icon * 0.75} />
        <p className={`text-white/40 ${sizes.title}`}>{displayTitle}</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`
        flex flex-col items-center justify-center ${sizes.container} text-center
        ${variant === 'card' ? 'bg-white/5 rounded-2xl border border-white/10' : ''}
      `}
    >
      {/* Icono con animación de pulso suave */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="relative mb-4"
      >
        {/* Glow de fondo */}
        <div className="absolute inset-0 bg-white/5 rounded-full blur-xl transform scale-150" />
        
        {/* Contenedor del icono */}
        <div className="relative p-4 bg-white/5 rounded-2xl border border-white/10">
          <Icon className="text-white/40" size={sizes.icon} />
        </div>
      </motion.div>

      {/* Título */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className={`text-white/80 font-semibold ${sizes.title} mb-2`}
      >
        {displayTitle}
      </motion.h3>

      {/* Descripción */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className={`text-white/40 ${sizes.desc} max-w-md mb-4`}
      >
        {displayDescription}
      </motion.p>

      {/* Botón de acción */}
      {showAction && onAction && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="
            flex items-center gap-2 px-5 py-2.5 
            bg-gradient-to-r from-blue-600 to-cyan-500 
            text-white text-sm font-semibold 
            rounded-xl shadow-lg shadow-blue-500/25
            hover:shadow-xl hover:shadow-blue-500/30
            transition-shadow duration-300
          "
        >
          <Plus size={16} />
          {displayAction}
        </motion.button>
      )}
    </motion.div>
  )
}

/**
 * Versión inline más compacta para usar dentro de tablas o listas
 */
export function EmptyStateInline({ 
  message = 'No hay datos disponibles',
  icon: IconProp,
}: { 
  message?: string 
  icon?: LucideIcon
}) {
  const Icon = IconProp || Inbox
  
  return (
    <div className="flex items-center justify-center gap-3 py-8 text-white/40">
      <Icon size={20} />
      <span className="text-sm">{message}</span>
    </div>
  )
}

export default EmptyState
