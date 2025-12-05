# 📊 LÓGICA DE NEGOCIO EXACTA - CHRONOS 2026
## Fórmulas, Flujos y Ejemplos Numéricos

---

> **DOCUMENTO CRÍTICO**: Este archivo contiene TODAS las fórmulas y reglas de negocio del sistema.
> Usar como referencia obligatoria para cualquier implementación.

---

## 1. LOS 7 BANCOS DEL SISTEMA

### 1.1 Configuración

| ID | Nombre | Tipo | Moneda | Recibe de Ventas | Descripción |
|----|--------|------|--------|------------------|-------------|
| `boveda_monte` | Bóveda Monte | boveda | MXN | ✅ COSTO | Capital principal - recibe el costo del producto |
| `boveda_usa` | Bóveda USA | boveda | USD | ❌ | Capital en dólares |
| `utilidades` | Utilidades | utilidades | MXN | ✅ GANANCIA | Ganancias netas del negocio |
| `flete_sur` | Flete Sur | gastos | MXN | ✅ FLETE | Costos de transporte |
| `azteca` | Azteca | operativo | MXN | ❌ | Banco externo |
| `leftie` | Leftie | operativo | MXN | ❌ | Negocio secundario |
| `profit` | Profit | operativo | MXN | ❌ | Utilidades distribuidas |

### 1.2 Regla de Distribución de Ventas

**SOLO 3 BANCOS reciben dinero automáticamente de cada venta:**

```
┌─────────────────────────────────────────────────────────────┐
│                    DISTRIBUCIÓN GYA                         │
│            (Ganancia Y Asignación)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  VENTA                                                      │
│    │                                                        │
│    ├──▶ BÓVEDA MONTE  = precioCompra × cantidad             │
│    │    (El COSTO del producto va aquí)                     │
│    │                                                        │
│    ├──▶ FLETE SUR     = precioFlete × cantidad              │
│    │    (El costo de TRANSPORTE va aquí)                    │
│    │                                                        │
│    └──▶ UTILIDADES    = (precioVenta - precioCompra -       │
│         precioFlete) × cantidad                             │
│         (La GANANCIA NETA va aquí)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. FÓRMULAS DE VENTA

### 2.1 Fórmula Principal

```typescript
// Datos de entrada
interface DatosVenta {
  cantidad: number           // Unidades vendidas
  precioVenta: number        // Precio VENTA al cliente (por unidad)
  precioCompra: number       // Precio COMPRA del distribuidor (por unidad)
  precioFlete: number        // Flete por unidad (default: $500)
  montoPagado: number        // Lo que pagó el cliente
}

// Cálculo de distribución
function calcularDistribucionGYA(datos: DatosVenta) {
  const { cantidad, precioVenta, precioCompra, precioFlete = 500 } = datos
  
  // Total de la venta
  const totalVenta = precioVenta * cantidad
  
  // Distribución a los 3 bancos
  const bovedaMonte = precioCompra * cantidad        // COSTO
  const fletes = precioFlete * cantidad              // TRANSPORTE
  const utilidades = (precioVenta - precioCompra - precioFlete) * cantidad  // GANANCIA
  
  return { totalVenta, bovedaMonte, fletes, utilidades }
}
```

### 2.2 Ejemplo Numérico Completo

```
═══════════════════════════════════════════════════════════════
EJEMPLO: Venta de 10 unidades
═══════════════════════════════════════════════════════════════

DATOS DE ENTRADA:
┌────────────────────────────────────────────────┐
│ Cantidad:        10 unidades                    │
│ Precio Venta:    $10,000 MXN / unidad           │
│ Precio Compra:   $6,300 MXN / unidad (de OC)    │
│ Precio Flete:    $500 MXN / unidad              │
│ Monto Pagado:    $100,000 MXN (pago completo)   │
└────────────────────────────────────────────────┘

CÁLCULOS:
┌────────────────────────────────────────────────┐
│ Total Venta = 10 × $10,000 = $100,000          │
│                                                 │
│ DISTRIBUCIÓN:                                   │
│ ├─ Bóveda Monte = 10 × $6,300 = $63,000        │
│ ├─ Flete Sur    = 10 × $500   = $5,000         │
│ └─ Utilidades   = 10 × ($10,000 - $6,300 - $500)│
│                 = 10 × $3,200 = $32,000        │
│                                                 │
│ VERIFICACIÓN: $63,000 + $5,000 + $32,000       │
│             = $100,000 ✓                        │
└────────────────────────────────────────────────┘

