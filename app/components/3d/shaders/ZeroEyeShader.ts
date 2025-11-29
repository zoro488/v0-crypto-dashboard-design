/**
 * ZeroEyeShader - Shader Procedural para los Ojos de Zero
 * 
 * Crea ojos rojos rasgados horizontales que brillan y reaccionan:
 * - Línea horizontal con glow intenso
 * - Efecto de escaneo Cylon
 * - Reacción a voz (se ensancha al hablar)
 * - Parpadeos y glitches aleatorios
 * - Cambio de color según estado
 */

import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

/**
 * Material del Ojo de Zero con GLSL personalizado
 */
const ZeroEyeMaterial = shaderMaterial(
  // Uniforms (variables controlables desde React)
  {
    uTime: 0,
    uColor: new THREE.Color(2.0, 0.0, 0.0), // Rojo HDR intenso
    uSecondaryColor: new THREE.Color(0.5, 0.0, 0.0), // Rojo secundario
    uIntensity: 2.0, // Intensidad del brillo
    uOpen: 1.0, // 1 = Ojo abierto, 0 = Cerrado (parpadeo)
    uSpeech: 0.0, // Amplitud de voz (0 a 1)
    uScanSpeed: 3.0, // Velocidad del escaneo
    uPulseSpeed: 2.0, // Velocidad del pulso
    uGlitchIntensity: 0.0, // Intensidad del glitch (0-1)
    uAngry: 0.0, // Modo combate (0-1)
  },
  // Vertex Shader (Geometría)
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader (El Ojo Rojo Rasgado)
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uSecondaryColor;
    uniform float uIntensity;
    uniform float uOpen;
    uniform float uSpeech;
    uniform float uScanSpeed;
    uniform float uPulseSpeed;
    uniform float uGlitchIntensity;
    uniform float uAngry;
    
    varying vec2 vUv;
    varying vec3 vPosition;

    // =============================================
    // FUNCIONES DE RUIDO
    // =============================================
    
    // Ruido simple para glitch
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    // Ruido suavizado
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
    
    // Hash para variación
    float hash(float n) {
      return fract(sin(n) * 43758.5453);
    }

    // =============================================
    // SHADER PRINCIPAL
    // =============================================
    
    void main() {
      vec2 uv = vUv;
      
      // 1. FORMA DEL OJO RASGADO HORIZONTAL
      // =====================================
      // Centro del ojo
      vec2 center = vec2(0.5, 0.5);
      
      // Ancho base de la línea (se ensancha al hablar)
      float beamHeight = 0.04 + (uSpeech * 0.08) + (uAngry * 0.03);
      
      // Crear la forma de línea horizontal rasgada
      // Los extremos son más delgados (forma de ojo)
      float xDist = abs(uv.x - center.x);
      float eyeTaper = 1.0 - smoothstep(0.2, 0.45, xDist); // Se adelgaza en los bordes
      float adjustedHeight = beamHeight * eyeTaper;
      
      // Distancia vertical al centro
      float yDist = abs(uv.y - center.y);
      
      // Crear el beam con bordes suaves
      float beam = 1.0 - smoothstep(adjustedHeight * 0.5, adjustedHeight * 0.5 + 0.02, yDist);
      
      // 2. MÁSCARA HORIZONTAL (Solo el centro)
      // =====================================
      // Cortar los extremos para que no cubra toda la geometría
      float widthMask = 1.0 - smoothstep(0.35, 0.48, xDist);
      
      // 3. EFECTO DE ESCANEO (Cylon Style)
      // =====================================
      float scanPos = sin(uTime * uScanSpeed) * 0.3;
      float scanLine = 1.0 - smoothstep(0.02, 0.08, abs(uv.x - center.x - scanPos));
      float scanIntensity = 0.4 + uAngry * 0.4;
      
      // 4. EFECTO DE PULSO
      // =====================================
      float pulse = 0.8 + 0.2 * sin(uTime * uPulseSpeed);
      float angryPulse = 1.0 + uAngry * 0.5 * sin(uTime * 8.0);
      
      // 5. GLITCH DIGITAL
      // =====================================
      float glitchThreshold = 0.97 - uGlitchIntensity * 0.2;
      float glitch = random(vec2(floor(uTime * 10.0), 0.0)) > glitchThreshold ? 0.0 : 1.0;
      
      // Glitch de desplazamiento
      float glitchOffset = 0.0;
      if (random(vec2(floor(uTime * 20.0), 1.0)) > 0.95) {
        glitchOffset = (random(vec2(uTime, 2.0)) - 0.5) * 0.1 * uGlitchIntensity;
      }
      
      // Aplicar desplazamiento de glitch
      vec2 glitchedUv = uv + vec2(glitchOffset, 0.0);
      
      // 6. NÚCLEO BRILLANTE
      // =====================================
      // El centro brilla más intenso
      float coreDist = length(vec2((uv.x - center.x) * 2.0, (uv.y - center.y) * 4.0));
      float core = 1.0 - smoothstep(0.0, 0.3, coreDist);
      float coreGlow = core * 1.5;
      
      // 7. HALO EXTERIOR (BLOOM SIMULADO)
      // =====================================
      float haloDist = length(vec2((uv.x - center.x) * 1.5, (uv.y - center.y) * 3.0));
      float halo = exp(-haloDist * 3.0) * 0.5;
      
      // 8. PARPADEO
      // =====================================
      float blink = uOpen;
      // Parpadeo aleatorio ocasional
      if (random(vec2(floor(uTime * 0.5), 0.0)) > 0.98) {
        blink *= smoothstep(0.0, 0.1, fract(uTime * 2.0)) * 
                 (1.0 - smoothstep(0.1, 0.2, fract(uTime * 2.0)));
      }
      
      // 9. COMPOSICIÓN FINAL
      // =====================================
      // Color base
      vec3 finalColor = uColor;
      
      // Añadir color secundario en el escaneo
      finalColor = mix(finalColor, uSecondaryColor * 2.0, scanLine * scanIntensity);
      
      // Intensidad del ojo
      float eyeIntensity = beam * widthMask;
      
      // Añadir el scan line brillante
      eyeIntensity += scanLine * 0.3 * widthMask;
      
      // Añadir el núcleo
      eyeIntensity += coreGlow * beam;
      
      // Añadir halo exterior
      eyeIntensity += halo * 0.3;
      
      // Aplicar pulso, speech y angry
      float intensityMultiplier = uIntensity * pulse * angryPulse;
      intensityMultiplier *= (1.0 + uSpeech * 1.5); // Brilla más al hablar
      
      finalColor *= intensityMultiplier;
      
      // Calcular alpha
      float alpha = eyeIntensity * blink * glitch;
      
      // Añadir un poco de ruido de alta frecuencia para textura
      float textureNoise = noise(uv * 100.0 + uTime * 2.0) * 0.1;
      alpha += textureNoise * beam * 0.2;
      
      // Clamp para evitar valores negativos
      alpha = clamp(alpha, 0.0, 1.0);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

// Registrar el material en React Three Fiber
extend({ ZeroEyeMaterial });

// Exportar para uso en componentes
export { ZeroEyeMaterial };

// Declaración de tipos para TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      zeroEyeMaterial: {
        ref?: React.Ref<THREE.ShaderMaterial>;
        uTime?: number;
        uColor?: THREE.Color;
        uSecondaryColor?: THREE.Color;
        uIntensity?: number;
        uOpen?: number;
        uSpeech?: number;
        uScanSpeed?: number;
        uPulseSpeed?: number;
        uGlitchIntensity?: number;
        uAngry?: number;
        transparent?: boolean;
        depthWrite?: boolean;
        blending?: THREE.Blending;
        side?: THREE.Side;
      };
    }
  }
}
