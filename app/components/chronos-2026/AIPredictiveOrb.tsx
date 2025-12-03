'use client'

/**
 * CHRONOS 2026 - AI Predictive Orb
 * Orbe 3D que predice y guía al usuario
 * 
 * Features:
 * - Estados de IA dinámicos (idle, thinking, success, warning, error)
 * - Animaciones basadas en física
 * - Texto predictivo
 * - Responsive y accessible
 */

import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, Text, Float, MeshDistortMaterial } from '@react-three/drei'
import { useState, useEffect, useRef, memo, Suspense } from 'react'
import { useReducedMotion, motion } from 'framer-motion'
import * as THREE from 'three'
import { AI_STATES, CHRONOS_COLORS } from '@/app/lib/constants/chronos-2026'

type AIState = keyof typeof AI_STATES

interface AIPredictiveOrbProps {
  state?: AIState
  message?: string
  visible?: boolean
}

// Orbe 3D con distorsión
const AIOrb = memo(({ state, message }: { state: AIState; message: string }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const stateConfig = AI_STATES[state]
  
  useFrame((frameState) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = frameState.clock.elapsedTime * 0.5
      meshRef.current.rotation.x = Math.sin(frameState.clock.elapsedTime * 0.3) * 0.1
    }
  })
  
  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[1, 64, 64]} scale={stateConfig.scale}>
        <MeshDistortMaterial
          color={stateConfig.color}
          emissive={stateConfig.color}
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
          distort={state === 'thinking' ? 0.4 : 0.2}
          speed={state === 'thinking' ? 4 : 2}
        />
      </Sphere>
      
      {/* Texto flotante */}
      <Text
        position={[0, -1.8, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        {message || stateConfig.label}
      </Text>
    </Float>
  )
})
AIOrb.displayName = 'AIOrb'

// Fallback 2D para reduced motion o sin WebGL
const AIOrb2D = memo(({ state, message }: { state: AIState; message: string }) => {
  const stateConfig = AI_STATES[state]
  
  return (
    <motion.div 
      className="relative flex flex-col items-center justify-center"
      animate={{ scale: [1, stateConfig.scale, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <motion.div
        className="w-16 h-16 rounded-full"
        style={{ 
          background: `radial-gradient(circle at 30% 30%, ${stateConfig.color}80, ${stateConfig.color}40)`,
          boxShadow: `0 0 40px ${stateConfig.color}60`,
        }}
        animate={{
          boxShadow: [
            `0 0 20px ${stateConfig.color}40`,
            `0 0 40px ${stateConfig.color}60`,
            `0 0 20px ${stateConfig.color}40`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span className="mt-3 text-xs font-bold text-white/80 tracking-wider">
        {message || stateConfig.label}
      </span>
    </motion.div>
  )
})
AIOrb2D.displayName = 'AIOrb2D'

function AIPredictiveOrb({ 
  state = 'idle', 
  message = '', 
  visible = true, 
}: AIPredictiveOrbProps) {
  const [mounted, setMounted] = useState(false)
  const [hasWebGL, setHasWebGL] = useState(true)
  const prefersReducedMotion = useReducedMotion()
  
  useEffect(() => {
    setMounted(true)
    
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      setHasWebGL(!!gl)
    } catch {
      setHasWebGL(false)
    }
  }, [])
  
  if (!mounted || !visible) return null
  
  // Usar versión 2D si no hay WebGL o prefiere reduced motion
  if (prefersReducedMotion || !hasWebGL) {
    return (
      <div className="fixed top-8 right-8 z-50 pointer-events-none">
        <AIOrb2D state={state} message={message} />
      </div>
    )
  }
  
  return (
    <motion.div 
      className="fixed top-8 right-8 z-50 pointer-events-none w-32 h-40"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color={CHRONOS_COLORS.accent} />
        
        <Suspense fallback={null}>
          <AIOrb state={state} message={message} />
        </Suspense>
      </Canvas>
    </motion.div>
  )
}

export default memo(AIPredictiveOrb)
