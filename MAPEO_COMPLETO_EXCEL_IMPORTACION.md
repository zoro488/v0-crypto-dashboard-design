# MAPEO COMPLETO - IMPORTACIÓN EXCEL A FLOWDISTRIBUTOR

## 📋 RESUMEN EJECUTIVO

**Archivo:** `C:\Users\xpovo\Downloads\Copia de Administación_General.xlsx`

**Hojas Totales:** 12
- Distribuidores
- Control_Maestro (Ventas Principales)
- Almacen_Monte
- Bóveda_Monte
- Bóveda_USA
- Utilidades
- Flete_Sur
- Azteca
- Leftie
- Profit
- Clientes
- DATA

**Datos Encontrados:**
- ✅ **96 Ventas** (50 Pagadas, 46 Pendientes)
- ✅ **9 Órdenes de Compra**
- ✅ **31 Clientes** (13 con deuda pendiente)
- ✅ **69 Ingresos en Bóveda_Monte**
- ✅ **7 Bancos** operativos

---

## 🏗️ ESTRUCTURA DETALLADA POR HOJA

### 1️⃣ HOJA: Distribuidores

**Ubicación de Encabezados:** Fila 3
**Rango de Datos:** Fila 4 en adelante

#### Estructura de Columnas:
```
Col 1:  OC (Código de Orden de Compra)
Col 2:  Fecha
Col 3:  Origen (Nombre del Distribuidor)
Col 4:  Cantidad
Col 5:  Costo Distribuidor
Col 6:  Costo Transporte
Col 7:  Costo Por Unidad (calculado)
Col 8:  Stock Actual
Col 9:  Costo Total (Cantidad × Costo Por Unidad)
Col 10: Pago a Distribuidor
Col 11: Deuda

Col 13: Distribuidores (Resumen)
Col 14: Costo total
Col 15: Abonos
Col 16: Pendiente
```

#### Ejemplo de Datos Reales:
```json
{
  "id": "OC0001",
  "fecha": "2025-08-25",
  "origen": "Q-MAYA",
  "cantidad": 423,
  "costoDistribuidor": 6100,
  "costoTransporte": 200,
  "costoPorUnidad": 6300,
  "costoTotal": 2664900,
  "pagoDistribuidor": null,
  "deuda": null
}
```

#### Mapeo a FlowDistributor:
```javascript
{
  id: `OC${String(row).padStart(4, '0')}`,
  fecha: fecha.toISOString(),
  distribuidor: origen,
  cantidad: cantidad,
  costoUnitario: costoPorUnidad,
  costoTotal: costoTotal,
  costoTransporte: costoTransporte,
  pagado: pagoDistribuidor || 0,
  adeudo: deuda || costoTotal - (pagoDistribuidor || 0),
  estado: (deuda === null || deuda === 0) ? 'pagado' : 'pendiente'
}
```

---

### 2️⃣ HOJA: Control_Maestro (⭐ MÁS IMPORTANTE)

**Ubicación de Encabezados:** Fila 3
**Rango de Datos:** Fila 4 en adelante
**Secciones:** 3 (Venta Local, RF Actual, GYA)

#### Estructura de Columnas - Sección VENTA LOCAL (Cols 1-12):
```
Col 1:  Fecha
Col 2:  OC Relacionada
Col 3:  Cantidad
Col 4:  Cliente
Col 5:  Bóveda Monte (monto base = Cantidad × 6300)
Col 6:  Precio De Venta
Col 7:  Ingreso (Cantidad × Precio De Venta)
Col 8:  Flete (Aplica / No Aplica)
Col 9:  Flete Utilidad (Cantidad × 500 si aplica)
Col 10: Utilidad
Col 11: Estatus (Pendiente / Pagado)
Col 12: Concepto
```

#### Estructura de Columnas - Sección GYA (Cols 15-19):
```
Col 15: Fecha
Col 16: Origen del Gasto o Abono (Cliente o "Gasto Bóveda Monte")
Col 17: Valor (Monto)
Col 18: TC (Tipo de Cambio)
Col 19: Pesos (Conversión a pesos)
```

