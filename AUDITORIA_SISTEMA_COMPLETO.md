# 🔍 AUDITORÍA COMPLETA DEL SISTEMA CHRONOS

**Fecha**: 2025-12-02  
**Objetivo**: Verificar integridad lógica, flujo de datos y consistencia UI  
**Estado**: 🔴 CRÍTICO - Múltiples inconsistencias detectadas

---

## 🚨 PROBLEMAS CRÍTICOS DETECTADOS

### 1. **LÓGICA DE VENTAS - INCONSISTENCIA EN DISTRIBUCIÓN** 🔴

#### Problema:
La lógica de distribución de ventas está **fragmentada** en 3 lugares diferentes con **fórmulas inconsistentes**:

**Ubicación 1**: `app/lib/firebase/firestore-service.ts` (línea 409)
```typescript
// ✅ CORRECTO según FORMULAS_CORRECTAS_VENTAS_Version2.md
const montoBovedaMonte = costoUnitarioBase * cantidad
const montoFlete = (data.precioFlete || 0) * cantidad
const montoUtilidad = (precioVentaUnitario - costoUnitarioBase - fleteUnitario) * cantidad
```

**Ubicación 2**: `app/lib/services/business-logic.service.ts` (línea 164)
```typescript
// ✅ CORRECTO
const montoBovedaMonte = precioCompra * cantidad
const montoFletes = aplicaFlete ? precioFlete * cantidad : 0
const montoUtilidades = (precioVenta - precioCompra - (aplicaFlete ? precioFlete : 0)) * cantidad
```

**Ubicación 3**: `app/lib/store/useAppStore.ts` (línea 336)
```typescript
// ❌ INCORRECTO - Actualiza saldos pero NO valida distribución
get().updateBancoSaldo('boveda_monte', bancoBovedaMonte.saldo + montoBovedaMonte * proporcionPagada)
```

#### Impacto:
- ❌ Forms de ventas NO actualizan bancos correctamente
- ❌ UI muestra datos desactualizados después de crear venta
- ❌ Cliente actualizado pero bancos NO reflejan cambios

#### Solución Requerida:
✅ **Centralizar en `firestore-service.ts`** como única fuente de verdad  
✅ **Eliminar lógica duplicada** en `useAppStore`  
✅ **Hooks deben llamar `crearVenta` directamente**

---

### 2. **MODAL DE VENTA - NO ACTUALIZA UI DESPUÉS DE CREAR** 🔴

#### Problema:
El modal `CreateVentaModalPremium.tsx` (línea 154):
- ✅ Crea la venta en Firestore correctamente
- ❌ NO dispara re-render de paneles
- ❌ NO actualiza lista de ventas en BentoVentas
- ❌ NO actualiza saldos de bancos en BentoBancos
- ❌ NO actualiza deuda del cliente en BentoClientes

#### Código Problemático:
```typescript
// app/components/modals/CreateVentaModalPremium.tsx (línea 386)
const ventaId = await crearVenta(ventaData)
logger.info('Venta creada exitosamente', { ventaId, context: 'CreateVentaModalPremium' })

// ❌ FALTA: triggerDataRefresh() o callback a componentes padres
onClose() // Solo cierra modal
```

#### Solución Requerida:
```typescript
const ventaId = await crearVenta(ventaData)
await triggerDataRefresh() // ✅ Fuerza re-fetch de datos
onSuccess?.(ventaId) // ✅ Callback a componente padre
onClose()
```

---

### 3. **CLIENTES - DEUDA NO SE ACTUALIZA EN TIEMPO REAL** 🔴

#### Problema:
Cuando se crea una venta:
1. ✅ Cliente se actualiza en Firestore (línea 541 firestore-service.ts)
2. ❌ BentoClientes NO re-renderiza automáticamente
3. ❌ Perfil del cliente muestra deuda antigua

#### Código Actual:
```typescript
// firestore-service.ts (línea 541)
batch.update(clienteSnapshot.docs[0].ref, {
  deudaTotal: increment(montoRestante),
  pendiente: increment(montoRestante),
  totalVentas: increment(totalVenta),
  totalPagado: increment(montoPagado),
  numeroCompras: increment(1),
  updatedAt: Timestamp.now(),
})

// ❌ PERO: BentoClientes NO se entera del cambio
```

