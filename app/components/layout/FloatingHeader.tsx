'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🎯 CHRONOS INFINITY - HEADER FLOTANTE PREMIUM
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Header glassmorphism flotante con:
 * - Blur dinámico que responde al scroll
 * - Mini orb 3D animado
 * - Navegación con efectos magnéticos
 * - Command Menu (Cmd+K)
 * - Dropdown 3D animado
 * 
 * Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, memo, Suspense } from 'react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Canvas } from '@react-three/fiber'
import {
  Command,
  Search,
  Bell,
  Settings,
  User,
  ChevronDown,
  LayoutDashboard,
  ShoppingCart,
  Users,
  Truck,
  Package,
  Wallet,
  FileText,
  Receipt,
  Sparkles,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'
import InfinityOrb from '@/app/components/3d/InfinityOrb'
import { springHover, butter, DURATIONS } from '@/app/lib/motion/easings'
import { INFINITY_COLORS, INFINITY_GRADIENTS } from '@/app/lib/constants/infinity-design-system'

// ════════════════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════════════════

interface NavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
}

interface DropdownItem {
  label: string
  href?: string
  icon: typeof User
  onClick?: () => void
  danger?: boolean
}

// ════════════════════════════════════════════════════════════════════════════════════════
// NAVEGACIÓN
// ════════════════════════════════════════════════════════════════════════════════════════

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Ventas', href: '/dashboard/ventas', icon: ShoppingCart },
  { label: 'Clientes', href: '/dashboard/clientes', icon: Users },
  { label: 'Bancos', href: '/dashboard/bancos', icon: Wallet },
  { label: 'Reportes', href: '/dashboard/reportes', icon: FileText },
]

const USER_MENU_ITEMS: DropdownItem[] = [
  { label: 'Mi Perfil', href: '/dashboard/profile', icon: User },
  { label: 'Configuración', href: '/dashboard/settings', icon: Settings },
  { label: 'Cerrar Sesión', icon: LogOut, onClick: () => {}, danger: true },
]

// ════════════════════════════════════════════════════════════════════════════════════════
// MINI ORB
// ════════════════════════════════════════════════════════════════════════════════════════

