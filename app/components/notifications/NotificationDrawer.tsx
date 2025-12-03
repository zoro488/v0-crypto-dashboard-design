'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Bell, 
  DollarSign, 
  AlertTriangle, 
  Info, 
  Package,
  Check,
  CheckCheck,
  ShoppingCart,
  TrendingUp,
  Clock,
} from 'lucide-react'
import '@/app/styles/chronos-obsidian-os.css'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PULSE FEED - Notification Center
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Panel lateral de notificaciones con:
 * - Tabs: Todas, No leídas, Alertas críticas
 * - Tarjetas mini con iconografía semántica
 * - Acciones inline
 * - Agrupación de notificaciones similares
 * - Animaciones de entrada
 */

export type NotificationType = 'sale' | 'alert' | 'system' | 'info'
type NotificationTab = 'all' | 'unread' | 'critical'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  timestamp: Date
  read: boolean
  grouped?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

// Datos de ejemplo
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'sale',
    title: '5 nuevas ventas registradas',
    description: 'En la última hora',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
    grouped: 5,
  },
  {
    id: '2',
    type: 'alert',
    title: 'Stock bajo: Producto Premium A',
    description: 'Solo quedan 3 unidades en inventario',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
    action: {
      label: 'Pedir',
      onClick: () => console.log('Pedir producto'),
    },
  },
  {
    id: '3',
    type: 'sale',
    title: 'Venta completada',
    description: 'Carlos López - $15,000 MXN',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    read: false,
  },
  {
    id: '4',
    type: 'system',
    title: 'Actualización del sistema',
    description: 'Nueva versión 2.1 disponible',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
  },
  {
    id: '5',
    type: 'alert',
    title: 'Pago pendiente',
    description: 'María García - $8,500 MXN vencido',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    read: true,
    action: {
      label: 'Recordar',
      onClick: () => console.log('Enviar recordatorio'),
    },
  },
  {
    id: '6',
    type: 'info',
    title: 'Reporte mensual listo',
    description: 'El reporte de diciembre está disponible',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
  },
]

// Iconos por tipo
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'sale':
      return { icon: DollarSign, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
    case 'alert':
      return { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
    case 'system':
      return { icon: Info, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' }
    case 'info':
      return { icon: TrendingUp, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' }
    default:
      return { icon: Bell, color: '#ffffff', bg: 'rgba(255, 255, 255, 0.1)' }
  }
}

// Formatear tiempo relativo
const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Ahora'
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)}h`
  return `Hace ${Math.floor(seconds / 86400)}d`
}

// Notification Card
function NotificationCard({ 
  notification, 
  onMarkRead,
  index,
}: { 
  notification: Notification
  onMarkRead: () => void
  index: number
}) {
  const { icon: Icon, color, bg } = getNotificationIcon(notification.type)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ delay: index * 0.05 }}
      className="relative p-4 rounded-2xl mb-3 group"
      style={{
        background: notification.read 
          ? 'rgba(255, 255, 255, 0.02)' 
          : 'rgba(255, 255, 255, 0.04)',
        border: `1px solid ${notification.read ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.08)'}`,
      }}
    >
      {/* Indicador de no leído */}
      {!notification.read && (
        <motion.div
          className="absolute top-4 right-4 w-2 h-2 rounded-full"
          style={{ background: color }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      <div className="flex gap-3">
        {/* Icono */}
        <div 
          className="p-2.5 rounded-xl shrink-0"
          style={{ background: bg }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
          
          {/* Animación de pulso para alertas */}
          {notification.type === 'alert' && !notification.read && (
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{ background: bg }}
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-white font-medium text-sm leading-tight">
              {notification.title}
            </p>
          </div>
          
          <p className="text-white/40 text-xs mb-2 line-clamp-2">
            {notification.description}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-white/30 text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(notification.timestamp)}
            </span>
            
            <div className="flex items-center gap-2">
              {/* Grouped indicator */}
              {notification.grouped && notification.grouped > 1 && (
                <span 
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ background: bg, color }}
                >
                  +{notification.grouped - 1} más
                </span>
              )}
              
              {/* Action button */}
              {notification.action && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    notification.action?.onClick()
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={{ 
                    background: bg,
                    color,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {notification.action.label}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mark as read on click */}
      {!notification.read && (
        <motion.button
          onClick={onMarkRead}
          className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Check className="w-3 h-3 text-white/40" />
        </motion.button>
      )}
    </motion.div>
  )
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const [activeTab, setActiveTab] = useState<NotificationTab>('all')
  const [notifications, setNotifications] = useState(mockNotifications)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  
  const unreadCount = notifications.filter(n => !n.read).length
  const criticalCount = notifications.filter(n => n.type === 'alert' && !n.read).length
  
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read
    if (activeTab === 'critical') return n.type === 'alert'
    return true
  })
  
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n),
    )
  }, [])
  
  const markAllAsRead = useCallback(async () => {
    setIsMarkingAll(true)
    
    // Animar el barrido
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setIsMarkingAll(false)
  }, [])
  
  const tabs = [
    { id: 'all', label: 'Todas', count: notifications.length },
    { id: 'unread', label: 'No leídas', count: unreadCount },
    { id: 'critical', label: 'Críticas', count: criticalCount },
  ] as const
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0, 0, 0, 0.5)' }}
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col"
            style={{
              background: 'rgba(10, 10, 15, 0.95)',
              backdropFilter: 'blur(40px)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2 rounded-xl"
                    style={{ background: 'rgba(139, 92, 246, 0.1)' }}
                  >
                    <Bell className="w-5 h-5 text-violet-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Notificaciones</h2>
                  {unreadCount > 0 && (
                    <span 
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>
                
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-xl"
                  style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-white/60" />
                </motion.button>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-2">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      background: activeTab === tab.id 
                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))' 
                        : 'rgba(255, 255, 255, 0.03)',
                      color: activeTab === tab.id ? 'white' : 'rgba(255, 255, 255, 0.5)',
                      border: `1px solid ${activeTab === tab.id ? 'rgba(139, 92, 246, 0.3)' : 'transparent'}`,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="ml-1 opacity-60">({tab.count})</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Mark all as read */}
            {unreadCount > 0 && (
              <div className="px-6 py-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                <motion.button
                  onClick={markAllAsRead}
                  disabled={isMarkingAll}
                  className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Marcar todo como leído</span>
                  
                  {/* Barrido visual */}
                  {isMarkingAll && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 0.5 }}
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.2), transparent)',
                      }}
                    />
                  )}
                </motion.button>
              </div>
            )}
            
            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-obsidian">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification, index) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkRead={() => markAsRead(notification.id)}
                      index={index}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16"
                  >
                    <div 
                      className="p-4 rounded-2xl mb-4"
                      style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                    >
                      <Bell className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-white/40 text-center">
                      {activeTab === 'unread' 
                        ? 'No tienes notificaciones sin leer'
                        : activeTab === 'critical'
                        ? 'No hay alertas críticas'
                        : 'No hay notificaciones'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Hook para controlar el drawer
export function useNotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  }
}

export default NotificationDrawer
