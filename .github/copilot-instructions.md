# CHRONOS System - Copilot Instructions

Sistema empresarial de gestión financiera con dashboard premium, visualizaciones Canvas y Firebase.

## Arquitectura del Proyecto

### Stack Tecnológico
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript (strict mode)
- **Estilos**: Tailwind CSS + shadcn/ui
- **Estado**: Zustand (`app/lib/store/useAppStore.ts`) + React Query
- **Backend**: Firebase (Firestore, Auth)
- **3D/Visualizaciones**: Spline + Canvas API (8 componentes en `app/components/visualizations/`)
- **Testing**: Jest + Playwright (E2E en `e2e/`)

### Estructura de Directorios Clave
```
app/
├── components/
│   ├── panels/          # 15 paneles Bento* (BentoDashboard, BentoVentas, etc.)
│   ├── modals/          # Modales CRUD con patrón *ModalSmart.tsx
│   ├── visualizations/  # 8 Canvas components (60fps animations)
│   └── ui/              # shadcn/ui components
├── hooks/               # Custom hooks (useFirestoreCRUD, useAuth, etc.)
├── lib/
│   ├── firebase/        # config.ts, firestore-service.ts, hooks
│   ├── store/           # useAppStore.ts (Zustand)
│   ├── schemas/         # Validación Zod (ventas.schema.ts)
│   └── utils/           # logger.ts (usar SIEMPRE en lugar de console.log)
└── types/               # index.ts contiene TODOS los tipos del dominio
```

### Modelo de Datos (Firestore)
7 bancos/bóvedas: `boveda_monte`, `boveda_usa`, `profit`, `leftie`, `azteca`, `flete_sur`, `utilidades`
Colecciones principales: `ventas`, `clientes`, `distribuidores`, `ordenes_compra`, `movimientos`, `almacen`
Ver tipos completos en `app/types/index.ts` (BancoId, Venta, Cliente, OrdenCompra, etc.)

## Lógica de Negocio Crítica

### Distribución Automática de Ventas (3 Bancos)
Cuando se registra una venta, el dinero se distribuye automáticamente:
```typescript
// Datos de entrada
const precioVentaUnidad = 10000  // Precio VENTA al cliente
const precioCompraUnidad = 6300 // Precio COMPRA (costo distribuidor)
const precioFlete = 500         // Flete por unidad
const cantidad = 10

// DISTRIBUCIÓN CORRECTA:
const montoBovedaMonte = precioCompraUnidad * cantidad    // 63,000 (COSTO)
const montoFletes = precioFlete * cantidad                 // 5,000
const montoUtilidades = (precioVentaUnidad - precioCompraUnidad - precioFlete) * cantidad  // 32,000 (GANANCIA NETA)
```

### Estados de Pago
- **Completo**: 100% distribuido a los 3 bancos
- **Parcial**: Distribución proporcional (`proporcion = montoPagado / precioTotalVenta`)
- **Pendiente**: Solo se registra en histórico, NO afecta capital actual

### Fórmulas de Capital Bancario
```typescript
capitalActual = historicoIngresos - historicoGastos  // Dinámico
// historicoIngresos y historicoGastos son acumulativos fijos, NUNCA disminuyen
```

## Convenciones Críticas

### Idioma
- Respuestas, comentarios y mensajes de error: **Español**
- Commits: Español con conventional commits (`feat:`, `fix:`, `docs:`)

### Logging (OBLIGATORIO)
```typescript
// ❌ PROHIBIDO: console.log
// ✅ CORRECTO: usar logger de app/lib/utils/logger.ts
import { logger } from '@/app/lib/utils/logger'
logger.info('Mensaje', { context: 'Componente', data: {...} })
logger.error('Error', error, { context: 'Servicio' })
```

### Firebase/Firestore
```typescript
// Siempre usar useFirestoreCRUD hook para operaciones CRUD
import { useFirestoreCRUD } from '@/app/hooks/useFirestoreCRUD'
const { data, loading, add, update, remove } = useFirestoreCRUD<Venta>('ventas')

// Cleanup obligatorio en useEffect con listeners
useEffect(() => {
  const unsubscribe = onSnapshot(query, callback)
  return () => unsubscribe() // CRÍTICO
}, [])
```

### Validación con Zod
```typescript
// Usar schemas de app/lib/schemas/ para validar datos de Firestore
import { CrearVentaSchema, validarVenta } from '@/app/lib/schemas/ventas.schema'
const result = validarVenta(formData)
if (!result.success) { /* manejar errores */ }
```

### Estado Global (Zustand)
```typescript
import { useAppStore } from '@/app/lib/store/useAppStore'
const { currentPanel, setCurrentPanel, bancos, triggerDataRefresh } = useAppStore()
```

## Seguridad (Tolerancia Cero)

### Firestore Rules
- NUNCA: `allow read, write: if true`
- SIEMPRE: `request.auth != null` + validación de ownership
- Ver reglas actuales en `firestore.rules`

### Credenciales
- NUNCA hardcodear API keys - usar `.env.local`
- Alertar: "🔒 CREDENCIALES DETECTADAS" si se encuentran keys reales

### TypeScript
- PROHIBIDO: `any`, `@ts-ignore`, `@ts-expect-error`
- ALTERNATIVA: `unknown` + type guards

## Comandos de Desarrollo

```bash
pnpm dev              # Desarrollo (puerto 3000)
pnpm build            # Build producción
pnpm lint             # ESLint
pnpm type-check       # Verificar tipos sin compilar
pnpm test             # Jest tests
pnpm test:e2e         # Playwright E2E
pnpm migrate:all      # Migrar datos CSV a Firestore
pnpm cleanup          # Limpiar proyecto
```

## Migración de Datos

Scripts en `scripts/` para migrar CSVs a Firestore:
```bash
pnpm migrate:init      # Inicializar estructura
pnpm migrate:ventas    # Migrar ventas (96 registros)
pnpm migrate:all       # Migrar todo (783 registros totales)
pnpm migrate:verify    # Verificar migración
```
Datos origen en `csv/`: ventas.csv, clientes.csv, ordenes_compra.csv, etc.

## Patrones del Proyecto

### Componentes Panel (Bento*)
Todos siguen estructura: datos de Firestore → estado local → renderizado con visualización Canvas
```typescript
// Ejemplo: BentoVentas.tsx
const { data: ventas, loading } = useFirestoreCRUD<Venta>('ventas')
```

### Modales CRUD (*ModalSmart)
Patrón: Form con react-hook-form + Zod validation + Firestore service
```typescript
// Ejemplo: CreateVentaModalSmart.tsx
const form = useForm<CrearVentaInput>({ resolver: zodResolver(CrearVentaSchema) })
```

### Visualizaciones Canvas
8 componentes con animaciones 60fps, cleanup obligatorio:
```typescript
useEffect(() => {
  const animationId = requestAnimationFrame(animate)
  return () => cancelAnimationFrame(animationId)
}, [])
```

### Componentes Spline 3D
Cargar con `@splinetool/react-spline`, archivos en raíz (`*.spline`, `*.splinecode`):
```typescript
import Spline from '@splinetool/react-spline'
<Spline scene="url-o-archivo.splinecode" />
```

## Alertas de Seguridad

Cuando detectes código peligroso, advertir:
- `⚠️ RIESGO DE SEGURIDAD`: Reglas Firestore permisivas, credenciales expuestas
- `⚠️ ALERTA TYPESCRIPT`: Uso de `any` o supresión de errores
- `⚠️ MEMORY LEAK`: useEffect sin cleanup en listeners
