# 📚 CHRONOS V2 - Guía Completa de Implementación

## 🎯 Introducción

CHRONOS V2 es un sistema enterprise premium de gestión empresarial construido con las tecnologías más avanzadas y mejores prácticas de la industria.

**Stack Tecnológico:**
- ⚛️ React 18 + Vite
- 🔥 Firebase v12 (Firestore, Auth, Storage, Analytics)
- 🎨 TailwindCSS + Framer Motion
- 📝 React Hook Form + Zod
- 🗃️ TanStack Query (React Query)
- 🧪 Vitest + Playwright
- 📊 Recharts + Three.js
- 🔍 Sentry + Google Analytics 4

---

## 📁 Estructura del Proyecto

```
src/chronos-system/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes base (Button, Input, Card, etc)
│   ├── forms/          # Formularios completos
│   ├── layout/         # Layout components (Sidebar, Header)
│   └── animations/     # Animaciones avanzadas
├── pages/              # Páginas principales
│   ├── MasterDashboard.jsx
│   ├── VentasPage.jsx
│   ├── ComprasPage.jsx
│   └── ...
├── hooks/              # Custom hooks
│   ├── useCollection.js
│   ├── useDocument.js
│   └── useAuth.js
├── services/           # Servicios de Firebase
│   ├── firestore.service.js
│   ├── auth.service.js
│   └── storage.service.js
├── stores/             # Zustand stores
│   └── useAppStore.js
├── utils/              # Utilidades
│   ├── PerformanceOptimizations.js
│   ├── AccessibilityHelpers.js
│   └── validations.js
├── brand/              # Sistema de diseño
│   ├── DesignSystemV2.js
│   └── ThemeProvider.jsx
└── types/              # TypeScript types
    └── index.d.ts
```

---

## 🚀 Instalación y Configuración

### 1. Prerrequisitos

```bash
# Node.js 18+ y npm
node --version
npm --version

# Git
git --version
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Firebase

1. **Crear proyecto en Firebase Console:**
   - https://console.firebase.google.com/

2. **Habilitar servicios:**
   - ✅ Firestore Database
   - ✅ Authentication (Email/Password)
   - ✅ Storage
   - ✅ Analytics

3. **Crear archivo `.env`:**

```env
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4. Inicializar Firestore

```bash
# Ejecutar script de inicialización
npm run init:firestore
```

Esto creará las colecciones:
- `ventas`
- `compras`
- `movimientosBancarios`
- `productos`
- `clientes`
- `distribuidores`
- `gastos`

---

## 🗄️ Estructura de Datos Firestore

### Colección: `ventas`

```javascript
{
  id: string,
  fecha: Timestamp,
  cliente: string,
  clienteId: string,
  productos: [{
    productoId: string,
    nombre: string,
    cantidad: number,
    precioUnitario: number,
    subtotal: number
  }],
  subtotal: number,
  iva: number,
  total: number,
  estado: 'pendiente' | 'pagado' | 'cancelado',
  metodoPago: string,
  notas: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Colección: `compras`

```javascript
{
  id: string,
  fecha: Timestamp,
  proveedor: string,
  proveedorId: string,
  productos: [{
    productoId: string,
    nombre: string,
    cantidad: number,
    costoUnitario: number,
    subtotal: number
  }],
  subtotal: number,
  iva: number,
  total: number,
  estado: 'pendiente' | 'recibido' | 'cancelado',
  metodoPago: string,
  notas: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Colección: `movimientosBancarios`

```javascript
{
  id: string,
  fecha: Timestamp,
  tipo: 'ingreso' | 'egreso',
  monto: number,
  concepto: string,
  categoria: string,
  banco: string,
  saldo: number,
  referencia: string,
  notas: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Colección: `productos`

```javascript
{
  id: string,
  nombre: string,
  descripcion: string,
  categoria: string,
  precio: number,
  costo: number,
  stock: number,
  stockMinimo: number,
  unidad: string,
  sku: string,
  activo: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Colección: `clientes`

```javascript
{
  id: string,
  nombre: string,
  email: string,
  telefono: string,
  empresa: string,
  rfc: string,
  direccion: string,
  activo: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🎨 Sistema de Diseño

### Importar Design Tokens

```javascript
import { designTokensV2 } from '@/chronos-system/brand/DesignSystemV2';

// Usar colores
const primaryColor = designTokensV2.colors.primary[500];

// Usar gradientes
const gradient = designTokensV2.gradients.primary;

// Usar helper functions
import { getColor, getGradient, glassmorphism } from '@/chronos-system/brand/DesignSystemV2';

const color = getColor('primary.500');
const gradient = getGradient('sunset');
const glassStyles = glassmorphism('medium');
```

### Componentes Base

```javascript
import { Button } from '@/chronos-system/components/ui/Button';
import { Input } from '@/chronos-system/components/ui/Input';
import { Card } from '@/chronos-system/components/ui/Card';

// Uso
<Button variant="primary" size="lg">
  Guardar
</Button>

<Input
  label="Nombre"
  placeholder="Ingrese nombre"
  error="Campo requerido"
/>

<Card>
  <Card.Header>Título</Card.Header>
  <Card.Body>Contenido</Card.Body>
  <Card.Footer>Acciones</Card.Footer>
</Card>
```

---

## 📊 Dashboard y Datos en Tiempo Real

### Usar Custom Hooks

```javascript
import { useCollection } from '@/chronos-system/hooks/useCollection';

function MiComponente() {
  const { data: ventas, loading, error } = useCollection('ventas', {
    where: [['estado', '==', 'pagado']],
    orderBy: [['fecha', 'desc']],
    limit: 10
  });

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {ventas.map(venta => (
        <VentaCard key={venta.id} data={venta} />
      ))}
    </div>
  );
}
```

### KPI Cards

```javascript
import { KPICard } from '@/chronos-system/components/ui/KPICard';

<KPICard
  title="Ventas del Mes"
  value="$125,430.00"
  icon={TrendingUp}
  trend={{ value: 12, isPositive: true }}
  gradient="from-blue-500 to-purple-600"
/>
```

---

## 📝 Formularios

### Formulario con Validación

```javascript
import { VentaForm } from '@/chronos-system/components/forms/VentaForm';

function NuevaVenta() {
  const handleSubmit = async (data) => {
    try {
      await ventasService.create(data);
      toast.success('Venta registrada');
      navigate('/ventas');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <VentaForm
      onSubmit={handleSubmit}
      clientes={clientes}
      productos={productos}
    />
  );
}
```

---

## 🎭 Animaciones

### Usar Componentes de Animación

```javascript
import {
  Card3D,
  FloatingElement,
  HoverLift,
  RevealText,
  StaggerContainer,
  StaggerItem
} from '@/chronos-system/components/animations/AdvancedAnimations';

// Card con efecto 3D
<Card3D className="p-6 bg-white/10 rounded-xl">
  <h2>Contenido</h2>
</Card3D>

// Texto animado
<RevealText text="CHRONOS Sistema Premium" />

// Lista escalonada
<StaggerContainer>
  {items.map(item => (
    <StaggerItem key={item.id}>
      <ItemCard data={item} />
    </StaggerItem>
  ))}
</StaggerContainer>
```

---

## ⚡ Optimización de Performance

### Lazy Loading de Rutas

```javascript
import { lazy } from 'react';

const VentasPage = lazy(() => import('./pages/VentasPage'));
const ComprasPage = lazy(() => import('./pages/ComprasPage'));

// En AppRoutes.jsx
<Route path="/ventas" element={
  <Suspense fallback={<LoadingFallback />}>
    <VentasPage />
  </Suspense>
} />
```

### Memoización

```javascript
import { memo, useMemo, useCallback } from 'react';

// Componente memoizado
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  return <div>{/* renderizado pesado */}</div>;
});

