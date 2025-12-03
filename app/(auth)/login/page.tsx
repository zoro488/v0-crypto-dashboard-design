'use client'

import { useState, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Lock, Mail, Eye, EyeOff, ArrowRight, Check, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import React from 'react'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THE OBSIDIAN GATE - Login Page with Interactive Particles
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Página de login cinematográfica con:
 * - Partículas interactivas que siguen al mouse (orbe 3D)
 * - Panel de vidrio ahumado con estilo premium
 * - Inputs con línea de luz animada
 * - Botón que se transforma en círculo de carga → check
 */

// ═══════════════════════════════════════════════════════════════════════════
// INTERACTIVE PARTICLES - Orbe de partículas que responde al mouse
// ═══════════════════════════════════════════════════════════════════════════

function InteractiveParticles({ count = 10000, radius = 4 }: { count?: number; radius?: number }) {
  const points = React.useRef<THREE.Points>(null!)
  const { mouse, viewport } = useThree()
  
  // Crear posiciones y velocidades iniciales
  const [positions, velocities, originalPositions] = React.useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    const orig = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Distribución esférica
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)
      const r = radius * Math.cbrt(Math.random())
      
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)
      
      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z
      
      orig[i * 3] = x
      orig[i * 3 + 1] = y
      orig[i * 3 + 2] = z
      
      vel[i * 3] = 0
      vel[i * 3 + 1] = 0
      vel[i * 3 + 2] = 0
    }
    
    return [pos, vel, orig]
  }, [count, radius])
  
  // Crear colores con gradiente cyan → purple → pink
  const colors = React.useMemo(() => {
    const cols = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const t = Math.random()
      if (t < 0.33) {
        cols[i * 3] = 0.02 + t * 0.3
        cols[i * 3 + 1] = 0.7 + t * 0.3
        cols[i * 3 + 2] = 0.83
      } else if (t < 0.66) {
        cols[i * 3] = 0.55
        cols[i * 3 + 1] = 0.36
        cols[i * 3 + 2] = 0.96
      } else {
        cols[i * 3] = 0.93
        cols[i * 3 + 1] = 0.28
        cols[i * 3 + 2] = 0.63
      }
    }
    return cols
  }, [count])
  
  useFrame((state, delta) => {
    if (!points.current) return
    
    const positionsArray = points.current.geometry.attributes.position.array as Float32Array
    
    // Posición del mouse en espacio 3D
    const mouseX = (mouse.x * viewport.width) / 2
    const mouseY = (mouse.y * viewport.height) / 2
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      const x = positionsArray[i3]
      const y = positionsArray[i3 + 1]
      const z = positionsArray[i3 + 2]
      
      // Distancia al mouse
      const dx = mouseX - x
      const dy = mouseY - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      // Fuerza de interacción (repulsión cercana)
      const interactionRadius = 3
      if (dist < interactionRadius) {
        const force = (1 - dist / interactionRadius) * 0.1
        velocities[i3] -= dx * force * 0.5
        velocities[i3 + 1] -= dy * force * 0.5
      }
      
      // Fuerza hacia posición original (spring)
      velocities[i3] += (originalPositions[i3] - x) * 0.008
      velocities[i3 + 1] += (originalPositions[i3 + 1] - y) * 0.008
      velocities[i3 + 2] += (originalPositions[i3 + 2] - z) * 0.008
      
      // Damping
      velocities[i3] *= 0.96
      velocities[i3 + 1] *= 0.96
      velocities[i3 + 2] *= 0.96
      
      // Aplicar velocidad
      positionsArray[i3] += velocities[i3]
      positionsArray[i3 + 1] += velocities[i3 + 1]
      positionsArray[i3 + 2] += velocities[i3 + 2]
    }
    
    points.current.geometry.attributes.position.needsUpdate = true
    
    // Rotación lenta del orbe
    points.current.rotation.y += delta * 0.05
    points.current.rotation.x += delta * 0.02
  })
  
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOW INPUT - Input con línea de luz animada
// ═══════════════════════════════════════════════════════════════════════════

