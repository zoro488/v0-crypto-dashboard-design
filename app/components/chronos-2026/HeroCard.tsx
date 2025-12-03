'use client'

/**
 * CHRONOS 2026 - Hero Card Premium
 * Tarjeta hero gigante con gradiente, animaciones y parallax
 * 
 * Features:
 * - Gradiente dinámico animado
 * - Parallax sutil en scroll
 * - Texto con reveal animation
 * - Efecto de partículas en el fondo
 * - Fully responsive
 */

import { memo, useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TextReveal, FloatAnimation } from './motion'
import { CHRONOS_COLORS, CHRONOS_ANIMATIONS } from '@/app/lib/constants/chronos-2026'

interface HeroCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down'
  change?: string
  className?: string
}

function HeroCard({
  title,
  value,
  subtitle,
  trend = 'up',
  change,
  className = '',
}: HeroCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  
  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.5, 1, 0.5])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95])
  
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown
  const trendColor = trend === 'up' ? CHRONOS_COLORS.success : CHRONOS_COLORS.danger
  
  return (
    <motion.div
      ref={ref}
      style={prefersReducedMotion ? {} : { y, opacity, scale }}
      className={cn(
        'relative overflow-hidden rounded-3xl',
        'p-8 md:p-12 lg:p-16',
        'text-center',
        className,
      )}
    >
      {/* Animated gradient background */}
      <motion.div 
        className="absolute inset-0"
        style={{
          background: CHRONOS_COLORS.gradientHero,
        }}
        animate={prefersReducedMotion ? {} : {
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Overlay pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1) 0%, transparent 50%)
          `,
        }}
      />
      
      {/* Animated particles */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[200px] md:min-h-[280px]">
        {/* Title */}
        <motion.h2
          initial={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...CHRONOS_ANIMATIONS.spring.smooth }}
          className="text-2xl md:text-4xl lg:text-5xl font-bold text-white/90 mb-4 md:mb-6"
        >
          {prefersReducedMotion ? title : <TextReveal text={title} delay={0.05} />}
        </motion.h2>
        
        {/* Main value */}
        <FloatAnimation amplitude={prefersReducedMotion ? 0 : 8} duration={5}>
          <motion.p
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: 0.4, 
              type: 'spring',
              ...CHRONOS_ANIMATIONS.spring.bouncy, 
            }}
            className="text-5xl md:text-7xl lg:text-9xl font-black text-white tracking-tight"
            style={{
              textShadow: '0 0 80px rgba(255,255,255,0.3)',
            }}
          >
            {value}
          </motion.p>
        </FloatAnimation>
        
        {/* Change indicator */}
        {change && (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-2 mt-6 md:mt-8"
          >
            <span 
              className="flex items-center gap-1 px-4 py-2 rounded-full text-lg md:text-xl font-semibold"
              style={{
                backgroundColor: `${trendColor}20`,
                color: trendColor,
              }}
            >
              <TrendIcon className="w-5 h-5" />
              {change}
            </span>
          </motion.div>
        )}
        
        {/* Subtitle */}
        {subtitle && (
          <motion.p
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-lg md:text-2xl text-white/80 mt-4"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      
      {/* Bottom glow */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
        }}
      />
      
      {/* Corner accents */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-lg" />
    </motion.div>
  )
}

export default memo(HeroCard)
