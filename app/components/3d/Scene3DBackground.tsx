'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, MeshTransmissionMaterial, Float, Sparkles } from '@react-three/drei'
import { EffectComposer, N8AO, Bloom } from '@react-three/postprocessing'
import { useRef } from 'react'
import type * as THREE from 'three'

function CrystalSphere() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={[3, 1, -2]}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshTransmissionMaterial
          backside
          samples={16}
          thickness={1.2}
          chromaticAberration={0.04}
          anisotropy={0.5}
          distortion={0.3}
          distortionScale={0.5}
          temporalDistortion={0.1}
          iridescence={1}
          iridescenceIOR={1}
          iridescenceThicknessRange={[0, 1400]}
        />
      </mesh>
    </Float>
  )
}

function FloatingOrbs() {
  return (
    <group>
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.8}>
        <mesh position={[-3, -1, -3]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial
            color="#3b82f6"
            emissive="#3b82f6"
            emissiveIntensity={0.5}
            metalness={1}
            roughness={0.1}
          />
        </mesh>
      </Float>

      <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh position={[2, -2, -4]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial
            color="#8b5cf6"
            emissive="#8b5cf6"
            emissiveIntensity={0.7}
            metalness={1}
            roughness={0.1}
          />
        </mesh>
      </Float>

      <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.9}>
        <mesh position={[-1, 2, -5]}>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#06b6d4"
            emissiveIntensity={0.6}
            metalness={1}
            roughness={0.1}
          />
        </mesh>
      </Float>
    </group>
  )
}

export default function Scene3DBackground() {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={['#0a0e1a']} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#8b5cf6" />

        <CrystalSphere />
        <FloatingOrbs />
        <Sparkles count={100} scale={10} size={2} speed={0.4} opacity={0.6} color="#ffffff" />

        <Environment preset="city" />

        <EffectComposer>
          <N8AO aoRadius={0.5} intensity={1} />
          <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.9} intensity={0.5} />
        </EffectComposer>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  )
}