RESULTADO EN BANCOS:
┌────────────────────────────────────────────────┐
│ Bóveda Monte: +$63,000 (historicoIngresos)     │
│ Flete Sur:    +$5,000  (historicoIngresos)     │
│ Utilidades:   +$32,000 (historicoIngresos)     │
└────────────────────────────────────────────────┘
```

### 2.3 Estados de Pago

```
═══════════════════════════════════════════════════════════════
ESTADOS DE PAGO
═══════════════════════════════════════════════════════════════

1. COMPLETO (montoPagado >= totalVenta)
   ────────────────────────────────────
   - Distribuye 100% a los 3 bancos
   - Cliente no tiene deuda
   - Estado: ✓ Pagado

2. PARCIAL (0 < montoPagado < totalVenta)
   ────────────────────────────────────
   - Calcula proporción: proporcion = montoPagado / totalVenta
   - Distribuye proporcionalmente a los 3 bancos
   - Cliente tiene deuda: totalVenta - montoPagado
   - Estado: ◐ Parcial

3. PENDIENTE (montoPagado = 0)
   ────────────────────────────────────
   - NO distribuye nada a los bancos
   - Solo registra en histórico
   - Cliente tiene deuda: totalVenta
   - Estado: ○ Pendiente
```

### 2.4 Ejemplo: Pago Parcial

```
═══════════════════════════════════════════════════════════════
EJEMPLO: Pago Parcial del 50%
═══════════════════════════════════════════════════════════════

DATOS:
- Total Venta: $100,000
- Monto Pagado: $50,000 (50%)

CÁLCULOS:
┌────────────────────────────────────────────────┐
│ Proporción = $50,000 / $100,000 = 0.5 (50%)    │
│                                                 │
│ DISTRIBUCIÓN REAL (50% de cada banco):         │
│ ├─ Bóveda Monte = $63,000 × 0.5 = $31,500     │
│ ├─ Flete Sur    = $5,000 × 0.5  = $2,500      │
│ └─ Utilidades   = $32,000 × 0.5 = $16,000     │
│                                                 │
│ TOTAL DISTRIBUIDO: $50,000 ✓                   │
│                                                 │
│ DEUDA CLIENTE: $100,000 - $50,000 = $50,000    │
└────────────────────────────────────────────────┘

RESULTADO EN BANCOS:
┌────────────────────────────────────────────────┐
│ Bóveda Monte: +$31,500 (historicoIngresos)     │
│ Flete Sur:    +$2,500  (historicoIngresos)     │
│ Utilidades:   +$16,000 (historicoIngresos)     │
└────────────────────────────────────────────────┘

RESULTADO EN CLIENTE:
┌────────────────────────────────────────────────┐
│ Deuda: +$50,000                                 │
│ Pendiente cobrar distribución restante:        │
│ ├─ BM: $31,500                                  │
│ ├─ FL: $2,500                                   │
│ └─ UT: $16,000                                  │
└────────────────────────────────────────────────┘
```

---

## 3. FÓRMULAS DE ABONO

### 3.1 Abono de Cliente

Cuando un cliente paga parte de su deuda, el monto se distribuye **proporcionalmente** a los 3 bancos.

```typescript
function calcularDistribucionAbono(
  distribucionOriginal: DistribucionGYA,  // Distribución de la venta original
  totalVenta: number,                      // Total de la venta original
  montoAbono: number                       // Monto que está pagando
) {
  // Proporción del abono respecto al total
  const proporcion = montoAbono / totalVenta
  
  return {
    bovedaMonte: distribucionOriginal.bovedaMonte * proporcion,
    fletes: distribucionOriginal.fletes * proporcion,
    utilidades: distribucionOriginal.utilidades * proporcion,
  }
}
```

### 3.2 Ejemplo: Abono de Cliente

```
═══════════════════════════════════════════════════════════════
EJEMPLO: Cliente abona $25,000 a deuda de $50,000
═══════════════════════════════════════════════════════════════

CONTEXTO:
- Venta original: $100,000
- Pago inicial: $50,000 (50%)
- Deuda restante: $50,000
- Distribución original:
  - BM: $63,000, FL: $5,000, UT: $32,000

ABONO: $25,000

CÁLCULOS:
┌────────────────────────────────────────────────┐
│ Proporción = $25,000 / $100,000 = 0.25 (25%)   │
│                                                 │
│ DISTRIBUCIÓN DEL ABONO:                        │
│ ├─ Bóveda Monte = $63,000 × 0.25 = $15,750    │
│ ├─ Flete Sur    = $5,000 × 0.25  = $1,250     │
│ └─ Utilidades   = $32,000 × 0.25 = $8,000     │
│                                                 │
│ TOTAL DISTRIBUIDO: $25,000 ✓                   │
│                                                 │
│ DEUDA RESTANTE: $50,000 - $25,000 = $25,000    │
└────────────────────────────────────────────────┘

