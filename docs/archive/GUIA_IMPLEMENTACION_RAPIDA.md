# 🚀 GUÍA DE IMPLEMENTACIÓN RÁPIDA
## CHRONOS 2026 - Quick Start

---

> **OBJETIVO**: Tener el sistema 100% funcional en 5 días

---

## 📋 CHECKLIST PRE-IMPLEMENTACIÓN

```bash
# Verificar dependencias
pnpm install

# Verificar tipos
pnpm type-check

# Verificar que formulas.ts existe
cat app/lib/formulas.ts | head -50

# Verificar tipos
cat app/types/index.ts | head -100

# Verificar constantes
cat app/lib/constants.ts
```

---

## 📅 PLAN DE 5 DÍAS

### DÍA 1: CORE & STORE

**Objetivo**: Configurar estado global con persistencia

#### Tareas:

```markdown
[ ] 1. Instalar dependencias de persistencia
    pnpm add idb-keyval

[ ] 2. Actualizar useAppStore.ts con:
    - Persistencia IndexedDB
    - Acciones CRUD para ventas
    - Acciones CRUD para OCs
    - Sincronización de bancos

[ ] 3. Cargar datos iniciales (de CSV o mock)
    - 7 bancos con saldos iniciales
    - 31 clientes
    - 6 distribuidores
    - 9 OCs con stock

[ ] 4. Verificar que el store persiste al refrescar
```

**Código a implementar**:

```typescript
// app/lib/store/useAppStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'

// Ver BLUEPRINT_MAESTRO_CHRONOS_2026.md sección 9.1
```

---

### DÍA 2: DASHBOARD + KPIs

**Objetivo**: Dashboard funcional con datos reales

#### Tareas:

```markdown
[ ] 1. Implementar BentoDashboard.tsx
    - Usar prompt de PROMPTS_14_PANELES sección 8.2

[ ] 2. Implementar componentes:
    - KPICard
    - BancoBar
    - MovimientoItem

[ ] 3. Conectar con useAppStore
    - useMemo para cálculos
    - Actualización automática

[ ] 4. Animaciones con Framer Motion
    - Entry staggered
    - Hover effects
```

**Verificación**:

```markdown
[ ] KPIs muestran datos correctos
[ ] 7 bancos visibles con saldos
[ ] Últimos movimientos actualizados
[ ] Gráfico de tendencia funcional
```

---

### DÍA 3: PANEL VENTAS (CRÍTICO)

**Objetivo**: CRUD de ventas con distribución automática

#### Tareas:

```markdown
[ ] 1. Implementar BentoVentasPremium.tsx
    - Usar prompt de PROMPTS_14_PANELES sección 8.3

[ ] 2. Formulario con react-hook-form + Zod

[ ] 3. Preview de distribución en tiempo real
    - Usar calcularVentaCompleta() de formulas.ts

[ ] 4. Al submit:
    - Validar stock
    - Crear venta
    - Actualizar OC (stock)
    - Actualizar bancos (si hay pago)
    - Actualizar cliente (deuda)

[ ] 5. Verificar que UI se actualiza inmediatamente
```

**Test manual**:

```markdown
[ ] Crear venta de 5 unidades a $10,000
[ ] Verificar distribución:
    - Bóveda Monte = 5 × precioCompra
    - Flete Sur = 5 × $500
    - Utilidades = 5 × (10000 - precioCompra - 500)
[ ] Verificar stock de OC redujo
[ ] Verificar capital de bancos aumentó
```

---

### DÍA 4: PANELES BANCO + OCs

**Objetivo**: 7 paneles de banco + gestión de OCs

#### Tareas:

```markdown
[ ] 1. Implementar BentoBanco.tsx (template reutilizable)
    - Usar prompt de PROMPTS_14_PANELES sección 8.4

[ ] 2. Crear 7 instancias del panel banco

[ ] 3. Implementar BentoOrdenesCompra.tsx
    - CRUD de OCs
    - Stock disponible

[ ] 4. Conectar OCs con ventas
    - OC tiene stock
    - Venta reduce stock
```

---

### DÍA 5: CLIENTES, DISTRIBUIDORES, ALMACÉN

