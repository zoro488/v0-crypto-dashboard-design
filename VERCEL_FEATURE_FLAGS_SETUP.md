# 🚀 VERCEL FEATURE FLAGS SETUP - CHRONOS SYSTEM

## Resumen de Implementación

Se ha configurado el ecosistema completo de Vercel para feature flags, incluyendo:

### ✅ Servicios Configurados

#### 1. **Vercel Analytics** (`@vercel/analytics/next`)
- Tracking automático de page views
- Web Vitals monitoring
- Integrado en `app/layout.tsx`

#### 2. **Vercel Speed Insights** (`@vercel/speed-insights`)
- Core Web Vitals tracking
- Performance monitoring

#### 3. **Vercel Flags SDK** (`flags@4.0.2`)
- 15+ feature flags definidos para CHRONOS
- Type-safe con TypeScript
- Integración con `flags/next`

#### 4. **Edge Config** (`@vercel/edge-config@1.4.3`)
- Key-value storage ultra-rápido
- Rate limiting configuration
- Maintenance mode support
- A/B testing configuration

#### 5. **Hypertune** (`hypertune@2.10.1` + `@flags-sdk/hypertune@0.3.2`)
- Feature flags con Edge Config sync
- Targeting por usuario/ambiente
- Updates en tiempo real

#### 6. **GrowthBook** (`@flags-sdk/growthbook@0.2.0`)
- A/B testing framework
- Experiment tracking
- Percentage rollouts

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos:

```
/flags.ts                                    # Configuración principal de flags
/generated/hypertune.ts                      # Tipos y definiciones de Hypertune
/app/lib/hypertune/getHypertune.ts          # Source de Hypertune
/app/lib/growthbook/growthbook.ts           # Configuración GrowthBook
/app/lib/edge-config/edge-config.ts         # Utilidades Edge Config
/app/lib/feature-flags/index.ts             # Barrel exports
/app/hooks/useFeatureFlags.ts               # React hook para cliente
/app/api/flags/route.ts                     # API endpoint para flags
/app/components/debug/FeatureFlagsDebugPanel.tsx  # Panel de debug
```

### Variables de Entorno (`.env.local`):

```env
# Hypertune + Edge Config
EXPERIMENTATION_CONFIG="https://edge-config.vercel.com/..."
EXPERIMENTATION_CONFIG_ITEM_KEY="hypertune_7300"
NEXT_PUBLIC_HYPERTUNE_TOKEN="U2FsdGVkX1/..."

# GrowthBook
GROWTHBOOK_CLIENT_KEY="sdk-ZHmRFercdhO6mQWk"

# Edge Config (standalone)
EDGE_CONFIG="https://edge-config.vercel.com/..."

# Vercel Analytics
VERCEL_ANALYTICS_ID="prj_..."
NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED="1"
```

---

## 🎯 Feature Flags Disponibles

### Core Features:
| Flag | Descripción | Default |
|------|-------------|---------|
| `exampleFlag` | Flag de ejemplo | `false` |
| `enableDesignV2` | Diseño V2 con glassmorphism | `true` |
| `enablePremium3D` | Componentes Spline 3D | `true` |
| `enableAIAssistant` | Asistente AI flotante | `true` |
| `enableAdvancedCharts` | Gráficos avanzados Recharts | `true` |
| `enableRealTimeSync` | Sync tiempo real Firestore | `true` |

### UI/UX:
| Flag | Descripción | Default |
|------|-------------|---------|
| `enableDarkModeV2` | Dark mode mejorado | `true` |
| `enableMobileOptimizations` | Optimizaciones móvil | `true` |
| `enableExperimentalFeatures` | Features beta | `false` |

### Business Logic:
| Flag | Descripción | Default |
|------|-------------|---------|
| `enableBancoTransferencias` | Transferencias inter-banco | `true` |
| `enableMultiBancoView` | Vista multi-banco | `true` |
| `enableVentasV2` | Módulo ventas V2 | `true` |
| `enableGYADistribution` | Distribución GYA automática | `true` |

### Layout:
| Flag | Descripción | Default |
|------|-------------|---------|
| `dashboardLayout` | Estilo del dashboard | `'modern'` |
| `animationSpeed` | Velocidad animaciones | `'normal'` |

---

## 📖 Uso en Componentes

### Server Components:

```typescript
import { getAllFlags, enablePremium3DFlag } from '@/flags';

export default async function MyServerComponent() {
  // Obtener una flag específica
  const isPremium3D = await enablePremium3DFlag();
  
  // Obtener todas las flags
  const flags = await getAllFlags();
  
  return (
    <div>
      {flags.enablePremium3D && <Spline3DComponent />}
    </div>
  );
}
```

### Client Components:

```typescript
'use client';

import { useFeatureFlags } from '@/app/hooks/useFeatureFlags';

export default function MyClientComponent() {
  const { flags, loading, error, refresh } = useFeatureFlags();
  
  if (loading) return <Loading />;
  
  return (
    <div>
      {flags.enableAdvancedCharts && <AdvancedCharts />}
    </div>
  );
}
```

### Con Edge Config:

```typescript
import { 
  isMaintenanceMode, 
  getFeatureFlagsConfig 
} from '@/app/lib/edge-config/edge-config';

export async function middleware(request) {
  // Verificar modo mantenimiento
  if (await isMaintenanceMode()) {
    return NextResponse.redirect('/maintenance');
  }
  
  // Obtener configuración
  const config = await getFeatureFlagsConfig();
  // ...
}
```

---

## 🔧 Debug Panel

En desarrollo, se muestra automáticamente un panel de debug en la esquina inferior derecha
que muestra el estado de todas las flags en tiempo real.

Para ocultarlo, establecer:
```env
NEXT_PUBLIC_SHOW_FLAGS_DEBUG="false"
```

---

## 🚀 Próximos Pasos

1. **Configurar Hypertune Dashboard**: 
   - Ir a [hypertune.com](https://hypertune.com)
   - Crear proyecto y vincular con token

2. **Configurar GrowthBook**:
   - Ir a [growthbook.io](https://growthbook.io)
   - Crear experimentos y features

3. **Configurar Edge Config en Vercel**:
   - Ir al dashboard de Vercel
   - Crear Edge Config stores
   - Vincular con el proyecto

4. **Implementar Targeting**:
   - Agregar lógica de identificación de usuarios
   - Configurar segmentos en Hypertune/GrowthBook

---

## 📊 API Endpoint

`GET /api/flags` - Obtiene todas las flags actuales
`POST /api/flags` - Evalúa flags con contexto personalizado

```bash
# Ejemplo
curl https://tu-app.vercel.app/api/flags
```

Respuesta:
```json
{
  "success": true,
  "flags": {
    "enableDesignV2": true,
    "enablePremium3D": true,
    // ...
  },
  "timestamp": "2025-01-15T..."
}
```

---

*Última actualización: Enero 2025*
*CHRONOS System v2.0*
