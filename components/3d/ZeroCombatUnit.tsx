/**
 * ⚔️ ZERO COMBAT UNIT - Núcleo Gráfico Táctico
 * 
 * Versión avanzada del avatar con capacidades de combate:
 * - Sistema de apuntado láser (targeting)
 * - Disparo de energía hacia objetivos HTML
 * - Escudo de defensa holográfico
 * - Animaciones de alerta máxima
 * - Interfaz de estado diegética
 */

'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useSpline } from '@splinetool/r3f-spline'
import { Float, Html, Line, Trail } from '@react-three/drei'
import * as THREE from 'three'
import { easing } from 'maath'

// Importar shader
import '@/components/3d/shaders/ZeroEyeShader'

// ============================================
// TIPOS
// ============================================

type CombatMode = 'idle' | 'processing' | 'combat' | 'success' | 'charging'

interface ZeroCombatUnitProps {
  /** Modo actual del sistema */
  mode: CombatMode
  /** Referencia al elemento HTML objetivo del láser */
  targetRef?: React.RefObject<HTMLElement>
  /** Si el láser está activo */
  laserActive?: boolean
  /** Escala del modelo */
  scale?: number
  /** Callback al completar disparo */
  onFireComplete?: () => void
}

interface ShaderMaterialRef {
  uTime: number
  uColor: THREE.Color
  uIntensity: number
  uSpeech: number
  uProcessing: number
  uGlitchIntensity: number
  uPulseSpeed: number
  uOpen: number
}

// URL del modelo Spline
const SPLINE_URL = 'https://prod.spline.design/vHxa0bsc1kY1H3nh/scene.splinecode'

// ============================================
// COMPONENTES AUXILIARES
// ============================================

/** Láser de energía táctico */
function TacticalLaser({
  active,
  color,
  startPoint,
  endPoint,
}: {
  active: boolean
  color: string
  startPoint: THREE.Vector3
  endPoint: THREE.Vector3
}) {
  const laserRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (laserRef.current && active) {
      // Pulso del láser
      const pulse = Math.sin(state.clock.elapsedTime * 20) * 0.3 + 0.7
      laserRef.current.scale.x = pulse
      laserRef.current.scale.z = pulse
    }
  })
  
  if (!active) return null
  
  // Calcular dirección y longitud
  const direction = endPoint.clone().sub(startPoint)
  const length = direction.length()
  const midPoint = startPoint.clone().add(direction.multiplyScalar(0.5))
  
  return (
    <group>
      {/* Rayo principal */}
      <mesh
        ref={laserRef}
        position={midPoint}
        rotation={[0, 0, Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)]}
      >
        <cylinderGeometry args={[0.02, 0.05, length, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      
      {/* Línea de energía */}
      <Line
        points={[startPoint, endPoint]}
        color={color}
        lineWidth={3}
        transparent
        opacity={0.6}
      />
      
      {/* Punto de impacto */}
      <mesh position={endPoint}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
    </group>
  )
}

/** Escudo holográfico de defensa */
function DefenseShield({ active, color }: { active: boolean; color: string }) {
  const shieldRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (shieldRef.current) {
      shieldRef.current.rotation.y = state.clock.elapsedTime * 0.5
      shieldRef.current.rotation.z = state.clock.elapsedTime * 0.3
      
      // Pulso del escudo
      const scale = active ? 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05 : 0
      shieldRef.current.scale.setScalar(scale)
    }
  })
  
  return (
    <mesh ref={shieldRef}>
      <icosahedronGeometry args={[2, 1]} />
      <meshBasicMaterial
        color={color}
        wireframe
        transparent
        opacity={active ? 0.3 : 0}
      />
    </mesh>
  )
}

