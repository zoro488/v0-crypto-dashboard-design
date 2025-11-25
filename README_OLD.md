# 🚀 FlowDistributor Ultra Premium Dashboard

> Sistema empresarial ultra-premium con visualizaciones Canvas avanzadas, animaciones 60fps y diseño de clase mundial.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)]()
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)]()
[![Performance](https://img.shields.io/badge/FPS-60-success)]()

---

## ✨ Características Premium

### 🎨 **8 Visualizaciones Canvas Ultra-Premium**
- **InteractiveMetricsOrb**: Orbe orbital con métricas y partículas
- **SalesFlowDiagram**: Sankey con curvas Bézier y particle flow
- **FinancialRiverFlow**: Simulación de agua con bubble physics
- **InventoryHeatGrid**: Grid isométrico 3D con heat map
- **ClientNetworkGraph**: Grafo de fuerza con física avanzada
- **ProfitWaterfallChart**: Cascada líquida con wave physics
- **AIBrainVisualizer**: Red neuronal con pulsos eléctricos
- **ReportsTimeline**: Timeline espiral con zoom/pan

### ⚡ **Performance Optimizado**
- 60fps constante en todas las animaciones
- RequestAnimationFrame para rendering eficiente
- Physics engines optimizados
- Particle systems con lifecycle management
- Canvas rendering acelerado por GPU

### 🎭 **Animaciones Avanzadas**
- Framer Motion para transiciones suaves
- Stagger delays (0.4s - 1.2s)
- Microinteracciones premium
- Hover effects con scale y glow
- Touch-friendly interactions

### 🔥 **Tecnologías de Vanguardia**
- **Next.js 16** con Turbopack
- **React 19** con Server Components
- **TypeScript** strict mode
- **Firestore** para real-time data
- **Canvas API** para visualizaciones
- **Spline 3D** para bot interactivo

---

## 🚀 Quick Start

### Prerequisitos
- Node.js 18+ 
- npm o pnpm
- Cuenta Firebase (opcional para producción)

### Instalación Rápida

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
