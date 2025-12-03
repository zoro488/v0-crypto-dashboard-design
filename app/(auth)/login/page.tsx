'use client'

import { useState, Suspense, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Lock, Mail, Eye, EyeOff, ArrowRight, Check, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import React from 'react'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STELLAR GLASS NEBULA - Premium Login Experience
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Experiencia de login cinematográfica con:
 * - Nebulosa espacial con paleta plateada/glass (plata, hielo, titanio, cristal)
 * - Física fluida con atracción/repulsión hacia el cursor
 * - Múltiples capas de partículas con diferentes velocidades
 * - Iluminación volumétrica fría y efectos de cristal
 */

// ═══════════════════════════════════════════════════════════════════════════
// COSMIC NEBULA - Sistema de partículas con física fluida
// ═══════════════════════════════════════════════════════════════════════════

function CosmicNebula({ count = 8000 }: { count?: number }) {
  const points = React.useRef<THREE.Points>(null!)
  const innerPoints = React.useRef<THREE.Points>(null!)
  const { mouse, viewport, clock } = useThree()
  
  // Sistema principal de partículas - nebulosa exterior
  const [mainData] = React.useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    
    // Paleta espacial plateada/glass: plata, hielo, titanio, cristal azulado
    const palette = [
      { r: 0.85, g: 0.88, b: 0.95 },  // Plata helada
      { r: 0.75, g: 0.82, b: 0.92 },  // Azul cristal
      { r: 0.90, g: 0.92, b: 0.98 },  // Blanco espacial
      { r: 0.60, g: 0.68, b: 0.80 },  // Titanio
      { r: 0.70, g: 0.78, b: 0.90 },  // Hielo azulado
      { r: 0.95, g: 0.97, b: 1.0 },   // Blanco puro cristalino
      { r: 0.55, g: 0.65, b: 0.82 },  // Acero azulado
      { r: 0.80, g: 0.85, b: 0.95 },  // Glass frost
    ]
    
    for (let i = 0; i < count; i++) {
      // Distribución nebulosa con múltiples brazos espirales
      const arm = Math.floor(Math.random() * 3)
      const armAngle = (arm * Math.PI * 2) / 3
      const spiralAngle = Math.random() * Math.PI * 4
      const radius = 2 + Math.pow(Math.random(), 0.5) * 6
      const spread = Math.random() * 1.5
      
      const angle = armAngle + spiralAngle * 0.15 + Math.random() * 0.5
      
      positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * spread
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3 + Math.sin(spiralAngle * 0.5) * 0.5
      positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * spread
      
      // Color de la paleta con variación
      const colorIndex = Math.floor(Math.random() * palette.length)
      const color = palette[colorIndex]
      const brightness = 0.7 + Math.random() * 0.3
      
      colors[i * 3] = color.r * brightness
      colors[i * 3 + 1] = color.g * brightness
      colors[i * 3 + 2] = color.b * brightness
      
      velocities[i * 3] = 0
      velocities[i * 3 + 1] = 0
      velocities[i * 3 + 2] = 0
      
      sizes[i] = 0.015 + Math.random() * 0.03
      phases[i] = Math.random() * Math.PI * 2
    }
    
    return [{ positions, colors, velocities, sizes, phases }]
  }, [count])

  // Sistema interno de partículas - núcleo brillante
  const innerCount = Math.floor(count * 0.3)
  const [innerData] = React.useMemo(() => {
    const positions = new Float32Array(innerCount * 3)
    const colors = new Float32Array(innerCount * 3)
    const velocities = new Float32Array(innerCount * 3)
    
    for (let i = 0; i < innerCount; i++) {
      // Distribución más concentrada en el centro
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)
      const r = Math.pow(Math.random(), 2) * 2.5
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6
      positions[i * 3 + 2] = r * Math.cos(phi)
      
      // Colores más brillantes en el centro (blancos plateados cristalinos)
      const intensity = 1 - (r / 2.5) * 0.3
      colors[i * 3] = 0.90 * intensity
      colors[i * 3 + 1] = 0.93 * intensity
      colors[i * 3 + 2] = 1.0 * intensity
      
      velocities[i * 3] = 0
      velocities[i * 3 + 1] = 0
      velocities[i * 3 + 2] = 0
    }
    
    return [{ positions, colors, velocities }]
  }, [innerCount])
  
  // Posición del mouse suavizada
  const smoothMouse = React.useRef({ x: 0, y: 0 })
  
  useFrame((state, delta) => {
    const time = clock.getElapsedTime()
    
    // Suavizar movimiento del mouse
    smoothMouse.current.x += (mouse.x - smoothMouse.current.x) * 0.08
    smoothMouse.current.y += (mouse.y - smoothMouse.current.y) * 0.08
    
    const mouseX = (smoothMouse.current.x * viewport.width) / 2
    const mouseY = (smoothMouse.current.y * viewport.height) / 2
    
    // Actualizar partículas principales
    if (points.current) {
      const posArray = points.current.geometry.attributes.position.array as Float32Array
      const colorArray = points.current.geometry.attributes.color.array as Float32Array
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const x = posArray[i3]
        const y = posArray[i3 + 1]
        const z = posArray[i3 + 2]
        
        // Distancia al mouse en 2D proyectada
        const dx = mouseX - x
        const dy = mouseY - y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        // Física fluida: atracción suave + turbulencia
        const interactionRadius = 4
        if (dist < interactionRadius) {
          const force = Math.pow(1 - dist / interactionRadius, 2) * 0.15
          // Atracción orbital en lugar de repulsión directa
          const angle = Math.atan2(dy, dx) + Math.PI * 0.5
          mainData.velocities[i3] += Math.cos(angle) * force * 0.3 + dx * force * 0.1
          mainData.velocities[i3 + 1] += Math.sin(angle) * force * 0.3 + dy * force * 0.1
          mainData.velocities[i3 + 2] += (Math.random() - 0.5) * force * 0.1
        }
        
        // Movimiento orbital natural
        const orbitSpeed = 0.0003 + (i % 100) * 0.00001
        const centerDist = Math.sqrt(x * x + z * z)
        if (centerDist > 0.1) {
          const orbitAngle = Math.atan2(z, x)
          mainData.velocities[i3] += -Math.sin(orbitAngle) * orbitSpeed * centerDist
          mainData.velocities[i3 + 2] += Math.cos(orbitAngle) * orbitSpeed * centerDist
        }
        
        // Turbulencia ondulante
        const turbulence = Math.sin(time * 0.5 + mainData.phases[i]) * 0.0005
        mainData.velocities[i3 + 1] += turbulence
        
        // Damping más suave para movimiento fluido
        mainData.velocities[i3] *= 0.985
        mainData.velocities[i3 + 1] *= 0.985
        mainData.velocities[i3 + 2] *= 0.985
        
        // Fuerza restauradora suave al centro
        mainData.velocities[i3] -= x * 0.0002
        mainData.velocities[i3 + 1] -= y * 0.0003
        mainData.velocities[i3 + 2] -= z * 0.0002
        
        // Aplicar velocidad
        posArray[i3] += mainData.velocities[i3]
        posArray[i3 + 1] += mainData.velocities[i3 + 1]
        posArray[i3 + 2] += mainData.velocities[i3 + 2]
        
        // Pulso de brillo basado en distancia al mouse
        if (dist < interactionRadius) {
          const glow = 1 + (1 - dist / interactionRadius) * 0.5
          const baseColor = mainData.colors[i3]
          colorArray[i3] = Math.min(baseColor * glow, 1)
          colorArray[i3 + 1] = Math.min(mainData.colors[i3 + 1] * glow, 1)
          colorArray[i3 + 2] = Math.min(mainData.colors[i3 + 2] * glow, 1)
        }
      }
      
      points.current.geometry.attributes.position.needsUpdate = true
      points.current.geometry.attributes.color.needsUpdate = true
      points.current.rotation.y += delta * 0.02
    }
    
    // Actualizar núcleo interno
    if (innerPoints.current) {
      const innerPosArray = innerPoints.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < innerCount; i++) {
        const i3 = i * 3
        const x = innerPosArray[i3]
        const y = innerPosArray[i3 + 1]
        const z = innerPosArray[i3 + 2]
        
        // Respiración del núcleo
        const breathe = Math.sin(time * 0.8 + i * 0.01) * 0.002
        innerData.velocities[i3] += (x > 0 ? 1 : -1) * breathe
        innerData.velocities[i3 + 1] += (y > 0 ? 1 : -1) * breathe * 0.5
        innerData.velocities[i3 + 2] += (z > 0 ? 1 : -1) * breathe
        
        // Atracción hacia el centro
        innerData.velocities[i3] -= x * 0.002
        innerData.velocities[i3 + 1] -= y * 0.002
        innerData.velocities[i3 + 2] -= z * 0.002
        
        innerData.velocities[i3] *= 0.95
        innerData.velocities[i3 + 1] *= 0.95
        innerData.velocities[i3 + 2] *= 0.95
        
        innerPosArray[i3] += innerData.velocities[i3]
        innerPosArray[i3 + 1] += innerData.velocities[i3 + 1]
        innerPosArray[i3 + 2] += innerData.velocities[i3 + 2]
      }
      
      innerPoints.current.geometry.attributes.position.needsUpdate = true
      innerPoints.current.rotation.y -= delta * 0.03
      innerPoints.current.rotation.x = Math.sin(time * 0.3) * 0.1
    }
  })
  
  return (
    <group>
      {/* Nebulosa exterior */}
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[mainData.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[mainData.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          vertexColors
          transparent
          opacity={0.85}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Núcleo brillante */}
      <points ref={innerPoints}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[innerData.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[innerData.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.95}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Luz central volumétrica - tonos fríos plateados */}
      <pointLight position={[0, 0, 0]} color="#E8ECF4" intensity={2.5} distance={10} />
      <pointLight position={[2, 1, -2]} color="#B8C4D8" intensity={1.2} distance={8} />
      <pointLight position={[-2, -1, 2]} color="#D0D8E8" intensity={1} distance={6} />
      <pointLight position={[0, 2, 1]} color="#FFFFFF" intensity={0.8} distance={5} />
    </group>
  )
}

