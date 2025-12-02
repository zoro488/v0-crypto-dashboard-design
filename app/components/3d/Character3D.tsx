'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSpring, config } from '@react-spring/three'
import * as THREE from 'three'

interface Character3DProps {
  isListening: boolean
  isSpeaking: boolean
  audioFrequencies?: number[]
  color?: string
}

export function Character3D({ 
  isListening, 
  isSpeaking, 
  audioFrequencies = [], 
  color = '#667eea', 
}: Character3DProps) {
  const headRef = useRef<THREE.Mesh>(null!)
  const bodyRef = useRef<THREE.Mesh>(null!)
  const eyesRef = useRef<THREE.Group>(null!)
  const particlesRef = useRef<THREE.Points>(null!)

  // Animated properties
  const { scale, rotation } = useSpring({
    scale: isListening ? 1.1 : isSpeaking ? 1.05 : 1,
    rotation: isListening ? Math.PI * 2 : 0,
    config: config.gentle,
  })

  // Create particles for audio visualization
  const particles = useMemo(() => {
    const count = 100
    const positions = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const radius = 2 + Math.random() * 0.5
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
    }
    
    return positions
  }, [])

  // Animation loop
  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    // Head bobbing animation
    if (headRef.current) {
      headRef.current.position.y = Math.sin(time * 2) * 0.1
      headRef.current.rotation.z = Math.sin(time * 1.5) * 0.05
    }

    // Eyes blinking
    if (eyesRef.current) {
      const blink = Math.sin(time * 3) > 0.95 ? 0.1 : 1
      eyesRef.current.scale.y = blink
    }

    // Body breathing animation
    if (bodyRef.current) {
      const breathe = Math.sin(time * 1.5) * 0.05 + 1
      bodyRef.current.scale.y = breathe
      bodyRef.current.scale.x = 1 / breathe
      bodyRef.current.scale.z = 1 / breathe
    }

    // Particles animation based on audio
    if (particlesRef.current && audioFrequencies.length > 0) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < positions.length / 3; i++) {
        const frequencyIndex = Math.floor((i / (positions.length / 3)) * audioFrequencies.length)
        const frequency = audioFrequencies[frequencyIndex] || 0
        
        const distance = Math.sqrt(
          positions[i * 3] ** 2 + 
          positions[i * 3 + 1] ** 2 + 
          positions[i * 3 + 2] ** 2,
        )
        
        const newDistance = 2 + frequency * 2
        const scale = newDistance / distance
        
        positions[i * 3] *= 0.95 + scale * 0.05
        positions[i * 3 + 1] *= 0.95 + scale * 0.05
        positions[i * 3 + 2] *= 0.95 + scale * 0.05
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }

    // Rotate particles
    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.2
      particlesRef.current.rotation.x = Math.sin(time * 0.3) * 0.1
    }
  })

  const colorObj = new THREE.Color(color)

  return (
    <group>
      {/* Main character body */}
      <group 
        scale={scale.get()} 
        rotation-y={rotation.get()}
      >
        {/* Head */}
        <mesh ref={headRef} position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial 
            color={colorObj}
            emissive={colorObj}
            emissiveIntensity={isListening ? 0.5 : 0.2}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Eyes */}
        <group ref={eyesRef} position={[0, 1.5, 0]}>
          <mesh position={[-0.2, 0.1, 0.4]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0.2, 0.1, 0.4]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
          
          {/* Pupils */}
          <mesh position={[-0.2, 0.1, 0.48]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          <mesh position={[0.2, 0.1, 0.48]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </group>

        {/* Mouth indicator (speaking) */}
        {isSpeaking && (
          <mesh position={[0, 1.3, 0.45]}>
            <torusGeometry args={[0.15, 0.03, 16, 32, Math.PI]} />
            <meshStandardMaterial 
              color="#ff6b9d" 
              emissive="#ff6b9d" 
              emissiveIntensity={0.5} 
            />
          </mesh>
        )}

        {/* Body */}
        <mesh ref={bodyRef} position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.4, 0.5, 1.2, 32]} />
          <meshStandardMaterial 
            color={colorObj}
            emissive={colorObj}
            emissiveIntensity={0.1}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>

        {/* Arms */}
        <mesh position={[-0.6, 0.8, 0]} rotation={[0, 0, -0.3]}>
          <capsuleGeometry args={[0.1, 0.6, 16, 32]} />
          <meshStandardMaterial 
            color={colorObj}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0.6, 0.8, 0]} rotation={[0, 0, 0.3]}>
          <capsuleGeometry args={[0.1, 0.6, 16, 32]} />
          <meshStandardMaterial 
            color={colorObj}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* Audio visualization particles */}
      {(isListening || isSpeaking) && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particles.length / 3}
              array={particles}
              itemSize={3}
              args={[particles, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.05}
            color={colorObj}
            transparent
            opacity={0.6}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* Ambient particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={50}
            array={useMemo(() => {
              const arr = new Float32Array(150)
              for (let i = 0; i < 150; i++) {
                arr[i] = (Math.random() - 0.5) * 5
              }
              return arr
            }, [])}
            itemSize={3}
            args={[useMemo(() => {
              const arr = new Float32Array(150)
              for (let i = 0; i < 150; i++) {
                arr[i] = (Math.random() - 0.5) * 5
              }
              return arr
            }, []), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color="#ffffff"
          transparent
          opacity={0.3}
          sizeAttenuation
        />
      </points>

      {/* Lights */}
      <pointLight 
        position={[0, 2, 2]} 
        intensity={isListening ? 2 : 1} 
        color={color}
        distance={5}
      />
      <pointLight 
        position={[0, -1, 2]} 
        intensity={0.5} 
        color="#ffffff"
        distance={5}
      />
    </group>
  )
}