// Cálculo memoizado
const total = useMemo(() => {
  return ventas.reduce((sum, venta) => sum + venta.total, 0);
}, [ventas]);

// Callback memoizado
const handleClick = useCallback(() => {
  console.log('Clicked');
}, []);
```

### Virtual Scrolling

```javascript
import { VirtualList } from '@/chronos-system/utils/PerformanceOptimizations';

<VirtualList
  items={largeArray}
  itemHeight={80}
  containerHeight={600}
  renderItem={(item) => <ItemCard data={item} />}
/>
```

---

## ♿ Accesibilidad

### Keyboard Navigation

```javascript
import { useArrowNavigation } from '@/chronos-system/utils/AccessibilityHelpers';

function Dropdown({ items, onSelect }) {
  const selectedIndex = useArrowNavigation(items.length, onSelect);

  return (
    <div role="listbox">
      {items.map((item, index) => (
        <div
          key={item.id}
          role="option"
          aria-selected={index === selectedIndex}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
```

### Screen Reader Announcements

```javascript
import { useScreenReaderAnnouncement } from '@/chronos-system/utils/AccessibilityHelpers';

function SaveButton() {
  const { announce, AnnouncementContainer } = useScreenReaderAnnouncement();

  const handleSave = async () => {
    await save();
    announce('Datos guardados exitosamente');
  };

  return (
    <>
      <button onClick={handleSave}>Guardar</button>
      <AnnouncementContainer />
    </>
  );
}
```

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
# Ejecutar tests
npm run test

# Con UI
npm run test:ui

# Coverage
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Ejecutar E2E
npm run test:e2e

# Modo UI
npm run test:e2e:ui
```

---

## 🚢 Deployment

### Build de Producción

```bash
npm run build
```

### Deploy a Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### Variables de Entorno

Asegúrate de configurar todas las variables en tu plataforma de deployment:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

---

## 📈 Monitoreo

### Sentry

```javascript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### Google Analytics

```javascript
import { analytics } from './firebase';
import { logEvent } from 'firebase/analytics';

logEvent(analytics, 'venta_registrada', {
  total: 1500,
  cliente: 'Juan Pérez'
});
```

---

## 🔒 Seguridad

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

    // Ventas
    match /ventas/{ventaId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
                     request.resource.data.total > 0;
      allow update: if request.auth != null &&
                     request.auth.uid == resource.data.createdBy;
      allow delete: if request.auth != null &&
                     request.auth.token.admin == true;
    }
  }
}
```

---

## 🆘 Troubleshooting

### Error: Firebase not initialized

**Solución:**
```javascript
// Asegúrate de importar firebaseConfig
import { db, auth } from './firebase';
```

### Error: Collection not found

**Solución:**
```bash
# Ejecutar script de inicialización
npm run init:firestore
```

### Performance Issues

**Solución:**
1. Habilitar lazy loading en rutas
2. Usar React.memo() en componentes pesados
3. Implementar virtual scrolling en listas largas
4. Optimizar imágenes (WebP)

### Build Errors

**Solución:**
```bash
# Limpiar cache
npm run clean

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Build de nuevo
npm run build
```

---

## 📚 Recursos Adicionales

- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TailwindCSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion)
- [Vitest](https://vitest.dev)
- [Playwright](https://playwright.dev)

---

## 📞 Soporte

Para reportar issues o solicitar features:
- GitHub Issues: [repositorio/issues]
- Email: support@chronos.com
- Documentación: [docs.chronos.com]

---

## 📄 Licencia

MIT License - CHRONOS V2 © 2024

---

**🎉 ¡Bienvenido a CHRONOS V2!**

Sistema enterprise premium construido con las mejores prácticas de la industria.
