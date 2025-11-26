/**
 * 🤖 ZERO AVATAR - Avatar Táctico 3D con Shader Procedural
 * 
 * Este componente carga el modelo de Spline e inyecta el shader
 * procedural de los ojos rojos. También maneja:
 * - Seguimiento del mouse (torreta)
 * - Animación de flotación
 * - Reacción a la voz
 * - Estados de procesamiento
 */

'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useSpline } from '@splinetool/r3f-spline'
import { Float, Html } from '@react-three/drei'
import * as THREE from 'three'
import { easing } from 'maath'

// Importar el shader para registrarlo en Three.js
import '@/components/3d/shaders/ZeroEyeShader'

// URLs de los modelos Spline (usar como referencia geométrica)
const SPLINE_URLS = {
  primary: 'https://prod.spline.design/xdhWZ6ngBTNQdXGg/scene.splinecode',
  secondary: 'https://prod.spline.design/rDqZ3vhiRfKgffI2/scene.splinecode',
}

// ============================================
// TIPOS
// ============================================

interface ZeroAvatarProps {
  /** Si Zero está hablando (activa animación de ojos) */
  isSpeaking?: boolean
  /** Si Zero está procesando/pensando */
  isProcessing?: boolean
  /** Si Zero está en modo alerta/combate */
  isCombat?: boolean
  /** Escala del modelo */
  scale?: number
  /** Mostrar etiqueta de estado */
  showStatus?: boolean
  /** Callback cuando Zero termina una animación */
  onAnimationComplete?: () => void
}

