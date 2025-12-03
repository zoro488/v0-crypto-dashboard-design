'use client'
/**
 * 🌊 FLUID BACKGROUND - Fondo de Humo Cuántico Interactivo
 * 
 * Fondo de pantalla completa con efecto de fluido/humo líquido
 * renderizado con shaders GLSL personalizados.
 * 
 * Características:
 * - Navier-Stokes simplificado con FBM
 * - Warping multi-capa para movimiento orgánico
 * - Interactividad con cursor (ondas)
 * - Reactividad a audio (pulso)
 * - Paleta de colores profundos cian/violeta
 * - Optimizado para 60fps con precision mediump
 */

import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  fluidBackgroundVertexShader,
  fluidBackgroundFragmentShader,
} from './shaders/NeuralCoreShaders'

// ============================================================================
// TIPOS
// ============================================================================
interface FluidBackgroundProps {
  /** Nivel de energía (0-1) para pulso reactivo */
  energy?: number
  /** Velocidad de la animación */
  speed?: number
  /** Intensidad del color */
  colorIntensity?: number
  /** Modo de color */
  colorMode?: 'cosmic' | 'fire' | 'ice' | 'matrix'
}

// ============================================================================
// PALETAS DE COLORES (para futura expansión)
// ============================================================================
const COLOR_MODES = {
  cosmic: {
    deep: [0.02, 0.02, 0.05],
    cyan: [0.0, 0.6, 0.8],
    violet: [0.4, 0.1, 0.6],
    accent: [0.8, 0.2, 0.5],
  },
  fire: {
    deep: [0.05, 0.02, 0.01],
    cyan: [0.9, 0.3, 0.0],
    violet: [0.8, 0.1, 0.0],
    accent: [1.0, 0.6, 0.0],
  },
  ice: {
    deep: [0.01, 0.03, 0.06],
    cyan: [0.4, 0.8, 1.0],
    violet: [0.2, 0.4, 0.9],
    accent: [0.8, 0.9, 1.0],
  },
  matrix: {
    deep: [0.0, 0.02, 0.0],
    cyan: [0.0, 0.8, 0.2],
    violet: [0.0, 0.4, 0.1],
    accent: [0.2, 1.0, 0.4],
  },
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function FluidBackground({
  energy = 0,
  speed = 1,
  colorIntensity = 1,
  colorMode = 'cosmic',
}: FluidBackgroundProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const { size, viewport } = useThree()

  // ══════════════════════════════════════════════════════════════════════════
  // UNIFORMS DEL SHADER
  // ══════════════════════════════════════════════════════════════════════════
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uEnergy: { value: energy },
    uSpeed: { value: speed },
    uColorIntensity: { value: colorIntensity },
  }), [size.width, size.height, energy, speed, colorIntensity])

  // Actualizar resolución cuando cambia el tamaño
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height)
    }
  }, [size])

  // ══════════════════════════════════════════════════════════════════════════
  // LOOP DE ANIMACIÓN
  // ══════════════════════════════════════════════════════════════════════════
  useFrame((state) => {
    if (!materialRef.current) return
    
    const material = materialRef.current
    
    // Tiempo
    material.uniforms.uTime.value = state.clock.getElapsedTime() * speed
    
    // Mouse con suavizado
    material.uniforms.uMouse.value.x = THREE.MathUtils.lerp(
      material.uniforms.uMouse.value.x,
      state.pointer.x,
      0.05,
    )
    material.uniforms.uMouse.value.y = THREE.MathUtils.lerp(
      material.uniforms.uMouse.value.y,
      state.pointer.y,
      0.05,
    )
    
    // Energía con suavizado
    material.uniforms.uEnergy.value = THREE.MathUtils.lerp(
      material.uniforms.uEnergy.value,
      energy,
      0.1,
    )
  })

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER - Plano que cubre toda la pantalla
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <mesh ref={meshRef} position={[0, 0, -5]}>
      <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={fluidBackgroundVertexShader}
        fragmentShader={fluidBackgroundFragmentShader}
        uniforms={uniforms}
        transparent={false}
        depthWrite={false}
      />
    </mesh>
  )
}

