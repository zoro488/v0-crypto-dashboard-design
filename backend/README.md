# 🚀 CHRONOS Backend API

Backend API RESTful para el sistema CHRONOS. Node.js + Express + TypeScript + Firebase Admin SDK.

---

## 📋 Características

- ✅ API RESTful completa
- ✅ TypeScript con tipos estrictos
- ✅ Firebase Admin SDK para Firestore
- ✅ Autenticación JWT
- ✅ Autorización basada en roles (RBAC)
- ✅ Validación con Zod
- ✅ Logging con Winston
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Helmet security headers
- ✅ Compression
- ⏳ Testing con Jest (próximamente)

---

## 🏗️ Estructura

```
backend/
├── src/
│   ├── api/              # Controllers y rutas
│   │   ├── auth.routes.ts
│   │   ├── ventas.routes.ts
│   │   ├── compras.routes.ts
│   │   ├── almacen.routes.ts
│   │   ├── banco.routes.ts
│   │   ├── clientes.routes.ts
│   │   ├── distribuidores.routes.ts
│   │   └── index.ts
│   │
│   ├── services/         # Lógica de negocio
│   │   ├── auth.service.ts
│   │   ├── ventas.service.ts
│   │   └── ...
│   │
│   ├── models/           # Modelos de datos
│   │   ├── venta.model.ts
│   │   └── ...
│   │
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── notFoundHandler.ts
│   │
│   ├── config/           # Configuración
│   │   ├── environment.ts
│   │   ├── firebase.ts
│   │   └── logger.ts
│   │
│   ├── utils/            # Utilidades
│   │   └── ...
│   │
│   └── index.ts          # Entry point
│
├── tests/                # Testing
│   ├── unit/
│   └── e2e/
│
├── logs/                 # Logs de aplicación
├── dist/                 # Build output
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 🚀 Instalación

### 1. Instalar dependencias

```bash
cd backend
pnpm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=tu-service-account@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# JWT
JWT_SECRET=tu-super-secret-key

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Obtener credenciales de Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Seleccionar proyecto
3. Configuración del proyecto → Cuentas de servicio
4. Generar nueva clave privada (JSON)
5. Copiar valores a `.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

---

## 🏃 Ejecución

### Desarrollo

```bash
pnpm dev
```

El servidor estará en: `http://localhost:3001`

### Build

```bash
pnpm build
```

### Producción

```bash
pnpm start
```

### Testing

```bash
# Unit tests
pnpm test

# Coverage
pnpm test --coverage

# E2E tests
pnpm test:e2e

# Watch mode
pnpm test:watch
```

### Linting

```bash
# Check
pnpm lint

# Fix
pnpm lint:fix

# Format
pnpm format
```

---

## 📡 Endpoints API

### Base URL

- **Desarrollo**: `http://localhost:3001/api/v1`
- **Producción**: `https://your-api-domain.com/api/v1`

### Autenticación

```bash
# Login
POST /auth/login
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password123"
}

# Register
POST /auth/register
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}

# Get current user (requiere auth)
GET /auth/me
Authorization: Bearer <token>

# Logout
POST /auth/logout
Authorization: Bearer <token>
```

### Ventas

```bash
# Get all ventas (requiere auth)
GET /ventas
Authorization: Bearer <token>

# Get venta by ID
GET /ventas/:id
Authorization: Bearer <token>

# Create venta
POST /ventas
Authorization: Bearer <token>
Content-Type: application/json
{
  "clienteId": "...",
  "productos": [...],
  "total": 1000
}

# Update venta
PUT /ventas/:id
Authorization: Bearer <token>
Content-Type: application/json
{...}

# Delete venta
DELETE /ventas/:id
Authorization: Bearer <token>
```

### Compras, Almacén, Banco, Clientes, Distribuidores

Similar estructura CRUD. Ver documentación completa en `/api/v1/docs`

---

## 🔒 Autenticación

El API usa JWT (JSON Web Tokens) para autenticación.

### Headers requeridos

```
Authorization: Bearer <your-jwt-token>
```

### Obtener token

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "uid": "user-id",
      "email": "user@example.com"
    }
  }
}
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test auth.service.test.ts

# Coverage report
pnpm test --coverage

# E2E tests
pnpm test:e2e
```

---

## 📊 Logging

Los logs se guardan en:

- `logs/error.log` - Solo errores
- `logs/combined.log` - Todos los logs
- `logs/exceptions.log` - Excepciones no capturadas
- `logs/rejections.log` - Promise rejections

### Niveles de log

- `error` - Errores
- `warn` - Advertencias
- `info` - Información general
- `http` - Requests HTTP
- `debug` - Debug (solo development)

---

## 🚢 Deployment

### Railway

```bash
# Install Railway CLI
npm install -g railway

# Login
railway login

# Create project
railway init

# Add environment variables
railway variables set FIREBASE_PROJECT_ID=...
railway variables set JWT_SECRET=...

# Deploy
railway up
```

### Render

```bash
# Connect GitHub repo
# Add environment variables in dashboard
# Deploy automatically on push
```

### Heroku

```bash
heroku create chronos-api
heroku config:set FIREBASE_PROJECT_ID=...
git push heroku main
```

---

## 🔐 Seguridad

- ✅ Helmet security headers
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Input validation
- ✅ JWT tokens
- ✅ Firebase security rules
- ⏳ HTTPS obligatorio (producción)
- ⏳ API key rotation
- ⏳ Request signing

---

## 📈 Performance

- ✅ Compression habilitada
- ✅ Response caching headers
- ⏳ Redis caching (opcional)
- ⏳ Database indexing
- ⏳ Query optimization

---

## 🐛 Debugging

### Logs en tiempo real

```bash
pnpm dev
```

### Inspeccionar con Node

```bash
node --inspect dist/index.js
```

Abrir Chrome DevTools: `chrome://inspect`

---

## 🤝 Contribución

1. Crear branch desde `main`
2. Hacer cambios
3. Agregar tests
4. Push y crear PR
5. Review y merge

---

## 📄 Licencia

MIT License - © 2025 zoro488

---

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/zoro488/chronos-system/issues)
- **Docs**: `/api/v1/docs`
- **Health**: `/health`

---

**🌌 CHRONOS Backend API - Powering the Future**
