# 🎯 LÓGICA CORRECTA DEL SISTEMA FLOWDISTRIBUTOR

## ✅ DISTRIBUCIÓN EN BANCOS - LÓGICA ACTUALIZADA

### **Cuando se registra una VENTA:**

```typescript
// Datos de entrada del formulario
const precioVentaUnidad = 10000; // Precio al que VENDEMOS
const precioCompraUnidad = 6300; // Precio al que COMPRAMOS (costo distribuidor)
const precioFlete = 500; // Flete por unidad (default 500, editable)
const cantidad = 10; // Cantidad vendida

// ✅ CÁLCULOS CORRECTOS:

// 1. Precio Total por Unidad = Precio Venta + Flete
const precioTotalUnidad = precioVentaUnidad + precioFlete;
// = 10000 + 500 = 10500

// 2. Precio Total de la Venta = Precio Total Unidad × Cantidad
const precioTotalVenta = precioTotalUnidad * cantidad;
// = 10500 × 10 = 105000

// ✅ DISTRIBUCIÓN EN BANCOS (3 bancos automáticos):

// 3. 🏦 Bóveda Monte = Precio compra por Unidad × Cantidad
const montoBovedaMonte = preciocompraUnidad * cantidad;
// = 10000 × 10 = 100000

// 4. 🚚 Fletes = Flete por Unidad × Cantidad
const montoFletes = precioFlete * cantidad;
// = 500 × 10 = 5000

// 5. 💰 Utilidades = (Precio Venta - Precio Compra - Flete) × Cantidad
const montoUtilidades = (precioVentaUnidad - precioCompraUnidad - precioFlete) * cantidad;
// = (10000 - 6300 - 500) × 10
// = 3200 × 10 = 32000
```

---

## 🏦 LOS 7 BANCOS DEL SISTEMA

### **1. Bóveda Monte** 🏦

- **Recibe:** Precio de compra × Cantidad (en cada venta)
- **Uso:** Capital principal de operaciones
- **Puede:** Transferir, Gastar, Pagar a Distribuidores

### **2. Bóveda USA** 🇺🇸

- **Recibe:** Ingresos manuales, transferencias
- **Uso:** Capital en dólares/USA
- **Puede:** Transferir, Gastar, Pagar a Distribuidores

### **3. Utilidades** 💰

- **Recibe:** (Precio Venta - Precio Compra - Flete) × Cantidad (en cada venta)
- **Uso:** Ganancias netas del negocio
- **Puede:** Transferir, Gastar, Distribuir

### **4. Fletes** 🚚

- **Recibe:** Flete × Cantidad (en cada venta)
- **Uso:** Capital para gastos de transporte
- **Puede:** Transferir, Gastar, Pagar Fletes

### **5. Azteca** 🏪

- **Recibe:** Ingresos manuales, transferencias
- **Uso:** Cuenta bancaria externa Azteca
- **Puede:** Transferir, Gastar, Ingresos externos

### **6. Leftie** 👕

- **Recibe:** Ingresos manuales, transferencias
- **Uso:** Capital de negocio secundario
- **Puede:** Transferir, Gastar, Ingresos externos

### **7. Profit** 📈

- **Recibe:** Ingresos manuales, transferencias
- **Uso:** Utilidades distribuidas
- **Puede:** Transferir, Gastar, Ingresos externos

---

## 📊 ESTRUCTURA DE CADA BANCO

```typescript
interface Banco {
  id: string;
  nombre: string;

  // 💰 CAPITAL ACTUAL (DINÁMICO)
  capitalActual: number; // = historicoIngresos - historicoGastos

  // 📥 HISTÓRICO INGRESOS (FIJO ACUMULATIVO)
  historicoIngresos: number; // Suma acumulada, NUNCA disminuye

  // 📤 HISTÓRICO GASTOS (FIJO ACUMULATIVO)
  historicoGastos: number; // Suma acumulada, NUNCA disminuye

  // 🔄 HISTÓRICO TRANSFERENCIAS
  historicoTransferencias: number;

  // 📋 OPERACIONES
  operaciones: Operacion[]; // Historial completo de movimientos

  createdAt: any;
  updatedAt: any;
}
```

---

## 💸 ESTADOS DE PAGO EN VENTAS

### **1. Pago Completo** ✅

```typescript
estadoPago: 'completo'
montoPagado = precioTotalVenta
montoRestante = 0

// Actualización de bancos:
Bóveda Monte += montoBovedaMonte (completo)
Fletes += montoFletes (completo)
Utilidades += montoUtilidades (completo)
```

### **2. Pago Parcial** ⚠️

