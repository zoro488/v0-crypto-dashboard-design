# 🚀 CHRONOS INFINITY 2026 — PLAN MAESTRO COMPLETO
## El Sistema Financiero Más Avanzado, Bello e Inmersivo Jamás Creado

---

> **DOCUMENTO DEFINITIVO** — Versión 1.0.0 — Diciembre 2025
> 
> Este archivo contiene TODO el plan de ejecución: fases, módulos, componentes, shaders, 
> lógica de negocio, arquitectura, y especificaciones técnicas para elevar CHRONOS 
> al nivel más premium del mundo (superior a Apple Vision Pro, Linear, Arc, Raycast).

---

## 📋 TABLA DE CONTENIDOS

1. [Visión General y Filosofía](#1-visión-general-y-filosofía)
2. [Reglas Inquebrantables del Diseño](#2-reglas-inquebrantables-del-diseño)
3. [Stack Tecnológico Definitivo](#3-stack-tecnológico-definitivo)
4. [Arquitectura del Sistema](#4-arquitectura-del-sistema)
5. [Lógica de Negocio GYA (7 Bancos)](#5-lógica-de-negocio-gya)
6. [Los 14 Paneles Premium](#6-los-14-paneles-premium)
7. [Componentes 3D y Spline](#7-componentes-3d-y-spline)
8. [Shaders WebGPU Avanzados](#8-shaders-webgpu-avanzados)
9. [Sistema de Animaciones](#9-sistema-de-animaciones)
10. [Interactividad Inmersiva](#10-interactividad-inmersiva)
11. [Sistema IA Conversacional](#11-sistema-ia-conversacional)
12. [Fases de Implementación](#12-fases-de-implementación)
13. [Verificación y Deploy](#13-verificación-y-deploy)
14. [Prompts de Ejecución](#14-prompts-de-ejecución)

---

## 1. VISIÓN GENERAL Y FILOSOFÍA

### 1.1 Objetivo Final

Crear el **sistema de gestión financiera más avanzado, bello e inmersivo** que haya existido jamás en la historia del desarrollo web.

**Nivel de referencia:**
- Apple Vision Pro UI
- Linear Motion Design
- Arc Browser Elegance
- Raycast Speed
- Figma 3D Features
- Blade Runner 2049 Aesthetic

### 1.2 Principios de Diseño

| Principio | Descripción |
|-----------|-------------|
| **Premium First** | Todo componente debe sentirse exclusivo y profesional |
| **Performance Obsessed** | <100ms de interacción, 60fps constantes, TTI <600ms |
| **AI Native** | IA integrada en cada flujo, predicciones en tiempo real |
| **Real-time Everything** | Sincronización instantánea <40ms |
| **3D Enhanced** | Profundidad real, shaders GPU, física simulada |
| **Immersive but Usable** | Inmersión sin marear, interactividad inteligente |

### 1.3 Sensación Deseada

> *"Cada interacción debe hacer que el usuario diga 'joder, qué hermoso' en voz alta"*

El sistema no es una "app" — es un **espacio vivo, respiratorio, magnético y profundamente placentero de usar**.

---

## 2. REGLAS INQUEBRANTABLES DEL DISEÑO

### 2.1 Paleta de Colores OFICIAL (2026-2030)

```css
:root {
  /* Colores Base */
  --infinity-bg: #000000;              /* Negro Absoluto */
  --infinity-violet: #8B00FF;          /* Violeta Real Profundo */
  --infinity-gold: #FFD700;            /* Oro Líquido */
  --infinity-pink: #FF1493;            /* Rosa Plasma/Eléctrico */
  --infinity-white: #FFFFFF;           /* Blanco Puro */
  --infinity-silver-light: #E5E5E5;    /* Gris Plata Claro */
  --infinity-silver-dark: #333333;     /* Gris Plata Oscuro */
  
  /* Glassmorphism */
  --infinity-glass: rgba(15, 15, 35, 0.45);
  --infinity-glass-border: rgba(139, 0, 255, 0.15);
  
  /* Glows */
  --glow-violet: 0 0 60px rgba(139, 0, 255, 0.4);
  --glow-gold: 0 0 60px rgba(255, 215, 0, 0.4);
  --glow-pink: 0 0 60px rgba(255, 20, 147, 0.3);
}
```

### 2.2 🚫 PROHIBIDO PARA SIEMPRE

| Elemento | Razón |
|----------|-------|
| ❌ **Cyan, turquesa, aqua, teal** | Rompe la estética premium oscura |
| ❌ **Azul eléctrico típico** | Asociado a apps genéricas |
| ❌ **Verde neón frío** | Conflicto con la paleta cálida |
| ❌ `any` en TypeScript | Rompe type safety |
| ❌ `console.log` | Usar `logger` de `@/app/lib/utils/logger` |
| ❌ Firestore rules permisivas | Nunca `allow read, write: if true` |
| ❌ Animaciones lineares | Siempre spring physics |

### 2.3 ✅ OBLIGATORIO SIEMPRE

- ✅ Glassmorphism líquido con blur 40-80px
- ✅ Glows SOLO violeta y oro
- ✅ Tilt 3D en todas las cards (±6° máximo)
- ✅ Spring physics en TODAS las animaciones
- ✅ WebGPU shaders en fondos y elementos destacados
- ✅ Partículas reactivas al mouse
- ✅ TypeScript estricto sin excepciones
- ✅ Server Components donde sea posible
- ✅ Cleanup en useEffect con listeners

---

## 3. STACK TECNOLÓGICO DEFINITIVO

### 3.1 Core Framework

```json
{
  "framework": {
    "next": "^16.0.5",
    "react": "^19.0.0",
    "typescript": "^5.7.2"
  },
  
  "3d-visualization": {
    "@react-three/fiber": "^9.0.0",
    "@react-three/drei": "^10.0.0",
    "@react-three/postprocessing": "^3.0.0",
    "@splinetool/react-spline": "^4.0.0",
    "three": "^0.170.0"
  },
  
  "animations": {
    "framer-motion": "^12.0.0",
    "gsap": "^3.12.0",
    "@studio-freight/lenis": "^1.0.0"
  },
  
  "state-data": {
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^6.0.0",
    "firebase": "latest"
  },
  
  "ui": {
    "tailwindcss": "^4.0.0",
    "@radix-ui/react-*": "latest",
    "cmdk": "^1.0.0",
    "recharts": "^3.0.0",
    "lucide-react": "latest"
  },
  
  "validation": {
    "zod": "^3.24.0",
    "react-hook-form": "^7.54.0"
  }
}
```

### 3.2 Easings Personalizados (Los Más Suaves del Planeta)

```typescript
// app/lib/motion/easings.ts
export const butter = [0.22, 1, 0.36, 1];     // El más suave jamás creado
export const liquid = [0.16, 1, 0.3, 1];      // Para orbs y glass
export const silk = [0.215, 0.61, 0.355, 1];  // Hover principal
export const feather = [0.32, 0.72, 0, 1];    // Entrada de páginas
export const breathe = [0.4, 0, 0.2, 1];      // Pulsos y respiraciones
```

### 3.3 Spring Physics Config

```typescript
// Configuración Framer Motion
const springConfig = {
  stiffness: 80,    // Mínimo para suavidad (hasta 400 para snap)
  damping: 20,      // Control de rebote (hasta 35)
  mass: 1.2,        // Inercia física
  type: "spring"
};

// Springs por uso
const springs = {
  hover: { stiffness: 300, damping: 30 },
  page: { stiffness: 80, damping: 20, mass: 1.2 },
  orb: { stiffness: 100, damping: 25 },
  card: { stiffness: 280, damping: 28 },
};
```

### 3.4 Lenis Scroll Configuration

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

## 4. ARQUITECTURA DEL SISTEMA

### 4.1 Estructura de Carpetas Definitiva

```
v0-crypto-dashboard-design/
├── 📁 app/
│   ├── 📄 layout.tsx              # Root layout con providers
│   ├── 📄 page.tsx                # Dashboard principal
│   ├── 📄 globals.css             # Estilos Tailwind + Design System
│   ├── 📄 loading.tsx             # Loading UI global
│   ├── 📄 error.tsx               # Error boundary global
│   │
│   ├── 📁 (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── 📁 (dashboard)/
│   │   ├── layout.tsx             # Layout con Sidebar + Header + CommandMenu
│   │   ├── page.tsx               # Dashboard Infinity 2026
│   │   ├── ventas/page.tsx
│   │   ├── clientes/page.tsx
│   │   ├── distribuidores/page.tsx
│   │   ├── almacen/page.tsx
│   │   ├── ordenes/page.tsx
│   │   ├── bancos/
│   │   │   ├── page.tsx           # Overview 7 bancos (orbs 3D)
│   │   │   └── [bancoId]/page.tsx # Panel individual
│   │   ├── reportes/page.tsx
│   │   ├── gya/page.tsx           # Gastos y Administración
│   │   ├── ia/page.tsx            # IA Immersive
│   │   └── configuracion/page.tsx
│   │
│   ├── 📁 _actions/               # Server Actions
│   │   ├── ventas.actions.ts
│   │   ├── clientes.actions.ts
│   │   ├── bancos.actions.ts
│   │   └── ...
│   │
│   ├── 📁 _components/
│   │   ├── 📁 panels/             # 14 Paneles Únicos
│   │   │   ├── BentoVentas.tsx
│   │   │   ├── BentoClientes.tsx
│   │   │   ├── BentoDistribuidores.tsx
│   │   │   ├── BentoAlmacen.tsx
│   │   │   ├── BentoOrdenes.tsx
│   │   │   ├── BentoBanco.tsx     # Template reutilizable
│   │   │   ├── BentoReportes.tsx
│   │   │   ├── BentoGYA.tsx
│   │   │   ├── BentoIA.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── 📁 dashboard/
│   │   │   ├── Dashboard2026Ultra.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── StatsGrid.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── 📁 modals/             # Modales CRUD
│   │   │   ├── VentaModal.tsx
│   │   │   ├── ClienteModal.tsx
│   │   │   └── ...
│   │   │
│   │   ├── 📁 visualizations/     # Canvas 60fps
│   │   │   ├── WaveformVisualization.tsx
│   │   │   ├── SalesFlowDiagram.tsx
│   │   │   ├── NetworkGraph.tsx
│   │   │   ├── ParticleField.tsx
│   │   │   ├── FinancialFlow.tsx
│   │   │   ├── FlowDistributor.tsx
│   │   │   ├── PieChart.tsx
│   │   │   └── BankHierarchy.tsx
│   │   │
│   │   ├── 📁 3d/                 # Componentes Three.js/Spline
│   │   │   ├── PremiumBankOrbs3D.tsx
│   │   │   ├── InfinityBackground.tsx
│   │   │   ├── SplineScene.tsx
│   │   │   ├── LiquidMetalOrb.tsx
│   │   │   └── NeuralGridFloor.tsx
│   │   │
│   │   ├── 📁 webgpu/             # Shaders WebGPU
│   │   │   ├── QuantumVoidBackground.tsx
│   │   │   ├── MoneyExplosion.tsx
│   │   │   ├── MagneticGlassPanel.tsx
│   │   │   └── shaders/
│   │   │       ├── quantum-void.wgsl
│   │   │       ├── liquid-metal.wgsl
│   │   │       └── ...
│   │   │
│   │   ├── 📁 layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── CommandMenu.tsx    # Cmd+K
│   │   │   └── MobileNav.tsx
│   │   │
│   │   ├── 📁 ui/                 # shadcn/ui base
│   │   │
│   │   └── 📁 ui-premium/         # Componentes premium
│   │       ├── GlassCard.tsx
│   │       ├── MagneticCursor.tsx
│   │       └── microinteractions.tsx
│   │
│   ├── 📁 _hooks/
│   │   ├── useFirestoreCRUD.ts
│   │   ├── useAppStore.ts
│   │   ├── useAuth.ts
│   │   ├── useBusinessOperations.ts
│   │   ├── useVoiceAgent.ts
│   │   ├── useMouseParallax.ts
│   │   └── index.ts
│   │
│   ├── 📁 _lib/
│   │   ├── 📁 firebase/
│   │   │   ├── config.ts
│   │   │   ├── firestore-service.ts
│   │   │   └── business-operations.ts
│   │   │
│   │   ├── 📁 store/
│   │   │   └── useAppStore.ts     # Zustand
│   │   │
│   │   ├── 📁 schemas/            # Zod
│   │   │   ├── ventas.schema.ts
│   │   │   ├── clientes.schema.ts
│   │   │   └── ...
│   │   │
│   │   ├── 📁 utils/
│   │   │   ├── logger.ts
│   │   │   ├── formatters.ts
│   │   │   ├── calculations.ts    # Fórmulas GYA
│   │   │   └── cn.ts
│   │   │
│   │   ├── 📁 constants/
│   │   │   ├── bancos.ts          # Config 7 bancos
│   │   │   └── navigation.ts
│   │   │
│   │   └── 📁 motion/
│   │       ├── easings.ts
│   │       └── springs.ts
│   │
│   ├── 📁 types/
│   │   └── index.ts               # Todos los tipos del dominio
│   │
│   ├── 📁 styles/
│   │   └── chronos-design-system.css
│   │
│   └── 📁 providers/
│       ├── ThemeProvider.tsx
│       ├── QueryProvider.tsx
│       └── AuthProvider.tsx
│
├── 📁 public/
│   ├── 📁 spline/                 # Escenas Spline exportadas
│   │   ├── ai_voice_orb.splinecode
│   │   ├── bank_orbs.splinecode
│   │   └── ...
│   ├── 📁 icons/
│   └── 📁 images/
│
├── 📁 SPLINE COMPONENTS/          # Assets 3D originales
│   ├── ai_voice_assistance_orb.spline
│   ├── frosted_glass_texture_icon.spline
│   ├── nexbot_robot_character_concept.spline
│   ├── particle_nebula.spline
│   └── ...
│
├── 📁 docs/
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── BUSINESS_LOGIC.md
│   └── COMPONENTS.md
│
├── 📁 scripts/
│   ├── seed.ts
│   └── migrate.ts
│
└── [Configuraciones]
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── firestore.rules
    └── package.json
```

---

## 5. LÓGICA DE NEGOCIO GYA

### 5.1 Los 7 Bancos del Sistema

| ID | Nombre | Tipo | Moneda | Recibe de Ventas | Color |
|----|--------|------|--------|------------------|-------|
| `boveda_monte` | Bóveda Monte | boveda | MXN | ✅ COSTO | Azul Profundo |
| `boveda_usa` | Bóveda USA | boveda | USD | ❌ | Rojo/Azul |
| `utilidades` | Utilidades | utilidades | MXN | ✅ GANANCIA | Esmeralda |
| `flete_sur` | Flete Sur | gastos | MXN | ✅ FLETE | Naranja |
| `azteca` | Azteca | operativo | MXN | ❌ | Púrpura |
| `leftie` | Leftie | operativo | MXN | ❌ | Cyan (excepción) |
| `profit` | Profit | operativo | MXN | ❌ | Amarillo |

### 5.2 Distribución GYA (Fórmula Principal)

```
┌─────────────────────────────────────────────────────────────┐
│                    DISTRIBUCIÓN GYA                         │
│            (Ganancia Y Asignación)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  VENTA                                                      │
│    │                                                        │
│    ├──▶ BÓVEDA MONTE  = precioCompra × cantidad             │
│    │    (El COSTO del producto va aquí)                     │
│    │                                                        │
│    ├──▶ FLETE SUR     = precioFlete × cantidad              │
│    │    (El costo de TRANSPORTE va aquí)                    │
│    │                                                        │
│    └──▶ UTILIDADES    = (precioVenta - precioCompra -       │
│         precioFlete) × cantidad                             │
│         (La GANANCIA NETA va aquí)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Implementación TypeScript

```typescript
// app/_lib/utils/calculations.ts

interface DatosVenta {
  cantidad: number;
  precioVenta: number;
  precioCompra: number;
  precioFlete: number;  // Default: $500 MXN
  montoPagado: number;
}

interface DistribucionGYA {
  totalVenta: number;
  montoBovedaMonte: number;
  montoFletes: number;
  montoUtilidades: number;
}

export function calcularDistribucionGYA(datos: DatosVenta): DistribucionGYA {
  const { cantidad, precioVenta, precioCompra, precioFlete = 500 } = datos;
  
  const totalVenta = precioVenta * cantidad;
  const montoBovedaMonte = precioCompra * cantidad;
  const montoFletes = precioFlete * cantidad;
  const montoUtilidades = (precioVenta - precioCompra - precioFlete) * cantidad;
  
  return { totalVenta, montoBovedaMonte, montoFletes, montoUtilidades };
}

// Para pagos parciales
export function calcularDistribucionReal(
  distribucion: DistribucionGYA,
  montoPagado: number
): DistribucionGYA | null {
  if (montoPagado === 0) return null; // Pendiente: no afecta bancos
  
  const proporcion = montoPagado / distribucion.totalVenta;
  
  return {
    totalVenta: montoPagado,
    montoBovedaMonte: distribucion.montoBovedaMonte * proporcion,
    montoFletes: distribucion.montoFletes * proporcion,
    montoUtilidades: distribucion.montoUtilidades * proporcion,
  };
}
```

### 5.4 Ejemplo Numérico

```
═══════════════════════════════════════════════════════════════
EJEMPLO: Venta de 10 unidades
═══════════════════════════════════════════════════════════════

DATOS DE ENTRADA:
┌────────────────────────────────────────────────┐
│ Cantidad:        10 unidades                    │
│ Precio Venta:    $10,000 MXN / unidad           │
│ Precio Compra:   $6,300 MXN / unidad            │
│ Precio Flete:    $500 MXN / unidad              │
│ Monto Pagado:    $100,000 MXN (pago completo)   │
└────────────────────────────────────────────────┘

DISTRIBUCIÓN:
┌────────────────────────────────────────────────┐
│ Total Venta = 10 × $10,000 = $100,000          │
│                                                 │
│ ├─ Bóveda Monte = 10 × $6,300 = $63,000        │
│ ├─ Flete Sur    = 10 × $500   = $5,000         │
│ └─ Utilidades   = 10 × $3,200 = $32,000        │
│                                                 │
│ VERIFICACIÓN: $63,000 + $5,000 + $32,000       │
│             = $100,000 ✓                        │
└────────────────────────────────────────────────┘
```

### 5.5 Estados de Pago

| Estado | Condición | Acción en Bancos |
|--------|-----------|------------------|
| **Completo** | `montoPagado >= totalVenta` | 100% distribuido a 3 bancos |
| **Parcial** | `0 < montoPagado < totalVenta` | Distribución proporcional |
| **Pendiente** | `montoPagado === 0` | Solo registro histórico, NO afecta capital |

### 5.6 Fórmula de Capital Bancario (INMUTABLE)

```typescript
// NUNCA modificar históricos directamente
// Los históricos son ACUMULATIVOS - solo suman

interface Banco {
  historicoIngresos: number;  // Solo aumenta
  historicoGastos: number;    // Solo aumenta
}

// Capital actual es SIEMPRE dinámico
const capitalActual = banco.historicoIngresos - banco.historicoGastos;
```

---

## 6. LOS 14 PANELES PREMIUM

### 6.1 Panel 1: Dashboard Infinity (El Más Importante)

**Especificaciones:**

| Elemento | Implementación |
|----------|----------------|
| **Fondo** | WebGPU shader QuantumVoid con partículas violeta/oro reactivas al mouse |
| **Hero Orb Central** | Esfera 3D con `MeshDistortMaterial`, pulsante, violeta |
| **KPI Cards (4)** | Tilt 3D, glow volumétrico oro, counter animations |
| **Activity Feed** | Lista con parallax, partículas que explotan en nuevas entradas |
| **AI Predictive Orb** | Esquina inferior, crece y muestra predicciones |

```typescript
const kpis = [
  { id: 'capital', label: 'Capital Total', value: '$8.9M', change: '+89.5%', color: 'gold' },
  { id: 'ventas', label: 'Ventas Hoy', value: '$124K', change: '+124%', color: 'violet' },
  { id: 'stock', label: 'Stock Live', value: '8,421 uds', change: '+19%', color: 'pink' },
  { id: 'clientes', label: 'Clientes Activos', value: '1,247', change: '+67%', color: 'white' },
];
```

### 6.2 Panel 2: Ventas Premium

**La estrella del sistema — Distribución de bancos interactiva:**

- Grid de ventas con cards 3D elevables
- Modal Nueva Venta con:
  - Sliders interactivos para distribución (suma = 100%)
  - Mini pie chart animado en tiempo real
  - Preview de ticket integrado
- Validación: stock suficiente, distribución correcta

### 6.3 Panel 3: Órdenes de Compra

- Timeline 3D de órdenes (estilo Vision Pro)
- Cards con profundidad real y sombras volumétricas
- Estados: Borrador → Enviada → Recibida → Pagada

### 6.4 Panel 4: Almacén Live

- Warehouse 3D interactivo (R3F) con cajas que se apilan/bajan
- Heatmap violeta/oro de stock bajo
- Entradas/Salidas visuales en tiempo real

### 6.5 Paneles 5-11: Los 7 Bancos (Template Reutilizable)

**Cada banco es un orb 3D gigante con valor flotando dentro:**

```tsx
// Uso del template
<PanelBanco config={BANCOS_CONFIG['boveda_monte']} />
<PanelBanco config={BANCOS_CONFIG['utilidades']} />
// etc...
```

- Click → entra en "modo banco" con partículas del color del banco
- 4 Tabs: Ingresos | Gastos | Transferencias | Cortes
- Transferencia = línea 3D que conecta orbes con trail effect

### 6.6 Panel 12: Clientes Premium

- Avatar 3D del cliente (Spline o Ready Player Me)
- Deuda = anillo violeta que se llena progresivamente
- CRM simplificado con segmentación y etiquetas
- Quick actions: llamar, email, abono

### 6.7 Panel 13: Reportes IA

- Gráficos 3D interactivos con drill-down
- Click y "entra" en el gráfico
- Insights automáticos generados por IA
- Exportación a PDF/Excel

### 6.8 Panel 14: IA / Tiempo Real

- Avatar 3D fullscreen (Spline nexbot_robot_character)
- Voz con ElevenLabs + Deepgram
- Fondo fractal violeta que responde a la voz
- 8 comandos de voz principales

---

## 7. COMPONENTES 3D Y SPLINE

### 7.1 Assets Disponibles en `/SPLINE COMPONENTS/`

| Archivo | Uso en Sistema |
|---------|----------------|
| `ai_voice_assistance_orb.spline` | Widget IA conversacional |
| `frosted_glass_texture_icon.spline` | Cards glassmorphism |
| `nexbot_robot_character_concept.spline` | Avatar IA fullscreen |
| `particle_nebula.spline` | Fondos inmersivos |
| `glass_buttons_inspired_by_reijo_palmiste.spline` | Botones premium |
| `3_d_drop_down.spline` | Menús desplegables 3D |
| `fire_particle_loader_animation.spline` | Loading states |

### 7.2 PremiumBankOrbs3D Component

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
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={config.floatIntensity}>
      <Trail width={2} length={6} color={config.color} attenuation={(t) => t * t}>
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
      <Sparkles count={50} scale={3} size={2} speed={0.4} color={config.color} />
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
        <Bloom intensity={2} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
        <ChromaticAberration offset={[0.002, 0.002]} />
      </EffectComposer>
    </Canvas>
  );
}
```

### 7.3 InfinityBackground Component

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

## 8. SHADERS WEBGPU AVANZADOS

### 8.1 QuantumVoidBackground.wgsl

```wgsl
// shaders/quantum-void.wgsl
@group(0) @binding(0) var<uniform> uTime: f32;
@group(0) @binding(1) var<uniform> uMouse: vec2<f32>;
@group(0) @binding(2) var<uniform> uResolution: vec2<f32>;

@fragment
fn main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = pos.xy / uResolution.xy;
    let mouse = uMouse / uResolution.xy;
    
    // Distancia al cursor con efecto imán
    let dist = distance(uv, mouse);
    let attraction = exp(-dist * 5.0);
    
    // Void espiral
    let angle = atan2(uv.y - 0.5, uv.x - 0.5);
    let spiral = sin(angle * 8.0 + length(uv - 0.5) * 20.0 - uTime * 2.0);
    let spiralNorm = spiral * 0.5 + 0.5;
    
    // Color violeta/oro dinámico
    let violet = vec3<f32>(0.545, 0.0, 1.0);   // #8B00FF
    let gold = vec3<f32>(1.0, 0.843, 0.0);      // #FFD700
    let pink = vec3<f32>(1.0, 0.078, 0.576);    // #FF1493
    
    var color = mix(violet, gold, spiralNorm * attraction);
    color = mix(color, pink, sin(uTime * 0.5) * 0.1 + 0.1);
    
    // Glow central
    let glow = 0.05 / (dist + 0.1);
    color = color + gold * glow * 0.3;
    
    return vec4<f32>(color * (0.2 + spiralNorm * 0.3), 1.0);
}
```

### 8.2 LiquidMetalOrb.wgsl

```wgsl
// shaders/liquid-metal.wgsl
@group(0) @binding(0) var<uniform> uTime: f32;
@group(0) @binding(1) var<uniform> uCapital: f32;

@fragment
fn main(@location(0) uv: vec2<f32>, @location(1) normal: vec3<f32>) -> @location(0) vec4<f32> {
    let center = vec2<f32>(0.5, 0.5);
    let dist = distance(uv, center);
    
    // Distorsión líquida
    let noise1 = sin(uv.x * 20.0 + uTime * 3.0) * cos(uv.y * 20.0 + uTime * 2.0);
    let noise2 = sin(dist * 15.0 - uTime * 4.0);
    let distort = noise1 * noise2 * 0.1;
    
    // Fresnel edge
    let viewDir = vec3<f32>(0.0, 0.0, 1.0);
    let fresnel = pow(1.0 - max(dot(normalize(normal), viewDir), 0.0), 3.0);
    
    // Color metálico con reflexión
    let baseColor = vec3<f32>(0.545, 0.0, 1.0); // Violeta
    let highlight = vec3<f32>(1.0, 0.843, 0.0); // Oro
    
    let color = mix(baseColor, highlight, fresnel + distort);
    
    // Intensidad basada en capital
    let intensity = 1.0 + uCapital / 5000000.0;
    
    let alpha = smoothstep(0.5, 0.45, dist);
    
    return vec4<f32>(color * intensity, alpha);
}
```

### 8.3 MoneyExplosion.wgsl

```wgsl
// shaders/money-explosion.wgsl
// Se activa cuando entra dinero a un banco

@group(0) @binding(0) var<uniform> uTime: f32;
@group(0) @binding(1) var<uniform> uTrigger: f32; // 0→1 cuando hay ingreso
@group(0) @binding(2) var<uniform> uResolution: vec2<f32>;

@fragment
fn main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = (pos.xy / uResolution.xy) - 0.5;
    let dist = length(uv);
    
    let explosion = smoothstep(0.0, 1.0, uTrigger - dist * 2.0);
    let ring = abs(sin(dist * 30.0 - uTime * 20.0)) * explosion;
    
    let color = vec3<f32>(1.0, 0.84, 0.0) * ring * 3.0;
    let colorWithPink = color + vec3<f32>(1.0, 0.3, 0.8) * explosion * 2.0;
    
    return vec4<f32>(colorWithPink, ring + explosion);
}
```

### 8.4 NeuralGridFloor.wgsl

```wgsl
// shaders/neural-grid.wgsl
// Suelo infinito con grid violeta pulsante

@group(0) @binding(0) var<uniform> uTime: f32;
@group(0) @binding(1) var<uniform> uMouse: vec2<f32>;

@fragment
fn main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = pos.xy / 800.0;
    let mouse = uMouse / 800.0;
    
    // Grid infinito
    let timeOffset = vec2<f32>(uTime * 0.05, 0.0);
    let grid = fract(uv * 10.0 - timeOffset);
    let lines = smoothstep(0.98, 1.0, max(grid.x, grid.y));
    
    // Líneas que fluyen hacia el cursor
    let flow = sin(length(uv - mouse) * 20.0 - uTime * 10.0);
    let pulse = abs(flow) * lines;
    
    let color = vec3<f32>(0.53, 0.0, 1.0) * pulse * 3.0;
    let colorWithGold = color + vec3<f32>(1.0, 0.84, 0.0) * lines * 0.5;
    
    return vec4<f32>(colorWithGold, pulse + lines * 0.3);
}
```

---

## 9. SISTEMA DE ANIMACIONES

### 9.1 Duraciones Estándar

| Tipo | Duración | Uso |
|------|----------|-----|
| Hover/Focus | 800-1200ms | Cards, botones |
| Page Transitions | 1000-1400ms | Cambio de rutas |
| Scroll-triggered | scrub 1.2-1.8 | Parallax |
| Micro-interacciones | 600-900ms | Ripples, glows |
| Orbs respiración | 8000ms ciclo | Animación ambiental |

### 9.2 Hover de Lujo Infinito

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

### 9.3 Entrada de Páginas

```tsx
<motion.div
  initial={{ opacity: 0, y: 60 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: 1.4,
    ease: [0.22, 1, 0.36, 1], // butter
    type: "spring",
    stiffness: 80,
    damping: 32,
    mass: 1.2
  }}
/>
```

### 9.4 Orbs que Respiran

```tsx
<motion.div
  animate={{
    scale: [1, 1.04, 1],
    filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"],
  }}
  transition={{
    duration: 8,
    repeat: Infinity,
    ease: [0.4, 0, 0.2, 1], // breathe
  }}
/>
```

---

## 10. INTERACTIVIDAD INMERSIVA

### 10.1 Cursor Personalizado Ultra-Suave

```tsx
// app/_components/ui-premium/MagneticCursor.tsx
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

### 10.2 Glass Infinity CSS

```css
/* app/styles/chronos-design-system.css */
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

### 10.3 Micro-Interacciones Premium

| Elemento | Efecto |
|----------|--------|
| Botones | Ripple violeta/oro que se expande desde punto de click |
| Cards | Tilt 3D suave (±6°) + elevación 16px + glow interno |
| Inputs | Borde violeta/oro que crece suavemente al focus |
| Drag & Drop | Física real con damping alto (cristal líquido) |
| Hover global | Trail de partículas siguiendo cursor |

---

## 11. SISTEMA IA CONVERSACIONAL

### 11.1 Arquitectura de 5 Servicios IA

| Servicio | Función |
|----------|---------|
| **MegaAIAgent** | Asistente conversacional principal |
| **AIScheduledReports** | Reportes automáticos programados |
| **AIFormAutomation** | Autocompletado inteligente de formularios |
| **AIPowerBI** | Insights y predicciones de datos |
| **UserLearning** | Aprendizaje de patrones del usuario |

### 11.2 Comandos de Voz (8 Principales)

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

### 11.3 Integración Web Speech API

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

## 12. FASES DE IMPLEMENTACIÓN

### FASE 1: Preparación y Limpieza (2 horas)

```bash
# 1.1 Backup
git checkout -b backup/pre-elevation-$(date +%Y%m%d)
git add -A && git commit -m "backup: pre-elevation"

# 1.2 Eliminar duplicados
rm -rf hooks/ lib/ components/  # Raíz
rm -rf gg/ docs/archive/

# 1.3 Consolidar paneles
# Renombrar *Premium.tsx a versión estándar
cd app/components/panels/
mv BentoVentasPremium.tsx BentoVentas.tsx
mv BentoClientesPremium.tsx BentoClientes.tsx
# ... etc

# 1.4 Consolidar CSS
# Crear chronos-design-system.css unificado
```

### FASE 2: Design System (3 horas)

- Implementar paleta oficial en Tailwind config
- Crear CSS variables globales
- Implementar componentes glass-infinity
- Agregar easings y springs personalizados

### FASE 3: Componentes 3D (4 horas)

- Integrar React Three Fiber
- Crear PremiumBankOrbs3D
- Crear InfinityBackground
- Implementar SplineScene wrapper
- Integrar assets de `/SPLINE COMPONENTS/`

### FASE 4: Shaders WebGPU (3 horas)

- Implementar QuantumVoidBackground
- Implementar LiquidMetalOrb
- Implementar MoneyExplosion
- Agregar fallbacks para navegadores sin WebGPU

### FASE 5: Dashboard Infinity (4 horas)

- Reescribir Dashboard2026Ultra con todos los efectos
- Implementar KPI cards con tilt 3D
- Agregar Activity Feed con parallax
- Integrar AI Predictive Orb

### FASE 6: Paneles Restantes (6 horas)

- Actualizar cada panel con nuevo design system
- Agregar animaciones spring physics
- Implementar modales glass-infinity
- Agregar micro-interacciones

### FASE 7: Command Menu y Navegación (2 horas)

- Implementar Cmd+K con cmdk
- Agregar búsqueda fuzzy
- Animación de apertura tipo portal

### FASE 8: IA Conversacional (3 horas)

- Integrar Spline nexbot para avatar
- Implementar Web Speech API
- Agregar comandos de voz

### FASE 9: Performance y Testing (2 horas)

- Optimizar bundle con dynamic imports
- Agregar lazy loading para 3D
- Verificar 60fps en móvil
- Lighthouse audit

### FASE 10: Deploy (1 hora)

- Build final
- Configurar Vercel env vars
- Deploy a producción
- Verificación final

---

## 13. VERIFICACIÓN Y DEPLOY

### 13.1 Checklist Pre-Deploy

```bash
# TypeScript
pnpm type-check     # 0 errores

# Linting
pnpm lint           # 0 warnings

# Build
pnpm build          # Exitoso

# Tests
pnpm test           # 90%+ coverage
pnpm test:e2e       # Todos pasan
```

### 13.2 Métricas de Éxito

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

### 13.3 Deploy Commands

```bash
# Link proyecto
vercel link

# Configurar env vars
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add FIREBASE_API_KEY
# ... etc

# Deploy producción
vercel --prod
```

---

## 14. PROMPTS DE EJECUCIÓN

### 14.1 Prompt Maestro Universal

```
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

### 14.2 Prompt de Limpieza Automática

```
@workspace

EJECUTA LA LIMPIEZA DEFINITIVA DE CHRONOS:

## FASE 1: ELIMINAR DUPLICADOS
rm -rf hooks/ lib/ components/  # En raíz
rm -rf gg/ docs/archive/

## FASE 2: CONSOLIDAR PANELES
cd app/components/panels/
mv BentoVentasPremium.tsx BentoVentas.tsx
mv BentoClientesPremium.tsx BentoClientes.tsx
mv BentoDistribuidoresPremium.tsx BentoDistribuidores.tsx
mv BentoAlmacenPremium.tsx BentoAlmacen.tsx
mv BentoOrdenesCompraPremium.tsx BentoOrdenes.tsx
mv BentoReportesPremium.tsx BentoReportes.tsx

## FASE 3: ACTUALIZAR IMPORTS
Buscar y reemplazar todos los *Premium por versión estándar

## FASE 4: VERIFICAR
pnpm type-check
pnpm lint --fix
pnpm build

Reporta resultado de cada paso.
```

### 14.3 Prompt de Elevación Visual

```
@workspace

MODO INMERSIÓN SUAVE INFINITA — CHRONOS 2026-2027

Aplica la capa final de inmersión sobre todo el proyecto:

BLOQUE 1 → SCROLL SUAVE
- Instalar Lenis + GSAP ScrollSmoother
- Easing: power4.out en todas las transiciones
- Cursor con trail violeta/oro

BLOQUE 2 → 3D INMERSIVO
- Cada panel con profundidad Z (translateZ 0-80px)
- Tilt 3D suave al hover (±6° máximo)
- Orbs que respiran (scale 0.98 → 1.02)

BLOQUE 3 → SHADERS
- Implementar QuantumVoid en fondo
- LiquidMetal en orbs de bancos
- MoneyExplosion cuando entra dinero

BLOQUE 4 → MICRO-INTERACCIONES
- Hover: scale 1.02 + translateY -8px + glow
- Click: ripple violeta/oro
- Focus: borde que crece suavemente

BLOQUE 5 → VERIFICACIÓN
- 0 saltos visuales
- 120+ FPS
- Todo fluye como mantequilla líquida

Ejecuta y reporta por bloque.
```

---

## RESUMEN EJECUTIVO

**CHRONOS INFINITY 2026** es:

- ✨ **El sistema de diseño más avanzado**: WebGPU, R3F, spring physics
- 🎨 **El más bello**: Violeta, oro, rosa sobre negro absoluto
- 🚀 **El más performant**: 60fps, Lighthouse 100, TTI < 600ms
- 🤖 **El más inteligente**: IA conversacional con voz
- 💰 **El más preciso**: Lógica GYA inmutable y verificada
- 🌟 **El más inmersivo**: 3D, partículas, shaders, física real

---

**Paleta inamovible**: `#000000` | `#8B00FF` | `#FFD700` | `#FF1493`

**CYAN PROHIBIDO PARA SIEMPRE.**

---

*Documento: CHRONOS_INFINITY_2026_PLAN_MAESTRO_COMPLETO.md*  
*Versión: 1.0.0*  
*Fecha: Diciembre 2025*  
*Estado: LISTO PARA EJECUCIÓN INMEDIATA*

---

> *"El futuro es violeta y oro. Y ya está aquí."*