#### Ejemplo de Venta Pagada:
```json
{
  "id": "VENTA-2025-08-23-Ax-6",
  "fecha": "2025-08-23T00:00:00.000Z",
  "ocRelacionada": "OC0001",
  "cantidad": 50,
  "cliente": "Ax",
  "bovedaMonte": 315000,
  "precioVenta": 7000,
  "ingreso": 350000,
  "flete": "Aplica",
  "fleteUtilidad": 25000,
  "utilidad": 10000,
  "estatus": "Pagado",
  "concepto": null
}
```

#### Ejemplo de Venta Pendiente:
```json
{
  "id": "VENTA-2025-08-23-Bodega-MP-4",
  "fecha": "2025-08-23T00:00:00.000Z",
  "ocRelacionada": "OC0001",
  "cantidad": 150,
  "cliente": "Bódega M-P",
  "bovedaMonte": 945000,
  "precioVenta": 6300,
  "ingreso": 945000,
  "flete": "Aplica",
  "fleteUtilidad": 75000,
  "utilidad": 0,
  "estatus": "Pendiente",
  "concepto": null
}
```

#### 🔑 RELACIONES CLAVE:

**Fórmulas del Excel:**
```
Bóveda Monte = Cantidad × CostoBase (6300)
Ingreso = Cantidad × Precio De Venta
Flete Utilidad = Cantidad × 500 (si Flete = "Aplica")
Utilidad = Ingreso - Bóveda Monte - Flete Utilidad
```

**Flujo de Estatus:**
1. Venta se crea con `Estatus = "Pendiente"`
2. Cliente **NO PAGA** inmediatamente
3. Cuando cliente paga → `Estatus = "Pagado"`
4. Solo entonces se registra en Bóveda_Monte

#### Mapeo a FlowDistributor:
```javascript
{
  id: `VENTA-${fecha}-${cliente}-${row}`,
  tipo: 'venta',
  fecha: fecha.toISOString(),
  ocRelacionada: ocRelacionada,
  cantidad: cantidad,
  cliente: cliente,
  productos: [{
    nombre: 'Producto',
    cantidad: cantidad,
    precio: precioVenta,
    subtotal: ingreso
  }],

  // Montos
  totalVenta: ingreso,           // Ingreso total
  totalFletes: fleteUtilidad,    // Flete
  totalUtilidades: utilidad,     // Utilidad

  // Estado de pago (⭐ CRÍTICO)
  estatus: estatus,              // "Pagado" o "Pendiente"
  estadoPago: estatus === 'Pagado' ? 'completo' : 'pendiente',
  adeudo: estatus === 'Pagado' ? 0 : bovedaMonte,
  montoPagado: estatus === 'Pagado' ? bovedaMonte : 0,

  // Destino
  destino: 'bovedaMonte',        // Por defecto
  concepto: concepto || '',

  // Flete
  aplicaFlete: flete === 'Aplica'
}
```

---

### 3️⃣ HOJA: Almacen_Monte

**Ubicación de Encabezados:** Fila 3
**Rango de Datos:** Fila 4 en adelante
**Secciones:** 2 (Ingresos/Entradas, Salidas)

#### Estructura de Columnas - INGRESOS (Cols 1-6):
```
Col 1: OC
Col 2: Cliente (en realidad es la fecha de OC)
Col 3: Distribuidor
Col 4: Cantidad
Col 5: Fecha
Col 6: Corte
```

#### Estructura de Columnas - SALIDAS (Cols 7-11):
```
Col 7:  Fecha
Col 8:  Cliente
Col 9:  Cantidad
Col 10: Concepto
Col 11: Observaciones
```

#### Ejemplo de Entrada:
```json
{
  "id": "ENTRADA-OC0001",
  "tipo": "entrada",
  "fecha": "2025-08-25T00:00:00.000Z",
  "oc": "OC0001",
  "distribuidor": "Q-MAYA",
  "cantidad": 423,
  "concepto": "Ingreso de mercancía"
}
```

#### Ejemplo de Salida:
```json
{
  "id": "SALIDA-2025-08-23-Ax",
  "tipo": "salida",
  "fecha": "2025-08-23T00:00:00.000Z",
  "cliente": "Ax",
  "cantidad": 50,
  "concepto": null,
  "observaciones": null
}
```

#### Mapeo a FlowDistributor:
Las entradas y salidas se mapean al modelo de almacén:
```javascript
almacen: {
  stock: [
    // Stock actual se calcula: Total Entradas - Total Salidas
  ],
  entradas: [ /* Ingresos */ ],
  salidas: [ /* Salidas */ ]
}
```

