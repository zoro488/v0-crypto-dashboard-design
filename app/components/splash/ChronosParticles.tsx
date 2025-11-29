"use client"

/**
 * 🌟 CHRONOS PARTICLE SPLASH SCREEN
 * 
 * Animación de partículas GPU de alta calidad estilo Spline
 * Las partículas forman la palabra "CHRONOS" con efectos premium:
 * - Shaders GPU personalizados
 * - Bloom y glow effects
 * - Física de partículas suave
 * - Transiciones fluidas
 * - Interactividad con mouse
 */

import { useRef, useMemo, useEffect, useState, useCallback } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { 
  EffectComposer, 
  Bloom, 
  ChromaticAberration,
  Vignette 
} from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"
import * as THREE from "three"
import { motion, AnimatePresence } from "framer-motion"

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
  // Partículas
  particleCount: 25000,
  particleSize: 0.012,
  
  // Colores (gradiente cyan-gold premium estilo Chronos)
  colors: {
    primary: new THREE.Color("#00f5ff"),    // Cyan brillante
    secondary: new THREE.Color("#fbbf24"),   // Oro/Amber
    accent: new THREE.Color("#8b5cf6"),      // Violeta
    background: "#000000",
  },
  
  // Física
  morphSpeed: 0.8,
  noiseScale: 0.25,
  noiseSpeed: 0.4,
  
  // Texto
  text: "CHRONOS",
  fontSize: 1.4,
}

// ============================================
// SHADERS GPU - VERTEX SHADER
// ============================================

const vertexShader = `
  uniform float uTime;
  uniform float uMorphProgress;
  uniform float uNoiseScale;
  uniform float uNoiseSpeed;
  uniform vec2 uMouse;
  uniform float uMouseInfluence;
  
  attribute vec3 targetPosition;
  attribute float randomOffset;
  attribute vec3 initialPosition;
  
  varying vec3 vColor;
  varying float vAlpha;
  varying float vDistance;
  
  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  void main() {
    // Noise para movimiento orgánico
    float timeOffset = uTime * uNoiseSpeed + randomOffset * 10.0;
    vec3 noisePos = position * uNoiseScale + timeOffset;
    
    float noiseX = snoise(noisePos) * 0.1;
    float noiseY = snoise(noisePos + vec3(100.0)) * 0.1;
    float noiseZ = snoise(noisePos + vec3(200.0)) * 0.1;
    
    // Morphing entre posición inicial y texto
    vec3 morphedPosition = mix(initialPosition, targetPosition, uMorphProgress);
    
    // Agregar noise al movimiento
    morphedPosition += vec3(noiseX, noiseY, noiseZ) * (1.0 - uMorphProgress * 0.5);
    
    // Influencia del mouse
    vec3 mousePos3D = vec3(uMouse * 2.0, 0.0);
    float mouseDistance = length(morphedPosition.xy - mousePos3D.xy);
    float mouseEffect = smoothstep(1.5, 0.0, mouseDistance) * uMouseInfluence;
    
    vec3 mouseRepel = normalize(morphedPosition - mousePos3D) * mouseEffect * 0.3;
    morphedPosition += mouseRepel;
    
    // Rotación suave global
    float angle = uTime * 0.1;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    morphedPosition.xz = rot * morphedPosition.xz;
    
    // Calcular color basado en posición y tiempo
    float colorMix = sin(position.x * 2.0 + uTime) * 0.5 + 0.5;
    float colorMix2 = cos(position.y * 2.0 + uTime * 0.7) * 0.5 + 0.5;
    
    // Gradiente de colores - Cyan a Oro con toques violeta
    vec3 color1 = vec3(0.0, 0.96, 1.0);   // Cyan
    vec3 color2 = vec3(0.98, 0.75, 0.14); // Oro
    vec3 color3 = vec3(0.55, 0.36, 0.96); // Violeta
    
    vColor = mix(mix(color1, color2, colorMix), color3, colorMix2 * 0.2);
    
    // Alpha basado en distancia al centro y morph progress
    vDistance = length(morphedPosition);
    vAlpha = smoothstep(5.0, 0.0, vDistance) * (0.5 + uMorphProgress * 0.5);
    vAlpha *= 0.8 + sin(uTime * 2.0 + randomOffset * 6.28) * 0.2;
    
    // Posición final
    vec4 mvPosition = modelViewMatrix * vec4(morphedPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Tamaño de partícula con perspectiva
    float size = ${CONFIG.particleSize.toFixed(4)};
    size *= (1.0 + sin(uTime * 3.0 + randomOffset * 6.28) * 0.2);
    gl_PointSize = size * (300.0 / -mvPosition.z);
  }
`

