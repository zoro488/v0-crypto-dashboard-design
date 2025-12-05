// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — GLASS SHADER
// Shader de vidrio con refracción, reflexión y chromatic aberration
// ═══════════════════════════════════════════════════════════════

import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const GlassShader = shaderMaterial(
  {
    uTime: 0,
    uRefraction: 0.98,
    uChromaticAberration: 0.02,
    uThickness: 0.5,
    uIor: 1.45, // Index of refraction (vidrio)
    uSaturation: 1.1,
    uTint: new THREE.Color('#8B00FF'),
    uTransmission: 0.95,
    envMap: null,
  },
  // Vertex Shader
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      vViewPosition = -(modelViewMatrix * vec4(position, 1.0)).xyz;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;
    
    uniform float uTime;
    uniform float uRefraction;
    uniform float uChromaticAberration;
    uniform float uThickness;
    uniform float uIor;
    uniform float uSaturation;
    uniform vec3 uTint;
    uniform float uTransmission;
    uniform samplerCube envMap;
    
    // Fresnel Schlick
    vec3 fresnelSchlick(float cosTheta, vec3 F0) {
      return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
    }
    
    void main() {
      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      
      // Fresnel para reflexión
      float fresnelTerm = pow(1.0 - abs(dot(viewDir, normal)), 3.0);
      
      // Refracción con IOR
      vec3 refractedR = refract(viewDir, normal, 1.0 / uIor);
      vec3 refractedG = refract(viewDir, normal, 1.0 / (uIor + uChromaticAberration));
      vec3 refractedB = refract(viewDir, normal, 1.0 / (uIor + uChromaticAberration * 2.0));
      
      // Simular el grosor del vidrio
      vec3 thickness = normal * uThickness;
      
      // Color base con chromatic aberration
      vec3 color = vec3(0.0);
      if (envMap != samplerCube(0)) {
        color.r = textureCube(envMap, refractedR).r;
        color.g = textureCube(envMap, refractedG).g;
        color.b = textureCube(envMap, refractedB).b;
      } else {
        // Fallback sin envMap
        color = vec3(0.9, 0.95, 1.0);
      }
      
      // Aplicar tinte
      color = mix(color, uTint, 0.1);
      
      // Saturación
      float gray = dot(color, vec3(0.299, 0.587, 0.114));
      color = mix(vec3(gray), color, uSaturation);
      
      // Reflexión especular
      vec3 reflected = reflect(viewDir, normal);
      vec3 reflectionColor = vec3(0.0);
      if (envMap != samplerCube(0)) {
        reflectionColor = textureCube(envMap, reflected).rgb;
      }
      
      // Mezcla reflexión y refracción basada en Fresnel
      color = mix(color, reflectionColor, fresnelTerm * 0.3);
      
      // Bordes brillantes
      float edgeGlow = pow(fresnelTerm, 2.0);
      color += uTint * edgeGlow * 0.3;
      
      // Transmisión con suave degradado
      float alpha = mix(uTransmission, 0.95, fresnelTerm);
      
      gl_FragColor = vec4(color, alpha);
    }
  `
)

export type GlassShaderMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uTime: { value: number }
    uRefraction: { value: number }
    uChromaticAberration: { value: number }
    uThickness: { value: number }
    uIor: { value: number }
    uSaturation: { value: number }
    uTint: { value: THREE.Color }
    uTransmission: { value: number }
    envMap: { value: THREE.CubeTexture | null }
  }
}
