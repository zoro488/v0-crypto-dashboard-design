'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — QUANTUM DUST
// Sistema de partículas de fondo vivo y suave
// ═══════════════════════════════════════════════════════════════

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface QuantumDustProps {
  count?: number
  size?: number
  opacity?: number
}

function DustParticles({ count = 1000, size = 0.05, opacity = 0.4 }: QuantumDustProps) {
  const particlesRef = useRef<THREE.Points>(null)
  
  const { positions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    const violet = new THREE.Color('#8B00FF')
    const gold = new THREE.Color('#FFD700')
    const pink = new THREE.Color('#FF1493')
    
    for (let i = 0; i < count; i++) {
      // Posiciones distribuidas en esfera
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 5 + Math.random() * 15
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
      
      // Velocidades aleatorias lentas
      velocities[i * 3] = (Math.random() - 0.5) * 0.002
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.002
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002
      
      // Colores aleatorios de la paleta
      const colorChoice = Math.random()
      let color: THREE.Color
      if (colorChoice < 0.5) {
        color = violet
      } else if (colorChoice < 0.8) {
        color = gold
      } else {
        color = pink
      }
      
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    
    return { positions, velocities, colors }
  }, [count])
  
  useFrame(({ clock }) => {
    if (!particlesRef.current) return
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    
    for (let i = 0; i < count; i++) {
      // Movimiento suave tipo browniano
      positions[i * 3] += velocities[i * 3] + Math.sin(clock.elapsedTime + i * 0.1) * 0.001
      positions[i * 3 + 1] += velocities[i * 3 + 1] + Math.cos(clock.elapsedTime + i * 0.1) * 0.001
      positions[i * 3 + 2] += velocities[i * 3 + 2]
      
      // Mantener dentro de límites
      const distance = Math.sqrt(
        positions[i * 3] ** 2 + 
        positions[i * 3 + 1] ** 2 + 
        positions[i * 3 + 2] ** 2
      )
      
      if (distance > 25) {
        const scale = 20 / distance
        positions[i * 3] *= scale
        positions[i * 3 + 1] *= scale
        positions[i * 3 + 2] *= scale
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
    particlesRef.current.rotation.y = clock.elapsedTime * 0.01
  })
  
  return (
    <points ref={particlesRef}>
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
        size={size}
        vertexColors
        transparent
        opacity={opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export function QuantumDust(props: QuantumDustProps) {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <color attach="background" args={['#000000']} />
        <DustParticles {...props} />
      </Canvas>
    </div>
  )
}
