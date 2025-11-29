# 🔧 Scripts de Migración Chronos

Scripts para limpiar inconsistencias de datos y migrar a Firestore.

## 📋 Requisitos Previos

1. **Node.js 18+** instalado
2. **Credenciales de Firebase Admin** (opcional para testing local)
3. Archivo `BASE_DATOS_excel_data.json` en raíz del proyecto

## 🚀 Instalación

\`\`\`bash
cd scripts
npm install
\`\`\`

## 📝 Scripts Disponibles

### 1. **Data Cleaner** - Limpieza de Datos

Corrige las 25 inconsistencias detectadas:
- ✅ Clientes numéricos → nombres descriptivos
- ✅ Adeudos negativos → créditos a favor
- ✅ Precios en cero → precios por defecto
- ✅ Clientes faltantes → creación automática
- ✅ Capitales bancarios → inicialización
- ✅ Métricas financieras → recálculo

\`\`\`bash
npm run clean
\`\`\`

**Salida:**
- `BASE_DATOS_CLEANED.json` - Datos limpios
- `CLEANING_REPORT.json` - Reporte detallado

### 2. **Firestore Migrator** - Migración a Firebase

Migra datos limpios a Firestore con estructura optimizada:
- 💰 7 Bancos + 28 subcolecciones
- 💰 96 Ventas
- 📦 9 Órdenes de Compra
- 👥 30 Clientes
- 🚚 6 Distribuidores
- 📦 Almacén + movimientos
- 📊 Métricas financieras

\`\`\`bash
npm run migrate
\`\`\`

**Progreso en tiempo real:**
\`\`\`
💰 Migrando Bancos...
   📊 bancos: 7/7 (100.0%) - Errores: 0
   ✅ Completado en 2.34s

💰 Migrando Ventas...
   📊 ventas: 96/96 (100.0%) - Errores: 0
   ✅ Completado en 5.12s
\`\`\`

### 3. **Clean + Migrate** - Proceso Completo

Ejecuta limpieza y migración en un solo comando:

\`\`\`bash
npm run clean-and-migrate
\`\`\`

### 4. **Verify** - Verificación Post-Migración

Verifica que todos los datos se hayan migrado correctamente:

\`\`\`bash
npm run verify
\`\`\`

## 📊 Estructura de Datos Migrada

### Firestore Collections (33 totales)

\`\`\`
firestore/
├── bancos (7 docs)
│   ├── azteca
│   ├── bovedaMonte
│   ├── bovedaUsa
│   ├── fleteSur
│   ├── leftie
│   ├── profit
│   └── utilidades
│
├── bancos/{bankId}/ingresos (subcollection)
├── bancos/{bankId}/gastos (subcollection)
├── bancos/{bankId}/transferencias (subcollection)
├── bancos/{bankId}/cortes (subcollection)
│
├── ventas (96 docs)
├── ordenesCompra (9 docs)
├── clientes (30 docs)
├── distribuidores (6 docs)
├── almacen
│   └── stock
│       └── movimientos (subcollection)
└── metricas
    └── financieras
\`\`\`

## 🔒 Configuración Firebase (Producción)

Para ejecutar en producción, necesitas:

1. **Service Account Key:**
   - Ve a Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Guarda como `firebase-admin-key.json` en carpeta `scripts/`

2. **Variables de entorno:**
\`\`\`bash
export GOOGLE_APPLICATION_CREDENTIALS="./firebase-admin-key.json"
\`\`\`

3. **Ejecutar migración:**
\`\`\`bash
npm run clean-and-migrate
\`\`\`

## ⚠️ Notas Importantes

### Testing Local
Los scripts pueden ejecutarse sin credenciales de Firebase Admin para:
- ✅ Limpiar datos
- ✅ Generar reportes
- ❌ Migrar a Firestore (requiere credenciales)

### Seguridad
- **NO** incluyas `firebase-admin-key.json` en Git
- Ya está en `.gitignore`
- Usa variables de entorno en CI/CD

### Límites Firestore
- Máximo 500 operaciones por batch
- Scripts dividen automáticamente en chunks
- Progreso en tiempo real con indicador %

## 🐛 Troubleshooting

### Error: "Cannot find module 'firebase-admin'"
\`\`\`bash
cd scripts && npm install
\`\`\`

### Error: "Permission denied"
\`\`\`bash
chmod +x data-cleaner.ts
chmod +x firestore-migrator.ts
\`\`\`

### Error: "GOOGLE_APPLICATION_CREDENTIALS not set"
\`\`\`bash
# Opción 1: Variable de entorno
export GOOGLE_APPLICATION_CREDENTIALS="./firebase-admin-key.json"

# Opción 2: Hardcoded en migrator (solo desarrollo)
const serviceAccount = require('./firebase-admin-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
\`\`\`

## 📈 Roadmap

- [ ] Script de backup pre-migración
- [ ] Migración incremental (delta updates)
- [ ] Rollback automático en caso de error
- [ ] Dashboard de monitoreo de migración
- [ ] Tests automatizados

## 🤝 Contribuir

Para agregar nuevos scripts de limpieza:

1. Crea nueva clase que extienda `DataCleaner`
2. Implementa método `fix*()` específico
3. Agrega a `cleanAll()` pipeline
4. Documenta en este README

---

**Desarrollado por:** Chronos Team  
**Versión:** 1.0.0  
**Última actualización:** Noviembre 2025
