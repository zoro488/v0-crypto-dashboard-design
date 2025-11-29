# Configuración de Credenciales Firebase para Migración

## ⚠️ Requisito Previo

Para ejecutar la migración a Firestore desde scripts de Node.js, necesitas configurar **credenciales de servicio de Firebase**.

## 📋 Pasos para Obtener Credenciales

### 1. Ir a Firebase Console
- URL: https://console.firebase.google.com/
- Proyecto: **premium-ecosystem-1760790572**

### 2. Generar Service Account Key

1. En Firebase Console, ve a **Project Settings** (⚙️ icono arriba a la izquierda)
2. Ve a la pestaña **Service Accounts**
3. Click en **Generate New Private Key**
4. Confirma descargando el archivo JSON
5. Guarda el archivo en `/workspaces/v0-crypto-dashboard-design/scripts/` con el nombre:
   \`\`\`
   firebase-service-account.json
   \`\`\`

### 3. Configurar Variable de Entorno

El script de migración buscará las credenciales en:

\`\`\`bash
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/firebase-service-account.json"
\`\`\`

O edita `firestore-migrator.ts` para apuntar directamente al archivo:

\`\`\`typescript
admin.initializeApp({
  credential: admin.credential.cert('./firebase-service-account.json'),
});
\`\`\`

### 4. Proteger el Archivo (IMPORTANTE)

**NUNCA** subas el archivo de credenciales a Git:

\`\`\`bash
# Ya está en .gitignore, pero verifica:
echo "firebase-service-account.json" >> .gitignore
echo "scripts/firebase-service-account.json" >> .gitignore
\`\`\`

## 🔄 Una Vez Configurado

Ejecuta la migración:

\`\`\`bash
npm run migrate
\`\`\`

O el proceso completo:

\`\`\`bash
npm run setup:complete
\`\`\`

## 🌐 Alternativa: Usar Firebase Web SDK

Si no puedes obtener las credenciales de servicio, puedes usar el SDK web de Firebase desde el frontend:

1. Los hooks `useFirestore` en `lib/firebase/` ya están configurados
2. Los modales ya usan estos hooks para CRUD
3. La migración ocurriría automáticamente al usar la aplicación

### Verificar Configuración Web:

\`\`\`typescript
// En lib/firebase/config.ts
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "premium-ecosystem-1760790572.firebaseapp.com",
  projectId: "premium-ecosystem-1760790572",
  // ...
};
\`\`\`

## 📊 Estado Actual

- ✅ Data Cleaning: COMPLETADO (23 correcciones)
- ✅ BASE_DATOS_CLEANED.json: LISTO para migración
- ⏳ Firestore Migration: PENDIENTE (requiere credenciales)
- ✅ Scripts: LISTOS y testeados

## 🎯 Próximos Pasos

**Opción A (Recomendada):** Obtener credenciales y ejecutar `npm run migrate`

**Opción B:** Usar la app web para popular Firestore manualmente

**Opción C:** Continuar con SPRINT 2 (UI/Animations) mientras se resuelven credenciales
