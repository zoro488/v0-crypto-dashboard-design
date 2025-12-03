/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 CHRONOS 2026 — DATA PROVIDER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Componente que envuelve toda la aplicación para:
 * - Inicializar el store desde IndexedDB
 * - Proveer contexto de datos
 * - Manejar hidratación SSR/CSR
 * - Mostrar estado de carga inicial
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useChronosStore } from '@/app/lib/store'
import { motion, AnimatePresence } from 'framer-motion'

interface DataProviderProps {
  children: ReactNode
}

/**
 * Loader premium mientras se hidratan los datos
 */
function HydrationLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
      }}
    >
      <div className="relative flex flex-col items-center gap-6">
        {/* Orb animado */}
        <div className="relative w-24 h-24">
          {/* Glow exterior */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(0, 245, 255, 0.3) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Orb principal */}
          <motion.div
            className="absolute inset-4 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #00F5FF 0%, #FF00AA 100%)',
              boxShadow: '0 0 60px rgba(0, 245, 255, 0.5)',
            }}
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          
          {/* Centro */}
          <motion.div
            className="absolute inset-8 rounded-full bg-black/50 backdrop-blur-sm"
            animate={{
              scale: [1, 0.9, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
        
        {/* Texto */}
        <motion.div
          className="text-center"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <h2 
            className="text-xl font-bold tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #00F5FF 0%, #FF00AA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            CHRONOS
          </h2>
          <p className="text-xs text-white/50 mt-1 tracking-widest">
            CARGANDO DATOS...
          </p>
        </motion.div>
        
        {/* Barra de progreso */}
        <div className="w-48 h-1 rounded-full overflow-hidden bg-white/10">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #00F5FF, #FF00AA)',
            }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

/**
 * DataProvider - Envuelve la aplicación y maneja la hidratación
 */
export function DataProvider({ children }: DataProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const lastSync = useChronosStore((state) => state.lastSync)
  
  useEffect(() => {
    // Esperar a que el store se hidrate desde IndexedDB
    const checkHydration = () => {
      // El store está hidratado cuando tiene lastSync
      if (lastSync > 0) {
        setIsHydrated(true)
        return
      }
      
      // Si no hay datos, también consideramos hidratado (primera vez)
      const timeout = setTimeout(() => {
        setIsHydrated(true)
      }, 500) // Timeout máximo de 500ms
      
      return () => clearTimeout(timeout)
    }
    
    // Pequeño delay para permitir la hidratación
    const timer = setTimeout(checkHydration, 100)
    return () => clearTimeout(timer)
  }, [lastSync])
  
  return (
    <>
      <AnimatePresence mode="wait">
        {!isHydrated && <HydrationLoader key="loader" />}
      </AnimatePresence>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHydrated ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </>
  )
}

/**
 * Hook para verificar si los datos están hidratados
 */
export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(false)
  
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  return isHydrated
}

/**
 * HOC para componentes que requieren datos hidratados
 */
export function withHydration<P extends object>(
  Component: React.ComponentType<P>,
  LoadingComponent?: React.ComponentType,
) {
  return function WithHydration(props: P) {
    const isHydrated = useIsHydrated()
    
    if (!isHydrated) {
      return LoadingComponent ? <LoadingComponent /> : null
    }
    
    return <Component {...props} />
  }
}

export default DataProvider
