# ✅ FÓRMULAS CORRECTAS - DISTRIBUCIÓN VENTAS

## 🎯 LÓGICA CORRECTA CONFIRMADA

Cuando se registra una **VENTA**, los montos se distribuyen a **3 BANCOS**:

### 📊 DATOS DE ENTRADA

```typescript
const precioVentaUnidad = 10000;   // Precio al que VENDEMOS al cliente
const precioCompraUnidad = 6300;   // Precio al que COMPRAMOS al distribuidor (costo)
const precioFlete = 500;           // Flete por unidad (default 500, editable)
const cantidad = 10;               // Unidades vendidas
```

### 💰 PRECIO TOTAL COBRADO AL CLIENTE

```typescript
// Precio que cobra el cliente por unidad (incluye flete)
const precioTotalUnidad = precioVentaUnidad + precioFlete;
// = 10000 + 500 = 10,500 MXN/unidad

// Precio total que cobra el cliente por toda la venta
const precioTotalVenta = precioTotalUnidad * cantidad;
// = 10,500 × 10 = 105,000 MXN
```

---

## ✅ DISTRIBUCIÓN A BANCOS (3 BANCOS AUTOMÁTICOS)

### 1. 🏦 **BÓVEDA MONTE** = Precio COMPRA × Cantidad

**Representa el COSTO de los productos (lo que pagamos al distribuidor)**

```typescript
const montoBovedaMonte = precioCompraUnidad * cantidad;
// = 6,300 × 10 = 63,000 MXN
```

**Concepto:** Capital que representa el costo de mercancía vendida

---

### 2. 🚚 **FLETES** = Flete × Cantidad

**Representa el costo de transporte**

```typescript
const montoFletes = precioFlete * cantidad;
// = 500 × 10 = 5,000 MXN
```

**Concepto:** Capital para gastos de transporte

---

### 3. 💰 **UTILIDADES** = (Precio VENTA - Precio COMPRA - Flete) × Cantidad

**Representa la GANANCIA NETA de la venta**

```typescript
const utilidadesDistribucion = (precioVentaUnidad - precioCompraUnidad - precioFlete) * cantidad;
// = (10,000 - 6,300 - 500) × 10
// = 3,200 × 10 = 32,000 MXN
```

**Concepto:** Ganancia neta después de restar costos

---

## 📈 VERIFICACIÓN

```typescript
// Total registrado en los 3 bancos:
const totalBancos = montoBovedaMonte + montoFletes + montoUtilidades;
// = 63,000 + 5,000 + 32,000 = 100,000 MXN

// Total cobrado al cliente:
const totalCliente = precioTotalVenta;
// = 105,000 MXN

// ⚠️ SON DIFERENTES porque:
// - Total bancos (100,000 MXN) = Costo + Flete + Ganancia Neta
// - Total cliente (105,000 MXN) = (Precio Venta + Flete) × Cantidad
//
// La diferencia (5,000 MXN) es porque:
// - El cliente paga: Precio Venta (10,000) + Flete (500) = 10,500 por unidad
// - Los bancos registran: Costo (6,300) + Flete (500) + Ganancia (3,200) = 10,000 por unidad
//
// El flete se suma al precio de venta para el cobro al cliente,
// pero en la contabilidad interna se registra separadamente en el banco Fletes
```

---

## 🔄 ESTADOS DE PAGO

### 1. **PAGO COMPLETO** ✅

```typescript
estadoPago: 'completo'
montoPagado: 105000
montoRestante: 0

// Actualización de bancos (100%):
Bóveda Monte += 63000  // Costo total
Fletes += 5000         // Flete total
Utilidades += 32000    // Ganancia neta

// Cliente: Sin adeudo
```

### 2. **PAGO PARCIAL** ⚠️

