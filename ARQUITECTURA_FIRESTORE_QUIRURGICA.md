# 🏗️ ARQUITECTURA FIRESTORE QUIRÚRGICA - SISTEMA CHRONOS

**Generado:** 2024 | **Análisis:** Exhaustivo | **Versión:** FINAL

---

## 📊 RESUMEN EJECUTIVO

### Estado Actual de Firestore
Se encontraron **36 colecciones** en el proyecto `premium-ecosystem-1760790572`, muchas de ellas:
- Fragmentadas (datos duplicados)
- Con nombres inconsistentes (camelCase vs snake_case)
- Obsoletas o vacías
- Sin uso en la UI actual

### Problemas Críticos Identificados

| Problema | Severidad | Impacto |
|----------|-----------|---------|
| `ordenesCompra` (11 docs) vs `ordenes_compra` (300 docs) | 🔴 CRÍTICO | BentoOrdenesCompra puede leer colección equivocada |
| 7 colecciones `*_ingresos` separadas | 🟡 MEDIO | Datos fragmentados, difícil análisis |
| Store Zustand persiste datos duplicados | 🟡 MEDIO | Inconsistencia local/remoto |
| Bank IDs inconsistentes | 🟡 MEDIO | Queries pueden fallar |
| `firestore-service.ts` legacy con nombres incorrectos | 🔴 CRÍTICO | Escrituras a colecciones equivocadas |

---

## 🔍 ANÁLISIS DE FLUJO DE DATOS POR COMPONENTE

### 1. BentoDashboard.tsx

```
FUENTE DE DATOS:
├─ useAppStore (Zustand) → bancos, totalCapital
├─ useVentas() → colección: "ventas" (193 docs)
├─ useOrdenesCompra() → colección: "ordenes_compra" (300 docs)
└─ useProductos() → colección: "almacen_productos" (0 docs?) 

CÁLCULOS:
├─ capitalTotal = sum(bancos.saldo) → PROBLEMA: viene de Zustand, no de Firestore
├─ ventasMes = sum(ventas.montoTotal)
├─ stockActual = sum(productos.stock)
└─ ordenesActivas = count(ordenes donde estado="pendiente")

ACCIONES:
├─ Nueva Orden → CreateOrdenCompraModal
├─ Registrar Venta → CreateVentaModal
└─ Transferencia → CreateTransferenciaModal
```

**🚨 PROBLEMA:** Los saldos bancarios vienen de Zustand persistido localmente, no de Firestore en tiempo real.

---

### 2. BentoVentas.tsx

```
FUENTE DE DATOS:
└─ useVentasData() → colección: "ventas"

CAMPOS ESPERADOS POR UI:
├─ precioTotalVenta: number
├─ montoPagado: number
├─ montoRestante: number
├─ estadoPago: "completo" | "parcial" | "pendiente"
├─ cliente: string
├─ fecha: Timestamp
├─ cantidad: number
└─ producto: string

KPIS:
├─ Ventas Totales = sum(precioTotalVenta)
├─ Cobrado = sum(montoPagado)
├─ Por Cobrar = sum(montoRestante)
└─ Pendientes = count(estadoPago != "completo")

MODAL: CreateVentaModal → procesarVentaAtomica()
```

**✅ CORRECTO:** Usa hook blindado que lee de "ventas"

---

### 3. BentoClientes.tsx

```
FUENTE DE DATOS:
└─ useClientes() → colección: "clientes"

CAMPOS ESPERADOS:
├─ nombre: string
├─ telefono: string
├─ email: string
├─ totalVentas: number (calculado)
├─ deudaTotal: number
└─ totalPagado: number

KPIS:
├─ Total Clientes = count(clientes)
├─ Clientes Activos = count(clientes con ventas > 0)
├─ Con Deuda = count(deudaTotal > 0)
└─ Deuda Total = sum(deudaTotal)
```

**✅ CORRECTO:** Usa hook blindado que lee de "clientes"

---

### 4. BentoDistribuidores.tsx

