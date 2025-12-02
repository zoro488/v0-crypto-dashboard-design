# 🚀 Guía de Integración Avanzada - CHRONOS

## Resumen de Integraciones Configuradas

Este documento detalla todas las integraciones premium configuradas para el sistema CHRONOS.

---

## 1. 🛡️ BotID - Protección contra Bots

### Instalación
```bash
pnpm add botid
```

### Configuración

**next.config.ts** - Configuración con wrapper BotID:
```typescript
import { withBotId } from 'botid/next/config';
export default withBotId(nextConfig);
```

**instrumentation-client.ts** - Rutas protegidas:
```typescript
import { initBotId } from 'botid/client/core';

initBotId({
  protect: [
    { path: '/api/auth/*', method: 'POST' },
    { path: '/api/ventas', method: 'POST' },
    { path: '/api/chat', method: 'POST' },
    // ... más rutas
  ],
});
```

**API Routes** - Verificación en servidor:
```typescript
import { checkBotId } from 'botid/server';

export async function POST(request: NextRequest) {
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: 'Bot detectado' }, { status: 403 });
  }
  // ... lógica normal
}
```

### Activar en Vercel
1. Ir a Dashboard > Proyecto > Firewall > Rules
2. Habilitar "Vercel BotID Deep Analysis"

---

## 2. 📦 Mockend - API Mock

### Configuración
Archivo `.mockend.yml` en raíz del proyecto:

```yaml
key: ${MOCKEND_SECRET_KEY}

models:
  Venta:
    belongsTo: [Cliente, Distribuidor]
    hasMany: [Pago]
    fake:
      _count: 100
      folio: { numerify: 'VTA-2024-####' }
      # ...
```

### Endpoints Generados
- `GET/POST https://mockend.com/api/{owner}/{repo}/ventas`
- `GET/POST https://mockend.com/api/{owner}/{repo}/clientes`
- GraphQL: `https://mockend.com/api/{owner}/{repo}/graphql`

### Uso con Query Params
```
/ventas?estadoPago_eq=completo&createdAt_order=desc&_limit=10
```

---

## 3. 🤖 GitHub Models AI

### Modelos Disponibles
- `ai21-labs/AI21-Jamba-1.5-Large`
- `openai/gpt-4o` / `openai/gpt-4o-mini`
- `anthropic/claude-3.5-sonnet`
- `meta/Llama-3.3-70B-Instruct`
- `microsoft/Phi-4`
- `mistral-ai/mistral-medium-2505`

### Configuración CLI
```bash
gh extension install github/gh-models
gh models list
gh models run openai/gpt-4o "Hola, soy CHRONOS"
```

### Uso en Código
```typescript
import { chatCompletion, GITHUB_MODELS } from '@/app/lib/ai/github-models';

const result = await chatCompletion([
  { role: 'system', content: 'Eres un asistente financiero' },
  { role: 'user', content: 'Analiza estas ventas' }
], {
  model: GITHUB_MODELS.GPT4O_MINI,
  temperature: 0.7
});
```

### Token Requerido
```bash
export GITHUB_TOKEN="ghp_xxxxx"
```
Permisos necesarios: `models:read`

---

## 4. 🌐 Vercel AI Gateway

### Proveedores Configurados
- **xAI Grok** (Principal)
- **OpenAI GPT-4o**
- **Anthropic Claude**
- **Google Gemini**

### Uso
```typescript
import { streamAIText, AI_MODELS } from '@/app/lib/ai/vercel-ai-gateway';

const result = streamAIText("Genera un reporte", {
  model: 'xai',
  modelId: AI_MODELS.GROK_2
});
```

### Structured Output
```typescript
import { generateStructuredData, ChronosSchemas } from '@/app/lib/ai/vercel-ai-gateway';

const analysis = await generateStructuredData(
  "Analiza estas métricas...",
  ChronosSchemas.DashboardInsight
);
```

---

## 5. 🔍 Agentic Search

### Características
- Context-Aware Searching
- Real-Time Web-Grounding
- Multi-Language Support
- Intelligent Code Suggestions

### Uso
```typescript
import { agenticSearch, errorResolution } from '@/app/lib/ai/agentic-search';

// Búsqueda general
const results = await agenticSearch("cómo optimizar queries Firestore");

// Resolución de errores
const fix = await errorResolution(
  "TypeError: Cannot read property 'map' of undefined",
  stackTrace,
  codeContext
);
```