/** Sistema de partículas de carga */
function ChargingParticles({ active }: { active: boolean }) {
  const particlesRef = useRef<THREE.Points>(null)
  
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(100 * 3)
    for (let i = 0; i < 100; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const r = 1.5 + Math.random() * 0.5
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    return positions
  }, [])
  
  useFrame((state) => {
    if (particlesRef.current && active) {
      particlesRef.current.rotation.y = state.clock.elapsedTime
      
      // Las partículas se comprimen hacia el centro cuando carga
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < positions.length; i += 3) {
        const factor = 0.95 + Math.sin(state.clock.elapsedTime * 10 + i) * 0.05
        positions[i] *= factor
        positions[i + 1] *= factor
        positions[i + 2] *= factor
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })
  
  if (!active) return null
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={100}
          array={particlePositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#00ffff"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ZeroCombatUnit({
  mode,
  targetRef,
  laserActive = false,
  scale = 2.5,
  onFireComplete,
}: ZeroCombatUnitProps) {
  // Cargar modelo
  const { nodes } = useSpline(SPLINE_URL)
  
  // Referencias
  const groupRef = useRef<THREE.Group>(null)
  const eyeMaterialRef = useRef<ShaderMaterialRef | null>(null)
  const laserStartRef = useRef(new THREE.Vector3(0, 0.5, 0.5))
  const laserEndRef = useRef(new THREE.Vector3(5, 2, 0))
  
  // Three.js context
  const { pointer, size } = useThree()
  
  // Estado interno
  const [isCharging, setIsCharging] = useState(false)
  const [localLaserActive, setLocalLaserActive] = useState(false)

  // Colores por modo
  const colors = useMemo(() => ({
    idle: '#00f0ff',
    processing: '#ffaa00',
    combat: '#ff0000',
    success: '#00ff66',
    charging: '#00ffff',
  }), [])

  // Efecto para coordinar láser con target HTML
  useEffect(() => {
    if (mode === 'success' && targetRef?.current) {
      setIsCharging(true)
      
      // Cargar por 500ms, luego disparar
      const chargeTimer = setTimeout(() => {
        setIsCharging(false)
        setLocalLaserActive(true)
        
        // Mantener láser por 1.5s
        const laserTimer = setTimeout(() => {
          setLocalLaserActive(false)
          onFireComplete?.()
        }, 1500)
        
        return () => clearTimeout(laserTimer)
      }, 500)
      
      return () => clearTimeout(chargeTimer)
    }
  }, [mode, targetRef, onFireComplete])

  // ============================================
  // FRAME LOOP
  // ============================================
  
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    
    if (!groupRef.current) return

    // ===== 1. SHADER DE OJOS =====
    if (eyeMaterialRef.current) {
      const mat = eyeMaterialRef.current
      mat.uTime = t
      
      // Color y efectos según modo
      switch (mode) {
        case 'combat':
          mat.uColor.setRGB(3.0, 0.0, 0.0)
          mat.uIntensity = 3.0 + Math.sin(t * 10) * 0.5
          mat.uGlitchIntensity = 0.3
          mat.uPulseSpeed = 10.0
          break
        case 'processing':
          mat.uColor.setRGB(2.0, 1.5, 0.0)
          mat.uProcessing = 1.0
          mat.uPulseSpeed = 6.0
          break
        case 'success':
          mat.uColor.setRGB(0.0, 2.5, 0.5)
          mat.uIntensity = 2.5
          break
        case 'charging':
          mat.uColor.setRGB(0.0, 2.0, 2.0)
          mat.uIntensity = 1.5 + t * 0.5
          break
        default:
          mat.uColor.setRGB(2.5, 0.0, 0.0)
          mat.uIntensity = 2.0
          mat.uGlitchIntensity = 0.1
      }
    }

    // ===== 2. MOVIMIENTO DE TORRETA =====
    // Seguir mouse con lag
    const targetRotX = -pointer.y * 0.3
    const targetRotY = pointer.x * 0.5
    
    easing.dampE(
      groupRef.current.rotation,
      [targetRotX, targetRotY, 0],
      0.2,
      delta
    )

    // ===== 3. FLOTACIÓN Y VIBRACIÓN =====
    const shake = mode === 'combat' 
      ? Math.sin(t * 50) * 0.05 
      : 0
    
    const floatY = Math.sin(t) * 0.2
    groupRef.current.position.y = floatY + shake - 1.5

    // ===== 4. ACTUALIZAR POSICIÓN DEL LÁSER =====
    if (targetRef?.current && (localLaserActive || laserActive)) {
      // Convertir posición del elemento HTML a coordenadas 3D
      const rect = targetRef.current.getBoundingClientRect()
      const x = ((rect.left + rect.width / 2) / size.width) * 2 - 1
      const y = -((rect.top + rect.height / 2) / size.height) * 2 + 1
      
      laserEndRef.current.set(x * 8, y * 4, -2)
    }
  })

  // ============================================
  // GEOMETRÍA DEL OJO
  // ============================================
  
  const eyeGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(2.5, 0.6, 32, 8)
  }, [])

  // Buscar nodo de visor en el modelo
  const visorNode = useMemo(() => {
    if (!nodes) return null
    const names = ['Visor', 'Glass', 'Eyes', 'Eye', 'Head', 'Screen']
    for (const name of names) {
      if (nodes[name]) return nodes[name] as THREE.Mesh
    }
    return null
  }, [nodes])

  // ============================================
  // RENDER
  // ============================================

  return (
    <group ref={groupRef} scale={scale} position={[0, -1.5, 0]}>
      
      {/* ===== MODELO BASE ===== */}
      {nodes && (
        <primitive object={nodes.Scene || nodes.Root || nodes} />
      )}

      {/* ===== OJO SHADER PROCEDURAL ===== */}
      {visorNode?.geometry ? (
        <mesh
          geometry={visorNode.geometry}
          position={visorNode.position}
          rotation={visorNode.rotation}
          scale={visorNode.scale}
        >
          {/* @ts-expect-error - Custom shader */}
          <zeroEyeMaterial
            ref={eyeMaterialRef}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ) : (
        <mesh geometry={eyeGeometry} position={[0, 0.8, 0.5]}>
          {/* @ts-expect-error - Custom shader */}
          <zeroEyeMaterial
            ref={eyeMaterialRef}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* ===== SISTEMA DE LÁSER TÁCTICO ===== */}
      <TacticalLaser
        active={localLaserActive || laserActive}
        color={colors[mode]}
        startPoint={laserStartRef.current}
        endPoint={laserEndRef.current}
      />

      {/* ===== ESCUDO DE DEFENSA ===== */}
      <DefenseShield
        active={mode === 'combat'}
        color={colors.combat}
      />

      {/* ===== PARTÍCULAS DE CARGA ===== */}
      <ChargingParticles active={isCharging || mode === 'charging'} />

      {/* ===== LUCES DINÁMICAS ===== */}
      <pointLight
        position={[0, 1, 0.5]}
        intensity={mode === 'combat' ? 15 : 5}
        color={colors[mode]}
        distance={5}
        decay={2}
      />
      
      {/* Luz trasera de ambiente */}
      <pointLight
        position={[0, 0, -1]}
        intensity={2}
        color="#001133"
        distance={3}
      />

      {/* ===== HUD DE ESTADO DIEGÉTICO ===== */}
      <Html position={[0, 2.5, 0]} center transform sprite>
        <div
          className={`
            px-4 py-1 rounded border backdrop-blur-md 
            font-mono text-[10px] tracking-[0.2em] uppercase 
            transition-all duration-300
            ${mode === 'combat'
              ? 'border-red-500 text-red-500 bg-red-900/30 animate-pulse shadow-[0_0_30px_rgba(255,0,0,0.5)]'
              : mode === 'processing'
                ? 'border-yellow-500 text-yellow-500 bg-yellow-900/30'
                : mode === 'success'
                  ? 'border-green-500 text-green-500 bg-green-900/30'
                  : 'border-cyan-500 text-cyan-500 bg-cyan-900/30'
            }
          `}
        >
          <span className="inline-block w-2 h-2 rounded-full bg-current mr-2 animate-pulse" />
          SYSTEM: {mode.toUpperCase()}
        </div>
      </Html>

      {/* ===== INDICADORES DE TARGETING ===== */}
      {(localLaserActive || laserActive) && (
        <Html position={laserEndRef.current} center transform sprite>
          <div className="w-8 h-8 border-2 border-green-500 rounded-full animate-ping opacity-50" />
        </Html>
      )}
    </group>
  )
}

// ============================================
// EXPORTS
// ============================================

export { ZeroCombatUnit }
export type { ZeroCombatUnitProps, CombatMode }
