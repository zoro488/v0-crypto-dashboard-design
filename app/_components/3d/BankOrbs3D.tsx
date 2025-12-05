'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — BANK ORBS 3D
// 7 orbes flotantes representando cada banco
// ═══════════════════════════════════════════════════════════════

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Text, MeshDistortMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { BANCOS_CONFIG, type BancoId } from '@/app/_lib/constants/bancos'

interface BankOrbsProps {
  bancos: Array<{
    id: BancoId
    capitalActual: number
    historicoIngresos: number
  }>
  onBancoClick?: (id: BancoId) => void
}

interface SingleOrbProps {
  position: [number, number, number]
  color: string
  capital: number
  nombre: string
  intensity: number
}

function SingleOrb({ position, color, capital, nombre, intensity }: SingleOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const orbColor = useMemo(() => new THREE.Color(color), [color])
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Respiración basada en capital
      const breathe = 1 + Math.sin(clock.elapsedTime * 2 + position[0]) * 0.03 * intensity
      meshRef.current.scale.setScalar(0.5 * breathe)
    }
  })

  return (
    <Float
      position={position}
      speed={1.5 + intensity}
      rotationIntensity={0.1}
      floatIntensity={0.3 + intensity * 0.2}
    >
      <group>
        {/* Orbe principal */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[1, 32, 32]} />
          <MeshDistortMaterial
            color={orbColor}
            distort={0.2 + intensity * 0.1}
            speed={2}
            roughness={0.1}
            metalness={0.9}
            transparent
            opacity={0.85}
          />
        </mesh>
        
        {/* Glow */}
        <mesh scale={1.2}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.1 + intensity * 0.1}
            side={THREE.BackSide}
          />
        </mesh>
        
        {/* Label */}
        <Text
          position={[0, -0.9, 0]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="top"
          font="/fonts/GeistMono-Regular.woff"
        >
          {nombre}
        </Text>
        
        {/* Capital */}
        <Text
          position={[0, 0, 0.6]}
          fontSize={0.12}
          color="white"
          anchorX="center"
          anchorY="middle"
          font="/fonts/GeistMono-Regular.woff"
        >
          ${(capital / 1000).toFixed(1)}K
        </Text>
        
        {/* Luz interior */}
        <pointLight color={color} intensity={intensity} distance={2} />
      </group>
    </Float>
  )
}

export function BankOrbs3D({ bancos, onBancoClick }: BankOrbsProps) {
  // Calcular intensidades basadas en capital relativo
  const maxCapital = Math.max(...bancos.map(b => b.capitalActual), 1)
  
  // Posiciones en semicírculo
  const orbPositions: [number, number, number][] = useMemo(() => {
    const count = bancos.length
    return bancos.map((_, i) => {
      const angle = (Math.PI / (count - 1)) * i - Math.PI / 2
      const radius = 4
      return [
        Math.cos(angle) * radius,
        Math.sin(angle) * 0.5,
        Math.sin(angle) * radius * 0.3
      ] as [number, number, number]
    })
  }, [bancos])

  return (
    <div className="w-full h-[300px]">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
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
        
        {bancos.map((banco, i) => {
          const config = BANCOS_CONFIG[banco.id]
          const intensity = Math.min(banco.capitalActual / maxCapital + 0.3, 1)
          
          return (
            <SingleOrb
              key={banco.id}
              position={orbPositions[i]}
              color={config.color}
              capital={banco.capitalActual}
              nombre={config.nombre}
              intensity={intensity}
            />
          )
        })}
        
        <Environment preset="city" />
      </Canvas>
    </div>
  )
}
