# 🔬 ANÁLISIS QUIRÚRGICO - CHRONOS INFINITY 2026

**Fecha**: 5 Diciembre 2025  
**Total archivos TS/TSX**: 764  
**Estado**: Migración Firebase → Drizzle/Turso EN PROGRESO

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Archivos | Estado |
|-----------|----------|--------|
| **ACTIVOS (Drizzle)** | ~60 | ✅ Usar |
| **LEGACY (Firebase)** | ~450 | ⚠️ Migrar/Eliminar |
| **DUPLICADOS** | ~100+ | 🗑️ Consolidar |
| **SHOWCASE/DEMO** | ~50 | 📦 Separar |

---

## ✅ ARCHIVOS ACTIVOS (SISTEMA NUEVO)

### 🗄️ Base de Datos (CORE)
```
database/
├── index.ts          # Conexión Drizzle + LibSQL
├── schema.ts         # 289 líneas - Tablas SQLite
├── migrate.ts        # Migraciones
└── sqlite.db         # BD local
```

### ⚡ Server Actions (NUEVO - USAR ESTOS)
```
app/_actions/
├── almacen.ts        # CRUD Almacén
├── bancos.ts         # CRUD Bancos + getMovimientosBanco
├── clientes.ts       # CRUD Clientes
├── distribuidores.ts # CRUD Distribuidores
├── index.ts          # Exports centralizados
├── movimientos.ts    # CRUD Movimientos
├── ordenes.ts        # CRUD Órdenes de Compra
├── reportes.ts       # Generación reportes
├── types.ts          # Schemas Zod para validación
├── usuarios.ts       # CRUD Usuarios
└── ventas.ts         # CRUD Ventas con distribución GYA
```

### 🎨 Componentes Activos
```
app/_components/
├── panels/
│   ├── BancosPanelPremium.tsx
│   ├── ClientesPanelPremium.tsx
│   ├── DashboardPremium.tsx
│   ├── DashboardInfinity.tsx
│   └── VentasPanelPremium.tsx
├── ui/
│   ├── LoadingSpinner.tsx
│   └── [shadcn components]
├── forms/           # Formularios CRUD
├── layout/          # FloatingHeader3D, etc
└── 3d/              # Componentes Three.js
```

### 📁 Utilidades Activas
```
app/_lib/
├── constants/
│   └── bancos.ts    # ✅ FUENTE ÚNICA de BancoConfig
├── utils/
│   ├── formatters.ts
│   ├── logger.ts
│   └── index.ts
└── realtime/
    └── hooks.ts
```

### 🛤️ Rutas Activas (Dashboard)
```
app/(dashboard)/
├── page.tsx              # Redirect a /dashboard
├── dashboard/page.tsx    # Dashboard principal
├── bancos/
│   ├── page.tsx          # Lista bancos
│   └── [bancoId]/page.tsx # Detalle banco (NUEVO)
├── ventas/page.tsx
├── clientes/page.tsx
├── distribuidores/page.tsx
├── ordenes/page.tsx
├── movimientos/page.tsx
└── configuracion/page.tsx
```

---

## ⚠️ ARCHIVOS LEGACY (FIREBASE) - MIGRAR O ELIMINAR

### 🔥 Firebase Core (ELIMINAR)
```
app/lib/firebase/          # 39 archivos importan de aquí
├── config.ts              # Configuración Firebase
├── firestore-service.ts   # CRUD Firestore
├── firestore-hooks.service.ts
├── movimientos.service.ts
└── seed-data.service.ts

functions/                 # Cloud Functions (NO USAR)
├── src/index.ts           # 2844 archivos compilados
└── lib/
```

### 🪝 Hooks Firebase (MIGRAR)
```
app/hooks/                 # 32 archivos - TODOS usan Firebase
├── useFirestoreCRUD.ts    # ❌ Reemplazar con Server Actions
├── useRealtimeCollection.ts
├── useRealtimeQuery.ts
├── useOptimizedFirestore.ts
├── useMovimientos.ts
├── useSystemData.ts
└── useTrazabilidad.ts
```

### 🔧 Services Firebase (MIGRAR)
```
app/lib/services/
├── ventas-transaction.service.ts  # ❌ Ya en app/_actions/ventas.ts
├── business-logic.service.ts      # ❌ Ya en Server Actions
├── unified-data-service.ts        # ❌ Duplicado
└── ai/                            # ⚠️ Revisar - puede necesitar migración
```

### 📋 Schemas Duplicados (CONSOLIDAR)
```
MANTENER:
├── database/schema.ts             # ✅ Drizzle Schema (fuente)
├── app/_actions/types.ts          # ✅ Zod Schemas

ELIMINAR/FUSIONAR:
├── app/lib/schemas/ventas.schema.ts
├── app/lib/schemas/almacen.schema.ts
├── app/lib/schemas/clientes.schema.ts
├── app/lib/schemas/distribuidores.schema.ts
├── app/lib/schemas/ordenes-compra.schema.ts
└── app/lib/validations/smart-forms-schemas.ts
```

---

## 🗑️ CARPETAS DUPLICADAS

### Estructura Actual (PROBLEMA)
```
❌ DUPLICACIÓN SEVERA:

app/components/     (304 archivos) ──┐
app/_components/    (39 archivos)  ──┴── CONSOLIDAR

app/lib/            (113 archivos) ──┐
app/_lib/           (7 archivos)   ──┴── CONSOLIDAR

app/hooks/          (32 archivos)  ──┐
app/_hooks/         (1 archivo)    ──┴── CONSOLIDAR
hooks/              (2 archivos)   ──┘

lib/                (1 archivo)    ──── ELIMINAR
```

