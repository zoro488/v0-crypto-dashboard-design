'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — PREMIUM ORB
// Orbe 3D premium con shader líquido metálico y física realista
// ═══════════════════════════════════════════════════════════════

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Text3D, MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { LiquidMetalShader } from '../shaders'
import type { LiquidMetalShaderMaterial } from '../shaders'

interface PremiumOrbProps {
  position?: [number, number, number]
  color?: string
  glowColor?: string
  size?: number
  intensity?: number
  label?: string
  value?: number
  onClick?: () => void
  isActive?: boolean
}

export function PremiumOrb({
  position = [0, 0, 0],
  color = '#8B00FF',
  glowColor = '#FFD700',
  size = 1,
  intensity = 0.5,
  label,
  value,
  onClick,
  isActive = false,
}: PremiumOrbProps) {
  const orbRef = useRef<THREE.Mesh>(null)
  const shaderRef = useRef<LiquidMetalShaderMaterial>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  
  // Colores con memoización
  const baseColor = useMemo(() => new THREE.Color(color), [color])
  const glow = useMemo(() => new THREE.Color(glowColor), [glowColor])
  
  // Partículas orbitales
  const particles = useMemo(() => {
    const count = 50
    const positions = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 1.3 + Math.random() * 0.2
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
      
      scales[i] = Math.random() * 0.5 + 0.5
    }
    
    return { positions, scales, count }
  }, [])
  
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    
    if (orbRef.current) {
      // Rotación elegante
      orbRef.current.rotation.y = t * 0.15
      orbRef.current.rotation.x = Math.sin(t * 0.3) * 0.1
      
      // Respiración basada en intensidad
      const breathe = 1 + Math.sin(t * 2 + position[0]) * 0.03 * intensity
      orbRef.current.scale.setScalar(size * breathe * (isActive ? 1.1 : 1))
    }
    
    if (shaderRef.current) {
      // Actualizar uniforms del shader
      shaderRef.current.uniforms.uTime.value = t
      shaderRef.current.uniforms.uIntensity.value = intensity * (isActive ? 1.5 : 1)
    }
    
    if (glowRef.current) {
      // Pulso del glow
      const pulse = Math.sin(t * 3) * 0.5 + 0.5
      glowRef.current.scale.setScalar(1.1 + pulse * 0.1 * intensity)
      
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = (0.15 + pulse * 0.1) * intensity
    }
    
    if (ringRef.current) {
      // Rotación del anillo
      ringRef.current.rotation.z = t * 0.5
      ringRef.current.rotation.x = Math.PI * 0.5 + Math.sin(t) * 0.2
    }
  })

  return (
    <Float
      position={position}
      speed={1.5 + intensity}
      rotationIntensity={0.2}
      floatIntensity={0.4 + intensity * 0.3}
    >
      <group onClick={onClick}>
        {/* Orbe principal con shader líquido */}
        <mesh ref={orbRef} castShadow receiveShadow>
          <icosahedronGeometry args={[1, 5]} />
          <primitive
            ref={shaderRef}
            object={new LiquidMetalShader()}
            attach="material"
            uniforms-uColor-value={baseColor}
            uniforms-uGlowColor-value={glow}
            uniforms-uIntensity-value={intensity}
            uniforms-uFrequency-value={2.0}
            uniforms-uAmplitude-value={0.25}
            uniforms-uDistortion-value={0.15}
            uniforms-uMetalness-value={0.95}
            uniforms-uIridescence-value={0.8}
            transparent
          />
        </mesh>
        
        {/* Glow exterior */}
        <mesh ref={glowRef} scale={1.2}>
          <icosahedronGeometry args={[1, 3]} />
          <meshBasicMaterial
            color={glow}
            transparent
            opacity={0.2}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        
        {/* Anillo orbital */}
        <mesh ref={ringRef}>
          <torusGeometry args={[1.4, 0.02, 16, 64]} />
          <meshBasicMaterial
            color={glow}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        
        {/* Partículas orbitales */}
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particles.positions, 3]}
            />
            <bufferAttribute
              attach="attributes-scale"
              args={[particles.scales, 1]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.04}
            color={glow}
            transparent
            opacity={0.8}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
        
        {/* Luz interior */}
        <pointLight
          color={color}
          intensity={intensity * 3}
          distance={4}
          decay={2}
        />
        
        {/* Label flotante */}
        {label && (
          <Text3D
            font="/fonts/geist-mono.json"
            size={0.12}
            height={0.02}
            position={[0, -1.3, 0]}
            castShadow
          >
            {label}
            <meshStandardMaterial
              color="white"
              emissive={glow}
              emissiveIntensity={0.3}
            />
          </Text3D>
        )}
        
        {/* Valor numérico */}
        {value !== undefined && (
          <Text3D
            font="/fonts/geist-mono.json"
            size={0.15}
            height={0.03}
            position={[0, 0, 0.7]}
            castShadow
          >
            {`$${(value / 1000).toFixed(1)}K`}
            <meshStandardMaterial
              color={glow}
              emissive={glow}
              emissiveIntensity={0.8}
            />
          </Text3D>
        )}
      </group>
    </Float>
  )
}

// Variante simplificada para mejor performance en móviles
export function PremiumOrbSimple({
  position = [0, 0, 0],
  color = '#8B00FF',
  size = 1,
  intensity = 0.5,
  label,
}: Omit<PremiumOrbProps, 'glowColor' | 'value' | 'onClick' | 'isActive'>) {
  return (
    <Float position={position} speed={1.5} floatIntensity={0.3}>
      <mesh castShadow>
        <icosahedronGeometry args={[size, 3]} />
        <MeshTransmissionMaterial
          color={color}
          transmission={0.95}
          thickness={0.5}
          roughness={0.1}
          metalness={0.9}
          ior={1.5}
          chromaticAberration={0.02}
          distortion={0.1}
          distortionScale={0.5}
          temporalDistortion={0.1}
        />
      </mesh>
      
      <pointLight color={color} intensity={intensity * 2} distance={3} />
      
      {label && (
        <Text3D
          font="/fonts/geist-mono.json"
          size={0.1}
          height={0.02}
          position={[0, -size * 1.2, 0]}
        >
          {label}
          <meshStandardMaterial color="white" />
        </Text3D>
      )}
    </Float>
  )
}
