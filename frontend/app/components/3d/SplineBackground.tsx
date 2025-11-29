"use client"

/**
 * 🌌 SPLINE BACKGROUND - Fondo 3D Inmersivo Premium
 * 
 * Este componente proporciona:
 * - Fondo 3D interactivo con Spline o fallback procedural
 * - Efectos de partículas y gradientes animados
 * - Efecto de parallax al mouse
 * - Múltiples variantes visuales
 * - Optimizado para performance
 */

import { Suspense, useRef, useMemo, useCallback, useState, useEffect } from "react"
import Spline from "@splinetool/react-spline"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber"
import * as THREE from "three"

// ============================================================================
// TIPOS
// ============================================================================

type BackgroundVariant = 'spline' | 'cosmic' | 'minimal' | 'grid' | 'waves' | 'nebula'

interface SplineBackgroundProps {
  variant?: BackgroundVariant
  intensity?: number
  color?: string
  interactive?: boolean
  splineUrl?: string
  className?: string
}

// ============================================================================
// COMPONENTE DE PARTÍCULAS CÓSMICAS (SIMPLIFICADO)
// ============================================================================

function CosmicParticles({ count = 500, color = '#3b82f6', intensity = 1 }) {
  const particlesRef = useRef<THREE.Points>(null)
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    const baseColor = new THREE.Color(color)
    const accentColor = new THREE.Color('#a855f7')
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      // Distribución esférica
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = Math.pow(Math.random(), 0.5) * 40
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi) - 20
      
      const colorVariation = new THREE.Color(color).lerp(accentColor, Math.random() * 0.5)
      colors[i3] = colorVariation.r
      colors[i3 + 1] = colorVariation.g
      colors[i3 + 2] = colorVariation.b
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    return geo
  }, [count, color])
  
  useFrame((state) => {
    if (!particlesRef.current) return
    
    const time = state.clock.getElapsedTime()
    particlesRef.current.rotation.y = time * 0.02 * intensity
    particlesRef.current.rotation.x = Math.sin(time * 0.1) * 0.1
  })
  
  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.6 * intensity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ============================================================================
// COMPONENTE DE GRID ANIMADO (SIMPLIFICADO)
// ============================================================================

function GridLine({ geometry, color, intensity }: { geometry: THREE.BufferGeometry; color: string; intensity: number }) {
  const ref = useRef<THREE.Line>(null)
  
  return (
    <primitive 
      object={new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ 
          color, 
          transparent: true, 
          opacity: 0.15 * intensity,
          blending: THREE.AdditiveBlending
        })
      )}
      ref={ref}
    />
  )
}

function AnimatedGrid({ color = '#3b82f6', intensity = 1 }) {
  const groupRef = useRef<THREE.Group>(null)
  
  const lineGeometries = useMemo(() => {
    const result: THREE.BufferGeometry[] = []
    const size = 50
    const divisions = 15
    const step = size / divisions
    
    for (let i = -size / 2; i <= size / 2; i += step) {
      // Líneas horizontales
      const hGeo = new THREE.BufferGeometry()
      hGeo.setAttribute('position', new THREE.BufferAttribute(
        new Float32Array([-size / 2, 0, i, size / 2, 0, i]), 3
      ))
      result.push(hGeo)
      
      // Líneas verticales
      const vGeo = new THREE.BufferGeometry()
      vGeo.setAttribute('position', new THREE.BufferAttribute(
        new Float32Array([i, 0, -size / 2, i, 0, size / 2]), 3
      ))
      result.push(vGeo)
    }
    
    return result
  }, [])
  
  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.getElapsedTime()
    
    groupRef.current.children.forEach((child, i) => {
      const baseY = Math.sin(time * 0.5 + i * 0.1) * 0.3
      child.position.y = baseY
    })
  })
  
  return (
    <group ref={groupRef} position={[0, -5, -10]} rotation-x={-Math.PI / 3}>
      {lineGeometries.map((geo, i) => (
        <GridLine key={i} geometry={geo} color={color} intensity={intensity} />
      ))}
    </group>
  )
}

// ============================================================================
// COMPONENTE DE ONDAS
// ============================================================================

function WaveField({ color = '#3b82f6', intensity = 1 }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.getElapsedTime()
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      
      positions[i + 2] = Math.sin(x * 0.1 + time) * Math.cos(y * 0.1 + time) * 2 * intensity
    }
    
    meshRef.current.geometry.attributes.position.needsUpdate = true
    meshRef.current.geometry.computeVertexNormals()
  })
  
  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2} position={[0, -10, 0]}>
      <planeGeometry args={[100, 100, 50, 50]} />
      <meshStandardMaterial
        color={color}
        wireframe
        transparent
        opacity={0.2 * intensity}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ============================================================================
// COMPONENTE DE NEBULOSA
// ============================================================================

