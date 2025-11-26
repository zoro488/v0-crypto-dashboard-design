/**
 * 🌌 ZERO ENVIRONMENT - Entorno Cinematográfico 3D
 * 
 * El escenario completo donde vive Zero. Incluye:
 * - Post-processing cinematográfico (Bloom, Noise, Vignette)
 * - Iluminación volumétrica reactiva
 * - Fondo estelar profundo
 * - Efectos Glitch en modo combate
 * - Scanlines tipo CRT
 * - Niebla atmosférica
 */

'use client'

import { Suspense, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
  Glitch,
  Scanline,
  ChromaticAberration,
  DepthOfField,
} from '@react-three/postprocessing'
import { GlitchMode, BlendFunction } from 'postprocessing'
import {
  PerspectiveCamera,
  Environment,
  Stars,
  Sparkles,
  Float,
  MeshDistortMaterial,
} from '@react-three/drei'
import * as THREE from 'three'

import ZeroAvatar from './ZeroAvatar'

// ============================================
// TIPOS
// ============================================

type ZeroMode = 'idle' | 'processing' | 'combat' | 'success' | 'speaking'

interface ZeroEnvironmentProps {
  /** Modo actual de Zero */
  mode?: ZeroMode
  /** Referencia a un elemento HTML objetivo (para efectos cross-dimension) */
  targetRef?: React.RefObject<HTMLElement>
  /** Si mostrar el avatar de Zero */
  showAvatar?: boolean
  /** Callback cuando Zero completa una acción */
  onActionComplete?: () => void
  /** Calidad de renderizado (1 = normal, 2 = alta) */
  quality?: number
  /** Si está en modo compacto (widget) */
  compact?: boolean
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

/** Fondo de partículas holográficas */
function HolographicBackground({ mode }: { mode: ZeroMode }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.05
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.03
    }
  })
  
  const color = useMemo(() => {
    switch (mode) {
      case 'combat': return '#ff0000'
      case 'processing': return '#ffaa00'
      case 'success': return '#00ff66'
      default: return '#001a33'
    }
  }, [mode])
  
  return (
    <mesh ref={meshRef} scale={50}>
      <icosahedronGeometry args={[1, 1]} />
      <MeshDistortMaterial
        color={color}
        transparent
        opacity={0.03}
        wireframe
        distort={0.2}
        speed={2}
      />
    </mesh>
  )
}

/** Grid de suelo holográfico */
function HolographicGrid({ mode }: { mode: ZeroMode }) {
  const gridRef = useRef<THREE.GridHelper>(null)
  
  useFrame((state) => {
    if (gridRef.current) {
      // El grid se mueve hacia el espectador
      const offset = (state.clock.elapsedTime * 0.5) % 1
      gridRef.current.position.z = offset * 2
    }
  })
  
  const gridColor = mode === 'combat' ? '#330000' : '#001a33'
  
  return (
    <gridHelper
      ref={gridRef}
      args={[100, 50, gridColor, gridColor]}
      position={[0, -3, 0]}
      rotation={[0, 0, 0]}
    />
  )
}

/** Orbe de energía flotante */
function EnergyOrb({ mode }: { mode: ZeroMode }) {
  const orbRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (orbRef.current) {
      const t = state.clock.elapsedTime
      orbRef.current.position.y = Math.sin(t * 2) * 0.3 - 2
      orbRef.current.scale.setScalar(1 + Math.sin(t * 4) * 0.1)
    }
  })
  
  const color = mode === 'combat' ? '#ff0000' : '#0066ff'
  
  return (
    <Float speed={3} floatIntensity={0.5}>
      <mesh ref={orbRef} position={[0, -2, -5]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </Float>
  )
}

/** Anillos de datos orbitando */
function DataRings({ mode }: { mode: ZeroMode }) {
  const ringRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.2
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
    }
  })
  
  const color = mode === 'combat' ? '#ff0000' : '#00ffff'
  
  return (
    <group ref={ringRef} position={[0, 0, -2]}>
      {[1.5, 2, 2.5].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, i * 0.5]}>
          <torusGeometry args={[radius, 0.01, 8, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3 - i * 0.08}
          />
        </mesh>
      ))}
    </group>
  )
}

// ============================================
// ESCENA PRINCIPAL
// ============================================

