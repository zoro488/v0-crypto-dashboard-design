'use client'

/**
 * 🌟 CHRONOS ULTRA SPLASH SCREEN
 * 
 * Experiencia de carga cinematográfica premium con:
 * - Logo animado con morphing 3D
 * - Partículas GPU de alta calidad
 * - Efectos de luz y bloom
 * - Tipografía animada
 * - Progress bar premium
 */

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import Image from 'next/image'

// ═══════════════════════════════════════════════════════════════════════════
// LOGO CHRONOS ANIMADO
// ═══════════════════════════════════════════════════════════════════════════

const ChronosLogo = memo(function ChronosLogo({ progress }: { progress: number }) {
  const scale = useSpring(0.8, { stiffness: 100, damping: 20 })
  const rotate = useSpring(0, { stiffness: 50, damping: 30 })
  
  useEffect(() => {
    scale.set(1 + progress * 0.1)
    rotate.set(progress * 360)
  }, [progress, scale, rotate])
  
  return (
    <motion.div
      className="relative"
      style={{ scale, rotateZ: rotate }}
    >
      {/* Glow rings */}
      <motion.div
        className="absolute inset-0 -m-8"
        animate={{
          boxShadow: [
            '0 0 60px 20px rgba(0, 245, 255, 0.1)',
            '0 0 80px 30px rgba(0, 245, 255, 0.2)',
            '0 0 60px 20px rgba(0, 245, 255, 0.1)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ borderRadius: '50%' }}
      />
      
      {/* Orbiting particles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: i === 0 ? '#00f5ff' : i === 1 ? '#fbbf24' : '#8b5cf6',
            boxShadow: `0 0 20px ${i === 0 ? '#00f5ff' : i === 1 ? '#fbbf24' : '#8b5cf6'}`,
            top: '50%',
            left: '50%',
          }}
          animate={{
            rotate: 360,
            x: [0, Math.cos(i * 120 * Math.PI / 180) * 80],
            y: [0, Math.sin(i * 120 * Math.PI / 180) * 80],
          }}
          transition={{
            rotate: { duration: 3 + i, repeat: Infinity, ease: 'linear' },
            x: { duration: 1, delay: i * 0.2 },
            y: { duration: 1, delay: i * 0.2 },
          }}
        />
      ))}
      
      {/* Logo principal */}
      <motion.div
        className="relative w-24 h-24 md:w-32 md:h-32"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-3xl blur-xl" />
        <div 
          className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(20,20,30,0.9) 100%)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Image
            src="/icon.svg"
            alt="CHRONOS"
            fill
            className="object-contain p-4"
            priority
          />
        </div>
      </motion.div>
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// TEXTO ANIMADO
// ═══════════════════════════════════════════════════════════════════════════

const AnimatedText = memo(function AnimatedText({ delay = 0 }: { delay?: number }) {
  const letters = 'CHRONOS'.split('')
  
  return (
    <motion.div 
      className="flex items-center justify-center gap-1 mt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay + 0.5 }}
    >
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          className="text-4xl md:text-6xl font-black tracking-wider"
          style={{
            background: 'linear-gradient(135deg, #00f5ff 0%, #fbbf24 50%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 40px rgba(0, 245, 255, 0.5)',
          }}
          initial={{ opacity: 0, y: 50, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            delay: delay + 0.7 + i * 0.08,
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
      className="w-64 md:w-80 mt-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 }}
    >
      {/* Track */}
      <div className="relative h-1 rounded-full overflow-hidden bg-white/5">
        {/* Glow background */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.1), transparent)',
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Progress fill */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #00f5ff 0%, #fbbf24 50%, #8b5cf6 100%)',
            boxShadow: '0 0 20px rgba(0, 245, 255, 0.5)',
            width: `${progress * 100}%`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {/* Percentage */}
      <motion.div
        className="flex justify-between items-center mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        <span className="text-xs text-white/40 tracking-[0.3em] uppercase">
          Initializing
        </span>
        <span 
          className="text-xs font-mono"
          style={{ color: '#00f5ff' }}
        >
          {Math.round(progress * 100)}%
        </span>
      </motion.div>
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// PARTÍCULAS DE FONDO
// ═══════════════════════════════════════════════════════════════════════════

const BackgroundParticles = memo(function BackgroundParticles() {
  const particles = useMemo(() => 
    [...Array(50)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 2,
      color: ['#00f5ff', '#fbbf24', '#8b5cf6'][Math.floor(Math.random() * 3)],
    }))
  , [])
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
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
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.5, 0.5],
            y: [0, -30, 0],
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
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

interface ChronosSplashUltraProps {
  onComplete?: () => void
  duration?: number
}

function ChronosSplashUltra({
  onComplete = () => {},
  duration = 4000,
}: ChronosSplashUltraProps) {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  
  const handleComplete = useCallback(() => {
    setIsVisible(false)
    setTimeout(onComplete, 500)
  }, [onComplete])
  
  // Simular progreso de carga
  useEffect(() => {
    const startTime = Date.now()
    const endTime = startTime + duration
    
    const updateProgress = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const newProgress = Math.min(elapsed / duration, 1)
      
      setProgress(newProgress)
      
      if (now < endTime) {
        requestAnimationFrame(updateProgress)
      } else {
        setTimeout(handleComplete, 300)
      }
    }
    
    requestAnimationFrame(updateProgress)
  }, [duration, handleComplete])
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{ background: '#000000' }}
        >
          {/* Background effects */}
          <div className="absolute inset-0">
            {/* Radial gradient */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(0, 245, 255, 0.08) 0%, transparent 50%)',
              }}
            />
            
            {/* Grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
              }}
            />
            
            {/* Particles */}
            <BackgroundParticles />
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            <ChronosLogo progress={progress} />
            <AnimatedText delay={0.3} />
            
            {/* Subtitle */}
            <motion.p
              className="mt-4 text-white/30 text-sm tracking-[0.4em] uppercase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
            >
              Enterprise Capital Flow System
            </motion.p>
            
            <PremiumProgressBar progress={progress} />
          </div>
          
          {/* Skip button */}
          <motion.button
            className="absolute bottom-8 right-8 text-white/30 hover:text-white/60 text-xs tracking-widest transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            onClick={handleComplete}
          >
            SKIP →
          </motion.button>
          
          {/* Version */}
          <motion.span
            className="absolute bottom-8 left-8 text-white/20 text-xs font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            v2026.ultra
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default memo(ChronosSplashUltra)
