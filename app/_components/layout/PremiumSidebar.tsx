'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — PREMIUM SIDEBAR
// Sidebar magnético con glassmorphism y efectos 3D
// ═══════════════════════════════════════════════════════════════

import { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { 
  Home, 
  ShoppingCart, 
  Users, 
  Truck, 
  Package, 
  FileText,
  Building2,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  Command,
  Wallet,
  PlusCircle,
} from 'lucide-react'
import { cn } from '@/app/_lib/utils'

interface PremiumSidebarProps {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  onCommandOpen?: () => void
}

interface NavItem {
  href: string
  label: string
  icon: typeof Home
  badge?: number
  gradient?: string
}

interface NavSection {
  section: string
  items: NavItem[]
}

const NAVIGATION: NavSection[] = [
  { 
    section: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: Home, gradient: 'from-violet-500 to-purple-600' },
      { href: '/ventas', label: 'Ventas', icon: ShoppingCart, badge: 5, gradient: 'from-emerald-500 to-teal-600' },
      { href: '/clientes', label: 'Clientes', icon: Users, gradient: 'from-blue-500 to-cyan-600' },
    ]
  },
  {
    section: 'Operaciones',
    items: [
      { href: '/distribuidores', label: 'Distribuidores', icon: Truck, gradient: 'from-orange-500 to-amber-600' },
      { href: '/ordenes', label: 'Órdenes', icon: FileText, gradient: 'from-pink-500 to-rose-600' },
      { href: '/movimientos', label: 'Movimientos', icon: Package, gradient: 'from-indigo-500 to-blue-600' },
    ]
  },
  {
    section: 'Finanzas',
    items: [
      { href: '/bancos', label: 'Bancos', icon: Building2, gradient: 'from-yellow-500 to-amber-600' },
      { href: '/reportes', label: 'Reportes', icon: BarChart3, gradient: 'from-cyan-500 to-blue-600' },
    ]
  },
  {
    section: 'Sistema',
    items: [
      { href: '/ia', label: 'Asistente IA', icon: Sparkles, gradient: 'from-fuchsia-500 to-pink-600' },
      { href: '/configuracion', label: 'Configuración', icon: Settings, gradient: 'from-gray-500 to-zinc-600' },
    ]
  },
]

// Magnetic effect hook
function useMagnetic(ref: React.RefObject<HTMLElement | null>, strength = 0.3) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const deltaX = (e.clientX - centerX) * strength
    const deltaY = (e.clientY - centerY) * strength
    
    setPosition({ x: deltaX, y: deltaY })
  }, [ref, strength])
  
  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 })
  }, [])
  
  return { position, handleMouseMove, handleMouseLeave }
}

// Nav Item Component
function NavItemComponent({ 
  item, 
  isActive, 
  collapsed,
  index,
}: { 
  item: NavItem
  isActive: boolean
  collapsed: boolean
  index: number
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const { position, handleMouseMove, handleMouseLeave } = useMagnetic(ref, 0.15)
  
  const x = useSpring(position.x, { stiffness: 800, damping: 35 })
  const y = useSpring(position.y, { stiffness: 800, damping: 35 })
  
  return (
    <Link
      ref={ref}
      href={item.href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{ x, y }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl",
          "transition-all duration-200",
          isActive 
            ? "bg-gradient-to-r from-violet-500/20 to-purple-500/10 border border-violet-500/30" 
            : "hover:bg-white/5 border border-transparent",
          collapsed && "justify-center px-2"
        )}
      >
        {/* Icon with gradient background on active */}
        <div className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-all duration-300",
          isActive 
            ? `bg-gradient-to-br ${item.gradient} shadow-lg` 
            : "bg-white/5 group-hover:bg-white/10"
        )}>
          <item.icon className={cn(
            "h-5 w-5 transition-colors",
            isActive ? "text-white" : "text-gray-400 group-hover:text-white"
          )} />
          
          {/* Glow effect */}
          {isActive && (
            <motion.div
              layoutId="nav-glow"
              className={`absolute inset-0 rounded-lg bg-gradient-to-br ${item.gradient} blur-xl opacity-50`}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </div>
        
        {/* Label */}
        <AnimatePresence>
          {!collapsed && (
            <motion.span 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "text-sm font-medium whitespace-nowrap overflow-hidden",
                isActive ? "text-white" : "text-gray-400 group-hover:text-white"
              )}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        
        {/* Badge */}
        {item.badge && !collapsed && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white"
          >
            {item.badge}
          </motion.span>
        )}
        
        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="active-indicator"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-violet-500 to-purple-500 rounded-l-full"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </motion.div>
    </Link>
  )
}

