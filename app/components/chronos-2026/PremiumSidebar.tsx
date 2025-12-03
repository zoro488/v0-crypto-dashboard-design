'use client'

/**
 * CHRONOS 2026 - Sidebar Premium Colapsable
 * Sidebar ultra-moderna con animaciones de física real
 * 
 * Features:
 * - Colapso animado (280px → 72px)
 * - Physics-based animations
 * - Tooltip en modo colapsado
 * - Active state indicators
 * - Keyboard navigation
 */

import { memo, useState, createContext, useContext, ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { 
  Home, ShoppingCart, Package, Users, Warehouse, 
  DollarSign, FileText, Bot, Menu, ChevronLeft,
  Settings, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHRONOS_COLORS, CHRONOS_ANIMATIONS } from '@/app/lib/constants/chronos-2026'

// Context para el estado del sidebar
interface SidebarContextValue {
  isCollapsed: boolean
  toggleCollapsed: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  isCollapsed: false,
  toggleCollapsed: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

// Provider
export function SidebarProvider({ 
  children,
  defaultCollapsed = false, 
}: { 
  children: ReactNode
  defaultCollapsed?: boolean 
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  
  return (
    <SidebarContext.Provider value={{
      isCollapsed,
      toggleCollapsed: () => setIsCollapsed(prev => !prev),
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

// Menu items
const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/', panel: 'dashboard' },
  { icon: ShoppingCart, label: 'Ventas', href: '/ventas', panel: 'ventas' },
  { icon: Package, label: 'Órdenes', href: '/ordenes', panel: 'ordenes' },
  { icon: Warehouse, label: 'Almacén', href: '/almacen', panel: 'almacen' },
  { icon: Users, label: 'Clientes', href: '/clientes', panel: 'clientes' },
  { icon: DollarSign, label: 'Bancos', href: '/bancos', panel: 'bancos' },
  { icon: FileText, label: 'Reportes', href: '/reportes', panel: 'reportes' },
  { icon: Bot, label: 'IA', href: '/ia', panel: 'ia' },
]

const bottomMenuItems = [
  { icon: Settings, label: 'Configuración', href: '/settings', panel: 'settings' },
  { icon: LogOut, label: 'Salir', href: '/logout', panel: 'logout' },
]

interface SidebarItemProps {
  icon: typeof Home
  label: string
  href: string
  panel: string
  isActive?: boolean
  isCollapsed: boolean
  onClick?: () => void
}

const SidebarItem = memo(({ 
  icon: Icon, 
  label, 
  isActive = false, 
  isCollapsed,
  onClick,
}: SidebarItemProps) => {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={prefersReducedMotion ? {} : { x: 4 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
        'transition-all duration-200',
        'group relative',
        isActive 
          ? 'bg-white/10 text-white' 
          : 'text-white/60 hover:bg-white/5 hover:text-white',
      )}
      title={isCollapsed ? label : undefined}
      aria-label={label}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
          style={{ background: CHRONOS_COLORS.gradientPrimary }}
          transition={{ type: 'spring', ...CHRONOS_ANIMATIONS.spring.snappy }}
        />
      )}
      
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 transition-colors',
        isActive ? 'text-white' : 'text-white/60 group-hover:text-white',
      )}>
        <Icon className="w-5 h-5" />
      </div>
      
      {/* Label (animated) */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="font-medium whitespace-nowrap overflow-hidden"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      
      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
        style={{
          background: `linear-gradient(90deg, ${CHRONOS_COLORS.primary}10, transparent)`,
        }}
      />
    </motion.button>
  )
})
SidebarItem.displayName = 'SidebarItem'

interface PremiumSidebarProps {
  currentPanel?: string
  onPanelChange?: (panel: string) => void
  className?: string
}

function PremiumSidebar({ 
  currentPanel = 'dashboard',
  onPanelChange,
  className = '',
}: PremiumSidebarProps) {
  const { isCollapsed, toggleCollapsed } = useSidebar()
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: isCollapsed ? 72 : 280,
      }}
      transition={prefersReducedMotion ? { duration: 0 } : {
        type: 'spring',
        ...CHRONOS_ANIMATIONS.spring.snappy,
      }}
      className={cn(
        'fixed left-0 top-0 h-full z-40',
        'bg-black/80 backdrop-blur-2xl',
        'border-r border-white/[0.08]',
        'flex flex-col',
        'hidden lg:flex', // Solo visible en desktop
        className,
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.08]">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              {/* Logo */}
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black text-white"
                style={{ background: CHRONOS_COLORS.gradientPrimary }}
              >
                C
              </div>
              <span className="text-xl font-bold text-white">Chronos</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isCollapsed && (
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black text-white mx-auto"
            style={{ background: CHRONOS_COLORS.gradientPrimary }}
          >
            C
          </div>
        )}
        
        {/* Toggle button */}
        {!isCollapsed && (
          <motion.button
            onClick={toggleCollapsed}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            aria-label="Colapsar sidebar"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        )}
      </div>
      
      {/* Expand button when collapsed */}
      {isCollapsed && (
        <motion.button
          onClick={toggleCollapsed}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 mx-4 mt-4 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          aria-label="Expandir sidebar"
        >
          <Menu className="w-5 h-5 mx-auto" />
        </motion.button>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.panel}
              {...item}
              isActive={currentPanel === item.panel}
              isCollapsed={isCollapsed}
              onClick={() => onPanelChange?.(item.panel)}
            />
          ))}
        </div>
      </nav>
      
      {/* Bottom section */}
      <div className="border-t border-white/[0.08] p-3 space-y-1">
        {bottomMenuItems.map((item) => (
          <SidebarItem
            key={item.panel}
            {...item}
            isActive={currentPanel === item.panel}
            isCollapsed={isCollapsed}
            onClick={() => onPanelChange?.(item.panel)}
          />
        ))}
      </div>
    </motion.aside>
  )
}

export default memo(PremiumSidebar)