### Estructura Objetivo (LIMPIA)
```
✅ PROPUESTA:

app/
├── _actions/       # Server Actions (Drizzle)
├── _components/    # Todos los componentes UI
├── _hooks/         # Todos los hooks custom
├── _lib/           # Utilidades, constantes, config
├── (dashboard)/    # Rutas protegidas
├── (auth)/         # Login, Register
└── api/            # API Routes

database/           # Drizzle Schema + conexión
```

---

## 🎯 CONSTANTES DUPLICADAS

### Bancos (3 ARCHIVOS - DEBERÍA SER 1)
```
1. app/_lib/constants/bancos.ts      ✅ USAR ESTE
2. app/lib/constants/bancos.ts       ❌ ELIMINAR
3. app/lib/config/bancos.config.ts   ❌ ELIMINAR
```

### Formatters/Utils (4 ARCHIVOS - DEBERÍA SER 1)
```
1. app/_lib/utils/formatters.ts      ✅ USAR ESTE
2. app/_lib/utils/index.ts           ✅ Re-exporta
3. app/lib/utils/formatters.ts       ❌ ELIMINAR
4. app/lib/utils.ts                  ❌ ELIMINAR
5. lib/utils.ts                      ❌ ELIMINAR
```

---

## 📦 SHOWCASE/DEMO (SEPARAR)

```
PÁGINAS DEMO (mover a /demo o eliminar):
├── app/chronos-showcase/page.tsx
├── app/demo-3d/page.tsx
├── app/infinity-showcase/page.tsx
├── app/showcase-premium/page.tsx
└── app/(dashboard)/infinity-final/page.tsx
```

---

## 🚨 PROBLEMAS DETECTADOS

### 1. **Paneles Premium usan Firebase** (CRÍTICO)
Los paneles en `app/components/panels/Bento*.tsx` importan de Firebase:
```typescript
// ❌ LEGACY
import { useFirestoreCRUD } from '@/app/hooks/useFirestoreCRUD'
import { collection } from 'firebase/firestore'
```

**SOLUCIÓN**: Migrar a Server Actions + fetch desde page.tsx

### 2. **39 archivos importan Firebase**
Ver lista completa arriba en sección LEGACY.

### 3. **Modales usan Firebase** (CRÍTICO)
```
app/components/modals/
├── CreateVentaModalPremium.tsx     ❌ Firebase
├── CreateAbonoModalPremium.tsx     ❌ Firebase
├── CreateGastoModalPremium.tsx     ❌ Firebase
└── CreateTransferenciaModalPremium.tsx ❌ Firebase
```

**SOLUCIÓN**: Ya existe `app/_components/forms/` con versiones Drizzle.

### 4. **Variables .env Firebase**
```env
# .env.local - ELIMINAR ESTAS:
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... etc
```

---

## ✅ PLAN DE ACCIÓN RECOMENDADO

### FASE 1: Limpieza Inmediata (30 min)
- [ ] Eliminar carpeta `functions/` (Firebase Cloud Functions)
- [ ] Eliminar `app/lib/firebase/` 
- [ ] Eliminar variables Firebase de `.env.local`
- [ ] Eliminar archivos duplicados de constantes

### FASE 2: Consolidación (2 horas)
- [ ] Mover componentes activos de `app/components/` a `app/_components/`
- [ ] Mover hooks activos de `app/hooks/` a `app/_hooks/`
- [ ] Consolidar `app/lib/` en `app/_lib/`

### FASE 3: Migración Paneles (4 horas)
- [ ] Migrar `BentoAlmacenPremium.tsx` a Server Actions
- [ ] Migrar `BentoOrdenesCompraPremium.tsx` a Server Actions
- [ ] Migrar `BentoReportesPremium.tsx` a Server Actions
- [ ] Migrar `BentoDistribuidoresPremium.tsx` a Server Actions

### FASE 4: Eliminación Final (1 hora)
- [ ] Eliminar `app/components/` (carpeta vacía)
- [ ] Eliminar `app/hooks/` (carpeta vacía)
- [ ] Eliminar `app/lib/` (carpeta vacía)
- [ ] Actualizar imports en todo el proyecto

---

## 📈 MÉTRICAS POST-LIMPIEZA

| Métrica | Antes | Después |
|---------|-------|---------|
| Archivos TS/TSX | 764 | ~250 |
| Carpetas duplicadas | 6 | 0 |
| Imports Firebase | 39 | 0 |
| Tamaño bundle | ? | -40% |

---

## 🏗️ ARQUITECTURA OBJETIVO

```
┌─────────────────────────────────────────────────────────────┐
│                    CHRONOS INFINITY 2026                     │
├─────────────────────────────────────────────────────────────┤
│  FRONTEND                                                    │
│  └── app/_components/ (UI unificado)                        │
├─────────────────────────────────────────────────────────────┤
│  LÓGICA                                                      │
│  └── app/_actions/ (Server Actions + Drizzle)               │
├─────────────────────────────────────────────────────────────┤
│  DATABASE                                                    │
│  └── database/ (Turso/LibSQL + Drizzle ORM)                 │
├─────────────────────────────────────────────────────────────┤
│  CONFIG                                                      │
│  └── app/_lib/ (Constantes, utils, hooks)                   │
└─────────────────────────────────────────────────────────────┘
```