**Objetivo**: Completar entidades y relaciones

#### Tareas:

```markdown
[ ] 1. Implementar BentoClientesPremium.tsx
    - 31 clientes
    - Ver deuda
    - Registrar abono

[ ] 2. Implementar BentoDistribuidores.tsx
    - 6 distribuidores
    - Ver deuda a proveedores
    - Registrar pago

[ ] 3. Implementar BentoAlmacenPremium.tsx
    - Stock de OCs
    - Vista consolidada

[ ] 4. Testing E2E básico
```

---

## 🔧 SNIPPETS DE CÓDIGO ESENCIALES

### Snippet 1: Hook para crear venta

```typescript
// app/hooks/useCreateVenta.ts
import { useAppStore } from '@/app/lib/store/useAppStore'
import { calcularVentaCompleta } from '@/app/lib/formulas'
import { toast } from 'sonner'

export function useCreateVenta() {
  const { 
    ordenesCompra, 
    clientes,
    addVenta,
    updateOrdenCompra,
    updateBanco,
    updateCliente,
  } = useAppStore()

  const crearVenta = async (input: NuevaVentaInput) => {
    // 1. Obtener OC para precioCompra
    const oc = ordenesCompra.find(o => o.id === input.ocRelacionada)
    if (!oc) throw new Error('OC no encontrada')
    if (oc.stockActual < input.cantidad) throw new Error('Stock insuficiente')

    // 2. Calcular distribución
    const resultado = calcularVentaCompleta({
      cantidad: input.cantidad,
      precioVenta: input.precioVenta,
      precioCompra: oc.costoDistribuidor,
      precioFlete: input.flete === 'Aplica' ? 500 : 0,
      montoPagado: input.montoPagado,
    })

    // 3. Crear venta
    const nuevaVenta = {
      id: `V${Date.now()}`,
      fecha: new Date().toISOString(),
      clienteId: input.clienteId,
      cliente: clientes.find(c => c.id === input.clienteId)?.nombre || '',
      ocRelacionada: input.ocRelacionada,
      cantidad: input.cantidad,
      precioVenta: input.precioVenta,
      ingreso: resultado.totalVenta,
      estadoPago: resultado.estadoPago,
      montoPagado: input.montoPagado,
      montoRestante: resultado.montoRestante,
      distribucionBancos: resultado.distribucionReal,
      // ... más campos
    }
    
    addVenta(nuevaVenta)

    // 4. Actualizar stock de OC
    updateOrdenCompra(oc.id, {
      stockActual: oc.stockActual - input.cantidad
    })

    // 5. Actualizar bancos (solo si hay pago)
    if (resultado.estadoPago !== 'pendiente') {
      const { distribucionReal } = resultado
      
      updateBanco('boveda_monte', { 
        historicoIngresos: prev => prev + distribucionReal.bovedaMonte 
      })
      updateBanco('flete_sur', { 
        historicoIngresos: prev => prev + distribucionReal.fletes 
      })
      updateBanco('utilidades', { 
        historicoIngresos: prev => prev + distribucionReal.utilidades 
      })
    }

    // 6. Actualizar deuda cliente (si hay)
    if (resultado.montoRestante > 0) {
      updateCliente(input.clienteId, {
        deuda: prev => prev + resultado.montoRestante
      })
    }

    toast.success('Venta registrada exitosamente')
    return nuevaVenta
  }

  return { crearVenta }
}
```

### Snippet 2: Preview de distribución en formulario

