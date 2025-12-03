'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🌟 CHRONOS SPLASH SCREEN PREMIUM 2026
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Experiencia de inicio cinematográfica ultra-premium con:
 * - Logo CHRONOS animado con efectos 3D
 * - Partículas flotantes con física GPU
 * - Tipografía animada letra por letra
 * - Progress bar con gradiente dinámico
 * - Transiciones suaves estilo Apple
 * - Efectos de luz y bloom premium
 * 
 * Inspiración: Apple Vision Pro + Tesla + Linear + Vercel 2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import Image from 'next/image'
import { ChronosLogo } from '@/app/components/ui/ChronosLogo'

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN PREMIUM
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Colores premium
  colors: {
    primary: '#00F5FF',    // Cyan brillante
    secondary: '#FF00AA',  // Magenta
    accent: '#8B5CF6',     // Violeta
    gold: '#FBBF24',       // Oro premium
    void: '#000000',       // Negro puro
  },
  // Tiempos de animación (ms)
  timing: {
    logoEnter: 800,
    textReveal: 2000,
    progressDuration: 3500,
    fadeOut: 600,
  },
  // Cantidad de partículas
  particleCount: 80,
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTÍCULAS FLOTANTES PREMIUM
// ═══════════════════════════════════════════════════════════════════════════

const FloatingParticles = memo(function FloatingParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: CONFIG.particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 3,
      duration: 4 + Math.random() * 6,
      color: [CONFIG.colors.primary, CONFIG.colors.secondary, CONFIG.colors.accent, CONFIG.colors.gold][
        Math.floor(Math.random() * 4)
      ],
      opacity: 0.3 + Math.random() * 0.5,
    }))
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// AURORA BACKGROUND ANIMADA
// ═══════════════════════════════════════════════════════════════════════════

