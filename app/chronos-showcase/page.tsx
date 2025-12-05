'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🌌 CHRONOS INFINITY 2026 - SHOWCASE FINAL
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Página de demostración de todos los componentes INFINITY:
 * - Header flotante con orb
 * - Command Menu (Cmd+K)
 * - Bank Orbs Gallery
 * - Particle systems
 * - Micro-interactions
 * - View Transitions
 * 
 * "El sistema financiero más bello jamás creado"
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'

// Lazy load heavy 3D components
const FloatingHeader = dynamic(() => import('@/app/components/layout/FloatingHeader'), { ssr: false })
const CommandMenu = dynamic(() => import('@/app/components/layout/CommandMenu'), { ssr: false })
const BankOrbsGallery = dynamic(() => import('@/app/components/3d/BankOrbsGallery'), { ssr: false })
const QuantumDust = dynamic(() => import('@/app/components/3d/particles/QuantumDust'), { ssr: false })
const CursorTrail = dynamic(() => import('@/app/components/effects/CursorTrail'), { ssr: false })
const InfinityOrb = dynamic(() => import('@/app/components/3d/InfinityOrb'), { ssr: false })

import { LenisProvider } from '@/app/lib/scroll/LenisProvider'
import { ViewTransitionProvider, PageTransition } from '@/app/lib/transitions/ViewTransitions'
import { 
  RippleContainer, 
  TiltCard, 
  GlowPulse,
  MagneticHover,
  FloatingElement,
} from '@/app/components/effects/MicroInteractions'
import { fadeVariants, staggerContainerVariants, slideUpVariants } from '@/app/lib/motion/easings'
import { INFINITY_COLORS, INFINITY_GRADIENTS } from '@/app/lib/constants/infinity-design-system'
import { 
  Sparkles, 
  Zap, 
  Shield, 
  TrendingUp, 
  Users, 
  Wallet,
  ArrowRight,
  Star,
} from 'lucide-react'
import { Canvas } from '@react-three/fiber'

