/**
 * 🔴 ZERO EYE SHADER - Shader Procedural GLSL para los ojos de Zero
 * 
 * Este shader crea los ojos rojos rasgados horizontales de Zero.
 * No usa texturas - es pura matemática de luz corriendo en la GPU.
 * 
 * Características:
 * - Línea horizontal roja que escanea (efecto Cylon)
 * - Reacciona a la voz (se ensancha al hablar)
 * - Parpadeo con glitches digitales
 * - Brillo HDR para Bloom intenso
 * - Pulsos de energía animados
 */

import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'

// ============================================
// SHADER MATERIAL DEFINITION
// ============================================

const ZeroEyeMaterial = shaderMaterial(
  // Uniforms (variables que controlamos desde React)
  {
    uTime: 0,
    uColor: new THREE.Color(2.5, 0.0, 0.0),        // Rojo HDR intenso (>1 para bloom)
    uSecondaryColor: new THREE.Color(0.5, 0.0, 0.0), // Rojo oscuro para degradado
    uIntensity: 2.0,                                // Intensidad del brillo
    uOpen: 1.0,                                     // 1 = Ojo abierto, 0 = Cerrado (parpadeo)
    uSpeech: 0.0,                                   // Amplitud de voz (0 a 1)
    uProcessing: 0.0,                               // Si está procesando (pensando)
    uPulseSpeed: 3.0,                               // Velocidad del pulso
    uScanSpeed: 2.0,                                // Velocidad del escaneo horizontal
    uGlitchIntensity: 0.1,                          // Intensidad del glitch
  },
  
  // ============================================
  // VERTEX SHADER (Geometría)
  // ============================================
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  
  // ============================================
  // FRAGMENT SHADER (El Ojo Rojo Animado)
  // ============================================
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uSecondaryColor;
    uniform float uIntensity;
    uniform float uOpen;
    uniform float uSpeech;
    uniform float uProcessing;
    uniform float uPulseSpeed;
    uniform float uScanSpeed;
    uniform float uGlitchIntensity;
    
    varying vec2 vUv;
    varying vec3 vPosition;

    // ============================================
    // FUNCIONES DE RUIDO Y UTILIDADES
    // ============================================
    
    // Ruido pseudo-aleatorio
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    // Ruido suave 2D
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    // Función de pulso suave
    float pulse(float x, float center, float width) {
      return smoothstep(center - width, center, x) * smoothstep(center + width, center, x);
    }

    // ============================================
    // MAIN - RENDERIZADO DEL OJO
    // ============================================
    
    void main() {
      vec2 uv = vUv;
      
      // ===== 1. FORMA BASE DEL OJO (Línea Horizontal Rasgada) =====
      
      // Ancho de la línea (se ensancha al hablar)
      float beamWidth = 0.08 + (uSpeech * 0.15);
      
      // Crear la forma de línea horizontal con bordes suaves
      float distFromCenter = abs(uv.y - 0.5);
      float beam = 1.0 - smoothstep(beamWidth * 0.5, beamWidth * 0.5 + 0.03, distFromCenter);
      
      // Máscara de ancho (rasgado - más angosto en los extremos)
      float widthFalloff = 1.0 - smoothstep(0.3, 0.5, abs(uv.x - 0.5));
      
      // Forma final del ojo con efecto rasgado
      float eyeShape = beam * widthFalloff * widthFalloff; // Squared for sharper edges
      
      
      // ===== 2. EFECTO DE ESCANEO (Cylon) =====
      
      // Onda de escaneo que viaja de izquierda a derecha
      float scanPos = fract(uTime * uScanSpeed * 0.3);
      float scanWave = pulse(uv.x, scanPos, 0.15);
      
      // Segunda onda en dirección opuesta
      float scanPos2 = 1.0 - fract(uTime * uScanSpeed * 0.2 + 0.5);
      float scanWave2 = pulse(uv.x, scanPos2, 0.1);
      
      float scanning = max(scanWave, scanWave2 * 0.5);
      
      
      // ===== 3. PULSOS DE ENERGÍA =====
      
      // Pulso central que late como un corazón
      float heartbeat = sin(uTime * uPulseSpeed) * 0.5 + 0.5;
      float energyPulse = heartbeat * (1.0 + uSpeech * 2.0);
      
      // Ondas concéntricas de energía
      float concentricWave = sin(length(uv - 0.5) * 20.0 - uTime * 4.0) * 0.5 + 0.5;
      
      
      // ===== 4. GLITCH DIGITAL =====
      
      // Glitch aleatorio
      float glitchNoise = random(vec2(floor(uTime * 20.0), 0.0));
      float glitchTrigger = step(1.0 - uGlitchIntensity * (1.0 + uProcessing * 3.0), glitchNoise);
      
      // Distorsión horizontal del glitch
      float glitchOffset = (random(vec2(uv.y * 10.0, uTime)) - 0.5) * glitchTrigger * 0.1;
      vec2 glitchedUv = uv + vec2(glitchOffset, 0.0);
      
      // Recalcular beam con UV glitcheado
      float glitchedBeam = 1.0 - smoothstep(beamWidth * 0.5, beamWidth * 0.5 + 0.03, abs(glitchedUv.y - 0.5));
      
      
      // ===== 5. EFECTO DE PARPADEO =====
      
      // Parpadeo suave controlado por uOpen
      float blinkMask = smoothstep(0.0, 0.3, uOpen);
      
      // Parpadeo automático ocasional
      float autoBlink = step(0.98, random(vec2(floor(uTime * 0.5), 0.0)));
      float blinkAnim = 1.0 - autoBlink * sin(fract(uTime * 8.0) * 3.14159);
      
      float finalBlink = blinkMask * blinkAnim;
      
      
      // ===== 6. COLOR DINÁMICO =====
      
      // Color base con variación según procesamiento
      vec3 baseColor = mix(uColor, vec3(2.0, 1.5, 0.0), uProcessing * 0.8);
      
      // Degradado de intensidad desde el centro
      float centerGlow = 1.0 - length(uv - vec2(0.5, 0.5)) * 1.5;
      centerGlow = max(0.0, centerGlow);
      
      // Mezclar con color secundario en los bordes
      vec3 finalColor = mix(uSecondaryColor, baseColor, centerGlow);
      
      // Añadir brillo del escaneo
      finalColor += baseColor * scanning * 0.5;
      
      // Añadir pulso de energía
      finalColor *= (1.0 + energyPulse * 0.3);
      
      // Boost de intensidad
      finalColor *= uIntensity;
      
      
      // ===== 7. COMPOSICIÓN FINAL =====
      
      // Combinar todas las máscaras
      float alpha = eyeShape * finalBlink;
      alpha = mix(alpha, glitchedBeam * widthFalloff, glitchTrigger * 0.5);
      
      // Añadir halo exterior sutil
      float halo = (1.0 - smoothstep(0.0, 0.5, distFromCenter)) * widthFalloff * 0.2;
      alpha = max(alpha, halo * finalBlink);
      
      // Clamp para evitar valores negativos
      alpha = clamp(alpha, 0.0, 1.0);
      
      
      // ===== 8. OUTPUT =====
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
)

// Extender Three.js con el material
extend({ ZeroEyeMaterial })

// Declarar el tipo para TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      zeroEyeMaterial: JSX.IntrinsicElements['shaderMaterial'] & {
        uTime?: number
        uColor?: THREE.Color
        uSecondaryColor?: THREE.Color
        uIntensity?: number
        uOpen?: number
        uSpeech?: number
        uProcessing?: number
        uPulseSpeed?: number
        uScanSpeed?: number
        uGlitchIntensity?: number
      }
    }
  }
}

export { ZeroEyeMaterial }
export default ZeroEyeMaterial