#### Solución Requerida:
✅ Implementar **listener en tiempo real** (`onSnapshot`) en BentoClientes  
✅ O usar `triggerDataRefresh()` después de crear venta

---

### 4. **BANCOS - CAPITAL ACTUAL NO REFLEJA VENTAS** 🔴

#### Problema:
**Estado de Pago = "Completo"**:
- ✅ `historicoIngresos` se actualiza correctamente
- ✅ `capitalActual` se actualiza correctamente
- ✅ UI refleja cambios

**Estado de Pago = "Parcial"**:
- ✅ `historicoIngresos` registra totalVenta completo
- ✅ `capitalActual` solo suma montoPagado (proporcional)
- ✅ Lógica correcta

**Estado de Pago = "Pendiente"** (montoPagado = 0):
- ✅ `historicoIngresos` registra totalVenta (para histórico)
- ❌ `capitalActual` queda en 0 (correcto)
- ❌ **PROBLEMA**: UI muestra "Sin cambios" en bancos, confunde al usuario

#### Solución Requerida:
✅ **UI debe mostrar**:
```
Capital Actual: $50,000 (efectivo disponible)
Histórico Total: $150,000 (incluye pendientes)
Pendiente por Cobrar: $100,000
```

---

### 5. **ÓRDENES DE COMPRA - STOCK NO SE DESCUENTA** 🔴

#### Problema:
Cuando se crea una venta con `ocRelacionada`:
1. ✅ Venta se crea correctamente
2. ❌ Stock de la OC NO se descuenta
3. ❌ `stockActual` queda igual que `stockInicial`

#### Código Faltante en firestore-service.ts (línea 600):
```typescript
// ❌ NO EXISTE ESTA ACTUALIZACIÓN
if (data.ocRelacionada) {
  const ocRef = doc(db!, COLLECTIONS.ORDENES_COMPRA, data.ocRelacionada)
  batch.update(ocRef, {
    stockActual: increment(-cantidad), // FALTA ESTO
    updatedAt: Timestamp.now()
  })
}
```

#### Solución Requerida:
✅ Añadir actualización de stock en `crearVenta`

---

### 6. **PRODUCTOS/ALMACEN - SALIDA NO SE REGISTRA** 🔴

#### Problema:
Cuando se vende un producto:
1. ✅ Venta se registra en `ventas` collection
2. ❌ Stock en `almacen` NO se descuenta
3. ❌ NO se crea movimiento de salida

#### Código Esperado (FALTA):
```typescript
// Actualizar almacén
if (data.producto) {
  const prodQuery = query(collection(db!, COLLECTIONS.ALMACEN), where('nombre', '==', data.producto))
  const prodSnapshot = await getDocs(prodQuery)
  
  if (!prodSnapshot.empty) {
    batch.update(prodSnapshot.docs[0].ref, {
      stockActual: increment(-cantidad),
      updatedAt: Timestamp.now()
    })
    
    // Crear movimiento de salida
    const salidaRef = doc(collection(db!, COLLECTIONS.MOVIMIENTOS))
    batch.set(salidaRef, {
      tipo: 'salida',
      productoId: prodSnapshot.docs[0].id,
      cantidad,
      motivo: 'venta',
      referenciaVentaId: ventaRef.id,
      fecha: Timestamp.now()
    })
  }
}
```

---

### 7. **FORMS - VALIDACIÓN INSUFICIENTE** 🟡

#### Problemas Menores:
- Campo `precioCompra` no obligatorio (puede ser 0, fórmula falla)
- Campo `cliente` acepta duplicados (debería autocompletar desde Firestore)
- Campo `montoPagado` no valida que sea ≤ `precioTotalVenta`
- No valida stock disponible antes de enviar form

---

### 8. **UI - DATOS NO SE REFRESCAN AUTOMÁTICAMENTE** 🔴

#### Problema:
Paneles usan `useState` + `useEffect` con fetch manual:
```typescript
// BentoVentas.tsx
const [ventas, setVentas] = useState<Venta[]>([])

useEffect(() => {
  const fetchVentas = async () => {
    const data = await getVentas()
    setVentas(data)
  }
  fetchVentas()
}, []) // ❌ Solo se ejecuta al montar
```

