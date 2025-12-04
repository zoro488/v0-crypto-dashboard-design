# 🚀 BLUEPRINT MAESTRO CHRONOS 2026
## Sistema de Gestión Financiera Ultra-Premium

---

> **VERSIÓN DEFINITIVA** — Consolidación de ESTRATEGIA_DEFINITIVA + Tipos + Fórmulas + Constantes
> 
> **Objetivo**: Sistema 100% funcional, ultra-premium, real-time, con diseño nivel Apple Vision Pro

---

## 📋 ÍNDICE COMPLETO

1. [Arquitectura del Sistema](#1-arquitectura-del-sistema)
2. [Lógica de Negocio Exacta](#2-lógica-de-negocio-exacta)
3. [Los 7 Bancos](#3-los-7-bancos)
4. [Fórmulas Críticas](#4-fórmulas-críticas)
5. [Los 14 Paneles](#5-los-14-paneles)
6. [Stack Tecnológico](#6-stack-tecnológico)
7. [Diseño Premium](#7-diseño-premium)
8. [Prompts para Cada Panel](#8-prompts-para-cada-panel)
9. [Persistencia de Datos](#9-persistencia-de-datos)
10. [Implementación](#10-implementación)

---

## 1. ARQUITECTURA DEL SISTEMA

### 1.1 Vista General

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHRONOS 2026 SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  DASHBOARD  │  │   VENTAS    │  │   ÓRDENES   │  ← 14       │
│  │   (KPIs)    │  │  (CRUD+GYA) │  │  (COMPRA)   │    PANELES  │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   CLIENTES  │  │DISTRIBUIDORES│ │   ALMACÉN   │             │
│  │  (31 reg)   │  │   (6 reg)   │  │   (STOCK)   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────────────────────────────────────────┐           │
│  │              7 BANCOS / BÓVEDAS                 │           │
│  │  Monte | USA | Utilidades | Fletes | Azteca    │           │
│  │  Leftie | Profit                                │           │
│  └─────────────────────────────────────────────────┘           │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │  REPORTES   │  │  GASTOS Y   │                              │
│  │  (Builder)  │  │   ABONOS    │                              │
│  └─────────────┘  └─────────────┘                              │
├─────────────────────────────────────────────────────────────────┤
│                    CAPA DE DATOS                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ZUSTAND STORE  +  INDEXEDDB  (Persistencia Local)       │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  bancos[] | ventas[] | ordenes[] | clientes[]      │ │  │
│  │  │  distribuidores[] | almacen[] | movimientos[]      │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    CAPA DE UI                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  shadcn/ui + Framer Motion + WebGPU Shaders             │  │
│  │  Paleta: Negro + Violeta + Dorado + Rosa (NO CYAN)      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Estructura de Carpetas (Actual)

```
app/
├── components/
│   ├── panels/           # 17 paneles Bento*
│   │   ├── BentoDashboard.tsx
│   │   ├── BentoVentas.tsx / BentoVentasPremium.tsx
│   │   ├── BentoBanco.tsx
│   │   ├── BentoClientes.tsx / BentoClientesPremium.tsx
│   │   ├── BentoDistribuidores.tsx
│   │   ├── BentoAlmacen.tsx / BentoAlmacenPremium.tsx
│   │   ├── BentoOrdenesCompra.tsx
│   │   └── reports/
│   ├── modals/           # Formularios CRUD (*ModalSmart.tsx)
│   ├── ui/               # shadcn/ui components
│   ├── widgets/          # Componentes 3D/Premium
│   └── visualizations/   # 8 Canvas components (60fps)
├── hooks/                # useFirestoreCRUD, useAuth, etc.
├── lib/
│   ├── formulas.ts       # ⭐ TODAS las fórmulas del negocio
│   ├── constants.ts      # ⭐ Configuración de 7 bancos
│   ├── store/            # useAppStore.ts (Zustand)
│   ├── schemas/          # Validación Zod
│   └── firebase/         # Servicios Firestore (a reemplazar)
└── types/
    └── index.ts          # ⭐ TODOS los tipos del sistema
```

---

## 2. LÓGICA DE NEGOCIO EXACTA

### 2.1 Flujo de Venta (CRÍTICO)

```
VENTA NUEVA
    │
    ├── 1. Cliente selecciona producto (de OC con stock)
    │
    ├── 2. Se ingresa: cantidad, precioVenta, flete, montoPagado
    │
    ├── 3. CÁLCULO AUTOMÁTICO:
    │       ├── precioCompra = OC.costoDistribuidor
    │       ├── totalVenta = precioVenta × cantidad
    │       └── DISTRIBUCIÓN GYA:
    │             ├── Bóveda Monte = precioCompra × cantidad (COSTO)
    │             ├── Flete Sur = precioFlete × cantidad (FLETE)
    │             └── Utilidades = (precioVenta - precioCompra - precioFlete) × cantidad
    │
    ├── 4. ESTADO DE PAGO:
    │       ├── COMPLETO: montoPagado >= totalVenta
    │       │     └── Distribuye 100% a los 3 bancos
    │       ├── PARCIAL: 0 < montoPagado < totalVenta
    │       │     └── Distribuye proporcionalmente (montoPagado/totalVenta × cada banco)
    │       └── PENDIENTE: montoPagado = 0
    │             └── Solo registra en histórico, NO afecta capital actual
    │
    └── 5. ACTUALIZA AUTOMÁTICAMENTE:
            ├── Stock de OC relacionada (stockActual -= cantidad)
            ├── Saldo de cliente (deuda += montoRestante)
            ├── Capital de los 3 bancos
            └── UI se actualiza en tiempo real
```

### 2.2 Flujo de Orden de Compra

```
ORDEN NUEVA
    │
    ├── 1. Selecciona distribuidor
    │
    ├── 2. Se ingresa: cantidad, costoDistribuidor, costoTransporte, pagoInicial
    │
    ├── 3. CÁLCULO:
    │       ├── costoPorUnidad = costoDistribuidor + costoTransporte
    │       ├── costoTotal = costoPorUnidad × cantidad
    │       ├── deuda = costoTotal - pagoInicial
    │       └── stockInicial = cantidad
    │
    └── 4. ACTUALIZA:
            ├── Saldo del distribuidor
            ├── Inventario disponible para ventas
            └── Si pagoInicial > 0: afecta banco origen
```

### 2.3 Flujo de Abono

```
ABONO (de cliente o a distribuidor)
    │
    ├── 1. Selecciona entidad (cliente o distribuidor)
    │
    ├── 2. Se ingresa: monto, bancoDestino, metodoPago
    │
    └── 3. DISTRIBUCIÓN PROPORCIONAL:
            │
            ├── Para CLIENTE:
            │     ├── Obtiene ventas pendientes del cliente
            │     ├── Calcula proporción del abono vs deuda
            │     └── Distribuye proporcionalmente a Bóveda Monte, Fletes, Utilidades
            │
            └── Para DISTRIBUIDOR:
                  └── Reduce deuda directamente (no hay distribución a 3 bancos)
```

---

## 3. LOS 7 BANCOS

### 3.1 Configuración Completa

| ID | Nombre | Tipo | Moneda | Descripción | Recibe de Ventas |
|----|--------|------|--------|-------------|------------------|
| `boveda_monte` | Bóveda Monte | `boveda` | MXN | Capital principal | ✅ (COSTO) |
| `boveda_usa` | Bóveda USA | `boveda` | USD | Capital en dólares | ❌ |
| `utilidades` | Utilidades | `utilidades` | MXN | Ganancias netas | ✅ (GANANCIA) |
| `flete_sur` | Flete Sur | `gastos` | MXN | Gastos de transporte | ✅ (FLETE) |
| `azteca` | Azteca | `operativo` | MXN | Banco externo | ❌ |
| `leftie` | Leftie | `operativo` | MXN | Negocio secundario | ❌ |
| `profit` | Profit | `operativo` | MXN | Utilidades distribuidas | ❌ |

### 3.2 Regla de Distribución (Los 3 Bancos que Reciben Ventas)

```typescript
// Solo estos 3 bancos reciben dinero automáticamente de cada venta:
const BANCOS_DISTRIBUCION = ['boveda_monte', 'flete_sur', 'utilidades']

// Fórmula para cada uno:
Bóveda Monte = precioCompra × cantidad          // COSTO del producto
Flete Sur    = precioFlete × cantidad           // Costo de TRANSPORTE
Utilidades   = (precioVenta - precioCompra - precioFlete) × cantidad  // GANANCIA NETA
```

### 3.3 Fórmula de Capital

```typescript
// Para CUALQUIER banco:
capitalActual = historicoIngresos - historicoGastos

// IMPORTANTE: historicoIngresos y historicoGastos son ACUMULATIVOS
// y NUNCA disminuyen (principio de inmutabilidad contable)
```

---

## 4. FÓRMULAS CRÍTICAS

### 4.1 Fórmulas de Venta (app/lib/formulas.ts)

```typescript
// Distribución GYA (Ganancia Y Asignación)
function calcularDistribucionGYA(datos: DatosVentaCalculo): DistribucionGYA {
  const { cantidad, precioVenta, precioCompra, precioFlete = 500 } = datos
  
  const bovedaMonte = precioCompra * cantidad       // COSTO
  const fletes = precioFlete * cantidad             // TRANSPORTE
  const utilidades = (precioVenta - precioCompra - precioFlete) * cantidad  // GANANCIA
  const total = bovedaMonte + fletes + utilidades
  
  return { bovedaMonte, fletes, utilidades, total }
}

// Venta completa con estado de pago
function calcularVentaCompleta(datos: DatosVentaCalculo): ResultadoVenta {
  const totalVenta = precioVenta * cantidad
  const distribucionBase = calcularDistribucionGYA(datos)
  
  // Determinar estado
  let proporcionPagada = montoPagado / totalVenta
  let estadoPago = 'pendiente'
  if (montoPagado >= totalVenta) {
    estadoPago = 'completo'
    proporcionPagada = 1
  } else if (montoPagado > 0) {
    estadoPago = 'parcial'
  }
  
  // Distribución real según lo pagado
  const distribucionReal = {
    bovedaMonte: distribucionBase.bovedaMonte * proporcionPagada,
    fletes: distribucionBase.fletes * proporcionPagada,
    utilidades: distribucionBase.utilidades * proporcionPagada,
  }
  
  return { ...distribucionBase, estadoPago, distribucionReal, ... }
}
```

### 4.2 Ejemplo Numérico Concreto

```
DATOS DE VENTA:
- Cantidad: 10 unidades
- Precio Venta: $10,000 MXN por unidad
- Precio Compra: $6,300 MXN por unidad (de la OC)
- Flete: $500 MXN por unidad

CÁLCULOS:
┌─────────────────────────────────────────────────────────────┐
│ Total Venta = 10 × $10,000 = $100,000 MXN                   │
├─────────────────────────────────────────────────────────────┤
│ DISTRIBUCIÓN:                                               │
│   Bóveda Monte = 10 × $6,300  = $63,000 (COSTO)            │
│   Flete Sur    = 10 × $500    = $5,000  (TRANSPORTE)       │
│   Utilidades   = 10 × ($10,000-$6,300-$500) = $32,000      │
│   ─────────────────────────────────────────                 │
│   TOTAL DISTRIBUIDO = $100,000 ✓                           │
└─────────────────────────────────────────────────────────────┘

SI PAGO ES PARCIAL ($50,000):
┌─────────────────────────────────────────────────────────────┐
│ Proporción = $50,000 / $100,000 = 50%                       │
│                                                             │
│ DISTRIBUCIÓN REAL:                                          │
│   Bóveda Monte = $63,000 × 50% = $31,500                   │
│   Flete Sur    = $5,000 × 50%  = $2,500                    │
│   Utilidades   = $32,000 × 50% = $16,000                   │
│   ─────────────────────────────────────────                 │
│   TOTAL DISTRIBUIDO = $50,000 ✓                            │
│                                                             │
│ Deuda Cliente = $50,000                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. LOS 14 PANELES

### 5.1 Mapa de Paneles

| # | Panel | Descripción | Colecciones |
|---|-------|-------------|-------------|
| 1 | Dashboard | KPIs principales, resumen financiero | Todas |
| 2 | Ventas | CRUD ventas + distribución GYA | `ventas`, `clientes`, `ordenes_compra` |
| 3 | Órdenes de Compra | Gestión de OCs | `ordenes_compra`, `distribuidores` |
| 4 | Bóveda Monte | Panel banco principal | `movimientos` (boveda_monte) |
| 5 | Bóveda USA | Panel banco USD | `movimientos` (boveda_usa) |
| 6 | Utilidades | Panel ganancias | `movimientos` (utilidades) |
| 7 | Flete Sur | Panel fletes | `movimientos` (flete_sur) |
| 8 | Azteca | Panel banco externo | `movimientos` (azteca) |
| 9 | Leftie | Panel negocio secundario | `movimientos` (leftie) |
| 10 | Profit | Panel utilidades distribuidas | `movimientos` (profit) |
| 11 | Distribuidores | CRUD distribuidores (6 registros) | `distribuidores` |
| 12 | Clientes | CRUD clientes (31 registros) | `clientes` |
| 13 | Almacén | Inventario y stock | `almacen`, `ordenes_compra` |
| 14 | Reportes | Generador de reportes | Todas |

### 5.2 Especificación de Cada Panel

#### PANEL 1: Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ DASHBOARD - KPIs PRINCIPALES                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Capital  │ │ Ventas   │ │ Ganancia │ │ Deudas   │       │
│  │ Total    │ │ Hoy      │ │ Mes      │ │ Pendient │       │
│  │ $XXX,XXX │ │ $XX,XXX  │ │ $XX,XXX  │ │ $XX,XXX  │       │
│  │   +12%   │ │   +5%    │ │  +23%    │ │  -8%     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 7 BANCOS - BARRA HORIZONTAL COMPARATIVA              │  │
│  │ ████████████ Bóveda Monte $XXX                       │  │
│  │ ████████ Bóveda USA $XXX                             │  │
│  │ ██████ Utilidades $XXX                               │  │
│  │ ████ Flete Sur $XXX                                  │  │
│  │ ██ Azteca $XXX                                       │  │
│  │ ██ Leftie $XXX                                       │  │
│  │ █ Profit $XXX                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────┐ ┌─────────────────────────────┐   │
│  │ GRÁFICO TENDENCIA   │ │ ÚLTIMOS MOVIMIENTOS         │   │
│  │ Line chart 30 días  │ │ • Venta $5,000 → Cliente X  │   │
│  │ Ingresos vs Gastos  │ │ • Abono $2,000 ← Cliente Y  │   │
│  │                     │ │ • OC $15,000 → PACMAN       │   │
│  └─────────────────────┘ └─────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### PANEL 2: Ventas

```
┌─────────────────────────────────────────────────────────────┐
│ VENTAS - 96 registros                            [+ Nueva]  │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Buscar] [📅 Fecha] [👤 Cliente] [📦 OC] [💳 Estado]     │
├─────────────────────────────────────────────────────────────┤
│ # │ Fecha      │ Cliente    │ OC    │ Cant │ Total    │ Est │
│───┼────────────┼────────────┼───────┼──────┼──────────┼─────│
│ 1 │ 01/12/2024 │ Juan Pérez │ OC001 │ 10   │ $100,000 │ ✓   │
│ 2 │ 02/12/2024 │ María L.   │ OC002 │ 5    │ $45,000  │ ◐   │
│ 3 │ 03/12/2024 │ Carlos R.  │ OC001 │ 3    │ $30,000  │ ○   │
│...│ ...        │ ...        │ ...   │ ...  │ ...      │ ... │
├─────────────────────────────────────────────────────────────┤
│ Estados: ✓ Pagado (verde) │ ◐ Parcial (amarillo) │ ○ Pend. │
└─────────────────────────────────────────────────────────────┘

MODAL NUEVA VENTA:
┌─────────────────────────────────────────────────────────────┐
│ NUEVA VENTA                                          [X]    │
├─────────────────────────────────────────────────────────────┤
│ Cliente: [Combobox con búsqueda - 31 clientes]              │
│ OC Relacionada: [Select - Solo OCs con stock > 0]           │
│ Cantidad: [Input numérico - Max: stock de OC]               │
│ Precio Venta: [Input - Por unidad]                          │
│ Flete: [Toggle Aplica/No Aplica]                            │
│ Monto Pagado: [Input o Slider 0-100%]                       │
│ Método Pago: [efectivo|transferencia|crypto|cheque]         │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PREVIEW DISTRIBUCIÓN (en tiempo real):                  │ │
│ │   Total Venta:    $100,000                              │ │
│ │   ────────────────────────────────                      │ │
│ │   Bóveda Monte:   $63,000 (COSTO)                       │ │
│ │   Flete Sur:      $5,000  (FLETE)                       │ │
│ │   Utilidades:     $32,000 (GANANCIA)                    │ │
│ │   ────────────────────────────────                      │ │
│ │   Estado: COMPLETO ✓                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                              [Cancelar] [Guardar Venta]     │
└─────────────────────────────────────────────────────────────┘
```

#### PANEL 4-10: Banco (Template Reutilizable)

```
┌─────────────────────────────────────────────────────────────┐
│ [NOMBRE BANCO]                                [+ Ingreso/Gasto] │
│ $XXX,XXX.XX MXN                                  +12.5%     │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────┐ ┌───────────────────┐                 │
│ │ Ingresos Mes      │ │ Gastos Mes        │                 │
│ │ $XX,XXX          │ │ $XX,XXX           │                 │
│ │ +8% vs anterior   │ │ -3% vs anterior   │                 │
│ └───────────────────┘ └───────────────────┘                 │
│                                                             │
│ [Ingresos] [Gastos] [Transferencias] [Cortes]               │
├─────────────────────────────────────────────────────────────┤
│ TABLA DE MOVIMIENTOS                                        │
│ # │ Fecha      │ Tipo    │ Concepto       │ Monto          │
│───┼────────────┼─────────┼────────────────┼────────────────│
│ 1 │ 01/12/2024 │ Ingreso │ Venta V-001    │ +$10,000       │
│ 2 │ 02/12/2024 │ Gasto   │ Pago proveedor │ -$5,000        │
│...│            │         │                │                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. STACK TECNOLÓGICO

### 6.1 Core

```json
{
  "framework": "Next.js 15 (App Router)",
  "react": "19",
  "typescript": "5.6+ (strict mode)",
  "styling": "Tailwind CSS + shadcn/ui",
  "state": "Zustand + persist middleware",
  "storage": "IndexedDB (via idb library)",
  "validation": "Zod",
  "forms": "react-hook-form + @hookform/resolvers"
}
```

### 6.2 UI/UX Premium

```json
{
  "animations": "Framer Motion 11",
  "3d": "@react-three/fiber + drei",
  "spline": "@splinetool/react-spline",
  "charts": "Recharts + D3",
  "tables": "@tanstack/react-table",
  "icons": "lucide-react"
}
```

### 6.3 Paleta de Colores (OBLIGATORIA)

```css
:root {
  /* COLORES PRIMARIOS */
  --negro:   #000000;
  --violeta: #8B00FF;
  --dorado:  #FFD700;
  --rosa:    #FF1493;
  --blanco:  #FFFFFF;
  
  /* PROHIBIDO: NO USAR CYAN */
  /* --cyan: #00FFFF; ← NUNCA */
  
  /* Gradientes permitidos */
  --gradient-primary: linear-gradient(135deg, #8B00FF, #FF1493);
  --gradient-gold: linear-gradient(135deg, #FFD700, #FFA500);
  --gradient-dark: linear-gradient(180deg, #000000, #1a1a2e);
}
```

---

## 7. DISEÑO PREMIUM

### 7.1 Nivel de Referencia

- **Apple Vision Pro**: Glassmorphism extremo, efectos de profundidad
- **Tesla App**: Minimalismo dark, datos en tiempo real
- **Grok.com**: Tipografía bold, contrastes dramáticos

### 7.2 Elementos Clave

```typescript
// Card Premium
const cardStyles = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(139,0,255,0.2)', // Violeta sutil
  borderRadius: '24px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
}

// Efecto hover
const hoverEffect = {
  scale: 1.02,
  boxShadow: '0 12px 48px rgba(139,0,255,0.3)',
  transition: { duration: 0.3, ease: 'easeOut' }
}

// Animación de entrada
const entryAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
}
```

### 7.3 Tipografía

```css
/* Títulos */
.heading-premium {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #FFFFFF, rgba(255,255,255,0.7));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Montos grandes */
.amount-large {
  font-family: 'Space Grotesk', monospace;
  font-size: 3rem;
  font-weight: 600;
  color: #FFD700; /* Dorado */
}
```

---

## 8. PROMPTS PARA CADA PANEL

### 8.1 Prompt Base (Usar en Todos)

```
CONTEXTO OBLIGATORIO:
- Sistema: CHRONOS 2026 - Gestión Financiera Ultra-Premium
- Stack: Next.js 15 + React 19 + TypeScript 5.6 + Tailwind + shadcn/ui
- Estado: Zustand (useAppStore) + IndexedDB para persistencia
- Fórmulas: Usar SIEMPRE app/lib/formulas.ts
- Tipos: Usar SIEMPRE app/types/index.ts
- Paleta: Negro #000, Violeta #8B00FF, Dorado #FFD700, Rosa #FF1493, Blanco #FFF
- PROHIBIDO: Cyan, cualquier tono azul-verdoso, Firebase

REQUERIMIENTOS UI:
1. Diseño nivel Apple Vision Pro + Tesla App
2. Glassmorphism con blur(20px) mínimo
3. Animaciones Framer Motion en TODO
4. Hover effects suaves con scale(1.02)
5. Gradientes violeta→rosa o dorado→naranja
6. Tipografía: Inter para UI, Space Grotesk para montos
7. Border radius: 16px mínimo, 24px preferido
8. Sombras profundas con opacidad de colores
```

### 8.2 Prompt: Panel Dashboard

```
Crea el panel DASHBOARD PREMIUM para CHRONOS 2026 con estas especificaciones EXACTAS:

LAYOUT:
- Container: full width, min-height: 100vh, background: gradiente negro→violeta oscuro
- Grid Bento: 12 columnas, gap-6

COMPONENTES:

1. HEADER (span 12):
   - Título: "CHRONOS" con gradient text (violeta→rosa)
   - Fecha actual con formato elegante
   - Avatar usuario con efecto glassmorphism

2. KPI CARDS (4 cards, span 3 cada una):
   - Card 1: Capital Total (suma de 7 bancos)
   - Card 2: Ventas Hoy (suma ventas fecha actual)
   - Card 3: Ganancia Mes (suma utilidades del mes)
   - Card 4: Deudas Pendientes (suma deuda clientes + distribuidores)
   
   Cada card:
   - Background: glassmorphism violeta/20
   - Icono animado con pulse suave
   - Monto grande en dorado (Space Grotesk)
   - Variación % con color (verde +, rojo -)
   - Sparkline mini chart

3. BANCOS OVERVIEW (span 8):
   - 7 barras horizontales animadas
   - Cada banco con su color del gradiente
   - Hover: muestra tooltip con detalle
   - Click: navega al panel del banco

4. ÚLTIMOS MOVIMIENTOS (span 4):
   - Lista scrolleable de últimas 10 transacciones
   - Cada item: icono + concepto + monto + tiempo relativo
   - Animación de entrada staggered

5. GRÁFICO TENDENCIA (span 6):
   - Area chart 30 días
   - Línea ingresos (dorado)
   - Línea gastos (rosa)
   - Área fill con gradient
   - Tooltip detallado al hover

6. DISTRIBUCIÓN PIE (span 6):
   - Donut chart de capital por banco
   - Centro: capital total animado
   - Leyenda interactiva
   - Colores del gradiente sistema

DATOS:
- Usar useAppStore() para obtener bancos, ventas, movimientos
- Implementar useMemo para cálculos pesados
- Real-time: actualizar cada 30s

ANIMACIONES:
- Entry: stagger 0.1s por componente
- Numbers: animación de conteo (countup)
- Charts: draw animation al montar
- Hover: scale(1.02) + shadow violeta
```

### 8.3 Prompt: Panel Ventas

```
Crea el panel VENTAS PREMIUM para CHRONOS 2026 con estas especificaciones EXACTAS:

LAYOUT:
- Container: max-w-7xl mx-auto, padding 6
- Background: gradiente negro con partículas sutiles

COMPONENTES:

1. HEADER:
   - Título: "Ventas" con icono ShoppingCart
   - Stats rápidos: Total ventas | Ventas hoy | Pendientes pago
   - Botón "+ Nueva Venta" (gradient violeta→rosa, glow effect)

2. FILTROS:
   - SearchInput: buscar por cliente, OC, concepto
   - DateRangePicker: fecha inicio - fin
   - Select Cliente: combobox con 31 clientes
   - Select Estado: Todos | Pagado | Parcial | Pendiente
   - Select OC: filtrar por orden de compra

3. TABLA VENTAS:
   - Usar @tanstack/react-table
   - Columnas:
     1. Fecha (format: DD/MMM/YYYY)
     2. Cliente (link a cliente)
     3. OC Relacionada (link a OC)
     4. Cantidad
     5. Precio Venta (formateado MXN)
     6. Total ($cantidad × precioVenta)
     7. Distribución: Mini badges (BM | FL | UT)
     8. Estado: Badge con color
     9. Acciones: Ver | Editar | Abonar
   
   - Row hover: highlight + show details
   - Expandable row: muestra distribución completa
   - Pagination: 20 items por página
   - Sorting: click en headers

4. MODAL NUEVA VENTA:
   - react-hook-form + zod validation
   - Campos:
     a. Cliente (Combobox con búsqueda)
     b. OC Relacionada (Select con stock disponible)
     c. Cantidad (Input, max = stock de OC)
     d. Precio Venta (Input, default de OC)
     e. Flete (Toggle + monto si aplica)
     f. Monto Pagado (Slider 0-100% + input)
     g. Método Pago (Select)
   
   - PREVIEW EN TIEMPO REAL:
     - Mostrar cálculo de distribución mientras se llena
     - Usar calcularVentaCompleta() de formulas.ts
     - Barras animadas para cada banco
     - Estado de pago con color

5. ON SUBMIT:
   - Validar stock disponible
   - Crear venta con distribución calculada
   - Actualizar stock de OC
   - Actualizar saldo cliente
   - Actualizar capital de 3 bancos
   - Cerrar modal
   - Mostrar toast éxito
   - Refrescar tabla

LÓGICA CRÍTICA:
- Importar { calcularVentaCompleta, calcularDistribucionGYA } from '@/app/lib/formulas'
- precioCompra viene de OC.costoDistribuidor
- precioFlete default = 500 si aplica
- Distribución SIEMPRE a boveda_monte, flete_sur, utilidades

ANIMACIONES:
- Modal: slide-up + fade
- Preview: números animados
- Submit: loading spinner + success animation
- Toast: slide-in desde esquina
```

### 8.4 Prompt: Panel Banco (Template)

```
Crea el componente PANEL BANCO PREMIUM reutilizable para los 7 bancos:

PROPS:
interface BancoPanelProps {
  bancoId: BancoId  // 'boveda_monte' | 'boveda_usa' | etc.
}

LAYOUT:
- Container full width con background específico del banco
- Header con info del banco
- Tabs: Resumen | Ingresos | Gastos | Transferencias | Cortes

COMPONENTES:

1. HEADER BANCO:
   - Icono grande animado (según tipo banco)
   - Nombre del banco con gradiente de su color
   - Capital actual grande (Space Grotesk, dorado)
   - Variación % vs mes anterior
   - Badge de estado (activo/inactivo/negativo)

2. KPI CARDS (3):
   - Ingresos del mes
   - Gastos del mes
   - Balance neto
   - Cada uno con sparkline

3. TABS CONTENT:

   TAB RESUMEN:
   - Area chart últimos 30 días
   - Top 5 conceptos de ingreso
   - Top 5 conceptos de gasto

   TAB INGRESOS:
   - Tabla de movimientos tipo='ingreso'
   - Columnas: Fecha | Concepto | Origen | Monto | Referencia
   - Filtros: fecha, concepto
   - Botón "+ Registrar Ingreso"

   TAB GASTOS:
   - Tabla de movimientos tipo='gasto'
   - Misma estructura que ingresos
   - Botón "+ Registrar Gasto"

   TAB TRANSFERENCIAS:
   - Lista de transferencias entrada/salida
   - Botón "+ Nueva Transferencia"
   - Modal con banco origen/destino

   TAB CORTES:
   - Cards de cortes por periodo
   - Generar nuevo corte
   - Comparar periodos

4. MODALES:
   - ModalIngreso: concepto, monto, fecha, origen, referencia
   - ModalGasto: concepto, monto, fecha, destino, referencia
   - ModalTransferencia: banco destino, monto, concepto

LÓGICA:
- Filtrar movimientos por bancoId
- Calcular capital con calcularCapitalBanco()
- Actualizar historicoIngresos o historicoGastos al crear movimiento

COLORES POR BANCO:
- boveda_monte: blue→cyan gradient
- boveda_usa: red→blue (USA flag)
- utilidades: green→emerald
- flete_sur: orange→amber
- azteca: purple→pink
- leftie: yellow→orange
- profit: indigo→purple
```

---

## 9. PERSISTENCIA DE DATOS

### 9.1 Estructura del Store (Zustand + IndexedDB)

```typescript
// app/lib/store/useAppStore.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'

interface AppState {
  // Datos principales
  bancos: Banco[]
  ventas: Venta[]
  ordenesCompra: OrdenCompra[]
  clientes: Cliente[]
  distribuidores: Distribuidor[]
  movimientos: Movimiento[]
  
  // UI state
  currentPanel: PanelId
  theme: 'dark' | 'light'
  sidebarOpen: boolean
  
  // Acciones
  setCurrentPanel: (panel: PanelId) => void
  
  // CRUD Ventas
  addVenta: (venta: NuevaVentaInput) => Promise<void>
  updateVenta: (id: string, data: Partial<Venta>) => void
  deleteVenta: (id: string) => void
  
  // CRUD Bancos
  updateBancoCapital: (bancoId: BancoId, ingreso: number, gasto: number) => void
  
  // Sync
  refreshAll: () => Promise<void>
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      bancos: [],
      ventas: [],
      // ...
      
      // Implementaciones
      addVenta: async (input) => {
        const { calcularVentaCompleta } = await import('@/app/lib/formulas')
        
        // Obtener datos de OC para precioCompra
        const oc = get().ordenesCompra.find(o => o.id === input.ocRelacionada)
        if (!oc) throw new Error('OC no encontrada')
        
        // Calcular distribución
        const resultado = calcularVentaCompleta({
          cantidad: input.cantidad,
          precioVenta: input.precioVenta,
          precioCompra: oc.costoDistribuidor,
          precioFlete: input.flete === 'Aplica' ? 500 : 0,
          montoPagado: input.montoPagado,
        })
        
        // Crear venta
        const nuevaVenta: Venta = {
          id: `V${Date.now()}`,
          fecha: new Date().toISOString(),
          clienteId: input.clienteId,
          cliente: get().clientes.find(c => c.id === input.clienteId)?.nombre || '',
          ocRelacionada: input.ocRelacionada,
          cantidad: input.cantidad,
          precioVenta: input.precioVenta,
          ingreso: resultado.totalVenta,
          // ... resto de campos
          bovedaMonte: resultado.distribucionReal.bovedaMonte,
          distribucionBancos: {
            bovedaMonte: resultado.distribucionReal.bovedaMonte,
            fletes: resultado.distribucionReal.fletes,
            utilidades: resultado.distribucionReal.utilidades,
          },
          estadoPago: resultado.estadoPago,
          montoPagado: input.montoPagado,
          montoRestante: resultado.montoRestante,
        }
        
        set(state => ({
          ventas: [...state.ventas, nuevaVenta],
        }))
        
        // Actualizar stock de OC
        set(state => ({
          ordenesCompra: state.ordenesCompra.map(o => 
            o.id === input.ocRelacionada
              ? { ...o, stockActual: o.stockActual - input.cantidad }
              : o
          )
        }))
        
        // Actualizar bancos (solo si hay pago)
        if (resultado.estadoPago !== 'pendiente') {
          const { distribucionReal } = resultado
          
          set(state => ({
            bancos: state.bancos.map(b => {
              if (b.id === 'boveda_monte') {
                return {
                  ...b,
                  historicoIngresos: b.historicoIngresos + distribucionReal.bovedaMonte,
                  capitalActual: b.capitalActual + distribucionReal.bovedaMonte,
                }
              }
              if (b.id === 'flete_sur') {
                return {
                  ...b,
                  historicoIngresos: b.historicoIngresos + distribucionReal.fletes,
                  capitalActual: b.capitalActual + distribucionReal.fletes,
                }
              }
              if (b.id === 'utilidades') {
                return {
                  ...b,
                  historicoIngresos: b.historicoIngresos + distribucionReal.utilidades,
                  capitalActual: b.capitalActual + distribucionReal.utilidades,
                }
              }
              return b
            })
          }))
        }
        
        // Actualizar cliente (deuda)
        if (resultado.montoRestante > 0) {
          set(state => ({
            clientes: state.clientes.map(c =>
              c.id === input.clienteId
                ? { ...c, deuda: c.deuda + resultado.montoRestante }
                : c
            )
          }))
        }
      },
      
      // ... más acciones
    }),
    {
      name: 'chronos-storage',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          const value = await get(name)
          return value ?? null
        },
        setItem: async (name, value) => {
          await set(name, value)
        },
        removeItem: async (name) => {
          await del(name)
        },
      })),
    }
  )
)
```

### 9.2 Flujo de Actualización UI

```
Usuario llena formulario
         │
         ▼
   Validación Zod
         │
         ▼
   addVenta(input)
         │
         ▼
┌────────┴────────┐
│  ZUSTAND STORE  │ ← Actualiza estado inmediatamente
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
INDEXEDDB   React re-render
(async)     (inmediato)
    │         │
    ▼         ▼
Persist   UI actualizada
          con nuevos datos
```

---

## 10. IMPLEMENTACIÓN

### 10.1 Orden de Implementación Recomendado

```
FASE 1: CORE (Semana 1)
├── [ ] Configurar Zustand store completo
├── [ ] Implementar persistencia IndexedDB
├── [ ] Migrar datos de prueba
└── [ ] Crear hooks reutilizables

FASE 2: PANELES CRÍTICOS (Semana 2)
├── [ ] Dashboard con KPIs
├── [ ] Panel Ventas con formulario
├── [ ] Panel Órdenes de Compra
└── [ ] Verificar distribución GYA

FASE 3: BANCOS (Semana 3)
├── [ ] Componente PanelBanco reutilizable
├── [ ] Implementar 7 instancias
├── [ ] Movimientos por banco
└── [ ] Transferencias entre bancos

FASE 4: ENTIDADES (Semana 4)
├── [ ] Panel Clientes
├── [ ] Panel Distribuidores
├── [ ] Panel Almacén
└── [ ] Conectar con ventas/OCs

FASE 5: POLISH (Semana 5)
├── [ ] Panel Reportes
├── [ ] Animaciones premium
├── [ ] Efectos 3D/Spline
└── [ ] Testing E2E
```

### 10.2 Comandos de Desarrollo

```bash
# Desarrollo
pnpm dev

# Verificar tipos
pnpm type-check

# Lint
pnpm lint

# Tests
pnpm test

# Build producción
pnpm build
```

### 10.3 Checklist por Panel

```markdown
## Checklist: [NOMBRE PANEL]

### UI
- [ ] Layout responsive (mobile, tablet, desktop)
- [ ] Glassmorphism aplicado
- [ ] Colores de paleta (violeta, dorado, rosa)
- [ ] Animaciones Framer Motion
- [ ] Estados loading/empty/error

### Funcionalidad
- [ ] CRUD completo
- [ ] Validación Zod en formularios
- [ ] Conexión con store
- [ ] Actualización en tiempo real

### Lógica de Negocio
- [ ] Usa formulas.ts para cálculos
- [ ] Actualiza bancos correctamente
- [ ] Maneja estados de pago
- [ ] Tracking de deudas

### Testing
- [ ] Unit tests para lógica
- [ ] Integration tests
- [ ] E2E tests críticos
```

---

## CONCLUSIÓN

Este Blueprint contiene TODO lo necesario para implementar CHRONOS 2026:

1. ✅ **Arquitectura completa** del sistema
2. ✅ **Lógica de negocio** con fórmulas exactas
3. ✅ **7 Bancos** con configuración y reglas
4. ✅ **14 Paneles** especificados al detalle
5. ✅ **Prompts** listos para usar en v0.dev o Claude
6. ✅ **Persistencia** local con Zustand + IndexedDB
7. ✅ **Diseño premium** nivel Apple Vision Pro
8. ✅ **Plan de implementación** por fases

**USO DE ESTE DOCUMENTO**:
- Copiar prompts de la sección 8 para generar componentes
- Seguir fórmulas de sección 4 para TODA la lógica
- Usar estructura de sección 9 para el store
- Verificar con checklist de sección 10

---

*Documento generado: 2024-12-XX*
*Versión: 2.0.0*
*Sistema: CHRONOS 2026*