RESULTADO EN BANCOS:
┌────────────────────────────────────────────────┐
│ Bóveda Monte: +$15,750 (historicoIngresos)     │
│ Flete Sur:    +$1,250  (historicoIngresos)     │
│ Utilidades:   +$8,000  (historicoIngresos)     │
└────────────────────────────────────────────────┘
```

---

## 4. FÓRMULAS DE ORDEN DE COMPRA

### 4.1 Creación de OC

```typescript
function calcularOrdenCompra(datos: {
  cantidad: number,
  costoDistribuidor: number,   // Costo por unidad del distribuidor
  costoTransporte: number,     // Costo transporte por unidad (default 0)
  pagoInicial: number          // Pago inicial (opcional)
}) {
  const costoPorUnidad = costoDistribuidor + costoTransporte
  const costoTotal = costoPorUnidad * cantidad
  const deuda = costoTotal - pagoInicial
  
  let estado = 'pendiente'
  if (deuda <= 0) estado = 'pagado'
  else if (pagoInicial > 0) estado = 'parcial'
  
  return {
    costoPorUnidad,
    costoTotal,
    pagoInicial,
    deuda,
    estado,
    stockInicial: cantidad,  // Stock disponible para ventas
    stockActual: cantidad,   // Se reduce al vender
  }
}
```

### 4.2 Ejemplo: Nueva OC

```
═══════════════════════════════════════════════════════════════
EJEMPLO: Orden de Compra de 100 unidades
═══════════════════════════════════════════════════════════════

DATOS:
- Distribuidor: PACMAN
- Cantidad: 100 unidades
- Costo Distribuidor: $6,300 / unidad
- Costo Transporte: $200 / unidad
- Pago Inicial: $200,000

CÁLCULOS:
┌────────────────────────────────────────────────┐
│ Costo/Unidad = $6,300 + $200 = $6,500          │
│ Costo Total = 100 × $6,500 = $650,000          │
│ Deuda = $650,000 - $200,000 = $450,000         │
│ Estado: PARCIAL                                 │
│ Stock Disponible: 100 unidades                  │
└────────────────────────────────────────────────┘

RESULTADO:
┌────────────────────────────────────────────────┐
│ OC Creada: OC0010                               │
│ Stock para ventas: 100 unidades                 │
│ Deuda a distribuidor: $450,000                  │
│                                                 │
│ Si hubo pago inicial:                           │
│ Banco origen: -$200,000 (gasto)                 │
│ Distribuidor: +$200,000 (pago recibido)         │
└────────────────────────────────────────────────┘
```

---

## 5. FÓRMULAS DE CAPITAL BANCARIO

### 5.1 Capital Actual

```typescript
// FÓRMULA FUNDAMENTAL
capitalActual = historicoIngresos - historicoGastos

// IMPORTANTE:
// - historicoIngresos es ACUMULATIVO (solo suma, nunca resta)
// - historicoGastos es ACUMULATIVO (solo suma, nunca resta)
// - Esto garantiza inmutabilidad contable
```

### 5.2 Balance con Transferencias

```typescript
// Si se consideran transferencias:
balance = (historicoIngresos + transferenciasEntrada) 
        - (historicoGastos + transferenciasSalida)
```

### 5.3 Ejemplo: Evolución de Capital

```
═══════════════════════════════════════════════════════════════
EJEMPLO: Evolución de Bóveda Monte
═══════════════════════════════════════════════════════════════

Estado inicial:
├─ historicoIngresos: $500,000
├─ historicoGastos: $200,000
└─ capitalActual: $300,000

Operación 1: Venta de $100,000 (distribución BM: $63,000)
├─ historicoIngresos: $500,000 + $63,000 = $563,000
├─ historicoGastos: $200,000 (sin cambio)
└─ capitalActual: $563,000 - $200,000 = $363,000

Operación 2: Pago a proveedor de $50,000
├─ historicoIngresos: $563,000 (sin cambio)
├─ historicoGastos: $200,000 + $50,000 = $250,000
└─ capitalActual: $563,000 - $250,000 = $313,000

