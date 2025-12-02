# 🚀 CHECKLIST DE DEPLOY A PRODUCCIÓN - Sistema CHRONOS

## Pre-Deploy Checklist

### 🔒 Seguridad (CRÍTICO)

- [ ] **Firestore Rules**: Cambiar `firestore.rules` por contenido de `firestore.rules.secure`
  ```bash
  cp firestore.rules.secure firestore.rules
  firebase deploy --only firestore:rules
  ```

- [ ] **Variables de entorno**: Verificar que `.env.local` NO está en el repositorio
  ```bash
  git status | grep -i env  # No debe aparecer nada
  ```

- [ ] **CORS**: Verificar que `vercel.json` tiene origen restringido (ya actualizado)

- [ ] **API Keys**: Confirmar que todas las keys están en Vercel Secrets
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `OPENAI_API_KEY` (si aplica)

### 📝 Código

- [ ] **TypeScript**: Sin errores de tipo
  ```bash
  pnpm type-check
  ```

- [ ] **ESLint**: Sin errores críticos
  ```bash
  pnpm lint
  ```

- [ ] **Tests**: 100% pasando
  ```bash
  pnpm test
  ```

- [ ] **Build**: Exitoso sin warnings críticos
  ```bash
  pnpm build
  ```

### 🏗️ Build & Performance

- [ ] **Bundle size**: Verificar que no supera 2MB
  ```bash
  ANALYZE=true pnpm build
  ```

- [ ] **Lighthouse**: Score >90 en todas las categorías
  - Performance
  - Accessibility
  - Best Practices
  - SEO

### 📚 Documentación

- [ ] **README.md**: Actualizado con instrucciones de setup
- [ ] **CHANGELOG.md**: Actualizado con cambios de esta versión
- [ ] **Versión**: Actualizada en `package.json`

---

## Deploy Steps

### 1. Crear Branch de Release
```bash
git checkout -b release/v2.x.x
git push origin release/v2.x.x
```

### 2. Ejecutar Auditoría de Seguridad
```bash
bash scripts/security-audit.sh
```

### 3. Crear PR a main
```bash
gh pr create --base main --head release/v2.x.x --title "Release v2.x.x" --body "## Cambios

- Feature 1
- Feature 2
- Bugfix 1

## Checklist
- [x] Tests passing
- [x] Security audit passed
- [x] Build successful"
```

### 4. Deploy a Vercel
```bash
# Automático via GitHub integration
# O manual:
vercel --prod
```

### 5. Deploy Firestore Rules (Producción)
```bash
cp firestore.rules.secure firestore.rules
firebase deploy --only firestore:rules --project <production-project-id>
```

### 6. Verificación Post-Deploy
- [ ] Dashboard carga correctamente
- [ ] Autenticación funciona
- [ ] Operaciones CRUD funcionan
- [ ] No hay errores en console
- [ ] Sentry/Rollbar sin errores críticos

---

## Rollback Plan

Si algo falla en producción:

### Vercel
```bash
vercel rollback <deployment-url>
```

### Firestore Rules
```bash
# Revertir a reglas anteriores
cp firestore.rules.backup firestore.rules
firebase deploy --only firestore:rules
```

### Git
```bash
git revert HEAD
git push origin main
```

---

## Contactos de Emergencia

- **DevOps Lead**: [contacto]
- **Firebase Admin**: [contacto]
- **Vercel Admin**: [contacto]

---

_Última actualización: 2025-12-02_
