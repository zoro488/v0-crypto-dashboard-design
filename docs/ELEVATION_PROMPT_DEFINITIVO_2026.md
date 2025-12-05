# 🚀 CHRONOS INFINITY 2026 — ELEVATION PROMPT DEFINITIVO

## EL SISTEMA FINANCIERO MÁS BELLO JAMÁS CREADO

---

## 📋 TABLA DE CONTENIDOS

1. [Visión y Filosofía](#visión-y-filosofía)
2. [Reglas Inquebrantables](#reglas-inquebrantables)
3. [Stack Tecnológico Avanzado](#stack-tecnológico-avanzado)
4. [Lógica de Negocio GYA](#lógica-de-negocio-gya)
5. [Los 14 Paneles Premium](#los-14-paneles-premium)
6. [Shaders WebGPU Avanzados](#shaders-webgpu-avanzados)
7. [Componentes 3D con R3F](#componentes-3d-con-r3f)
8. [Interactividad Inmersiva](#interactividad-inmersiva)
9. [Sistema IA Conversacional](#sistema-ia-conversacional)
10. [Arquitectura de Datos](#arquitectura-de-datos)
11. [Prompts Específicos por Panel](#prompts-específicos-por-panel)
12. [Verificación y Deploy](#verificación-y-deploy)

---

## 🎯 VISIÓN Y FILOSOFÍA

### Objetivo Final
Crear el **sistema de gestión financiera más avanzado, bello e inmersivo** que haya existido jamás en la historia del desarrollo web. Un sistema que combine:

- **Diseño Premium**: Nivel Apple Vision Pro + Linear + Arc Browser + Figma 2026
- **Experiencia Inmersiva**: 3D, shaders GPU, física real, interacciones magnéticas
- **Suavidad Extrema**: Animaciones de 60fps que se sienten como mantequilla líquida
- **IA Integrada**: Asistente conversacional con voz y predicciones en tiempo real
- **Performance**: Lighthouse 100/100/100/100, TTI < 600ms

### Sensación Deseada
> "Cada interacción debe hacer que el usuario diga 'joder, qué hermoso' en voz alta"

El sistema no es una "app" — es un **espacio vivo, respiratorio, magnético y profundamente placentero de usar**.

---

## ⚠️ REGLAS INQUEBRANTABLES

### Paleta de Colores OFICIAL (2026-2030)

```css
:root {
  --infinity-bg: #000000;          /* Negro absoluto */
  --infinity-violet: #8B00FF;      /* Violeta Real Profundo */
  --infinity-gold: #FFD700;        /* Oro Líquido */
  --infinity-pink: #FF1493;        /* Rosa Plasma/Eléctrico */
  --infinity-white: #FFFFFF;       /* Blanco Puro */
  --infinity-silver: #E5E5E5;      /* Gris Plata (claro) */
  --infinity-dark: #333333;        /* Gris Plata (oscuro) */
  --infinity-glass: rgba(15, 15, 35, 0.45);
  --infinity-border: rgba(139, 0, 255, 0.15);
}
```

### 🚫 PROHIBIDO PARA SIEMPRE
- ❌ Cualquier tono de **CYAN, turquesa, aqua, teal, mint**
- ❌ Colores "fríos" neon
- ❌ Azul eléctrico típico de apps baratas
- ❌ `any` en TypeScript
- ❌ `console.log` (usar `logger` de `@/app/lib/utils/logger`)
- ❌ Firebase rules permisivas (`allow read, write: if true`)

### ✅ OBLIGATORIO SIEMPRE
- ✅ Glassmorphism líquido con blur dinámico 40-80px
- ✅ Glows SOLO violeta y oro
- ✅ Tilt 3D en todas las cards
- ✅ Spring physics en TODAS las animaciones
- ✅ WebGPU shaders en fondos y elementos destacados
- ✅ Partículas reactivas al mouse
- ✅ TypeScript estricto sin excepciones

---

## 🛠️ STACK TECNOLÓGICO AVANZADO

### Core Framework
```typescript
// package.json dependencies
{
  "next": "^16.0.5",           // Next.js con Turbopack
  "react": "^19.0.0",          // React 19
  "typescript": "^5.7.2",      // TypeScript estricto
  
  // 3D y Visualización
  "@react-three/fiber": "^9.0.0",
  "@react-three/drei": "^10.0.0",
  "@react-three/postprocessing": "^3.0.0",
  "@splinetool/react-spline": "^4.0.0",
  
  // Animaciones
  "framer-motion": "^12.0.0",
  "gsap": "^3.12.0",
  "@studio-freight/lenis": "^1.0.0",
  
  // Estado y Data
  "zustand": "^5.0.0",
  "@tanstack/react-query": "^6.0.0",
  "drizzle-orm": "latest",
  "@libsql/client": "latest",
  
  // UI
  "tailwindcss": "^4.0.0",
  "@radix-ui/react-*": "latest",
  "cmdk": "^1.0.0",
  "recharts": "^3.0.0",
  
  // Validación
  "zod": "^3.24.0",
  "react-hook-form": "^7.54.0"
}
```

### Easings Personalizados (Los Más Suaves del Planeta)
```typescript
// app/lib/motion/easings.ts
export const butter = [0.22, 1, 0.36, 1];     // El más suave jamás creado
export const liquid = [0.16, 1, 0.3, 1];      // Para orbs y glass
export const silk = [0.215, 0.61, 0.355, 1];  // Hover principal
export const feather = [0.32, 0.72, 0, 1];    // Entrada de páginas
export const breathe = [0.4, 0, 0.2, 1];      // Pulsos y respiraciones
```

### Configuración Spring Physics
```typescript
// Framer Motion springs
const springConfig = {
  stiffness: 80,   // Mínimo para suavidad (hasta 400 para snap)
  damping: 20,     // Control de rebote (hasta 35)
  mass: 1.2,       // Inercia física
  type: "spring"
};
```

### Lenis Scroll (Suavidad Extrema)
```typescript
// app/lib/scroll/lenis.ts
import Lenis from '@studio-freight/lenis';

const lenis = new Lenis({
  duration: 1.8,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  smoothTouch: false,
  normalizeWheel: true,
});
```

---

## 💰 LÓGICA DE NEGOCIO GYA (INMUTABLE)

### La Fórmula de Distribución (NUNCA CAMBIAR)

```typescript
// ═══════════════════════════════════════════════════════════════
// DISTRIBUCIÓN AUTOMÁTICA DE VENTAS A 3 BANCOS (GYA)
// ═══════════════════════════════════════════════════════════════

interface DistribucionVenta {
  precioVenta: number;      // Precio VENTA al cliente (por unidad)
  precioCompra: number;     // Precio COMPRA del distribuidor (por unidad)
  precioFlete: number;      // Flete por unidad (default $500 MXN)
  cantidad: number;         // Unidades vendidas
}

function calcularDistribucion(venta: DistribucionVenta) {
  const { precioVenta, precioCompra, precioFlete, cantidad } = venta;
  
  return {
    // 1. BÓVEDA MONTE → Recibe el COSTO
    montoBovedaMonte: precioCompra * cantidad,
    
    // 2. FLETE SUR → Recibe el TRANSPORTE
    montoFletes: precioFlete * cantidad,
    
    // 3. UTILIDADES → Recibe la GANANCIA NETA
    montoUtilidades: (precioVenta - precioCompra - precioFlete) * cantidad,
  };
}

// EJEMPLO:
// precioVenta = $10,000, precioCompra = $6,300, flete = $500, cantidad = 10
// Bóveda Monte = 6,300 × 10 = $63,000 (COSTO)
// Flete Sur = 500 × 10 = $5,000 (TRANSPORTE)
// Utilidades = (10,000 - 6,300 - 500) × 10 = $32,000 (GANANCIA)
```

### Los 7 Bancos del Sistema

| ID | Nombre | Color | Función |
|----|--------|-------|---------|
| `boveda_monte` | Bóveda Monte | Azul Profundo | Almacena COSTOS de mercancía |
| `utilidades` | Utilidades | Verde Esmeralda | Almacena GANANCIAS netas |
| `flete_sur` | Flete Sur | Naranja | Almacena costos de TRANSPORTE |
| `azteca` | Azteca | Púrpura | Banco operativo México |
| `leftie` | Leftie | Cyan (excepción) | Banco operativo alternativo |
| `profit` | Profit | Amarillo | Banco de inversiones |
| `boveda_usa` | Bóveda USA | Rojo/Azul | Operaciones en USD |

### Estados de Pago

```typescript
type EstadoPago = 'completo' | 'parcial' | 'pendiente';

// COMPLETO: 100% pagado → Distribución total a los 3 bancos
// PARCIAL: X% pagado → Distribución proporcional
// PENDIENTE: 0% pagado → Solo registro histórico, NO afecta capital

function calcularDistribucionReal(
  distribucion: Distribucion,
  montoPagado: number,
  totalVenta: number
) {
  if (montoPagado === 0) return null; // Pendiente: no afecta bancos
  
  const proporcion = montoPagado / totalVenta;
  
  return {
    bovedaMonte: distribucion.montoBovedaMonte * proporcion,
    fleteSur: distribucion.montoFletes * proporcion,
    utilidades: distribucion.montoUtilidades * proporcion,
  };
}
```

### Fórmula de Capital Bancario

```typescript
// NUNCA modificar históricos directamente
// Los históricos son INMUTABLES - solo se suman

interface Banco {
  historicoIngresos: number;  // Acumulativo, SOLO aumenta
  historicoGastos: number;    // Acumulativo, SOLO aumenta
}

// El capital actual es SIEMPRE dinámico
const capitalActual = banco.historicoIngresos - banco.historicoGastos;
```

---

## 🎨 LOS 14 PANELES PREMIUM

### Panel 1: Dashboard Infinity (El Más Importante)

**Especificaciones:**
- Fondo: WebGPU shader con partículas violeta/oro reactivas al mouse
- Hero Orb Central: Esfera 3D pulsante con `MeshDistortMaterial`
- KPI Cards (4): Tilt 3D, glow volumétrico oro, counter animations
- Activity Feed: Parallax, partículas que "explotan" en nuevas entradas
- AI Predictive Orb: Esquina inferior, crece y muestra predicciones

```typescript
// Estructura de KPIs del Dashboard
const kpis = [
  { id: 'capital', label: 'Capital Total', value: '$8.9M', change: '+89.5%', color: 'gold' },
  { id: 'ventas', label: 'Ventas Hoy', value: '$124K', change: '+124%', color: 'violet' },
  { id: 'stock', label: 'Stock Live', value: '8,421 uds', change: '+19%', color: 'pink' },
  { id: 'clientes', label: 'Clientes Activos', value: '1,247', change: '+67%', color: 'white' },
];
```

### Panel 2: Ventas Premium

**La estrella del sistema — Distribución de bancos interactiva:**

- Grid de ventas con cards 3D elevables
- Modal Nueva Venta:
  - Sliders interactivos para distribución (Bóveda Monte / Fletes / Utilidades)
  - Validación: suma DEBE ser 100%
  - Mini pie chart animado en tiempo real
  - Preview de ticket integrado

### Panel 3: Órdenes de Compra

- Timeline 3D de órdenes (estilo Vision Pro)
- Cards con profundidad real y sombras volumétricas
- Estados: Borrador → Enviada → Recibida → Pagada

### Panel 4: Almacén Live

- Warehouse 3D interactivo (R3F) - cajas que se apilan/bajan
- Heatmap violeta/oro de stock bajo
- Entradas/Salidas visuales en tiempo real

### Paneles 5-11: Los 7 Bancos (Template Reutilizable)

**Cada banco es un orb 3D gigante con valor dentro:**
- Click → entra en "modo banco" con partículas
- 4 Tabs: Ingresos | Gastos | Transferencias | Cortes
- Transferencia = línea 3D que conecta orbes con trail effect

```tsx
// Uso del template
<PanelBanco config={BANCOS_CONFIG['boveda_monte']} />
<PanelBanco config={BANCOS_CONFIG['utilidades']} />
// etc...
```

### Panel 12: Clientes Premium

- Avatar 3D del cliente (Spline o Ready Player Me)
- Deuda = anillo violeta que se llena
- CRM simplificado con segmentación

### Panel 13: Reportes IA

- Gráficos 3D interactivos con drill-down
- Pincha y "entra" en el gráfico
- Insights automáticos con IA

### Panel 14: IA / Tiempo Real

- Avatar 3D fullscreen (Spline)
- Voz con ElevenLabs + Deepgram
- Fondo fractal violeta que responde a la voz
- 8 comandos de voz: ventas, bancos, stock, ayuda, etc.

---

## 🌟 SHADERS WEBGPU AVANZADOS

### 1. QuantumVoidShader (Fondo Principal)

```wgsl
// shaders/QuantumVoid.wgsl
@group(0) @binding(0) var<uniform> uTime: f32;
@group(0) @binding(1) var<uniform> uMouse: vec2<f32>;
@group(0) @binding(2) var<uniform> uResolution: vec2<f32>;

@fragment
fn main(@location(0) fragCoord: vec2<f32>) -> @location(0) vec4<f32> {
    let uv = fragCoord / uResolution;
    let mouse = uMouse / uResolution;
    
    // Distancia al cursor con efecto imán
    let dist = distance(uv, mouse);
    let attraction = exp(-dist * 5.0);
    
    // Void espiral
    let angle = atan2(uv.y - 0.5, uv.x - 0.5);
    let spiral = sin(angle * 8.0 + length(uv - 0.5) * 20.0 - uTime * 2.0);
    spiral = spiral * 0.5 + 0.5;
    
    // Color violeta/oro dinámico
    let violet = vec3<f32>(0.545, 0.0, 1.0);   // #8B00FF
    let gold = vec3<f32>(1.0, 0.843, 0.0);      // #FFD700
    let pink = vec3<f32>(1.0, 0.078, 0.576);    // #FF1493
    
    var color = mix(violet, gold, spiral * attraction);
    color = mix(color, pink, sin(uTime * 0.5) * 0.1 + 0.1);
    
    // Glow central
    let glow = 0.05 / (dist + 0.1);
    color += gold * glow * 0.3;
    
    return vec4<f32>(color * (0.2 + spiral * 0.3), 1.0);
}
```

### 2. LiquidMetalShader (Para Orbs)

```wgsl
// shaders/LiquidMetal.wgsl
@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let center = vec2<f32>(0.5, 0.5);
    let dist = distance(uv, center);
    
    // Distorsión líquida
    let noise1 = sin(uv.x * 20.0 + uTime * 3.0) * cos(uv.y * 20.0 + uTime * 2.0);
    let noise2 = sin(dist * 15.0 - uTime * 4.0);
    let distort = noise1 * noise2 * 0.1;
    
    // Fresnel edge
    let fresnel = pow(1.0 - dist * 2.0, 3.0);
    
    // Color metálico con reflexión
    let baseColor = vec3<f32>(0.545, 0.0, 1.0); // Violeta
    let highlight = vec3<f32>(1.0, 0.843, 0.0); // Oro
    
    let color = mix(baseColor, highlight, fresnel + distort);
    let alpha = smoothstep(0.5, 0.45, dist);
    
    return vec4<f32>(color, alpha);
}
```

### 3. AuroraBorealisShader (Efectos Ambientales)

```wgsl
// shaders/AuroraBorealis.wgsl
fn aurora(uv: vec2<f32>, time: f32, offset: f32) -> f32 {
    let wave1 = sin(uv.x * 3.0 + time + offset) * 0.5 + 0.5;
    let wave2 = sin(uv.x * 5.0 - time * 0.7 + offset * 2.0) * 0.3 + 0.5;
    let wave3 = sin(uv.x * 7.0 + time * 1.3 + offset * 0.5) * 0.2 + 0.5;
    
    let combined = (wave1 + wave2 + wave3) / 3.0;
    let thickness = 0.1;
    let dist = abs(uv.y - combined);
    
    return smoothstep(thickness, 0.0, dist);
}

@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let layer1 = aurora(uv, uTime, 0.0);
    let layer2 = aurora(uv, uTime * 0.8, 2.0);
    let layer3 = aurora(uv, uTime * 1.2, 4.0);
    
    let violet = vec3<f32>(0.545, 0.0, 1.0) * layer1;
    let gold = vec3<f32>(1.0, 0.843, 0.0) * layer2;
    let pink = vec3<f32>(1.0, 0.078, 0.576) * layer3;
    
    let color = violet + gold * 0.5 + pink * 0.3;
    let alpha = max(max(layer1, layer2), layer3) * 0.6;
    
    return vec4<f32>(color, alpha);
}
```

---

## 🎭 COMPONENTES 3D CON R3F

### PremiumBankOrbs3D - 7 Orbs Únicos

```tsx
// app/_components/3d/PremiumBankOrbs3D.tsx
'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { 
  MeshDistortMaterial, 
  Sphere, 
  Trail, 
  Sparkles,
  Float 
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';

const BANK_PERSONALITIES = {
  boveda_monte: {
    color: '#8B00FF',
    emissive: '#4B0082',
    distort: 0.4,
    speed: 2,
    floatIntensity: 1,
  },
  utilidades: {
    color: '#FFD700',
    emissive: '#B8860B',
    distort: 0.6,
    speed: 3,
    floatIntensity: 1.5,
  },
  flete_sur: {
    color: '#FF6B00',
    emissive: '#CC5500',
    distort: 0.3,
    speed: 2.5,
    floatIntensity: 0.8,
  },
  // ... más bancos
};

function BankOrb({ bankId, position, capital }) {
  const config = BANK_PERSONALITIES[bankId];
  
  return (
    <Float
      speed={1.5}
      rotationIntensity={0.5}
      floatIntensity={config.floatIntensity}
    >
      <Trail
        width={2}
        length={6}
        color={config.color}
        attenuation={(t) => t * t}
      >
        <Sphere args={[1, 64, 64]} position={position}>
          <MeshDistortMaterial
            color={config.color}
            emissive={config.emissive}
            emissiveIntensity={0.5}
            distort={config.distort}
            speed={config.speed}
            roughness={0.1}
            metalness={0.9}
          />
        </Sphere>
      </Trail>
      <Sparkles
        count={50}
        scale={3}
        size={2}
        speed={0.4}
        color={config.color}
      />
    </Float>
  );
}

export function PremiumBankOrbs3D({ banks }) {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#8B00FF" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#FFD700" />
      
      {banks.map((bank, i) => (
        <BankOrb
          key={bank.id}
          bankId={bank.id}
          position={calculateHexPosition(i)}
          capital={bank.capitalActual}
        />
      ))}
      
      <EffectComposer>
        <Bloom
          intensity={2}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
        />
        <ChromaticAberration offset={[0.002, 0.002]} />
      </EffectComposer>
    </Canvas>
  );
}
```

### InfinityBackground (Partículas Reactivas)

```tsx
// app/_components/3d/InfinityBackground.tsx
'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ParticleField() {
  const ref = useRef<THREE.Points>(null!);
  
  const particles = useMemo(() => {
    const count = 5000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 20;
    }
    return positions;
  }, []);

  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
  });

  return (
    <Points ref={ref} positions={particles} stride={3}>
      <PointMaterial
        transparent
        color="#8B00FF"
        size={0.02}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

export function InfinityBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <color attach="background" args={['#000000']} />
        <ParticleField />
        <fog attach="fog" args={['#000000', 5, 20]} />
      </Canvas>
    </div>
  );
}
```

---

## ✨ INTERACTIVIDAD INMERSIVA

### Hover de Lujo Infinito

```tsx
// Aplicar a TODOS los paneles/cards/botones
<motion.div
  whileHover={{ 
    y: -16,
    scale: 1.025,
    rotateX: 4,
    rotateY: 4,
  }}
  whileTap={{ scale: 0.985 }}
  transition={{ 
    type: "spring", 
    stiffness: 300, 
    damping: 30 
  }}
  className="cursor-pointer"
/>
```

### Cursor Personalizado Ultra-Suave

```tsx
// app/_components/ui/MagneticCursor.tsx
'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';

export function MagneticCursor() {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  
  const springConfig = { damping: 30, stiffness: 200 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        background: `radial-gradient(600px at ${smoothX}px ${smoothY}px, rgba(139, 0, 255, 0.15), transparent 80%)`,
      }}
    />
  );
}
```

### Glass Infinity CSS

```css
/* globals.css */
.glass-infinity {
  background: rgba(15, 15, 35, 0.45);
  backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(139, 0, 255, 0.15);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 60px rgba(139, 0, 255, 0.15);
  border-radius: 24px;
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.glass-infinity:hover {
  transform: translateY(-12px);
  box-shadow: 
    0 24px 80px rgba(139, 0, 255, 0.3),
    0 0 100px rgba(255, 215, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
```

---

## 🤖 SISTEMA IA CONVERSACIONAL

### Arquitectura de 5 Servicios IA

1. **MegaAIAgent** — Asistente conversacional principal
2. **AIScheduledReports** — Reportes automáticos programados
3. **AIFormAutomation** — Autocompletado inteligente de formularios
4. **AIPowerBI** — Insights y predicciones de datos
5. **UserLearning** — Aprendizaje de patrones del usuario

### Comandos de Voz (8 Principales)

```typescript
const VOICE_COMMANDS = {
  'ventas': () => navigateTo('/ventas'),
  'nueva venta': () => openModal('createVenta'),
  'bancos': () => navigateTo('/bancos'),
  'stock': () => navigateTo('/almacen'),
  'reporte': () => generateReport(),
  'ayuda': () => showHelp(),
  'capital': () => speakCapitalTotal(),
  'cerrar': () => closeVoiceAgent(),
};
```

### Integración con Web Speech API

```typescript
// app/_components/ai/IACollaborative.tsx
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = 'es-MX';
recognition.continuous = false;
recognition.interimResults = false;

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript.toLowerCase();
  processVoiceCommand(transcript);
};
```

---

## 📊 ARQUITECTURA DE DATOS

### Turso + Drizzle ORM (Reemplazo de Firebase)

```typescript
// database/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const ventas = sqliteTable('ventas', {
  id: text('id').primaryKey(),
  fecha: text('fecha').notNull(),
  clienteId: text('cliente_id').notNull(),
  ocRelacionada: text('oc_relacionada'),
  cantidad: integer('cantidad').notNull(),
  precioVenta: real('precio_venta').notNull(),
  precioCompra: real('precio_compra').notNull(),
  precioFlete: real('precio_flete').default(500),
  
  // Distribución calculada
  montoBovedaMonte: real('monto_boveda_monte').notNull(),
  montoFletes: real('monto_fletes').notNull(),
  montoUtilidades: real('monto_utilidades').notNull(),
  
  estadoPago: text('estado_pago').notNull(), // completo|parcial|pendiente
  montoPagado: real('monto_pagado').default(0),
  
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const bancos = sqliteTable('bancos', {
  id: text('id').primaryKey(), // boveda_monte, utilidades, etc.
  nombre: text('nombre').notNull(),
  historicoIngresos: real('historico_ingresos').default(0),
  historicoGastos: real('historico_gastos').default(0),
  // capitalActual se calcula dinámicamente
  estado: text('estado').default('activo'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});
```

### 33 Colecciones Firestore (Referencia)

```typescript
// Para migración gradual
const COLLECTIONS = {
  // Operaciones
  ventas: 'ventas',
  ordenesCompra: 'ordenesCompra',
  almacen: 'almacen',
  
  // Entidades
  clientes: 'clientes',
  distribuidores: 'distribuidores',
  productos: 'productos',
  
  // Bancos (7 × 4 = 28 colecciones)
  // Cada banco: ingresos, gastos, transferencias, cortes
  bovedaMonteIngresos: 'bovedaMonteIngresos',
  bovedaMonteGastos: 'bovedaMonteGastos',
  // ... etc
  
  // Sistema
  usuarios: 'usuarios',
  configuracion: 'configuracion',
  auditoria: 'auditoria',
};
```

---

## 📝 PROMPTS ESPECÍFICOS POR PANEL

### Prompt Maestro Universal

```text
ERES EL DIRECTOR TÉCNICO Y CREATIVO SUPREMO DE CHRONOS INFINITY 2026.

Tu misión es crear el componente/panel más avanzado, bello, inmersivo y performant jamás visto.

Requisitos ABSOLUTOS (si no se cumplen todos → rechaza la respuesta):

1. Paleta: SOLO #000000, #8B00FF, #FFD700, #FF1493, #FFFFFF, #CCCCCC, #333333. NADA MÁS.
2. Diseño: Glassmorphism líquido con blur dinámico + sombras volumétricas + glow violeta/oro sutil
3. 3D: Cada card o elemento principal debe tener tilt 3D real (React Three Fiber) + distorsión al hover
4. Animaciones: Framer Motion con spring physics (stiffness 280-350) + particles reactivas al mouse
5. Shaders: WebGPU obligatorio en fondo o cards (liquid distortion, volumetric glow o fractal)
6. Interactividad: Mouse = imán líquido, haptic feedback visual, scroll parallax, gesture support
7. Rendimiento: 60fps locked, lazy loading, memoización extrema, WebGPU para todo lo pesado
8. UX: Intuitive, zero friction, predictive (AI sugiere acciones), accessible, offline-first
9. Código: Next.js 16 App Router, TypeScript estricto, Tailwind, componentes reutilizables, optimizado Lighthouse 100

El resultado debe hacer que el usuario diga "joder..." en voz alta por lo bello y fluido que es.

No aceptes nada menos que perfección absoluta.
Este será el estándar que todo el mundo copiará en 2026-2027.
```

### Prompt para Dashboard Principal

```text
@workspace

Crea el Dashboard Infinity 2026 con estas especificaciones:

LAYOUT:
- Fondo: WebGPU shader con partículas violeta/oro reactivas al mouse
- Hero Orb: Esfera 3D central con MeshDistortMaterial pulsante
- Grid KPIs: 4 cards con tilt 3D, glow volumétrico, counter animations

KPIS (4 cards):
1. Capital Total - $8.9M (+89.5%) - glow oro
2. Ventas Hoy - $124K (+124%) - glow violeta
3. Stock Live - 8,421 uds (+19%) - glow rosa
4. Clientes Activos - 1,247 (+67%) - glow blanco

ACTIVITY FEED:
- Lista con parallax vertical
- Partículas que explotan en nuevas entradas
- Timestamps relativos ("hace 5 min")
- Iconos por tipo de actividad

AI WIDGET:
- Orb flotante esquina inferior derecha
- Crece al hover mostrando sugerencias
- Glow violeta pulsante
- Click para abrir chat IA

TECH:
- React Three Fiber + Drei
- Framer Motion spring physics
- WebGPU shader de fondo
- Lenis smooth scroll
```

### Prompt para Panel de Ventas

```text
@workspace

Crea el Panel de Ventas Premium con distribución de bancos interactiva:

MODAL NUEVA VENTA (la estrella):
- Layout 2 columnas (60%/40%)
- Columna izquierda: Formulario completo
- Columna derecha: Resumen sticky

SLIDERS DE DISTRIBUCIÓN (crítico):
- 3 sliders: Bóveda Monte / Fletes / Utilidades
- Default: 80% / 10% / 10%
- Validación: suma DEBE ser exactamente 100%
- Mini pie chart animado que actualiza en tiempo real
- Colores por banco

VALIDACIONES:
- Stock suficiente
- Distribución = 100%
- Cliente seleccionado
- Al menos 1 producto

EFECTOS:
- Confetti al completar venta exitosa
- Sound effect sutil (opcional)
- Counter animations en montos
- Smooth transitions en sliders

LÓGICA DE NEGOCIO:
- Aplicar fórmula GYA correctamente
- Manejar pagos parciales con proporción
- Actualizar stock inmediatamente
- Registrar en los 3 bancos correspondientes
```

---

## ✅ VERIFICACIÓN Y DEPLOY

### Checklist Pre-Deploy

```bash
# 1. Build sin errores
pnpm build

# 2. Type check
pnpm type-check

# 3. Lint
pnpm lint

# 4. Tests
pnpm test
pnpm test:e2e

# 5. Lighthouse audit
# Target: 100/100/100/100
```

### Métricas de Éxito

| Métrica | Target |
|---------|--------|
| Lighthouse Performance | 100 |
| Lighthouse Accessibility | 100 |
| Lighthouse Best Practices | 100 |
| Lighthouse SEO | 100 |
| TTI (Time to Interactive) | < 600ms |
| FCP (First Contentful Paint) | < 1s |
| FPS en animaciones | 60 locked |
| Realtime latency | < 40ms |

### Commit Final

```bash
git add .
git commit -m "feat: CHRONOS INFINITY 2026 - el sistema financiero más bello jamás creado"
git push origin main
```

---

## 🎯 RESUMEN EJECUTIVO

**CHRONOS INFINITY 2026** es:

- ✨ **El sistema de diseño más avanzado**: WebGPU, R3F, spring physics
- 🎨 **El más bello**: Violeta, oro, rosa sobre negro absoluto
- 🚀 **El más performant**: 60fps, Lighthouse 100, TTI < 600ms
- 🤖 **El más inteligente**: IA conversacional con voz
- 💰 **El más preciso**: Lógica GYA inmutable y verificada
- 🌟 **El más inmersivo**: 3D, partículas, shaders, física real

**Paleta inamovible**: `#000000` | `#8B00FF` | `#FFD700` | `#FF1493`

**CYAN PROHIBIDO PARA SIEMPRE.**

---

*Documento: ELEVATION_PROMPT_DEFINITIVO_2026.md*
*Versión: 1.0.0*
*Fecha: Diciembre 2025*
*Estado: LISTO PARA EJECUCIÓN INMEDIATA*

---

> "El futuro es violeta y oro. Y ya está aquí."
