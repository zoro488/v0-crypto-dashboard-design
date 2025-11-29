'use client'

/**
 * ZeroAvatar - Avatar 3D de Zero Force usando Spline + Ojos Rojos Procedurales
 * 
 * Características:
 * - Modelo 3D de Spline como base del avatar
 * - Ojos rojos rasgados horizontales superpuestos con shader GLSL
 * - Seguimiento del mouse (torreta)
 * - Flotación y vibración según estado
 * - Paleta: Negro, Plata, Blanco con luces rojas
 * - Reacción a voz y estados emocionales
 */

import { useRef, useMemo, useEffect, useState, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Float, Html } from '@react-three/drei'
import * as THREE from 'three'
import dynamic from 'next/dynamic'

// Importar Spline dinámicamente (solo cliente)
const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false })

// Importar el shader para los ojos
import '@/app/components/3d/shaders/ZeroEyeShader'

// ============================================
// TIPOS
// ============================================

export type ZeroState = 'idle' | 'listening' | 'speaking' | 'processing' | 'combat' | 'success' | 'error';

export interface ZeroAvatarProps {
  state?: ZeroState;
  isSpeaking?: boolean;
  isListening?: boolean;
  speechAmplitude?: number;
  lookAtMouse?: boolean;
  showLaser?: boolean;
  laserTarget?: THREE.Vector3;
  scale?: number;
  position?: [number, number, number];
  onReady?: () => void;
  useSpline?: boolean; // Si usar Spline o fallback a geometría
}

// ============================================
// CONSTANTES
// ============================================

// URL del modelo Spline principal para el AVATAR (Panel IA)
const SPLINE_AVATAR_URL = 'https://prod.spline.design/vHxa0bsc1kY1H3nh/scene.splinecode'

// URLs alternativas
const SPLINE_URLS = {
  avatar: 'https://prod.spline.design/vHxa0bsc1kY1H3nh/scene.splinecode',  // Avatar principal
  widget: 'https://prod.spline.design/xdhWZ6ngBTNQdXGg/scene.splinecode',  // Widget flotante
  secondary: 'https://prod.spline.design/rDqZ3vhiRfKgffI2/scene.splinecode', // Secundario
}

