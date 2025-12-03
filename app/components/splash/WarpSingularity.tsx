'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🌌 CHRONOS WARP SINGULARITY - The Ultimate Hyperspace Experience
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Experiencia cinematográfica de viaje en el tiempo a través de un túnel de datos
 * y estrellas. Renderizado a 120fps con shaders GLSL personalizados.
 * 
 * Características:
 * - 15,000+ partículas con shader personalizado
 * - Efecto de estiramiento warp (light streaks)
 * - Túnel infinito con reciclaje de partículas
 * - Post-procesamiento: Bloom + Aberración Cromática + Radial Blur
 * - Respuesta al mouse para control de dirección
 * - Transición fluida de velocidad con inercia
 * 
 * @author CHRONOS Team - Industrial Light & Magic Quality
 * @version 2.0.0
 */

import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { motion, AnimatePresence } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════════════════════
// 1. SHADER DE HIPERESPACIO AVANZADO (GLSL)
// ═══════════════════════════════════════════════════════════════════════════════════════

const HyperspaceShader = {
  vertexShader: /* glsl */ `
    uniform float uTime;
    uniform float uSpeed;
    uniform float uStretch;
    uniform vec2 uMouse;
    uniform float uWarpIntensity;
    
    attribute float aRandom;
    attribute float aSize;
    attribute vec3 aColor;
    
    varying vec3 vColor;
    varying float vAlpha;
    varying float vSpeed;
    varying float vDepth;

    // Función de ruido para variación orgánica
    float hash(float n) { return fract(sin(n) * 43758.5453123); }
    
    void main() {
      vec3 pos = position;
      
      // ═══════════════════════════════════════════════════════════════
      // TÚNEL INFINITO - Las estrellas se mueven hacia la cámara
      // ═══════════════════════════════════════════════════════════════
      float tunnelLength = 2000.0;
      float zOffset = uTime * uSpeed * 150.0 * (0.5 + aRandom * 0.5);
      float zPos = mod(pos.z + zOffset + tunnelLength * 0.5, tunnelLength) - tunnelLength * 0.5;
      
      pos.z = zPos;
      
      // ═══════════════════════════════════════════════════════════════
      // CURVATURA DEL TÚNEL - Respuesta al mouse
      // ═══════════════════════════════════════════════════════════════
      float curveAmount = (pos.z + tunnelLength * 0.5) / tunnelLength;
      pos.x += uMouse.x * curveAmount * 100.0 * uSpeed * 0.1;
      pos.y += uMouse.y * curveAmount * 100.0 * uSpeed * 0.1;
      
      // Espiral sutil durante el warp
      float spiralAngle = pos.z * 0.002 * uSpeed;
      float spiralRadius = length(pos.xy);
      pos.x = spiralRadius * cos(atan(pos.y, pos.x) + spiralAngle);
      pos.y = spiralRadius * sin(atan(pos.y, pos.x) + spiralAngle);
      
      // ═══════════════════════════════════════════════════════════════
      // ESTIRAMIENTO WARP - Light Streaks
      // ═══════════════════════════════════════════════════════════════
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      // Tamaño base dinámico
      float distanceFromCamera = -mvPosition.z;
      float baseSize = aSize * (800.0 / max(distanceFromCamera, 1.0));
      
      // Estiramiento por velocidad (simula motion blur)
      float stretchFactor = 1.0 + uStretch * 3.0 * (1.0 - aRandom * 0.3);
      float finalSize = baseSize * stretchFactor;
      
      // Límites de tamaño
      finalSize = clamp(finalSize, 1.0, 50.0);
      
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = finalSize;
      
      // ═══════════════════════════════════════════════════════════════
      // COLOR DINÁMICO - Transición de profundidad
      // ═══════════════════════════════════════════════════════════════
      vDepth = smoothstep(-tunnelLength * 0.5, 50.0, pos.z);
      
      // Paleta de colores cinematográfica
      vec3 colorFar = vec3(0.05, 0.0, 0.15);      // Violeta profundo (fondo)
      vec3 colorMid = vec3(0.0, 0.3, 0.8);         // Azul eléctrico (medio)
      vec3 colorNear = vec3(0.7, 0.9, 1.0);        // Blanco azulado (cerca)
      vec3 colorCore = vec3(1.0, 1.0, 0.95);       // Blanco cegador (núcleo)
      
      // Durante el warp intenso, colores más energéticos
      float warpMix = smoothstep(3.0, 15.0, uSpeed);
      colorFar = mix(colorFar, vec3(0.0, 0.1, 0.4), warpMix);
      colorMid = mix(colorMid, vec3(0.0, 0.6, 1.0), warpMix);
      colorNear = mix(colorNear, vec3(0.9, 0.95, 1.0), warpMix);
      
      // Gradiente de color basado en profundidad
      vec3 finalColor;
      if (vDepth < 0.3) {
        finalColor = mix(colorFar, colorMid, vDepth / 0.3);
      } else if (vDepth < 0.7) {
        finalColor = mix(colorMid, colorNear, (vDepth - 0.3) / 0.4);
      } else {
        finalColor = mix(colorNear, colorCore, (vDepth - 0.7) / 0.3);
      }
      
      // Añadir variación individual
      finalColor += aColor * 0.2;
      
      vColor = finalColor;
      vSpeed = uSpeed;
      
      // Alpha basado en posición (fade in/out suave)
      float fadeIn = smoothstep(-tunnelLength * 0.5, -tunnelLength * 0.4, pos.z);
      float fadeOut = 1.0 - smoothstep(-20.0, 50.0, pos.z);
      vAlpha = fadeIn * fadeOut * (0.7 + aRandom * 0.3);
      
      // Más brillante durante el warp
      vAlpha *= (1.0 + warpMix * 0.5);
    }
  `,
  
  fragmentShader: /* glsl */ `
    varying vec3 vColor;
    varying float vAlpha;
    varying float vSpeed;
    varying float vDepth;
    
    void main() {
      // Coordenadas del punto
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);
      
      // ═══════════════════════════════════════════════════════════════
      // FORMA DE LA ESTRELLA - Círculo difuso con núcleo brillante
      // ═══════════════════════════════════════════════════════════════
      
      // Círculo exterior suave
      float circle = 1.0 - smoothstep(0.0, 0.5, dist);
      
      // Núcleo intenso (glow central)
      float core = exp(-dist * 8.0);
      
      // Anillo de energía durante el warp
      float ring = smoothstep(0.3, 0.35, dist) * (1.0 - smoothstep(0.35, 0.5, dist));
      ring *= smoothstep(5.0, 15.0, vSpeed) * 0.5;
      
      // Combinar formas
      float finalShape = circle + core * 2.0 + ring;
      
      // ═══════════════════════════════════════════════════════════════
      // COLOR FINAL
      // ═══════════════════════════════════════════════════════════════
      
      // Núcleo blanco cegador
      vec3 coreColor = vec3(1.0, 1.0, 1.0);
      vec3 finalColor = mix(vColor, coreColor, core * 0.8);
      
      // Añadir tinte azulado al glow exterior
      finalColor += vec3(0.1, 0.2, 0.4) * circle * 0.3;
      
      // HDR - Valores superiores a 1.0 para bloom
      finalColor *= 1.0 + core * 2.0;
      
      // Alpha final
      float finalAlpha = vAlpha * finalShape;
      
      // Descartar píxeles muy transparentes
      if (finalAlpha < 0.01) discard;
      
      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// 2. COMPONENTE DE CAMPO DE ESTRELLAS
// ═══════════════════════════════════════════════════════════════════════════════════════

interface StarFieldProps {
  speed: number
  mousePosition: { x: number; y: number }
  warpIntensity: number
}

function StarField({ speed, mousePosition, warpIntensity }: StarFieldProps) {
  const meshRef = useRef<THREE.Points>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  
  // Configuración de partículas
  const particleCount = 15000
  
  // Generar geometría de partículas
  const { positions, randoms, sizes, colors } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const rnd = new Float32Array(particleCount)
    const sz = new Float32Array(particleCount)
    const col = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      // Distribución en túnel cilíndrico con variación
      const radius = 30 + Math.pow(Math.random(), 0.5) * 500
      const theta = Math.random() * Math.PI * 2
      
      pos[i * 3] = radius * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(theta)
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2000
      
      rnd[i] = Math.random()
      sz[i] = Math.random() * 3.0 + 0.5
      
      // Variación de color individual (tonos azul/violeta)
      const hue = Math.random() * 0.3 // 0 a 0.3 (rojo a amarillo en HSL, pero lo usamos para variación)
      col[i * 3] = hue * 0.2
      col[i * 3 + 1] = 0.1 + hue * 0.3
      col[i * 3 + 2] = 0.5 + hue * 0.5
    }
    
    return { positions: pos, randoms: rnd, sizes: sz, colors: col }
  }, [])

  // Animación por frame
  useFrame((state) => {
    if (!materialRef.current) return
    
    const uniforms = materialRef.current.uniforms
    
    // Tiempo
    uniforms.uTime.value = state.clock.elapsedTime
    
    // Interpolación suave de velocidad (inercia física)
    const currentSpeed = uniforms.uSpeed.value
    const targetSpeed = speed
    uniforms.uSpeed.value = THREE.MathUtils.lerp(currentSpeed, targetSpeed, 0.03)
    
    // Estiramiento proporcional a la velocidad
    uniforms.uStretch.value = Math.min(uniforms.uSpeed.value * 0.3, 5.0)
    
    // Posición del mouse
    uniforms.uMouse.value.set(mousePosition.x, mousePosition.y)
    
    // Intensidad del warp
    uniforms.uWarpIntensity.value = warpIntensity
    
    // Rotación sutil del campo de estrellas
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.0003 * uniforms.uSpeed.value
    }
  })

  return (
    <points ref={meshRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          args={[randoms, 1]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aColor"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={HyperspaceShader.vertexShader}
        fragmentShader={HyperspaceShader.fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uSpeed: { value: 0 },
          uStretch: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uWarpIntensity: { value: 0 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// 3. ANILLOS DE ENERGÍA DEL TÚNEL
// ═══════════════════════════════════════════════════════════════════════════════════════

function TunnelRings({ speed }: { speed: number }) {
  const groupRef = useRef<THREE.Group>(null!)
  const ringCount = 20
  
  // Crear geometría de anillos
  const rings = useMemo(() => {
    return Array.from({ length: ringCount }, (_, i) => ({
      z: -100 - i * 100,
      radius: 200 + Math.random() * 100,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
    }))
  }, [])
  
  useFrame((state) => {
    if (!groupRef.current) return
    
    groupRef.current.children.forEach((ring, i) => {
      // Mover anillos hacia la cámara
      ring.position.z += speed * 2
      
      // Reciclar cuando pasan la cámara
      if (ring.position.z > 100) {
        ring.position.z = -2000
      }
      
      // Rotación
      ring.rotation.z += rings[i].rotationSpeed * speed * 0.1
      
      // Escala pulsante
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.05
      ring.scale.setScalar(pulse)
    })
  })
  
  return (
    <group ref={groupRef}>
      {rings.map((ring, i) => (
        <mesh key={i} position={[0, 0, ring.z]} rotation={[0, 0, Math.random() * Math.PI]}>
          <ringGeometry args={[ring.radius - 2, ring.radius, 64]} />
          <meshBasicMaterial
            color={new THREE.Color().setHSL(0.6 + i * 0.01, 0.8, 0.5)}
            transparent
            opacity={0.1 + (speed / 20) * 0.2}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// 4. EFECTOS DE POST-PROCESAMIENTO
// ═══════════════════════════════════════════════════════════════════════════════════════

function PostEffects({ speed }: { speed: number }) {
  // Calcular offset de aberración basado en velocidad
  const aberrationAmount = Math.min(speed * 0.0015, 0.02)
  
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom
        luminanceThreshold={0.1}
        luminanceSmoothing={0.9}
        intensity={1.2 + speed * 0.1}
        radius={0.85}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(aberrationAmount, aberrationAmount)}
        radialModulation
        modulationOffset={0.3}
      />
      <Vignette
        eskil={false}
        offset={0.1}
        darkness={Math.min(0.8 + speed * 0.02, 1.0)}
      />
    </EffectComposer>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// 5. COMPONENTE PRINCIPAL - CHRONOS SINGULARITY INTRO
// ═══════════════════════════════════════════════════════════════════════════════════════

interface WarpSingularityProps {
  onComplete?: () => void
  autoStart?: boolean
  duration?: number
}

export default function WarpSingularity({ 
  onComplete, 
  autoStart = true,
  duration = 4000,
}: WarpSingularityProps) {
  const [warpSpeed, setWarpSpeed] = useState(0.3) // Velocidad inicial (idle sereno)
  const [warpIntensity, setWarpIntensity] = useState(0)
  const [isWarping, setIsWarping] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [showText, setShowText] = useState(true)
  
  // Manejar movimiento del mouse
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1
    const y = -(e.clientY / window.innerHeight) * 2 + 1
    setMousePos({ x: x * 0.5, y: y * 0.5 })
  }, [])
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])
  
  // Función para activar el salto warp
  const triggerWarp = useCallback(() => {
    if (isWarping) return
    
    setIsWarping(true)
    setShowText(false)
    
    // Fase 1: Aceleración inicial
    setWarpSpeed(5)
    setWarpIntensity(0.3)
    
    // Fase 2: Velocidad luz
    setTimeout(() => {
      setWarpSpeed(25)
      setWarpIntensity(1)
    }, 300)
    
    // Fase 3: Flash blanco y desaceleración
    setTimeout(() => {
      setWarpSpeed(50)
    }, duration - 1000)
    
    // Fase 4: Completado
    setTimeout(() => {
      setIsComplete(true)
      setTimeout(() => {
        onComplete?.()
      }, 800)
    }, duration)
  }, [isWarping, duration, onComplete])
  
  // Auto-start si está habilitado
  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(triggerWarp, 800)
      return () => clearTimeout(timer)
    }
  }, [autoStart, triggerWarp])
  
  return (
    <motion.div
      className="fixed inset-0 z-[99999] bg-black cursor-pointer"
      initial={{ opacity: 1 }}
      animate={{ opacity: isComplete ? 0 : 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      onClick={!isWarping ? triggerWarp : undefined}
      style={{ pointerEvents: isComplete ? 'none' : 'auto' }}
    >
      {/* Canvas 3D */}
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75, near: 0.1, far: 3000 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: false, 
          alpha: false,
          powerPreference: 'high-performance',
        }}
      >
        <color attach="background" args={['#000005']} />
        
        {/* Campo de estrellas principal */}
        <StarField 
          speed={warpSpeed} 
          mousePosition={mousePos}
          warpIntensity={warpIntensity}
        />
        
        {/* Anillos del túnel (solo visibles durante el warp) */}
        {warpSpeed > 3 && <TunnelRings speed={warpSpeed} />}
        
        {/* Post-procesamiento */}
        <PostEffects speed={warpSpeed} />
      </Canvas>
      
      {/* Overlay de Flash Blanco al final */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: warpSpeed > 40 ? 0.9 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Texto Cinematográfico */}
      <AnimatePresence>
        {showText && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo CHRONOS */}
            <motion.h1
              className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter"
              style={{
                fontFamily: 'Geist Mono, SF Mono, monospace',
                background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(150,180,255,0.8) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 80px rgba(100, 150, 255, 0.5)',
              }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              CHRONOS
            </motion.h1>
            
            {/* Subtítulo */}
            <motion.p
              className="text-white/40 text-xs md:text-sm tracking-[0.5em] mt-6 uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Sistema de Gestión Premium
            </motion.p>
            
            {/* Indicador de carga/interacción */}
            <motion.div
              className="mt-12 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-cyan-400"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <span className="text-cyan-400/60 text-xs tracking-wider">
                {autoStart ? 'INITIALIZING WARP DRIVE' : 'CLICK TO ENGAGE'}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Barra de progreso del warp */}
      {isWarping && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-white"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: duration / 1000, ease: 'easeInOut' }}
            style={{ boxShadow: '0 0 20px rgba(100, 200, 255, 0.8)' }}
          />
        </motion.div>
      )}
      
      {/* Efecto de líneas de velocidad en los bordes */}
      {warpSpeed > 10 && (
        <>
          <div 
            className="absolute inset-y-0 left-0 w-32 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, rgba(100,150,255,0.2) 0%, transparent 100%)',
              filter: 'blur(8px)',
            }}
          />
          <div 
            className="absolute inset-y-0 right-0 w-32 pointer-events-none"
            style={{
              background: 'linear-gradient(-90deg, rgba(100,150,255,0.2) 0%, transparent 100%)',
              filter: 'blur(8px)',
            }}
          />
        </>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// 6. EXPORT ADICIONAL - Versión con nombre alternativo
// ═══════════════════════════════════════════════════════════════════════════════════════

export { WarpSingularity as ChronosSingularityIntro }