Operación 3: Transferencia salida de $20,000 a Profit
├─ historicoIngresos: $563,000 (sin cambio)
├─ historicoGastos: $250,000 + $20,000 = $270,000
└─ capitalActual: $563,000 - $270,000 = $293,000
```

---

## 6. FLUJOS DE OPERACIÓN

### 6.1 Flujo Completo de Venta

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE VENTA                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────┐
│ 1. SELECCIONAR CLIENTE                        │
│    - De lista de 31 clientes                  │
│    - Verificar estado (activo)                │
└───────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────┐
│ 2. SELECCIONAR OC                             │
│    - Solo OCs con stockActual > 0             │
│    - Mostrar: stock disponible, costo/unidad  │
│    - precioCompra = OC.costoDistribuidor      │
└───────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────┐
│ 3. INGRESAR DATOS                             │
│    - Cantidad (max = stock de OC)             │
│    - Precio Venta (por unidad)                │
│    - Flete (Aplica: $500/u, NoAplica: $0)     │
│    - Monto Pagado (slider 0-100%)             │
│    - Método de Pago                           │
└───────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────┐
│ 4. PREVIEW EN TIEMPO REAL                     │
│    - Total venta                              │
│    - Distribución a 3 bancos                  │
│    - Estado de pago                           │
│    - Deuda resultante (si aplica)             │
└───────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────┐
│ 5. VALIDAR                                    │
│    - Stock suficiente                         │
│    - Precios válidos                          │
│    - Cliente válido                           │
└───────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────┐
│ 6. GUARDAR VENTA                              │
│    - Crear registro de venta                  │
│    - Generar ID único (V + timestamp)         │
└───────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────┐
│ 7. ACTUALIZAR STOCK                           │
│    - OC.stockActual -= cantidad               │
└───────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────┐
│ 8. ACTUALIZAR BANCOS (si hay pago)            │
│    IF estadoPago !== 'pendiente':             │
│      - boveda_monte.historicoIngresos += BM   │
│      - flete_sur.historicoIngresos += FL      │
│      - utilidades.historicoIngresos += UT     │
└───────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────┐
│ 9. ACTUALIZAR CLIENTE (si hay deuda)          │
│    IF montoRestante > 0:                      │
│      - cliente.deuda += montoRestante         │
└───────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────┐
│ 10. REFRESCAR UI                              │
│     - Cerrar modal                            │
│     - Toast de éxito                          │
│     - Actualizar tabla de ventas              │
│     - Actualizar KPIs del dashboard           │
└───────────────────────────────────────────────┘
```

### 6.2 Flujo de Abono

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE ABONO                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────┐
│ 1. SELECCIONAR CLIENTE/DISTRIBUIDOR           │
│    - Tipo: cliente | distribuidor             │
│    - Mostrar deuda actual                     │
└───────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────┐
│ 2. INGRESAR MONTO                             │
│    - Monto del abono                          │
│    - No puede exceder deuda                   │
│    - Banco destino (para cliente)             │
│    - Método de pago                           │
└───────────────────────────────────────────────┘
                            │
                            ▼
    ┌───────────────────┬───────────────────┐
    │                   │                   │
    ▼                   │                   ▼
┌─────────────────┐     │     ┌─────────────────┐
│ CLIENTE         │     │     │ DISTRIBUIDOR    │
├─────────────────┤     │     ├─────────────────┤
│ Obtener ventas  │     │     │ Reducir deuda   │
│ pendientes      │     │     │ directamente    │
│                 │     │     │                 │
│ Calcular        │     │     │ Registrar pago  │
│ distribución    │     │     │ en banco origen │
│ proporcional    │     │     │                 │
│                 │     │     │                 │
│ Actualizar      │     │     │                 │
│ 3 bancos        │     │     │                 │
└─────────────────┘     │     └─────────────────┘
    │                   │                   │
    └───────────────────┴───────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────┐
