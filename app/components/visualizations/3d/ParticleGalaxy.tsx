'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'

interface ParticleGalaxyProps {
  count?: number
  radius?: number
  branches?: number
  spin?: number
  randomness?: number
  randomnessPower?: number
  insideColor?: string
  outsideColor?: string
  className?: string
}

function Galaxy({
  count = 50000,
  radius = 5,
  branches = 3,
  spin = 1,
  randomness = 0.2,
  randomnessPower = 3,
  insideColor = '#ff6030',
  outsideColor = '#1b3984',
}: Omit<ParticleGalaxyProps, 'className'>) {
  const points = useRef<THREE.Points>(null!)

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    const colorInside = new THREE.Color(insideColor)
    const colorOutside = new THREE.Color(outsideColor)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      // Posición
      const radius2 = Math.random() * radius
      const spinAngle = radius2 * spin
      const branchAngle = ((i % branches) / branches) * Math.PI * 2

      const randomX = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * radius2
      const randomY = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * radius2
      const randomZ = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * radius2

      positions[i3] = Math.cos(branchAngle + spinAngle) * radius2 + randomX
      positions[i3 + 1] = randomY
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius2 + randomZ

      // Color
      const mixedColor = colorInside.clone()
      mixedColor.lerp(colorOutside, radius2 / radius)

      colors[i3] = mixedColor.r
      colors[i3 + 1] = mixedColor.g
      colors[i3 + 2] = mixedColor.b
    }

    return [positions, colors]
  }, [count, radius, branches, spin, randomness, randomnessPower, insideColor, outsideColor])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    points.current.rotation.y = time * 0.05
    
    // Efecto de respiración
    const scale = 1 + Math.sin(time * 0.5) * 0.05
    points.current.scale.setScalar(scale)
  })

  return (
    <>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          sizeAttenuation={true}
          depthWrite={false}
          vertexColors={true}
          blending={THREE.AdditiveBlending}
          transparent={true}
        />
      </points>
      
      {/* Núcleo brillante central */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ff6030"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>

      {/* Sparkles adicionales */}
      <Sparkles
        count={100}
        scale={radius * 1.5}
        size={4}
        speed={0.3}
        opacity={0.6}
        color="#ffffff"
      />
    </>
  )
}

export function ParticleGalaxy({
  count = 50000,
  radius = 5,
  branches = 3,
  spin = 1,
  randomness = 0.2,
  randomnessPower = 3,
  insideColor = '#06b6d4',
  outsideColor = '#8b5cf6',
  className = '',
}: ParticleGalaxyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className={`w-full h-full ${className}`}
    >
      <Canvas
        camera={{ position: [0, 2, 8], fov: 60 }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        {/* Iluminación */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} color="#8b5cf6" intensity={0.5} />

        {/* Estrellas de fondo */}
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        {/* Galaxia principal */}
        <Galaxy
          count={count}
          radius={radius}
          branches={branches}
          spin={spin}
          randomness={randomness}
          randomnessPower={randomnessPower}
          insideColor={insideColor}
          outsideColor={outsideColor}
        />

        {/* Controles */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          maxDistance={15}
          minDistance={3}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </motion.div>
  )
}
