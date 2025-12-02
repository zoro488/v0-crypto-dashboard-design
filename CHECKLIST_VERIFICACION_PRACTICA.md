# ✅ CHECKLIST DE VERIFICACIÓN PRÁCTICA

**Sistema CHRONOS - Validación Manual Completa**

---

## 🎯 OBJETIVO

Verificar manualmente en el navegador que TODO el flujo de ventas funciona correctamente.

---

## 📋 PREPARACIÓN

### 1. Iniciar Servidor de Desarrollo
```bash
cd /workspaces/v0-crypto-dashboard-design
pnpm dev
```

### 2. Abrir Navegador
```
http://localhost:3000
```

### 3. Login (si aplica)
- Usuario: [tu usuario Firebase]
- Contraseña: [tu contraseña]

---

## ✅ PRUEBA 1: CREAR VENTA CON PAGO COMPLETO

### Datos de Entrada
```
Cliente: Juan Pérez (crear nuevo si no existe)
Producto: Producto Test A
Cantidad: 10 unidades
Precio Venta: $10,000 / unidad
Precio Compra: $6,300 / unidad
Flete: $500 / unidad
Método Pago: Efectivo
Estado Pago: Completo
Monto Pagado: $100,000
```

### Pasos
1. [ ] Click en panel "Ventas" → botón "Nueva Venta"
2. [ ] Llenar formulario con datos de arriba
3. [ ] Verificar cálculo automático: Total = $100,000
4. [ ] Click "Guardar"
5. [ ] Esperar toast "✅ Venta Registrada"
6. [ ] Modal se cierra automáticamente

### Verificaciones UI
- [ ] **Panel BentoVentas**:
  - Nueva venta aparece en lista
  - Muestra: "Juan Pérez - 10 unidades - $100,000"
  - Estado: "PAGADO" (badge verde)

- [ ] **Panel BentoClientes**:
  - Cliente "Juan Pérez" aparece (o se actualiza)
  - Total Ventas: $100,000
  - Deuda: $0 (pagó completo)
  - Ventas: 1

- [ ] **Panel BentoBancos**:
  - **Bóveda Monte**: Capital aumentó en $63,000
  - **Flete Sur**: Capital aumentó en $5,000
  - **Utilidades**: Capital aumentó en $32,000
  
- [ ] **Panel BentoAlmacen** (si producto existe):
  - Stock de "Producto Test A" disminuyó en 10 unidades

### Verificación Firestore (opcional)
Abrir Firebase Console → Firestore:

- [ ] Collection `ventas` tiene nuevo documento
- [ ] Collection `clientes` tiene "juan_perez" con datos correctos
- [ ] Collection `bancos`:
  - `boveda_monte.capitalActual` aumentó $63,000
  - `flete_sur.capitalActual` aumentó $5,000
  - `utilidades.capitalActual` aumentó $32,000
- [ ] Collection `movimientos` tiene 3 nuevos documentos

---

## ✅ PRUEBA 2: CREAR VENTA CON PAGO PARCIAL (50%)

### Datos de Entrada
```
Cliente: María López (crear nuevo)
Producto: Producto Test B
Cantidad: 10 unidades
Precio Venta: $10,000 / unidad
Precio Compra: $6,300 / unidad
Flete: $500 / unidad
Método Pago: Transferencia
Estado Pago: Parcial
Monto Pagado: $50,000 (50% de $100,000)
```

### Pasos
1. [ ] Click "Nueva Venta"
2. [ ] Llenar formulario
3. [ ] Verificar Total = $100,000, Pagado = $50,000, Pendiente = $50,000
4. [ ] Click "Guardar"
5. [ ] Esperar toast "✅ Venta Registrada"

### Verificaciones UI
- [ ] **Panel BentoVentas**:
  - Nueva venta aparece
  - Estado: "PARCIAL" (badge amarillo)
  - Muestra: "Pendiente: $50,000"

- [ ] **Panel BentoClientes**:
  - Cliente "María López" aparece
  - Total Ventas: $100,000
  - Deuda: $50,000 (queda pendiente)
  - Ventas: 1

