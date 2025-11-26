'use client'
/**
 * 🌌 SINGULARITY PARTICLES - SISTEMA DE PARTÍCULAS GPU AVANZADO
 * 
 * Este componente implementa un sistema de partículas completamente
 * renderizado en la GPU usando shaders GLSL personalizados.
 * 
 * Características:
 * - 15,000+ partículas sin impacto en CPU
 * - Interactividad con mouse (repulsión magnética)
 * - Efecto de "respiración cósmica" procedural
 * - Blending aditivo para efecto de luz real
 * - Paleta de colores extraída de imagen cósmica
 */

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// VERTEX SHADER - Magia del movimiento en GPU
// ============================================================================
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  uniform float uInteractionRadius;
  uniform float uInteractionStrength;
  
  attribute float aScale;
  attribute vec3 aColor;
  attribute float aPhase; // Fase individual para variación
  
  varying vec3 vColor;
  varying float vAlpha;

  // Función de ruido Simplex simplificada para ondas orgánicas
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

  void main() {
    vColor = aColor;
    vec3 pos = position;
    float time = uTime * 0.3;

    // ═══════════════════════════════════════════════════════════════
    // 1. RESPIRACIÓN CÓSMICA - Ondas orgánicas usando ruido Simplex
    // ═══════════════════════════════════════════════════════════════
    float noiseScale = 0.5;
    float noiseTime = time * 0.5 + aPhase;
    
    vec3 noisePos = pos * noiseScale + vec3(noiseTime);
    float noise = snoise(noisePos) * 0.3;
    
    // Aplicar distorsión radial (expandir/contraer como respiración)
    vec3 direction = normalize(pos);
    float breathe = sin(time * 0.8 + aPhase * 6.28) * 0.15;
    pos += direction * (noise + breathe);

    // ═══════════════════════════════════════════════════════════════
    // 2. ONDAS SINUSOIDALES - Movimiento fluido
    // ═══════════════════════════════════════════════════════════════
    pos.z += sin(pos.y * 0.8 + time + aPhase * 3.14) * 0.15;
    pos.x += cos(pos.z * 0.6 + time * 0.7 + aPhase * 2.0) * 0.1;
    pos.y += sin(pos.x * 0.4 + time * 0.5) * 0.08;

    // ═══════════════════════════════════════════════════════════════
    // 3. INTERACTIVIDAD MOUSE - Campo de repulsión magnética
    // ═══════════════════════════════════════════════════════════════
    // Mapear mouse de NDC (-1 a 1) a espacio 3D aproximado
    vec3 mousePos = vec3(uMouse.x * 5.0, uMouse.y * 5.0, 0.0);
    vec3 toMouse = pos - mousePos;
    float distToMouse = length(toMouse);
    
    // Fuerza de repulsión inversamente proporcional a la distancia
    if (distToMouse < uInteractionRadius) {
      float force = (1.0 - distToMouse / uInteractionRadius) * uInteractionStrength;
      vec3 repelDir = normalize(toMouse);
      pos += repelDir * force;
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. TRANSFORMACIÓN FINAL
    // ═══════════════════════════════════════════════════════════════
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Tamaño dinámico basado en profundidad (perspectiva real)
    float sizeBase = aScale * uPixelRatio * 45.0;
    float depthScale = 1.0 / -mvPosition.z;
    gl_PointSize = sizeBase * depthScale;
    
    // Alpha basado en distancia (fade en bordes)
    float distFromCenter = length(position);
    vAlpha = smoothstep(5.0, 3.0, distFromCenter);
  }
`

// ============================================================================
// FRAGMENT SHADER - Apariencia de cada partícula
// ============================================================================
const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Convertir cuadrado en círculo suave (glow effect)
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    
    // Múltiples capas de suavizado para efecto de estrella
    float core = 1.0 - smoothstep(0.0, 0.15, d);  // Núcleo brillante
    float glow = 1.0 - smoothstep(0.15, 0.5, d); // Halo suave
    
    float alpha = (core + glow * 0.5) * vAlpha;
    
    // Color con brillo en el centro
    vec3 finalColor = vColor + vec3(core * 0.3);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`

// ============================================================================
// PROPS INTERFACE
// ============================================================================
interface SingularityParticlesProps {
  count?: number
  radius?: number
  interactionRadius?: number
  interactionStrength?: number
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function SingularityParticles({
  count = 12000,
  radius = 4.0,
  interactionRadius = 3.5,
  interactionStrength = 0.8
}: SingularityParticlesProps) {
  const points = useRef<THREE.Points>(null!)
  const { viewport } = useThree()

  // ══════════════════════════════════════════════════════════════════════════
  // GENERACIÓN DE GEOMETRÍA (Solo se ejecuta una vez)
  // ══════════════════════════════════════════════════════════════════════════
  const { positions, colors, scales, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const scl = new Float32Array(count)
    const phs = new Float32Array(count)

    // Paleta de colores cósmica (extraída de imagen Космос)
    const palette = [
      new THREE.Color('#431c5d'), // Morado Oscuro Profundo
      new THREE.Color('#7b2cbf'), // Morado Vibrante
      new THREE.Color('#e052a0'), // Rosa Neón
      new THREE.Color('#33d9b2'), // Cian Eléctrico
      new THREE.Color('#00d4ff'), // Azul Brillante
      new THREE.Color('#ffb142'), // Dorado Cálido
      new THREE.Color('#ff6b6b'), // Coral
      new THREE.Color('#ffffff'), // Blanco Estelar (estrellas brillantes)
    ]

    for (let i = 0; i < count; i++) {
      // ═══════════════════════════════════════════════════════════════
      // DISTRIBUCIÓN ESFÉRICA con variación de densidad
      // ═══════════════════════════════════════════════════════════════
      const theta = Math.random() * Math.PI * 2 // Ángulo horizontal
      const phi = Math.acos(Math.random() * 2 - 1) // Ángulo vertical
      
      // Radio con distribución gaussiana para núcleo más denso
      const gaussianRandom = () => {
        const u = 1 - Math.random()
        const v = Math.random()
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
      }
      
      const r = radius + gaussianRandom() * 0.5

      // Convertir esféricas a cartesianas
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)

      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z

      // ═══════════════════════════════════════════════════════════════
      // COLOR con peso hacia colores más brillantes en el núcleo
      // ═══════════════════════════════════════════════════════════════
      const distFromCenter = Math.sqrt(x * x + y * y + z * z)
      const normalizedDist = distFromCenter / radius
      
      // Más probabilidad de blanco/dorado en el centro
      let colorIndex: number
      if (normalizedDist < 0.5 && Math.random() > 0.7) {
        colorIndex = Math.random() > 0.5 ? 7 : 5 // Blanco o Dorado
      } else {
        colorIndex = Math.floor(Math.random() * palette.length)
      }
      
      const color = palette[colorIndex]
      col[i * 3] = color.r
      col[i * 3 + 1] = color.g
      col[i * 3 + 2] = color.b

      // ═══════════════════════════════════════════════════════════════
      // ESCALA y FASE para variación
      // ═══════════════════════════════════════════════════════════════
      // Partículas más grandes cerca del centro
      scl[i] = (1 - normalizedDist * 0.5) * (0.5 + Math.random() * 0.5)
      phs[i] = Math.random() // Fase aleatoria para desincronizar animaciones
    }

    return { positions: pos, colors: col, scales: scl, phases: phs }
  }, [count, radius])

  // ══════════════════════════════════════════════════════════════════════════
  // UNIFORMS (valores que pasan al shader)
  // ══════════════════════════════════════════════════════════════════════════
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPixelRatio: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uInteractionRadius: { value: interactionRadius },
    uInteractionStrength: { value: interactionStrength }
  }), [interactionRadius, interactionStrength])

  // ══════════════════════════════════════════════════════════════════════════
  // ANIMATION LOOP
  // ══════════════════════════════════════════════════════════════════════════
  useFrame((state) => {
    if (!points.current) return
    
    const material = points.current.material as THREE.ShaderMaterial
    
    // Actualizar tiempo
    material.uniforms.uTime.value = state.clock.getElapsedTime()
    
    // Actualizar posición del mouse con suavizado
    const targetX = state.pointer.x
    const targetY = state.pointer.y
    material.uniforms.uMouse.value.x = THREE.MathUtils.lerp(
      material.uniforms.uMouse.value.x, targetX, 0.1
    )
    material.uniforms.uMouse.value.y = THREE.MathUtils.lerp(
      material.uniforms.uMouse.value.y, targetY, 0.1
    )
    
    // Rotación lenta del sistema completo
    points.current.rotation.y += 0.001
    points.current.rotation.z += 0.0005
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position" 
          args={[positions, 3]}
        />
        <bufferAttribute 
          attach="attributes-aColor" 
          args={[colors, 3]}
        />
        <bufferAttribute 
          attach="attributes-aScale" 
          args={[scales, 1]}
        />
        <bufferAttribute 
          attach="attributes-aPhase" 
          args={[phases, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
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