#### Solución Requerida:
```typescript
// Opción 1: Listener en tiempo real
useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, 'ventas'),
    (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setVentas(data as Venta[])
    }
  )
  return () => unsubscribe()
}, [])

// Opción 2: Escuchar triggerDataRefresh del store
useEffect(() => {
  fetchVentas()
}, [refreshTrigger]) // refreshTrigger viene de useAppStore
```

---

## 📊 MAPA DE FLUJO DE DATOS (ACTUAL vs ESPERADO)

### FLUJO ACTUAL (ROTO):
```
Usuario → Form CreateVenta → crearVenta(firestore-service.ts)
                                      ↓
                              Firestore actualizado
                                      ↓
                              ❌ UI NO SE ENTERA
                                      ↓
                         Paneles muestran datos viejos
```

### FLUJO ESPERADO (CORRECTO):
```
Usuario → Form CreateVenta → crearVenta(firestore-service.ts)
                                      ↓
                              Firestore actualizado
                                      ↓
                         triggerDataRefresh() ← Store Zustand
                                      ↓
                   Todos los paneles re-fetchean datos
                                      ↓
                              ✅ UI actualizada
```

---

## 🔧 PLAN DE CORRECCIÓN PRIORITARIO

### FASE 1: LÓGICA CORE (1-2 horas) 🔴
1. ✅ **Centralizar distribución de ventas** en `firestore-service.ts`
2. ✅ **Añadir actualización de stock OC** en `crearVenta`
3. ✅ **Añadir actualización de almacén** en `crearVenta`
4. ✅ **Implementar `triggerDataRefresh()` global** en useAppStore
5. ✅ **Conectar modales con `triggerDataRefresh()`**

### FASE 2: ACTUALIZACIÓN UI (1 hora) 🟡
6. ✅ **Añadir listeners `onSnapshot`** en paneles críticos:
   - BentoVentas
   - BentoClientes
   - BentoBancos
7. ✅ **Actualizar forms con validaciones**:
   - Validar stock antes de crear venta
   - Validar montoPagado ≤ totalVenta
   - Autocompletar clientes desde Firestore

### FASE 3: MEJORAS UX (30 min) 🟢
8. ✅ **Toast notifications** después de operaciones exitosas
9. ✅ **Loading states** en modales durante guardado
10. ✅ **Mensajes de error claros** con instrucciones

---

## 📝 CHECKLIST DE VERIFICACIÓN

### Crear Venta
- [ ] Form valida campos obligatorios
- [ ] Form valida stock disponible
- [ ] Cálculos de distribución correctos
- [ ] Venta se crea en Firestore
- [ ] Cliente se actualiza (deuda, totalVentas)
- [ ] Stock OC se descuenta
- [ ] Stock almacén se descuenta
- [ ] Movimiento de salida se crea
- [ ] Bancos se actualizan (historicoIngresos + capitalActual)
- [ ] Movimientos bancarios se crean
- [ ] UI se refresca automáticamente
- [ ] Toast de éxito se muestra

### Actualización de Bancos
- [ ] `historicoIngresos` siempre acumula totalVenta
- [ ] `capitalActual` solo suma montoPagado
- [ ] Estados de pago (completo/parcial/pendiente) funcionan
- [ ] Distribución proporcional en pagos parciales correcta
- [ ] UI diferencia entre capital actual y histórico

### Clientes
- [ ] Deuda se actualiza después de venta
- [ ] Abonos reducen deuda correctamente
- [ ] Histórico de pagos se registra
- [ ] Lista de ventas asociadas correcta

---

## 🎯 OBJETIVO FINAL

**Sistema 100% funcional donde**:
1. ✅ Crear venta actualiza TODO (cliente, bancos, stock, almacén)
2. ✅ UI refleja cambios en tiempo real
3. ✅ Lógica de distribución consistente en toda la app
4. ✅ Validaciones previenen errores de usuario
5. ✅ UX fluida con feedback claro

---

**SIGUIENTE ACCIÓN**: Implementar correcciones de FASE 1 (lógica core)
