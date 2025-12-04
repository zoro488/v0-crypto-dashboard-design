/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🌌 CHRONOS INFINITY 2026 - SISTEMA DE SHADERS ULTRA-PREMIUM
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Shaders GLSL de máximo rendimiento para efectos visuales cinematográficos
 * Basado en física real: Navier-Stokes, Curl Noise, SDF, Ray Marching
 * 
 * PALETA OFICIAL (CYAN PROHIBIDO):
 * - Negro: #000000
 * - Violeta Real: #8B00FF (0.545, 0.0, 1.0)
 * - Oro Líquido: #FFD700 (1.0, 0.843, 0.0)
 * - Rosa Eléctrico: #FF1493 (1.0, 0.078, 0.576)
 * - Blanco Puro: #FFFFFF
 * 
 * Nivel: Superior a Apple Vision Pro + Linear 2025
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

// ════════════════════════════════════════════════════════════════════════════════════════
// COLORES CHRONOS INFINITY (en formato normalizado RGB)
// ════════════════════════════════════════════════════════════════════════════════════════
export const INFINITY_COLORS = {
  violetReal: 'vec3(0.545, 0.0, 1.0)',      // #8B00FF
  goldLiquid: 'vec3(1.0, 0.843, 0.0)',       // #FFD700
  pinkElectric: 'vec3(1.0, 0.078, 0.576)',   // #FF1493
  voidBlack: 'vec3(0.0, 0.0, 0.0)',          // #000000
  purePlatinum: 'vec3(1.0, 1.0, 1.0)',       // #FFFFFF
  silverMist: 'vec3(0.9, 0.9, 0.9)',         // #E5E5E5
  deepVoid: 'vec3(0.02, 0.01, 0.05)',        // Deep background
} as const

// ════════════════════════════════════════════════════════════════════════════════════════
// VERTEX SHADER - LIQUID MAGNETIC ORB
// Orbe con distorsión líquida magnética que reacciona al mouse
// ════════════════════════════════════════════════════════════════════════════════════════
export const liquidMagneticOrbVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec2 uMouse;
  uniform float uAudioLevel;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDistortion;

  // ═══════════════════════════════════════════════════════════════════════
  // SIMPLEX NOISE 3D - Más suave que Perlin
  // ═══════════════════════════════════════════════════════════════════════
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
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
    
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec3 pos = position;
    float time = uTime * 0.5;
    
    // ═══════════════════════════════════════════════════════════════════
    // DISTORSIÓN MULTI-OCTAVA (FBM - Fractal Brownian Motion)
    // ═══════════════════════════════════════════════════════════════════
    float noise1 = snoise(pos * 2.0 + time);
    float noise2 = snoise(pos * 4.0 - time * 0.7) * 0.5;
    float noise3 = snoise(pos * 8.0 + time * 0.5) * 0.25;
    float distortion = (noise1 + noise2 + noise3) * uIntensity * 0.3;
    
    // ═══════════════════════════════════════════════════════════════════
    // REACTIVIDAD AL AUDIO (pulso rítmico)
    // ═══════════════════════════════════════════════════════════════════
    float audioPulse = uAudioLevel * 0.5;
    distortion += audioPulse * sin(time * 8.0 + length(pos) * 3.0) * 0.2;
    
    // ═══════════════════════════════════════════════════════════════════
    // ATRACCIÓN MAGNÉTICA AL MOUSE (simula campo magnético)
    // ═══════════════════════════════════════════════════════════════════
    vec3 mousePos = vec3(uMouse.x * 2.0, uMouse.y * 2.0, 1.0);
    float mouseInfluence = 1.0 - smoothstep(0.0, 2.5, length(pos.xy - mousePos.xy));
    distortion += mouseInfluence * 0.15 * sin(time * 4.0);
    
    // Aplicar distorsión a lo largo de la normal
    pos += normal * distortion;
    
    // ═══════════════════════════════════════════════════════════════════
    // RESPIRACIÓN CÓSMICA (expansión/contracción suave)
    // ═══════════════════════════════════════════════════════════════════
    float breathe = sin(time * 1.5) * 0.03 + sin(time * 2.3) * 0.02;
    pos *= 1.0 + breathe + uAudioLevel * 0.1;
    
    vPosition = pos;
    vDistortion = distortion;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

