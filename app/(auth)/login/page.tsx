'use client'

import { useState, Suspense, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Lock, Mail, Eye, EyeOff, ArrowRight, Check, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import React from 'react'
import dynamic from 'next/dynamic'
import { ChronosLogo } from '@/app/components/ui/ChronosLogo'

// Logo 3D con partículas de diamante/cromo (carga dinámica para SSR)
const DiamondChromeLogo = dynamic(
  () => import('@/app/components/3d/DiamondChromeLogo'),
  { ssr: false, loading: () => <LogoPlaceholder /> },
)

// Placeholder mientras carga el logo 3D
function LogoPlaceholder() {
  return (
    <div className="h-32 w-full flex items-center justify-center">
      <ChronosLogo size="xl" animated glow />
    </div>
  )
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LIQUID CHROME NEBULA - Ultra Interactive Login Experience
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Experiencia de login con:
 * - Partículas cromadas tipo mercurio líquido/espejo reflejante
 * - Física avanzada: atracción magnética, ondas expansivas, vórtices
 * - Interactividad ultra-reactiva al cursor
 * - Efecto de estela y resplandor dinámico
 */

// ═══════════════════════════════════════════════════════════════════════════
// LIQUID CHROME PARTICLES - Sistema de partículas ultra-interactivo
// ═══════════════════════════════════════════════════════════════════════════

function LiquidChromeParticles({ count = 12000 }: { count?: number }) {
  const points = React.useRef<THREE.Points>(null!)
  const glowPoints = React.useRef<THREE.Points>(null!)
  const { mouse, viewport, clock } = useThree()
  
  // Mouse tracking suavizado con historial para estelas
  const mouseHistory = React.useRef<{x: number, y: number, time: number}[]>([])
  const smoothMouse = React.useRef({ x: 0, y: 0, vx: 0, vy: 0 })
  const prevMouse = React.useRef({ x: 0, y: 0 })
  
  // Sistema principal de partículas
  const [particleData] = React.useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const originalPositions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const masses = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Distribución esférica con concentración variable
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)
      const r = Math.pow(Math.random(), 0.7) * 5
      
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.8
      const z = r * Math.cos(phi)
      
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      
      originalPositions[i * 3] = x
      originalPositions[i * 3 + 1] = y
      originalPositions[i * 3 + 2] = z
      
      // Colores CHROME/ESPEJO - plateado brillante con reflejos
      // Gama de grises metálicos a blancos brillantes
      const brightness = 0.75 + Math.random() * 0.25
      const chromeVariation = Math.random()
      
      if (chromeVariation < 0.4) {
        // Plata pura brillante
        colors[i * 3] = 0.92 * brightness
        colors[i * 3 + 1] = 0.92 * brightness
        colors[i * 3 + 2] = 0.95 * brightness
      } else if (chromeVariation < 0.7) {
        // Chrome con leve tinte cálido (como espejo real)
        colors[i * 3] = 0.95 * brightness
        colors[i * 3 + 1] = 0.93 * brightness
        colors[i * 3 + 2] = 0.90 * brightness
      } else if (chromeVariation < 0.9) {
        // Blanco brillante puro
        colors[i * 3] = 1.0 * brightness
        colors[i * 3 + 1] = 1.0 * brightness
        colors[i * 3 + 2] = 1.0 * brightness
      } else {
        // Highlight especular ultra brillante
        colors[i * 3] = 1.0
        colors[i * 3 + 1] = 1.0
        colors[i * 3 + 2] = 1.0
      }
      
      velocities[i * 3] = 0
      velocities[i * 3 + 1] = 0
      velocities[i * 3 + 2] = 0
      
      sizes[i] = 0.02 + Math.random() * 0.04
      phases[i] = Math.random() * Math.PI * 2
      masses[i] = 0.5 + Math.random() * 1.5
    }
    
    return [{ positions, colors, velocities, originalPositions, sizes, phases, masses }]
  }, [count])

  // Partículas de resplandor interior
  const glowCount = Math.floor(count * 0.15)
  const [glowData] = React.useMemo(() => {
    const positions = new Float32Array(glowCount * 3)
    const colors = new Float32Array(glowCount * 3)
    const velocities = new Float32Array(glowCount * 3)
    
    for (let i = 0; i < glowCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)
      const r = Math.pow(Math.random(), 1.5) * 2
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7
      positions[i * 3 + 2] = r * Math.cos(phi)
      
      // Colores ultra brillantes para el núcleo
      colors[i * 3] = 1.0
      colors[i * 3 + 1] = 1.0
      colors[i * 3 + 2] = 1.0
      
      velocities[i * 3] = 0
      velocities[i * 3 + 1] = 0
      velocities[i * 3 + 2] = 0
    }
    
    return [{ positions, colors, velocities }]
  }, [glowCount])
  
  useFrame((state, delta) => {
    const time = clock.getElapsedTime()
    
    // Calcular velocidad del mouse para efectos de estela
    const mouseVelX = mouse.x - prevMouse.current.x
    const mouseVelY = mouse.y - prevMouse.current.y
    const mouseSpeed = Math.sqrt(mouseVelX * mouseVelX + mouseVelY * mouseVelY)
    prevMouse.current = { x: mouse.x, y: mouse.y }
    
    // Suavizado del mouse con inercia
    const smoothFactor = 0.12
    smoothMouse.current.vx = (mouse.x - smoothMouse.current.x) * 0.3
    smoothMouse.current.vy = (mouse.y - smoothMouse.current.y) * 0.3
    smoothMouse.current.x += (mouse.x - smoothMouse.current.x) * smoothFactor
    smoothMouse.current.y += (mouse.y - smoothMouse.current.y) * smoothFactor
    
    // Historial del mouse para efectos de estela
    mouseHistory.current.push({ 
      x: smoothMouse.current.x, 
      y: smoothMouse.current.y, 
      time, 
    })
    if (mouseHistory.current.length > 20) mouseHistory.current.shift()
    
    const mouseX = (smoothMouse.current.x * viewport.width) / 2
    const mouseY = (smoothMouse.current.y * viewport.height) / 2
    const mouseVelMag = Math.sqrt(smoothMouse.current.vx ** 2 + smoothMouse.current.vy ** 2)
    
    // Actualizar partículas principales con física avanzada
    if (points.current) {
      const posArray = points.current.geometry.attributes.position.array as Float32Array
      const colorArray = points.current.geometry.attributes.color.array as Float32Array
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const x = posArray[i3]
        const y = posArray[i3 + 1]
        const z = posArray[i3 + 2]
        const mass = particleData.masses[i]
        
        // Vector hacia el mouse
        const dx = mouseX - x
        const dy = mouseY - y
        const dist = Math.sqrt(dx * dx + dy * dy + 0.1)
        
        // === FÍSICA AVANZADA ===
        
        // 1. Atracción magnética - las partículas son atraídas hacia el cursor
        const attractionRadius = 5
        if (dist < attractionRadius) {
          const attractionStrength = Math.pow(1 - dist / attractionRadius, 2) * 0.25 / mass
          particleData.velocities[i3] += dx * attractionStrength * 0.15
          particleData.velocities[i3 + 1] += dy * attractionStrength * 0.15
        }
        
        // 2. Repulsión cercana - evitar que se amontonen en el cursor
        const repulsionRadius = 1.5
        if (dist < repulsionRadius) {
          const repulsionStrength = Math.pow(1 - dist / repulsionRadius, 3) * 0.4
          particleData.velocities[i3] -= dx * repulsionStrength / dist
          particleData.velocities[i3 + 1] -= dy * repulsionStrength / dist
          particleData.velocities[i3 + 2] += (Math.random() - 0.5) * repulsionStrength * 0.5
        }
        
        // 3. Efecto de vórtice - rotación alrededor del cursor
        const vortexRadius = 3.5
        if (dist < vortexRadius && dist > 0.5) {
          const vortexStrength = (1 - dist / vortexRadius) * 0.08 * (1 + mouseVelMag * 3)
          const perpX = -dy / dist
          const perpY = dx / dist
          particleData.velocities[i3] += perpX * vortexStrength
          particleData.velocities[i3 + 1] += perpY * vortexStrength
        }
        
        // 4. Onda expansiva basada en velocidad del mouse
        if (mouseSpeed > 0.01) {
          const waveRadius = 4
          if (dist < waveRadius) {
            const waveForce = mouseSpeed * 15 * Math.pow(1 - dist / waveRadius, 2)
            particleData.velocities[i3] -= dx / dist * waveForce * 0.1
            particleData.velocities[i3 + 1] -= dy / dist * waveForce * 0.1
          }
        }
        
        // 5. Fuerza de retorno elástica a posición original
        const origX = particleData.originalPositions[i3]
        const origY = particleData.originalPositions[i3 + 1]
        const origZ = particleData.originalPositions[i3 + 2]
        const returnStrength = 0.008
        particleData.velocities[i3] += (origX - x) * returnStrength
        particleData.velocities[i3 + 1] += (origY - y) * returnStrength
        particleData.velocities[i3 + 2] += (origZ - z) * returnStrength
        
        // 6. Movimiento ondulatorio natural
        const wave = Math.sin(time * 0.8 + particleData.phases[i]) * 0.003
        particleData.velocities[i3 + 1] += wave
        
        // 7. Damping - fricción para movimiento fluido
        const damping = 0.94
        particleData.velocities[i3] *= damping
        particleData.velocities[i3 + 1] *= damping
        particleData.velocities[i3 + 2] *= damping
        
        // Aplicar velocidad
        posArray[i3] += particleData.velocities[i3]
        posArray[i3 + 1] += particleData.velocities[i3 + 1]
        posArray[i3 + 2] += particleData.velocities[i3 + 2]
        
        // === EFECTOS VISUALES DINÁMICOS ===
        
        // Brillo dinámico basado en proximidad y velocidad
        const particleVel = Math.sqrt(
          particleData.velocities[i3] ** 2 + 
          particleData.velocities[i3 + 1] ** 2 + 
          particleData.velocities[i3 + 2] ** 2,
        )
        
        // Efecto chrome: brillo aumenta cerca del cursor
        const proximityGlow = dist < attractionRadius ? 
          1 + (1 - dist / attractionRadius) * 0.6 : 1
        
        // Efecto de velocidad: partículas rápidas brillan más
        const velocityGlow = 1 + particleVel * 8
        
        const totalGlow = Math.min(proximityGlow * velocityGlow, 1.5)
        
        // Aplicar brillo con efecto espejo/chrome
        const baseR = particleData.colors[i3]
        const baseG = particleData.colors[i3 + 1]
        const baseB = particleData.colors[i3 + 2]
        
        colorArray[i3] = Math.min(baseR * totalGlow, 1)
        colorArray[i3 + 1] = Math.min(baseG * totalGlow, 1)
        colorArray[i3 + 2] = Math.min(baseB * totalGlow, 1)
      }
      
      points.current.geometry.attributes.position.needsUpdate = true
      points.current.geometry.attributes.color.needsUpdate = true
      
      // Rotación lenta del conjunto
      points.current.rotation.y += delta * 0.015
    }
    
    // Actualizar partículas de resplandor
    if (glowPoints.current) {
      const glowPosArray = glowPoints.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < glowCount; i++) {
        const i3 = i * 3
        const x = glowPosArray[i3]
        const y = glowPosArray[i3 + 1]
        const z = glowPosArray[i3 + 2]
        
        // Pulsación del núcleo
        const pulse = Math.sin(time * 1.2 + i * 0.05) * 0.015
        const centerDist = Math.sqrt(x*x + y*y + z*z)
        
        if (centerDist > 0.01) {
          glowData.velocities[i3] += (x / centerDist) * pulse
          glowData.velocities[i3 + 1] += (y / centerDist) * pulse
          glowData.velocities[i3 + 2] += (z / centerDist) * pulse
        }
        
        // Atracción suave hacia el mouse
        const dx = mouseX * 0.3 - x
        const dy = mouseY * 0.3 - y
        glowData.velocities[i3] += dx * 0.002
        glowData.velocities[i3 + 1] += dy * 0.002
        
        // Retorno al centro
        glowData.velocities[i3] -= x * 0.01
        glowData.velocities[i3 + 1] -= y * 0.01
        glowData.velocities[i3 + 2] -= z * 0.01
        
        // Damping
        glowData.velocities[i3] *= 0.92
        glowData.velocities[i3 + 1] *= 0.92
        glowData.velocities[i3 + 2] *= 0.92
        
        glowPosArray[i3] += glowData.velocities[i3]
        glowPosArray[i3 + 1] += glowData.velocities[i3 + 1]
        glowPosArray[i3 + 2] += glowData.velocities[i3 + 2]
      }
      
      glowPoints.current.geometry.attributes.position.needsUpdate = true
      glowPoints.current.rotation.y -= delta * 0.025
    }
  })
  
  return (
    <group>
      {/* Partículas principales chrome */}
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particleData.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[particleData.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.92}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Núcleo brillante */}
      <points ref={glowPoints}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[glowData.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[glowData.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          vertexColors
          transparent
          opacity={0.95}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Iluminación cromada */}
      <pointLight position={[0, 0, 0]} color="#FFFFFF" intensity={3} distance={12} />
      <pointLight position={[3, 2, -2]} color="#F8F8FF" intensity={1.5} distance={10} />
      <pointLight position={[-3, -1, 2]} color="#FFFFF0" intensity={1.2} distance={8} />
      <pointLight position={[0, 3, 0]} color="#FFFFFF" intensity={1} distance={6} />
    </group>
  )
}

