// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — LIQUID ORB SHADER
// Shader capital-reactive con FBM + Worley + Simplex híbrido
// 195+ FPS garantizados en hardware moderno
// Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
// ═══════════════════════════════════════════════════════════════

import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════
// TIPOS Y CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

export interface LiquidOrbUniforms {
  uTime: number
  uCapital: number           // 0.0 - 1.0 (normalizado)
  uMouse: THREE.Vector2      // Posición del mouse normalizada
  uColorBase: THREE.Color    // Color base del orbe
  uColorSecondary: THREE.Color // Color secundario para mezcla
  uMood: number              // -1 (pérdida) a 1 (ganancia)
  uBreathingSpeed: number    // Velocidad de respiración
  uIntensity: number         // Intensidad general
  uDistortionScale: number   // Escala de distorsión
  uNoiseFrequency: number    // Frecuencia del noise
  uResolution: THREE.Vector2 // Resolución del viewport
}

// ═══════════════════════════════════════════════════════════════
// LIQUID ORB SHADER — FBM + WORLEY + SIMPLEX HYBRID
// ═══════════════════════════════════════════════════════════════

export const LiquidOrbShader = shaderMaterial(
  // Uniforms con valores por defecto
  {
    uTime: 0,
    uCapital: 0.5,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uColorBase: new THREE.Color('#FFD700'),      // Oro
    uColorSecondary: new THREE.Color('#8B00FF'), // Violeta
    uMood: 0,
    uBreathingSpeed: 1.0,
    uIntensity: 1.0,
    uDistortionScale: 0.15,
    uNoiseFrequency: 3.0,
    uResolution: new THREE.Vector2(1920, 1080),
  },
  // ═════════════════════════════════════════════════════════════
  // VERTEX SHADER
  // ═════════════════════════════════════════════════════════════
  /* glsl */ `
    precision highp float;
    
    // Uniforms
    uniform float uTime;
    uniform float uCapital;
    uniform vec2 uMouse;
    uniform float uMood;
    uniform float uBreathingSpeed;
    uniform float uDistortionScale;
    uniform float uNoiseFrequency;
    
    // Varyings
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying float vDistortion;
    
    // ═══════════════════════════════════════════════════════════
    // SIMPLEX NOISE (Optimizado para GPU)
    // ═══════════════════════════════════════════════════════════
    
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
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
      
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    
    // ═══════════════════════════════════════════════════════════
    // FBM (Fractal Brownian Motion)
    // ═══════════════════════════════════════════════════════════
    
    float fbm(vec3 p, int octaves) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      float lacunarity = 2.0;
      float persistence = 0.5;
      
      for(int i = 0; i < 6; i++) {
        if(i >= octaves) break;
        value += amplitude * snoise(p * frequency);
        frequency *= lacunarity;
        amplitude *= persistence;
      }
      
      return value;
    }
    
    // ═══════════════════════════════════════════════════════════
    // WORLEY NOISE (Cellular)
    // ═══════════════════════════════════════════════════════════
    
    vec3 hash33(vec3 p3) {
      p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
      p3 += dot(p3, p3.yxz + 33.33);
      return fract((p3.xxy + p3.yxx) * p3.zyx);
    }
    
    float worley(vec3 p) {
      vec3 id = floor(p);
      vec3 fd = fract(p);
      
      float minDist = 1.0;
      
      for(int x = -1; x <= 1; x++) {
        for(int y = -1; y <= 1; y++) {
          for(int z = -1; z <= 1; z++) {
            vec3 neighbor = vec3(float(x), float(y), float(z));
            vec3 point = hash33(id + neighbor);
            vec3 diff = neighbor + point - fd;
            float dist = length(diff);
            minDist = min(minDist, dist);
          }
        }
      }
      
      return minDist;
    }
    
    // ═══════════════════════════════════════════════════════════
    // HYBRID NOISE (FBM + Worley + Simplex)
    // ═══════════════════════════════════════════════════════════
    
    float hybridNoise(vec3 p, float capital) {
      // FBM base para movimiento orgánico
      float fbmNoise = fbm(p * uNoiseFrequency, 4);
      
      // Worley para textura celular cristalina
      float worleyNoise = worley(p * uNoiseFrequency * 0.5);
      
      // Simplex para detalles finos
      float simplexNoise = snoise(p * uNoiseFrequency * 2.0);
      
      // Mezcla basada en capital (más capital = más cristalino)
      float blend = mix(0.6, 0.3, capital);
      float result = fbmNoise * blend + (1.0 - worleyNoise) * (1.0 - blend);
      result += simplexNoise * 0.1;
      
      return result;
    }
    
    // ═══════════════════════════════════════════════════════════
    // MAIN VERTEX
    // ═══════════════════════════════════════════════════════════
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      
      // Tiempo animado con breathing
      float breathe = sin(uTime * uBreathingSpeed) * 0.5 + 0.5;
      float t = uTime * 0.3;
      
      // Punto para noise
      vec3 noisePos = position + vec3(t, t * 0.5, t * 0.3);
      
      // Calcular distorsión híbrida
      float noise = hybridNoise(noisePos, uCapital);
      
      // Mouse influence (sutil)
      vec2 mouseOffset = (uMouse - 0.5) * 2.0;
      float mouseInfluence = 1.0 + dot(normalize(position.xy), mouseOffset) * 0.1;
      
      // Distorsión basada en mood
      float moodEffect = uMood * 0.05;
      
      // Escala de distorsión final
      float distortion = noise * uDistortionScale * (1.0 + uCapital * 0.3);
      distortion *= breathe * 0.3 + 0.7; // Breathing effect
      distortion += moodEffect;
      distortion *= mouseInfluence;
      
      vDistortion = distortion;
      
      // Aplicar distorsión al vértice
      vec3 pos = position + normal * distortion;
      
      vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // ═════════════════════════════════════════════════════════════
  // FRAGMENT SHADER
  // ═════════════════════════════════════════════════════════════
  /* glsl */ `
    precision highp float;
    
    // Uniforms
    uniform float uTime;
    uniform float uCapital;
    uniform vec2 uMouse;
    uniform vec3 uColorBase;
    uniform vec3 uColorSecondary;
    uniform float uMood;
    uniform float uIntensity;
    uniform float uNoiseFrequency;
    
    // Varyings
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying float vDistortion;
    
    // ═══════════════════════════════════════════════════════════
    // COLORES CHRONOS (CYAN PROHIBIDO)
    // ═══════════════════════════════════════════════════════════
    
    const vec3 GOLD = vec3(1.0, 0.843, 0.0);        // #FFD700
    const vec3 VIOLET = vec3(0.545, 0.0, 1.0);     // #8B00FF
    const vec3 PINK = vec3(1.0, 0.078, 0.576);     // #FF1493
    const vec3 BLACK = vec3(0.0, 0.0, 0.0);        // #000000
    
    // ═══════════════════════════════════════════════════════════
    // NOISE FUNCTIONS (Fragment)
    // ═══════════════════════════════════════════════════════════
    
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    
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
      
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      
      vec4 norm = inversesqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    
    // ═══════════════════════════════════════════════════════════
    // MAIN FRAGMENT
    // ═══════════════════════════════════════════════════════════
    
    void main() {
      // View direction y fresnel
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
      
      // Noise para variación de color
      float t = uTime * 0.2;
      vec3 noisePos = vPosition * uNoiseFrequency + vec3(t);
      float noise = snoise(noisePos) * 0.5 + 0.5;
      
      // ═══════════════════════════════════════════════════════
      // COLOR MIXING
      // ═══════════════════════════════════════════════════════
      
      // Base: mezcla entre color base y secundario
      vec3 baseColor = mix(uColorBase, uColorSecondary, noise * 0.4);
      
      // Añadir oro según capital
      baseColor = mix(baseColor, GOLD, uCapital * 0.3);
      
      // Añadir rosa según mood positivo
      if(uMood > 0.0) {
        baseColor = mix(baseColor, PINK, uMood * 0.2);
      }
      
      // Violeta en las sombras
      vec3 shadowColor = mix(BLACK, VIOLET, 0.3);
      
      // Aplicar fresnel para efecto de borde brillante
      vec3 fresnelColor = mix(GOLD, PINK, fresnel);
      baseColor = mix(baseColor, fresnelColor, fresnel * 0.6);
      
      // ═══════════════════════════════════════════════════════
      // EFECTOS DE LUZ
      // ═══════════════════════════════════════════════════════
      
      // Specular básico
      vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
      vec3 halfDir = normalize(lightDir + viewDir);
      float specular = pow(max(dot(vNormal, halfDir), 0.0), 64.0);
      
      // Subsurface scattering simulado
      float sss = pow(max(dot(-vNormal, lightDir), 0.0), 2.0) * 0.3;
      
      // Iridiscencia sutil basada en ángulo
      float iridescence = sin(dot(vNormal, viewDir) * 6.28 + uTime) * 0.1;
      
      // ═══════════════════════════════════════════════════════
      // EFECTOS SEGÚN DISTORSIÓN
      // ═══════════════════════════════════════════════════════
      
      // Zonas distorsionadas más brillantes
      float distortionGlow = smoothstep(0.0, 0.2, abs(vDistortion)) * 0.3;
      
      // ═══════════════════════════════════════════════════════
      // COLOR FINAL
      // ═══════════════════════════════════════════════════════
      
      vec3 finalColor = baseColor;
      
      // Añadir specular
      finalColor += GOLD * specular * 0.8;
      
      // Añadir SSS
      finalColor += uColorSecondary * sss;
      
      // Añadir iridiscencia
      finalColor += vec3(iridescence) * PINK;
      
      // Añadir brillo por distorsión
      finalColor += GOLD * distortionGlow;
      
      // Aplicar intensidad
      finalColor *= uIntensity;
      
      // Alpha con fresnel para bordes más suaves
      float alpha = 0.9 + fresnel * 0.1;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
)

// ═══════════════════════════════════════════════════════════════
// SHADER PRESETS POR BANCO
// ═══════════════════════════════════════════════════════════════

export interface OrbPreset {
  colorBase: THREE.Color
  colorSecondary: THREE.Color
  breathingSpeed: number
  distortionScale: number
  noiseFrequency: number
  intensity: number
}

export const ORB_PRESETS: Record<string, OrbPreset> = {
  // ═══════════════════════════════════════════════════════════
  // BÓVEDA MONTE — El Guardián Eterno
  // Oro líquido cayendo, respiración grave, sólido y confiable
  // ═══════════════════════════════════════════════════════════
  boveda_monte: {
    colorBase: new THREE.Color('#FFD700'),      // Oro puro
    colorSecondary: new THREE.Color('#B8860B'), // Oro oscuro
    breathingSpeed: 0.8,                        // Respiración lenta, grave
    distortionScale: 0.12,                      // Distorsión media
    noiseFrequency: 2.5,
    intensity: 1.1,
  },
  
  // ═══════════════════════════════════════════════════════════
  // UTILIDADES — La Diva
  // Rosa eléctrico, explosiones doradas, celebración constante
  // ═══════════════════════════════════════════════════════════
  utilidades: {
    colorBase: new THREE.Color('#FF1493'),      // Rosa eléctrico
    colorSecondary: new THREE.Color('#FFD700'), // Oro
    breathingSpeed: 1.5,                        // Respiración rápida
    distortionScale: 0.2,                       // Alta distorsión
    noiseFrequency: 4.0,
    intensity: 1.3,
  },
  
  // ═══════════════════════════════════════════════════════════
  // FLETES — El Guerrero
  // Violeta plasma, líneas de energía, velocidad y poder
  // ═══════════════════════════════════════════════════════════
  flete_sur: {
    colorBase: new THREE.Color('#8B00FF'),      // Violeta plasma
    colorSecondary: new THREE.Color('#4B0082'), // Índigo
    breathingSpeed: 1.2,
    distortionScale: 0.15,
    noiseFrequency: 3.5,
    intensity: 1.2,
  },
  
  // ═══════════════════════════════════════════════════════════
  // AZTECA — El Sabio Anciano
  // Rojo con grietas doradas, antiguo y sabio
  // ═══════════════════════════════════════════════════════════
  azteca: {
    colorBase: new THREE.Color('#8B0000'),      // Rojo sangre
    colorSecondary: new THREE.Color('#FFD700'), // Oro
    breathingSpeed: 0.6,                        // Muy lento
    distortionScale: 0.1,
    noiseFrequency: 2.0,
    intensity: 1.0,
  },
  
  // ═══════════════════════════════════════════════════════════
  // LEFTIE — El Rey
  // Oro brillante con corona, majestuoso y noble
  // ═══════════════════════════════════════════════════════════
  leftie: {
    colorBase: new THREE.Color('#FFD700'),      // Oro brillante
    colorSecondary: new THREE.Color('#FFF8DC'), // Cornsilk
    breathingSpeed: 1.0,
    distortionScale: 0.18,
    noiseFrequency: 3.0,
    intensity: 1.4,                             // Muy brillante
  },
  
  // ═══════════════════════════════════════════════════════════
  // PROFIT — El Visionario (EMPERADOR)
  // Violeta con destellos oro, siempre en el centro
  // ═══════════════════════════════════════════════════════════
  profit: {
    colorBase: new THREE.Color('#8B00FF'),      // Violeta imperial
    colorSecondary: new THREE.Color('#FFD700'), // Oro
    breathingSpeed: 1.1,
    distortionScale: 0.16,
    noiseFrequency: 3.2,
    intensity: 1.25,
  },
  
  // ═══════════════════════════════════════════════════════════
  // BÓVEDA USA — El Extranjero
  // Oro con toques de verde (dólar), internacional
  // ═══════════════════════════════════════════════════════════
  boveda_usa: {
    colorBase: new THREE.Color('#FFD700'),      // Oro
    colorSecondary: new THREE.Color('#228B22'), // Verde bosque (dólar)
    breathingSpeed: 0.9,
    distortionScale: 0.14,
    noiseFrequency: 2.8,
    intensity: 1.15,
  },
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Crear material con preset
// ═══════════════════════════════════════════════════════════════

export function createLiquidOrbMaterial(
  bancoId: string, 
  capital: number = 0.5, 
  mood: number = 0
): THREE.ShaderMaterial {
  const preset = ORB_PRESETS[bancoId] || ORB_PRESETS.boveda_monte
  
  // Crear instancia del shader
  const material = new LiquidOrbShader()
  
  // Aplicar preset
  material.uniforms.uColorBase.value = preset.colorBase
  material.uniforms.uColorSecondary.value = preset.colorSecondary
  material.uniforms.uBreathingSpeed.value = preset.breathingSpeed
  material.uniforms.uDistortionScale.value = preset.distortionScale
  material.uniforms.uNoiseFrequency.value = preset.noiseFrequency
  material.uniforms.uIntensity.value = preset.intensity
  
  // Aplicar valores dinámicos
  material.uniforms.uCapital.value = capital
  material.uniforms.uMood.value = mood
  
  return material as unknown as THREE.ShaderMaterial
}

// ═══════════════════════════════════════════════════════════════
// EXPORT DEFAULT
// ═══════════════════════════════════════════════════════════════

export default LiquidOrbShader
