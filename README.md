# Chronos - Sistema de Gestión Empresarial

![CI](https://github.com/zoro488/v0-crypto-dashboard-design/workflows/CI/badge.svg)
![Security](https://github.com/zoro488/v0-crypto-dashboard-design/workflows/Security/badge.svg)
![Quality](https://github.com/zoro488/v0-crypto-dashboard-design/workflows/Quality/badge.svg)

Sistema empresarial completo desarrollado con Next.js 16, React 19, TypeScript y Firestore.

## Características

- 🎨 Diseño premium inspirado en Apple/SpaceX/Tesla
- 🔥 Firestore como base de datos en tiempo real
- 📊 11 paneles de gestión completos
- 🎭 Animaciones fluidas con Framer Motion
- 📱 100% Responsive
- ⚡ Optimizado para rendimiento

## Instalación

```bash
# Clone the repo
git clone https://github.com/zoro488/v0-crypto-dashboard-design.git
cd v0-crypto-dashboard-design

# Install dependencies
pnpm install

# Copy environment variables template
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# Run development server
pnpm dev
```

## Configuración de Firestore

1. Crear proyecto en Firebase Console
2. Copiar credenciales a `.env.local`:

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
\`\`\`

3. Configurar reglas de Firestore:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Para desarrollo
    }
  }
}
\`\`\`

## Estructura del Proyecto

\`\`\`
chronos/
├── app/                    # App Router de Next.js
├── components/
│   ├── layout/            # Header, Sidebar
│   ├── modals/            # 11 modales de formularios
│   ├── panels/            # 11 paneles principales
│   └── ui/                # Componentes UI reutilizables
├── lib/
│   ├── firebase/          # Configuración y servicios
│   └── store/             # Estado global con Zustand
└── types/                 # TypeScript types

\`\`\`

## Paneles Implementados

1. **Dashboard** - KPIs y métricas principales
2. **Órdenes de Compra** - Gestión de compras a distribuidores
3. **Ventas** - Registro y seguimiento de ventas
4. **Distribuidores** - CRUD de distribuidores
5. **Clientes** - Gestión de clientes
6. **Banco** - Control financiero (4 sub-tablas)
7. **Almacén** - Inventario y movimientos
8. **Reportes** - Análisis y gráficos
9. **IA** - Asistente inteligente
10. **Profit** - Análisis de rentabilidad
11. **Casa de Cambio** - Tipo de cambio USD/MXN

## Tecnologías

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, TypeScript
- **Estilos**: Tailwind CSS v4
- **Animaciones**: Framer Motion
- **Base de Datos**: Firestore
- **Estado**: Zustand
- **Gráficos**: Recharts
- **Formularios**: React Hook Form

## Scripts

```bash
pnpm dev           # Desarrollo
pnpm build         # Build de producción
pnpm start         # Servidor de producción
pnpm lint          # Linting
pnpm lint:fix      # Linting con auto-fix
pnpm typecheck     # Verificación de tipos TypeScript
pnpm test          # Ejecutar tests
```

## 🚀 CI/CD

Este proyecto utiliza GitHub Actions para CI/CD automático:

### Pipelines

- **CI**: Lint, TypeCheck, Build en cada push/PR
- **Security**: CodeQL analysis, dependency review, secret scanning
- **Quality**: Bundle size analysis, Lighthouse CI

### Deploy Automático

- **Preview**: Cada PR obtiene un deploy de preview en Vercel
- **Production**: Push a `main` despliega automáticamente a producción

### Variables de Entorno para Vercel

Para configurar el deploy automático, agrega estos secrets en GitHub:

- `VERCEL_TOKEN` - Token de Vercel
- `VERCEL_ORG_ID` - ID de la organización en Vercel
- `VERCEL_PROJECT_ID` - ID del proyecto en Vercel

## Documentación Completa

Ver [CHRONOS_SYSTEM_COMPLETE.md](./CHRONOS_SYSTEM_COMPLETE.md) para documentación detallada del sistema.

## Licencia

MIT