### CLI
```bash
gh copilot suggest "cómo implementar lazy loading en Next.js"
gh copilot explain "git rebase --interactive"
```

---

## 6. 🚀 Optimizaciones de Rendimiento

### Hooks Disponibles
```typescript
import { 
  useIntersectionObserver,
  useDebounce,
  useThrottle,
  useAnimationFrame 
} from '@/app/lib/performance';
```

### Lazy Loading
```typescript
import { LazyOnViewport, PanelSkeleton } from '@/app/lib/performance';

<LazyOnViewport fallback={<PanelSkeleton />}>
  <HeavyComponent />
</LazyOnViewport>
```

### Configuración 3D Adaptativa
```typescript
import { getAdaptive3DConfig } from '@/app/lib/performance';

const config = getAdaptive3DConfig();
// Retorna configuración optimizada según dispositivo
```

---

## 7. 📸 webapp.io - Environment Snapshots

### Configuración
Archivo `.webapp.yml`:

```yaml
services:
  app:
    ports:
      - 3000:3000
    environment:
      - NODE_ENV=development
      
snapshots:
  - name: clean-start
    trigger: after-build
  - name: with-demo-data
    trigger: manual
```

### Uso
1. Conectar repo en webapp.io
2. Cada PR crea preview automático
3. Snapshots disponibles para restaurar estado

---

## 8. 🔧 Variables de Entorno

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx

# AI Providers
GITHUB_TOKEN=ghp_xxx
OPENAI_API_KEY=sk-xxx
XAI_API_KEY=xai-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Mockend
MOCKEND_SECRET_KEY=xxx

# BotID (automático en Vercel)
```

---

## 9. 📊 Arquitectura de AI

```
┌─────────────────────────────────────────────────────────┐
│                     CHRONOS AI Layer                     │
├─────────────┬─────────────┬─────────────┬───────────────┤
│ GitHub      │ Vercel AI   │ Agentic     │ BotID         │
│ Models      │ Gateway     │ Search      │ Protection    │
├─────────────┼─────────────┼─────────────┼───────────────┤
│ GPT-4o      │ xAI Grok    │ Code Search │ API Routes    │
│ Claude      │ Gemini      │ Error Fix   │ Auth Flows    │
│ Llama 3.3   │ Streaming   │ Doc Search  │ Transactions  │
│ Phi-4       │ Structured  │ Suggestions │ Admin Ops     │
└─────────────┴─────────────┴─────────────┴───────────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │   Firestore     │
                  │   (7 Bancos)    │
                  └─────────────────┘
```

---

## 10. 🧪 Testing Integraciones

```bash
# Verificar BotID (en dev siempre retorna isBot: false)
curl -X POST http://localhost:3000/api/chat -d '{"messages":[]}'

# Test Mockend
curl https://mockend.com/api/{owner}/{repo}/ventas?_limit=5

# GitHub Models CLI
gh models run openai/gpt-4o "Test"

# Verificar extensiones
gh extension list
```

---

## 11. 📝 Comandos Útiles

```bash
# Desarrollo
pnpm dev                    # Iniciar desarrollo
pnpm build                  # Build producción
pnpm lint                   # Verificar código
pnpm type-check             # Verificar tipos

# GitHub CLI
gh models list              # Ver modelos disponibles
gh copilot suggest "query"  # Sugerencias AI
gh copilot explain "cmd"    # Explicar comandos

# Migraciones
pnpm migrate:all            # Migrar datos
pnpm migrate:verify         # Verificar migración
```

---

## 12. 🔐 Seguridad

### Checklist
- [x] BotID configurado en rutas sensibles
- [x] Firestore Rules restrictivas
- [x] Variables de entorno en `.env.local`
- [x] TypeScript strict mode
- [x] Headers de seguridad en next.config

### Alertas de Seguridad
```
⚠️ RIESGO: Nunca exponer tokens en código
⚠️ ALERTA: Firestore rules debe tener auth
⚠️ CRÍTICO: No usar 'any' en TypeScript
```

---

## Contacto

Para soporte técnico del sistema CHRONOS, consultar la documentación en `/docs` o el README principal.