function Nebula({ color = '#3b82f6', intensity = 1 }) {
  const nebulaRef = useRef<THREE.Group>(null)
  
  const clouds = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        -20 - Math.random() * 20
      ] as [number, number, number],
      scale: 5 + Math.random() * 10,
      color: i % 2 === 0 ? color : '#a855f7'
    }))
  }, [color])
  
  useFrame((state) => {
    if (!nebulaRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    nebulaRef.current.children.forEach((cloud, i) => {
      cloud.rotation.z = time * 0.05 * (i % 2 === 0 ? 1 : -1)
      cloud.scale.setScalar(clouds[i].scale + Math.sin(time + i) * 0.5)
    })
  })
  
  return (
    <group ref={nebulaRef}>
      {clouds.map((cloud, i) => (
        <mesh key={i} position={cloud.position}>
          <sphereGeometry args={[cloud.scale, 16, 16]} />
          <meshBasicMaterial
            color={cloud.color}
            transparent
            opacity={0.08 * intensity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// ============================================================================
// COMPOSICIÓN DE ESCENAS PROCEDURALES
// ============================================================================

function ProceduralScene({ variant, color, intensity }: { 
  variant: BackgroundVariant
  color: string
  intensity: number 
}) {
  const { camera } = useThree()
  
  useFrame((state) => {
    // Movimiento sutil de cámara
    camera.position.x = Math.sin(state.clock.getElapsedTime() * 0.05) * 2
    camera.position.y = Math.cos(state.clock.getElapsedTime() * 0.05) * 1
    camera.lookAt(0, 0, -20)
  })
  
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[10, 10, 10]} intensity={0.4} color={color} />
      <pointLight position={[-10, -10, 10]} intensity={0.2} color="#a855f7" />
      
      {variant === 'cosmic' && (
        <>
          <CosmicParticles count={1200} color={color} intensity={intensity} />
          <Nebula color={color} intensity={intensity * 0.5} />
        </>
      )}
      
      {variant === 'minimal' && (
        <CosmicParticles count={400} color={color} intensity={intensity * 0.4} />
      )}
      
      {variant === 'grid' && (
        <>
          <AnimatedGrid color={color} intensity={intensity} />
          <CosmicParticles count={250} color={color} intensity={intensity * 0.25} />
        </>
      )}
      
      {variant === 'waves' && (
        <>
          <WaveField color={color} intensity={intensity} />
          <CosmicParticles count={350} color={color} intensity={intensity * 0.35} />
        </>
      )}
      
      {variant === 'nebula' && (
        <>
          <Nebula color={color} intensity={intensity} />
          <CosmicParticles count={700} color={color} intensity={intensity * 0.5} />
        </>
      )}
    </>
  )
}

// ============================================================================
// LOADING FALLBACK
// ============================================================================

function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.div
        className="relative w-20 h-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full" />
        <motion.div 
          className="absolute inset-2 bg-blue-500/10 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function SplineBackground({
  variant = 'spline',
  intensity = 1,
  color = '#3b82f6',
  interactive = true,
  splineUrl = "https://prod.spline.design/EMUFQmxEYeuyK46H/scene.splinecode",
  className = ''
}: SplineBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [splineError, setSplineError] = useState(false)
  
  // Motion values para interactividad
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 100 })
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 100 })
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!interactive || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height
    
    mouseX.set(x * 20)
    mouseY.set(y * 20)
  }, [interactive, mouseX, mouseY])
  
  const gradientX = useTransform(smoothX, [-20, 20], [30, 70])
  const gradientY = useTransform(smoothY, [-20, 20], [30, 70])
  
  // Determinar si usar Spline o fallback procedural
  const useSpline = variant === 'spline' && !splineError
  
  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className}`}
      onMouseMove={interactive ? handleMouseMove : undefined}
    >
      {/* Capa de degradado base animado */}
      <motion.div
        className="absolute inset-0 bg-black"
        style={{
          background: useMotionValue(
            `radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.08) 0%, rgba(0, 0, 0, 1) 70%)`
          )
        }}
      />
      
      {/* Orbes de gradiente animados */}
      <motion.div 
        className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-600/10 rounded-full blur-[120px]"
        animate={{ 
          x: [0, 50, 0], 
          y: [0, -30, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600/10 rounded-full blur-[120px]"
        animate={{ 
          x: [0, -50, 0], 
          y: [0, 30, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Canvas 3D: Spline o Procedural */}
      <div className="absolute inset-0" style={{ opacity: 0.35 }}>
        {useSpline ? (
          <Suspense fallback={<LoadingFallback />}>
            <Spline 
              scene={splineUrl}
              onError={() => setSplineError(true)}
            />
          </Suspense>
        ) : (
          <Canvas
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: 'high-performance'
            }}
            camera={{ position: [0, 0, 10], fov: 60 }}
            dpr={[1, 1.5]}
          >
            <Suspense fallback={null}>
              <ProceduralScene 
                variant={variant === 'spline' ? 'cosmic' : variant} 
                color={color} 
                intensity={intensity} 
              />
            </Suspense>
          </Canvas>
        )}
      </div>
      
      {/* Overlay de vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.7) 100%)'
        }}
      />
      
      {/* Overlay de ruido sutil */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
      />
      
      {/* Líneas decorativas sutiles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/50 to-transparent" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-purple-500/50 to-transparent" />
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="absolute bottom-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      </div>
    </div>
  )
}

// Exportar variantes para uso externo
export type { BackgroundVariant, SplineBackgroundProps }
