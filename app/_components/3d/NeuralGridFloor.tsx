'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — NEURAL GRID FLOOR
// Piso infinito con grid neural que reacciona al scroll
// ═══════════════════════════════════════════════════════════════

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Grid, Environment, Float } from '@react-three/drei'
import * as THREE from 'three'

function NeuralGrid() {
  const gridRef = useRef<THREE.Mesh>(null)
  
  useFrame(({ clock }) => {
    if (gridRef.current && gridRef.current.material) {
      // Pulsación suave del grid
      const pulse = Math.sin(clock.elapsedTime * 0.5) * 0.1 + 0.9
      const material = gridRef.current.material as THREE.Material
      if ('opacity' in material) {
        material.opacity = pulse * 0.3
      }
    }
  })

  return (
    <Grid
      ref={gridRef as React.RefObject<THREE.Mesh>}
      position={[0, -2, 0]}
      args={[100, 100]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#8B00FF"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#FFD700"
      fadeDistance={50}
      fadeStrength={1}
      infiniteGrid
    />
  )
}

function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null)
  
  const particles = useMemo(() => {
    const count = 500
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    const violet = new THREE.Color('#8B00FF')
    const gold = new THREE.Color('#FFD700')
    
    for (let i = 0; i < count; i++) {
      // Posición aleatoria en espacio 3D
      positions[i * 3] = (Math.random() - 0.5) * 50
      positions[i * 3 + 1] = Math.random() * 20 - 5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50
      
      // Color aleatorio entre violeta y oro
      const color = Math.random() > 0.7 ? gold : violet
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    
    return { positions, colors, count }
  }, [])
  
  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.elapsedTime * 0.02
      
      // Movimiento vertical suave
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particles.count; i++) {
        positions[i * 3 + 1] += Math.sin(clock.elapsedTime + i) * 0.001
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[particles.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export function NeuralGridFloor() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 5, 15], fov: 60 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 10, 50]} />
        
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} color="#8B00FF" intensity={0.5} />
        <pointLight position={[-10, 10, -10]} color="#FFD700" intensity={0.3} />
        
        <NeuralGrid />
        <FloatingParticles />
        
        <Environment preset="night" />
      </Canvas>
    </div>
  )
}
