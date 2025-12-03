'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚀 CHRONOS 2026 ULTRA - BACKGROUND 3D INMERSIVO
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Fondo 3D con partículas, estrellas y efectos de profundidad
 * Optimizado para 60fps con demand rendering
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Float, Trail } from '@react-three/drei'
import { useReducedMotion } from 'framer-motion'
import { useRef, useState, useEffect, Suspense, memo, useMemo } from 'react'
import * as THREE from 'three'
import { C26_COLORS, C26_3D } from '@/app/lib/constants/chronos-2026-ultra'

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING ORB WITH TRAIL
// ═══════════════════════════════════════════════════════════════════════════

const FloatingOrb = memo(({ color = C26_COLORS.cyan, speed = 1, offset = 0 }: { 
  color?: string
  speed?: number
  offset?: number 
}) => {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime * speed + offset
      meshRef.current.position.x = Math.sin(t * 0.3) * 4
      meshRef.current.position.y = Math.cos(t * 0.2) * 3
      meshRef.current.position.z = Math.sin(t * 0.4) * 2
    }
  })
  
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Trail 
        width={4} 
        length={10} 
        color={color}
        attenuation={(t) => t * t}
      >
        <mesh ref={meshRef}>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshStandardMaterial 
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.9}
          />
        </mesh>
      </Trail>
    </Float>
  )
})
FloatingOrb.displayName = 'FloatingOrb'

// ═══════════════════════════════════════════════════════════════════════════
// PARTICLE FIELD
// ═══════════════════════════════════════════════════════════════════════════

const ParticleField = memo(() => {
  const pointsRef = useRef<THREE.Points>(null)
  
  const geometry = useMemo(() => {
    const count = 500
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    const colorCyan = new THREE.Color(C26_COLORS.cyan)
    const colorMagenta = new THREE.Color(C26_COLORS.magenta)
    const colorViolet = new THREE.Color(C26_COLORS.violet)
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 50
      positions[i3 + 1] = (Math.random() - 0.5) * 50
      positions[i3 + 2] = (Math.random() - 0.5) * 50
      
      const colorChoice = Math.random()
      const color = colorChoice < 0.33 ? colorCyan : colorChoice < 0.66 ? colorMagenta : colorViolet
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
    }
    
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    return geo
  }, [])
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1
    }
  })
  
  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
})
ParticleField.displayName = 'ParticleField'

// ═══════════════════════════════════════════════════════════════════════════
// SCENE CONTENT
// ═══════════════════════════════════════════════════════════════════════════

const SceneContent = memo(() => (
  <>
    {/* Lighting */}
    <ambientLight intensity={0.3} />
    <pointLight position={[10, 10, 10]} intensity={0.5} color={C26_COLORS.cyan} />
    <pointLight position={[-10, -10, -10]} intensity={0.3} color={C26_COLORS.magenta} />
    
    {/* Stars background */}
    <Stars
      radius={150}
      depth={60}
      count={2000}
      factor={4}
      saturation={0}
      fade
      speed={0.5}
    />
    
    {/* Particle field */}
    <ParticleField />
    
    {/* Floating orbs */}
    <Suspense fallback={null}>
      <FloatingOrb color={C26_COLORS.cyan} speed={1} offset={0} />
      <FloatingOrb color={C26_COLORS.magenta} speed={0.8} offset={Math.PI} />
      <FloatingOrb color={C26_COLORS.violet} speed={1.2} offset={Math.PI / 2} />
    </Suspense>
    
    {/* Fog for depth */}
    <fog attach="fog" args={['#000000', 20, 100]} />
  </>
))
SceneContent.displayName = 'SceneContent'

// ═══════════════════════════════════════════════════════════════════════════
// STATIC FALLBACK
// ═══════════════════════════════════════════════════════════════════════════

const StaticBackground = memo(() => (
  <div 
    className="fixed inset-0 pointer-events-none"
    style={{
      background: `
        radial-gradient(ellipse at 20% 30%, ${C26_COLORS.cyanMuted} 0%, transparent 50%),
        radial-gradient(ellipse at 80% 70%, ${C26_COLORS.magentaMuted} 0%, transparent 50%),
        radial-gradient(ellipse at 50% 50%, ${C26_COLORS.violetMuted} 0%, transparent 40%),
        linear-gradient(180deg, ${C26_COLORS.void} 0%, ${C26_COLORS.voidSoft} 50%, ${C26_COLORS.void} 100%)
      `,
      zIndex: -10,
    }}
  />
))
StaticBackground.displayName = 'StaticBackground'

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function UltraBackground() {
  const prefersReducedMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [hasWebGL, setHasWebGL] = useState(true)
  
  useEffect(() => {
    setMounted(true)
    
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
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
        stencil: false,
        depth: true,
      }}
      camera={{ 
        fov: C26_3D.camera.fov, 
        position: C26_3D.camera.position,
        near: C26_3D.camera.near,
        far: C26_3D.camera.far,
      }}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: -10,
        opacity: 0.5,
      }}
      frameloop="demand"
      dpr={[1, 1.5]}
    >
      <SceneContent />
    </Canvas>
  )
}

export default memo(UltraBackground)
