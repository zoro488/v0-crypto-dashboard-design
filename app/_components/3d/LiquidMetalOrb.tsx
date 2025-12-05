'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — LIQUID METAL ORB
// Orbe líquido que respira y reacciona a datos financieros
// ═══════════════════════════════════════════════════════════════

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Float, Environment } from '@react-three/drei'
import * as THREE from 'three'

interface LiquidMetalOrbProps {
  color?: string
  size?: number
  intensity?: number // 0-1 para controlar la "energía" del orbe
  label?: string
  value?: number
}

function Orb({ color = '#8B00FF', size = 1, intensity = 0.5 }: LiquidMetalOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<typeof MeshDistortMaterial>(null)
  
  // Color con glow
  const orbColor = useMemo(() => new THREE.Color(color), [color])
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Rotación suave
      meshRef.current.rotation.y = clock.elapsedTime * 0.1
      meshRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.2) * 0.1
      
      // Escala que "respira" basada en intensidad
      const breathe = 1 + Math.sin(clock.elapsedTime * 2) * 0.02 * intensity
      meshRef.current.scale.setScalar(size * breathe)
    }
  })

  return (
    <Float
      speed={2}
      rotationIntensity={0.2}
      floatIntensity={0.5}
    >
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial
          color={orbColor}
          distort={0.3 + intensity * 0.2}
          speed={2 + intensity * 3}
          roughness={0.1}
          metalness={0.9}
          envMapIntensity={1}
        />
      </mesh>
      
      {/* Glow interior */}
      <pointLight
        color={color}
        intensity={intensity * 2}
        distance={3}
      />
    </Float>
  )
}

function OrbParticles({ color = '#8B00FF', intensity = 0.5 }) {
  const particlesRef = useRef<THREE.Points>(null)
  
  const particles = useMemo(() => {
    const count = 100
    const positions = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 1.2 + Math.random() * 0.3
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
    }
    
    return { positions, count }
  }, [])
  
  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.elapsedTime * 0.2
      particlesRef.current.rotation.x = clock.elapsedTime * 0.1
      
      // Pulsar las partículas
      const scale = 1 + Math.sin(clock.elapsedTime * 3) * 0.1 * intensity
      particlesRef.current.scale.setScalar(scale)
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color={color}
        transparent
        opacity={0.6 * intensity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export function LiquidMetalOrb({ 
  color = '#8B00FF', 
  size = 1, 
  intensity = 0.5,
  label,
  value 
}: LiquidMetalOrbProps) {
  return (
    <div className="relative w-full h-full min-h-[200px]">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <color attach="background" args={['transparent']} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        
        <Orb color={color} size={size} intensity={intensity} />
        <OrbParticles color={color} intensity={intensity} />
        
        <Environment preset="city" />
      </Canvas>
      
      {/* Labels en HTML overlay */}
      {(label || value !== undefined) && (
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 pointer-events-none">
          {label && (
            <span className="text-sm font-medium text-white/70">{label}</span>
          )}
          {value !== undefined && (
            <span 
              className="text-2xl font-bold"
              style={{ color }}
            >
              ${value.toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
