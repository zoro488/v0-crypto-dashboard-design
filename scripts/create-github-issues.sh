#!/bin/bash

# ============================================================
# 🚀 Script de Creación de GitHub Issues para Automatización
# Sistema Chronos - Multi-Agent Workflow
# ============================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🚀 Creando Issues para Sistema Chronos${NC}"
echo -e "${BLUE}================================================${NC}"

# ============================================================
# LABELS
# ============================================================
echo -e "\n${YELLOW}📌 Creando labels...${NC}"

labels=(
  "priority:critical:d73a4a:Prioridad crítica - Resolver inmediatamente"
  "priority:high:ff6b6b:Prioridad alta"
  "priority:medium:ffc107:Prioridad media"
  "priority:low:28a745:Prioridad baja"
  "type:bug:d73a4a:Bug o error"
  "type:feature:0075ca:Nueva funcionalidad"
  "type:typescript:3178c6:Error de TypeScript"
  "type:test:6f42c1:Testing E2E"
  "type:ui:e99695:Componente UI"
  "type:firebase:ffca28:Firebase/Firestore"
  "type:performance:00bcd4:Optimización"
  "agent:copilot:7057ff:Asignable a Copilot Agent"
  "status:ready:28a745:Listo para trabajar"
  "status:blocked:ffc107:Bloqueado"
  "status:in-progress:0075ca:En progreso"
)

for label in "${labels[@]}"; do
  IFS=':' read -r name color description <<< "$label"
  gh label create "$name" --color "$color" --description "$description" 2>/dev/null || \
    gh label edit "$name" --color "$color" --description "$description" 2>/dev/null || true
  echo -e "${GREEN}✓ Label: $name${NC}"
done

# ============================================================
# MILESTONE
# ============================================================
echo -e "\n${YELLOW}📌 Creando milestone...${NC}"

gh api repos/:owner/:repo/milestones \
  -f title="v1.0.0 - Sistema 100% Funcional" \
  -f state="open" \
  -f description="Completar todas las funcionalidades del sistema Chronos al 100%" \
  -f due_on="2025-02-28T00:00:00Z" 2>/dev/null || true

echo -e "${GREEN}✓ Milestone: v1.0.0${NC}"

# ============================================================
# ISSUES - TYPESCRIPT ERRORS
# ============================================================
echo -e "\n${YELLOW}📝 Creando Issues de TypeScript...${NC}"

gh issue create \
  --title "🔴 [TypeScript] Crear componente textarea.tsx faltante" \
  --body "## Descripción