function ZeroScene({
  mode,
  showAvatar,
  compact,
}: {
  mode: ZeroMode
  showAvatar: boolean
  compact: boolean
}) {
  return (
    <>
      {/* ===== ILUMINACIÓN PRINCIPAL ===== */}
      <ambientLight intensity={0.15} />
      
      {/* Luz principal direccional */}
      <spotLight
        position={[10, 10, 10]}
        angle={0.5}
        penumbra={1}
        intensity={mode === 'combat' ? 3 : 1.5}
        color={mode === 'combat' ? '#ff0000' : '#4444ff'}
        castShadow
      />
      
      {/* Luz de relleno trasera */}
      <spotLight
        position={[-10, -5, -10]}
        angle={0.8}
        penumbra={1}
        intensity={0.5}
        color={mode === 'combat' ? '#660000' : '#000066'}
      />
      
      {/* Luz de borde superior */}
      <pointLight
        position={[0, 10, 0]}
        intensity={mode === 'combat' ? 2 : 0.5}
        color={mode === 'combat' ? '#ff3300' : '#0033ff'}
        distance={20}
      />

      {/* ===== FONDO ===== */}
      <color attach="background" args={['#020208']} />
      
      {/* Estrellas de fondo */}
      <Stars
        radius={100}
        depth={50}
        count={compact ? 2000 : 5000}
        factor={4}
        saturation={0}
        fade
        speed={mode === 'combat' ? 3 : 1}
      />
      
      {/* Partículas brillantes */}
      <Sparkles
        count={compact ? 50 : 200}
        size={2}
        scale={20}
        speed={0.5}
        opacity={0.3}
        color={mode === 'combat' ? '#ff0000' : '#00ffff'}
      />

      {/* ===== ELEMENTOS DE ESCENA ===== */}
      {!compact && (
        <>
          <HolographicBackground mode={mode} />
          <HolographicGrid mode={mode} />
          <DataRings mode={mode} />
          <EnergyOrb mode={mode} />
        </>
      )}

      {/* ===== AVATAR DE ZERO ===== */}
      {showAvatar && (
        <ZeroAvatar
          isSpeaking={mode === 'speaking'}
          isProcessing={mode === 'processing'}
          isCombat={mode === 'combat'}
          scale={compact ? 1.2 : 1.5}
          showStatus={!compact}
        />
      )}

      {/* ===== ENVIRONMENT MAP ===== */}
      <Environment preset="night" />

      {/* ===== NIEBLA ATMOSFÉRICA ===== */}
      <fog
        attach="fog"
        args={[
          mode === 'combat' ? '#0a0000' : '#000510',
          10,
          50,
        ]}
      />
    </>
  )
}

// ============================================
// COMPONENTE PRINCIPAL CON POST-PROCESSING
// ============================================

export default function ZeroEnvironment({
  mode = 'idle',
  targetRef,
  showAvatar = true,
  onActionComplete,
  quality = 1,
  compact = false,
}: ZeroEnvironmentProps) {
  
  // Configuración del canvas según calidad
  const canvasConfig = useMemo(() => ({
    gl: {
      antialias: quality > 1,
      powerPreference: 'high-performance' as const,
      alpha: true,
    },
    dpr: compact ? [1, 1.5] as [number, number] : [1, quality * 1.5] as [number, number],
  }), [quality, compact])

  return (
    <div className="absolute inset-0 z-0">
      <Canvas {...canvasConfig}>
        {/* Cámara */}
        <PerspectiveCamera
          makeDefault
          position={[0, 0, compact ? 5 : 8]}
          fov={compact ? 60 : 50}
        />

        {/* Escena con Suspense para carga */}
        <Suspense fallback={null}>
          <ZeroScene
            mode={mode}
            showAvatar={showAvatar}
            compact={compact}
          />
        </Suspense>

        {/* ===== POST-PROCESSING CINEMATOGRÁFICO ===== */}
        <EffectComposer disableNormalPass multisampling={0}>
          
          {/* Bloom - Brillo intenso en los ojos y luces */}
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
            intensity={mode === 'combat' ? 2.5 : 1.5}
            radius={0.5}
          />
          
          {/* Ruido de película/cámara de seguridad */}
          <Noise
            opacity={mode === 'combat' ? 0.25 : 0.1}
            blendFunction={BlendFunction.OVERLAY}
          />
          
          {/* Glitch - Solo en modo combate/error */}
          {mode === 'combat' && (
            <Glitch
              delay={new THREE.Vector2(0.5, 1)}
              duration={new THREE.Vector2(0.1, 0.3)}
              strength={new THREE.Vector2(0.2, 0.4)}
              mode={GlitchMode.SPORADIC}
              active
              ratio={0.85}
            />
          )}
          
          {/* Aberración cromática - Efecto de lente */}
          {!compact && (
            <ChromaticAberration
              offset={new THREE.Vector2(
                mode === 'combat' ? 0.003 : 0.001,
                mode === 'combat' ? 0.003 : 0.001
              )}
              radialModulation={false}
              modulationOffset={0}
            />
          )}
          
          {/* Scanlines - Efecto CRT/monitor táctico */}
          <Scanline
            density={1.5}
            opacity={mode === 'combat' ? 0.15 : 0.05}
          />
          
          {/* Profundidad de campo - Solo en calidad alta */}
          {quality > 1 && !compact && (
            <DepthOfField
              focusDistance={0}
              focalLength={0.02}
              bokehScale={2}
            />
          )}
          
          {/* Viñeta - Oscurecimiento de bordes */}
          <Vignette
            eskil={false}
            offset={mode === 'combat' ? 0.2 : 0.1}
            darkness={mode === 'combat' ? 1.0 : 0.7}
          />
          
        </EffectComposer>
      </Canvas>
    </div>
  )
}

// ============================================
// EXPORTS
// ============================================

export { ZeroEnvironment }
export type { ZeroEnvironmentProps, ZeroMode }
