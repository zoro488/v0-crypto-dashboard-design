'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — HEADER FLOTANTE 3D PREMIUM
// Header con glassmorphism que flota y reacciona al scroll
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Search,
  Mic,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Command,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/app/_lib/utils'

interface HeaderProps {
  onCommandOpen?: () => void
}

export function Header({ onCommandOpen }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const lastScrollY = useRef(0)
  const pathname = usePathname()
  
  const { scrollY } = useScroll()
  const headerY = useTransform(scrollY, [0, 100], [0, -10])
  const headerOpacity = useTransform(scrollY, [0, 50], [1, 0.95])
  
  // Detectar dirección del scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      setIsScrolled(currentScrollY > 20)
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsHidden(true)
      } else {
        setIsHidden(false)
      }
      
      lastScrollY.current = currentScrollY
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Keyboard shortcut para Command Menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onCommandOpen?.()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCommandOpen])

  const getPageTitle = () => {
    const routes: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/ventas': 'Ventas',
      '/clientes': 'Clientes',
      '/distribuidores': 'Distribuidores',
      '/ordenes': 'Órdenes de Compra',
      '/bancos': 'Bancos',
      '/reportes': 'Reportes',
      '/ia': 'Asistente IA',
      '/configuracion': 'Configuración',
    }
    return routes[pathname] || 'CHRONOS'
  }

  return (
    <motion.header
      style={{ y: headerY, opacity: headerOpacity }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "transition-all duration-500 ease-out",
        isHidden && "-translate-y-full"
      )}
    >
      <div 
        className={cn(
          "mx-4 mt-4 rounded-2xl",
          "transition-all duration-500",
          // Glassmorphism premium
          "bg-black/40 backdrop-blur-[60px]",
          "border border-white/10",
          isScrolled && [
            "bg-black/60",
            "shadow-[0_8px_32px_rgba(139,0,255,0.15)]",
            "border-violet-500/20"
          ]
        )}
      >
        <div className="flex items-center justify-between h-16 px-6">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-500",
                  "shadow-lg shadow-violet-500/30",
                  "group-hover:shadow-violet-500/50 transition-shadow"
                )}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-white via-violet-200 to-amber-200 bg-clip-text text-transparent">
                  CHRONOS
                </h1>
                <p className="text-xs text-white/50">Infinity 2026</p>
              </div>
            </Link>
            
            <div className="hidden lg:block h-6 w-px bg-white/10" />
            
            <span className="hidden lg:block text-white/70 font-medium">
              {getPageTitle()}
            </span>
          </div>
          
          {/* Center: Search/Command */}
          <motion.button
            onClick={onCommandOpen}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "hidden md:flex items-center gap-3 px-4 py-2 rounded-xl",
              "bg-white/5 border border-white/10",
              "hover:bg-white/10 hover:border-violet-500/30",
              "transition-all duration-300",
              "min-w-[280px] justify-between"
            )}
          >
            <div className="flex items-center gap-2 text-white/50">
              <Search className="w-4 h-4" />
              <span className="text-sm">Buscar o ejecutar comando...</span>
            </div>
            <kbd className="hidden lg:flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-xs text-white/50">
              <Command className="w-3 h-3" />K
            </kbd>
          </motion.button>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Voice */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "p-2.5 rounded-xl",
                "text-white/60 hover:text-white",
                "hover:bg-white/10",
                "transition-colors"
              )}
            >
              <Mic className="w-5 h-5" />
            </motion.button>
            
            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "relative p-2.5 rounded-xl",
                "text-white/60 hover:text-white",
                "hover:bg-white/10",
                "transition-colors"
              )}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
            </motion.button>
            
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsDark(!isDark)}
              className={cn(
                "p-2.5 rounded-xl",
                "text-white/60 hover:text-white",
                "hover:bg-white/10",
                "transition-colors"
              )}
            >
              {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </motion.button>
            
            <div className="h-6 w-px bg-white/10 mx-1" />
            
            {/* User Menu */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={cn(
                  "flex items-center gap-2 p-1.5 pr-3 rounded-xl",
                  "bg-white/5 hover:bg-white/10",
                  "border border-white/10 hover:border-violet-500/30",
                  "transition-all duration-300"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  "bg-gradient-to-br from-violet-500 to-fuchsia-500"
                )}>
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden lg:block text-sm text-white/80">Admin</span>
                <ChevronDown className={cn(
                  "w-4 h-4 text-white/50 transition-transform",
                  userMenuOpen && "rotate-180"
                )} />
              </motion.button>
              
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "absolute right-0 top-full mt-2",
                      "w-56 p-2 rounded-xl",
                      "bg-black/80 backdrop-blur-[60px]",
                      "border border-white/10",
                      "shadow-xl shadow-black/50"
                    )}
                  >
                    <div className="px-3 py-2 border-b border-white/10 mb-2">
                      <p className="text-sm font-medium text-white">Admin User</p>
                      <p className="text-xs text-white/50">admin@chronos.app</p>
                    </div>
                    
                    <button className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                      "text-white/70 hover:text-white hover:bg-white/10",
                      "transition-colors"
                    )}>
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Configuración</span>
                    </button>
                    
                    <button className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                      "text-red-400 hover:text-red-300 hover:bg-red-500/10",
                      "transition-colors"
                    )}>
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Cerrar Sesión</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