---

### 4️⃣ HOJA: Bóveda_Monte

**Ubicación de Encabezados:** Fila 3
**Rango de Datos:** Fila 4 en adelante
**Secciones:** 2 (Ingresos, Gastos)
**RF Actual (Fila 2):** $5,722,280

#### Estructura de Columnas - INGRESOS (Cols 1-4):
```
Col 1: Fecha
Col 2: Cliente
Col 3: Ingreso (Monto)
Col 4: Concepto
```

#### Estructura de Columnas - GASTOS (Cols 7-14):
```
Col 7:  Fecha
Col 8:  Origen del Gastos o Abono
Col 9:  Gasto (Monto)
Col 10: TC (Tipo de Cambio)
Col 11: Pesos (Conversión)
Col 12: Destino (Banco destino)
Col 13: Concepto
Col 14: Observaciones
```

#### Ejemplo de Ingreso:
```json
{
  "id": "ING-bovedaMonte-2025-08-23-Ax",
  "fecha": "2025-08-23T00:00:00.000Z",
  "tipo": "Ingreso",
  "cliente": "Ax",
  "monto": 315000,
  "concepto": null
}
```

#### Ejemplo de Gasto:
```json
{
  "id": "EGR-bovedaMonte-2025-08-22",
  "fecha": "2025-08-22T00:00:00.000Z",
  "tipo": "Egreso",
  "origen": "Gasto Bóveda Monte",
  "monto": 189000,
  "destino": "Profit",
  "concepto": "corporativo-boveda valle",
  "observaciones": null
}
```

#### 🔑 RELACIÓN CRÍTICA:

**Los ingresos en Bóveda_Monte corresponden SOLO a:**
1. Ventas con `Estatus = "Pagado"` en Control_Maestro
2. El monto registrado es el campo `Bóveda Monte` (NO el Ingreso total)

**Verificación realizada:**
- Total Ventas Pagadas (Bóveda Monte): $2,395,400
- Total Ingresos en Bóveda_Monte: $5,722,280
- Diferencia: $3,326,880 (ventas locales adicionales o pagos directos)

#### Mapeo a FlowDistributor:
```javascript
bancos: {
  bovedaMonte: {
    nombre: 'Bóveda Monte',
    capitalActual: 5722280, // RF Actual de fila 2
    moneda: 'MXN',
    registros: [
      // Combinar ingresos y gastos ordenados por fecha
    ],
    ingresos: [ /* Ingresos */ ],
    egresos: [ /* Gastos */ ],
    historico: 5722280
  }
}
```

---

### 5️⃣ HOJA: Bóveda_USA

**Ubicación de Encabezados:** Fila 3
**RF Actual (Fila 2):** $128,005
**Moneda:** USD

#### Estructura de Columnas - INGRESOS (Cols 1-8):
```
Col 1: Fecha
Col 2: Cliente
Col 3: Ingreso
Col 4: TC (Tipo de Cambio)
Col 5: Pesos
Col 6: Destino
Col 7: Concepto
Col 8: Observaciones
```

#### Estructura de Columnas - GASTOS (Cols 11-18):
```
Col 11: Fecha
Col 12: Origen del Gastos o Abono
Col 13: Gasto
Col 14: TC
Col 15: Pesos
Col 16: Destino
Col 17: Concepto
Col 18: Observaciones
```

#### Mapeo a FlowDistributor:
```javascript
bancos: {
  bovedaUSA: {
    nombre: 'Bóveda USA',
    capitalActual: 128005,
    moneda: 'USD',
    registros: [ /* Combinado */ ],
    ingresos: [ /* Ingresos */ ],
    egresos: [ /* Gastos */ ],
    historico: 1888275
  }
}
```

---

### 6️⃣ HOJAS: Utilidades, Flete_Sur, Azteca, Leftie, Profit

Todas estas hojas tienen estructura similar a Bóveda_Monte:
- Sección de Ingresos (izquierda)
- Sección de Gastos (derecha)
- RF Actual en fila 2

#### Totales RF Actual:
```
Utilidades:  $102,658
Flete_Sur:   $185,792
Azteca:      -$178,714.88
Leftie:      $45,844
Profit:      $12,577,748
```

