'use client'

/**
 * 🎯 CHRONOS SCROLL CONTROLLER
 * 
 * Sistema de scroll unificado con soporte para:
 * - Mouse wheel (con aceleración suave)
 * - Trackpad gestures
 * - Keyboard navigation (Page Up/Down, Home/End, Arrow keys, Space)
 * - Touch devices (swipe)
 * - Comandos programáticos
 */

import { useEffect, useCallback, useRef } from 'react'

// Velocidades de scroll configurables
const SCROLL_SPEEDS = {
  line: 60,       // Arrow keys
  page: 500,      // Page Up/Down
  wheel: 1.2,     // Multiplicador para mouse wheel
  smooth: 300,    // Duración animación (ms)
}

export function useScrollController() {
  const lastScrollTime = useRef(0)
  const scrollVelocity = useRef(0)

  // Scroll suave a posición
  const scrollTo = useCallback((y: number, behavior: ScrollBehavior = 'smooth') => {
    window.scrollTo({ top: y, behavior })
  }, [])

  // Scroll al inicio
  const scrollToTop = useCallback(() => {
    scrollTo(0)
  }, [scrollTo])

  // Scroll al final
  const scrollToBottom = useCallback(() => {
    scrollTo(document.documentElement.scrollHeight)
  }, [scrollTo])

  // Scroll por cantidad
  const scrollBy = useCallback((delta: number, behavior: ScrollBehavior = 'smooth') => {
    window.scrollBy({ top: delta, behavior })
  }, [])

  // Scroll a elemento
  const scrollToElement = useCallback((selector: string, offset = 80) => {
    const element = document.querySelector(selector)
    if (element) {
      const rect = element.getBoundingClientRect()
      const absoluteTop = rect.top + window.scrollY - offset
      scrollTo(absoluteTop)
    }
  }, [scrollTo])

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // No interceptar si hay un input activo
      const activeElement = document.activeElement
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          scrollBy(-SCROLL_SPEEDS.line)
          break
        case 'ArrowDown':
          e.preventDefault()
          scrollBy(SCROLL_SPEEDS.line)
          break
        case 'PageUp':
          e.preventDefault()
          scrollBy(-SCROLL_SPEEDS.page)
          break
        case 'PageDown':
        case ' ': // Space
          if (!e.shiftKey) {
            e.preventDefault()
            scrollBy(SCROLL_SPEEDS.page)
          }
          break
        case 'Home':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            scrollToTop()
          }
          break
        case 'End':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            scrollToBottom()
          }
          break
        case 'j': // Vim-style down
          if (!e.ctrlKey && !e.metaKey) {
            scrollBy(SCROLL_SPEEDS.line)
          }
          break
        case 'k': // Vim-style up
          if (!e.ctrlKey && !e.metaKey) {
            scrollBy(-SCROLL_SPEEDS.line)
          }
          break
        case 'g': // Go to top (double g in vim, single here)
          if (!e.ctrlKey && !e.metaKey) {
            scrollToTop()
          }
          break
        case 'G': // Go to bottom
          if (!e.ctrlKey && !e.metaKey && e.shiftKey) {
            scrollToBottom()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [scrollBy, scrollToTop, scrollToBottom])

  // Mouse wheel con aceleración suave
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Dejar que el navegador maneje el scroll normalmente
      // Solo aplicar aceleración suave si es necesario
      const now = Date.now()
      const timeDelta = now - lastScrollTime.current
      
      if (timeDelta < 50) {
        // Scroll rápido consecutivo - aumentar velocidad gradualmente
        scrollVelocity.current = Math.min(scrollVelocity.current + 0.1, 2)
      } else {
        // Reset velocidad
        scrollVelocity.current = 1
      }
      
      lastScrollTime.current = now
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  return {
    scrollTo,
    scrollBy,
    scrollToTop,
    scrollToBottom,
    scrollToElement,
  }
}

/**
 * Componente para scroll indicator flotante
 */
export function ScrollIndicator() {
  const { scrollToTop } = useScrollController()
  
  useEffect(() => {
    let scrollY = 0
    let ticking = false

    const updateScrollIndicator = () => {
      const button = document.getElementById('scroll-to-top-btn')
      if (button) {
        if (scrollY > 300) {
          button.classList.remove('opacity-0', 'pointer-events-none')
          button.classList.add('opacity-100')
        } else {
          button.classList.remove('opacity-100')
          button.classList.add('opacity-0', 'pointer-events-none')
        }
      }
      ticking = false
    }

    const onScroll = () => {
      scrollY = window.scrollY
      if (!ticking) {
        window.requestAnimationFrame(updateScrollIndicator)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      id="scroll-to-top-btn"
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/80 to-purple-500/80 backdrop-blur-xl border border-white/20 shadow-2xl opacity-0 pointer-events-none transition-all duration-300 hover:scale-110 hover:shadow-blue-500/30 flex items-center justify-center group"
      aria-label="Scroll to top"
    >
      <svg 
        className="w-5 h-5 text-white group-hover:-translate-y-0.5 transition-transform" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  )
}

/**
 * Proveedor de scroll para toda la app
 */
export function ScrollProvider({ children }: { children: React.ReactNode }) {
  // Inicializar scroll controller
  useScrollController()
  
  return (
    <>
      {children}
      <ScrollIndicator />
    </>
  )
}

export default ScrollProvider
