'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚀 CHRONOS 2026 ULTRA - HEADER PREMIUM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Header con glassmorphism, búsqueda y notificaciones
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { memo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { 
  Search, Bell, User, Command,
  Sparkles, Zap, Settings,
} from 'lucide-react'
import { C26_COLORS, C26_GRADIENTS, C26_ANIMATIONS } from '@/app/lib/constants/chronos-2026-ultra'
import { cn } from '@/lib/utils'

interface UltraHeaderProps {
  onSearch?: () => void
  onNotifications?: () => void
  onProfile?: () => void
  userName?: string
}

function UltraHeader({ 
  onSearch, 
  onNotifications, 
  onProfile,
  userName = 'Usuario',
}: UltraHeaderProps) {
  const prefersReducedMotion = useReducedMotion()
  const [hasNotifications] = useState(true)
  
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-40 px-6 py-4"
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderBottom: `1px solid ${C26_COLORS.glassBorder}`,
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-4">
          <motion.div
            className="flex items-center gap-3"
            whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: C26_GRADIENTS.primary,
                boxShadow: `0 0 30px ${C26_COLORS.cyanGlow}`,
              }}
            >
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            
            <div className="hidden sm:block">
              <h1 
                className="text-xl font-bold tracking-tight"
                style={{
                  background: C26_GRADIENTS.primary,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                CHRONOS 2026
              </h1>
            </div>
          </motion.div>
          
          {/* Status badge */}
          <div 
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(0, 255, 159, 0.1)',
              border: '1px solid rgba(0, 255, 159, 0.2)',
            }}
          >
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ background: C26_COLORS.success }}
              animate={prefersReducedMotion ? {} : {
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <span 
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: C26_COLORS.success }}
            >
              Ultra Premium
            </span>
          </div>
        </div>
        
        {/* Search Bar */}
        <motion.button
          onClick={onSearch}
          className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-xl flex-1 max-w-md mx-8"
          style={{
            background: C26_COLORS.glassBg,
            border: `1px solid ${C26_COLORS.glassBorder}`,
          }}
          whileHover={{
            background: C26_COLORS.glassBgHover,
            borderColor: C26_COLORS.glassBorderHover,
          }}
          whileTap={{ scale: 0.99 }}
        >
          <Search className="w-4 h-4" style={{ color: C26_COLORS.textMuted }} />
          <span 
            className="text-sm flex-1 text-left"
            style={{ color: C26_COLORS.textMuted }}
          >
            Buscar en CHRONOS...
          </span>
          <div 
            className="flex items-center gap-1 px-2 py-1 rounded-md"
            style={{
              background: C26_COLORS.glassBg,
              border: `1px solid ${C26_COLORS.glassBorder}`,
            }}
          >
            <Command className="w-3 h-3" style={{ color: C26_COLORS.textMuted }} />
            <span 
              className="text-xs font-medium"
              style={{ color: C26_COLORS.textMuted }}
            >
              K
            </span>
          </div>
        </motion.button>
        
        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search */}
          <motion.button
            onClick={onSearch}
            className="md:hidden p-2.5 rounded-xl"
            style={{
              background: C26_COLORS.glassBg,
              border: `1px solid ${C26_COLORS.glassBorder}`,
            }}
            whileHover={{ background: C26_COLORS.glassBgHover }}
            whileTap={{ scale: 0.95 }}
          >
            <Search className="w-5 h-5" style={{ color: C26_COLORS.textSecondary }} />
          </motion.button>
          
          {/* Notifications */}
          <motion.button
            onClick={onNotifications}
            className="relative p-2.5 rounded-xl"
            style={{
              background: C26_COLORS.glassBg,
              border: `1px solid ${C26_COLORS.glassBorder}`,
            }}
            whileHover={{ background: C26_COLORS.glassBgHover }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-5 h-5" style={{ color: C26_COLORS.textSecondary }} />
            
            {hasNotifications && (
              <motion.div
                className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full"
                style={{
                  background: C26_COLORS.magenta,
                  boxShadow: `0 0 10px ${C26_COLORS.magentaGlow}`,
                }}
                animate={prefersReducedMotion ? {} : {
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
          </motion.button>
          
          {/* Settings */}
          <motion.button
            className="hidden sm:flex p-2.5 rounded-xl"
            style={{
              background: C26_COLORS.glassBg,
              border: `1px solid ${C26_COLORS.glassBorder}`,
            }}
            whileHover={{ 
              background: C26_COLORS.glassBgHover,
              rotate: 90,
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Settings className="w-5 h-5" style={{ color: C26_COLORS.textSecondary }} />
          </motion.button>
          
          {/* Profile */}
          <motion.button
            onClick={onProfile}
            className="flex items-center gap-3 p-1.5 pr-4 rounded-xl"
            style={{
              background: C26_COLORS.glassBg,
              border: `1px solid ${C26_COLORS.glassBorder}`,
            }}
            whileHover={{ background: C26_COLORS.glassBgHover }}
            whileTap={{ scale: 0.98 }}
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: C26_GRADIENTS.accent,
              }}
            >
              <User className="w-4 h-4 text-white" />
            </div>
            <span 
              className="hidden sm:block text-sm font-medium"
              style={{ color: C26_COLORS.textPrimary }}
            >
              {userName}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}

export default memo(UltraHeader)