const AuroraBackground = memo(function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Orbe Cyan principal */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${CONFIG.colors.primary}20 0%, transparent 70%)`,
          top: '-20%',
          left: '-10%',
        }}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Orbe Magenta secundario */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${CONFIG.colors.secondary}15 0%, transparent 70%)`,
          bottom: '-15%',
          right: '-5%',
        }}
        animate={{
          scale: [1, 1.4, 1],
          x: [0, -80, 0],
          y: [0, -60, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />
      
      {/* Orbe Violeta central */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${CONFIG.colors.accent}10 0%, transparent 70%)`,
          top: '35%',
          left: '40%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 360],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Grid pattern sutil */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// LOGO CHRONOS PREMIUM CON EFECTOS 3D
// ═══════════════════════════════════════════════════════════════════════════

const PremiumLogo = memo(function PremiumLogo({ progress }: { progress: number }) {
  const scale = useSpring(0.8, { stiffness: 100, damping: 20 })
  const rotate = useSpring(0, { stiffness: 50, damping: 30 })
  const glow = useSpring(0, { stiffness: 80, damping: 15 })
  
  useEffect(() => {
    scale.set(1 + progress * 0.05)
    glow.set(progress)
  }, [progress, scale, glow])
  
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ 
        duration: 1.2, 
        ease: [0.16, 1, 0.3, 1],
        delay: 0.2,
      }}
      style={{ scale }}
    >
      {/* Anillos orbitales animados */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-[-20px]"
          style={{
            border: `1px solid ${i === 0 ? CONFIG.colors.primary : i === 1 ? CONFIG.colors.secondary : CONFIG.colors.accent}`,
            borderRadius: '50%',
            opacity: 0.2,
          }}
          animate={{
            rotate: 360 * (i % 2 === 0 ? 1 : -1),
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: {
              duration: 10 + i * 5,
              repeat: Infinity,
              ease: 'linear',
            },
            scale: {
              duration: 3 + i,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        />
      ))}
      
      {/* Glow dinámico */}
      <motion.div
        className="absolute inset-[-40px]"
        style={{
          background: `radial-gradient(circle, ${CONFIG.colors.primary}30 0%, transparent 70%)`,
          filter: 'blur(30px)',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Partículas orbitando */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: [CONFIG.colors.primary, CONFIG.colors.secondary, CONFIG.colors.accent, CONFIG.colors.gold][i],
            boxShadow: `0 0 15px ${[CONFIG.colors.primary, CONFIG.colors.secondary, CONFIG.colors.accent, CONFIG.colors.gold][i]}`,
            top: '50%',
            left: '50%',
            transformOrigin: `${-60 - i * 10}px 0`,
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 0.25,
          }}
        />
      ))}
      
      {/* Logo contenedor */}
      <motion.div
        className="relative w-32 h-32 md:w-40 md:h-40"
        whileHover={{ scale: 1.05 }}
      >
        {/* Fondo con blur */}
        <div 
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,30,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        />
        
        {/* Gradiente de borde animado */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: `linear-gradient(${0}deg, ${CONFIG.colors.primary}40, ${CONFIG.colors.secondary}40, ${CONFIG.colors.accent}40)`,
            padding: '1px',
          }}
          animate={{
            background: [
              `linear-gradient(0deg, ${CONFIG.colors.primary}40, ${CONFIG.colors.secondary}40)`,
              `linear-gradient(180deg, ${CONFIG.colors.secondary}40, ${CONFIG.colors.accent}40)`,
              `linear-gradient(360deg, ${CONFIG.colors.accent}40, ${CONFIG.colors.primary}40)`,
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* Logo CHRONOS */}
        <div className="absolute inset-0 flex items-center justify-center">
          <ChronosLogo size="xl" animated glow color="#FFFFFF" />
        </div>
      </motion.div>
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// TEXTO ANIMADO LETRA POR LETRA
// ═══════════════════════════════════════════════════════════════════════════

const AnimatedText = memo(function AnimatedText({ delay = 0 }: { delay?: number }) {
  const letters = 'CHRONOS'.split('')
  
  return (
    <motion.div 
      className="flex items-center justify-center gap-0.5 md:gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay + 0.8 }}
    >
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-[0.1em]"
          style={{
            background: `linear-gradient(135deg, ${CONFIG.colors.primary} 0%, #FFFFFF 50%, ${CONFIG.colors.secondary} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: `0 0 60px ${CONFIG.colors.primary}50`,
            filter: 'drop-shadow(0 4px 20px rgba(0,245,255,0.3))',
          }}
          initial={{ 
            opacity: 0, 
            y: 60, 
            rotateX: -90,
            scale: 0.5,
          }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            rotateX: 0,
            scale: 1,
          }}
          transition={{
            delay: delay + 1.0 + i * 0.1,
            type: 'spring',
            stiffness: 200,
            damping: 20,
          }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS BAR PREMIUM
// ═══════════════════════════════════════════════════════════════════════════

const PremiumProgressBar = memo(function PremiumProgressBar({ progress }: { progress: number }) {
  return (
    <motion.div
      className="w-72 md:w-96"
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1.8, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Track */}
      <div className="relative h-1.5 rounded-full overflow-hidden bg-white/5 backdrop-blur-sm">
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent, ${CONFIG.colors.primary}20, transparent)`,
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Progress fill */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${CONFIG.colors.primary} 0%, ${CONFIG.colors.secondary} 50%, ${CONFIG.colors.accent} 100%)`,
            boxShadow: `0 0 20px ${CONFIG.colors.primary}, 0 0 40px ${CONFIG.colors.primary}50`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        
        {/* Glow point */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
          style={{
            background: '#FFFFFF',
            boxShadow: `0 0 15px ${CONFIG.colors.primary}, 0 0 30px ${CONFIG.colors.primary}`,
            left: `calc(${progress * 100}% - 6px)`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.8, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
      
      {/* Labels */}
      <div className="flex justify-between items-center mt-4">
        <motion.span
          className="text-xs tracking-[0.3em] uppercase"
          style={{ color: `${CONFIG.colors.primary}80` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          Initializing System
        </motion.span>
        <motion.span
          className="text-sm font-mono font-bold"
          style={{ 
            background: `linear-gradient(90deg, ${CONFIG.colors.primary}, ${CONFIG.colors.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          {Math.round(progress * 100)}%
        </motion.span>
      </div>
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// LOADING DOTS PREMIUM
// ═══════════════════════════════════════════════════════════════════════════

const LoadingDots = memo(function LoadingDots() {
  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2.2 }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            background: [CONFIG.colors.primary, CONFIG.colors.secondary, CONFIG.colors.accent][i],
            boxShadow: `0 0 10px ${[CONFIG.colors.primary, CONFIG.colors.secondary, CONFIG.colors.accent][i]}`,
          }}
          animate={{
            y: [0, -8, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

interface ChronosSplashPremiumProps {
  onComplete?: () => void
  duration?: number
}

function ChronosSplashPremium({
  onComplete = () => {},
  duration = 4500,
}: ChronosSplashPremiumProps) {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [phase, setPhase] = useState<'loading' | 'complete' | 'exit'>('loading')
  
  const handleComplete = useCallback(() => {
    setPhase('complete')
    setTimeout(() => {
      setPhase('exit')
      setTimeout(() => {
        setIsVisible(false)
        onComplete()
      }, CONFIG.timing.fadeOut)
    }, 500)
  }, [onComplete])
  
  // Simular progreso de carga con easing
  useEffect(() => {
    const startTime = Date.now()
    const endTime = startTime + duration
    
    const updateProgress = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const rawProgress = Math.min(elapsed / duration, 1)
      
      // Easing: empieza rápido, termina lento (ease-out)
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3)
      
      setProgress(easedProgress)
      
      if (now < endTime) {
        requestAnimationFrame(updateProgress)
      } else {
        handleComplete()
      }
    }
    
    requestAnimationFrame(updateProgress)
  }, [duration, handleComplete])
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 1.1,
            filter: 'blur(20px)',
          }}
          transition={{ duration: 0.6 }}
          style={{ 
            background: CONFIG.colors.void,
          }}
        >
          {/* Aurora Background */}
          <AuroraBackground />
          
          {/* Partículas flotantes */}
          <FloatingParticles />
          
          {/* Vignette */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.6) 100%)',
            }}
          />
          
          {/* Contenido principal */}
          <div className="relative z-10 flex flex-col items-center gap-8 px-6">
            {/* Logo Premium */}
            <PremiumLogo progress={progress} />
            
            {/* Texto CHRONOS animado */}
            <AnimatedText delay={0.3} />
            
            {/* Tagline */}
            <motion.p
              className="text-sm md:text-base tracking-[0.4em] uppercase text-center"
              style={{ color: `${CONFIG.colors.primary}60` }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 0.6 }}
            >
              Enterprise Capital Flow System
            </motion.p>
            
            {/* Progress Bar */}
            <PremiumProgressBar progress={progress} />
            
            {/* Loading Dots */}
            <LoadingDots />
          </div>
          
          {/* Skip Button */}
          <motion.button
            className="absolute bottom-8 right-8 px-4 py-2 text-xs tracking-[0.2em] uppercase transition-all rounded-full"
            style={{ 
              color: `${CONFIG.colors.primary}60`,
              border: `1px solid ${CONFIG.colors.primary}20`,
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(10px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            whileHover={{ 
              color: CONFIG.colors.primary,
              borderColor: `${CONFIG.colors.primary}60`,
              scale: 1.05,
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleComplete}
          >
            Skip →
          </motion.button>
          
          {/* Version */}
          <motion.span
            className="absolute bottom-8 left-8 text-xs font-mono tracking-wider"
            style={{ color: `${CONFIG.colors.primary}30` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            v2026.premium
          </motion.span>
          
          {/* Status indicators */}
          <motion.div
            className="absolute top-8 right-8 flex items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            {[
              { label: 'System', color: CONFIG.colors.primary },
              { label: 'Firebase', color: CONFIG.colors.secondary },
              { label: 'AI', color: CONFIG.colors.accent },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center gap-2">
                <motion.div 
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    background: item.color,
                    boxShadow: `0 0 10px ${item.color}`,
                  }}
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
                <span 
                  className="text-[10px] tracking-wider uppercase"
                  style={{ color: `${item.color}80` }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default memo(ChronosSplashPremium)