// Colores por estado para los ojos
const STATE_COLORS = {
  idle: new THREE.Color(2.0, 0.0, 0.0),      // Rojo brillante
  listening: new THREE.Color(0.0, 2.0, 0.5), // Verde escucha
  speaking: new THREE.Color(2.0, 0.0, 0.0),  // Rojo al hablar
  processing: new THREE.Color(2.0, 1.5, 0.0), // Naranja/Amarillo
  combat: new THREE.Color(3.0, 0.0, 0.0),    // Rojo intenso combate
  success: new THREE.Color(0.0, 2.0, 0.0),   // Verde éxito
  error: new THREE.Color(3.0, 0.0, 0.0),     // Rojo error
} as const

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function ZeroAvatar({
  state = 'idle',
  isSpeaking = false,
  isListening = false,
  speechAmplitude = 0,
  lookAtMouse = true,
  showLaser = false,
  laserTarget,
  scale = 1.5,
  position = [0, 0, 0],
  onReady,
}: ZeroAvatarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const eyeMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const laserRef = useRef<THREE.Mesh>(null)
  const innerGlowRef = useRef<THREE.PointLight>(null)
  
  const [isReady, setIsReady] = useState(false)
  const { pointer } = useThree()

  // Determinar estado efectivo
  const effectiveState = useMemo((): ZeroState => {
    if (isSpeaking) return 'speaking'
    if (isListening) return 'listening'
    return state
  }, [state, isSpeaking, isListening])

  // Color actual
  const currentColor = useMemo(() => {
    return STATE_COLORS[effectiveState] || STATE_COLORS.idle
  }, [effectiveState])

  // Notificar cuando esté listo
  useEffect(() => {
    if (!isReady) {
      setIsReady(true)
      onReady?.()
    }
  }, [isReady, onReady])

  // Frame loop principal
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    const time = state.clock.elapsedTime

    // ========================================
    // 1. ACTUALIZAR SHADER DEL OJO
    // ========================================
    if (eyeMaterialRef.current) {
      const mat = eyeMaterialRef.current
      
      // Tiempo
      mat.uniforms.uTime.value = time
      
      // Color según estado
      mat.uniforms.uColor.value.lerp(currentColor, delta * 3)
      
      // Intensidad de habla
      const targetSpeech = isSpeaking ? Math.max(speechAmplitude, 0.5) : 0
      mat.uniforms.uSpeech.value += (targetSpeech - mat.uniforms.uSpeech.value) * delta * 8
      
      // Modo combate/angry
      const targetAngry = effectiveState === 'combat' || effectiveState === 'error' ? 1.0 : 0.0
      mat.uniforms.uAngry.value += (targetAngry - mat.uniforms.uAngry.value) * delta * 5
      
      // Glitch en procesamiento o error
      const targetGlitch = effectiveState === 'processing' ? 0.3 : 
                           effectiveState === 'error' ? 0.6 : 0.0
      mat.uniforms.uGlitchIntensity.value += (targetGlitch - mat.uniforms.uGlitchIntensity.value) * delta * 4
      
      // Velocidad de escaneo según estado
      mat.uniforms.uScanSpeed.value = effectiveState === 'combat' ? 8.0 :
                                       effectiveState === 'processing' ? 5.0 : 3.0
    }

    // ========================================
    // 2. MOVIMIENTO DEL AVATAR
    // ========================================
    // Flotación base
    const floatSpeed = effectiveState === 'combat' ? 15 : 
                       effectiveState === 'processing' ? 8 : 2
    const floatIntensity = effectiveState === 'combat' ? 0.05 : 
                           effectiveState === 'processing' ? 0.03 : 0.1
    
    groupRef.current.position.y = position[1] + Math.sin(time * floatSpeed) * floatIntensity
    
    // Vibración en combate
    if (effectiveState === 'combat') {
      groupRef.current.position.x = position[0] + Math.sin(time * 30) * 0.02
      groupRef.current.position.z = position[2] + Math.cos(time * 25) * 0.02
    }

    // ========================================
    // 3. SEGUIMIENTO DEL MOUSE (TORRETA)
    // ========================================
    if (lookAtMouse) {
      const targetRotationY = pointer.x * 0.5
      const targetRotationX = -pointer.y * 0.3
      
      // Lerp suave
      groupRef.current.rotation.y += (targetRotationY - groupRef.current.rotation.y) * delta * 3
      groupRef.current.rotation.x += (targetRotationX - groupRef.current.rotation.x) * delta * 3
    }

    // ========================================
    // 4. LUZ INTERNA
    // ========================================
    if (innerGlowRef.current) {
      // Intensidad pulsante
      const pulseIntensity = effectiveState === 'speaking' ? 8 + Math.sin(time * 10) * 4 :
                             effectiveState === 'combat' ? 10 + Math.sin(time * 15) * 5 :
                             4 + Math.sin(time * 2) * 1
      
      innerGlowRef.current.intensity = pulseIntensity
      innerGlowRef.current.color = currentColor
    }

    // ========================================
    // 5. LÁSER TÁCTICO
    // ========================================
    if (laserRef.current) {
      laserRef.current.visible = showLaser
      
      if (showLaser) {
        // Pulso del láser
        const laserPulse = 1 + Math.sin(time * 30) * 0.3
        laserRef.current.scale.set(laserPulse, 1, laserPulse)
      }
    }
  })

  return (
    <Float 
      speed={effectiveState === 'combat' ? 0 : 2} 
      rotationIntensity={effectiveState === 'combat' ? 0 : 0.2} 
      floatIntensity={effectiveState === 'combat' ? 0 : 0.3}
    >
      <group ref={groupRef} scale={scale} position={position}>
        
        {/* ======================================== */}
        {/* CUERPO DEL DRON (Geometría Base) */}
        {/* ======================================== */}
        <group>
          {/* Cuerpo principal - Forma de dron angular */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.2, 0.4, 0.8]} />
            <meshStandardMaterial 
              color="#0a0a0a" 
              metalness={0.9} 
              roughness={0.2}
              envMapIntensity={1}
            />
          </mesh>
          
          {/* Panel superior */}
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.8, 0.1, 0.5]} />
            <meshStandardMaterial 
              color="#151515" 
              metalness={0.8} 
              roughness={0.3}
            />
          </mesh>
          
          {/* Alas/Alerones laterales */}
          <mesh position={[0.7, 0, 0]} rotation={[0, 0, Math.PI * 0.1]}>
            <boxGeometry args={[0.5, 0.05, 0.3]} />
            <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[-0.7, 0, 0]} rotation={[0, 0, -Math.PI * 0.1]}>
            <boxGeometry args={[0.5, 0.05, 0.3]} />
            <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.2} />
          </mesh>
          
          {/* Propulsores traseros */}
          <mesh position={[0.3, -0.1, -0.4]}>
            <cylinderGeometry args={[0.08, 0.1, 0.15, 8]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[-0.3, -0.1, -0.4]}>
            <cylinderGeometry args={[0.08, 0.1, 0.15, 8]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.4} />
          </mesh>
          
          {/* Líneas de detalle luminosas */}
          <mesh position={[0, 0, 0.41]}>
            <planeGeometry args={[1.0, 0.02]} />
            <meshBasicMaterial color={currentColor} transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, 0.15, 0.35]}>
            <planeGeometry args={[0.6, 0.01]} />
            <meshBasicMaterial color={currentColor} transparent opacity={0.5} />
          </mesh>
        </group>

        {/* ======================================== */}
        {/* VISOR / OJOS ROJOS RASGADOS */}
        {/* ======================================== */}
        <mesh position={[0, 0.05, 0.42]}>
          <planeGeometry args={[0.9, 0.25]} />
          {/* @ts-ignore - Custom shader material */}
          <zeroEyeMaterial
            ref={eyeMaterialRef}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Reflejo/Halo del visor */}
        <mesh position={[0, 0.05, 0.40]}>
          <planeGeometry args={[1.0, 0.35]} />
          <meshBasicMaterial 
            color={currentColor} 
            transparent 
            opacity={0.1} 
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* ======================================== */}
        {/* LUCES INTERNAS (GLOW) */}
        {/* ======================================== */}
        {/* Luz principal del visor */}
        <pointLight
          ref={innerGlowRef}
          position={[0, 0.1, 0.6]}
          intensity={5}
          color={currentColor}
          distance={3}
          decay={2}
        />
        
        {/* Luces de los "ojos" */}
        <pointLight
          position={[0.2, 0.1, 0.5]}
          intensity={3}
          color={currentColor}
          distance={1.5}
          decay={2}
        />
        <pointLight
          position={[-0.2, 0.1, 0.5]}
          intensity={3}
          color={currentColor}
          distance={1.5}
          decay={2}
        />
        
        {/* Luz de propulsores */}
        <pointLight
          position={[0, -0.2, -0.5]}
          intensity={effectiveState === 'combat' ? 5 : 2}
          color="#ff4400"
          distance={1}
          decay={2}
        />

        {/* ======================================== */}
        {/* LÁSER TÁCTICO */}
        {/* ======================================== */}
        <mesh 
          ref={laserRef} 
          position={[0.5, 0, 1]} 
          rotation={[Math.PI / 2, 0, -Math.PI / 6]}
          visible={false}
        >
          <cylinderGeometry args={[0.01, 0.03, 8, 8]} />
          <meshBasicMaterial 
            color={effectiveState === 'success' ? '#00ff00' : '#ff0000'} 
            transparent 
            opacity={0.7}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* ======================================== */}
        {/* INDICADOR DE ESTADO (HTML 3D) */}
        {/* ======================================== */}
        <Html position={[0, 0.6, 0]} center transform sprite distanceFactor={8}>
          <div className={`
            px-3 py-1 rounded-full border backdrop-blur-md font-mono text-[9px] tracking-[0.15em] uppercase 
            transition-all duration-300 whitespace-nowrap select-none
            ${effectiveState === 'combat' || effectiveState === 'error' 
              ? 'border-red-500/50 text-red-400 bg-red-900/30 animate-pulse' 
              : effectiveState === 'processing' 
              ? 'border-yellow-500/50 text-yellow-400 bg-yellow-900/30' 
              : effectiveState === 'listening'
              ? 'border-green-500/50 text-green-400 bg-green-900/30'
              : effectiveState === 'success'
              ? 'border-emerald-500/50 text-emerald-400 bg-emerald-900/30'
              : 'border-red-500/30 text-red-300 bg-red-900/20'}
          `}>
            ZERO: {effectiveState.toUpperCase()}
          </div>
        </Html>
      </group>
    </Float>
  )
}

export default ZeroAvatar
