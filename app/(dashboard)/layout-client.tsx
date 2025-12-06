'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — DASHBOARD LAYOUT CLIENT
// Layout principal con sidebar magnético y efectos premium
// ═══════════════════════════════════════════════════════════════

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/app/_components/providers/QueryProvider'

// Lazy load componentes pesados
const PremiumSidebar = dynamic(
  () => import('@/app/_components/layout/PremiumSidebar').then(m => m.PremiumSidebar),
  { ssr: false }
)
const CommandMenu = dynamic(
  () => import('@/app/_components/ui/CommandMenu').then(m => m.CommandMenu),
  { ssr: false }
)
const CursorEffects = dynamic(
  () => import('@/app/_components/ui/CursorEffects').then(m => m.CursorEffects),
  { ssr: false }
)

interface DashboardLayoutClientProps {
  children: React.ReactNode
}

export function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const [commandOpen, setCommandOpen] = React.useState(false)
  const [sidebarExpanded, setSidebarExpanded] = React.useState(false)

  // Global keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K - Command Menu
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <QueryProvider>
      {/* Cursor Effects Layer */}
      <CursorEffects />
      
      <div className="flex h-screen bg-black text-white overflow-hidden">
        {/* Premium Sidebar */}
        <PremiumSidebar 
          expanded={sidebarExpanded}
          onExpandedChange={setSidebarExpanded}
          onCommandOpen={() => setCommandOpen(true)} 
        />
        
        {/* Main Content with padding for sidebar */}
        <main 
          className="flex-1 overflow-y-auto transition-all duration-300"
          style={{ 
            marginLeft: sidebarExpanded ? 256 : 72,
          }}
        >
          <motion.div 
            className="min-h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>

        {/* Command Menu Portal */}
        <AnimatePresence>
          {commandOpen && (
            <CommandMenu onClose={() => setCommandOpen(false)} />
          )}
        </AnimatePresence>
        
        {/* Toast Notifications - Premium Style */}
        <Toaster 
          position="bottom-right" 
          theme="dark"
          toastOptions={{
            className: 'glass-panel border border-violet-500/20 text-white',
            duration: 4000,
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(20px)',
            },
          }}
        />
      </div>
    </QueryProvider>
  )
}

export default DashboardLayoutClient
