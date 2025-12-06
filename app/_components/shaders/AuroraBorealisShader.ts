// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — AURORA BOREALIS SHADER
// Auroras premium con ondulación orgánica
// Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
// ═══════════════════════════════════════════════════════════════

import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const AuroraBorealisShader = shaderMaterial(
  {
    uTime: 0,
    uIntensity: 1.0,
    uSpeed: 1.0,
    uComplexity: 5.0,
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
    uniform float uIntensity;
    uniform float uSpeed;
    uniform float uComplexity;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    // CHRONOS Palette
    const vec3 VIOLET = vec3(0.545, 0.0, 1.0);
    const vec3 GOLD = vec3(1.0, 0.843, 0.0);
    const vec3 PINK = vec3(1.0, 0.078, 0.576);
    const vec3 BLACK = vec3(0.0, 0.0, 0.0);
    
    // Simplex noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g; g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main() {
      vec2 uv = vUv;
      float t = uTime * uSpeed * 0.3;
      
      // Múltiples capas de aurora
      float aurora = 0.0;
      for (float i = 0.0; i < 6.0; i++) {
        if (i >= uComplexity) break;
        
        float offset = i * 0.5;
        float freq = 2.0 + i * 0.5;
        float speed = 0.3 + i * 0.1;
        
        // Ondulación de cortina
        float wave = sin(uv.x * freq + t * speed + offset) * 0.5;
        wave += snoise(vec2(uv.x * freq * 2.0, t * 0.5 + offset)) * 0.3;
        
        // Altura de la aurora
        float height = uv.y + wave * 0.3;
        float band = smoothstep(0.3 + i * 0.05, 0.5 + i * 0.05, height);
        band *= smoothstep(0.9 - i * 0.05, 0.7 - i * 0.05, height);
        
        aurora += band * (1.0 / (1.0 + i * 0.5));
      }
      
      // Normalizar
      aurora = clamp(aurora * 0.6, 0.0, 1.0);
      
      // Gradiente de color basado en altura
      float colorMix = uv.y * 2.0 + sin(t * 0.5) * 0.2;
      vec3 auroraColor = mix(PINK, VIOLET, colorMix);
      auroraColor = mix(auroraColor, GOLD, sin(uv.x * 3.0 + t) * 0.3 + 0.2);
      
      // Color final
      vec3 color = BLACK;
      color += auroraColor * aurora * uIntensity;
      
      // Brillo adicional en picos
      float glow = pow(aurora, 2.0) * 0.5;
      color += vec3(1.0, 0.9, 0.8) * glow;
      
      // Fade en bordes
      float fadeX = smoothstep(0.0, 0.1, uv.x) * smoothstep(1.0, 0.9, uv.x);
      color *= fadeX;
      
      gl_FragColor = vec4(color, aurora * uIntensity);
    }
  `
)

export type AuroraBorealisShaderMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uTime: { value: number }
    uIntensity: { value: number }
    uSpeed: { value: number }
    uComplexity: { value: number }
  }
}
