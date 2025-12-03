'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { 
  Home, 
  DollarSign, 
  Building2, 
  Menu,
  X,
  Plus,
  BarChart3,
  Package,
  Users,
  Settings,
  FileText,
  Warehouse,
  CreditCard,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import '@/app/styles/chronos-obsidian-os.css'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THE FLOATING ISLAND - Mobile Navigation Dock
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Navegación móvil premium estilo iOS:
 * - Isla flotante con border-radius
 * - Backdrop blur y sombra profunda
 * - Botón central de acción destacado
 * - Animaciones de rebote (spring)
 * - Indicador de página activa luminoso
 */

interface NavItem {
  id: string
  icon: typeof Home
  label: string
  href?: string
  isAction?: boolean
}

interface MobileNavBarProps {
  onActionClick?: () => void
  className?: string
}

// Sheet de menú expandido
function MenuSheet({ 
  isOpen, 
  onClose,
  onNavigate,
}: { 
  isOpen: boolean
  onClose: () => void
  onNavigate: (href: string) => void
}) {
  const menuItems = [
    { icon: BarChart3, label: 'Ventas', href: '/ventas' },
    { icon: Package, label: 'Productos', href: '/productos' },
    { icon: Warehouse, label: 'Almacén', href: '/almacen' },
    { icon: Users, label: 'Clientes', href: '/clientes' },
    { icon: FileText, label: 'Órdenes', href: '/ordenes' },
    { icon: CreditCard, label: 'Gastos', href: '/gastos' },
    { icon: Settings, label: 'Configuración', href: '/settings' },
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
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6 pb-32"
            style={{
              background: 'rgba(10, 10, 15, 0.98)',
              backdropFilter: 'blur(40px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center mb-6">
              <div 
                className="w-10 h-1 rounded-full"
                style={{ background: 'rgba(255, 255, 255, 0.2)' }}
              />
            </div>
            
            {/* Title */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Menú</h3>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-xl"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 text-white/60" />
              </motion.button>
            </div>
            
            {/* Menu Grid */}
            <div className="grid grid-cols-3 gap-4">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.href}
                  onClick={() => {
                    onNavigate(item.href)
                    onClose()
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl"
                  style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div 
                    className="p-3 rounded-xl"
                    style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <item.icon className="w-6 h-6 text-white/70" />
                  </div>
                  <span className="text-sm text-white/70">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Nav Item individual
function NavButton({ 
  item, 
  isActive, 
  onClick,
}: { 
  item: NavItem
  isActive: boolean
  onClick: () => void
}) {
  const scale = useMotionValue(1)
  const springScale = useSpring(scale, { stiffness: 400, damping: 17 })
  
  // Para el botón central de acción
  if (item.isAction) {
    return (
      <motion.button
        onClick={onClick}
        className="relative -mt-6 flex items-center justify-center"
        style={{ scale: springScale }}
        onTapStart={() => scale.set(0.9)}
        onTap={() => scale.set(1)}
        onTapCancel={() => scale.set(1)}
      >
        {/* Glow background */}
        <motion.div
          className="absolute inset-0 rounded-full blur-lg"
          style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            transform: 'scale(0.8)',
          }}
          animate={{
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Button */}
        <motion.div
          className="relative w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
          }}
          whileHover={{ scale: 1.1 }}
        >
          <Plus className="w-7 h-7 text-white" />
        </motion.div>
      </motion.button>
    )
  }
  
  return (
    <motion.button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center flex-1 py-2"
      style={{ scale: springScale }}
      onTapStart={() => scale.set(0.85)}
      onTap={() => scale.set(1)}
      onTapCancel={() => scale.set(1)}
    >
      {/* Icon */}
      <motion.div
        animate={{
          color: isActive ? '#06b6d4' : 'rgba(255, 255, 255, 0.4)',
        }}
      >
        <item.icon className="w-6 h-6" />
      </motion.div>
      
      {/* Label */}
      <motion.span
        className="text-[10px] mt-1 font-medium"
        animate={{
          color: isActive ? '#06b6d4' : 'rgba(255, 255, 255, 0.4)',
        }}
      >
        {item.label}
      </motion.span>
      
      {/* Active indicator - punto de luz */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -bottom-1 w-1.5 h-1.5 rounded-full"
            style={{
              background: '#06b6d4',
              boxShadow: '0 0 8px #06b6d4, 0 0 16px rgba(6, 182, 212, 0.5)',
            }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export function MobileNavBar({ onActionClick, className = '' }: MobileNavBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const navItems: NavItem[] = [
    { id: 'home', icon: Home, label: 'Inicio', href: '/' },
    { id: 'action', icon: Plus, label: 'Acción', isAction: true },
    { id: 'banks', icon: Building2, label: 'Bancos', href: '/bancos' },
    { id: 'menu', icon: Menu, label: 'Menú' },
  ]
  
  const handleNavClick = useCallback((item: NavItem) => {
    if (item.isAction) {
      onActionClick?.()
    } else if (item.id === 'menu') {
      setIsMenuOpen(true)
    } else if (item.href) {
      router.push(item.href)
    }
  }, [router, onActionClick])
  
  const isActive = (item: NavItem) => {
    if (item.href) {
      return pathname === item.href
    }
    return false
  }
  
  return (
    <>
      <MenuSheet 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onNavigate={(href) => router.push(href)}
      />
      
      {/* Floating Island */}
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md md:hidden ${className}`}
      >
        <div
          className="relative flex items-center justify-around px-4 py-2 rounded-3xl"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: `
              0 25px 50px -12px rgba(0, 0, 0, 0.6),
              0 0 0 1px rgba(255, 255, 255, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.05)
            `,
          }}
        >
          {/* Noise texture overlay */}
          <div 
            className="absolute inset-0 rounded-3xl opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
              mixBlendMode: 'overlay',
            }}
          />
          
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={isActive(item)}
              onClick={() => handleNavClick(item)}
            />
          ))}
        </div>
      </motion.nav>
    </>
  )
}

export default MobileNavBar
