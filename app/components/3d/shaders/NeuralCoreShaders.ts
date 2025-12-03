/**
 * 🧠 NEURAL CORE SHADERS - Sistema de Partículas GPGPU Ultra Avanzado
 * 
 * Shaders GLSL de alta performance para 100,000+ partículas:
 * - Vertex Shader: Física de enjambre y atracción magnética
 * - Fragment Shader: Efecto de estrella con bloom natural
 * - Compute Shaders: Simulación de fuerzas en GPU
 */

// ============================================================================
// VERTEX SHADER - GPGPU PARTICLES
// ============================================================================
export const neuralCoreVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  uniform float uProcessingIntensity;
  uniform float uInteractionRadius;
  uniform float uInteractionStrength;
  uniform sampler2D uPositionTexture; // Para GPGPU
  
  attribute float aScale;
  attribute float aPhase;
  attribute vec3 aVelocity;
  attribute float aLifetime;
  
  varying vec3 vColor;
  varying float vAlpha;
  varying float vIntensity;

  // ═══════════════════════════════════════════════════════════════════════════
  // CURL NOISE - Ruido vectorial sin divergencia para movimiento fluido
  // ═══════════════════════════════════════════════════════════════════════════
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
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Curl noise para movimiento sin divergencia
  vec3 curlNoise(vec3 p) {
    float epsilon = 0.1;
    
    float n1 = snoise(p + vec3(epsilon, 0.0, 0.0));
    float n2 = snoise(p - vec3(epsilon, 0.0, 0.0));
    float n3 = snoise(p + vec3(0.0, epsilon, 0.0));
    float n4 = snoise(p - vec3(0.0, epsilon, 0.0));
    float n5 = snoise(p + vec3(0.0, 0.0, epsilon));
    float n6 = snoise(p - vec3(0.0, 0.0, epsilon));
    
    float dydz = (n3 - n4) - (n5 - n6);
    float dzdx = (n5 - n6) - (n1 - n2);
    float dxdy = (n1 - n2) - (n3 - n4);
    
    return normalize(vec3(dydz, dzdx, dxdy));
  }

  void main() {
    vec3 pos = position;
    float time = uTime * (0.5 + uProcessingIntensity * 0.5);

    // ═══════════════════════════════════════════════════════════════════════
    // 1. ATRACCIÓN GRAVITACIONAL HACIA ESFERA CENTRAL
    // ═══════════════════════════════════════════════════════════════════════
    float distFromCenter = length(pos);
    vec3 toCenter = -normalize(pos);
    float gravityStrength = 0.02 * (1.0 + uProcessingIntensity * 2.0);
    
    // Órbita estable con perturbación
    float orbitRadius = 2.0 + sin(aPhase * 6.28 + time) * 0.3;
    float gravityForce = (distFromCenter - orbitRadius) * gravityStrength;
    pos += toCenter * gravityForce;

    // ═══════════════════════════════════════════════════════════════════════
    // 2. CURL NOISE - Movimiento de enjambre fluido
    // ═══════════════════════════════════════════════════════════════════════
    float noiseScale = 0.3 + uProcessingIntensity * 0.2;
    vec3 noisePos = pos * noiseScale + vec3(time * 0.3);
    vec3 curlForce = curlNoise(noisePos) * (0.15 + uProcessingIntensity * 0.2);
    pos += curlForce;

    // ═══════════════════════════════════════════════════════════════════════
    // 3. ONDAS DE "RESPIRACIÓN" CÓSMICA
    // ═══════════════════════════════════════════════════════════════════════
    float breathPhase = time * 1.5 + aPhase * 6.28;
    float breathe = sin(breathPhase) * 0.1 * (1.0 + uProcessingIntensity * 0.5);
    pos += normalize(pos) * breathe;

    // ═══════════════════════════════════════════════════════════════════════
    // 4. REPULSIÓN MAGNÉTICA DEL MOUSE
    // ═══════════════════════════════════════════════════════════════════════
    vec3 mousePos = vec3(uMouse.x * 4.0, uMouse.y * 4.0, 0.0);
    vec3 toMouse = pos - mousePos;
    float distToMouse = length(toMouse);
    
    if (distToMouse < uInteractionRadius) {
      float force = pow(1.0 - distToMouse / uInteractionRadius, 2.0) * uInteractionStrength;
      pos += normalize(toMouse) * force;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. TRANSFORMACIÓN FINAL Y PROYECCIÓN
    // ═══════════════════════════════════════════════════════════════════════
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Tamaño con perspectiva real
    float sizeBase = aScale * uPixelRatio * 50.0;
    float depthScale = 1.0 / -mvPosition.z;
    gl_PointSize = sizeBase * depthScale * (1.0 + uProcessingIntensity * 0.3);
    
    // ═══════════════════════════════════════════════════════════════════════
    // 6. COLOR DINÁMICO BASADO EN ESTADO
    // ═══════════════════════════════════════════════════════════════════════
    // Velocidad implícita basada en posición
    float velocity = length(curlForce);
    
    // Paleta de colores: Azul(idle) -> Dorado/Blanco(processing)
    vec3 colorIdle = vec3(0.1, 0.4, 0.9);      // Azul eléctrico
    vec3 colorActive = vec3(0.9, 0.7, 0.2);    // Dorado
    vec3 colorHot = vec3(1.0, 0.3, 0.1);       // Rojo/Naranja
    
    // Mezcla basada en intensidad de procesamiento
    vec3 baseColor = mix(colorIdle, colorActive, uProcessingIntensity);
    baseColor = mix(baseColor, colorHot, smoothstep(0.7, 1.0, uProcessingIntensity));
    
    // Variación por velocidad
    vColor = mix(baseColor, vec3(1.0), velocity * 2.0 * uProcessingIntensity);
    
    // Alpha con fade en bordes
    vAlpha = smoothstep(4.0, 2.0, distFromCenter);
    vIntensity = 0.5 + uProcessingIntensity * 0.5 + velocity;
  }
`

// ============================================================================
// FRAGMENT SHADER - EFECTO DE ESTRELLA
// ============================================================================
export const neuralCoreFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vIntensity;

  void main() {
    // Distancia al centro del punto
    float d = distance(gl_PointCoord, vec2(0.5));
    
    // Descartar fuera del círculo
    if (d > 0.5) discard;
    
    // Múltiples capas para efecto de estrella brillante
    float core = 1.0 - smoothstep(0.0, 0.1, d);      // Núcleo ultra brillante
    float inner = 1.0 - smoothstep(0.0, 0.25, d);    // Anillo interno
    float glow = 1.0 - smoothstep(0.1, 0.5, d);      // Halo suave
    
    // Combinar capas
    float alpha = (core * 1.5 + inner * 0.7 + glow * 0.3) * vAlpha;
    
    // Color con brillo en el centro
    vec3 finalColor = vColor + vec3(core * 0.5);
    
    // Toque de bloom natural
    finalColor *= vIntensity;
    
    gl_FragColor = vec4(finalColor, alpha);
    
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

// ============================================================================
// FLUID BACKGROUND VERTEX SHADER
// ============================================================================
export const fluidBackgroundVertexShader = /* glsl */ `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// ============================================================================
// FLUID BACKGROUND FRAGMENT SHADER - NAVIER-STOKES SIMPLIFICADO
// ============================================================================
export const fluidBackgroundFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform float uEnergy;
  
  varying vec2 vUv;

  // FBM (Fractal Brownian Motion) para humo volumétrico
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

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

  // Warping para efecto de fluido
  vec2 warp(vec2 p, float t) {
    float n1 = fbm(p + vec2(t * 0.1, 0.0));
    float n2 = fbm(p + vec2(0.0, t * 0.1) + 3.14);
    return p + vec2(n1, n2) * 0.5;
  }

  void main() {
    vec2 uv = vUv;
    vec2 center = vec2(0.5);
    float time = uTime * 0.3;
    
    // Efecto de fluido con warping
    vec2 p = uv * 3.0;
    p = warp(p, time);
    p = warp(p, time * 0.5 + 1.0);
    
    // Patrón base de humo
    float smoke = fbm(p + vec2(time * 0.2));
    smoke = pow(smoke, 1.5);
    
    // Influencia del mouse
    vec2 mouseInfluence = uMouse * 0.5 + 0.5;
    float mouseDist = distance(uv, mouseInfluence);
    float mouseRipple = sin(mouseDist * 20.0 - time * 3.0) * exp(-mouseDist * 3.0);
    smoke += mouseRipple * 0.1;
    
    // Energía del audio afecta el fluido
    smoke *= 1.0 + uEnergy * 0.5;
    
    // Paleta de colores profundos
    vec3 colorDeep = vec3(0.02, 0.02, 0.05);
    vec3 colorCyan = vec3(0.0, 0.6, 0.8);
    vec3 colorViolet = vec3(0.4, 0.1, 0.6);
    vec3 colorPink = vec3(0.8, 0.2, 0.5);
    
    // Gradiente basado en posición y smoke
    vec3 color = colorDeep;
    color = mix(color, colorCyan, smoke * 0.3);
    color = mix(color, colorViolet, fbm(p * 2.0 + time) * 0.2);
    color = mix(color, colorPink, fbm(p * 1.5 - time * 0.5) * 0.1);
    
    // Vetas de luz que brillan
    float veins = fbm(p * 4.0 + vec2(time * 0.5));
    veins = smoothstep(0.4, 0.6, veins);
    color += vec3(0.1, 0.3, 0.5) * veins * (0.5 + uEnergy);
    
    // Viñeta suave
    float vignette = 1.0 - smoothstep(0.3, 0.8, distance(uv, center));
    color *= vignette;
    
    // Pulso con energía
    color += vec3(0.05, 0.1, 0.15) * sin(time * 2.0 + uEnergy * 10.0) * 0.1;
    
    gl_FragColor = vec4(color, 1.0);
  }
`

// ============================================================================
// HOLOGRAPHIC BAR CHART VERTEX SHADER
// ============================================================================
export const holographicBarVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform float uHover;
  
  attribute float aHeight;
  attribute float aIndex;
  attribute vec3 aColor;
  
  varying vec3 vColor;
  varying vec2 vUv;
  varying float vHeight;
  varying float vFresnel;
  varying float vIndex;

  void main() {
    vUv = uv;
    vIndex = aIndex;
    vColor = aColor;
    
    vec3 pos = position;
    
    // Altura animada con easing
    float targetHeight = aHeight;
    float easedProgress = smoothstep(0.0, 1.0, uProgress - aIndex * 0.1);
    float currentHeight = targetHeight * easedProgress;
    
    // Escalar solo en Y para la altura
    if (pos.y > 0.0) {
      pos.y *= currentHeight;
    }
    
    vHeight = currentHeight;
    
    // Efecto de hover
    float hoverScale = 1.0 + uHover * 0.1 * (1.0 - abs(aIndex - 3.0) / 3.0);
    pos.xz *= hoverScale;
    
    // Transformación
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Fresnel para bordes brillantes
    vec3 viewDir = normalize(-mvPosition.xyz);
    vec3 worldNormal = normalize(normalMatrix * normal);
    vFresnel = pow(1.0 - abs(dot(viewDir, worldNormal)), 2.0);
  }
`

// ============================================================================
// HOLOGRAPHIC BAR CHART FRAGMENT SHADER
// ============================================================================
export const holographicBarFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  
  varying vec3 vColor;
  varying vec2 vUv;
  varying float vHeight;
  varying float vFresnel;
  varying float vIndex;

  void main() {
    // Scanlines holográficas
    float scanline = sin(vUv.y * 50.0 - uTime * 5.0) * 0.5 + 0.5;
    scanline = pow(scanline, 4.0) * 0.3;
    
    // Gradiente vertical
    float verticalGrad = smoothstep(0.0, 1.0, vUv.y);
    
    // Color base con gradiente
    vec3 color = vColor;
    color = mix(color * 0.3, color, verticalGrad);
    
    // Añadir scanlines
    color += vec3(scanline) * vColor;
    
    // Fresnel para efecto holográfico en bordes
    color += vec3(0.3, 0.5, 1.0) * vFresnel * 0.5;
    
    // Transparencia
    float alpha = (0.4 + verticalGrad * 0.4) * uOpacity;
    alpha += vFresnel * 0.3;
    
    // Parpadeo sutil
    alpha *= 0.9 + sin(uTime * 10.0 + vIndex) * 0.1;
    
    gl_FragColor = vec4(color, alpha);
  }
`

// ============================================================================
// RADAR SCANNER VERTEX SHADER
// ============================================================================
export const radarScannerVertexShader = /* glsl */ `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// ============================================================================
// RADAR SCANNER FRAGMENT SHADER
// ============================================================================
export const radarScannerFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uScanAngle;
  uniform sampler2D uDataTexture; // Textura con puntos de datos
  
  varying vec2 vUv;

  #define PI 3.14159265359

  void main() {
    vec2 center = vec2(0.5);
    vec2 uv = vUv - center;
    
    float dist = length(uv);
    float angle = atan(uv.y, uv.x);
    
    // Fondo oscuro con grid
    vec3 bgColor = vec3(0.02, 0.04, 0.08);
    
    // Círculos concéntricos
    float rings = sin(dist * 30.0) * 0.5 + 0.5;
    rings = smoothstep(0.45, 0.5, rings) * 0.1;
    
    // Grid radial
    float radialLines = abs(sin(angle * 8.0));
    radialLines = smoothstep(0.98, 1.0, radialLines) * 0.1;
    
    vec3 color = bgColor + vec3(0.0, rings * 0.3, rings * 0.5);
    color += vec3(0.0, radialLines * 0.2, radialLines * 0.3);
    
    // Sweep del scanner
    float scanAngle = mod(uTime * 0.5, 2.0 * PI);
    float angleDiff = mod(angle - scanAngle + PI, 2.0 * PI) - PI;
    
    // Trail del scan (verde brillante)
    float scanTrail = smoothstep(0.0, -1.5, angleDiff);
    scanTrail *= exp(-dist * 2.0); // Fade con distancia
    color += vec3(0.1, 0.8, 0.3) * scanTrail * 0.5;
    
    // Línea del scanner
    float scanLine = 1.0 - smoothstep(0.0, 0.05, abs(angleDiff));
    scanLine *= step(dist, 0.48);
    color += vec3(0.2, 1.0, 0.4) * scanLine;
    
    // Borde exterior
    float outerRing = 1.0 - smoothstep(0.47, 0.48, dist);
    float innerRing = smoothstep(0.46, 0.47, dist);
    float ring = outerRing * innerRing;
    color += vec3(0.0, 0.5, 0.3) * ring;
    
    // Centro
    float centerDot = 1.0 - smoothstep(0.01, 0.02, dist);
    color += vec3(0.2, 0.8, 0.4) * centerDot;
    
    // Mask circular
    float mask = 1.0 - smoothstep(0.48, 0.5, dist);
    
    gl_FragColor = vec4(color, mask);
  }
`