// Estrellas de fondo con parpadeo
function BackgroundStars({ count = 300 }: { count?: number }) {
  const starsRef = React.useRef<THREE.Points>(null!)
  
  const [positions, originalBrightness] = React.useMemo(() => {
    const pos = new Float32Array(count * 3)
    const brightness = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60
      pos[i * 3 + 2] = -15 - Math.random() * 25
      brightness[i] = 0.3 + Math.random() * 0.7
    }
    
    return [pos, brightness]
  }, [count])
  
  useFrame((state) => {
    if (starsRef.current) {
      const time = state.clock.getElapsedTime()
      starsRef.current.rotation.z = time * 0.005
      
      // Opacidad pulsante para parpadeo
      const material = starsRef.current.material as THREE.PointsMaterial
      material.opacity = 0.5 + Math.sin(time * 0.5) * 0.1
    }
  })
  
  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#FFFFFF"
        transparent
        opacity={0.6}
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
            color: isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
            filter: isFocused ? 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))' : 'none',
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
        style={{ 
          background: 'linear-gradient(90deg, transparent, #FFFFFF, #E8E8E8, #FFFFFF, transparent)',
        }}
        initial={{ width: '0%', opacity: 0 }}
        animate={{ 
          width: isFocused ? '100%' : '0%',
          opacity: isFocused ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBMIT BUTTON - Botón Chrome Espejo estilo Apple
// ═══════════════════════════════════════════════════════════════════════════

function SubmitButton({ isLoading, isSuccess }: { isLoading: boolean; isSuccess: boolean }) {
  return (
    <motion.button
      type="submit"
      disabled={isLoading || isSuccess}
      className="relative w-full h-14 rounded-xl font-semibold overflow-hidden"
      animate={{
        width: isLoading || isSuccess ? 56 : '100%',
        borderRadius: isLoading || isSuccess ? 28 : 12,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        // Gradiente de espejo cromado tipo Apple
        background: isSuccess 
          ? '#10b981' 
          : 'linear-gradient(180deg, #F8F8F8 0%, #E8E8E8 20%, #D0D0D0 45%, #888888 50%, #A0A0A0 55%, #C8C8C8 80%, #F0F0F0 100%)',
        color: isSuccess ? '#ffffff' : '#1a1a1a',
        boxShadow: isSuccess
          ? '0 0 40px rgba(16, 185, 129, 0.4)'
          : 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.3), 0 4px 20px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0,0,0,0.3)',
        border: isSuccess ? 'none' : '1px solid rgba(255,255,255,0.3)',
        textShadow: isSuccess ? 'none' : '0 1px 0 rgba(255,255,255,0.5)',
      }}
      whileHover={!isLoading && !isSuccess ? { 
        filter: 'brightness(1.15)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.2), 0 8px 30px rgba(0, 0, 0, 0.4), 0 0 40px rgba(255, 255, 255, 0.15)',
        y: -2,
      } : undefined}
      whileTap={!isLoading && !isSuccess ? { scale: 0.98, filter: 'brightness(0.95)' } : undefined}
    >
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center text-white"
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
              className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-600 rounded-full"
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
            className="flex items-center justify-center gap-2 text-gray-800 font-bold"
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
            background: ['#FFFFFF', '#E0E0E0', '#10b981', '#C0C0C0'][i % 4],
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
    <main className="flex h-screen w-full overflow-hidden bg-[#0A0A0A]">
      <MiniConfetti show={showConfetti} />
      
      {/* ════════════════════════════════════════════════════════════════════
          SECCIÓN IZQUIERDA: LIQUID CHROME NEBULA INTERACTIVA
          ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Canvas 
            camera={{ position: [0, 0, 10], fov: 50 }} 
            gl={{ alpha: true, antialias: true }}
            dpr={[1, 2]}
          >
            <Suspense fallback={null}>
              <LiquidChromeParticles count={12000} />
              <BackgroundStars count={300} />
              <ambientLight intensity={0.3} color="#FFFFFF" />
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
          <ChronosLogo size="2xl" animated glow />
          <motion.h1 
            className="text-7xl font-bold tracking-[0.15em]"
            style={{
              background: 'linear-gradient(to bottom, #FFFFFF 0%, #808080 50%, #404040 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.3))',
            }}
          >
            CHRONOS
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ delay: 0.8, duration: 1 }}
            className="h-px mx-auto max-w-xs"
            style={{ 
              background: 'linear-gradient(90deg, transparent, #FFFFFF, #C0C0C0, #FFFFFF, transparent)',
            }}
          />
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-xl font-light tracking-[0.5em] uppercase"
            style={{ color: 'rgba(200, 200, 200, 0.9)' }}
          >
            Singularity OS
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="flex items-center justify-center gap-2 text-sm"
            style={{ color: 'rgba(180, 180, 180, 0.6)' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: '#FFFFFF' }} />
            <span>Sistema de Gestión Neural</span>
          </motion.div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECCIÓN DERECHA: FORMULARIO DE LOGIN
          ════════════════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Fondo sutil chrome */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, rgba(60,60,60,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(40,40,40,0.1) 0%, transparent 50%)',
          }}
        />
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Card de vidrio premium chrome */}
          <div 
            className="rounded-3xl p-8 md:p-10"
            style={{
              background: 'linear-gradient(145deg, rgba(25,25,25,0.9) 0%, rgba(15,15,15,0.95) 100%)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)',
            }}
          >
            {/* Header con Logo DiamondChrome */}
            <div className="text-center mb-8">
              {/* Logo 3D de partículas cromadas */}
              <div className="relative -mx-8 -mt-4 mb-4">
                <DiamondChromeLogo height="h-40" />
              </div>
              
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
                  className="text-sm text-white/40 hover:text-white transition-colors"
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
              <Link href="/register" className="text-white/80 hover:text-white transition-colors">
                Regístrate
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