// ============================================================================
// VERSIÓN ALTERNATIVA CON EFECTOS AVANZADOS
// ============================================================================
export function FluidBackgroundAdvanced({
  energy = 0,
}: FluidBackgroundProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const { viewport, size } = useThree()

  // Shader más complejo con FBM de mayor calidad
  const advancedFragmentShader = /* glsl */ `
    precision highp float;
    
    uniform float uTime;
    uniform vec2 uMouse;
    uniform vec2 uResolution;
    uniform float uEnergy;
    
    varying vec2 vUv;

    // Ruido de alta calidad
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
      
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      
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

    // FBM de 8 octavas para humo volumétrico
    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for (int i = 0; i < 8; i++) {
        value += amplitude * snoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5);
      float time = uTime * 0.15;
      
      // Espacio 3D para el ruido
      vec3 p = vec3(uv * 2.0 - 1.0, time);
      
      // Warping multi-capa
      float warp1 = fbm(p);
      p.xy += warp1 * 0.5;
      float warp2 = fbm(p + vec3(3.14, 2.72, 0.0));
      p.xy += warp2 * 0.3;
      
      // Patrón final
      float smoke = fbm(p);
      smoke = smoke * 0.5 + 0.5; // Normalizar a 0-1
      smoke = pow(smoke, 1.8);   // Contraste
      
      // Influencia del mouse
      vec2 mousePos = uMouse * 0.5 + 0.5;
      float mouseDist = distance(uv, mousePos);
      float mouseWave = sin(mouseDist * 15.0 - uTime * 4.0) * exp(-mouseDist * 2.0);
      smoke += mouseWave * 0.15 * (0.5 + uEnergy);
      
      // Colores nebulosos profundos
      vec3 colorVoid = vec3(0.01, 0.01, 0.03);
      vec3 colorCyan = vec3(0.0, 0.5, 0.7);
      vec3 colorMagenta = vec3(0.5, 0.1, 0.5);
      vec3 colorGold = vec3(0.8, 0.6, 0.2);
      
      // Mezcla de colores basada en ruido
      float colorMix1 = fbm(p * 0.5 + vec3(time * 0.1));
      float colorMix2 = fbm(p * 0.3 - vec3(0.0, 0.0, time * 0.05));
      
      vec3 color = colorVoid;
      color = mix(color, colorCyan, smoke * 0.4);
      color = mix(color, colorMagenta, colorMix1 * 0.25);
      color = mix(color, colorGold, colorMix2 * 0.15 * uEnergy);
      
      // Vetas brillantes
      float veins = fbm(p * 3.0 + vec3(time * 0.3));
      veins = smoothstep(0.5, 0.55, veins);
      color += vec3(0.1, 0.2, 0.4) * veins * (0.3 + uEnergy * 0.7);
      
      // Estrellas aleatorias
      float stars = fbm(p * 20.0);
      stars = smoothstep(0.8, 0.85, stars);
      color += vec3(1.0) * stars * 0.5;
      
      // Viñeta
      float vignette = 1.0 - smoothstep(0.2, 0.9, distance(uv, center));
      color *= 0.5 + vignette * 0.5;
      
      // Pulso con energía
      float pulse = sin(uTime * 3.0) * 0.03 * uEnergy;
      color += vec3(0.05, 0.1, 0.15) * pulse;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uEnergy: { value: energy },
  }), [size.width, size.height, energy])

  useFrame((state) => {
    if (!meshRef.current) return
    const material = meshRef.current.material as THREE.ShaderMaterial
    
    material.uniforms.uTime.value = state.clock.getElapsedTime()
    material.uniforms.uMouse.value.x = THREE.MathUtils.lerp(
      material.uniforms.uMouse.value.x,
      state.pointer.x,
      0.03,
    )
    material.uniforms.uMouse.value.y = THREE.MathUtils.lerp(
      material.uniforms.uMouse.value.y,
      state.pointer.y,
      0.03,
    )
    material.uniforms.uEnergy.value = THREE.MathUtils.lerp(
      material.uniforms.uEnergy.value,
      energy,
      0.1,
    )
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -10]}>
      <planeGeometry args={[viewport.width * 2.5, viewport.height * 2.5]} />
      <shaderMaterial
        vertexShader={fluidBackgroundVertexShader}
        fragmentShader={advancedFragmentShader}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  )
}
