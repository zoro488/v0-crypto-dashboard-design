// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — SACRED GEOMETRY SHADER
// Geometría sagrada con patrones fractales animados
// Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
// ═══════════════════════════════════════════════════════════════

import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const SacredGeometryShader = shaderMaterial(
  {
    uTime: 0,
    uComplexity: 6.0,
    uRotationSpeed: 0.5,
    uPrimaryColor: new THREE.Color(0x8B00FF),
    uSecondaryColor: new THREE.Color(0xFFD700),
    uTertiaryColor: new THREE.Color(0xFF1493),
  },
  /* glsl */ `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform float uComplexity;
    uniform float uRotationSpeed;
    uniform vec3 uPrimaryColor;
    uniform vec3 uSecondaryColor;
    uniform vec3 uTertiaryColor;
    
    varying vec2 vUv;
    
    #define PI 3.14159265359
    #define TAU 6.28318530718
    
    // Rotación 2D
    mat2 rot2D(float angle) {
      float c = cos(angle);
      float s = sin(angle);
      return mat2(c, -s, s, c);
    }
    
    // Distancia a polígono regular
    float polygon(vec2 p, int n, float size) {
      float a = atan(p.x, p.y) + PI;
      float r = TAU / float(n);
      float d = cos(floor(0.5 + a / r) * r - a) * length(p);
      return d - size;
    }
    
    // Flower of Life pattern
    float flowerOfLife(vec2 p, float scale) {
      p *= scale;
      float d = 1.0;
      
      // Centro
      d = min(d, abs(length(p) - 0.5));
      
      // 6 círculos alrededor
      for (int i = 0; i < 6; i++) {
        float angle = float(i) * TAU / 6.0;
        vec2 center = vec2(cos(angle), sin(angle)) * 0.5;
        d = min(d, abs(length(p - center) - 0.5));
      }
      
      // Segunda capa
      for (int i = 0; i < 6; i++) {
        float angle = float(i) * TAU / 6.0 + TAU / 12.0;
        vec2 center = vec2(cos(angle), sin(angle)) * 0.866;
        d = min(d, abs(length(p - center) - 0.5));
      }
      
      return d;
    }
    
    // Metatron's Cube
    float metatronsCube(vec2 p, float scale) {
      p *= scale;
      float d = 1.0;
      
      // Hexágono externo
      d = min(d, abs(polygon(p, 6, 1.0)));
      
      // Triángulos
      d = min(d, abs(polygon(p, 3, 0.8)));
      d = min(d, abs(polygon(p * rot2D(PI), 3, 0.8)));
      
      // Círculos en vértices
      for (int i = 0; i < 6; i++) {
        float angle = float(i) * TAU / 6.0;
        vec2 pos = vec2(cos(angle), sin(angle));
        d = min(d, abs(length(p - pos) - 0.15));
      }
      
      // Centro
      d = min(d, abs(length(p) - 0.15));
      
      // Líneas conectoras
      for (int i = 0; i < 6; i++) {
        float angle = float(i) * TAU / 6.0;
        vec2 dir = vec2(cos(angle), sin(angle));
        float line = abs(dot(p, vec2(-dir.y, dir.x)));
        line = max(line, abs(dot(p, dir) - 0.5));
        d = min(d, line);
      }
      
      return d;
    }
    
    // Sri Yantra (simplificado)
    float sriYantra(vec2 p, float scale) {
      p *= scale;
      float d = 1.0;
      
      // Triángulos concéntricos
      for (int i = 0; i < 4; i++) {
        float size = 1.0 - float(i) * 0.2;
        float rotation = float(i) * 0.1;
        d = min(d, abs(polygon(p * rot2D(rotation), 3, size)));
        d = min(d, abs(polygon(p * rot2D(rotation + PI), 3, size * 0.8)));
      }
      
      // Círculo central (bindu)
      d = min(d, abs(length(p) - 0.08));
      
      return d;
    }
    
    void main() {
      vec2 uv = vUv - 0.5;
      float t = uTime * uRotationSpeed;
      
      // Rotar el espacio
      uv = rot2D(t * 0.2) * uv;
      
      // Calcular patrones
      float flower = flowerOfLife(uv, 3.0 + sin(t * 0.5) * 0.5);
      float metatron = metatronsCube(uv * rot2D(t * 0.3), 2.0);
      float sri = sriYantra(uv * rot2D(-t * 0.2), 2.5);
      
      // Líneas de geometría
      float lineWidth = 0.02 + sin(t) * 0.01;
      
      float pattern1 = smoothstep(lineWidth, 0.0, flower);
      float pattern2 = smoothstep(lineWidth * 0.8, 0.0, metatron);
      float pattern3 = smoothstep(lineWidth * 0.6, 0.0, sri);
      
      // Combinar con diferentes intensidades basadas en tiempo
      float mix1 = sin(t * 0.7) * 0.5 + 0.5;
      float mix2 = sin(t * 0.5 + 1.0) * 0.5 + 0.5;
      float mix3 = sin(t * 0.3 + 2.0) * 0.5 + 0.5;
      
      vec3 color = vec3(0.0);
      color += uPrimaryColor * pattern1 * mix1;
      color += uSecondaryColor * pattern2 * mix2;
      color += uTertiaryColor * pattern3 * mix3;
      
      // Glow en intersecciones
      float glow = max(max(pattern1, pattern2), pattern3);
      glow = pow(glow, 0.5);
      color += vec3(1.0, 0.9, 0.8) * glow * 0.3;
      
      // Fade radial
      float radialFade = 1.0 - length(uv) * 1.2;
      radialFade = max(0.0, radialFade);
      color *= radialFade;
      
      // Pulso de energía
      float pulse = sin(length(uv) * 10.0 - t * 3.0) * 0.5 + 0.5;
      pulse = smoothstep(0.4, 0.6, pulse) * 0.2;
      color += (uPrimaryColor + uSecondaryColor) * 0.5 * pulse * radialFade;
      
      float alpha = max(max(pattern1, pattern2), pattern3) * radialFade;
      
      gl_FragColor = vec4(color, alpha);
    }
  `
)

export type SacredGeometryShaderMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uTime: { value: number }
    uComplexity: { value: number }
    uRotationSpeed: { value: number }
    uPrimaryColor: { value: THREE.Color }
    uSecondaryColor: { value: THREE.Color }
    uTertiaryColor: { value: THREE.Color }
  }
}
