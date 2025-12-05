'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — MONEY RAIN
// Lluvia de oro líquido al crear una venta
// ═══════════════════════════════════════════════════════════════

import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface MoneyRainProps {
  active?: boolean
  duration?: number // ms
  onComplete?: () => void
}

function GoldCoins({ count = 200 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  
  const { matrices, velocities } = useMemo(() => {
    const matrices: THREE.Matrix4[] = []
    const velocities: { y: number; rotX: number; rotZ: number }[] = []
    
    for (let i = 0; i < count; i++) {
      const matrix = new THREE.Matrix4()
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        10 + Math.random() * 10, // Empiezan arriba
        (Math.random() - 0.5) * 5
      )
      const rotation = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )
      const scale = new THREE.Vector3(1, 1, 1).multiplyScalar(0.1 + Math.random() * 0.1)
      
      matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale)
      matrices.push(matrix)
      
      velocities.push({
        y: 0.05 + Math.random() * 0.1,
        rotX: (Math.random() - 0.5) * 0.1,
        rotZ: (Math.random() - 0.5) * 0.1,
      })
    }
    
    return { matrices, velocities }
  }, [count])
  
  useEffect(() => {
    if (meshRef.current) {
      matrices.forEach((matrix, i) => {
        meshRef.current!.setMatrixAt(i, matrix)
      })
      meshRef.current.instanceMatrix.needsUpdate = true
    }
  }, [matrices])
  
  useFrame(() => {
    if (!meshRef.current) return
    
    const dummy = new THREE.Object3D()
    
    for (let i = 0; i < count; i++) {
      meshRef.current.getMatrixAt(i, matrices[i])
      matrices[i].decompose(dummy.position, dummy.quaternion, dummy.scale)
      
      // Caída con gravedad
      dummy.position.y -= velocities[i].y
      dummy.rotation.x += velocities[i].rotX
      dummy.rotation.z += velocities[i].rotZ
      
      // Reset cuando sale de la pantalla
      if (dummy.position.y < -5) {
        dummy.position.y = 15
        dummy.position.x = (Math.random() - 0.5) * 10
      }
      
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
      <meshStandardMaterial
        color="#FFD700"
        metalness={1}
        roughness={0.2}
        emissive="#FFA500"
        emissiveIntensity={0.3}
      />
    </instancedMesh>
  )
}

function GoldSparkles({ count = 500 }) {
  const particlesRef = useRef<THREE.Points>(null)
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12
      positions[i * 3 + 1] = 15 + Math.random() * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6
      velocities[i] = 0.02 + Math.random() * 0.08
    }
    
    return { positions, velocities, count }
  }, [count])
  
  useFrame(() => {
    if (!particlesRef.current) return
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] -= particles.velocities[i]
      
      // Reset
      if (positions[i * 3 + 1] < -5) {
        positions[i * 3 + 1] = 15 + Math.random() * 5
        positions[i * 3] = (Math.random() - 0.5) * 12
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
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
        size={0.05}
        color="#FFD700"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export function MoneyRain({ active = true, duration = 3000, onComplete }: MoneyRainProps) {
  const [isVisible, setIsVisible] = useState(active)
  
  useEffect(() => {
    if (active) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [active, duration, onComplete])
  
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <color attach="background" args={['transparent']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 10, 5]} color="#FFD700" intensity={2} />
        <pointLight position={[0, -5, 5]} color="#FFA500" intensity={1} />
        
        <GoldCoins />
        <GoldSparkles />
      </Canvas>
    </div>
  )
}