// ════════════════════════════════════════════════════════════════════════════════════════
// FRAGMENT SHADER - LIQUID MAGNETIC ORB
// Material iridiscente con reflejos volumétricos
// ════════════════════════════════════════════════════════════════════════════════════════
export const liquidMagneticOrbFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec2 uMouse;
  uniform float uAudioLevel;
  uniform vec3 uColorPrimary;    // Violeta: vec3(0.545, 0.0, 1.0)
  uniform vec3 uColorSecondary;  // Oro: vec3(1.0, 0.843, 0.0)
  uniform vec3 uColorAccent;     // Rosa: vec3(1.0, 0.078, 0.576)
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDistortion;

  // ═══════════════════════════════════════════════════════════════════════
  // FRESNEL - Efecto de borde brillante realista
  // ═══════════════════════════════════════════════════════════════════════
  float fresnel(vec3 viewDir, vec3 normal, float power) {
    return pow(1.0 - max(dot(viewDir, normal), 0.0), power);
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float time = uTime * 0.8;
    
    // ═══════════════════════════════════════════════════════════════════
    // GRADIENTE IRIDISCENTE DINÁMICO
    // ═══════════════════════════════════════════════════════════════════
    float gradientPhase = sin(vUv.y * 6.28 + time) * 0.5 + 0.5;
    float gradientPhase2 = cos(vUv.x * 6.28 - time * 0.7) * 0.5 + 0.5;
    
    vec3 color1 = mix(uColorPrimary, uColorSecondary, gradientPhase);
    vec3 color2 = mix(uColorSecondary, uColorAccent, gradientPhase2);
    vec3 baseColor = mix(color1, color2, vDistortion * 2.0 + 0.5);
    
    // ═══════════════════════════════════════════════════════════════════
    // FRESNEL EDGE GLOW (bordes brillantes)
    // ═══════════════════════════════════════════════════════════════════
    float fresnelFactor = fresnel(viewDir, vNormal, 3.0);
    vec3 fresnelColor = mix(uColorSecondary, uColorPrimary, fresnelFactor);
    
    // ═══════════════════════════════════════════════════════════════════
    // SUBSURFACE SCATTERING SIMULADO (luz interna)
    // ═══════════════════════════════════════════════════════════════════
    float sss = (1.0 - abs(dot(viewDir, vNormal))) * 0.6;
    vec3 sssColor = uColorAccent * sss * uIntensity;
    
    // ═══════════════════════════════════════════════════════════════════
    // PULSO DE AUDIO (reactividad visual al sonido)
    // ═══════════════════════════════════════════════════════════════════
    float audioPulse = uAudioLevel * (0.5 + 0.5 * sin(time * 10.0));
    vec3 pulseColor = uColorSecondary * audioPulse * 2.0;
    
    // ═══════════════════════════════════════════════════════════════════
    // COMPOSICIÓN FINAL
    // ═══════════════════════════════════════════════════════════════════
    vec3 finalColor = baseColor;
    finalColor += fresnelColor * fresnelFactor * 1.5;
    finalColor += sssColor;
    finalColor += pulseColor;
    
    // Brillo extra en zonas de alta distorsión
    finalColor += vec3(1.0) * abs(vDistortion) * uIntensity * 0.5;
    
    // Alpha con suavizado de bordes
    float alpha = 0.85 + fresnelFactor * 0.15;
    
    gl_FragColor = vec4(finalColor, alpha);
    
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

// ════════════════════════════════════════════════════════════════════════════════════════
// VERTEX SHADER - COSMIC FLUID BACKGROUND
// Fondo de fluido cósmico con física Navier-Stokes simplificada
// ════════════════════════════════════════════════════════════════════════════════════════
export const cosmicFluidVertexShader = /* glsl */ `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// ════════════════════════════════════════════════════════════════════════════════════════
// FRAGMENT SHADER - COSMIC FLUID BACKGROUND
// Fluido con warping multi-capa y FBM
// ════════════════════════════════════════════════════════════════════════════════════════
export const cosmicFluidFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uEnergy;
  
  varying vec2 vUv;

  // ═══════════════════════════════════════════════════════════════════════
  // HASH & NOISE FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f); // smoothstep
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FRACTAL BROWNIAN MOTION - 6 octavas para máximo detalle
  // ═══════════════════════════════════════════════════════════════════════
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DOMAIN WARPING - Múltiples capas de distorsión
  // ═══════════════════════════════════════════════════════════════════════
  vec2 warp(vec2 p, float t) {
    float n1 = fbm(p + vec2(t * 0.1, 0.0));
    float n2 = fbm(p + vec2(0.0, t * 0.1) + 3.14);
    return p + vec2(n1, n2) * 0.6;
  }

  void main() {
    vec2 uv = vUv;
    float time = uTime * 0.25;
    float aspect = uResolution.x / uResolution.y;
    
    vec2 p = uv * vec2(aspect, 1.0) * 3.0;
    
    // ═══════════════════════════════════════════════════════════════════
    // TRIPLE DOMAIN WARPING (fluido ultra-orgánico)
    // ═══════════════════════════════════════════════════════════════════
    p = warp(p, time);
    p = warp(p, time * 0.7 + 1.0);
    p = warp(p, time * 0.5 + 2.0);
    
    // ═══════════════════════════════════════════════════════════════════
    // INTERACCIÓN CON MOUSE (ondas centrífugas)
    // ═══════════════════════════════════════════════════════════════════
    vec2 mousePos = uMouse * vec2(aspect, 1.0);
    float mouseDist = length(uv * vec2(aspect, 1.0) - mousePos);
    float mouseWave = sin(mouseDist * 10.0 - time * 4.0) * exp(-mouseDist * 2.0) * 0.3;
    
    // ═══════════════════════════════════════════════════════════════════
    // CAPAS DE NIEBLA VOLUMÉTRICA
    // ═══════════════════════════════════════════════════════════════════
    float n1 = fbm(p + time * 0.2);
    float n2 = fbm(p * 2.0 - time * 0.15);
    float n3 = fbm(p * 0.5 + time * 0.1);
    
    float density = (n1 + n2 * 0.5 + n3 * 0.25) / 1.75;
    density += mouseWave;
    
    // ═══════════════════════════════════════════════════════════════════
    // PALETA CHRONOS INFINITY (VIOLETA + ORO + ROSA)
    // ═══════════════════════════════════════════════════════════════════
    vec3 colorVoid = vec3(0.02, 0.01, 0.05);      // Negro profundo
    vec3 colorViolet = vec3(0.545, 0.0, 1.0);     // #8B00FF
    vec3 colorGold = vec3(1.0, 0.843, 0.0);       // #FFD700
    vec3 colorPink = vec3(1.0, 0.078, 0.576);     // #FF1493
    
    // Mezcla basada en densidad y posición
    vec3 color = colorVoid;
    color = mix(color, colorViolet * 0.4, smoothstep(0.2, 0.5, density));
    color = mix(color, colorGold * 0.3, smoothstep(0.4, 0.7, n2));
    color = mix(color, colorPink * 0.35, smoothstep(0.5, 0.8, n1 * n2));
    
    // ═══════════════════════════════════════════════════════════════════
    // ENERGÍA REACTIVA (pulso del sistema)
    // ═══════════════════════════════════════════════════════════════════
    float energyPulse = uEnergy * (0.5 + 0.5 * sin(time * 6.0));
    color += colorGold * energyPulse * 0.2 * density;
    
    // ═══════════════════════════════════════════════════════════════════
    // VIGNETTE SUAVE (enfoque central)
    // ═══════════════════════════════════════════════════════════════════
    float vignette = 1.0 - smoothstep(0.3, 1.0, length(uv - 0.5) * 1.2);
    color *= vignette * 0.8 + 0.2;
    
    gl_FragColor = vec4(color, 1.0);
  }
`

// ════════════════════════════════════════════════════════════════════════════════════════
// VERTEX SHADER - GPGPU PARTICLE SWARM
// Sistema de partículas con física de enjambre en GPU
// ════════════════════════════════════════════════════════════════════════════════════════
export const particleSwarmVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  uniform float uProcessing;
  uniform float uAttraction;
  uniform float uRepulsion;
  
  attribute float aScale;
  attribute float aPhase;
  attribute vec3 aVelocity;
  attribute float aColorMix;
  
  varying vec3 vColor;
  varying float vAlpha;
  varying float vIntensity;

  // ═══════════════════════════════════════════════════════════════════════
  // CURL NOISE PARA MOVIMIENTO FLUIDO SIN DIVERGENCIA
  // ═══════════════════════════════════════════════════════════════════════
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
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
    
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  vec3 curlNoise(vec3 p) {
    float epsilon = 0.1;
    
    float n1 = snoise(p + vec3(epsilon, 0.0, 0.0));
    float n2 = snoise(p - vec3(epsilon, 0.0, 0.0));
    float n3 = snoise(p + vec3(0.0, epsilon, 0.0));
    float n4 = snoise(p - vec3(0.0, epsilon, 0.0));
    float n5 = snoise(p + vec3(0.0, 0.0, epsilon));
    float n6 = snoise(p - vec3(0.0, 0.0, epsilon));
    
    return normalize(vec3(
      (n3 - n4) - (n5 - n6),
      (n5 - n6) - (n1 - n2),
      (n1 - n2) - (n3 - n4)
    ));
  }

  void main() {
    vec3 pos = position;
    float time = uTime * (0.4 + uProcessing * 0.4);

    // ═══════════════════════════════════════════════════════════════════
    // ATRACCIÓN GRAVITACIONAL AL CENTRO (órbita estable)
    // ═══════════════════════════════════════════════════════════════════
    float distFromCenter = length(pos);
    vec3 toCenter = -normalize(pos);
    float targetRadius = 2.0 + sin(aPhase * 6.28 + time) * 0.4;
    float gravityForce = (distFromCenter - targetRadius) * uAttraction * 0.03;
    pos += toCenter * gravityForce;

    // ═══════════════════════════════════════════════════════════════════
    // CURL NOISE - MOVIMIENTO DE ENJAMBRE FLUIDO
    // ═══════════════════════════════════════════════════════════════════
    float noiseScale = 0.25 + uProcessing * 0.15;
    vec3 noisePos = pos * noiseScale + vec3(time * 0.3);
    vec3 curlForce = curlNoise(noisePos) * (0.12 + uProcessing * 0.18);
    pos += curlForce;

    // ═══════════════════════════════════════════════════════════════════
    // RESPIRACIÓN CÓSMICA
    // ═══════════════════════════════════════════════════════════════════
    float breathe = sin(time * 1.2 + aPhase * 6.28) * 0.08;
    pos += normalize(pos) * breathe * (1.0 + uProcessing * 0.5);

    // ═══════════════════════════════════════════════════════════════════
    // REPULSIÓN MAGNÉTICA DEL MOUSE
    // ═══════════════════════════════════════════════════════════════════
    vec3 mousePos = vec3(uMouse.x * 4.0, uMouse.y * 4.0, 0.0);
    vec3 toMouse = pos - mousePos;
    float distToMouse = length(toMouse);
    
    if (distToMouse < 3.0) {
      float force = pow(1.0 - distToMouse / 3.0, 2.0) * uRepulsion;
      pos += normalize(toMouse) * force * 0.8;
    }

    // ═══════════════════════════════════════════════════════════════════
    // TRANSFORMACIÓN FINAL
    // ═══════════════════════════════════════════════════════════════════
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float sizeBase = aScale * uPixelRatio * 45.0;
    float depthScale = 1.0 / -mvPosition.z;
    gl_PointSize = sizeBase * depthScale * (1.0 + uProcessing * 0.25);

    // ═══════════════════════════════════════════════════════════════════
    // COLOR DINÁMICO - PALETA CHRONOS INFINITY
    // ═══════════════════════════════════════════════════════════════════
    vec3 colorViolet = vec3(0.545, 0.0, 1.0);  // #8B00FF
    vec3 colorGold = vec3(1.0, 0.843, 0.0);    // #FFD700
    vec3 colorPink = vec3(1.0, 0.078, 0.576);  // #FF1493
    
    float velocity = length(curlForce);
    
    // Mezcla basada en color mix attribute y procesamiento
    vec3 baseColor = mix(colorViolet, colorGold, aColorMix);
    baseColor = mix(baseColor, colorPink, uProcessing * 0.5);
    
    // Brillo por velocidad
    vColor = mix(baseColor, vec3(1.0), velocity * 1.5 * uProcessing);
    
    // Alpha con fade en bordes
    vAlpha = smoothstep(4.5, 2.0, distFromCenter);
    vIntensity = 0.6 + uProcessing * 0.4 + velocity * 0.5;
  }
`

// ════════════════════════════════════════════════════════════════════════════════════════
// FRAGMENT SHADER - GPGPU PARTICLE SWARM
// ════════════════════════════════════════════════════════════════════════════════════════
export const particleSwarmFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vIntensity;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    
    // Múltiples capas para efecto de estrella brillante
    float core = 1.0 - smoothstep(0.0, 0.08, d);     // Núcleo ultra brillante
    float inner = 1.0 - smoothstep(0.0, 0.2, d);     // Anillo interno
    float glow = 1.0 - smoothstep(0.08, 0.5, d);     // Halo suave
    
    float alpha = (core * 1.8 + inner * 0.6 + glow * 0.3) * vAlpha;
    
    vec3 finalColor = vColor + vec3(core * 0.6);
    finalColor *= vIntensity;
    
    gl_FragColor = vec4(finalColor, alpha);
    
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

// ════════════════════════════════════════════════════════════════════════════════════════
// FRAGMENT SHADER - VOLUMETRIC GLOW (Post-processing)
// ════════════════════════════════════════════════════════════════════════════════════════
export const volumetricGlowFragmentShader = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float uIntensity;
  uniform float uTime;
  uniform vec2 uResolution;
  
  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    
    // Multi-sample blur para glow volumétrico
    vec2 texelSize = 1.0 / uResolution;
    vec4 glow = vec4(0.0);
    
    float samples = 8.0;
    for (float i = 0.0; i < samples; i++) {
      float angle = i * 6.28318530718 / samples;
      float radius = 3.0 + i * 0.5;
      vec2 offset = vec2(cos(angle), sin(angle)) * texelSize * radius;
      glow += texture2D(tDiffuse, vUv + offset);
    }
    glow /= samples;
    
    // Combinar con color original
    vec3 finalColor = color.rgb + glow.rgb * uIntensity * 0.5;
    
    gl_FragColor = vec4(finalColor, color.a);
  }
`

// ════════════════════════════════════════════════════════════════════════════════════════
// COLORES EXPORTADOS PARA USO EN COMPONENTES
// ════════════════════════════════════════════════════════════════════════════════════════
export const CHRONOS_SHADER_COLORS = {
  violetReal: [0.545, 0.0, 1.0] as [number, number, number],
  goldLiquid: [1.0, 0.843, 0.0] as [number, number, number],
  pinkElectric: [1.0, 0.078, 0.576] as [number, number, number],
  voidBlack: [0.0, 0.0, 0.0] as [number, number, number],
  deepVoid: [0.02, 0.01, 0.05] as [number, number, number],
} as const

export type ChronosShaderColor = keyof typeof CHRONOS_SHADER_COLORS