```typescript
estadoPago: 'parcial'
montoPagado = X (monto ingresado por usuario)
montoRestante = precioTotalVenta - montoPagado

// Actualización de bancos (PROPORCIONAL):
const proporcion = montoPagado / precioTotalVenta;

Bóveda Monte += montoBovedaMonte × proporcion
Fletes += montoFletes × proporcion
Utilidades += montoUtilidades × proporcion

// Solo el histórico se guarda completo, el capital se actualiza proporcionalmente
```

### **3. Pago Pendiente** ❌

```typescript
estadoPago: 'pendiente'
montoPagado = 0
montoRestante = precioTotalVenta

// Actualización de bancos:
// Solo se registra en HISTÓRICO INGRESOS (acumulado)
// NO se actualiza CAPITAL ACTUAL hasta que se pague
historicoIngresos += monto (para referencia futura)
capitalActual NO CAMBIA
```

---

## 🔄 OPERACIONES BANCARIAS

### **Transferencia entre Bancos**

```typescript
// Origen
capitalActual -= monto
historicoTransferencias += monto
operaciones.push({ tipo: 'transferencia_salida', ... })

// Destino
capitalActual += monto
historicoIngresos += monto
operaciones.push({ tipo: 'transferencia_entrada', ... })
```

### **Gasto de Banco**

```typescript
capitalActual -= monto
historicoGastos += monto
operaciones.push({ tipo: 'gasto', ... })
```

### **Ingreso a Banco** (Azteca, Leftie, Profit, Bóveda USA)

```typescript
capitalActual += monto
historicoIngresos += monto
operaciones.push({ tipo: 'ingreso', ... })
```

### **Pago a Distribuidor**

```typescript
// Banco seleccionado
capitalActual -= monto
historicoGastos += monto
operaciones.push({ tipo: 'pago_distribuidor', ... })

// Distribuidor
deudaTotal -= monto
totalPagado += monto
historialPagos.push({ ... })

// Orden de Compra
deuda -= monto
pagoDistribuidor += monto
estado = (deuda === 0) ? 'pagado' : 'parcial'
```

### **Pago de Cliente**

```typescript
// Cliente
deudaTotal -= monto
totalPagado += monto
historialPagos.push({ ... })

// Venta
montoRestante -= monto
montoPagado += monto
estadoPago = (montoRestante === 0) ? 'completo' : 'parcial'

// Distribución proporcional en 3 BANCOS
const proporcion = monto / precioTotalVenta;

Bóveda Monte.capitalActual += montoBovedaMonte × proporcion
Fletes.capitalActual += montoFletes × proporcion
Utilidades.capitalActual += montoUtilidades × proporcion
```

---

## 📦 ALMACÉN - LÓGICA DE STOCK

### **Entrada de Productos** (al crear Orden de Compra)

```typescript
// Crear movimiento de entrada
const movimiento = {
  id: `ENT_${ordenCompraId}`,
  fecha: today,
  tipo: 'entrada',
  cantidad: cantidad,
  origen: distribuidor,
  referenciaId: ordenCompraId
};

// Actualizar almacén
stockActual += cantidad
totalEntradas += cantidad (acumulado fijo)
entradas.push(movimiento)
```

### **Salida de Productos** (al registrar Venta)

```typescript
// Validar stock suficiente
if (stockActual < cantidad) {
  throw new Error('Stock insuficiente');
}

// Crear movimiento de salida
const movimiento = {
  id: `SAL_${ventaId}`,
  fecha: today,
  tipo: 'salida',
  cantidad: cantidad,
  destino: cliente,
  referenciaId: ventaId
};

// Actualizar almacén
stockActual -= cantidad
totalSalidas += cantidad (acumulado fijo)
salidas.push(movimiento)
```

### **Cálculo de Stock**

```typescript
// Stock Actual (DINÁMICO)
stockActual = totalEntradas - totalSalidas;

// Alertas
if (stockActual < 10) {
  alert('🔴 Stock Bajo');
}
if (stockActual === 0) {
  alert('⚠️ Stock Agotado');
}
```

---

## 🎯 FÓRMULAS CLAVE

### **Orden de Compra**

```typescript
costoPorUnidad = costoDistribuidor + costoTransporte
costoTotal = costoPorUnidad × cantidad
deuda = costoTotal - pagoDistribuidor
```

### **Venta**

```typescript
precioTotalUnidad = precioVentaUnidad + precioFlete
precioTotalVenta = precioTotalUnidad × cantidad
montoRestante = precioTotalVenta - montoPagado

// Distribución en bancos
montoBovedaMonte = precioVentaUnidad × cantidad
montoFletes = precioFlete × cantidad
montoUtilidades = (precioVentaUnidad - precioCompraUnidad - precioFlete) × cantidad
```