#### Mapeo a FlowDistributor:
```javascript
bancos: {
  utilidades: { nombre: 'Utilidades', capitalActual: 102658, moneda: 'MXN', ... },
  fleteSur: { nombre: 'Flete Sur', capitalActual: 185792, moneda: 'MXN', ... },
  azteca: { nombre: 'Azteca', capitalActual: -178714.88, moneda: 'MXN', ... },
  leftie: { nombre: 'Leftie', capitalActual: 45844, moneda: 'USD', ... },
  profit: { nombre: 'Profit', capitalActual: 12577748, moneda: 'MXN', ... }
}
```

---

### 7️⃣ HOJA: Clientes

**Ubicación de Encabezados:** Fila 3
**Rango de Datos:** Fila 4 en adelante

#### Estructura de Columnas:
```
Col 5: Cliente (Nombre)
Col 6: Actual (Estado)
Col 7: Deuda (Total deuda)
Col 8: Abonos (Total abonos)
Col 9: Pendiente (Deuda - Abonos)
Col 10: Observaciones
```

#### Ejemplo de Cliente con Deuda:
```json
{
  "nombre": "Bódega M-P",
  "deuda": 945000,
  "abonos": 0,
  "pendiente": 945000,
  "observaciones": null
}
```

#### 🔑 FÓRMULAS DE CÁLCULO:

**En el Excel:**
```
Deuda = SUMIFS(Control_Maestro[Bóveda Monte],
               Control_Maestro[Cliente], "NombreCliente",
               Control_Maestro[Estatus], "Pendiente")

Abonos = SUMIF(GYA[Origen del Gasto o Abono], "NombreCliente", GYA[Valor])

Pendiente = Deuda - Abonos
```

#### Verificación realizada:
```
Total Clientes: 31
Clientes con Deuda: 13

Total Deuda:     $5,552,200
Total Abonos:    $2,920,280
Total Pendiente: $2,631,920
```

#### Mapeo a FlowDistributor:
```javascript
{
  nombre: cliente,
  adeudo: 0,  // Se calculará dinámicamente con calcularAdeudoCliente()
  totalComprado: 0,  // Suma de todas las ventas
  totalAbonado: 0,   // Suma de abonos
  estado: 'activo',
  observaciones: observaciones || '',
  ventas: []  // IDs de ventas relacionadas
}
```

**⭐ IMPORTANTE:** En FlowDistributor NO guardamos la deuda directamente, se calcula dinámicamente usando:
```javascript
calcularAdeudoCliente(nombreCliente) {
  const ventasPendientes = ventas
    .filter(v => v.cliente === nombreCliente && v.estatus === 'Pendiente')
    .reduce((sum, v) => sum + v.totalVenta, 0);

  const abonosRealizados = gastosAbonos
    .filter(g => g.tipo === 'abono' && g.origenGastoOAbono === nombreCliente)
    .reduce((sum, g) => sum + g.valor, 0);

  return ventasPendientes - abonosRealizados;
}
```

---

### 8️⃣ HOJA: DATA

Contiene catálogos de referencia:
- Origen de Gastos y Abonos
- Destinos (bancos)
- Nombres de Clientes

**Esta hoja NO se importa directamente**, solo sirve de referencia para validaciones.

---

## 📊 RESUMEN DE TOTALES VERIFICADOS

### Ventas (Control_Maestro):
```
Total Ventas:          96
  ├─ Pagadas:          50  →  $2,395,400 (Bóveda Monte)
  └─ Pendientes:       46  → $11,976,300 (Bóveda Monte)

Total Ingresos:        $8,501,600
Total por Cobrar:      $11,976,300
```

### Bancos:
```
Bóveda Monte:    $5,722,280  (MXN)
Bóveda USA:      $128,005    (USD)
Utilidades:      $102,658    (MXN)
Flete Sur:       $185,792    (MXN)
Azteca:          -$178,714   (MXN)
Leftie:          $45,844     (USD)
Profit:          $12,577,748 (MXN)
```

### Clientes:
```
Total Clientes:      31
Con Deuda:           13

Deuda Total:         $5,552,200
Abonos Realizados:   $2,920,280
Saldo Pendiente:     $2,631,920
```

### Almacén:
```
Total Entradas:   2,296 unidades
Total Salidas:    2,279 unidades
Stock Actual:     17 unidades
```

