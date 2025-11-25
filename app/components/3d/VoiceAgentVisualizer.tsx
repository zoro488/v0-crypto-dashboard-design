"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { MeshTransmissionMaterial, Float, Environment } from "@react-three/drei"
import type * as THREE from "three"

interface VoiceAgentVisualizerProps {
  isActive: boolean
  audioLevel?: number
}

function AudioSphere({ isActive, audioLevel = 0 }: VoiceAgentVisualizerProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<any>(null)

  useFrame((state) => {
    if (meshRef.current && materialRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5

      const scale = 1 + (isActive ? audioLevel * 0.3 : 0)
      meshRef.current.scale.setScalar(scale)

      materialRef.current.thickness = 1.2 + audioLevel * 0.5
      materialRef.current.chromaticAberration = 0.04 + audioLevel * 0.02
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 3]} />
        <MeshTransmissionMaterial
          ref={materialRef}
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
          color={isActive ? "#3b82f6" : "#8b5cf6"}
        />
      </mesh>
    </Float>
  )
}

export default function VoiceAgentVisualizer({ isActive, audioLevel }: VoiceAgentVisualizerProps) {
  return (
    <div className="w-full h-64 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-950/50 to-purple-950/50">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />

        <AudioSphere isActive={isActive} audioLevel={audioLevel} />

        <Environment preset="studio" />
      </Canvas>
    </div>
  )
}