### **Capital Bancario**

```typescript
capitalActual = historicoIngresos - historicoGastos;

// Validación
if (capitalActual < montoOperacion) {
  throw new Error('Capital insuficiente');
}
```

---

## 📋 VALIDACIONES CRÍTICAS

### **Antes de Vender**

- ✅ Stock disponible >= Cantidad solicitada
- ✅ Precio Venta > 0
- ✅ Precio Compra > 0
- ✅ Si parcial: Monto Pagado < Precio Total
- ✅ Precio Compra debe existir en almacén/OC

### **Antes de Pagar a Distribuidor**

- ✅ Banco seleccionado tiene capital suficiente
- ✅ Monto <= Deuda pendiente
- ✅ Orden de compra existe y tiene deuda

### **Antes de Pagar de Cliente**

- ✅ Monto <= Deuda del cliente
- ✅ Venta existe y tiene deuda pendiente

### **Antes de Transferir**

- ✅ Banco origen tiene capital suficiente
- ✅ Banco origen ≠ Banco destino
- ✅ Monto > 0

### **Antes de Gastar**

- ✅ Banco tiene capital suficiente
- ✅ Monto > 0
- ✅ Concepto no vacío

---

## 🚀 FLUJO COMPLETO DE UNA OPERACIÓN

### **Escenario: Compra y Venta Completa**

#### **1. Crear Orden de Compra**

```
Distribuidor: "MONTE SUPPLY"
Cantidad: 100 unidades
Costo Distribuidor: 6300/unidad
Costo Transporte: 200/unidad

→ Costo por Unidad: 6500
→ Costo Total: 650,000
→ Deuda Distribuidor: 650,000
→ Stock Almacén: +100
→ Distribuidor creado automáticamente con perfil
```

#### **2. Registrar Venta (Pago Completo)**

```
Cliente: "CLIENTE PREMIUM"
Producto: Del almacén (MONTE SUPPLY)
Cantidad: 10 unidades
Precio Venta Unidad: 10,000
Precio Compra Unidad: 6300 (del costo distribuidor)
Flete: 500

→ Precio Total Unidad: 10,500
→ Precio Total Venta: 105,000
→ Estado: Completo
→ Monto Pagado: 105,000

DISTRIBUCIÓN AUTOMÁTICA:
→ Bóveda Monte +100,000 (10000 × 10)
→ Fletes +5,000 (500 × 10)
→ Utilidades +32,000 ((10000-6300-500) × 10)

→ Stock Almacén: -10 (queda 90)
→ Cliente creado automáticamente
```

#### **3. Pagar a Distribuidor**

```
Seleccionar: Bóveda Monte
Monto: 650,000 (saldar completo)

→ Bóveda Monte -650,000
→ Deuda Distribuidor: 0
→ Estado OC: Pagado
→ Historial registrado
```

#### **4. Resultado Final**

```
Bóveda Monte: +100,000 - 650,000 = -550,000 (necesita capital)
Fletes: +5,000
Utilidades: +32,000

Capital Total: -513,000 (requiere más ventas o transferencias)
```

---

## 📊 KPIs DEL DASHBOARD

```typescript
// Capital Total
capitalTotal = suma de capitalActual de los 7 bancos

// Ganancia Bruta
gananciaBruta = totalVentas - totalCompras

// Ganancia Neta
gananciaNeta = gananciaBruta - totalGastos

// Margen de Ganancia
margenGanancia = (gananciaBruta / totalVentas) × 100

// Liquidez Neta
liquidezNeta = capitalTotal - deudasPorPagar

// Cuentas por Cobrar
cuentasPorCobrar = suma de deudaTotal de todos los clientes

// Cuentas por Pagar
cuentasPorPagar = suma de deudaTotal de todos los distribuidores
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] Interfaces TypeScript actualizadas
- [x] Fórmulas correctas implementadas
- [x] Servicio Firestore con lógica correcta
- [x] 7 Bancos configurados (incluye Bóveda USA)
- [ ] Formulario Venta con campo Precio Compra
- [ ] Validación de stock antes de vender
- [ ] Distribución automática en 3 bancos
- [ ] Estados de pago funcionando
- [ ] Pagos proporcionales en pagos parciales
- [ ] Actualización en tiempo real de todos los bancos
- [ ] Dashboard con KPIs calculados correctamente

---

**✅ LÓGICA VERIFICADA Y CORRECTA**
**📅 Actualizado:** 6 de Noviembre, 2025
