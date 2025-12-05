// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — PARTICLE FIELD SHADER
// Sistema de partículas GPU con física realista y fuerza de campos
// ═══════════════════════════════════════════════════════════════

import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const ParticleFieldShader = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0, 0),
    uResolution: new THREE.Vector2(1920, 1080),
    uParticleSize: 0.05,
    uIntensity: 1.0,
    uColorA: new THREE.Color('#8B00FF'),
    uColorB: new THREE.Color('#FFD700'),
    uColorC: new THREE.Color('#FF1493'),
    uSpeed: 0.5,
    uTurbulence: 0.3,
    uAttraction: 0.5,
  },
  // Vertex Shader
  /* glsl */ `
    attribute float aSize;
    attribute float aSpeed;
    attribute vec3 aVelocity;
    attribute float aLife;
    
    varying vec3 vColor;
    varying float vLife;
    
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uParticleSize;
    uniform float uIntensity;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    uniform float uSpeed;
    uniform float uTurbulence;
    uniform float uAttraction;
    
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
      vec3 pos = position;
      
      // Física: campo de fuerzas basado en ruido
      float noiseX = snoise(pos * 0.5 + uTime * uSpeed);
      float noiseY = snoise(pos * 0.5 + uTime * uSpeed + 100.0);
      float noiseZ = snoise(pos * 0.5 + uTime * uSpeed + 200.0);
      
      vec3 force = vec3(noiseX, noiseY, noiseZ) * uTurbulence;
      
      // Atracción hacia el mouse (en espacio 3D)
      vec3 mousePos3D = vec3(uMouse * 10.0, 0.0);
      vec3 toMouse = mousePos3D - pos;
      float distToMouse = length(toMouse);
      if (distToMouse < 5.0) {
        force += normalize(toMouse) * uAttraction * (1.0 - distToMouse / 5.0);
      }
      
      // Aplicar física
      pos += aVelocity * aSpeed + force;
      
      // Mantener dentro de límites (esfera invisible)
      float distFromCenter = length(pos);
      if (distFromCenter > 20.0) {
        pos = normalize(pos) * 20.0;
      }
      
      // Color basado en vida y posición
      float colorMix = (pos.y + 20.0) / 40.0;
      vec3 color;
      if (colorMix < 0.5) {
        color = mix(uColorA, uColorB, colorMix * 2.0);
      } else {
        color = mix(uColorB, uColorC, (colorMix - 0.5) * 2.0);
      }
      
      vColor = color * uIntensity;
      vLife = aLife;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Tamaño con perspectiva y basado en vida
      gl_PointSize = uParticleSize * aSize * (300.0 / -mvPosition.z) * vLife;
    }
  `,
  // Fragment Shader
  /* glsl */ `
    varying vec3 vColor;
    varying float vLife;
    
    void main() {
      // Forma circular suave
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      
      if (dist > 0.5) discard;
      
      // Gradiente radial suave
      float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
      alpha *= vLife;
      
      // Glow effect
      vec3 glow = vColor * (1.0 + alpha * 0.5);
      
      gl_FragColor = vec4(glow, alpha * 0.8);
    }
  `
)

export type ParticleFieldShaderMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uTime: { value: number }
    uMouse: { value: THREE.Vector2 }
    uResolution: { value: THREE.Vector2 }
    uParticleSize: { value: number }
    uIntensity: { value: number }
    uColorA: { value: THREE.Color }
    uColorB: { value: THREE.Color }
    uColorC: { value: THREE.Color }
    uSpeed: { value: number }
    uTurbulence: { value: number }
    uAttraction: { value: number }
  }
}