El componente \`textarea\` es importado pero no existe en \`@/app/components/ui/\`.

## Archivos afectados
- \`app/components/ui/textarea.tsx\` (crear)
- Múltiples archivos que importan \`<Textarea />\`

## Solución propuesta
\`\`\`typescript
// app/components/ui/textarea.tsx
import * as React from 'react'
import { cn } from '@/app/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
\`\`\`

## Criterios de aceptación
- [ ] Componente creado con tipado estricto
- [ ] Estilos consistentes con design system
- [ ] No errores de TypeScript" \
  --label "type:typescript,type:ui,priority:critical,agent:copilot,status:ready" \
  --milestone "v1.0.0 - Sistema 100% Funcional"

echo -e "${GREEN}✓ Issue: textarea.tsx${NC}"

gh issue create \
  --title "🔴 [TypeScript] Crear componente select.tsx faltante" \
  --body "## Descripción
El componente \`Select\` es importado pero no existe en \`@/app/components/ui/\`.

## Archivos afectados
- \`app/components/ui/select.tsx\` (crear)

## Solución propuesta
Usar Radix UI Select como base:

\`\`\`typescript
// app/components/ui/select.tsx
'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/app/lib/utils'

// ... implementación completa con Root, Trigger, Content, Item, etc.
\`\`\`

## Criterios de aceptación
- [ ] Componente completo con todas las sub-partes
- [ ] Accesibilidad (ARIA)
- [ ] Tipado estricto TypeScript" \
  --label "type:typescript,type:ui,priority:critical,agent:copilot,status:ready" \
  --milestone "v1.0.0 - Sistema 100% Funcional"

echo -e "${GREEN}✓ Issue: select.tsx${NC}"

gh issue create \
  --title "🔴 [TypeScript] Crear componente HybridCombobox faltante" \
  --body "## Descripción
El componente \`HybridCombobox\` es importado pero no existe.

## Archivos afectados
- \`app/components/ui/hybrid-combobox.tsx\` (crear)
- Smart forms que usan combobox con búsqueda

## Funcionalidad requerida
- Búsqueda de texto filtrable
- Selección única o múltiple
- Creación de nuevos items inline
- Soporte para datos async

## Criterios de aceptación
- [ ] Búsqueda fuzzy implementada
- [ ] Keyboard navigation
- [ ] Tipado genérico para items" \
  --label "type:typescript,type:ui,priority:high,agent:copilot,status:ready" \
  --milestone "v1.0.0 - Sistema 100% Funcional"

echo -e "${GREEN}✓ Issue: HybridCombobox${NC}"

# ============================================================
# ISSUES - AI SDK
# ============================================================
gh issue create \
  --title "🔴 [TypeScript] Resolver errores de módulos AI SDK" \
  --body "## Descripción
Los módulos \`ai\` y \`@ai-sdk/openai\` no se encuentran o tienen errores de tipos.

## Errores
\`\`\`
Cannot find module 'ai'
Cannot find module '@ai-sdk/openai'
\`\`\`

## Solución
1. Instalar dependencias:
\`\`\`bash
pnpm add ai @ai-sdk/openai
\`\`\`

2. O crear tipos mock si no se usa:
\`\`\`typescript
// app/types/ai-sdk.d.ts
declare module 'ai' {
  export function streamText(options: any): any
}
\`\`\`

## Criterios de aceptación
- [ ] Sin errores de módulo
- [ ] Tipos correctos para AI SDK" \
  --label "type:typescript,priority:high,agent:copilot,status:ready" \
  --milestone "v1.0.0 - Sistema 100% Funcional"

echo -e "${GREEN}✓ Issue: AI SDK${NC}"

# ============================================================
# ISSUES - FIREBASE
# ============================================================
echo -e "\n${YELLOW}📝 Creando Issues de Firebase...${NC}"

gh issue create \
  --title "🔥 [Firebase] Migrar colecciones fragmentadas a movimientos unificado" \
  --body "## Descripción
Actualmente existen 7 colecciones \`*_ingresos\` separadas que deben unificarse en \`movimientos\`.

## Estado actual
- \`boveda_monte_ingresos\`
- \`boveda_usa_ingresos\`
- \`profit_ingresos\`
- \`leftie_ingresos\`
- \`azteca_ingresos\`
- \`flete_sur_ingresos\`
- \`utilidades_ingresos\`

## Estado deseado
Una sola colección \`movimientos\` con campo \`bancoId\`.

## Pasos
1. Crear script de migración
2. Migrar datos existentes
3. Actualizar componentes
4. Eliminar colecciones antiguas

## Criterios de aceptación
- [ ] Script de migración creado
- [ ] Datos migrados sin pérdida
- [ ] Componentes actualizados" \
  --label "type:firebase,priority:critical,agent:copilot,status:ready" \
  --milestone "v1.0.0 - Sistema 100% Funcional"

echo -e "${GREEN}✓ Issue: Firebase Migration${NC}"

gh issue create \
  --title "🔥 [Firebase] Actualizar firestore.rules para seguridad" \
  --body "## Descripción
Verificar y actualizar las reglas de Firestore para asegurar autenticación.

## Reglas requeridas
\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Requerir autenticación para todo
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Reglas específicas por colección
    match /ventas/{ventaId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null 
        && request.auth.uid == resource.data.createdBy;
    }
  }
}
\`\`\`

## Criterios de aceptación
- [ ] Todas las colecciones protegidas
- [ ] No \`allow read, write: if true\`" \
  --label "type:firebase,priority:critical,agent:copilot,status:ready" \
  --milestone "v1.0.0 - Sistema 100% Funcional"

echo -e "${GREEN}✓ Issue: Firestore Rules${NC}"

# ============================================================
# ISSUES - TESTING
# ============================================================
echo -e "\n${YELLOW}📝 Creando Issues de Testing...${NC}"

gh issue create \
  --title "🧪 [E2E] Completar tests de autenticación" \
  --body "## Descripción
Crear tests E2E para flujos de autenticación.

## Tests requeridos
- Login con email/password
- Login con Google
- Logout
- Persistencia de sesión
- Protección de rutas

## Archivo
\`e2e/auth.spec.ts\`

## Criterios de aceptación
- [ ] Todos los flujos de auth testeados
- [ ] Mocking de Firebase Auth
- [ ] Tests pasan en CI" \
  --label "type:test,priority:high,agent:copilot,status:ready" \
  --milestone "v1.0.0 - Sistema 100% Funcional"

echo -e "${GREEN}✓ Issue: Auth Tests${NC}"

gh issue create \
  --title "🧪 [E2E] Agregar tests de accesibilidad" \
  --body "## Descripción
Agregar tests de accesibilidad (a11y) usando @axe-core/playwright.

## Archivos
- \`e2e/accessibility.spec.ts\`

## Tests requeridos
- Verificar todas las páginas principales
- Verificar modales
- Verificar formularios

## Criterios de aceptación
- [ ] axe-core integrado
- [ ] Sin violaciones críticas
- [ ] Reporte HTML generado" \
  --label "type:test,priority:medium,agent:copilot,status:ready" \
  --milestone "v1.0.0 - Sistema 100% Funcional"

echo -e "${GREEN}✓ Issue: A11y Tests${NC}"

# ============================================================
# ISSUES - PERFORMANCE
# ============================================================
echo -e "\n${YELLOW}📝 Creando Issues de Performance...${NC}"

gh issue create \
  --title "⚡ [Performance] Implementar lazy loading en componentes pesados" \
  --body "## Descripción
Implementar React.lazy() y Suspense en componentes pesados.

## Componentes a optimizar
- Gráficos (Recharts)
- Modales 3D (Spline)
- Tablas grandes

## Implementación
\`\`\`typescript
const Chart = lazy(() => import('./Chart'))

<Suspense fallback={<ChartSkeleton />}>
  <Chart data={data} />
</Suspense>
\`\`\`

## Criterios de aceptación
- [ ] LCP < 2.5s
- [ ] Bundle size reducido 20%" \
  --label "type:performance,priority:medium,agent:copilot,status:ready" \
  --milestone "v1.0.0 - Sistema 100% Funcional"

echo -e "${GREEN}✓ Issue: Lazy Loading${NC}"

gh issue create \
  --title "⚡ [Performance] Optimizar queries de Firestore" \
  --body "## Descripción
Optimizar queries para reducir lecturas y mejorar tiempos.

## Optimizaciones
1. Implementar paginación cursor-based
2. Añadir índices compuestos
3. Usar \`select()\` para campos específicos
4. Cachear con React Query

## Criterios de aceptación
- [ ] Queries paginadas
- [ ] Índices creados
- [ ] < 100 lecturas por vista" \
  --label "type:performance,type:firebase,priority:high,agent:copilot,status:ready" \
  --milestone "v1.0.0 - Sistema 100% Funcional"

echo -e "${GREEN}✓ Issue: Firestore Optimization${NC}"

# ============================================================
# ISSUES - FEATURES
# ============================================================
echo -e "\n${YELLOW}📝 Creando Issues de Features...${NC}"

gh issue create \
  --title "✨ [Feature] Implementar exportación a Excel/PDF" \
  --body "## Descripción
Agregar funcionalidad de exportación de reportes.

## Formatos
- Excel (.xlsx)
- PDF

## Reportes exportables
- Ventas por período
- Inventario actual
- Estado de cuentas
- Movimientos bancarios

## Librerías sugeridas
- xlsx (Excel)
- jspdf + jspdf-autotable (PDF)

## Criterios de aceptación
- [ ] Botón de exportar en cada reporte
- [ ] Formato correcto
- [ ] Estilos en PDF" \
  --label "type:feature,priority:medium,agent:copilot,status:ready" \
  --milestone "v1.0.0 - Sistema 100% Funcional"

echo -e "${GREEN}✓ Issue: Export Feature${NC}"

gh issue create \
  --title "✨ [Feature] Sistema de notificaciones push" \
  --body "## Descripción
Implementar notificaciones push para eventos importantes.

## Eventos a notificar
- Venta completada
- Stock bajo
- Pago recibido
- Orden de compra nueva

## Implementación
- Firebase Cloud Messaging (FCM)
- Service Worker para PWA

## Criterios de aceptación
- [ ] FCM configurado
- [ ] Permiso de notificaciones
- [ ] Notificaciones funcionando" \
  --label "type:feature,type:firebase,priority:low,agent:copilot,status:ready" \
  --milestone "v1.0.0 - Sistema 100% Funcional"

echo -e "${GREEN}✓ Issue: Push Notifications${NC}"

# ============================================================
# RESUMEN
# ============================================================
echo -e "\n${BLUE}================================================${NC}"
echo -e "${GREEN}✅ Issues creados exitosamente${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "\nPuedes ver los issues en: ${YELLOW}gh issue list${NC}"
echo -e "Para asignar a Copilot: ${YELLOW}gh issue edit <number> --add-assignee @copilot${NC}"
