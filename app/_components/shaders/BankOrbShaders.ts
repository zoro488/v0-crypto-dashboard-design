// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — BANK ORB SHADERS
// Shaders únicos para cada banco con personalidad definida
// Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
// ═══════════════════════════════════════════════════════════════

import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════
// BÓVEDA MONTE — Oro líquido cayendo desde la cima
// El rey de la liquidez, derramando oro incandescente
// ═══════════════════════════════════════════════════════════════
export const BovedaMonteShader = shaderMaterial(
  {
    uTime: 0,
    uCapital: 0,
    uIntensity: 1.0,
  },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;
    
    // Simplex noise para distorsión orgánica
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g; g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      
      // Efecto de oro cayendo - distorsión vertical
      float goldFlow = snoise(vec2(position.x * 5.0, position.y * 3.0 - uTime * 0.5)) * 0.08;
      float drip = sin(position.y * 10.0 - uTime * 2.0) * 0.02 * (1.0 - position.y);
      
      vec3 pos = position;
      pos.x += goldFlow;
      pos.z += drip;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform float uCapital;
    uniform float uIntensity;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    // Colores CHRONOS
    const vec3 GOLD = vec3(1.0, 0.843, 0.0);
    const vec3 GOLD_DARK = vec3(0.7, 0.5, 0.0);
    const vec3 GOLD_BRIGHT = vec3(1.0, 0.95, 0.5);
    
    void main() {
      // Fresnel para brillo metálico
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
      
      // Patrón de oro cayendo
      float flow = sin(vUv.y * 20.0 - uTime * 3.0 + sin(vUv.x * 10.0) * 2.0);
      flow = smoothstep(0.0, 0.6, flow);
      
      // Gotas brillantes
      float drops = sin(vUv.x * 50.0 + uTime) * sin(vUv.y * 30.0 - uTime * 4.0);
      drops = smoothstep(0.9, 1.0, drops);
      
      // Mezcla de tonos de oro
      vec3 color = mix(GOLD_DARK, GOLD, flow);
      color = mix(color, GOLD_BRIGHT, fresnel * 0.6);
      color += GOLD_BRIGHT * drops * 0.8;
      
      // Brillo basado en capital
      float capitalGlow = uCapital * 0.3;
      color += GOLD * capitalGlow;
      
      // Metalness con reflejos
      float metallic = 0.8 + fresnel * 0.2;
      color *= metallic * uIntensity;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

// ═══════════════════════════════════════════════════════════════
// UTILIDADES — Explosión rosa-dorada constante
// Fuegos artificiales perpetuos celebrando ganancias
// ═══════════════════════════════════════════════════════════════
export const UtilidadesShader = shaderMaterial(
  {
    uTime: 0,
    uCapital: 0,
    uIntensity: 1.0,
  },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      
      // Pulsación explosiva
      float pulse = sin(uTime * 3.0) * 0.05;
      float explode = sin(uTime * 8.0 + length(position) * 5.0) * 0.02;
      
      vec3 pos = position * (1.0 + pulse + explode);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform float uCapital;
    uniform float uIntensity;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    const vec3 PINK = vec3(1.0, 0.078, 0.576);
    const vec3 GOLD = vec3(1.0, 0.843, 0.0);
    const vec3 WHITE = vec3(1.0, 1.0, 1.0);
    
    // Hash para partículas
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.5);
      
      // Explosiones en múltiples puntos
      float explosions = 0.0;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        vec2 center = vec2(
          sin(uTime * (1.0 + fi * 0.3) + fi * 1.5) * 0.5 + 0.5,
          cos(uTime * (0.8 + fi * 0.2) + fi * 2.0) * 0.5 + 0.5
        );
        float dist = length(vUv - center);
        float ring = sin(dist * 30.0 - uTime * 10.0);
        ring = smoothstep(0.0, 0.5, ring) * (1.0 / (dist * 5.0 + 1.0));
        explosions += ring * 0.3;
      }
      
      // Chispas aleatorias
      float sparks = hash(floor(vUv * 50.0) + floor(uTime * 10.0));
      sparks = smoothstep(0.95, 1.0, sparks);
      
      // Gradiente rosa-dorado rotativo
      float angle = atan(vUv.y - 0.5, vUv.x - 0.5) + uTime * 0.5;
      float gradient = sin(angle * 3.0) * 0.5 + 0.5;
      
      vec3 color = mix(PINK, GOLD, gradient);
      color += WHITE * explosions * (0.5 + uCapital * 0.5);
      color += WHITE * sparks * 2.0;
      color += WHITE * fresnel * 0.4;
      
      color *= uIntensity;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

// ═══════════════════════════════════════════════════════════════
// FLETES — Plasma violeta electrizante
// Rayos y descargas eléctricas constantes
// ═══════════════════════════════════════════════════════════════
export const FletesShader = shaderMaterial(
  {
    uTime: 0,
    uCapital: 0,
    uIntensity: 1.0,
  },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      
      // Distorsión eléctrica
      float electric = sin(position.y * 20.0 + uTime * 5.0) * 0.01;
      electric += cos(position.x * 15.0 - uTime * 3.0) * 0.01;
      
      vec3 pos = position;
      pos.x += electric;
      pos.z += electric * 0.5;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform float uCapital;
    uniform float uIntensity;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    const vec3 VIOLET = vec3(0.545, 0.0, 1.0);
    const vec3 VIOLET_LIGHT = vec3(0.7, 0.3, 1.0);
    const vec3 WHITE = vec3(1.0, 1.0, 1.0);
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    void main() {
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
      
      // Rayos eléctricos
      float lightning = 0.0;
      for (int i = 0; i < 8; i++) {
        float fi = float(i);
        float t = uTime * (2.0 + fi * 0.5) + fi * 0.7;
        float ray = abs(sin(vUv.x * (20.0 + fi * 5.0) + t));
        ray *= abs(sin(vUv.y * (15.0 + fi * 3.0) - t * 0.7));
        ray = smoothstep(0.98, 1.0, ray);
        lightning += ray;
      }
      
      // Plasma base
      float plasma = sin(vUv.x * 10.0 + uTime) * sin(vUv.y * 10.0 + uTime * 0.8);
      plasma += sin(vUv.x * 15.0 - uTime * 1.2) * sin(vUv.y * 12.0 - uTime);
      plasma = plasma * 0.25 + 0.5;
      
      // Pulsos de energía
      float pulse = sin(length(vUv - 0.5) * 20.0 - uTime * 5.0);
      pulse = smoothstep(0.8, 1.0, pulse) * 0.5;
      
      vec3 color = mix(VIOLET, VIOLET_LIGHT, plasma);
      color += WHITE * lightning * 2.0;
      color += VIOLET_LIGHT * pulse;
      color += WHITE * fresnel * 0.5;
      color *= 0.8 + uCapital * 0.4;
      color *= uIntensity;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

// ═══════════════════════════════════════════════════════════════
// AZTECA — Grietas rojas de lava/fuego antiguo
// Textura de piedra agrietada con magma interior
// ═══════════════════════════════════════════════════════════════
export const AztecaShader = shaderMaterial(
  {
    uTime: 0,
    uCapital: 0,
    uIntensity: 1.0,
  },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;
    
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g; g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      
      // Textura de piedra agrietada
      float crack = snoise(position.xy * 5.0 + uTime * 0.1) * 0.03;
      
      vec3 pos = position;
      pos += normal * crack;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform float uCapital;
    uniform float uIntensity;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    const vec3 OBSIDIAN = vec3(0.1, 0.05, 0.08);
    const vec3 LAVA = vec3(1.0, 0.3, 0.0);
    const vec3 FIRE = vec3(1.0, 0.6, 0.0);
    const vec3 GOLD = vec3(1.0, 0.843, 0.0);
    
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g; g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    float voronoi(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float minDist = 1.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 neighbor = vec2(float(x), float(y));
          vec2 point = vec2(snoise(i + neighbor) * 0.5 + 0.5,
                           snoise(i + neighbor + 100.0) * 0.5 + 0.5);
          float dist = length(neighbor + point - f);
          minDist = min(minDist, dist);
        }
      }
      return minDist;
    }
    
    void main() {
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
      
      // Grietas voronoi
      float cracks = voronoi(vUv * 8.0);
      cracks = smoothstep(0.0, 0.15, cracks);
      
      // Lava pulsante en las grietas
      float lavaFlow = snoise(vUv * 5.0 + vec2(0.0, -uTime * 0.3));
      float lavaPulse = sin(uTime * 2.0) * 0.3 + 0.7;
      
      // Color base: obsidiana
      vec3 color = OBSIDIAN;
      
      // Lava en las grietas
      float crackGlow = (1.0 - cracks) * lavaPulse;
      vec3 lavaColor = mix(LAVA, FIRE, lavaFlow * 0.5 + 0.5);
      lavaColor = mix(lavaColor, GOLD, uCapital * 0.3);
      
      color = mix(color, lavaColor, crackGlow);
      
      // Brillo de fuego
      color += FIRE * fresnel * 0.3;
      
      // Partículas de ceniza brillante
      float ash = snoise(vUv * 30.0 + uTime);
      ash = smoothstep(0.9, 1.0, ash) * 0.5;
      color += GOLD * ash;
      
      color *= uIntensity;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

// ═══════════════════════════════════════════════════════════════
// LEFTIE — Corona dorada orbital
// Partículas de polvo de oro orbitando como corona solar
// ═══════════════════════════════════════════════════════════════
export const LeftieShader = shaderMaterial(
  {
    uTime: 0,
    uCapital: 0,
    uIntensity: 1.0,
  },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      
      // Rotación suave de corona
      float angle = uTime * 0.2;
      mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      vec3 pos = position;
      pos.xz = rot * pos.xz;
      
      // Ondulación de corona solar
      float wave = sin(atan(position.z, position.x) * 8.0 + uTime * 2.0) * 0.02;
      pos += normal * wave;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform float uCapital;
    uniform float uIntensity;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    const vec3 GOLD = vec3(1.0, 0.843, 0.0);
    const vec3 GOLD_BRIGHT = vec3(1.0, 0.95, 0.7);
    const vec3 GOLD_DARK = vec3(0.6, 0.4, 0.0);
    const vec3 WHITE = vec3(1.0, 1.0, 1.0);
    
    void main() {
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
      
      // Corona radiante
      float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
      float rays = sin(angle * 12.0 + uTime * 2.0) * 0.5 + 0.5;
      rays = pow(rays, 2.0);
      
      // Partículas de polvo de oro orbitando
      float orbit = sin(angle * 20.0 - uTime * 3.0);
      orbit *= sin(length(vUv - 0.5) * 30.0);
      orbit = smoothstep(0.8, 1.0, abs(orbit));
      
      // Brillo pulsante central
      float pulse = sin(uTime * 1.5) * 0.2 + 0.8;
      float center = 1.0 - length(vUv - 0.5) * 2.0;
      center = max(0.0, center);
      
      vec3 color = mix(GOLD_DARK, GOLD, rays);
      color = mix(color, GOLD_BRIGHT, center * pulse);
      color += WHITE * orbit * 0.5;
      color += GOLD_BRIGHT * fresnel * 0.6;
      
      // Intensidad basada en capital
      color *= 0.7 + uCapital * 0.5;
      color *= uIntensity;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

// ═══════════════════════════════════════════════════════════════
// PROFIT — Corona + Cetro (el emperador)
// El más majestuoso, con corona y rayos de cetro
// ═══════════════════════════════════════════════════════════════
export const ProfitShader = shaderMaterial(
  {
    uTime: 0,
    uCapital: 0,
    uIntensity: 1.0,
  },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      
      // Majestad: pulsación lenta y poderosa
      float majesty = sin(uTime * 0.5) * 0.03 + 1.0;
      
      vec3 pos = position * majesty;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform float uCapital;
    uniform float uIntensity;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    const vec3 GOLD = vec3(1.0, 0.843, 0.0);
    const vec3 VIOLET = vec3(0.545, 0.0, 1.0);
    const vec3 WHITE = vec3(1.0, 1.0, 1.0);
    const vec3 ROYAL = vec3(0.3, 0.0, 0.5);
    
    void main() {
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.5);
      
      // Corona con gemas
      float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
      float crown = abs(sin(angle * 5.0));
      crown = smoothstep(0.7, 1.0, crown);
      
      // Rayos de cetro imperial
      float scepter = 0.0;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        float rayAngle = fi * 1.5708; // 90 grados
        float ray = abs(sin(angle - rayAngle + uTime * 0.3));
        ray = pow(ray, 8.0);
        ray *= (1.0 - length(vUv - 0.5) * 1.5);
        scepter += ray;
      }
      
      // Gemas violeta en la corona
      float gems = sin(angle * 10.0 + uTime);
      gems = smoothstep(0.95, 1.0, abs(gems));
      
      // Aura imperial
      float aura = 1.0 - length(vUv - 0.5) * 1.5;
      aura = max(0.0, aura);
      float auraPulse = sin(uTime * 2.0) * 0.3 + 0.7;
      
      vec3 color = mix(ROYAL, GOLD, crown);
      color += GOLD * scepter * 1.5;
      color += VIOLET * gems;
      color += GOLD * aura * auraPulse * 0.5;
      color += WHITE * fresnel * 0.4;
      
      // El emperador brilla más con más capital
      color *= 0.6 + uCapital * 0.6;
      color *= uIntensity;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

// ═══════════════════════════════════════════════════════════════
// BÓVEDA USA — Bandera dorada ondeando
// Textura de tela con ondulación de viento
// ═══════════════════════════════════════════════════════════════
export const BovedaUSAShader = shaderMaterial(
  {
    uTime: 0,
    uCapital: 0,
    uIntensity: 1.0,
  },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      
      // Efecto de bandera ondeando
      float wave1 = sin(position.x * 8.0 + uTime * 2.0) * 0.03;
      float wave2 = sin(position.x * 4.0 - uTime * 1.5 + position.y * 2.0) * 0.02;
      float wave3 = cos(position.y * 6.0 + uTime * 1.8) * 0.01;
      
      vec3 pos = position;
      pos.z += wave1 + wave2 + wave3;
      
      // Ajustar normales para iluminación correcta
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform float uCapital;
    uniform float uIntensity;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    const vec3 GOLD = vec3(1.0, 0.843, 0.0);
    const vec3 GOLD_LIGHT = vec3(1.0, 0.92, 0.5);
    const vec3 GOLD_DARK = vec3(0.7, 0.55, 0.0);
    const vec3 WHITE = vec3(1.0, 1.0, 1.0);
    
    void main() {
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
      
      // Franjas de bandera (estilo US pero en dorado)
      float stripes = floor(vUv.y * 13.0);
      float isStripe = mod(stripes, 2.0);
      
      // Cuadrado de estrellas
      float starField = 0.0;
      if (vUv.x < 0.4 && vUv.y > 0.5) {
        // Estrellas
        vec2 starUv = vUv * vec2(12.0, 9.0);
        vec2 cell = fract(starUv);
        float star = 1.0 - length(cell - 0.5) * 3.0;
        star = max(0.0, star);
        star *= step(0.3, abs(sin(floor(starUv.x) + floor(starUv.y) * 12.0)));
        
        // Estrellas brillantes
        float twinkle = sin(uTime * 3.0 + floor(starUv.x) * 2.0 + floor(starUv.y) * 3.0);
        star *= 0.7 + twinkle * 0.3;
        starField = star;
      }
      
      // Color base: franjas oro claro/oscuro
      vec3 color = mix(GOLD_LIGHT, GOLD_DARK, isStripe);
      
      // Agregar estrellas brillantes
      color += WHITE * starField * 0.8;
      
      // Brillo de tela satinada
      float silk = sin(vUv.x * 40.0 + vUv.y * 20.0 + uTime) * 0.1 + 0.9;
      color *= silk;
      
      // Ondulación de luz
      float wave = sin(vUv.x * 5.0 + uTime * 2.0) * 0.15 + 0.85;
      color *= wave;
      
      color += GOLD_LIGHT * fresnel * 0.3;
      color *= 0.8 + uCapital * 0.3;
      color *= uIntensity;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

// ═══════════════════════════════════════════════════════════════
// TIPOS TypeScript
// ═══════════════════════════════════════════════════════════════

export type BankShaderMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uTime: { value: number }
    uCapital: { value: number }
    uIntensity: { value: number }
  }
}

// Mapeo de banco a shader
export const BANK_SHADERS = {
  boveda_monte: BovedaMonteShader,
  utilidades: UtilidadesShader,
  flete_sur: FletesShader,
  azteca: AztecaShader,
  leftie: LeftieShader,
  profit: ProfitShader,
  boveda_usa: BovedaUSAShader,
} as const

export type BankId = keyof typeof BANK_SHADERS
