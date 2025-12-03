'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚀 CHRONOS 2026 ULTRA - SIDEBAR MAGNÉTICA PREMIUM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sidebar colapsable con efecto magnético y glassmorphism premium
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { memo, useState, createContext, useContext, ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { 
  LayoutDashboard, ShoppingCart, Users, Package, 
  Wallet, Warehouse, FileText, Bot, Settings,
  ChevronLeft, ChevronRight, Sparkles,
} from 'lucide-react'
import { C26_COLORS, C26_GRADIENTS, C26_ANIMATIONS } from '@/app/lib/constants/chronos-2026-ultra'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

interface SidebarContextType {
  isExpanded: boolean
  setIsExpanded: (value: boolean) => void
  activeItem: string
  setActiveItem: (value: string) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeItem, setActiveItem] = useState('dashboard')
  
  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, activeItem, setActiveItem }}>
      {children}
    </SidebarContext.Provider>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MENU ITEMS
// ═══════════════════════════════════════════════════════════════════════════

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'ventas', label: 'Ventas', icon: ShoppingCart },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'ordenes', label: 'Órdenes', icon: Package },
  { id: 'bancos', label: 'Bancos', icon: Wallet },
  { id: 'almacen', label: 'Almacén', icon: Warehouse },
  { id: 'reportes', label: 'Reportes', icon: FileText },
  { id: 'ia', label: 'IA Asistente', icon: Bot },
]

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR ITEM
// ═══════════════════════════════════════════════════════════════════════════

interface SidebarItemProps {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
  isExpanded: boolean
  onClick: () => void
}

const SidebarItem = memo(({ 
  id, 
  label, 
  icon: Icon, 
  isActive, 
  isExpanded, 
  onClick, 
}: SidebarItemProps) => {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative w-full flex items-center gap-4 px-4 py-3 rounded-xl',
        'transition-all duration-200 outline-none',
        isActive && 'text-white',
        !isActive && 'text-white/60 hover:text-white hover:bg-white/[0.03]',
      )}
      style={{
        background: isActive ? C26_COLORS.cyanMuted : 'transparent',
      }}
      whileHover={prefersReducedMotion ? {} : { x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
          style={{ background: C26_COLORS.cyan }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 w-6 h-6',
        isActive && 'text-cyan-400',
      )}>
        <Icon className="w-full h-full" />
      </div>
      
      {/* Label */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="text-sm font-medium whitespace-nowrap overflow-hidden"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
})
SidebarItem.displayName = 'SidebarItem'

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════

interface UltraSidebarProps {
  onNavigate?: (panel: string) => void
}

function UltraSidebar({ onNavigate }: UltraSidebarProps) {
  const { isExpanded, setIsExpanded, activeItem, setActiveItem } = useSidebar()
  const prefersReducedMotion = useReducedMotion()
  
  const handleItemClick = (id: string) => {
    setActiveItem(id)
    onNavigate?.(id)
  }
  
  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 280 : 72 }}
      transition={{
        duration: 0.3,
        ease: C26_ANIMATIONS.ease.spring,
      }}
      className="fixed top-0 left-0 h-screen z-50 overflow-hidden"
      style={{
        background: C26_COLORS.voidSoft,
        backdropFilter: 'blur(80px) saturate(200%)',
        WebkitBackdropFilter: 'blur(80px) saturate(200%)',
        borderRight: `1px solid ${C26_COLORS.glassBorder}`,
      }}
    >
      {/* Logo area */}
      <div className="p-4 mb-4 flex items-center gap-3">
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: C26_GRADIENTS.primary,
            boxShadow: `0 0 20px ${C26_COLORS.cyanGlow}`,
          }}
          animate={prefersReducedMotion ? {} : {
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className="w-5 h-5 text-black" />
        </motion.div>
        
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="overflow-hidden"
            >
              <h1 
                className="text-lg font-bold tracking-tight"
                style={{
                  background: C26_GRADIENTS.primary,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                CHRONOS
              </h1>
              <p 
                className="text-xs"
                style={{ color: C26_COLORS.textMuted }}
              >
                2026 Ultra
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Navigation */}
      <nav className="px-2 space-y-1">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.id}
            {...item}
            isActive={activeItem === item.id}
            isExpanded={isExpanded}
            onClick={() => handleItemClick(item.id)}
          />
        ))}
      </nav>
      
      {/* Settings at bottom */}
      <div className="absolute bottom-4 left-0 right-0 px-2">
        <div 
          className="mb-4 mx-2 h-px"
          style={{ background: C26_COLORS.glassBorder }}
        />
        
        <SidebarItem
          id="settings"
          label="Configuración"
          icon={Settings}
          isActive={activeItem === 'settings'}
          isExpanded={isExpanded}
          onClick={() => handleItemClick('settings')}
        />
        
        {/* Toggle button */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 mt-4 py-2 rounded-lg"
          style={{
            background: C26_COLORS.glassBg,
            border: `1px solid ${C26_COLORS.glassBorder}`,
            color: C26_COLORS.textSecondary,
          }}
          whileHover={{ background: C26_COLORS.glassBgHover }}
          whileTap={{ scale: 0.98 }}
        >
          {isExpanded ? (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Colapsar</span>
            </>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </motion.button>
      </div>
    </motion.aside>
  )
}

export default memo(UltraSidebar)