// ============================================
// SHADERS GPU - FRAGMENT SHADER
// ============================================

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vDistance;
  
  void main() {
    // Crear forma circular suave con glow
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    // Múltiples capas de glow
    float core = smoothstep(0.5, 0.0, dist);
    float glow = smoothstep(0.5, 0.1, dist) * 0.5;
    float outerGlow = smoothstep(0.5, 0.3, dist) * 0.2;
    
    float alpha = (core + glow + outerGlow) * vAlpha;
    
    // Descartar píxeles muy transparentes
    if (alpha < 0.01) discard;
    
    // Color final con brillo
    vec3 finalColor = vColor * (1.0 + core * 0.5);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`

// ============================================
// GENERADOR DE POSICIONES DE TEXTO
// ============================================

function generateTextPositions(text: string, particleCount: number): Float32Array {
  const positions = new Float32Array(particleCount * 3)
  
  // Crear canvas para renderizar texto
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!
  
  canvas.width = 2048
  canvas.height = 512
  
  // Configurar texto
  ctx.fillStyle = "#000000"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Usar fuente más bold y grande para mejor definición
  ctx.font = "bold 320px 'Arial Black', Arial, sans-serif"
  ctx.fillStyle = "#ffffff"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.letterSpacing = "0.1em"
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  
  // Obtener datos de imagen
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data
  
  // Encontrar píxeles blancos (texto) con sampling más denso
  const textPixels: { x: number; y: number; brightness: number }[] = []
  
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const i = (y * canvas.width + x) * 4
      const brightness = pixels[i]
      if (brightness > 100) {
        textPixels.push({ x, y, brightness: brightness / 255 })
      }
    }
  }
  
  // Distribuir partículas en los píxeles del texto
  const scale = 5.0 / canvas.width
  const offsetX = -2.5
  const offsetY = 0.6
  
  for (let i = 0; i < particleCount; i++) {
    const idx = i * 3
    
    if (textPixels.length > 0) {
      // Seleccionar pixel con bias hacia áreas más brillantes
      const pixel = textPixels[Math.floor(Math.random() * textPixels.length)]
      
      // Posición base con variación mínima para texto nítido
      const variation = 0.008
      positions[idx] = (pixel.x * scale + offsetX) + (Math.random() - 0.5) * variation
      positions[idx + 1] = (-pixel.y * scale + offsetY) + (Math.random() - 0.5) * variation
      positions[idx + 2] = (Math.random() - 0.5) * 0.05 // Muy poco profundidad para texto plano
    } else {
      // Fallback: posición aleatoria
      positions[idx] = (Math.random() - 0.5) * 4
      positions[idx + 1] = (Math.random() - 0.5) * 2
      positions[idx + 2] = (Math.random() - 0.5) * 0.5
    }
  }
  
  return positions
}

// ============================================
// COMPONENTE DE PARTÍCULAS
// ============================================

function ParticleSystem({ onComplete }: { onComplete: () => void }) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { viewport, mouse } = useThree()
  
  const [morphProgress, setMorphProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)
  
  // Generar geometría y atributos
  const { geometry, uniforms } = useMemo(() => {
    const count = CONFIG.particleCount
    
    // Posiciones iniciales (esfera dispersa)
    const initialPositions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 2 + Math.random() * 3
      
      initialPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      initialPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      initialPositions[i * 3 + 2] = r * Math.cos(phi)
    }
    
    // Posiciones target (texto CHRONOS) - se generará en useEffect
    const targetPositions = new Float32Array(count * 3)
    
    // Random offsets para variación
    const randomOffsets = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      randomOffsets[i] = Math.random()
    }
    
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(initialPositions, 3))
    geo.setAttribute("initialPosition", new THREE.BufferAttribute(initialPositions.slice(), 3))
    geo.setAttribute("targetPosition", new THREE.BufferAttribute(targetPositions, 3))
    geo.setAttribute("randomOffset", new THREE.BufferAttribute(randomOffsets, 1))
    
    const unis = {
      uTime: { value: 0 },
      uMorphProgress: { value: 0 },
      uNoiseScale: { value: CONFIG.noiseScale },
      uNoiseSpeed: { value: CONFIG.noiseSpeed },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseInfluence: { value: 0.5 },
    }
    
    return { geometry: geo, uniforms: unis }
  }, [])
  
  // Generar posiciones de texto después del mount (requiere canvas)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const textPositions = generateTextPositions(CONFIG.text, CONFIG.particleCount)
      geometry.setAttribute("targetPosition", new THREE.BufferAttribute(textPositions, 3))
    }
  }, [geometry])
  
  // Animación de entrada
  useEffect(() => {
    let startTime = Date.now()
    const duration = 3000 // 3 segundos para morphing
    const holdTime = 2000 // 2 segundos mostrando texto
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      
      if (elapsed < duration) {
        // Fase de morphing
        const progress = elapsed / duration
        // Easing cubic out
        const eased = 1 - Math.pow(1 - progress, 3)
        setMorphProgress(eased)
        requestAnimationFrame(animate)
      } else if (elapsed < duration + holdTime) {
        // Fase de hold
        setMorphProgress(1)
        requestAnimationFrame(animate)
      } else {
        // Completado
        setIsAnimating(false)
        setTimeout(onComplete, 500)
      }
    }
    
    // Delay inicial
    setTimeout(animate, 500)
  }, [onComplete])
  
  // Update loop
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uMorphProgress.value = morphProgress
      materialRef.current.uniforms.uMouse.value.set(
        (mouse.x * viewport.width) / 2,
        (mouse.y * viewport.height) / 2
      )
    }
  })
  
  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

interface ChronosParticlesProps {
  onComplete?: () => void
  duration?: number
}

export default function ChronosParticles({ 
  onComplete = () => {}, 
  duration = 5500 
}: ChronosParticlesProps) {
  const [isVisible, setIsVisible] = useState(true)
  
  const handleComplete = useCallback(() => {
    setIsVisible(false)
    setTimeout(onComplete, 500)
  }, [onComplete])
  
  // Auto-complete después de duration
  useEffect(() => {
    const timer = setTimeout(handleComplete, duration)
    return () => clearTimeout(timer)
  }, [duration, handleComplete])
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] bg-black"
          style={{ touchAction: "none" }}
        >
          <Canvas
            camera={{ position: [0, 0, 4], fov: 60 }}
            dpr={[1, 2]}
            gl={{ 
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
              failIfMajorPerformanceCaveat: false
            }}
            onCreated={({ gl }) => {
              // Manejar pérdida de contexto WebGL
              const canvas = gl.domElement
              canvas.addEventListener('webglcontextlost', (e) => {
                e.preventDefault()
                console.warn('WebGL context lost - triggering completion')
                handleComplete()
              }, false)
            }}
          >
            <color attach="background" args={["#000000"]} />
            
            <ParticleSystem onComplete={handleComplete} />
            
            {/* Post-processing effects */}
            <EffectComposer>
              <Bloom
                intensity={2.0}
                luminanceThreshold={0.05}
                luminanceSmoothing={0.95}
                mipmapBlur
              />
              <ChromaticAberration
                blendFunction={BlendFunction.NORMAL}
                offset={new THREE.Vector2(0.001, 0.001)}
              />
              <Vignette
                darkness={0.6}
                offset={0.2}
              />
            </EffectComposer>
          </Canvas>
          
          {/* Subtítulo elegante */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.8 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center"
          >
            <p className="text-white/30 text-xs tracking-[0.4em] uppercase font-light">
              Enterprise Capital Flow System
            </p>
          </motion.div>
          
          {/* Loading indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <div className="flex items-center gap-3 text-white/30 text-xs">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-pulse" style={{ animationDelay: "0.15s" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400/80 animate-pulse" style={{ animationDelay: "0.3s" }} />
              </div>
              <span className="tracking-[0.3em] uppercase">Loading</span>
            </div>
          </motion.div>
          
          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            onClick={handleComplete}
            className="absolute bottom-8 right-8 text-white/30 hover:text-white/60 text-xs tracking-widest transition-colors"
          >
            SKIP →
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