// Estrellas de fondo
function BackgroundStars({ count = 500 }: { count?: number }) {
  const starsRef = React.useRef<THREE.Points>(null!)
  
  const [positions, sizes] = React.useMemo(() => {
    const pos = new Float32Array(count * 3)
    const s = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50
      pos[i * 3 + 2] = -10 - Math.random() * 30
      s[i] = Math.random() * 0.5 + 0.1
    }
    
    return [pos, s]
  }, [count])
  
  useFrame((state) => {
    if (starsRef.current) {
      // Parpadeo sutil
      const time = state.clock.getElapsedTime()
      starsRef.current.rotation.z = time * 0.01
    }
  })
  
  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#E0E8F8"
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
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
            color: isFocused ? '#A8B8D8' : 'rgba(255, 255, 255, 0.3)',
            filter: isFocused ? 'drop-shadow(0 0 8px rgba(168, 184, 216, 0.6))' : 'none',
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
        style={{ background: 'linear-gradient(90deg, #8090B0, #C0D0F0, #8090B0)' }}
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
          : 'linear-gradient(135deg, #6878A0 0%, #A0B0D0 50%, #8090B8 100%)',
        boxShadow: isSuccess
          ? '0 0 40px rgba(16, 185, 129, 0.4)'
          : '0 0 40px rgba(128, 144, 184, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
      }}
      whileHover={!isLoading && !isSuccess ? { 
        boxShadow: '0 0 60px rgba(160, 176, 208, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
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
            background: ['#A8B8D8', '#D0E0F8', '#10b981', '#8090B0'][i % 4],
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
    <main className="flex h-screen w-full overflow-hidden bg-[#050810]">
      <MiniConfetti show={showConfetti} />
      
      {/* ════════════════════════════════════════════════════════════════════
          SECCIÓN IZQUIERDA: NEBULOSA ESPACIAL PLATEADA
          ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Canvas 
            camera={{ position: [0, 0, 10], fov: 50 }} 
            gl={{ alpha: true, antialias: true }}
            dpr={[1, 2]}
          >
            <Suspense fallback={null}>
              <CosmicNebula count={10000} />
              <BackgroundStars count={400} />
              <ambientLight intensity={0.4} color="#D0D8E8" />
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
              background: 'linear-gradient(to bottom, #ffffff 0%, rgba(180,195,220,0.3) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(180,195,220,0.4))',
            }}
          >
            CHRONOS
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ delay: 0.8, duration: 1 }}
            className="h-px mx-auto max-w-xs"
            style={{ background: 'linear-gradient(90deg, transparent, #A0B0D0, transparent)' }}
          />
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-xl font-light tracking-[0.5em] uppercase"
            style={{ color: 'rgba(180, 195, 220, 0.9)' }}
          >
            Singularity OS
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="flex items-center justify-center gap-2 text-sm"
            style={{ color: 'rgba(160, 176, 208, 0.6)' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: '#A8B8D8' }} />
            <span>Sistema de Gestión Neural</span>
          </motion.div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECCIÓN DERECHA: FORMULARIO DE LOGIN
          ════════════════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Fondo sutil plateado espacial */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-400/5 via-transparent to-blue-200/5" />
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Card de vidrio premium plateado */}
          <div 
            className="rounded-3xl p-8 md:p-10"
            style={{
              background: 'rgba(8, 12, 24, 0.75)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(160, 176, 208, 0.12)',
              boxShadow: '0 0 80px rgba(160, 176, 208, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
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
                  background: 'linear-gradient(135deg, rgba(128, 144, 184, 0.15), rgba(180, 195, 220, 0.1))',
                  border: '1px solid rgba(160, 176, 208, 0.2)',
                  boxShadow: '0 0 30px rgba(160, 176, 208, 0.08)',
                }}
              >
                <Sparkles className="w-8 h-8" style={{ color: '#A8B8D8' }} />
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
                  className="text-sm text-white/40 hover:text-slate-300 transition-colors"
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
              <Link href="/register" className="text-slate-300 hover:text-white transition-colors">
                Regístrate
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