const MiniOrb = memo(function MiniOrb() {
  return (
    <div className="w-10 h-10 rounded-full overflow-hidden">
      <Canvas camera={{ position: [0, 0, 3] }} gl={{ alpha: true, antialias: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[2, 2, 2]} intensity={0.5} color="#8B00FF" />
          <InfinityOrb state="idle" scale={0.25} />
        </Suspense>
      </Canvas>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// NAV LINK MAGNÉTICO
// ════════════════════════════════════════════════════════════════════════════════════════

const MagneticNavLink = memo(function MagneticNavLink({ 
  item, 
  isActive 
}: { 
  item: NavItem
  isActive: boolean 
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springX = useSpring(x, { stiffness: 300, damping: 30 })
  const springY = useSpring(y, { stiffness: 300, damping: 30 })
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    x.set((e.clientX - centerX) * 0.15)
    y.set((e.clientY - centerY) * 0.15)
  }, [x, y])
  
  const handleMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])
  
  const Icon = item.icon
  
  return (
    <motion.div style={{ x: springX, y: springY }}>
      <Link
        href={item.href}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`
          relative flex items-center gap-2 px-4 py-2 rounded-xl
          text-sm font-medium transition-colors duration-300
          ${isActive 
            ? 'text-white' 
            : 'text-white/60 hover:text-white/90'
          }
        `}
      >
        {/* Background activo */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-xl -z-10"
            layoutId="activeNav"
            style={{
              background: INFINITY_GRADIENTS.primary,
              boxShadow: `0 4px 20px ${INFINITY_COLORS.violetGlow}`,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        
        <Icon className="w-4 h-4" />
        <span className="hidden lg:inline">{item.label}</span>
      </Link>
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// DROPDOWN MENU 3D
// ════════════════════════════════════════════════════════════════════════════════════════

const DropdownMenu = memo(function DropdownMenu({
  items,
  isOpen,
  onClose,
}: {
  items: DropdownItem[]
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Menu */}
          <motion.div
            className="absolute top-full right-0 mt-2 w-56 rounded-2xl overflow-hidden z-50"
            style={{
              background: INFINITY_COLORS.glassBg,
              backdropFilter: 'blur(24px) saturate(180%)',
              border: `1px solid ${INFINITY_COLORS.glassBorder}`,
              boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 30px ${INFINITY_COLORS.violetGlow}`,
            }}
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="p-2">
              {items.map((item, index) => {
                const Icon = item.icon
                
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => {
                          item.onClick?.()
                          onClose()
                        }}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 rounded-xl
                          text-sm font-medium transition-all duration-200
                          ${item.danger 
                            ? 'text-red-400 hover:bg-red-500/10' 
                            : 'text-white/80 hover:text-white hover:bg-white/5'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          item.onClick?.()
                          onClose()
                        }}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 rounded-xl
                          text-sm font-medium transition-all duration-200
                          ${item.danger 
                            ? 'text-red-400 hover:bg-red-500/10' 
                            : 'text-white/80 hover:text-white hover:bg-white/5'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// COMMAND BUTTON
// ════════════════════════════════════════════════════════════════════════════════════════

const CommandButton = memo(function CommandButton({ 
  onClick 
}: { 
  onClick: () => void 
}) {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
      style={{
        background: INFINITY_COLORS.glassBgHover,
        border: `1px solid ${INFINITY_COLORS.glassBorder}`,
      }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: `0 0 20px ${INFINITY_COLORS.violetGlow}`,
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Search className="w-4 h-4 text-white/60" />
      <span className="text-white/60 hidden md:inline">Buscar...</span>
      <kbd className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-xs text-white/50">
        <Command className="w-3 h-3" />
        K
      </kbd>
    </motion.button>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════════════

interface FloatingHeaderProps {
  onOpenCommandMenu?: () => void
}

function FloatingHeader({ onOpenCommandMenu }: FloatingHeaderProps) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenCommandMenu?.()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpenCommandMenu])
  
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
    >
      <motion.div
        className="max-w-7xl mx-auto rounded-2xl px-4 py-2 flex items-center justify-between"
        style={{
          background: scrolled 
            ? INFINITY_COLORS.glassBg 
            : 'rgba(0,0,0,0.3)',
          backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'blur(12px)',
          border: `1px solid ${scrolled ? INFINITY_COLORS.glassBorder : 'transparent'}`,
          boxShadow: scrolled 
            ? `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${INFINITY_COLORS.violetGlow}` 
            : 'none',
        }}
        animate={{
          y: scrolled ? 0 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo + Orb */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <MiniOrb />
          <div className="hidden sm:block">
            <h1 
              className="text-lg font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: INFINITY_GRADIENTS.textShine }}
            >
              CHRONOS
            </h1>
            <p className="text-[10px] text-white/40 -mt-1">INFINITY 2026</p>
          </div>
        </Link>
        
        {/* Navegación Central */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <MagneticNavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname?.startsWith(item.href + '/')}
            />
          ))}
        </nav>
        
        {/* Acciones */}
        <div className="flex items-center gap-3">
          <CommandButton onClick={() => onOpenCommandMenu?.()} />
          
          {/* Notificaciones */}
          <motion.button
            className="relative p-2 rounded-xl"
            style={{ background: INFINITY_COLORS.glassBgHover }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-5 h-5 text-white/60" />
            <span 
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: INFINITY_COLORS.pink }}
            >
              3
            </span>
          </motion.button>
          
          {/* User Menu */}
          <div className="relative">
            <motion.button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-xl"
              style={{ background: INFINITY_COLORS.glassBgHover }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: INFINITY_GRADIENTS.primary }}
              >
                <User className="w-4 h-4 text-white" />
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-white/60 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} 
              />
            </motion.button>
            
            <DropdownMenu
              items={USER_MENU_ITEMS}
              isOpen={userMenuOpen}
              onClose={() => setUserMenuOpen(false)}
            />
          </div>
        </div>
      </motion.div>
    </motion.header>
  )
}

export default memo(FloatingHeader)