```
FUENTE DE DATOS:
├─ useDistribuidores() → colección: "distribuidores"
└─ useOrdenesCompra() → colección: "ordenes_compra"

CAMPOS ESPERADOS:
├─ nombre: string
├─ totalOrdenesCompra: number
├─ deudaTotal: number
├─ totalPagado: number
└─ ordenesCompra: string[] (referencias)

KPIS:
├─ Total Compras = sum(totalOrdenesCompra)
├─ Adeudo Total = sum(deudaTotal)
├─ Total Pagado = sum(totalPagado)
└─ Órdenes = count(ordenesCompra)
```

**✅ CORRECTO:** Usa hooks blindados

---

### 5. BentoOrdenesCompra.tsx

```
FUENTE DE DATOS:
└─ suscribirOrdenesCompra() → firestore-service.ts → "ordenesCompra" (camelCase)

🚨 PROBLEMA CRÍTICO:
└─ firestore-service.ts define: COLLECTIONS.ORDENES_COMPRA = "ordenesCompra" 
└─ Pero los datos REALES están en: "ordenes_compra" (300 docs)
└─ "ordenesCompra" solo tiene 11 docs (datos antiguos/test)
```

**🔴 CRÍTICO:** Este componente podría estar leyendo de la colección EQUIVOCADA

---

### 6. BentoBanco.tsx

```
FUENTE DE DATOS:
├─ useIngresosBanco(bancoId) → "movimientos" WHERE bancoId == X
├─ useGastos(bancoId) → "movimientos" WHERE bancoId == X
├─ useTransferencias(bancoId) → "movimientos" WHERE bancoId == X
└─ useCorteBancario(bancoId) → "cortes_bancarios" WHERE bancoId == X

ESTRUCTURA DE MOVIMIENTOS:
├─ tipoMovimiento: "ingreso" | "gasto" | "transferencia_entrada" | "transferencia_salida"
├─ monto: number
├─ fecha: Timestamp
├─ concepto: string
└─ bancoId: string

PROBLEMA DE BANK IDs:
├─ useAppStore define: "boveda-monte", "boveda-usa" (kebab-case)
├─ Firestore puede tener: "bovedaMonte", "boveda_monte" (inconsistente)
```

**🟡 PROBLEMA:** IDs de banco pueden no coincidir entre Store y Firestore

---

### 7. BentoAlmacen.tsx

```
FUENTE DE DATOS:
├─ useProductos() → "almacen_productos"
├─ useEntradasAlmacen() → "almacen_entradas"
└─ useSalidasAlmacen() → "almacen_salidas"

CAMPOS PRODUCTOS:
├─ nombre: string
├─ stock | stockActual: number
├─ valorUnitario | precio: number
└─ categoria?: string

CAMPOS ENTRADAS/SALIDAS:
├─ fecha: Date
├─ cantidad: number
├─ origen | destino: string
├─ valorUnitario: number
├─ valorTotal: number
└─ referencia?: string
```

**✅ CORRECTO:** Usa hooks blindados

---

## 📋 INVENTARIO DE COLECCIONES FIRESTORE

### Colecciones CON DATOS (En Uso)

| Colección | Docs | Usado Por | Estado |
|-----------|------|-----------|--------|
| `ventas` | 193 | BentoVentas, useVentasData | ✅ OK |
| `clientes` | 64 | BentoClientes, useClientesData | ✅ OK |
| `ordenes_compra` | 300 | useOrdenesCompraData | ✅ OK |
| `distribuidores` | 14 | BentoDistribuidores | ✅ OK |
| `bancos` | 8 | Configuración | ✅ OK |
| `almacen` | 215 | ? | 🟡 Verificar uso |
| `gya` | 300 | ? | 🟡 ¿Duplica movimientos? |
| `transaccionesBoveda` | 299 | ? | 🟡 ¿Obsoleta? |
| `transaccionesBanco` | 81 | ? | 🟡 ¿Obsoleta? |
| `movimientos` | ? | BentoBanco, useGYAData | ✅ OK |

### Colecciones FRAGMENTADAS (Ingresos por Banco)

