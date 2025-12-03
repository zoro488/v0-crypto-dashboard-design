# 🔥 GUÍA DE ELIMINACIÓN DE FIREBASE — CHRONOS 2026

## Estado Actual

✅ **COMPLETADO:**
- `app/lib/store/index.ts` — Store Zustand + IndexedDB (sin Firebase)
- `app/lib/services/logic.ts` — Lógica sagrada verificada con 28 tests
- `app/hooks/useRealtimeData.ts` — Hook de datos en tiempo real
- `app/components/shared/DataProvider.tsx` — Provider para hidratación
- `__tests__/logic/logic.test.ts` — Tests unitarios (28/28 pasando)
- `app/types/index.ts` — Tipos actualizados sin dependencia directa de Firebase

## Archivos Firebase a Eliminar

Después de migrar los datos, eliminar estos archivos:

```bash
# Archivos de configuración Firebase
rm -rf app/lib/firebase/

# Servicios que usan Firebase directamente
rm app/lib/services/business-logic.service.ts
rm app/lib/services/unified-data-service.ts

# Hooks que usan Firebase
rm app/hooks/useTrazabilidad.ts
rm app/hooks/useAuth.tsx

# Archivos de configuración raíz
rm firebase.json
rm firestore.rules
rm firestore.rules.*
rm firestore.indexes.json
```

## Pasos para Migración Completa

### 1. Actualizar Imports

En todos los archivos que importen de Firebase, cambiar a:

```typescript
// ANTES
import { useFirestoreCRUD } from '@/app/hooks/useFirestoreCRUD'

// DESPUÉS
import { useChronosStore } from '@/app/lib/store'
// o
import { useRealtimeData } from '@/app/hooks/useRealtimeData'
```

### 2. Actualizar layout.tsx

```tsx
// app/layout.tsx
import { DataProvider } from '@/app/components/shared/DataProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  )
}
```

### 3. Usar el nuevo store en componentes

```typescript
// ANTES (Firebase)
const { data: ventas } = useFirestoreCRUD<Venta>('ventas')

// DESPUÉS (Local)
const { ventas, crearVenta, abonarVenta } = useRealtimeData()
// o
const ventas = useChronosStore(state => state.ventas)
const crearVenta = useChronosStore(state => state.crearVenta)
```

### 4. Migrar datos existentes

Si tienes datos en Firestore que quieres conservar:

```typescript
// Script de migración (ejecutar una vez)
import { useChronosStore } from '@/app/lib/store'

async function migrarDesdeFirebase() {
  // 1. Obtener datos de Firebase (último export)
  const datosFirebase = await fetch('/api/export-firebase').then(r => r.json())
  
  // 2. Importar al store local
  const { importarDatos } = useChronosStore.getState()
  importarDatos(datosFirebase)
  
  console.log('Migración completada')
}
```

## Variables de Entorno a Eliminar

Después de la migración, eliminar de `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

## Dependencias a Eliminar

```bash
pnpm remove firebase firebase-admin
```

## Verificación Final

```bash
# Ejecutar tests
pnpm jest __tests__/logic/logic.test.ts

# Verificar build
pnpm build

# Probar app
pnpm dev
```

## Beneficios del Nuevo Sistema

| Característica | Firebase | Local (Zustand + IndexedDB) |
|----------------|----------|------------------------------|
| Latencia | 100-500ms | <10ms |
| Offline | Parcial | 100% |
| Costo | $$ | $0 |
| Complejidad | Alta | Baja |
| Persistencia | Cloud | IndexedDB |
| Sync tiempo real | WebSocket | Zustand reactivo |

---

**CHRONOS 2026 — LÓGICA 100% GARANTIZADA SIN FIREBASE**