function GlowInput({
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  icon: typeof Mail
  type?: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  
  return (
    <div className="relative">
      <div className="relative flex items-center">
        <motion.div
          className="absolute left-4 z-10"
          animate={{
            color: isFocused ? '#06b6d4' : 'rgba(255, 255, 255, 0.3)',
            filter: isFocused ? 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))' : 'none',
          }}
          transition={{ duration: 0.3 }}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
        
        <input
          type={isPassword && !showPassword ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full h-14 pl-12 pr-12 bg-transparent text-white placeholder-white/30 outline-none text-base"
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 text-white/30 hover:text-white/60 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
      
      <motion.div
        className="absolute bottom-0 left-0 h-px"
        style={{ background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)' }}
        initial={{ width: '0%' }}
        animate={{ width: isFocused ? '100%' : '0%' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBMIT BUTTON - Botón con transformación
// ═══════════════════════════════════════════════════════════════════════════

function SubmitButton({ isLoading, isSuccess }: { isLoading: boolean; isSuccess: boolean }) {
  return (
    <motion.button
      type="submit"
      disabled={isLoading || isSuccess}
      className="relative w-full h-14 rounded-xl font-semibold text-white overflow-hidden"
      animate={{
        width: isLoading || isSuccess ? 56 : '100%',
        borderRadius: isLoading || isSuccess ? 28 : 12,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        background: isSuccess 
          ? '#10b981' 
          : 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
        boxShadow: isSuccess
          ? '0 0 40px rgba(16, 185, 129, 0.4)'
          : '0 0 40px rgba(6, 182, 212, 0.3)',
      }}
      whileHover={!isLoading && !isSuccess ? { 
        boxShadow: '0 0 60px rgba(6, 182, 212, 0.5)',
      } : undefined}
      whileTap={!isLoading && !isSuccess ? { scale: 0.98 } : undefined}
    >
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center"
          >
            <Check className="w-6 h-6" />
          </motion.div>
        ) : isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center"
          >
            <motion.div
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <span>Ingresar</span>
            <ArrowRight className="w-5 h-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SOCIAL BUTTON
// ═══════════════════════════════════════════════════════════════════════════

function SocialButton({
  provider,
  icon,
  brandColor,
}: {
  provider: string
  icon: React.ReactNode
  brandColor: string
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.button
      type="button"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
      style={{
        background: isHovered ? `${brandColor}15` : 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${isHovered ? brandColor : 'rgba(255, 255, 255, 0.08)'}`,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        animate={{ filter: isHovered ? 'grayscale(0)' : 'grayscale(1)' }}
        transition={{ duration: 0.3 }}
        style={{ color: isHovered ? brandColor : 'rgba(255, 255, 255, 0.6)' }}
      >
        {icon}
      </motion.div>
      <span 
        className="text-sm font-medium transition-colors duration-300"
        style={{ color: isHovered ? brandColor : 'rgba(255, 255, 255, 0.6)' }}
      >
        {provider}
      </span>
    </motion.button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFETTI
// ═══════════════════════════════════════════════════════════════════════════

function MiniConfetti({ show }: { show: boolean }) {
  if (!show) return null
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${50 + (Math.random() - 0.5) * 30}%`,
            top: '50%',
            background: ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'][i % 4],
          }}
          initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
          animate={{
            y: -200 - Math.random() * 100,
            x: (Math.random() - 0.5) * 200,
            opacity: 0,
            scale: 0,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 1, ease: 'easeOut', delay: i * 0.02 }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsLoading(false)
    setIsSuccess(true)
    setShowConfetti(true)
    
    document.cookie = 'session=demo-session; path=/; max-age=86400'
    
    setTimeout(() => {
      router.push('/')
    }, 1200)
  }
  
  return (
    <main className="flex h-screen w-full overflow-hidden bg-[#030308]">
      <MiniConfetti show={showConfetti} />
      
      {/* ════════════════════════════════════════════════════════════════════
          SECCIÓN IZQUIERDA: ORBE DE PARTÍCULAS INTERACTIVAS
          ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Canvas 
            camera={{ position: [0, 0, 10], fov: 50 }} 
            gl={{ alpha: true, antialias: true }}
            dpr={[1, 2]}
          >
            <Suspense fallback={null}>
              <InteractiveParticles count={12000} radius={4} />
              <ambientLight intensity={0.3} />
            </Suspense>
          </Canvas>
        </div>
        
        {/* Texto flotante sobre las partículas */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative z-10 text-center space-y-6 pointer-events-none select-none"
        >
          <motion.h1 
            className="text-8xl font-bold tracking-tighter"
            style={{
              background: 'linear-gradient(to bottom, #ffffff 0%, rgba(255,255,255,0.1) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.3))',
            }}
          >
            CHRONOS
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ delay: 0.8, duration: 1 }}
            className="h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto max-w-xs"
          />
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-xl text-cyan-200/80 font-light tracking-[0.5em] uppercase"
          >
            Singularity OS
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="flex items-center justify-center gap-2 text-sm text-white/40"
          >
            <Sparkles className="w-4 h-4" />
            <span>Sistema de Gestión Neural</span>
          </motion.div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECCIÓN DERECHA: FORMULARIO DE LOGIN
          ════════════════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Fondo sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Card de vidrio premium */}
          <div 
            className="rounded-3xl p-8 md:p-10"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 0 80px rgba(6, 182, 212, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Header */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Sparkles className="w-8 h-8 text-cyan-400" />
              </motion.div>
              
              <h1 className="text-2xl font-bold text-white mb-2">
                Bienvenido a CHRONOS
              </h1>
              <p className="text-white/40 text-sm">
                Ingresa a tu panel de control financiero
              </p>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <GlowInput
                icon={Mail}
                type="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              
              <GlowInput
                icon={Lock}
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
              
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-white/40 hover:text-cyan-400 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              
              <SubmitButton isLoading={isLoading} isSuccess={isSuccess} />
            </form>
            
            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs uppercase tracking-wider">o continúa con</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            
            {/* Social Auth */}
            <div className="flex gap-4">
              <SocialButton
                provider="Google"
                brandColor="#4285F4"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                }
              />
              <SocialButton
                provider="Microsoft"
                brandColor="#00A4EF"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
                  </svg>
                }
              />
            </div>
            
            {/* Register link */}
            <p className="text-center mt-8 text-white/40 text-sm">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Regístrate
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
