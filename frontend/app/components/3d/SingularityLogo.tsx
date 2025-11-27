"use client"

import { useRef, useMemo, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import * as THREE from "three"
import { motion } from "framer-motion"

// Constantes del sistema de partículas
const PARTICLE_COUNT = 15000
const PARTICLE_SIZE = 3.5
const DISPERSION_RADIUS = 2.5
const ELASTICITY = 0.08
const MOUSE_INFLUENCE = 0.4

// Interface para las props del componente
interface SingularityLogoProps {
  className?: string
  imageSrc?: string
  particleCount?: number
  interactive?: boolean
}

// Componente interno de partículas
function ParticleSystem({ imageSrc }: { imageSrc: string }) {
  const meshRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const { viewport, pointer } = useThree()
  
  // Cargar la textura de la imagen
  const texture = useTexture(imageSrc)
  
  // Generar geometría de partículas basada en la imagen
  const { positions, targetPositions, colors, brightness, randoms } = useMemo(() => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    
    if (!ctx || !texture.image) {
      // Fallback: generar partículas aleatorias si la imagen no carga
      const positions = new Float32Array(PARTICLE_COUNT * 3)
      const targetPositions = new Float32Array(PARTICLE_COUNT * 3)
      const colors = new Float32Array(PARTICLE_COUNT * 3)
      const brightness = new Float32Array(PARTICLE_COUNT)
      const randoms = new Float32Array(PARTICLE_COUNT)
      
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3
        const x = (Math.random() - 0.5) * 8
        const y = (Math.random() - 0.5) * 8
        const z = (Math.random() - 0.5) * 2
        
        positions[i3] = x
        positions[i3 + 1] = y
        positions[i3 + 2] = z
        
        targetPositions[i3] = x
        targetPositions[i3 + 1] = y
        targetPositions[i3 + 2] = 0
        
        colors[i3] = Math.random() * 0.5 + 0.5
        colors[i3 + 1] = Math.random() * 0.3 + 0.2
        colors[i3 + 2] = Math.random() * 0.8 + 0.2
        
        brightness[i] = Math.random()
        randoms[i] = Math.random()
      }
      
      return { positions, targetPositions, colors, brightness, randoms }
    }
    
    // Configurar canvas para leer píxeles de la imagen
    const img = texture.image as HTMLImageElement
    const width = 200
    const height = 200
    canvas.width = width
    canvas.height = height
    
    ctx.drawImage(img, 0, 0, width, height)
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    
    // Recopilar píxeles brillantes de la imagen
    interface PixelData {
      x: number
      y: number
      r: number
      g: number
      b: number
      brightness: number
    }
    const brightPixels: PixelData[] = []
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const r = data[i] / 255
        const g = data[i + 1] / 255
        const b = data[i + 2] / 255
        const a = data[i + 3] / 255
        
        // Calcular brillo del píxel
        const pixelBrightness = (r + g + b) / 3 * a
        
        // Solo incluir píxeles con cierto brillo
        if (pixelBrightness > 0.1) {
          brightPixels.push({
            x: (x / width - 0.5) * 8,
            y: -(y / height - 0.5) * 8,
            r,
            g,
            b,
            brightness: pixelBrightness,
          })
        }
      }
    }
    
    // Crear arrays para las partículas
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const targetPositions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const brightness = new Float32Array(PARTICLE_COUNT)
    const randoms = new Float32Array(PARTICLE_COUNT)
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      
      // Seleccionar un píxel aleatorio de los brillantes
      const pixel = brightPixels[Math.floor(Math.random() * brightPixels.length)]
      
      if (pixel) {
        // Posición inicial dispersa
        positions[i3] = pixel.x + (Math.random() - 0.5) * 0.15
        positions[i3 + 1] = pixel.y + (Math.random() - 0.5) * 0.15
        positions[i3 + 2] = (Math.random() - 0.5) * 2
        
        // Posición objetivo (forma de la imagen)
        targetPositions[i3] = pixel.x
        targetPositions[i3 + 1] = pixel.y
        targetPositions[i3 + 2] = 0
        
        // Colores de la imagen con saturación mejorada
        colors[i3] = Math.min(pixel.r * 1.3, 1.0)
        colors[i3 + 1] = Math.min(pixel.g * 1.3, 1.0)
        colors[i3 + 2] = Math.min(pixel.b * 1.5, 1.0) // Azules más intensos
        
        brightness[i] = pixel.brightness
      } else {
        // Fallback para partículas extra
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * 4
        positions[i3] = Math.cos(angle) * radius
        positions[i3 + 1] = Math.sin(angle) * radius
        positions[i3 + 2] = (Math.random() - 0.5) * 2
        
        targetPositions[i3] = 0
        targetPositions[i3 + 1] = 0
        targetPositions[i3 + 2] = 0
        
        colors[i3] = 0.2
        colors[i3 + 1] = 0.5
        colors[i3 + 2] = 1.0
        
        brightness[i] = 0.3
      }
      
      randoms[i] = Math.random()
    }
    
    return { positions, targetPositions, colors, brightness, randoms }
  }, [texture])
  
  // Animación con useFrame
  useFrame((state) => {
    if (material && material.uniforms) {
      material.uniforms.uTime.value = state.clock.elapsedTime
      material.uniforms.uMouse.value.set(pointer.x, pointer.y)
      material.uniforms.uResolution.value.set(viewport.width, viewport.height)
    }
    
    // Rotación sutil del sistema completo
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.02
    }
  })
  
  // Crear geometría con atributos personalizados
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aTargetPosition', new THREE.BufferAttribute(targetPositions, 3))
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1))
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))
    return geo
  }, [positions, targetPositions, colors, brightness, randoms])
  
  // Crear material con shaders
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uMouseInfluence: { value: MOUSE_INFLUENCE },
        uDispersionRadius: { value: DISPERSION_RADIUS },
        uElasticity: { value: ELASTICITY },
        uPointSize: { value: PARTICLE_SIZE },
        uResolution: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uMouseInfluence;
        uniform float uDispersionRadius;
        uniform float uElasticity;
        uniform float uPointSize;
        uniform vec2 uResolution;
        
        attribute vec3 aTargetPosition;
        attribute vec3 aColor;
        attribute float aBrightness;
        attribute float aRandom;
        
        varying vec3 vColor;
        varying float vAlpha;
        varying float vBrightness;
        
        void main() {
          vec3 pos = position;
          float waveOffset = aBrightness * 2.0;
          float wave = sin(uTime * 1.5 + pos.x * 3.0 + pos.y * 2.0 + waveOffset) * 0.3;
          float breathe = sin(uTime * 0.5 + aRandom * 6.28) * 0.15;
          pos.z += wave * aBrightness + breathe;
          
          float angle = uTime * 0.1 + aRandom * 6.28;
          float rotateRadius = 0.05 * aBrightness;
          pos.x += cos(angle) * rotateRadius;
          pos.y += sin(angle) * rotateRadius;
          
          vec2 mousePos = uMouse * vec2(5.0, 5.0);
          vec2 toMouse = mousePos - pos.xy;
          float distToMouse = length(toMouse);
          
          if (distToMouse < uDispersionRadius) {
            float force = (1.0 - distToMouse / uDispersionRadius) * uMouseInfluence;
            vec2 repulsion = normalize(toMouse) * force * -2.0;
            pos.xy += repulsion;
            pos.z += force * 0.8;
          }
          
          pos.xy = mix(pos.xy, aTargetPosition.xy, uElasticity);
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          float sizeMultiplier = 1.0 + aBrightness * 0.5;
          gl_PointSize = uPointSize * sizeMultiplier * (300.0 / -mvPosition.z);
          
          vColor = aColor;
          vAlpha = 0.7 + aBrightness * 0.3;
          vBrightness = aBrightness;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        
        varying vec3 vColor;
        varying float vAlpha;
        varying float vBrightness;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          if (dist > 0.5) discard;
          
          float alpha = smoothstep(0.5, 0.1, dist);
          float pulse = sin(uTime * 2.0 + vBrightness * 10.0) * 0.1 + 0.9;
          vec3 glow = vColor * (1.0 + vBrightness * 0.5) * pulse;
          float halo = smoothstep(0.5, 0.3, dist) - smoothstep(0.3, 0.0, dist);
          glow += vColor * halo * 0.3;
          
          gl_FragColor = vec4(glow, alpha * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])
  
  return (
    <points ref={meshRef} geometry={geometry} material={material} />
  )
}

// Componente de fallback durante la carga
function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#4a90d9" wireframe transparent opacity={0.3} />
    </mesh>
  )
}

// Componente principal exportado
export function SingularityLogo({
  className = "",
  imageSrc = "/images/Космос.jpeg",
  interactive = true,
}: SingularityLogoProps) {
  return (
    <motion.div
      className={`relative w-full h-full ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
    >
      {/* Canvas de Three.js */}
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <ParticleSystem imageSrc={imageSrc} />
        </Suspense>
        
        {/* Luces ambientales sutiles */}
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#4a90d9" />
        <pointLight position={[-5, -5, -5]} intensity={0.3} color="#9333ea" />
      </Canvas>
      
      {/* Overlay de glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/10 via-transparent to-transparent" />
      </div>
    </motion.div>
  )
}

// Versión simplificada sin Canvas (para usar dentro de otro Canvas)
export function SingularityLogoScene({
  imageSrc = "/images/Космос.jpeg",
}: Pick<SingularityLogoProps, "imageSrc">) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ParticleSystem imageSrc={imageSrc} />
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#4a90d9" />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#9333ea" />
    </Suspense>
  )
}

export default SingularityLogo
