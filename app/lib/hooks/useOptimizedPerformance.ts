'use client'

import { useEffect } from 'react'

export function useOptimizedPerformance() {
  useEffect(() => {
    const enableGPUAcceleration = () => {
      document.body.style.transform = 'translateZ(0)'
      document.body.style.backfaceVisibility = 'hidden'
      document.body.style.perspective = '1000px'
    }

    const optimizeScrolling = () => {
      let ticking = false
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            ticking = false
          })
          ticking = true
        }
      }
      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }

    const preloadCriticalResources = () => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = 'https://fonts.googleapis.com'
      document.head.appendChild(link)
    }

    const enableHardwareAcceleration = () => {
      const animatedElements = document.querySelectorAll('[class*="animate"]')
      animatedElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.willChange = 'transform, opacity'
        }
      })
    }

    enableGPUAcceleration()
    const cleanupScroll = optimizeScrolling()
    preloadCriticalResources()
    enableHardwareAcceleration()

    return () => {
      cleanupScroll()
    }
  }, [])
}
