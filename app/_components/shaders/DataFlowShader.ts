// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — DATA FLOW SHADER
// Visualización de flujo de datos financieros
// Streams de partículas representando transacciones
// ═══════════════════════════════════════════════════════════════

import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const DataFlowShader = shaderMaterial(
  {
    uTime: 0,
    uFlowSpeed: 1.0,
    uDensity: 1.0,
    uDirection: new THREE.Vector2(1.0, 0.0), // Dirección del flujo
    uIncomeColor: new THREE.Color(0xFFD700), // Oro para ingresos
    uExpenseColor: new THREE.Color(0xFF1493), // Rosa para gastos
    uNeutralColor: new THREE.Color(0x8B00FF), // Violeta para neutral
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
    uniform float uFlowSpeed;
    uniform float uDensity;
    uniform vec2 uDirection;
    uniform vec3 uIncomeColor;
    uniform vec3 uExpenseColor;
    uniform vec3 uNeutralColor;
    
    varying vec2 vUv;
    
    // Hash functions
    float hash(float n) {
      return fract(sin(n) * 43758.5453123);
    }
    
    float hash2(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    // Partícula individual de datos
    float dataParticle(vec2 uv, vec2 center, float size, float speed, float offset) {
      float t = uTime * speed + offset;
      
      // Movimiento en la dirección especificada
      vec2 dir = normalize(uDirection);
      vec2 pos = center + dir * fract(t) * 2.0 - dir;
      
      // Ondulación lateral
      float wave = sin(t * 5.0 + center.y * 10.0) * 0.02;
      pos += vec2(-dir.y, dir.x) * wave;
      
      float d = length(uv - pos);
      
      // Trail effect
      float trail = smoothstep(size * 3.0, 0.0, d);
      float core = smoothstep(size, 0.0, d);
      
      return core + trail * 0.3;
    }
    
    // Stream de datos (múltiples partículas)
    float dataStream(vec2 uv, float yOffset, float particleCount, float baseSpeed) {
      float stream = 0.0;
      
      for (float i = 0.0; i < 20.0; i++) {
        if (i >= particleCount) break;
        
        float offset = hash(i + yOffset * 100.0);
        float speed = baseSpeed * (0.8 + hash(i * 2.0 + yOffset * 50.0) * 0.4);
        float size = 0.005 + hash(i * 3.0) * 0.01;
        
        vec2 center = vec2(offset, yOffset);
        stream += dataParticle(uv, center, size, speed, offset * 10.0);
      }
      
      return stream;
    }
    
    void main() {
      vec2 uv = vUv;
      float t = uTime;
      
      vec3 color = vec3(0.0);
      float alpha = 0.0;
      
      // Múltiples streams paralelos
      float streamCount = 15.0 * uDensity;
      
      for (float i = 0.0; i < 30.0; i++) {
        if (i >= streamCount) break;
        
        float yPos = (i + 0.5) / streamCount;
        float particleCount = 10.0 + hash(i) * 10.0;
        
        // Tipo de stream (ingreso, gasto, neutral)
        float streamType = hash(i * 7.0);
        
        vec3 streamColor;
        if (streamType < 0.4) {
          streamColor = uIncomeColor; // Ingresos - oro
        } else if (streamType < 0.7) {
          streamColor = uExpenseColor; // Gastos - rosa
        } else {
          streamColor = uNeutralColor; // Neutral - violeta
        }
        
        float speed = uFlowSpeed * (0.5 + hash(i * 3.0) * 0.5);
        float stream = dataStream(uv, yPos, particleCount, speed);
        
        color += streamColor * stream;
        alpha += stream;
      }
      
      // Líneas de conexión entre streams
      float connections = 0.0;
      for (float i = 0.0; i < 10.0; i++) {
        float startY = hash(i) * 0.8 + 0.1;
        float endY = hash(i + 100.0) * 0.8 + 0.1;
        
        float progress = fract(t * 0.3 + hash(i + 50.0));
        float x = progress;
        float y = mix(startY, endY, progress);
        
        float d = length(uv - vec2(x, y));
        float connection = smoothstep(0.02, 0.0, d);
        
        connections += connection;
      }
      
      color += uNeutralColor * connections * 0.5;
      alpha += connections * 0.3;
      
      // Grid de fondo sutil
      vec2 grid = abs(fract(uv * 20.0) - 0.5);
      float gridLine = smoothstep(0.48, 0.5, max(grid.x, grid.y));
      color += uNeutralColor * gridLine * 0.05;
      
      // Pulsos de actividad
      float pulse = sin(t * 2.0) * 0.5 + 0.5;
      color *= 0.8 + pulse * 0.4;
      
      alpha = clamp(alpha, 0.0, 1.0);
      
      gl_FragColor = vec4(color, alpha);
    }
  `
)

export type DataFlowShaderMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uTime: { value: number }
    uFlowSpeed: { value: number }
    uDensity: { value: number }
    uDirection: { value: THREE.Vector2 }
    uIncomeColor: { value: THREE.Color }
    uExpenseColor: { value: THREE.Color }
    uNeutralColor: { value: THREE.Color }
  }
}