- [ ] **Panel BentoBancos**:
  - **Bóveda Monte**: Capital aumentó en $31,500 (50% de $63,000)
  - **Flete Sur**: Capital aumentó en $2,500 (50% de $5,000)
  - **Utilidades**: Capital aumentó en $16,000 (50% de $32,000)

---

## ✅ PRUEBA 3: CREAR VENTA PENDIENTE (0% pagado)

### Datos de Entrada
```
Cliente: Carlos Ruiz (crear nuevo)
Producto: Producto Test C
Cantidad: 10 unidades
Precio Venta: $10,000 / unidad
Precio Compra: $6,300 / unidad
Flete: $500 / unidad
Método Pago: Crédito
Estado Pago: Pendiente
Monto Pagado: $0
```

### Pasos
1. [ ] Click "Nueva Venta"
2. [ ] Llenar formulario
3. [ ] Verificar Total = $100,000, Pagado = $0, Pendiente = $100,000
4. [ ] Click "Guardar"
5. [ ] Esperar toast "✅ Venta Registrada"

### Verificaciones UI
- [ ] **Panel BentoVentas**:
  - Nueva venta aparece
  - Estado: "PENDIENTE" (badge rojo)
  - Muestra: "Pendiente: $100,000"

- [ ] **Panel BentoClientes**:
  - Cliente "Carlos Ruiz" aparece
  - Total Ventas: $100,000
  - Deuda: $100,000 (no pagó nada)
  - Ventas: 1

- [ ] **Panel BentoBancos**:
  - **capitalActual NO cambia** (sin efectivo)
  - **historicoIngresos aumenta** (registro contable)
  - Ver diferencia entre "Capital Actual" vs "Histórico"

---

## ✅ PRUEBA 4: VENTA SIN FLETE

### Datos de Entrada
```
Cliente: Ana García (crear nuevo)
Producto: Producto Test D
Cantidad: 5 unidades
Precio Venta: $8,000 / unidad
Precio Compra: $5,000 / unidad
Flete: $0 (SIN FLETE)
Método Pago: Efectivo
Estado Pago: Completo
Monto Pagado: $40,000
```

### Verificaciones UI
- [ ] **Panel BentoBancos**:
  - **Bóveda Monte**: Capital aumentó en $25,000 (5 × $5,000)
  - **Flete Sur**: NO cambia ($0)
  - **Utilidades**: Capital aumentó en $15,000 (5 × ($8,000 - $5,000))

**Fórmula Validada**:
```
Utilidades = (8000 - 5000 - 0) × 5 = $15,000 ✅
```

---

## ✅ PRUEBA 5: EDITAR/ELIMINAR VENTA (Opcional)

### Editar Venta
1. [ ] Click en venta existente → botón "Editar"
2. [ ] Cambiar monto pagado
3. [ ] Guardar
4. [ ] Verificar bancos y cliente se actualizan

### Eliminar Venta
1. [ ] Click en venta → botón "Eliminar"
2. [ ] Confirmar eliminación
3. [ ] Verificar:
   - Venta desaparece de lista
   - Cliente deuda se ajusta
   - Bancos capital se resta
   - Stock se restaura

**NOTA**: Eliminar venta debe REVERTIR todos los cambios.

---

## ✅ PRUEBA 6: VALIDACIONES DE FORMULARIO

### Campos Obligatorios
- [ ] Intentar crear venta sin cliente → Error
- [ ] Intentar crear venta sin producto → Error
- [ ] Intentar crear venta con cantidad = 0 → Error

### Validaciones de Stock
- [ ] Intentar vender más unidades que stock disponible → Error
- [ ] Mensaje: "Stock insuficiente. Disponible: X, Solicitado: Y"

### Validaciones de Pago
- [ ] Intentar poner montoPagado > totalVenta → Warning o ajuste automático

---

## ✅ PRUEBA 7: PERFORMANCE Y UX

### Tiempo de Actualización
- [ ] Cronometrar: Desde "Guardar" hasta ver datos en paneles
- [ ] **Esperado**: < 500ms
- [ ] **Aceptable**: < 1000ms

