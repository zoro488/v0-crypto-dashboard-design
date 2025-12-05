// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — HOLOGRAPHIC SHADER
// Shader holográfico con efecto de escaneo y glitch
// ═══════════════════════════════════════════════════════════════

import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const HolographicShader = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#8B00FF'),
    uScanlineSpeed: 2.0,
    uScanlineWidth: 0.02,
    uGlitchIntensity: 0.1,
    uHologramOpacity: 0.7,
    uFresnelPower: 3.0,
  },
  // Vertex Shader
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vViewPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      vViewPosition = -(modelViewMatrix * vec4(position, 1.0)).xyz;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vViewPosition;
    
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uScanlineSpeed;
    uniform float uScanlineWidth;
    uniform float uGlitchIntensity;
    uniform float uHologramOpacity;
    uniform float uFresnelPower;
    
    // Hash function para glitch aleatorio
    float hash(float n) {
      return fract(sin(n) * 43758.5453123);
    }
    
    // Fresnel
    float fresnel(vec3 viewDir, vec3 normal, float power) {
      return pow(1.0 - max(dot(viewDir, normal), 0.0), power);
    }
    
    void main() {
      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      
      // Efecto Fresnel para bordes brillantes
      float fresnelEffect = fresnel(viewDir, normal, uFresnelPower);
      
      // Scanline vertical que se mueve
      float scanline = fract(vUv.y - uTime * uScanlineSpeed);
      float scanlineIntensity = smoothstep(uScanlineWidth, 0.0, abs(scanline - 0.5));
      
      // Glitch horizontal aleatorio
      float glitch = hash(floor(vUv.y * 50.0 + uTime * 10.0)) * uGlitchIntensity;
      float glitchEffect = step(0.95, glitch);
      
      // Grid holográfico
      float gridX = abs(fract(vUv.x * 20.0) - 0.5);
      float gridY = abs(fract(vUv.y * 20.0) - 0.5);
      float grid = step(0.48, max(gridX, gridY)) * 0.2;
      
      // Color base con todos los efectos
      vec3 finalColor = uColor;
      finalColor += vec3(scanlineIntensity) * 0.5;
      finalColor += vec3(glitchEffect) * vec3(0.0, 1.0, 1.0);
      finalColor += vec3(grid);
      finalColor += vec3(fresnelEffect) * uColor * 1.5;
      
      // Pulso de brillo
      float pulse = sin(uTime * 3.0) * 0.2 + 0.8;
      finalColor *= pulse;
      
      // Alpha con fresnel
      float alpha = mix(uHologramOpacity * 0.3, uHologramOpacity, fresnelEffect);
      alpha = max(alpha, scanlineIntensity * 0.7);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
)

export type HolographicShaderMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uTime: { value: number }
    uColor: { value: THREE.Color }
    uScanlineSpeed: { value: number }
    uScanlineWidth: { value: number }
    uGlitchIntensity: { value: number }
    uHologramOpacity: { value: number }
    uFresnelPower: { value: number }
  }
}