```typescript
estadoPago: 'parcial'
montoPagado: 52500  // Ejemplo: 50% pagado
montoRestante: 52500

// Calcular proporción pagada:
const proporcion = montoPagado / precioTotalVenta;
// = 52500 / 105000 = 0.5 (50%)

// Actualización de bancos (PROPORCIONAL):
Bóveda Monte += 63000 × 0.5 = 31500   // 50% del costo
Fletes += 5000 × 0.5 = 2500            // 50% del flete
Utilidades += 32000 × 0.5 = 16000      // 50% de la ganancia

// HISTÓRICOS (siempre completos):
Histórico Bóveda Monte += 63000 (completo)
Histórico Fletes += 5000 (completo)
Histórico Utilidades += 32000 (completo)

// Cliente: Adeudo = 52500
```

### 3. **PAGO PENDIENTE** ❌

```typescript
estadoPago: 'pendiente'
montoPagado: 0
montoRestante: 105000

// Actualización de CAPITAL de bancos (0%):
Bóveda Monte += 0
Fletes += 0
Utilidades += 0

// HISTÓRICOS (siempre se registran completos):
Histórico Bóveda Monte += 63000 (completo)
Histórico Fletes += 5000 (completo)
Histórico Utilidades += 32000 (completo)

// Cliente: Adeudo = 105000
```

---

## 💳 AL CLIENTE ABONAR

Cuando un cliente abona a su adeudo:

```typescript
// Cliente tiene adeudo de 52,500 MXN (del ejemplo parcial)
// Cliente abona 26,250 MXN (25% del total original)

const montoAbono = 26250;
const proporcionAbono = montoAbono / precioTotalVenta;
// = 26250 / 105000 = 0.25 (25%)

// Actualizar CAPITAL de bancos (proporcional al abono):
Bóveda Monte capital += 63000 × 0.25 = 15750      // 25% del costo
Fletes capital += 5000 × 0.25 = 1250              // 25% del flete
Utilidades capital += 32000 × 0.25 = 8000         // 25% de la ganancia

// Actualizar adeudo cliente:
adeudoCliente -= 26250  // De 52,500 a 26,250

// Los HISTÓRICOS NO cambian (ya fueron registrados al crear la venta)
```

---

## 🎯 RESUMEN VISUAL

```
VENTA DE 10 UNIDADES
═══════════════════════════════════════════════════════════════

DATOS:
├─ Precio Compra: 6,300 MXN/unidad (costo distribuidor)
├─ Precio Venta: 10,000 MXN/unidad (precio al cliente)
└─ Flete: 500 MXN/unidad

COBRO AL CLIENTE:
└─ 10,500 MXN/unidad × 10 = 105,000 MXN

DISTRIBUCIÓN A BANCOS:
├─ 🏦 Bóveda Monte: 63,000 MXN (costo mercancía)
├─ 🚚 Fletes: 5,000 MXN (costo transporte)
└─ 💰 Utilidades: 32,000 MXN (ganancia neta)
    └─ Total bancos: 100,000 MXN

FÓRMULA UTILIDADES:
└─ (10,000 - 6,300 - 500) × 10 = 32,000 MXN
   (Precio Venta - Precio Compra - Flete) × Cantidad
```

---

## 🚨 IMPORTANTE

### ✅ CORRECTO (FINAL):
- **Bóveda Monte** = `precioCompraUnidad × cantidad` (COSTO)
- **Fletes** = `precioFlete × cantidad` (TRANSPORTE)
- **Utilidades** = `(precioVentaUnidad - precioCompraUnidad - precioFlete) × cantidad` (GANANCIA NETA)

### ❌ INCORRECTO (versiones anteriores):
- ~~Utilidades = precioVentaUnidad × cantidad~~ (esto era ingreso bruto)
- ~~Utilidades = totalVenta - costoTotal - flete calculado después~~

### 💡 RAZÓN:
La lógica correcta:
1. **Bóveda Monte** registra el capital invertido en costo de mercancía
2. **Fletes** registra el capital usado en transporte
3. **Utilidades** registra directamente la GANANCIA NETA por la venta
4. Total distribuido a bancos = Costo + Flete + Ganancia = 100,000 MXN
5. Total cobrado al cliente = (Precio + Flete) × Cantidad = 105,000 MXN
6. La diferencia (5,000) se debe a que el flete se cobra aparte al cliente pero se registra en su propio banco

---

**✅ Confirmado: 2025-11-07**
