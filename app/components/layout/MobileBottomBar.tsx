'use client'

/**
 * 📱 MOBILE BOTTOM BAR - Estilo Tesla App 2025
 * 
 * Navegación móvil ultra-premium:
 * - Bottom bar fija con SafeArea
 * - 5 ítems máximo
 * - Iconos + label pequeño
 * - Gesture swipe up para drawer completo
 * - Animaciones spring physics
 */

import { memo, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion'
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Wallet,
  User,
  ChevronUp,
  X,
  Building2,
  Users,
  Package,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface BottomBarItem {
  id: string
  label: string
  icon: LucideIcon
}

interface MobileBottomBarProps {
  currentPanel: string
  onPanelChange: (panel: string) => void
  className?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// ITEMS DE NAVEGACIÓN
// ═══════════════════════════════════════════════════════════════════════════

const MAIN_ITEMS: BottomBarItem[] = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'ventas', label: 'Ventas', icon: TrendingUp },
  { id: 'ordenes', label: 'Órdenes', icon: ShoppingCart },
  { id: 'bancos', label: 'Bancos', icon: Wallet },
  { id: 'more', label: 'Más', icon: ChevronUp },
]

const EXPANDED_ITEMS: BottomBarItem[] = [
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'distribuidores', label: 'Distribuidores', icon: Building2 },
  { id: 'almacen', label: 'Almacén', icon: Package },
  { id: 'reportes', label: 'Reportes', icon: BarChart3 },
  { id: 'configuracion', label: 'Config', icon: Settings },
]

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export const MobileBottomBar = memo(function MobileBottomBar({
  currentPanel,
  onPanelChange,
  className,
}: MobileBottomBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const dragControls = useDragControls()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleItemClick = useCallback((id: string) => {
    if (id === 'more') {
      setIsExpanded(true)
    } else {
      onPanelChange(id)
      setIsExpanded(false)
    }
  }, [onPanelChange])

  const handleDragEnd = useCallback((_: never, info: PanInfo) => {
    // Swipe up abre el drawer
    if (info.velocity.y < -200 || info.offset.y < -100) {
      setIsExpanded(true)
    }
    // Swipe down cierra el drawer
    if (info.velocity.y > 200 || info.offset.y > 100) {
      setIsExpanded(false)
    }
  }, [])

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          DRAWER EXPANDIDO
          ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsExpanded(false)}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 30,
              }}
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className={cn(
                'fixed left-0 right-0 bottom-0 z-50 md:hidden',
                'bg-black border-t border-white/10',
                'rounded-t-[24px]',
                'pb-[env(safe-area-inset-bottom)]',
              )}
            >
              {/* Handle para drag */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
                <span className="text-lg font-semibold text-white">Más opciones</span>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsExpanded(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10"
                >
                  <X className="w-4 h-4 text-white/60" />
                </motion.button>
              </div>

              {/* Grid de opciones */}
              <div className="grid grid-cols-3 gap-4 p-6">
                {EXPANDED_ITEMS.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleItemClick(item.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-2xl',
                      'bg-white/5 border border-white/10',
                      'transition-all duration-200',
                      currentPanel === item.id && 'bg-[#E31911]/20 border-[#E31911]/50',
                    )}
                  >
                    <item.icon 
                      className={cn(
                        'w-6 h-6',
                        currentPanel === item.id ? 'text-[#E31911]' : 'text-white/60',
                      )}
                      strokeWidth={1.5}
                    />
                    <span className={cn(
                      'text-xs font-medium',
                      currentPanel === item.id ? 'text-white' : 'text-white/60',
                    )}>
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          BOTTOM BAR PRINCIPAL
          ══════════════════════════════════════════════════════════════════ */}
      <motion.nav
        ref={containerRef}
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className={cn(
          'fixed left-0 right-0 bottom-0 z-40 md:hidden',
          'bg-black/95 backdrop-blur-xl',
          'border-t border-white/[0.08]',
          'pb-[env(safe-area-inset-bottom)]',
          className,
        )}
      >
        {/* Handle sutil para indicar swipe */}
        <motion.div 
          className="flex justify-center pt-2"
          animate={{ 
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </motion.div>

        {/* Items */}
        <div className="flex items-center justify-around h-16 px-2">
          {MAIN_ITEMS.map((item) => {
            const isActive = item.id !== 'more' && currentPanel === item.id
            const isMoreButton = item.id === 'more'

            return (
              <motion.button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  'flex flex-col items-center justify-center gap-1',
                  'w-16 h-14 rounded-xl',
                  'transition-all duration-200',
                  isActive && 'bg-[#E31911]/10',
                )}
              >
                <motion.div
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <item.icon 
                    className={cn(
                      'w-6 h-6',
                      isActive ? 'text-[#E31911]' : 'text-white/50',
                      isMoreButton && isExpanded && 'rotate-180',
                    )}
                    strokeWidth={1.5}
                  />
                </motion.div>
                <span className={cn(
                  'text-[10px] font-medium',
                  isActive ? 'text-white' : 'text-white/50',
                )}>
                  {item.label}
                </span>
                
                {/* Indicador activo */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#E31911]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.nav>
    </>
  )
})

export default MobileBottomBar
