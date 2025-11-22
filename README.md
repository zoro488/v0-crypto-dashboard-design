# Chronos - Sistema de Gestión Empresarial

Sistema empresarial completo desarrollado con Next.js 16, React 19, TypeScript y Firestore.

## Características

- 🎨 Diseño premium inspirado en Apple/SpaceX/Tesla
- 🔥 Firestore como base de datos en tiempo real
- 📊 11 paneles de gestión completos
- 🎭 Animaciones fluidas con Framer Motion
- 📱 100% Responsive
- ⚡ Optimizado para rendimiento

## Instalación

\`\`\`bash
npm install
npm run dev
\`\`\`

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

\`\`\`bash
npm run dev      # Desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linting
\`\`\`

## Documentación Completa

Ver [CHRONOS_SYSTEM_COMPLETE.md](./CHRONOS_SYSTEM_COMPLETE.md) para documentación detallada del sistema.

## Licencia

MIT