| Colección | Docs | Consolidar En |
|-----------|------|---------------|
| `boveda_monte_ingresos` | 69 | → `movimientos` |
| `boveda_usa_ingresos` | 17 | → `movimientos` |
| `profit_ingresos` | 55 | → `movimientos` |
| `leftie_ingresos` | 9 | → `movimientos` |
| `azteca_ingresos` | 6 | → `movimientos` |
| `flete_sur_ingresos` | 58 | → `movimientos` |
| `utilidades_ingresos` | 50 | → `movimientos` |

### Colecciones DUPLICADAS/OBSOLETAS

| Colección | Docs | Acción |
|-----------|------|--------|
| `ordenesCompra` | 11 | 🗑️ ELIMINAR (legacy camelCase) |
| `almacen_productos` | 0 | 🔄 Poblar con datos de `almacen` |
| `gastos_abonos` | 0 | 🗑️ ELIMINAR (vacía) |
| `movimientos_distribuidor` | 0 | 🗑️ ELIMINAR (vacía) |

### Colecciones VACÍAS

```
almacen_entradas, almacen_salidas, almacen_productos,
cortes_bancarios, dashboard_paneles, dashboard_totales,
gastos_abonos, ingresos, modificaciones_almacen,
movimientos_distribuidor, reportes
```

---

## 🛡️ ARQUITECTURA OBJETIVO

### Colecciones Finales (Consolidadas)

```
CHRONOS FIRESTORE SCHEMA v2.0
├── ventas                    # Todas las ventas
├── clientes                  # Clientes únicos
├── distribuidores            # Proveedores
├── ordenes_compra            # Órdenes de compra (snake_case)
├── bancos                    # Configuración de bancos
│   └── {bancoId}/...         # Subcolecciones si necesario
├── movimientos               # TODOS los movimientos financieros
│   ├── tipo: ingreso | gasto | transferencia_entrada | transferencia_salida | abono
│   ├── bancoId: string
│   ├── monto: number
│   ├── fecha: Timestamp
│   ├── concepto: string
│   └── referencia?: string
├── almacen_productos         # Inventario actual
├── almacen_entradas          # Histórico de entradas
├── almacen_salidas           # Histórico de salidas
├── cortes_bancarios          # Cierres periódicos
└── reportes                  # Reportes generados
```

### Esquemas de Documentos

#### Venta
```typescript
interface Venta {
  id: string
  fecha: Timestamp
  clienteId: string
  cliente: string
  producto: string
  cantidad: number
  precioVentaUnidad: number
  precioCompraUnidad: number
  precioFlete: number
  precioTotalUnidad: number
  precioTotalVenta: number
  montoPagado: number
  montoRestante: number
  estadoPago: "completo" | "parcial" | "pendiente"
  creadoPor?: string
  updatedAt?: Timestamp
}
```

#### Movimiento (Unificado)
```typescript
interface Movimiento {
  id: string
  fecha: Timestamp
  bancoId: string  // boveda_monte, boveda_usa, profit, leftie, azteca, flete_sur, utilidades
  tipoMovimiento: "ingreso" | "gasto" | "transferencia_entrada" | "transferencia_salida" | "abono"
  monto: number
  concepto: string
  referencia?: string  // ID de venta, orden, etc.
  tipoReferencia?: "venta" | "orden_compra" | "manual"
  origenDestino?: string  // Para transferencias
  creadoPor?: string
}
```

#### Producto Almacén
```typescript
interface ProductoAlmacen {
  id: string
  nombre: string
  stock: number
  valorUnitario: number
  categoria?: string
  minStock?: number
  maxStock?: number
  updatedAt: Timestamp
}
```

---

## 🔧 CORRECCIONES CRÍTICAS REQUERIDAS

### 1. Arreglar firestore-service.ts

```typescript
// ANTES (INCORRECTO)
const COLLECTIONS = {
  ORDENES_COMPRA: "ordenesCompra",  // ❌ camelCase - colección equivocada
}

// DESPUÉS (CORRECTO)
const COLLECTIONS = {
  ORDENES_COMPRA: "ordenes_compra",  // ✅ snake_case - colección real
}
```