```tsx
// Componente de preview para modal de venta
function DistribucionPreview({ 
  ocId, 
  cantidad, 
  precioVenta, 
  flete, 
  montoPagado 
}: {
  ocId: string
  cantidad: number
  precioVenta: number
  flete: 'Aplica' | 'NoAplica'
  montoPagado: number
}) {
  const { ordenesCompra } = useAppStore()
  
  const preview = useMemo(() => {
    const oc = ordenesCompra.find(o => o.id === ocId)
    if (!oc || !cantidad || !precioVenta) return null
    
    return calcularVentaCompleta({
      cantidad,
      precioVenta,
      precioCompra: oc.costoDistribuidor,
      precioFlete: flete === 'Aplica' ? 500 : 0,
      montoPagado,
    })
  }, [ocId, cantidad, precioVenta, flete, montoPagado, ordenesCompra])
  
  if (!preview) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-gradient-to-r from-[#8B00FF]/10 to-[#FF1493]/10 rounded-2xl p-6 border border-[#8B00FF]/20"
    >
      <h3 className="text-lg font-semibold text-white mb-4">
        📊 Preview Distribución
      </h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <DistribucionBar 
          label="Bóveda Monte" 
          value={preview.distribucionReal.bovedaMonte}
          total={preview.totalVenta}
          color="blue"
          description="COSTO"
        />
        <DistribucionBar 
          label="Flete Sur" 
          value={preview.distribucionReal.fletes}
          total={preview.totalVenta}
          color="orange"
          description="FLETE"
        />
        <DistribucionBar 
          label="Utilidades" 
          value={preview.distribucionReal.utilidades}
          total={preview.totalVenta}
          color="green"
          description="GANANCIA"
        />
      </div>
      
      <div className="flex justify-between items-center pt-4 border-t border-white/10">
        <div>
          <span className="text-gray-400">Total Venta:</span>
          <span className="text-2xl font-bold text-[#FFD700] ml-2">
            {formatCurrency(preview.totalVenta)}
          </span>
        </div>
        <Badge className={
          preview.estadoPago === 'completo' 
            ? 'bg-green-500/20 text-green-400' 
            : preview.estadoPago === 'parcial'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-red-500/20 text-red-400'
        }>
          {preview.estadoPago.toUpperCase()}
        </Badge>
      </div>
      
      {preview.montoRestante > 0 && (
        <div className="mt-2 text-sm text-red-400">
          Deuda cliente: {formatCurrency(preview.montoRestante)}
        </div>
      )}
    </motion.div>
  )
}
```

### Snippet 3: Barra de distribución animada

```tsx
function DistribucionBar({ 
  label, 
  value, 
  total, 
  color, 
  description 
}: {
  label: string
  value: number
  total: number
  color: 'blue' | 'orange' | 'green'
  description: string
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  
  const colors = {
    blue: {
      bg: 'bg-blue-500/20',
      fill: 'bg-blue-500',
      text: 'text-blue-400',
    },
    orange: {
      bg: 'bg-orange-500/20',
      fill: 'bg-orange-500',
      text: 'text-orange-400',
    },
    green: {
      bg: 'bg-green-500/20',
      fill: 'bg-green-500',
      text: 'text-green-400',
    },
  }
  
  const c = colors[color]
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className={`${c.text} text-xs`}>{description}</span>
      </div>
      
      <div className={`h-3 rounded-full ${c.bg} overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${c.fill}`}
        />
      </div>
      
      <div className={`text-right font-mono font-semibold ${c.text}`}>
        {formatCurrency(value)}
      </div>
    </div>
  )
}
```

---

## 🧪 TESTS MANUALES

### Test 1: Venta Completa

```markdown
ESCENARIO: Venta con pago completo

PASOS:
1. Ir a panel Ventas
2. Click "Nueva Venta"
3. Seleccionar cliente: "Juan Pérez"
4. Seleccionar OC: "OC0001" (stock: 50, costo: $6,300)
5. Cantidad: 10
6. Precio Venta: $10,000
7. Flete: Aplica
8. Monto Pagado: $100,000 (slider al 100%)

VERIFICAR:
[ ] Preview muestra:
    - Total: $100,000
    - BM: $63,000
    - FL: $5,000
    - UT: $32,000
    - Estado: COMPLETO

[ ] Después de guardar:
    - Nueva fila en tabla de ventas
    - OC0001 stock: 40 (era 50)
    - Bóveda Monte: +$63,000
    - Flete Sur: +$5,000
    - Utilidades: +$32,000
    - Cliente sin deuda nueva
```

### Test 2: Venta Parcial

