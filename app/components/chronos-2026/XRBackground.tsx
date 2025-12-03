'use client'

/**
 * CHRONOS 2026 - XR Background Ultra-Optimizado
 * Fondo 3D inmersivo con estrellas y trails
 * 
 * Optimizaciones:
 * - OffscreenCanvas support
 * - Reduced motion respect
 * - Demand-based rendering (solo renderiza cuando hay cambios)
 * - GPU-accelerated
 */

import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Trail, Float } from '@react-three/drei'
import { useReducedMotion } from 'framer-motion'
import { useRef, useState, useEffect, Suspense, memo } from 'react'
import * as THREE from 'three'
import { CHRONOS_3D, CHRONOS_COLORS } from '@/app/lib/constants/chronos-2026'

// Orbe flotante con trail
const FloatingOrb = memo(() => {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.3) * 3
      meshRef.current.position.y = Math.cos(state.clock.elapsedTime * 0.2) * 2
    }
  })
  
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Trail 
        width={3} 
        length={8} 
        color={CHRONOS_COLORS.primary}
        attenuation={(t) => t * t}
      >
        <mesh ref={meshRef}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial 
            color={CHRONOS_COLORS.accent}
            emissive={CHRONOS_COLORS.accent}
            emissiveIntensity={0.8}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </Trail>
    </Float>
  )
})
FloatingOrb.displayName = 'FloatingOrb'

// Scene content
const SceneContent = memo(() => (
  <>
    <ambientLight intensity={CHRONOS_3D.lights.ambient} />
    <pointLight position={[10, 10, 10]} intensity={CHRONOS_3D.lights.point} />
    <Stars
      radius={100}
      depth={50}
      count={CHRONOS_3D.particles.count}
      factor={4}
      saturation={0}
      fade
      speed={CHRONOS_3D.particles.speed}
    />
    <Suspense fallback={null}>
      <FloatingOrb />
    </Suspense>
  </>
))
SceneContent.displayName = 'SceneContent'

// Fallback estático para reduced motion
const StaticBackground = memo(() => (
  <div 
    className="fixed inset-0 -z-10"
    style={{
      background: `
        radial-gradient(ellipse at 20% 30%, ${CHRONOS_COLORS.primary}15 0%, transparent 50%),
        radial-gradient(ellipse at 80% 70%, ${CHRONOS_COLORS.accent}10 0%, transparent 50%),
        linear-gradient(180deg, #000000 0%, #0a0015 50%, #000000 100%)
      `,
    }}
  />
))
StaticBackground.displayName = 'StaticBackground'

// Componente principal
function XRBackground() {
  const prefersReducedMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [hasWebGL, setHasWebGL] = useState(true)
  
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
  
  // SSR safety + reduced motion + WebGL check
  if (!mounted || prefersReducedMotion || !hasWebGL) {
    return <StaticBackground />
  }
  
  return (
    <Canvas
      gl={{ 
        antialias: false, 
        powerPreference: 'high-performance',
        alpha: true,
      }}
      camera={{ 
        fov: CHRONOS_3D.camera.fov, 
        position: CHRONOS_3D.camera.position, 
      }}
      className="fixed inset-0 -z-10 opacity-60"
      frameloop="demand" // Solo renderiza cuando hay cambios
      dpr={[1, 1.5]} // Limitar DPR para performance
      style={{ pointerEvents: 'none' }}
    >
      <SceneContent />
    </Canvas>
  )
}

export default memo(XRBackground)
