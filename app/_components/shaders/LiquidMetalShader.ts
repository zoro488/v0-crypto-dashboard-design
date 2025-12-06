// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — LIQUID METAL SHADER (WebGPU/GLSL)
// Shader avanzado para orbes metálicos líquidos con física realista
// ═══════════════════════════════════════════════════════════════

import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const LiquidMetalShader = shaderMaterial(
  // Uniforms
  {
    uTime: 0,
    uIntensity: 0.5,
    uColor: new THREE.Color('#8B00FF'),
    uGlowColor: new THREE.Color('#FFD700'),
    uFrequency: 2.0,
    uAmplitude: 0.3,
    uMetalness: 0.95,
    uRoughness: 0.1,
    uIridescence: 0.8,
    uDistortion: 0.2,
  },
  // Vertex Shader
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vViewPosition;
    
    uniform float uTime;
    uniform float uFrequency;
    uniform float uAmplitude;
    uniform float uDistortion;
    
    // Simplex 3D Noise
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
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      // Distorsión líquida con múltiples octavas de ruido
      vec3 pos = position;
      float noise = 0.0;
      
      // Octava 1: Ondas grandes
      noise += snoise(pos * uFrequency + uTime * 0.5) * uAmplitude;
      
      // Octava 2: Detalles medianos
      noise += snoise(pos * uFrequency * 2.0 + uTime * 0.7) * uAmplitude * 0.5;
      
      // Octava 3: Detalles finos
      noise += snoise(pos * uFrequency * 4.0 + uTime * 1.0) * uAmplitude * 0.25;
      
      // Aplicar distorsión en dirección de la normal
      pos += normal * noise * uDistortion;
      
      vPosition = pos;
      vViewPosition = -(modelViewMatrix * vec4(pos, 1.0)).xyz;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vViewPosition;
    
    uniform float uTime;
    uniform float uIntensity;
    uniform vec3 uColor;
    uniform vec3 uGlowColor;
    uniform float uMetalness;
    uniform float uRoughness;
    uniform float uIridescence;
    
    // Fresnel effect
    float fresnel(vec3 viewDirection, vec3 normal, float power) {
      return pow(1.0 - abs(dot(viewDirection, normal)), power);
    }
    
    // Iridescence effect (como aceite sobre agua)
    vec3 iridescence(float intensity, vec2 uv, float time) {
      float hue = intensity + sin(time * 0.5 + uv.x * 10.0) * 0.1;
      hue = fract(hue);
      
      vec3 color;
      if (hue < 0.33) {
        color = mix(vec3(1.0, 0.0, 1.0), vec3(0.0, 0.0, 1.0), hue * 3.0);
      } else if (hue < 0.66) {
        color = mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 1.0), (hue - 0.33) * 3.0);
      } else {
        color = mix(vec3(0.0, 1.0, 1.0), vec3(1.0, 0.0, 1.0), (hue - 0.66) * 3.0);
      }
      
      return color;
    }
    
    void main() {
      vec3 viewDirection = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      
      // Fresnel intenso para efecto metálico
      float fresnelEffect = fresnel(viewDirection, normal, 3.0);
      
      // Iridiscencia basada en ángulo de visión
      vec3 iridColor = iridescence(fresnelEffect, vUv, uTime);
      
      // Mezcla de color base con iridiscencia
      vec3 baseColor = mix(uColor, iridColor * uGlowColor, uIridescence * fresnelEffect);
      
      // Glow pulsante
      float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
      vec3 glow = uGlowColor * pulse * uIntensity * fresnelEffect;
      
      // Efecto metálico con múltiples capas
      vec3 finalColor = baseColor + glow;
      
      // Brillo especular
      float specular = pow(fresnelEffect, 10.0) * uMetalness;
      finalColor += vec3(specular) * 0.5;
      
      // Alpha con Fresnel para transparencia en los bordes
      float alpha = mix(0.85, 1.0, fresnelEffect * 0.3);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
)

// Export tipo para TypeScript
export type LiquidMetalShaderMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uTime: { value: number }
    uIntensity: { value: number }
    uColor: { value: THREE.Color }
    uGlowColor: { value: THREE.Color }
    uFrequency: { value: number }
    uAmplitude: { value: number }
    uMetalness: { value: number }
    uRoughness: { value: number }
    uIridescence: { value: number }
    uDistortion: { value: number }
  }
}