│ 3. ACTUALIZAR DEUDA                           │
│    - entidad.deuda -= montoAbono              │
└───────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────┐
│ 4. CREAR MOVIMIENTO                           │
│    - Tipo: abono_cliente o pago_distribuidor  │
│    - Registrar en banco correspondiente       │
└───────────────────────────────────────────────┘
```

---

## 7. VALIDACIONES CRÍTICAS

### 7.1 Validación de Venta

```typescript
// Zod schema para venta
const VentaSchema = z.object({
  clienteId: z.string().min(1, 'Cliente requerido'),
  ocRelacionada: z.string().min(1, 'OC requerida'),
  cantidad: z.number()
    .min(1, 'Mínimo 1 unidad')
    .refine((val) => val <= stockDisponible, 'Stock insuficiente'),
  precioVenta: z.number().min(1, 'Precio requerido'),
  flete: z.enum(['Aplica', 'NoAplica']),
  montoPagado: z.number().min(0),
  metodoPago: z.enum(['efectivo', 'transferencia', 'crypto', 'cheque']),
})
```

### 7.2 Validación de OC

```typescript
const OrdenCompraSchema = z.object({
  distribuidorId: z.string().min(1, 'Distribuidor requerido'),
  cantidad: z.number().min(1, 'Mínimo 1 unidad'),
  costoDistribuidor: z.number().min(1, 'Costo requerido'),
  costoTransporte: z.number().min(0).default(0),
  pagoInicial: z.number().min(0).default(0),
  bancoOrigen: z.string().optional(),
}).refine(
  (data) => !data.pagoInicial || data.bancoOrigen,
  { message: 'Banco origen requerido si hay pago inicial' }
)
```

---

## 8. CONSTANTES DEL SISTEMA

```typescript
// Flete por defecto
export const FLETE_DEFAULT = 500  // $500 MXN por unidad

// Bancos que reciben distribución de ventas
export const BANCOS_DISTRIBUCION = [
  'boveda_monte',  // Recibe: COSTO
  'flete_sur',     // Recibe: FLETE
  'utilidades',    // Recibe: GANANCIA
] as const

// Estados de pago
export const ESTADOS_PAGO = {
  COMPLETO: 'completo',
  PARCIAL: 'parcial',
  PENDIENTE: 'pendiente',
} as const

// Estados de OC
export const ESTADOS_OC = {
  PENDIENTE: 'pendiente',
  PARCIAL: 'parcial',
  PAGADO: 'pagado',
  CANCELADO: 'cancelado',
} as const

// Métodos de pago
export const METODOS_PAGO = [
  'efectivo',
  'transferencia',
  'crypto',
  'cheque',
  'credito',
] as const
```

---

## 9. RESUMEN DE FÓRMULAS

```typescript
// ═══════════════════════════════════════════════════════════════
// FÓRMULAS CRÍTICAS - MEMORIZAR
// ═══════════════════════════════════════════════════════════════

// 1. DISTRIBUCIÓN DE VENTA
bovedaMonte = precioCompra × cantidad          // COSTO
fleteSur = precioFlete × cantidad               // FLETE
utilidades = (precioVenta - precioCompra - precioFlete) × cantidad  // GANANCIA

// 2. TOTAL VENTA
totalVenta = precioVenta × cantidad

// 3. PROPORCIÓN DE PAGO
proporcion = montoPagado / totalVenta

// 4. DISTRIBUCIÓN REAL (según lo pagado)
distribucionReal.bovedaMonte = bovedaMonte × proporcion
distribucionReal.fleteSur = fleteSur × proporcion
distribucionReal.utilidades = utilidades × proporcion

// 5. CAPITAL BANCARIO
capitalActual = historicoIngresos - historicoGastos

// 6. DEUDA CLIENTE
deudaCliente = totalVenta - montoPagado

// 7. COSTO OC
costoTotal = (costoDistribuidor + costoTransporte) × cantidad

// 8. DEUDA DISTRIBUIDOR
deudaDistribuidor = costoTotal - pagoRealizado
```

---

## 10. ERRORES COMUNES A EVITAR

### ❌ INCORRECTO

```typescript
// ❌ Usar precioVenta para Bóveda Monte
bovedaMonte = precioVenta × cantidad  // INCORRECTO

// ❌ No considerar el flete en utilidades
utilidades = (precioVenta - precioCompra) × cantidad  // INCORRECTO

// ❌ Distribuir a bancos sin verificar estado de pago
if (true) {  // INCORRECTO - debe verificar estado
  actualizarBancos(distribucion)
}

// ❌ Restar del histórico (viola inmutabilidad)
historicoIngresos -= monto  // INCORRECTO
```

### ✅ CORRECTO

```typescript
// ✅ Bóveda Monte recibe el COSTO
bovedaMonte = precioCompra × cantidad  // CORRECTO

// ✅ Utilidades descuenta flete
utilidades = (precioVenta - precioCompra - precioFlete) × cantidad  // CORRECTO

// ✅ Verificar estado antes de distribuir
if (estadoPago !== 'pendiente') {  // CORRECTO
  actualizarBancos(distribucionReal)
}

// ✅ Solo sumar al histórico (inmutabilidad)
historicoIngresos += monto  // CORRECTO
historicoGastos += monto    // CORRECTO
```

---

*Documento: LOGICA_NEGOCIO_EXACTA_CHRONOS_2026.md*
*Versión: 1.0.0*
*Fecha: 2024-12-XX*