```markdown
ESCENARIO: Venta con pago 50%

PASOS:
1. Mismos pasos anteriores
2. Monto Pagado: $50,000 (slider al 50%)

VERIFICAR:
[ ] Preview muestra:
    - Total: $100,000
    - BM: $31,500 (63,000 × 50%)
    - FL: $2,500 (5,000 × 50%)
    - UT: $16,000 (32,000 × 50%)
    - Estado: PARCIAL
    - Deuda: $50,000

[ ] Después de guardar:
    - Bancos actualizados con 50%
    - Cliente tiene deuda: +$50,000
```

### Test 3: Abono de Cliente

```markdown
ESCENARIO: Cliente abona $25,000 a deuda de $50,000

PASOS:
1. Ir a panel Clientes
2. Buscar cliente con deuda
3. Click "Abonar"
4. Monto: $25,000
5. Banco destino: Bóveda Monte (o distribución automática)

VERIFICAR:
[ ] Deuda cliente: $25,000 (era $50,000)
[ ] Bancos actualizados proporcionalmente:
    - BM: +$15,750
    - FL: +$1,250
    - UT: +$8,000
```

---

## 🎨 ESTILOS RÁPIDOS

### Glassmorphism Card

```css
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 0, 255, 0.2);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.glass-card:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 48px rgba(139, 0, 255, 0.3);
  transition: all 0.3s ease;
}
```

### Gradient Text

```css
.gradient-text {
  background: linear-gradient(135deg, #8B00FF, #FF1493);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Montos Dorados

```css
.amount-gold {
  font-family: 'Space Grotesk', monospace;
  font-size: 2rem;
  font-weight: 600;
  color: #FFD700;
}
```

---

## 📁 ESTRUCTURA FINAL DE ARCHIVOS

```
app/
├── components/
│   ├── panels/
│   │   ├── BentoDashboard.tsx       ✅ DÍA 2
│   │   ├── BentoVentasPremium.tsx   ✅ DÍA 3
│   │   ├── BentoOrdenesCompra.tsx   ✅ DÍA 4
│   │   ├── BentoBanco.tsx           ✅ DÍA 4
│   │   ├── BentoClientesPremium.tsx ✅ DÍA 5
│   │   ├── BentoDistribuidores.tsx  ✅ DÍA 5
│   │   └── BentoAlmacenPremium.tsx  ✅ DÍA 5
│   ├── ui/
│   │   ├── KPICard.tsx
│   │   ├── StatBadge.tsx
│   │   ├── DistribucionBar.tsx
│   │   └── DistribucionPreview.tsx
│   └── modals/
│       ├── VentaModal.tsx
│       ├── OrdenCompraModal.tsx
│       ├── AbonoModal.tsx
│       └── TransferenciaModal.tsx
├── hooks/
│   ├── useCreateVenta.ts
│   ├── useCreateOrdenCompra.ts
│   ├── useCreateAbono.ts
│   └── useBancoStats.ts
├── lib/
│   ├── store/
│   │   └── useAppStore.ts           ✅ DÍA 1
│   ├── formulas.ts                  ✅ Ya existe
│   ├── constants.ts                 ✅ Ya existe
│   └── utils/
│       └── formatters.ts
└── types/
    └── index.ts                     ✅ Ya existe
```

---

## ⚡ COMANDOS DE DESARROLLO

```bash
# Desarrollo
pnpm dev

# Ver errores de tipos
pnpm type-check

# Lint
pnpm lint

# Build
pnpm build

# Tests
pnpm test
```

---

## ✅ CHECKLIST FINAL

```markdown
[ ] Store con persistencia IndexedDB
[ ] 7 bancos con saldos
[ ] Dashboard con KPIs actualizados
[ ] Panel Ventas con distribución GYA
[ ] Panel OCs con stock
[ ] 7 paneles de banco
[ ] Panel Clientes con abonos
[ ] Panel Distribuidores
[ ] Panel Almacén
[ ] UI se actualiza inmediatamente después de forms
[ ] Diseño glassmorphism premium
[ ] Paleta: negro, violeta, dorado, rosa (SIN CYAN)
[ ] Animaciones Framer Motion
```

---

*Documento: GUIA_IMPLEMENTACION_RAPIDA.md*
*Versión: 1.0.0*
