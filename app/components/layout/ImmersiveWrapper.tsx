'use client'
/**
 * 🌌 IMMERSIVE WRAPPER - Entorno 3D Global con Post-Processing de Cine
 * 
 * Este componente envuelve toda la aplicación proporcionando:
 * - Fondo de estrellas procedural infinito
 * - Integración con escena Spline
 * - Efectos de post-procesamiento (Bloom, Noise, Vignette)
 * - Iluminación dramática cinematográfica
 * - Optimización automática según dispositivo
 */

import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState, useMemo, useRef } from 'react'
import { 
  Float, 
  Stars, 
  PerspectiveCamera,
  Preload,
  AdaptiveDpr,
  AdaptiveEvents,
} from '@react-three/drei'
import { 
  EffectComposer, 
  Bloom, 
  Noise, 
  Vignette,
  ChromaticAberration,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// ============================================================================
// NEBULOSA PROCEDURAL - Nubes volumétricas de color
// ============================================================================
function ProceduralNebula() {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  const nebulaShader = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color('#1a0a2e') },
      uColor2: { value: new THREE.Color('#16213e') },
      uColor3: { value: new THREE.Color('#0f3460') },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      varying vec2 vUv;
      
      // Simplex noise functions
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
      
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
          + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ; m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      
      void main() {
        vec2 uv = vUv;
        float time = uTime * 0.05;
        
        // Múltiples capas de ruido para profundidad
        float n1 = snoise(uv * 3.0 + time) * 0.5 + 0.5;
        float n2 = snoise(uv * 5.0 - time * 0.5) * 0.5 + 0.5;
        float n3 = snoise(uv * 8.0 + time * 0.3) * 0.5 + 0.5;
        
        float noise = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2);
        
        // Mezclar colores
        vec3 color = mix(uColor1, uColor2, noise);
        color = mix(color, uColor3, n2 * 0.5);
        
        // Fade hacia los bordes
        float vignette = smoothstep(0.0, 0.7, 1.0 - length(uv - 0.5) * 1.5);
        
        gl_FragColor = vec4(color, noise * 0.15 * vignette);
      }
    `,
  }), [])

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial
      material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -30]} scale={80}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        {...nebulaShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ============================================================================
// CAMPO DE ESTRELLAS DINÁMICO
// ============================================================================
function DynamicStarField() {
  const starsRef = useRef<THREE.Points>(null!)
  
  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.01
      starsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.005) * 0.05
    }
  })
  
  return (
    <group ref={starsRef}>
      <Stars 
        radius={120} 
        depth={60} 
        count={4000} 
        factor={5} 
        saturation={0.3} 
        fade 
        speed={0.3} 
      />
    </group>
  )
}

// ============================================================================
// LUCES VOLUMÉTRICAS (God Rays simulados)
// ============================================================================
function VolumetricLights() {
  const light1Ref = useRef<THREE.PointLight>(null!)
  const light2Ref = useRef<THREE.PointLight>(null!)
  
  useFrame((state) => {
    const t = state.clock.elapsedTime
    
    if (light1Ref.current) {
      light1Ref.current.intensity = 2 + Math.sin(t * 0.5) * 0.5
      light1Ref.current.position.x = Math.sin(t * 0.2) * 10
    }
    
    if (light2Ref.current) {
      light2Ref.current.intensity = 2 + Math.cos(t * 0.3) * 0.5
      light2Ref.current.position.y = Math.cos(t * 0.15) * 8
    }
  })
  
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight 
        ref={light1Ref}
        position={[10, 10, 10]} 
        intensity={2} 
        color="#a855f7" 
        distance={50}
      />
      <pointLight 
        ref={light2Ref}
        position={[-10, -5, -5]} 
        intensity={2} 
        color="#3b82f6" 
        distance={50}
      />
      <pointLight 
        position={[0, -10, 5]} 
        intensity={1} 
        color="#ec4899" 
        distance={30}
      />
    </>
  )
}

// ============================================================================
// ESCENA PRINCIPAL 3D
// ============================================================================
function Scene3D() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={35} />
      <color attach="background" args={['#030014']} />
      
      {/* Nebulosa de fondo */}
      <ProceduralNebula />
      
      {/* Estrellas */}
      <DynamicStarField />
      
      {/* Iluminación */}
      <VolumetricLights />
      
      {/* Post-procesamiento */}
      <EffectComposer multisampling={0}>
        <Bloom 
          luminanceThreshold={0.3} 
          mipmapBlur 
          intensity={1.8} 
          radius={0.7}
          levels={6}
        />
        <Noise 
          opacity={0.025} 
          blendFunction={BlendFunction.OVERLAY}
        />
        <ChromaticAberration
          offset={new THREE.Vector2(0.0008, 0.0008)}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0.5}
        />
        <Vignette 
          eskil={false} 
          offset={0.15} 
          darkness={0.6} 
        />
      </EffectComposer>
    </>
  )
}

// ============================================================================
// LOADER ANIMADO
// ============================================================================
function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500/20 border-b-blue-500 rounded-full animate-spin" 
             style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL EXPORTADO
// ============================================================================
export default function ImmersiveWrapper() {
  const [isClient, setIsClient] = useState(false)
  const [performanceMode, setPerformanceMode] = useState<'high' | 'low'>('high')
  
  useEffect(() => {
    setIsClient(true)
    
    // Detectar rendimiento del dispositivo
    if (typeof window !== 'undefined') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const hasLowMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory && 
                          (navigator as unknown as { deviceMemory?: number }).deviceMemory! < 4
      
      if (isMobile || hasLowMemory) {
        setPerformanceMode('low')
      }
    }
  }, [])

  if (!isClient) {
    return <LoadingFallback />
  }

  return (
    <div className="fixed inset-0 z-[-1] bg-black pointer-events-none">
      <Canvas
        dpr={performanceMode === 'high' ? [1, 2] : [1, 1.5]}
        gl={{ 
          antialias: performanceMode === 'high',
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        
        <Suspense fallback={null}>
          <Scene3D />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  )
}
