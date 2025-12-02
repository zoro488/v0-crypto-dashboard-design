# 🚀 Vercel AI Gateway - Guía de Configuración

Esta guía te ayudará a configurar y desplegar el sistema CHRONOS con Vercel AI Gateway.

## 📋 Prerequisitos

- ✅ Cuenta de Vercel (gratis o Pro)
- ✅ Vercel CLI instalada (`npm i -g vercel`)
- ✅ OpenAI API Key ([obtener aquí](https://platform.openai.com/api-keys))
- ✅ Firebase configurado

## 🔧 Paso 1: Configurar Variables de Entorno

### Opción A: Usando Vercel CLI (Recomendado)

```bash
# 1. Autenticarse en Vercel
vercel login

# 2. Vincular el proyecto
vercel link

# 3. Agregar OPENAI_API_KEY
vercel env add OPENAI_API_KEY
# Cuando pregunte:
# - Value: pega tu sk-proj-... de OpenAI
# - Environments: selecciona Production, Preview, Development (espacio para marcar)

# 4. Verificar variables
vercel env ls

# 5. Descargar variables localmente (opcional)
vercel env pull .env.local
```

### Opción B: Usando Dashboard de Vercel

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Settings → Environment Variables
4. Agregar:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-proj-YOUR_KEY_HERE`
   - **Environments**: Production, Preview, Development

## 🚀 Paso 2: Desplegar a Vercel

### Deploy Automático (Recomendado)

```bash
# Deploy a producción
vercel --prod

# El comando hará:
# ✅ Build del proyecto
# ✅ Optimización automática
# ✅ Activación de Vercel AI Gateway
# ✅ Deploy a producción
```

### Deploy Manual

```bash
# 1. Build local (verificar que compila)
pnpm build

# 2. Preview deployment (staging)
vercel

# 3. Si todo funciona, promover a producción
vercel --prod
```

## 🎯 Paso 3: Verificar Vercel AI Gateway

### ¿Qué hace Vercel AI Gateway automáticamente?

✅ **Caching Inteligente**
- Requests idénticas: 1 hora
- Embeddings: 7 días
- Tool calls: 30 minutos

✅ **Rate Limiting**
- 100 req/min (Plan Pro)
- Auto retry con backoff

✅ **Observabilidad**
- Dashboard con métricas
- Latencia promedio
- Cache hit rate
- Costos por request

### Ver Métricas

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Pestaña **AI** (solo en plan Pro)
4. Ver:
   - Total requests
   - Cache effectiveness
   - Average latency
   - Cost breakdown

## 🧪 Paso 4: Probar el Chat AI

### En Desarrollo Local

```bash
# 1. Asegurar que .env.local tiene OPENAI_API_KEY
cat .env.local | grep OPENAI_API_KEY

# 2. Iniciar servidor
pnpm dev

# 3. Abrir navegador
open http://localhost:3000/ai-panel

# 4. Probar comandos:
# - "Muéstrame las ventas de hoy"
# - "¿Cuánto dinero hay en Bóveda Monte?"
# - "Registra una venta de..."
```

### En Producción

1. Ve a tu URL de Vercel: `https://tu-proyecto.vercel.app`
2. Login con Firebase Auth
3. Click en el ícono de IA (esquina inferior derecha)
4. Probar los 9 tools disponibles

## 🛠️ Troubleshooting

### Error: "OPENAI_API_KEY no configurada"

```bash
# Verificar que existe
vercel env ls | grep OPENAI_API_KEY

# Si no existe, agregarla
vercel env add OPENAI_API_KEY

# Re-deploy
vercel --prod
```

### Error: "Failed to fetch"

```bash
# Verificar que el endpoint existe
curl https://tu-proyecto.vercel.app/api/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hola"}]}'

# Debe retornar streaming response
```

### Rate Limit Alcanzado

Si estás en plan gratuito de Vercel:
- Upgrade a Pro ($20/mes)
- O usa caching más agresivo
- O limita requests en el frontend

### Cache No Funciona

Vercel AI Gateway cache solo funciona:
- ✅ En producción (no en `localhost`)
- ✅ Con plan Pro o Enterprise
- ✅ Si las requests son idénticas

## 📊 Monitoreo

### Logs en Tiempo Real

```bash
# Ver logs de deployment
vercel logs

# Ver logs de una función específica
vercel logs --follow /api/chat
```

### Métricas Clave

Monitor en Vercel Dashboard:
- **Latency P95**: Debe ser < 2s
- **Error Rate**: Debe ser < 1%
- **Cache Hit Rate**: Objetivo > 60%
- **Cost per 1K requests**: ~$0.02 con cache

## 🔒 Seguridad

### ✅ Buenas Prácticas Implementadas

1. **API Keys en Environment Variables**: ✅ Nunca en código
2. **Firebase Auth**: ✅ Protege endpoints
3. **Rate Limiting**: ✅ Via Vercel AI Gateway
4. **CORS**: ✅ Configurado en Next.js
5. **Logging Seguro**: ✅ Sin exponer datos sensibles

### ⚠️ Importante

- **NUNCA** commitear `.env.local` a Git
- **SIEMPRE** usar `VERCEL_OIDC_TOKEN` en CI/CD
- **ROTAR** API keys cada 90 días
- **AUDITAR** logs regularmente

## 💰 Costos Estimados

### Con Vercel AI Gateway (Plan Pro)

| Requests/mes | Sin Cache | Con Cache (60%) | Ahorro |
|--------------|-----------|-----------------|--------|
| 10,000       | $2.00     | $0.80           | 60%    |
| 100,000      | $20.00    | $8.00           | 60%    |
| 1,000,000    | $200.00   | $80.00          | 60%    |

**Vercel Pro**: $20/mes + costos de OpenAI
**Ahorro típico**: 50-70% en costos de API

## 🎓 Recursos

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Vercel AI Gateway](https://vercel.com/docs/ai/ai-gateway)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Firebase + Vercel](https://vercel.com/guides/firebase)

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs: `vercel logs`
2. Ver [ISSUES_TRACKER.md](/ISSUES_TRACKER.md)
3. Contactar: [Vercel Support](https://vercel.com/support)

---

**Sistema CHRONOS** - Powered by Vercel AI Gateway 🚀