export function PremiumSidebar({ expanded, onExpandedChange, onCommandOpen }: PremiumSidebarProps) {
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLElement>(null)
  
  // Auto-expand on hover
  const handleMouseEnter = () => onExpandedChange(true)
  const handleMouseLeave = () => onExpandedChange(false)

  return (
    <motion.aside 
      ref={sidebarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={false}
      animate={{ width: expanded ? 256 : 72 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className={cn(
        "fixed left-0 top-0 h-screen flex flex-col z-40",
        "bg-black/80 backdrop-blur-2xl",
        "border-r border-white/5",
      )}
      style={{
        boxShadow: expanded ? '20px 0 40px rgba(139, 0, 255, 0.1)' : 'none',
      }}
    >
      {/* Logo Header */}
      <div className={cn(
        "h-20 flex items-center border-b border-white/5",
        expanded ? "px-5 justify-between" : "px-3 justify-center"
      )}>
        <Link href="/dashboard" className="flex items-center gap-3">
          {/* Animated Logo Orb */}
          <motion.div 
            className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 flex items-center justify-center"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-white font-black text-lg">C</span>
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 blur-xl opacity-50"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.7, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
          
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-lg font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                  CHRONOS
                </h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                  Infinity 2026
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
        
        {/* Collapse toggle */}
        <AnimatePresence>
          {expanded && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onExpandedChange(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Actions */}
      <div className={cn("p-3", expanded ? "px-4" : "")}>
        {/* Command Menu Trigger */}
        <motion.button
          onClick={onCommandOpen}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl",
            "bg-white/5 hover:bg-white/10",
            "border border-white/10 hover:border-violet-500/30",
            "text-gray-400 hover:text-white",
            "transition-all duration-200",
            expanded ? "" : "justify-center"
          )}
        >
          <Command className="h-4 w-4 shrink-0" />
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-between"
              >
                <span className="text-sm">Buscar...</span>
                <kbd className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded border border-white/10">⌘K</kbd>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Quick Action Button */}
        <AnimatePresence>
          {expanded && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl",
                "bg-gradient-to-r from-violet-600 to-purple-600",
                "hover:from-violet-500 hover:to-purple-500",
                "text-white font-medium text-sm",
                "shadow-lg shadow-violet-500/25",
                "transition-all duration-200"
              )}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Nueva Venta</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {NAVIGATION.map((section, sectionIndex) => (
          <div key={section.section} className="mb-4">
            {/* Section Header */}
            <AnimatePresence>
              {expanded && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest"
                >
                  {section.section}
                </motion.p>
              )}
            </AnimatePresence>
            
            {/* Items */}
            <div className={cn("space-y-1", expanded ? "px-3" : "px-2")}>
              {section.items.map((item, index) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <NavItemComponent
                    key={item.href}
                    item={item}
                    isActive={isActive}
                    collapsed={!expanded}
                    index={sectionIndex * 3 + index}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className={cn(
        "p-3 border-t border-white/5",
        expanded ? "px-4" : ""
      )}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={cn(
            "flex items-center gap-3 p-2 rounded-xl cursor-pointer",
            "hover:bg-white/5 transition-colors",
            !expanded && "justify-center"
          )}
        >
          {/* User Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black" />
          </div>
          
          <AnimatePresence>
            {expanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-white truncate">Admin</p>
                <p className="text-xs text-gray-500 truncate">admin@chronos.mx</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.aside>
  )
}

export default PremiumSidebar
