'use client'

/**
 * CHRONOS 2026 - Parallax Hero Section
 * Sección hero con efecto parallax avanzado
 * 
 * Features:
 * - Parallax en scroll
 * - Orbe de gradiente animado
 * - Text reveal
 * - Responsive
 */

import { memo, useRef, ReactNode } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CHRONOS_COLORS } from '@/app/lib/constants/chronos-2026'

interface ParallaxHeroProps {
  children: ReactNode
  className?: string
  intensity?: 'subtle' | 'medium' | 'strong'
}

const intensityConfig = {
  subtle: { y: '25%', opacity: [0.8, 1, 0.8] },
  medium: { y: '50%', opacity: [0.5, 1, 0.5] },
  strong: { y: '75%', opacity: [0.3, 1, 0.3] },
}

function ParallaxHero({ 
  children, 
  className = '',
  intensity = 'medium',
}: ParallaxHeroProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  
  const { scrollYProgress } = useScroll({ 
    target: ref, 
    offset: ['start start', 'end start'], 
  })
  
  const config = intensityConfig[intensity]
  const y = useTransform(scrollYProgress, [0, 1], ['0%', config.y])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], config.opacity)
  
  return (
    <div 
      ref={ref} 
      className={cn(
        'relative -mt-20 pt-20 overflow-hidden',
        className,
      )}
    >
      {/* Animated gradient orbs background */}
      <motion.div 
        style={prefersReducedMotion ? {} : { y, opacity }} 
        className="absolute inset-0 pointer-events-none"
      >
        {/* Primary orb */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px]"
          style={{ background: `${CHRONOS_COLORS.primary}30` }}
          animate={prefersReducedMotion ? {} : {
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Accent orb */}
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[130px]"
          style={{ background: `${CHRONOS_COLORS.accent}25` }}
          animate={prefersReducedMotion ? {} : {
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        
        {/* Center blend */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px] opacity-20"
          style={{ 
            background: `radial-gradient(circle, ${CHRONOS_COLORS.primary}40 0%, ${CHRONOS_COLORS.accent}20 50%, transparent 70%)`, 
          }}
        />
      </motion.div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Bottom fade */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,1), transparent)',
        }}
      />
    </div>
  )
}

export default memo(ParallaxHero)
