"use client"

import { useRef, useMemo, useState, useEffect, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { motion, AnimatePresence } from "framer-motion"
import * as THREE from "three"

// Constantes de configuración
const STAR_COUNT = 2000
const STAR_DEPTH = 100
const INITIAL_SPEED = 0.5
const WARP_SPEED = 15
const TRANSITION_DURATION = 3000 // ms hasta el warp
const WARP_DURATION = 800 // ms del efecto warp

// Interface para las props del componente
interface SplashTransitionProps {
  onComplete?: () => void
  duration?: number
  skipOnClick?: boolean
  showProgress?: boolean
  brandText?: string
  tagline?: string
}

// Interface para una estrella
interface Star {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  size: number
  color: THREE.Color
  trail: THREE.Vector3[]
}

// Componente de campo de estrellas con efecto túnel
function StarfieldTunnel({
  speed,
  isWarping,
}: {
  speed: number
  isWarping: boolean
}) {
  const pointsRef = useRef<THREE.Points>(null)
  
  // Generar geometría y datos con THREE directamente
  const { geometry, velocities, baseSizes } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    
    const positions = new Float32Array(STAR_COUNT * 3)
    const colors = new Float32Array(STAR_COUNT * 3)
    const sizes = new Float32Array(STAR_COUNT)
    const velocities = new Float32Array(STAR_COUNT * 3)
    const baseSizes = new Float32Array(STAR_COUNT)
    
    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3
      
      // Distribución cilíndrica para efecto de túnel
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 20 + 2
      
      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = Math.sin(angle) * radius
      positions[i3 + 2] = Math.random() * STAR_DEPTH - STAR_DEPTH
      
      // Velocidades hacia la cámara
      velocities[i3] = 0
      velocities[i3 + 1] = 0
      velocities[i3 + 2] = Math.random() * 0.5 + 0.5
      
      // Colores variados (blancos, azules, púrpuras)
      const colorChoice = Math.random()
      if (colorChoice < 0.6) {
        colors[i3] = 0.9 + Math.random() * 0.1
        colors[i3 + 1] = 0.9 + Math.random() * 0.1
        colors[i3 + 2] = 1.0
      } else if (colorChoice < 0.85) {
        colors[i3] = 0.3 + Math.random() * 0.3
        colors[i3 + 1] = 0.5 + Math.random() * 0.3
        colors[i3 + 2] = 1.0
      } else {
        colors[i3] = 0.6 + Math.random() * 0.4
        colors[i3 + 1] = 0.2 + Math.random() * 0.2
        colors[i3 + 2] = 0.8 + Math.random() * 0.2
      }
      
      // Tamaños variados
      const baseSize = Math.random() * 3 + 1
      sizes[i] = baseSize
      baseSizes[i] = baseSize
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    return { geometry: geo, velocities, baseSizes }
  }, [])
  
  // Animación del campo de estrellas
  useFrame((state, delta) => {
    if (!pointsRef.current) return
    
    const posArray = geometry.attributes.position.array as Float32Array
    const sizeArray = geometry.attributes.size.array as Float32Array
    
    const currentSpeed = speed * (isWarping ? 5 : 1)
    
    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3
      
      // Mover la estrella hacia la cámara
      posArray[i3 + 2] += velocities[i3 + 2] * currentSpeed * delta * 60
      
      // Si la estrella pasa la cámara, reiniciarla al fondo
      if (posArray[i3 + 2] > 10) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * 20 + 2
        
        posArray[i3] = Math.cos(angle) * radius
        posArray[i3 + 1] = Math.sin(angle) * radius
        posArray[i3 + 2] = -STAR_DEPTH
      }
      
      // Escalar tamaño basado en proximidad (efecto de perspectiva)
      const depth = posArray[i3 + 2]
      const scaleFactor = Math.max(0.1, (depth + STAR_DEPTH) / STAR_DEPTH)
      sizeArray[i] = baseSizes[i] * scaleFactor * (isWarping ? 3 : 1)
      
      // En modo warp, las estrellas se estiran
      if (isWarping && depth > -STAR_DEPTH * 0.8) {
        posArray[i3 + 2] += currentSpeed * delta * 60 * 2
      }
    }
    
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.size.needsUpdate = true
    
    // Rotación sutil del campo de estrellas
    pointsRef.current.rotation.z += delta * 0.02 * (isWarping ? 3 : 1)
  })
  
  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={2}
        vertexColors
        transparent
        opacity={isWarping ? 0.9 : 0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Efecto de destello central durante el warp
function WarpFlash({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    if (!meshRef.current || !active) return
    
    const material = meshRef.current.material as THREE.MeshBasicMaterial
    material.opacity = Math.sin(state.clock.elapsedTime * 10) * 0.3 + 0.5
    
    meshRef.current.scale.setScalar(
      1 + Math.sin(state.clock.elapsedTime * 5) * 0.2
    )
  })
  
  if (!active) return null
  
  return (
    <mesh ref={meshRef} position={[0, 0, -50]}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// Efecto de túnel de luz durante el warp
function WarpTunnel({ active }: { active: boolean }) {
  const tubeRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!tubeRef.current || !active) return
    
    tubeRef.current.rotation.z = state.clock.elapsedTime * 2
    
    const material = tubeRef.current.material as THREE.MeshBasicMaterial
    material.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 8) * 0.1
  })
  
  if (!active) return null
  
  return (
    <mesh ref={tubeRef} position={[0, 0, -40]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[5, 30, 80, 32, 1, true]} />
      <meshBasicMaterial
        color="#4a90d9"
        transparent
        opacity={0.2}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// Escena 3D principal
function HyperdriveScene({
  speed,
  isWarping,
}: {
  speed: number
  isWarping: boolean
}) {
  return (
    <>
      {/* Fondo degradado */}
      <color attach="background" args={["#000000"]} />
      
      {/* Campo de estrellas */}
      <StarfieldTunnel speed={speed} isWarping={isWarping} />
      
      {/* Efectos de warp */}
      <WarpFlash active={isWarping} />
      <WarpTunnel active={isWarping} />
      
      {/* Luz ambiental */}
      <ambientLight intensity={0.1} />
    </>
  )
}

// Componente principal de la pantalla de carga
export function SplashTransition({
  onComplete,
  duration = TRANSITION_DURATION,
  skipOnClick = true,
  showProgress = true,
  brandText = "CHRONOS",
  tagline = "Sistema de Gestión Financiera",
}: SplashTransitionProps) {
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(INITIAL_SPEED)
  const [isWarping, setIsWarping] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [flashOpacity, setFlashOpacity] = useState(0)
  
  // Efecto de progreso y transición
  useEffect(() => {
    let animationFrame: number
    let startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min(elapsed / duration, 1)
      
      setProgress(newProgress)
      
      // Acelerar gradualmente
      setSpeed(INITIAL_SPEED + newProgress * 2)
      
      // Activar warp cuando llegue al 90%
      if (newProgress >= 0.9 && !isWarping) {
        setIsWarping(true)
        setSpeed(WARP_SPEED)
        
        // Flash blanco al final
        setTimeout(() => {
          setFlashOpacity(1)
          setTimeout(() => {
            setIsComplete(true)
            onComplete?.()
          }, 300)
        }, WARP_DURATION)
      }
      
      if (newProgress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    
    return () => cancelAnimationFrame(animationFrame)
  }, [duration, isWarping, onComplete])
  
  // Skip en click
  const handleSkip = useCallback(() => {
    if (skipOnClick && !isComplete) {
      setIsWarping(true)
      setSpeed(WARP_SPEED)
      setTimeout(() => {
        setFlashOpacity(1)
        setTimeout(() => {
          setIsComplete(true)
          onComplete?.()
        }, 300)
      }, 500)
    }
  }, [skipOnClick, isComplete, onComplete])
  
  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] overflow-hidden cursor-pointer"
          onClick={handleSkip}
        >
          {/* Canvas de Three.js */}
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [0, 0, 5], fov: 75 }}
            gl={{
              antialias: true,
              powerPreference: "high-performance",
            }}
          >
            <HyperdriveScene speed={speed} isWarping={isWarping} />
          </Canvas>
          
          {/* Overlay de contenido */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* Logo / Texto de marca */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: isWarping ? 0 : 1, 
                scale: isWarping ? 1.5 : 1,
                y: isWarping ? -50 : 0,
              }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <h1 className="text-6xl font-bold text-white tracking-[0.3em] mb-2">
                {brandText}
              </h1>
              <p className="text-white/60 text-lg tracking-widest">
                {tagline}
              </p>
            </motion.div>
            
            {/* Barra de progreso */}
            {showProgress && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: isWarping ? 0 : 1, 
                  y: isWarping ? 20 : 0 
                }}
                className="w-64"
              >
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-white/40">
                  <span>Cargando sistemas...</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
              </motion.div>
            )}
            
            {/* Texto de warp */}
            <AnimatePresence>
              {isWarping && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 2 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="text-4xl font-bold text-white tracking-[0.5em] animate-pulse">
                    INICIANDO
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Indicador de skip */}
            {skipOnClick && !isWarping && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1 }}
                className="absolute bottom-8 text-white/40 text-sm"
              >
                Click para saltar
              </motion.p>
            )}
          </div>
          
          {/* Flash blanco de transición */}
          <motion.div
            className="absolute inset-0 bg-white pointer-events-none"
            animate={{ opacity: flashOpacity }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Viñeta */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle, transparent 30%, rgba(0,0,0,0.8) 100%)",
            }}
          />
          
          {/* Efecto de líneas de velocidad en warp */}
          {isWarping && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0,
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    scaleX: 0,
                  }}
                  animate={{ 
                    opacity: [0, 0.8, 0],
                    scaleX: [0, 100, 200],
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.02,
                    ease: "easeIn",
                  }}
                  className="absolute w-1 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent"
                  style={{
                    transformOrigin: "center",
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook para usar el splash screen
export function useSplashScreen(duration = TRANSITION_DURATION) {
  const [isLoading, setIsLoading] = useState(true)
  
  const handleComplete = useCallback(() => {
    setIsLoading(false)
  }, [])
  
  return {
    isLoading,
    SplashScreen: isLoading ? (
      <SplashTransition duration={duration} onComplete={handleComplete} />
    ) : null,
  }
}

export default SplashTransition
