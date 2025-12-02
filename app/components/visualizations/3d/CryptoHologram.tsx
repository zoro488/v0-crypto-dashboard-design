'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, MeshDistortMaterial, Float, Text3D, Center } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import { useSpring, animated } from '@react-spring/three'

interface HologramProps {
  color?: string
  text?: string
  animated?: boolean
}

function AnimatedHologram({ color = '#06b6d4', text = 'CHRONOS', animated = true }: HologramProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const ringRefs = useRef<THREE.Mesh[]>([])
  const particlesRef = useRef<THREE.Points>(null!)

  // Animación de primavera para el material
  const { distort } = useSpring({
    from: { distort: 0 },
    to: { distort: animated ? 0.4 : 0 },
    loop: true,
    config: { mass: 1, tension: 170, friction: 26 },
  })

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    // Rotación del holograma principal
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.3
      meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.1
    }

    // Animar anillos orbitales
    ringRefs.current.forEach((ring, i) => {
      if (ring) {
        ring.rotation.z = time * (0.5 + i * 0.2)
        ring.rotation.x = Math.sin(time + i) * 0.3
        
        // Efecto de pulso
        const scale = 1 + Math.sin(time * 2 + i) * 0.1
        ring.scale.setScalar(scale)
      }
    })

    // Animar partículas
    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.1
    }
  })

  // Generar partículas
  const particleCount = 1000
  const positions = new Float32Array(particleCount * 3)
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    const radius = 3 + Math.random() * 2
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i3 + 2] = radius * Math.cos(phi)
  }

  return (
    <group>
      {/* Holograma principal - Torus Knot distorsionado */}
      <Float
        speed={2}
        rotationIntensity={0.5}
        floatIntensity={0.5}
      >
        <mesh ref={meshRef}>
          <torusKnotGeometry args={[1, 0.3, 128, 32, 2, 3]} />
          <MeshDistortMaterial
            color={color}
            transparent
            opacity={0.8}
            distort={0.4}
            speed={2}
            roughness={0}
            metalness={0.8}
            emissive={color}
            emissiveIntensity={0.5}
          />
        </mesh>
      </Float>

      {/* Anillos orbitales */}
      {[2.5, 3.2, 4].map((radius, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) ringRefs.current[i] = el
          }}
        >
          <torusGeometry args={[radius, 0.02, 16, 100]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.3 - i * 0.05}
            emissive={color}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}

      {/* Partículas orbitales */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color={color}
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Texto 3D */}
      <Float
        speed={1}
        rotationIntensity={0}
        floatIntensity={0.3}
      >
        <Center position={[0, -2.5, 0]}>
          <Text3D
            font="/fonts/Inter_Bold.json"
            size={0.4}
            height={0.1}
            curveSegments={12}
          >
            {text}
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.8}
              metalness={1}
              roughness={0.2}
            />
          </Text3D>
        </Center>
      </Float>

      {/* Rayos de luz */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2
        return (
          <mesh key={i} rotation={[0, angle, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[0.05, 6]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.1}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )
      })}

      {/* Esfera de energía central */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={color}
          emissiveIntensity={2}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  )
}

interface CryptoHologramProps {
  color?: string
  text?: string
  animated?: boolean
  className?: string
}

export function CryptoHologram({
  color = '#06b6d4',
  text = 'CHRONOS',
  animated = true,
  className = '',
}: CryptoHologramProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, type: 'spring' }}
      className={`w-full h-full ${className}`}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        {/* Iluminación avanzada */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color={color} />
        <pointLight position={[0, 0, 5]} intensity={0.8} color={color} />
        
        {/* Luz direccional para resaltar */}
        <directionalLight position={[5, 5, 5]} intensity={0.5} />

        {/* Holograma */}
        <AnimatedHologram color={color} text={text} animated={animated} />

        {/* Controles interactivos */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          maxDistance={12}
          minDistance={4}
          autoRotate={true}
          autoRotateSpeed={1}
        />
      </Canvas>
    </motion.div>
  )
}
