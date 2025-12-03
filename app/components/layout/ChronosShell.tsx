'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { Bell, Command } from 'lucide-react'

// Componentes de integración
import { GlobalCommandMenu, useCommandMenu } from '@/app/components/command'
import { NotificationDrawer } from '@/app/components/notifications'
import { MobileNavBar } from '@/app/components/navigation'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CHRONOS SHELL - Integration Layer
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Capa de integración que conecta todos los componentes del sistema:
 * - GlobalCommandMenu (⌘+K)
 * - NotificationDrawer (Panel derecho)
 * - MobileNavBar (Navegación móvil)
 * - Page transitions
 * - Global shortcuts
 */

// Context para el shell
interface ChronosShellContextType {
  openCommandMenu: () => void
  openNotifications: () => void
  closeAll: () => void
  isCommandOpen: boolean
  isNotificationsOpen: boolean
}

const ChronosShellContext = createContext<ChronosShellContextType | null>(null)

export function useChronosShell() {
  const context = useContext(ChronosShellContext)
  if (!context) {
    throw new Error('useChronosShell debe usarse dentro de ChronosShellProvider')
  }
  return context
}

// Header compacto con acciones globales
function GlobalHeader({ 
  onNotificationClick,
  onCommandClick,
  unreadCount = 3,
}: { 
  onNotificationClick: () => void
  onCommandClick: () => void
  unreadCount?: number
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 right-0 z-40 p-4 flex items-center gap-2"
    >
      {/* Command Menu Trigger */}
      <motion.button
        onClick={onCommandClick}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Command className="w-4 h-4" />
        <span className="hidden sm:inline">Buscar</span>
        <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-white/5 text-[10px] ml-2">⌘K</kbd>
      </motion.button>
      
      {/* Notifications Trigger */}
      <motion.button
        onClick={onNotificationClick}
        className="relative p-2.5 rounded-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell className="w-5 h-5 text-white/60" />
        
        {/* Badge de notificaciones */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>
    </motion.header>
  )
}

// Page transition wrapper
function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Props del shell
interface ChronosShellProps {
  children: React.ReactNode
  showHeader?: boolean
  showMobileNav?: boolean
}

export function ChronosShell({ 
  children, 
  showHeader = true,
  showMobileNav = true,
}: ChronosShellProps) {
  const { isOpen: isCommandOpen, setIsOpen: setCommandOpen } = useCommandMenu()
  const [isNotificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadCount] = useState(3) // TODO: Conectar con store real
  const pathname = usePathname()
  
  // Cerrar todo al navegar
  useEffect(() => {
    setNotificationsOpen(false)
  }, [pathname])
  
  // Handlers
  const openCommandMenu = useCallback(() => setCommandOpen(true), [setCommandOpen])
  const openNotifications = useCallback(() => setNotificationsOpen(true), [])
  const closeAll = useCallback(() => {
    setCommandOpen(false)
    setNotificationsOpen(false)
  }, [setCommandOpen])
  
  // Action handler del command menu
  const handleCommandAction = useCallback((action: string) => {
    switch (action) {
      case 'new-sale':
        // Abrir modal de venta
        console.log('Abrir modal de venta')
        break
      case 'new-expense':
        // Abrir modal de gasto
        console.log('Abrir modal de gasto')
        break
      case 'new-transfer':
        // Abrir modal de transferencia
        console.log('Abrir modal de transferencia')
        break
      default:
        break
    }
  }, [])
  
  // Action del FAB móvil
  const handleMobileAction = useCallback(() => {
    // Abrir menú de acciones rápidas
    openCommandMenu()
  }, [openCommandMenu])
  
  // No mostrar shell en páginas de auth
  const isAuthPage = pathname?.startsWith('/login') || 
                     pathname?.startsWith('/register') || 
                     pathname?.startsWith('/forgot-password')
  
  if (isAuthPage) {
    return <>{children}</>
  }
  
  return (
    <ChronosShellContext.Provider 
      value={{ 
        openCommandMenu, 
        openNotifications, 
        closeAll,
        isCommandOpen,
        isNotificationsOpen,
      }}
    >
      {/* Header global */}
      {showHeader && (
        <GlobalHeader 
          onCommandClick={openCommandMenu}
          onNotificationClick={openNotifications}
          unreadCount={unreadCount}
        />
      )}
      
      {/* Contenido principal con transiciones */}
      <PageTransition>
        <main className="min-h-screen pb-24 md:pb-0">
          {children}
        </main>
      </PageTransition>
      
      {/* Command Palette Global */}
      <GlobalCommandMenu 
        isOpen={isCommandOpen}
        onClose={() => setCommandOpen(false)}
        onActionSelect={handleCommandAction}
      />
      
      {/* Notification Drawer */}
      <NotificationDrawer 
        isOpen={isNotificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
      
      {/* Mobile Navigation */}
      {showMobileNav && (
        <MobileNavBar onActionClick={handleMobileAction} />
      )}
    </ChronosShellContext.Provider>
  )
}

// Hook para exportar las funciones sin usar nombres reservados
export function useNotifications() {
  const context = useContext(ChronosShellContext)
  return {
    open: context?.openNotifications ?? (() => {}),
    isOpen: context?.isNotificationsOpen ?? false,
  }
}

export default ChronosShell
