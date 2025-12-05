// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — QUANTUM VOID SHADER
// Fondo negro absoluto con distorsión cuántica y partículas magnéticas
// Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
// ═══════════════════════════════════════════════════════════════

import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const QuantumVoidShader = shaderMaterial(
  // Uniforms
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uResolution: new THREE.Vector2(1920, 1080),
    uMood: 0.5, // 0.0 calm → 1.0 euphoric
    uCapitalIntensity: 0.5, // Basado en capital total del sistema
  },
  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  /* glsl */ `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform vec2 uResolution;
    uniform float uMood;
    uniform float uCapitalIntensity;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    // CHRONOS Palette (NO CYAN)
    const vec3 VIOLET = vec3(0.545, 0.0, 1.0);      // #8B00FF
    const vec3 GOLD = vec3(1.0, 0.843, 0.0);        // #FFD700
    const vec3 PINK = vec3(1.0, 0.078, 0.576);      // #FF1493
    const vec3 BLACK = vec3(0.0, 0.0, 0.0);         // #000000
    
    // Simplex 2D noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    // FBM (Fractional Brownian Motion)
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 6; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return value;
    }
    
    // Worley noise for crystalline effect
    float worley(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float minDist = 1.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 neighbor = vec2(float(x), float(y));
          vec2 point = vec2(
            snoise(i + neighbor) * 0.5 + 0.5,
            snoise(i + neighbor + vec2(42.0, 17.0)) * 0.5 + 0.5
          );
          point = 0.5 + 0.5 * sin(uTime * 0.3 + 6.2831 * point);
          float dist = length(neighbor + point - f);
          minDist = min(minDist, dist);
        }
      }
      return minDist;
    }
    
    void main() {
      vec2 uv = vUv;
      vec2 mouse = uMouse;
      
      // Distorsión cuántica profunda con múltiples capas
      float t = uTime * 0.15;
      
      // Capa 1: Ondas grandes
      float distortion = fbm(uv * 3.0 + t) * 0.1;
      
      // Capa 2: Worley para efecto cristalino
      float crystal = worley(uv * 8.0 + t * 0.5) * 0.15;
      
      // Capa 3: Ruido fino
      float fine = snoise(uv * 20.0 + t * 2.0) * 0.03;
      
      vec2 distortedUv = uv + vec2(distortion, crystal);
      
      // Aura magnética hacia el mouse
      float auraDist = length(distortedUv - mouse);
      float aura = 1.0 / (auraDist * 8.0 + 0.3);
      aura = pow(aura, 1.5) * uMood;
      
      // Partículas cuánticas (grid basado en tiempo)
      vec2 grid = fract(uv * 60.0 + vec2(t * 0.3, t * 0.2));
      float spark = smoothstep(0.95, 1.0, sin(grid.x * 3.14159 * 2.0)) * 
                    smoothstep(0.95, 1.0, sin(grid.y * 3.14159 * 2.0));
      spark *= (snoise(uv * 50.0 + t) * 0.5 + 0.5);
      
      // Venas de energía
      float veins = fbm(uv * 4.0 - t * 0.2);
      veins = smoothstep(0.4, 0.6, veins) * 0.3;
      
      // Color base: negro profundo con variación sutil
      vec3 baseColor = BLACK + vec3(0.02, 0.0, 0.04); // Tinte violeta sutil
      
      // Agregar aura magnética (violeta/oro)
      vec3 auraColor = mix(VIOLET, GOLD, sin(uTime * 0.5) * 0.5 + 0.5);
      baseColor += auraColor * aura * (0.3 + uCapitalIntensity * 0.4);
      
      // Agregar chispas (oro/rosa)
      vec3 sparkColor = mix(GOLD, PINK, snoise(uv * 10.0 + t));
      baseColor += sparkColor * spark * 2.0;
      
      // Agregar venas de energía (violeta)
      baseColor += VIOLET * veins * uMood;
      
      // Efecto de respiración global
      float breathe = sin(uTime * 0.5) * 0.5 + 0.5;
      baseColor *= 1.0 + breathe * 0.1 * uCapitalIntensity;
      
      // Viñeta suave
      float vignette = 1.0 - length(uv - 0.5) * 0.8;
      baseColor *= vignette;
      
      // Output con alpha para composición
      gl_FragColor = vec4(baseColor, 1.0);
    }
  `
)

// Tipo para el material
export type QuantumVoidShaderMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uTime: { value: number }
    uMouse: { value: THREE.Vector2 }
    uResolution: { value: THREE.Vector2 }
    uMood: { value: number }
    uCapitalIntensity: { value: number }
  }
}
