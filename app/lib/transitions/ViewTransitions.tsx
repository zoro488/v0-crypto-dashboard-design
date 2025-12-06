'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🚀 CHRONOS INFINITY - VIEW TRANSITIONS SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Sistema de transiciones entre vistas con:
 * - View Transitions API nativa (Chrome 111+)
 * - Fallback con Framer Motion
 * - Transiciones de página suaves
 * - Morphing entre elementos
 * - Shared element transitions
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { useCallback, useEffect, useState, createContext, useContext, ReactNode, memo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { butter, DURATIONS } from '@/app/lib/motion/easings'
import { INFINITY_COLORS, INFINITY_GRADIENTS } from '@/app/lib/constants/infinity-design-system'

// ════════════════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════════════════

interface ViewTransitionContext {
  isTransitioning: boolean
  startTransition: (callback: () => void | Promise<void>) => Promise<void>
  supportsViewTransitions: boolean
}

interface TransitionOptions {
  type?: 'fade' | 'slide' | 'morph' | 'zoom' | 'flip'
  duration?: number
  direction?: 'left' | 'right' | 'up' | 'down'
}

// ════════════════════════════════════════════════════════════════════════════════════════
// FEATURE DETECTION
// ════════════════════════════════════════════════════════════════════════════════════════

const supportsViewTransitions = (): boolean => {
  if (typeof window === 'undefined') return false
  return 'startViewTransition' in document
}

// ════════════════════════════════════════════════════════════════════════════════════════
// CONTEXT
// ════════════════════════════════════════════════════════════════════════════════════════

const ViewTransitionCtx = createContext<ViewTransitionContext>({
  isTransitioning: false,
  startTransition: async () => {},
  supportsViewTransitions: false,
})

export const useViewTransition = () => useContext(ViewTransitionCtx)

// ════════════════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ════════════════════════════════════════════════════════════════════════════════════════

interface ViewTransitionProviderProps {
  children: ReactNode
}

export const ViewTransitionProvider = memo(function ViewTransitionProvider({
  children,
}: ViewTransitionProviderProps) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [hasSupport, setHasSupport] = useState(false)
  
  useEffect(() => {
    setHasSupport(supportsViewTransitions())
  }, [])
  
  const startTransition = useCallback(async (callback: () => void | Promise<void>) => {
    setIsTransitioning(true)
    
    try {
      if (hasSupport && 'startViewTransition' in document) {
        // Usar View Transitions API nativa
        const transition = (document as Document & { 
          startViewTransition: (callback: () => void | Promise<void>) => { 
            finished: Promise<void>
            ready: Promise<void>
          } 
        }).startViewTransition(callback)
        await transition.finished
      } else {
        // Fallback: solo ejecutar el callback
        await callback()
      }
    } finally {
      setIsTransitioning(false)
    }
  }, [hasSupport])
  
  return (
    <ViewTransitionCtx.Provider value={{ isTransitioning, startTransition, supportsViewTransitions: hasSupport }}>
      {children}
    </ViewTransitionCtx.Provider>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// PAGE TRANSITION WRAPPER
// ════════════════════════════════════════════════════════════════════════════════════════

interface PageTransitionProps {
  children: ReactNode
  className?: string
  type?: TransitionOptions['type']
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  morph: {
    initial: { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 1.02, filter: 'blur(10px)' },
  },
  zoom: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 },
  },
  flip: {
    initial: { opacity: 0, rotateY: 90 },
    animate: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: -90 },
  },
}