### 2. Estandarizar Bank IDs

```typescript
// IDs oficiales (snake_case)
type BancoId = 
  | "boveda_monte"
  | "boveda_usa"
  | "profit"
  | "leftie"
  | "azteca"
  | "flete_sur"
  | "utilidades"
```

### 3. Eliminar duplicidad Zustand ↔ Firestore

El store Zustand NO debe persistir datos de negocio, solo:
- UI state (currentPanel, sidebarCollapsed, theme)
- Voice agent state
- 3D state

Los datos de negocio deben venir SOLO de Firestore via hooks.

### 4. Migrar datos fragmentados a `movimientos`

```bash
# Script de migración
boveda_monte_ingresos (69) → movimientos (bancoId: "boveda_monte", tipoMovimiento: "ingreso")
boveda_usa_ingresos (17) → movimientos (bancoId: "boveda_usa", tipoMovimiento: "ingreso")
# ... etc
```

---

## 📊 FLUJO DE DATOS CORREGIDO

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA OBJETIVO                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────┐    ┌─────────────────────┐    ┌───────────────┐  │
│  │ UI COMPONENTS │ ←→ │ FIRESTORE HOOKS     │ ←→ │  FIRESTORE    │  │
│  │ (Bento*)      │    │ (blindados)         │    │  (única       │  │
│  │               │    │                     │    │   fuente)     │  │
│  └───────────────┘    └─────────────────────┘    └───────────────┘  │
│         │                                                            │
│         ↓                                                            │
│  ┌───────────────┐                                                   │
│  │ ZUSTAND STORE │ ← Solo UI State (NO datos de negocio)            │
│  │ (local only)  │                                                   │
│  └───────────────┘                                                   │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                     TRANSACCIONES ATÓMICAS                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  CreateVentaModal → procesarVentaAtomica() → runTransaction()       │
│  ├─ UPDATE almacen_productos (stock -X)                              │
│  ├─ CREATE ventas (nuevo doc)                                        │
│  ├─ CREATE almacen_salidas (registro)                                │
│  ├─ CREATE movimientos (ingreso si hay pago)                         │
│  └─ UPDATE clientes (deuda si crédito)                               │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Correcciones Críticas
- [ ] Cambiar `ordenesCompra` → `ordenes_compra` en firestore-service.ts
- [ ] Estandarizar BancoId a snake_case en toda la aplicación
- [ ] Verificar que BentoOrdenesCompra use hook correcto

### Fase 2: Migración de Datos
- [ ] Migrar 7 colecciones `*_ingresos` a `movimientos`
- [ ] Poblar `almacen_productos` desde `almacen`
- [ ] Eliminar `ordenesCompra` (legacy)

### Fase 3: Limpieza
- [ ] Remover datos de negocio del store Zustand
- [ ] Eliminar colecciones vacías/obsoletas
- [ ] Actualizar firestore.rules para nueva estructura

### Fase 4: Verificación
- [ ] Probar todos los paneles con datos reales
- [ ] Verificar transacciones atómicas
- [ ] Performance test con 300+ documentos

---

## 📝 NOTAS FINALES

### Colecciones a MANTENER (8)
```
ventas, clientes, distribuidores, ordenes_compra,
bancos, movimientos, almacen_productos, cortes_bancarios
```

### Colecciones a ELIMINAR (28)
```
ordenesCompra, gya, transaccionesBoveda, transaccionesBanco,
almacen, boveda_monte_ingresos, boveda_usa_ingresos, profit_ingresos,
leftie_ingresos, azteca_ingresos, flete_sur_ingresos, utilidades_ingresos,
gastos_abonos, dashboard_paneles, dashboard_totales, reportes,
ingresos, movimientos_distribuidor, modificaciones_almacen,
almacen_entradas, almacen_salidas (después de migrar)
```

---

**Documento generado por análisis quirúrgico del sistema CHRONOS**