### Loading States
- [ ] Botón "Guardar" muestra spinner durante guardado
- [ ] Paneles muestran "Cargando..." durante fetch

### Error Handling
- [ ] Desconectar internet → Intentar crear venta
- [ ] Debe mostrar toast de error: "No se pudo conectar a Firestore"
- [ ] Datos NO se pierden (persistencia local)

---

## ✅ PRUEBA 8: REPORTES Y ANALYTICS

### Panel de Ventas
- [ ] Gráfico de ventas por mes se actualiza
- [ ] Totales (Ingresos, Pendientes, Completas) correctos
- [ ] Filtros (por cliente, fecha, estado) funcionan

### Panel de Bancos
- [ ] Gráfico de distribución GYA (pie chart) correcto
- [ ] Suma de bancos = Total de ventas pagadas
- [ ] Histórico vs Actual diferenciado

### Panel de Clientes
- [ ] Lista de clientes ordenada por deuda
- [ ] Top 5 clientes con más deuda resaltados
- [ ] Click en cliente → Ver detalle de ventas

---

## 📊 VALIDACIÓN FINAL

### Cálculos Manuales
Después de las 4 ventas de prueba:

**Esperado**:
```
Total Ventas: $340,000
  - Venta 1 (Juan): $100,000 (completo)
  - Venta 2 (María): $100,000 (parcial 50%)
  - Venta 3 (Carlos): $100,000 (pendiente)
  - Venta 4 (Ana): $40,000 (completo)

Capital en Bancos (efectivo real):
  - Bóveda Monte: $63k + $31.5k + $0 + $25k = $119,500
  - Flete Sur: $5k + $2.5k + $0 + $0 = $7,500
  - Utilidades: $32k + $16k + $0 + $15k = $63,000
  TOTAL: $190,000 ✅ (coincide con pagos: $100k + $50k + $0 + $40k)

Deudas Clientes:
  - Juan: $0
  - María: $50,000
  - Carlos: $100,000
  - Ana: $0
  TOTAL DEUDA: $150,000 ✅
```

### Verificar en UI
- [ ] Panel BentoBancos muestra: Capital Total = $190,000
- [ ] Panel BentoClientes muestra: Deuda Total = $150,000
- [ ] Panel BentoVentas muestra: Ventas Totales = $340,000
- [ ] Panel BentoVentas muestra: Pendiente = $150,000

### Fórmula de Validación
```
Total Ventas = Capital en Bancos + Deudas Pendientes
$340,000 = $190,000 + $150,000 ✅
```

---

## 🎯 RESULTADO ESPERADO

Si TODAS las pruebas pasan:

### ✅ Sistema 100% Funcional
- Lógica de distribución GYA correcta
- Estados de pago (completo/parcial/pendiente) funcionan
- Actualización de clientes correcta
- Actualización de bancos correcta
- Actualización de stock correcta
- UI se refresca automáticamente
- Validaciones de formulario funcionan
- Performance aceptable (<500ms)

### 🚀 Listo para Producción
Si todo funciona, el sistema está listo para:
1. Carga de datos reales (migración CSV)
2. Pruebas con usuarios reales
3. Deployment a producción

---

## 📝 REPORTE DE PRUEBAS

**Fecha**: _______________  
**Tester**: _______________

### Resumen
- [ ] ✅ Prueba 1: PASÓ
- [ ] ✅ Prueba 2: PASÓ
- [ ] ✅ Prueba 3: PASÓ
- [ ] ✅ Prueba 4: PASÓ
- [ ] ✅ Prueba 5: PASÓ
- [ ] ✅ Prueba 6: PASÓ
- [ ] ✅ Prueba 7: PASÓ
- [ ] ✅ Prueba 8: PASÓ
- [ ] ✅ Validación Final: PASÓ

### Bugs Encontrados
```
[Anotar aquí cualquier bug o comportamiento inesperado]
```

### Observaciones
```
[Comentarios adicionales sobre UX, performance, etc.]
```

---

**STATUS FINAL**: [ ] ✅ TODO FUNCIONAL | [ ] ❌ REQUIERE CORRECCIONES