export const PageTransition = memo(function PageTransition({
  children,
  className = '',
  type = 'morph',
}: PageTransitionProps) {
  const pathname = usePathname()
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className={className}
        variants={variants[type]}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: DURATIONS.page / 1000,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// TRANSITION LINK
// ════════════════════════════════════════════════════════════════════════════════════════

interface TransitionLinkProps {
  href: string
  children: ReactNode
  className?: string
  onClick?: () => void
}

export const TransitionLink = memo(function TransitionLink({
  href,
  children,
  className = '',
  onClick,
}: TransitionLinkProps) {
  const router = useRouter()
  const { startTransition, supportsViewTransitions } = useViewTransition()
  
  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    onClick?.()
    
    await startTransition(() => {
      router.push(href)
    })
  }, [href, router, startTransition, onClick])
  
  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      style={{ 
        viewTransitionName: supportsViewTransitions ? `link-${href.replace(/\//g, '-')}` : undefined 
      }}
    >
      {children}
    </a>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// SHARED ELEMENT
// ════════════════════════════════════════════════════════════════════════════════════════

interface SharedElementProps {
  id: string
  children: ReactNode
  className?: string
}

export const SharedElement = memo(function SharedElement({
  id,
  children,
  className = '',
}: SharedElementProps) {
  const { supportsViewTransitions } = useViewTransition()
  
  return (
    <div
      className={className}
      style={{
        viewTransitionName: supportsViewTransitions ? `shared-${id}` : undefined,
      }}
    >
      {children}
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// LOADING TRANSITION OVERLAY
// ════════════════════════════════════════════════════════════════════════════════════════

export const TransitionOverlay = memo(function TransitionOverlay() {
  const { isTransitioning } = useViewTransition()
  
  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${INFINITY_COLORS.violetGlow}, transparent)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </AnimatePresence>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// CSS FOR VIEW TRANSITIONS
// ════════════════════════════════════════════════════════════════════════════════════════

export const ViewTransitionStyles = `
  /* Root animation */
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 0.4s;
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  
  ::view-transition-old(root) {
    animation-name: fade-and-scale-out;
  }
  
  ::view-transition-new(root) {
    animation-name: fade-and-scale-in;
  }
  
  @keyframes fade-and-scale-out {
    to {
      opacity: 0;
      transform: scale(0.95);
      filter: blur(4px);
    }
  }
  
  @keyframes fade-and-scale-in {
    from {
      opacity: 0;
      transform: scale(1.02);
      filter: blur(4px);
    }
  }
  
  /* Shared elements animation */
  ::view-transition-group(*) {
    animation-duration: 0.35s;
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  
  /* Image morphing */
  ::view-transition-old(shared-*),
  ::view-transition-new(shared-*) {
    animation: none;
    mix-blend-mode: normal;
  }
  
  /* Page content */
  ::view-transition-old(page-content),
  ::view-transition-new(page-content) {
    animation-duration: 0.3s;
  }
  
  /* Slide animation for navigation */
  ::view-transition-old(slide-content) {
    animation: slide-out-left 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }
  
  ::view-transition-new(slide-content) {
    animation: slide-in-right 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }
  
  @keyframes slide-out-left {
    to {
      transform: translateX(-30px);
      opacity: 0;
    }
  }
  
  @keyframes slide-in-right {
    from {
      transform: translateX(30px);
      opacity: 0;
    }
  }
  
  /* Morph animation for cards */
  ::view-transition-group(morph-*) {
    animation-duration: 0.4s;
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
`

// ════════════════════════════════════════════════════════════════════════════════════════
// HOOK: USE PAGE TRANSITION
// ════════════════════════════════════════════════════════════════════════════════════════

export const usePageTransition = (options: TransitionOptions = {}) => {
  const router = useRouter()
  const { startTransition, isTransitioning, supportsViewTransitions } = useViewTransition()
  
  const navigateTo = useCallback(async (href: string) => {
    await startTransition(() => {
      router.push(href)
    })
  }, [router, startTransition])
  
  const navigateBack = useCallback(async () => {
    await startTransition(() => {
      router.back()
    })
  }, [router, startTransition])
  
  return {
    navigateTo,
    navigateBack,
    isTransitioning,
    supportsViewTransitions,
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════════════════════════

export default {
  ViewTransitionProvider,
  PageTransition,
  TransitionLink,
  SharedElement,
  TransitionOverlay,
  ViewTransitionStyles,
  useViewTransition,
  usePageTransition,
}