interface ShaderMaterialRef {
  uTime: number
  uColor: THREE.Color
  uSecondaryColor: THREE.Color
  uIntensity: number
  uOpen: number
  uSpeech: number
  uProcessing: number
  uPulseSpeed: number
  uScanSpeed: number
  uGlitchIntensity: number
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ZeroAvatar({
  isSpeaking = false,
  isProcessing = false,
  isCombat = false,
  scale = 1.5,
  showStatus = true,
  onAnimationComplete,
}: ZeroAvatarProps) {
  // Cargar modelo Spline
  const { nodes, materials } = useSpline(SPLINE_URLS.primary)
  
  // Referencias
  const groupRef = useRef<THREE.Group>(null)
  const eyeMaterialRef = useRef<ShaderMaterialRef | null>(null)
  const headRef = useRef<THREE.Group>(null)
  
  // Three.js context
  const { pointer, viewport } = useThree()
  
  // Estado interno para animaciones suaves
  const internalState = useRef({
    currentSpeech: 0,
    currentProcessing: 0,
    currentIntensity: 2.0,
    blinkTimer: 0,
    isBlinking: false,
  })

  // ============================================
  // BUSCAR NODOS DEL MODELO
  // ============================================
  
  // Intentar encontrar el nodo del visor/ojos en el modelo Spline
  const visorNode = useMemo(() => {
    if (!nodes) return null
    
    // Lista de nombres comunes para el visor/ojos
    const possibleNames = [
      'Visor', 'visor', 'VISOR',
      'Glass', 'glass', 'GLASS',
      'Eyes', 'eyes', 'EYES', 'Eye', 'eye',
      'Head', 'head', 'HEAD',
      'Face', 'face', 'FACE',
      'Screen', 'screen', 'SCREEN',
      'Display', 'display',
      'Lens', 'lens',
    ]
    
    for (const name of possibleNames) {
      if (nodes[name]) {
        return nodes[name] as THREE.Mesh
      }
    }
    
    return null
  }, [nodes])

  // ============================================
  // FRAME LOOP - ANIMACIONES
  // ============================================
  
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    const internal = internalState.current
    
    if (!groupRef.current) return

    // ===== 1. ANIMACIÓN DEL SHADER (Ojos) =====
    if (eyeMaterialRef.current) {
      const mat = eyeMaterialRef.current
      
      // Actualizar tiempo
      mat.uTime = time
      
      // Interpolar suavemente speech y processing
      internal.currentSpeech = THREE.MathUtils.lerp(
        internal.currentSpeech,
        isSpeaking ? 1.0 : 0.0,
        delta * 5
      )
      internal.currentProcessing = THREE.MathUtils.lerp(
        internal.currentProcessing,
        isProcessing ? 1.0 : 0.0,
        delta * 3
      )
      
      mat.uSpeech = internal.currentSpeech
      mat.uProcessing = internal.currentProcessing
      
      // Cambiar color según estado
      if (isCombat) {
        mat.uColor.setRGB(3.0, 0.0, 0.0) // Rojo más intenso
        mat.uGlitchIntensity = 0.3
        mat.uPulseSpeed = 8.0
      } else if (isProcessing) {
        mat.uColor.setRGB(2.0, 1.5, 0.0) // Naranja/amarillo
        mat.uGlitchIntensity = 0.05
        mat.uPulseSpeed = 5.0
      } else {
        mat.uColor.setRGB(2.5, 0.0, 0.0) // Rojo normal
        mat.uGlitchIntensity = 0.1
        mat.uPulseSpeed = 3.0
      }
      
      // Intensidad dinámica
      const targetIntensity = isSpeaking ? 3.0 : (isCombat ? 4.0 : 2.0)
      internal.currentIntensity = THREE.MathUtils.lerp(
        internal.currentIntensity,
        targetIntensity,
        delta * 2
      )
      mat.uIntensity = internal.currentIntensity
      
      // Parpadeo automático ocasional
      internal.blinkTimer += delta
      if (internal.blinkTimer > 4 + Math.random() * 3 && !internal.isBlinking) {
        internal.isBlinking = true
        internal.blinkTimer = 0
      }
      
      if (internal.isBlinking) {
        mat.uOpen = Math.max(0, mat.uOpen - delta * 8)
        if (mat.uOpen <= 0) {
          internal.isBlinking = false
        }
      } else {
        mat.uOpen = Math.min(1, mat.uOpen + delta * 8)
      }
    }

    // ===== 2. SEGUIMIENTO DEL MOUSE (Torreta) =====
    const targetRotationX = -pointer.y * 0.3
    const targetRotationY = pointer.x * 0.5
    
    // Damping suave para seguimiento
    easing.dampE(
      groupRef.current.rotation,
      [targetRotationX, targetRotationY, 0],
      0.15,
      delta
    )

    // ===== 3. FLOTACIÓN Y VIBRACIÓN =====
    const floatSpeed = isProcessing ? 8 : (isCombat ? 15 : 2)
    const floatAmplitude = isProcessing ? 0.03 : (isCombat ? 0.08 : 0.1)
    
    // Movimiento vertical
    groupRef.current.position.y = Math.sin(time * floatSpeed) * floatAmplitude
    
    // Vibración en combate
    if (isCombat) {
      groupRef.current.position.x = (Math.random() - 0.5) * 0.02
      groupRef.current.position.z = (Math.random() - 0.5) * 0.02
    }

    // ===== 4. INCLINACIÓN DINÁMICA =====
    // Pequeña inclinación basada en el movimiento
    const tiltZ = Math.sin(time * 0.5) * 0.05
    groupRef.current.rotation.z = tiltZ
  })

  // ============================================
  // GEOMETRÍA DEL OJO PROCEDURAL
  // ============================================
  
  // Si no encontramos el visor en Spline, creamos geometría propia
  const eyeGeometry = useMemo(() => {
    // Plano horizontal para el ojo rasgado
    return new THREE.PlaneGeometry(2.5, 0.6, 32, 8)
  }, [])

  // ============================================
  // RENDER
  // ============================================

  return (
    <Float
      speed={2}
      rotationIntensity={isCombat ? 0.5 : 0.2}
      floatIntensity={isCombat ? 0.3 : 0.5}
    >
      <group ref={groupRef} scale={scale}>
        
        {/* ===== MODELO BASE DE SPLINE ===== */}
        {nodes && (
          <primitive 
            object={nodes.Scene || nodes.Root || nodes} 
            dispose={null}
          />
        )}

        {/* ===== OJO PROCEDURAL CUSTOM ===== */}
        {/* Si encontramos el visor de Spline, lo usamos como base */}
        {visorNode && visorNode.geometry ? (
          <mesh
            geometry={visorNode.geometry}
            position={visorNode.position}
            rotation={visorNode.rotation}
            scale={visorNode.scale}
          >
            {/* @ts-expect-error - Custom shader material */}
            <zeroEyeMaterial
              ref={eyeMaterialRef}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
        ) : (
          /* Si no hay visor, creamos uno propio */
          <mesh
            geometry={eyeGeometry}
            position={[0, 0.8, 0.5]}
            rotation={[0, 0, 0]}
          >
            {/* @ts-expect-error - Custom shader material */}
            <zeroEyeMaterial
              ref={eyeMaterialRef}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* ===== LUCES DINÁMICAS DE LOS OJOS ===== */}
        <pointLight
          position={[0, 0.8, 1]}
          intensity={isCombat ? 15 : (isSpeaking ? 8 : 3)}
          color={isCombat ? '#ff0000' : (isProcessing ? '#ffaa00' : '#ff0000')}
          distance={5}
          decay={2}
        />
        
        {/* Luz secundaria para relleno */}
        <pointLight
          position={[0, 0.5, -0.5]}
          intensity={1}
          color="#330000"
          distance={3}
          decay={2}
        />

        {/* ===== HUD DE ESTADO (Opcional) ===== */}
        {showStatus && (
          <Html
            position={[0, 2, 0]}
            center
            transform
            sprite
            distanceFactor={8}
          >
            <div
              className={`
                px-4 py-1.5 rounded-lg border backdrop-blur-md 
                font-mono text-[10px] tracking-[0.2em] uppercase 
                transition-all duration-300 whitespace-nowrap
                ${isCombat 
                  ? 'border-red-500 text-red-400 bg-red-950/40 animate-pulse shadow-[0_0_20px_rgba(255,0,0,0.4)]' 
                  : isProcessing 
                    ? 'border-yellow-500 text-yellow-400 bg-yellow-950/40 shadow-[0_0_15px_rgba(255,170,0,0.3)]' 
                    : isSpeaking
                      ? 'border-cyan-500 text-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                      : 'border-red-800 text-red-500 bg-red-950/30'
                }
              `}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-current mr-2 animate-pulse" />
              ZERO: {isCombat ? 'ALERTA' : isProcessing ? 'PROCESANDO' : isSpeaking ? 'TRANSMITIENDO' : 'EN LÍNEA'}
            </div>
          </Html>
        )}

        {/* ===== PARTÍCULAS DE ENERGÍA (Combate) ===== */}
        {isCombat && (
          <group>
            {[...Array(8)].map((_, i) => (
              <mesh
                key={i}
                position={[
                  Math.sin(i * 0.8) * 1.5,
                  Math.cos(i * 0.8) * 0.5 + 0.8,
                  Math.sin(i * 1.2) * 0.5,
                ]}
              >
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
              </mesh>
            ))}
          </group>
        )}
      </group>
    </Float>
  )
}

// ============================================
// EXPORTS
// ============================================

export { ZeroAvatar }
export type { ZeroAvatarProps }
