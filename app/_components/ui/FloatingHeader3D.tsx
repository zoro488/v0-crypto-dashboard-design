'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — FLOATING HEADER 3D
// Header flotante con glassmorphism y dropdown 3D
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, ComponentType } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useMagneticCursor } from './CursorEffects'
import { CommandMenu } from './CommandMenu'
import dynamic from 'next/dynamic'

// Lazy load del orb 3D con tipos
interface FloatingOrbProps {
  size?: number
  color?: string
}

const FloatingOrb = dynamic<FloatingOrbProps>(
  () => import('./FloatingOrb'),
  { ssr: false }
)

interface HeaderProps {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

interface DropdownItem {
  icon: string
  label: string
  onClick: () => void
  danger?: boolean
}

function UserDropdown({ user, onClose }: {
  user: HeaderProps['user']
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  
  const items: DropdownItem[] = [
    {
      icon: '👤',
      label: 'Perfil',
      onClick: () => console.log('Perfil'),
    },
    {
      icon: '⚙️',
      label: 'Configuración',
      onClick: () => console.log('Configuración'),
    },
    {
      icon: '🎨',
      label: 'Tema',
      onClick: () => console.log('Tema'),
    },
    {
      icon: '🚪',
      label: 'Cerrar sesión',
      onClick: () => console.log('Logout'),
      danger: true,
    },
  ]
  
  // Cerrar al click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 800,
        damping: 35,
      }}
      className="absolute top-full right-0 mt-4 w-72 origin-top-right"
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {/* Glass panel con 3D depth */}
      <div 
        className="glass-panel rounded-2xl overflow-hidden border border-violet-500/20 shadow-2xl"
        style={{
          transform: 'translateZ(50px)',
        }}
      >
        {/* Header del dropdown */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            {/* Avatar con glow */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-gold-500 flex items-center justify-center text-xl font-bold">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="absolute inset-0 rounded-full bg-violet-500/30 blur-xl" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email || 'email@example.com'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Items */}
        <div className="p-2">
          {items.map((item, index) => (
            <motion.button
              key={index}
              onClick={item.onClick}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full flex items-center gap-4 px-4 py-3 rounded-xl
                transition-colors duration-200
                ${item.danger 
                  ? 'hover:bg-red-500/10 text-red-400' 
                  : 'hover:bg-white/5 text-gray-300'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center text-xs font-bold shadow-lg"
    >
      {count > 9 ? '9+' : count}
    </motion.div>
  )
}

export function FloatingHeader3D({ user }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(3)
  
  const headerRef = useRef<HTMLDivElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)
  
  // Magnetic effect para botones
  const magneticUser = useMagneticCursor(userButtonRef, 0.2)
  
  // Scroll behavior: esconder/mostrar
  const { scrollY } = useScroll()
  const headerY = useTransform(scrollY, [0, 100, 200], [0, -100, 0])
  const headerOpacity = useTransform(scrollY, [0, 50, 100], [1, 0.5, 1])
  const headerBlur = useTransform(scrollY, [0, 100], [20, 60])
  
  // Command menu con Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandMenuOpen(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <motion.header
        ref={headerRef}
        style={{
          y: headerY,
          opacity: headerOpacity,
        }}
        className="fixed top-0 left-0 right-0 z-50 px-8 py-4"
      >
        <motion.div
          style={{
            backdropFilter: useTransform(headerBlur, v => `blur(${v}px)`),
          }}
          className="glass-panel rounded-2xl border border-violet-500/20 shadow-2xl px-6 py-4"
        >
          <div className="flex items-center justify-between">
            {/* Logo con orb 3D */}
            <motion.div 
              className="flex items-center gap-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-10 h-10">
                <FloatingOrb size={40} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 via-gold-400 to-pink-400 bg-clip-text text-transparent">
                  CHRONOS
                </h1>
                <p className="text-xs text-gray-400">INFINITY 2026</p>
              </div>
            </motion.div>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Command Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCommandMenuOpen(true)}
                className="glass-button px-4 py-2 rounded-xl flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <span>⌘</span>
                <span>K</span>
              </motion.button>
              
              {/* Notifications */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative glass-button p-3 rounded-xl text-gray-300 hover:text-white transition-colors"
              >
                <span className="text-xl">🔔</span>
                <NotificationBadge count={notifications} />
              </motion.button>
              
              {/* Voice AI */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-button p-3 rounded-xl text-gray-300 hover:text-white transition-colors"
              >
                <span className="text-xl">🎤</span>
              </motion.button>
              
              {/* User Menu */}
              <div className="relative">
                <motion.button
                  ref={userButtonRef}
                  style={{
                    x: magneticUser.x,
                    y: magneticUser.y,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="glass-button p-2 rounded-xl flex items-center gap-3"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-gold-500 flex items-center justify-center text-sm font-bold">
                      {user?.name?.[0] || 'U'}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-violet-500/30 blur-lg" />
                  </div>
                  
                  <motion.div
                    animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                    className="text-gray-400"
                  >
                    ▼
                  </motion.div>
                </motion.button>
                
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <UserDropdown
                      user={user}
                      onClose={() => setIsUserMenuOpen(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.header>
      
      {/* Command Menu Portal */}
      <AnimatePresence>
        {isCommandMenuOpen && (
          <CommandMenu onClose={() => setIsCommandMenuOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