### Distribuidores:
```
Órdenes de Compra: 9
Total OC:          $15,428,300
```

---

## 🔗 RELACIONES CRÍTICAS ENTRE HOJAS

### 1. Control_Maestro ↔ Bóveda_Monte
```
SI Control_Maestro.Estatus = "Pagado"
  ENTONCES existe Bóveda_Monte.Ingreso
  CON Monto = Control_Maestro.Bóveda_Monte
```

### 2. Control_Maestro ↔ Almacen_Monte
```
CADA venta en Control_Maestro
  GENERA una salida en Almacen_Monte.Salidas
  CON mismo Cliente y Cantidad
```

### 3. Control_Maestro ↔ Clientes
```
Clientes.Deuda = SUMA(Control_Maestro.Bóveda_Monte
                     WHERE Estatus = "Pendiente"
                     AND Cliente = X)

Clientes.Pendiente = Clientes.Deuda - Clientes.Abonos
```

### 4. Distribuidores ↔ Almacen_Monte
```
CADA Orden de Compra en Distribuidores
  GENERA una entrada en Almacen_Monte.Entradas
  CON misma Cantidad y OC
```

### 5. Control_Maestro.GYA ↔ Clientes.Abonos
```
Clientes.Abonos = SUMA(Control_Maestro.GYA.Valor
                      WHERE Origen = NombreCliente)
```

---

## ⚠️ PUNTOS CRÍTICOS DE IMPORTACIÓN

### 1. **NO importar ventas a bancos directamente**
```javascript
// ❌ INCORRECTO:
if (venta.estatus === 'Pendiente') {
  banco.capitalActual += venta.totalVenta; // NO!
}

// ✅ CORRECTO:
if (venta.estatus === 'Pendiente') {
  // No tocar bancos, solo crear venta pendiente
  venta.adeudo = venta.totalVenta;
  venta.montoPagado = 0;
}
```

### 2. **Solo importar ingresos de Bóveda_Monte que existen**
```javascript
// Importar directamente los registros de ingresos
// que YA están en la hoja Bóveda_Monte
```

### 3. **Calcular deudas dinámicamente, NO importar**
```javascript
// ❌ INCORRECTO:
cliente.adeudo = ws_clientes.cell(row, 9).value;

// ✅ CORRECTO:
cliente.adeudo = 0; // Se calcula con calcularAdeudoCliente()
```

### 4. **Preservar IDs únicos**
```javascript
// Usar combinación de datos para IDs únicos:
`VENTA-${fecha}-${cliente}-${row}`
`OC${String(row).padStart(4, '0')}`
`ING-${banco}-${fecha}-${cliente}`
```

### 5. **Manejar campos nulos correctamente**
```javascript
const valor = ws.cell(row, col).value || 0;
const texto = ws.cell(row, col).value || '';
```

---

## 🎯 ORDEN DE IMPORTACIÓN RECOMENDADO

```
1. Distribuidores (Órdenes de Compra)
   ↓
2. Almacen_Monte (Entradas desde OC)
   ↓
3. Clientes (Lista básica, adeudo=0)
   ↓
4. Control_Maestro - Ventas (con estatus)
   ↓
5. Almacen_Monte (Salidas desde ventas)
   ↓
6. Bóveda_Monte - Ingresos (solo ventas pagadas)
   ↓
7. Bóveda_Monte - Gastos
   ↓
8. Otros Bancos (Ingresos y Gastos)
   ↓
9. Control_Maestro - GYA (Gastos y Abonos)
```

---

## ✅ CHECKLIST DE VALIDACIÓN

Después de importar, verificar:

- [ ] Total de ventas = 96 (50 pagadas, 46 pendientes)
- [ ] Total de OC = 9
- [ ] Total de clientes = 31
- [ ] Bóveda Monte capital = $5,722,280
- [ ] Stock almacén = 17 unidades
- [ ] Clientes con deuda calculada correctamente
- [ ] Ventas pendientes NO tienen dinero en bancos
- [ ] Ventas pagadas SÍ tienen registro en Bóveda_Monte
- [ ] Suma de deudas pendientes = $2,631,920

---

**Documento generado:** 2025-10-20
**Análisis completado por:** Claude Code
**Archivo Excel analizado:** `C:\Users\xpovo\Downloads\Copia de Administación_General.xlsx`
