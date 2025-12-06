// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — NEBULA COSMOS SHADER
// Nebulosas con volumetría y partículas estelares
// Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
// ═══════════════════════════════════════════════════════════════

import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const NebulaCosmosShader = shaderMaterial(
  {
    uTime: 0,
    uDensity: 1.0,
    uStarIntensity: 1.0,
    uNebulaColor1: new THREE.Color(0x8B00FF), // Violet
    uNebulaColor2: new THREE.Color(0xFF1493), // Pink
    uNebulaColor3: new THREE.Color(0xFFD700), // Gold
  },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform float uDensity;
    uniform float uStarIntensity;
    uniform vec3 uNebulaColor1;
    uniform vec3 uNebulaColor2;
    uniform vec3 uNebulaColor3;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    // 3D Simplex noise
    vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      
      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      
      float n_ = 1.0/7.0;
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
    
    // FBM 3D
    float fbm3(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 5; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return value;
    }
    
    // Hash para estrellas
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      vec2 uv = vUv;
      float t = uTime * 0.1;
      
      // Coordenadas 3D para volumetría
      vec3 p = vec3(uv * 4.0, t);
      
      // Nebulosas volumétricas
      float nebula1 = fbm3(p);
      float nebula2 = fbm3(p + vec3(100.0, 0.0, 0.0));
      float nebula3 = fbm3(p + vec3(0.0, 100.0, 0.0));
      
      // Normalizar y ajustar densidad
      nebula1 = smoothstep(-0.5, 0.8, nebula1) * uDensity;
      nebula2 = smoothstep(-0.3, 0.9, nebula2) * uDensity * 0.7;
      nebula3 = smoothstep(-0.4, 0.7, nebula3) * uDensity * 0.5;
      
      // Color de nebulosas
      vec3 color = vec3(0.0);
      color += uNebulaColor1 * nebula1;
      color += uNebulaColor2 * nebula2;
      color += uNebulaColor3 * nebula3;
      
      // Estrellas (múltiples capas de tamaño)
      float stars = 0.0;
      
      // Estrellas pequeñas
      vec2 starGrid1 = floor(uv * 150.0);
      float star1 = hash(starGrid1);
      star1 = smoothstep(0.98, 1.0, star1);
      float twinkle1 = sin(uTime * 5.0 + star1 * 100.0) * 0.5 + 0.5;
      stars += star1 * twinkle1 * 0.5;
      
      // Estrellas medianas
      vec2 starGrid2 = floor(uv * 80.0);
      float star2 = hash(starGrid2 + 100.0);
      star2 = smoothstep(0.97, 1.0, star2);
      float twinkle2 = sin(uTime * 3.0 + star2 * 50.0) * 0.5 + 0.5;
      stars += star2 * twinkle2 * 0.8;
      
      // Estrellas grandes (raras)
      vec2 starGrid3 = floor(uv * 30.0);
      float star3 = hash(starGrid3 + 200.0);
      star3 = smoothstep(0.99, 1.0, star3);
      float twinkle3 = sin(uTime * 2.0 + star3 * 30.0) * 0.3 + 0.7;
      stars += star3 * twinkle3 * 1.5;
      
      // Agregar estrellas
      color += vec3(1.0, 0.95, 0.9) * stars * uStarIntensity;
      
      // Brillo central de nebulosa
      float centerGlow = 1.0 - length(uv - 0.5) * 1.5;
      centerGlow = max(0.0, centerGlow);
      color += mix(uNebulaColor1, uNebulaColor3, sin(t) * 0.5 + 0.5) * centerGlow * 0.3;
      
      // Alpha basado en densidad total
      float alpha = clamp(nebula1 + nebula2 + nebula3 + stars * 0.2, 0.0, 1.0);
      
      gl_FragColor = vec4(color, alpha);
    }
  `
)

export type NebulaCosmosShaderMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uTime: { value: number }
    uDensity: { value: number }
    uStarIntensity: { value: number }
    uNebulaColor1: { value: THREE.Color }
    uNebulaColor2: { value: THREE.Color }
    uNebulaColor3: { value: THREE.Color }
  }
}
