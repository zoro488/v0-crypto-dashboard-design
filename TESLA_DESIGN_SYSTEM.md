# 🚀 CHRONOS Design System - Tesla 2025 Edition

## Resumen de Implementación

Sistema de diseño premium implementado siguiendo los estándares de **Apple Vision Pro**, **Tesla Cybertruck App** y **Grok.com 2025**.

---

## 📦 Componentes Creados

### 1. **ButtonTesla** (`/app/components/ui/ButtonTesla.tsx`)
```tsx
import { ButtonTesla } from '@/app/components/ui/ButtonTesla'

<ButtonTesla variant="primary">Guardar</ButtonTesla>
<ButtonTesla variant="ghost">Cancelar</ButtonTesla>
<ButtonTesla variant="destructive">Eliminar</ButtonTesla>
<ButtonTesla loading>Procesando...</ButtonTesla>
```

**Variantes:**
- `primary` - Fondo Tesla Red (#E31911)
- `secondary` - Fondo blanco, texto negro
- `ghost` - Transparente con borde
- `destructive` - Igual que primary (Tesla Red)

---

### 2. **InputTesla** (`/app/components/ui/InputTesla.tsx`)
```tsx
import { InputTesla, TextareaTesla } from '@/app/components/ui/InputTesla'

<InputTesla 
  label="Email" 
  placeholder="ejemplo@correo.com"
  error="Email inválido"
/>

<TextareaTesla 
  label="Descripción"
  rows={4}
/>
```

**Características:**
- Border-bottom only (sin bordes laterales)
- Label flotante animada
- Estados de error/success con iconos
- Línea de foco animada

---

### 3. **SelectTesla** (`/app/components/ui/SelectTesla.tsx`)
```tsx
import { SelectTesla } from '@/app/components/ui/SelectTesla'

<SelectTesla
  label="Banco"
  options={[
    { value: 'boveda_monte', label: 'Bóveda Monte', icon: <Vault /> },
    { value: 'utilidades', label: 'Utilidades', icon: <TrendingUp /> },
  ]}
  searchable
  value={selectedBank}
  onChange={setSelectedBank}
/>
```

**Características:**
- Glassmorphism dropdown
- Búsqueda integrada
- Grupos de opciones
- Multi-select opcional

---

### 4. **CardTesla** (`/app/components/ui/CardTesla.tsx`)
```tsx
import { CardTesla, CardHeader, CardContent, StatCard, BankCard } from '@/app/components/ui/CardTesla'

<CardTesla variant="glass" hover glow>
  <CardHeader title="Ventas" icon={<TrendingUp />} />
  <CardContent>
    Contenido aquí
  </CardContent>
</CardTesla>

<StatCard
  title="Ingresos"
  value={1250000}
  subtitle="Este mes"
  trend={{ value: 12.5, direction: 'up' }}
/>

<BankCard
  name="Bóveda Monte"
  balance={500000}
  isSelected
/>
```

---

### 5. **ModalTesla** (`/app/components/ui/ModalTesla.tsx`)
```tsx
import { ModalTesla, ConfirmModal } from '@/app/components/ui/ModalTesla'

<ModalTesla
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Nueva Venta"
  size="lg"
>
  <form>...</form>
</ModalTesla>

<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="¿Eliminar venta?"
  variant="danger"
/>
```

---

### 6. **TableTesla** (`/app/components/ui/TableTesla.tsx`)
```tsx
import { TableTesla, Badge } from '@/app/components/ui/TableTesla'

<TableTesla
  data={ventas}
  columns={[
    { key: 'cliente', header: 'Cliente', sortable: true },
    { key: 'monto', header: 'Monto', align: 'right', 
      render: (v) => formatCurrency(v) },
    { key: 'estado', header: 'Estado',
      render: (v) => <Badge variant={v === 'pagado' ? 'success' : 'warning'}>{v}</Badge> 
    },
  ]}
  keyExtractor={(row) => row.id}
  selectable
  pagination={{ page: 1, pageSize: 10, total: 100, onPageChange: setPage }}
/>
```

---

### 7. **ToastTesla** (`/app/components/ui/ToastTesla.tsx`)
```tsx
// En layout.tsx o providers
import { ToastProvider } from '@/app/components/ui/ToastTesla'

<ToastProvider position="bottom-right">
  {children}
</ToastProvider>

// En cualquier componente
import { useToastActions } from '@/app/components/ui/ToastTesla'

const toast = useToastActions()

toast.success('Venta registrada')
toast.error('Error al guardar')
toast.promise(saveData(), {
  loading: 'Guardando...',
  success: 'Guardado exitosamente',
  error: 'Error al guardar'
})
```

---

### 8. **SkeletonTesla** (`/app/components/ui/SkeletonTesla.tsx`)
```tsx
import { Skeleton, SkeletonCard, SkeletonKPI, SkeletonTable } from '@/app/components/ui/SkeletonTesla'

<SkeletonKPI />
<SkeletonCard showHeader showContent lines={4} />
<SkeletonTable rows={5} columns={4} />
```

---

### 9. **MobileBottomBar** (`/app/components/layout/MobileBottomBar.tsx`)
```tsx
import { MobileBottomBar } from '@/app/components/layout/MobileBottomBar'

// Solo visible en mobile (<768px)
<MobileBottomBar />
```

**Características:**
- 5 items de navegación
- Gesture swipe up para drawer
- SafeArea support
- Haptic feedback (vibración)

---

## 🎨 Variables CSS Disponibles

```css
/* Colores principales */
--tesla-red: #E31911
--tesla-red-hover: #FF453A
--background: #000000
--surface: #1C1C1E

/* Estados semánticos */
--success: #10B981
--warning: #F59E0B
--error: #E31911
--info: #3B82F6

/* Colores de bancos */
--color-boveda-monte: #8b5cf6
--color-boveda-usa: #3b82f6
--color-utilidades: #10b981
--color-fletes: #f59e0b
--color-azteca: #ec4899
--color-leftie: #6366f1
--color-profit: #14b8a6
```

---

## 📱 Clases Utilitarias

```css
/* Cards */
.tesla-card       /* Glassmorphism card */

/* Buttons */
.tesla-button-primary
.tesla-button-ghost

/* Inputs */
.tesla-input

/* Text */
.tesla-kpi        /* 64px bold numbers */
.tesla-text-primary
.tesla-text-secondary

/* Badges */
.tesla-badge-success
.tesla-badge-warning
.tesla-badge-error

/* Effects */
.glow-tesla
.hover-glow-tesla

/* Mobile */
.mobile-only
.desktop-only
.pb-safe
.mb-bottombar
```

---

## 🔧 Importación Rápida

```tsx
// Importar todo desde el índice
import {
  ButtonTesla,
  InputTesla,
  SelectTesla,
  CardTesla,
  ModalTesla,
  TableTesla,
  ToastProvider,
  useToastActions,
  Skeleton,
  formatCurrency,
  formatNumber,
  DESIGN_TOKENS,
} from '@/app/components/ui/tesla-index'
```

---

## 📐 Design Tokens

```typescript
import { DESIGN_TOKENS } from '@/app/components/ui/tesla-index'

// Uso
DESIGN_TOKENS.colors.accent        // '#E31911'
DESIGN_TOKENS.radii.xl            // '24px'
DESIGN_TOKENS.typography.kpi      // { fontSize: '64px', ... }
DESIGN_TOKENS.layout.sidebar      // { expanded: '280px', collapsed: '72px' }
```

---

## ✅ Checklist de Migración

Para migrar componentes existentes al nuevo sistema:

1. [ ] Reemplazar `Button` con `ButtonTesla`
2. [ ] Reemplazar `Input` con `InputTesla`
3. [ ] Reemplazar gradientes cyan/blue con Tesla Red (#E31911)
4. [ ] Actualizar modales a `ModalTesla`
5. [ ] Agregar `<ToastProvider>` en layout
6. [ ] Agregar `<MobileBottomBar />` en layout
7. [ ] Verificar que los KPIs usen 64px font-size
8. [ ] Actualizar focus states a Tesla Red

---

## 📝 Archivos Modificados

- `/app/globals.css` - Variables CSS actualizadas a Tesla 2025
- `/app/styles/premium-tesla-2025.css` - Sistema de diseño completo
- `/app/components/ui/*Tesla.tsx` - Componentes nuevos
- `/app/components/layout/MobileBottomBar.tsx` - Navegación mobile
