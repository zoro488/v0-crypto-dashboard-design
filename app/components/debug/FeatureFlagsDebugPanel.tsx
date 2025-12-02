'use client'

/**
 * 🎯 FEATURE FLAGS DEBUG PANEL
 * 
 * Panel de debug para visualizar el estado de todas las feature flags.
 * Solo visible en desarrollo.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Flag, 
  X, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  XCircle,
  Zap,
  Settings,
} from 'lucide-react'
import { useFeatureFlags } from '@/app/hooks/useFeatureFlags'
import { cn } from '@/app/lib/utils'

interface FeatureFlagsDebugPanelProps {
  className?: string;
}

export function FeatureFlagsDebugPanel({ className }: FeatureFlagsDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)
  const { flags, loading, error, refresh } = useFeatureFlags({ autoRefresh: true })

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const flagEntries = Object.entries(flags)
  const enabledCount = flagEntries.filter(([, value]) => value === true).length
  const totalCount = flagEntries.length

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-4 left-4 z-[9999]',
          'w-12 h-12 rounded-full',
          'bg-gradient-to-br from-purple-600 to-pink-600',
          'text-white shadow-lg shadow-purple-500/30',
          'flex items-center justify-center',
          'hover:scale-110 transition-transform',
          className,
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Flag className="w-5 h-5" />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300, y: 100 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className={cn(
              'fixed bottom-20 left-4 z-[9999]',
              'w-80 max-h-[70vh]',
              'bg-black/95 backdrop-blur-xl',
              'border border-white/10 rounded-2xl',
              'shadow-2xl shadow-purple-500/20',
              'overflow-hidden',
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-pink-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-white">Feature Flags</h3>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={refresh}
                    className="p-1.5 rounded-lg hover:bg-white/10"
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RefreshCw className={cn(
                      'w-4 h-4 text-gray-400',
                      loading && 'animate-spin',
                    )} />
                  </motion.button>
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1.5 rounded-lg hover:bg-white/10"
                  >
                    {isMinimized ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">{enabledCount} enabled</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-400" />
                  <span className="text-red-400">{totalCount - enabledCount} disabled</span>
                </div>
              </div>

              {error && (
                <div className="mt-2 text-xs text-red-400">
                  Error: {error.message}
                </div>
              )}
            </div>

            {/* Flags List */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
                    {flagEntries.map(([key, value]) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          'flex items-center justify-between',
                          'p-2 rounded-lg',
                          'bg-white/5 hover:bg-white/10',
                          'transition-colors',
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {typeof value === 'boolean' ? (
                            value ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                            )
                          ) : (
                            <Settings className="w-4 h-4 text-blue-400 shrink-0" />
                          )}
                          <span className="text-xs text-gray-300 truncate">
                            {key}
                          </span>
                        </div>
                        <span className={cn(
                          'text-xs font-mono px-2 py-0.5 rounded shrink-0',
                          typeof value === 'boolean'
                            ? value
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                            : 'bg-blue-500/20 text-blue-400',
                        )}>
                          {String(value)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="p-3 border-t border-white/10 bg-white/5">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Hypertune + Edge Config</span>
                <span>{loading ? 'Loading...' : 'Live'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default FeatureFlagsDebugPanel