// ════════════════════════════════════════════════════════════════════════════════════════
// HERO SECTION
// ════════════════════════════════════════════════════════════════════════════════════════

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient mesh */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{ background: INFINITY_GRADIENTS.mesh }}
      />
      
      {/* 3D Orb central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[500px] opacity-60">
          <Suspense fallback={null}>
            <Canvas camera={{ position: [0, 0, 5] }} gl={{ alpha: true }}>
              <ambientLight intensity={0.4} />
              <pointLight position={[3, 3, 3]} intensity={0.8} color="#8B00FF" />
              <pointLight position={[-3, -3, 2]} intensity={0.5} color="#FFD700" />
              <InfinityOrb state="success" scale={1.2} />
            </Canvas>
          </Suspense>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{
              background: INFINITY_COLORS.glassBg,
              border: `1px solid ${INFINITY_COLORS.glassBorder}`,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Star className="w-4 h-4 text-[#FFD700]" />
            <span className="text-sm text-white/80">INFINITY 2026</span>
          </motion.div>
          
          {/* Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
            <span 
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: INFINITY_GRADIENTS.textShine }}
            >
              CHRONOS
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/60 mb-8 max-w-2xl mx-auto">
            El sistema financiero más bello jamás creado. 
            Gestión empresarial con experiencia de usuario premium.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <RippleContainer>
              <motion.button
                className="px-8 py-4 rounded-2xl text-white font-semibold flex items-center gap-2"
                style={{
                  background: INFINITY_GRADIENTS.primary,
                  boxShadow: INFINITY_COLORS.violetGlow ? `0 8px 32px ${INFINITY_COLORS.violetGlow}` : 'none',
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                Comenzar Ahora
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </RippleContainer>
            
            <motion.button
              className="px-8 py-4 rounded-2xl text-white/80 font-medium"
              style={{
                background: INFINITY_COLORS.glassBg,
                border: `1px solid ${INFINITY_COLORS.glassBorder}`,
              }}
              whileHover={{ 
                scale: 1.02, 
                borderColor: INFINITY_COLORS.violet,
              }}
              whileTap={{ scale: 0.98 }}
            >
              Ver Demo
            </motion.button>
          </div>
        </motion.div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
          <motion.div
            className="w-1.5 h-3 rounded-full bg-white/40"
            animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════════════════
// FEATURES SECTION
// ════════════════════════════════════════════════════════════════════════════════════════

const FEATURES = [
  {
    icon: Wallet,
    title: '7 Bóvedas Bancarias',
    description: 'Sistema multi-banco con distribución automática de capital según lógica GYA.',
    color: '#FFD700',
  },
  {
    icon: TrendingUp,
    title: 'Análisis en Tiempo Real',
    description: 'Dashboard con visualizaciones 3D y métricas actualizadas instantáneamente.',
    color: '#8B00FF',
  },
  {
    icon: Shield,
    title: 'Seguridad Enterprise',
    description: 'Autenticación robusta con Firebase y reglas de seguridad estrictas.',
    color: '#FF1493',
  },
  {
    icon: Zap,
    title: '120+ FPS',
    description: 'Rendimiento ultra-suave con animaciones butter smooth en cada interacción.',
    color: '#FFD700',
  },
  {
    icon: Users,
    title: 'Multi-Usuario',
    description: 'Gestión de roles y permisos para equipos empresariales.',
    color: '#8B00FF',
  },
  {
    icon: Sparkles,
    title: 'Experiencia Premium',
    description: 'Diseño inspirado en Vision Pro, Linear y Arc Browser.',
    color: '#FF1493',
  },
]

function FeaturesSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 
            className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent"
            style={{ backgroundImage: INFINITY_GRADIENTS.textShine }}
          >
            Características Premium
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Todo lo que necesitas para gestionar tu empresa de manera eficiente y elegante.
          </p>
        </motion.div>
        
        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <TiltCard className="h-full">
                <div 
                  className="h-full p-6 rounded-3xl"
                  style={{
                    background: INFINITY_COLORS.glassBg,
                    border: `1px solid ${INFINITY_COLORS.glassBorder}`,
                  }}
                >
                  <GlowPulse color={feature.color} intensity="low">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: `${feature.color}20` }}
                    >
                      <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
                    </div>
                  </GlowPulse>
                  
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/50">{feature.description}</p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════════════════
// BANK ORBS SECTION
// ════════════════════════════════════════════════════════════════════════════════════════

function BankOrbsSection() {
  return (
    <section className="py-24">
      <BankOrbsGallery
        title="Sistema de Bóvedas"
        subtitle="7 bancos con gestión inteligente de capital"
        onBankClick={(bankId) => console.log('Bank clicked:', bankId)}
      />
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════════════════
// CTA SECTION
// ════════════════════════════════════════════════════════════════════════════════════════

function CTASection() {
  return (
    <section className="py-24 px-4">
      <motion.div
        className="max-w-4xl mx-auto text-center p-12 rounded-[3rem] relative overflow-hidden"
        style={{
          background: INFINITY_COLORS.glassBg,
          border: `1px solid ${INFINITY_COLORS.glassBorder}`,
        }}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        {/* Background glow */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{ background: INFINITY_GRADIENTS.mesh }}
        />
        
        <div className="relative z-10">
          <FloatingElement amplitude={8} duration={4}>
            <Sparkles className="w-12 h-12 mx-auto mb-6 text-[#FFD700]" />
          </FloatingElement>
          
          <h2 
            className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent"
            style={{ backgroundImage: INFINITY_GRADIENTS.textShine }}
          >
            Listo para el Futuro
          </h2>
          
          <p className="text-white/50 mb-8 max-w-xl mx-auto">
            Experimenta la próxima generación de software empresarial. 
            Diseño que inspira, funcionalidad que impulsa.
          </p>
          
          <MagneticHover strength={0.1}>
            <RippleContainer>
              <motion.button
                className="px-10 py-5 rounded-2xl text-lg font-semibold text-white"
                style={{
                  background: INFINITY_GRADIENTS.primary,
                  boxShadow: `0 16px 48px ${INFINITY_COLORS.violetGlow}`,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Acceder al Dashboard
              </motion.button>
            </RippleContainer>
          </MagneticHover>
        </div>
      </motion.div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════════════════
// FOOTER
// ════════════════════════════════════════════════════════════════════════════════════════

function Footer() {
  return (
    <footer className="py-12 px-4 border-t" style={{ borderColor: INFINITY_COLORS.glassBorder }}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: INFINITY_GRADIENTS.primary }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold">CHRONOS INFINITY</span>
        </div>
        
        <p className="text-white/30 text-sm">
          © 2026 CHRONOS. Diseñado con ♥ para el futuro.
        </p>
      </div>
    </footer>
  )
}

// ════════════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════════════

export default function ChronosShowcasePage() {
  const [commandMenuOpen, setCommandMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-12 h-12 text-[#8B00FF]" />
        </motion.div>
      </div>
    )
  }
  
  return (
    <ViewTransitionProvider>
      <LenisProvider>
        <PageTransition type="morph">
          <main className="relative min-h-screen bg-black text-white overflow-x-hidden">
            {/* Particle Background */}
            <Suspense fallback={null}>
              <QuantumDust />
            </Suspense>
            
            {/* Cursor Trail */}
            <CursorTrail />
            
            {/* Header */}
            <FloatingHeader onOpenCommandMenu={() => setCommandMenuOpen(true)} />
            
            {/* Command Menu */}
            <CommandMenu 
              isOpen={commandMenuOpen} 
              onClose={() => setCommandMenuOpen(false)} 
            />
            
            {/* Sections */}
            <HeroSection />
            <FeaturesSection />
            <BankOrbsSection />
            <CTASection />
            <Footer />
          </main>
        </PageTransition>
      </LenisProvider>
    </ViewTransitionProvider>
  )
}
