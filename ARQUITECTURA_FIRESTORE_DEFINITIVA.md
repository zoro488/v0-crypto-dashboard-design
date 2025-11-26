# 🏗️ ARQUITECTURA FIRESTORE DEFINITIVA - CHRONOS SYSTEM

## 📊 ANÁLISIS ACTUAL (26 Noviembre 2025)

### Estado Actual: 36 Colecciones Existentes

| Colección | Docs | Uso Real | Problema |
|-----------|------|----------|----------|
| **ventas** | 193 | ✅ UI activa | Datos reales |
| **ventas_local** | 96 | ⚠️ Duplicado | Migrar a `ventas` |
| **clientes** | 64 | ✅ UI activa | OK |
| **distribuidores** | 14 | ✅ UI activa | OK |
| **ordenes_compra** | 300 | ✅ UI activa | OK |
| **ordenesCompra** | 11 | ❌ DUPLICADO | ELIMINAR |
| **bancos** | 8 | ✅ UI activa | Estructura inconsistente |
| **movimientos** | 0 | ✅ UI espera | Colección VACÍA (crítico) |
| **almacen** | 215 | ⚠️ No usado | Datos legacy |
| **gya** | 300 | ⚠️ Duplicado | Gastos y Abonos legacy |
| **boveda_monte_ingresos** | 69 | ⚠️ Fragmentado | Migrar a `movimientos` |
| **boveda_usa_ingresos** | 17 | ⚠️ Fragmentado | Migrar a `movimientos` |
| **profit_ingresos** | 55 | ⚠️ Fragmentado | Migrar a `movimientos` |
| **leftie_ingresos** | 9 | ⚠️ Fragmentado | Migrar a `movimientos` |
| **azteca_ingresos** | 6 | ⚠️ Fragmentado | Migrar a `movimientos` |
| **flete_sur_ingresos** | 58 | ⚠️ Fragmentado | Migrar a `movimientos` |
| **utilidades_ingresos** | 50 | ⚠️ Fragmentado | Migrar a `movimientos` |
| **transaccionesBoveda** | 299 | ⚠️ Duplicado | Migrar a `movimientos` |
| **transaccionesBanco** | 81 | ⚠️ Duplicado | Migrar a `movimientos` |
| **transferencias** | 116 | ⚠️ Duplicado | Migrar a `movimientos` |
| **cortes_bancarios** | 0 | ✅ UI espera | Colección vacía |
| **gastos_abonos** | 0 | ✅ UI espera | Colección vacía |
| **logs** | 0 | ✅ UI espera | Colección vacía |
| **almacen_productos** | 0 | ✅ UI espera | Colección vacía |
| **almacen_entradas** | 0 | ✅ UI espera | Colección vacía |
| **almacen_salidas** | 0 | ✅ UI espera | Colección vacía |
| **dashboard_paneles** | 0 | ✅ UI espera | Colección vacía |
| **compras** | 9 | ⚠️ Duplicado | Igual que ordenes_compra |
| **productos** | 3 | ⚠️ Legacy | Migrar a almacen_productos |
| **inventario** | 9 | ⚠️ Legacy | Migrar a almacen |
| **control_maestro** | 96 | ❓ Revisar | Propósito desconocido |
| **data_adicional** | 83 | ❓ Revisar | Propósito desconocido |
| **bancosRfActual** | 25 | ❓ Legacy | Revisar |
| **rf_actual** | 1 | ❓ Legacy | Revisar |
| **stock_actual** | 1 | ❓ Legacy | Revisar |
| **capitales** | 1 | ❓ Legacy | Revisar |
| **configuracion** | 1 | ✅ Sistema | OK |
| **dashboard** | 1 | ⚠️ Duplicado | Migrar a dashboard_paneles |
| **estadoGlobal** | 1 | ❓ Legacy | Revisar |
| **sistema** | 9 | ✅ Sistema | OK |
| **reportes** | 6 | ✅ Sistema | OK |
| **user_profiles** | 2 | ✅ Auth | OK |
| **usuarios** | 1 | ⚠️ Duplicado | Consolidar con user_profiles |
| **cortes_caja** | 1 | ❓ Legacy | Revisar |

---

## 🎯 ARQUITECTURA PROPUESTA (DEFINITIVA)

### Principios de Diseño:
1. **Una fuente de verdad**: No duplicar datos
2. **Colecciones por dominio**: Separar por área funcional
3. **Escalabilidad**: Soportar crecimiento
4. **UI-First**: Diseñar según lo que la UI necesita

### 📁 Estructura de Colecciones Final

```
firestore/
├── 🏢 ENTIDADES PRINCIPALES
│   ├── clientes/              # 64 docs - Catálogo de clientes
│   ├── distribuidores/        # 14 docs - Catálogo de distribuidores  
│   └── bancos/                # 7 docs  - Catálogo de bancos/bóvedas
│
├── 💰 TRANSACCIONES
│   ├── ventas/                # ~300 docs - Todas las ventas
│   ├── ordenes_compra/        # ~300 docs - Órdenes de compra
│   └── movimientos/           # ~600 docs - TODOS los movimientos bancarios
│       │                      # (unifica: *_ingresos, transacciones*, transferencias)
│       ├── bancoId            # FK a bancos
│       ├── tipoMovimiento     # ingreso|gasto|transferencia_entrada|transferencia_salida
│       ├── monto
│       ├── fecha
│       └── concepto
│
├── 📦 ALMACÉN
│   ├── almacen_productos/     # Catálogo de productos
│   ├── almacen_entradas/      # Entradas de inventario
│   └── almacen_salidas/       # Salidas de inventario
│
├── 📊 REPORTES Y CORTES
│   ├── cortes_bancarios/      # Cortes de caja por banco
│   ├── reportes/              # Reportes generados
│   └── dashboard_paneles/     # Estado del dashboard
│
├── ⚙️ SISTEMA
│   ├── configuracion/         # Config global (1 doc)
│   ├── sistema/               # Estado del sistema
│   └── logs/                  # Logs de auditoría
│
└── 👤 USUARIOS
    └── user_profiles/         # Perfiles de usuario
```

---

## 🔄 PLAN DE MIGRACIÓN

### FASE 1: Consolidar Movimientos (CRÍTICO)

**Problema actual**: Los movimientos bancarios están fragmentados en 10+ colecciones.

**Colecciones a unificar**:
- `boveda_monte_ingresos` (69 docs)
- `boveda_usa_ingresos` (17 docs)
- `profit_ingresos` (55 docs)
- `leftie_ingresos` (9 docs)
- `azteca_ingresos` (6 docs)
- `flete_sur_ingresos` (58 docs)
- `utilidades_ingresos` (50 docs)
- `transaccionesBoveda` (299 docs)
- `transaccionesBanco` (81 docs)
- `transferencias` (116 docs)
- `gya` (300 docs) - gastos y abonos

**Total a migrar**: ~1,060 documentos → `movimientos`

**Estructura destino**:
```typescript
interface Movimiento {
  id: string
  bancoId: BancoId           // boveda_monte|boveda_usa|profit|leftie|azteca|flete_sur|utilidades
  tipoMovimiento: 'ingreso' | 'gasto' | 'transferencia_entrada' | 'transferencia_salida'
  monto: number
  fecha: Timestamp
  concepto: string
  cliente?: string           // Para ingresos de ventas
  destino?: string           // Para transferencias
  origen?: string            // Para transferencias
  ventaId?: string           // FK a venta relacionada
  ocId?: string              // FK a orden de compra relacionada
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### FASE 2: Consolidar Ventas

- Migrar `ventas_local` (96 docs) → `ventas` (193 docs)
- Total final: ~289 ventas únicas

### FASE 3: Eliminar Duplicados

Colecciones a ELIMINAR después de migración:
- `ordenesCompra` (usar `ordenes_compra`)
- `compras` (duplicado)
- `ventas_local` (migrado)
- `productos` (usar `almacen_productos`)
- `inventario` (usar `almacen`)
- `usuarios` (usar `user_profiles`)
- `dashboard` (usar `dashboard_paneles`)
- Todas las `*_ingresos`
- `transaccionesBoveda`
- `transaccionesBanco`
- `transferencias`
- `gya`

### FASE 4: Limpiar Legacy

Revisar y decidir:
- `bancosRfActual` (25 docs) - ¿Qué es RF?
- `rf_actual` (1 doc)
- `control_maestro` (96 docs)
- `data_adicional` (83 docs)
- `estadoGlobal` (1 doc)
- `capitales` (1 doc)
- `stock_actual` (1 doc)
- `cortes_caja` (1 doc)
- `almacen` (215 docs) - Revisar estructura

---

## 📋 MAPEO DE BANCOS

### IDs Estandarizados

| ID Interno | Nombre Display | Colecciones Legacy |
|------------|---------------|-------------------|
| `boveda_monte` | Bóveda Monte | boveda_monte_ingresos, bovedaMonte, boveda-monte |
| `boveda_usa` | Bóveda USA | boveda_usa_ingresos, bovedaUsa |
| `profit` | Profit | profit_ingresos |
| `leftie` | Leftie | leftie_ingresos |
| `azteca` | Azteca | azteca_ingresos |
| `flete_sur` | Flete Sur | flete_sur_ingresos, fleteSur |
| `utilidades` | Utilidades | utilidades_ingresos |

### Estructura de `bancos/` (7 docs)

```typescript
interface Banco {
  id: BancoId
  nombre: string
  tipo: 'boveda' | 'operativo' | 'gastos' | 'utilidades'
  color: string
  icon: string
  capitalActual: number       // Calculado de movimientos
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

---

## ⚙️ CÓDIGO UI - COLECCIONES ESPERADAS

Según `firestore-hooks.service.ts`, la UI espera:

| Hook | Colección Esperada | Estado |
|------|-------------------|--------|
| `useVentasData` | `ventas` | ✅ OK (193 docs) |
| `useClientesData` | `clientes` | ✅ OK (64 docs) |
| `useDistribuidoresData` | `distribuidores` | ✅ OK (14 docs) |
| `useOrdenesCompraData` | `ordenes_compra` | ✅ OK (300 docs) |
| `useBancoData` | `movimientos` | ⚠️ VACÍA (migrar!) |
| `useGYAData` | `movimientos` | ⚠️ VACÍA |
| `useIngresosBanco` | `movimientos` | ⚠️ VACÍA |
| `useGastos` | `movimientos` | ⚠️ VACÍA |
| `useTransferencias` | `movimientos` | ⚠️ VACÍA |
| `useCorteBancario` | `cortes_bancarios` | ⚠️ VACÍA |
| `useAlmacenData` | `almacen_productos` | ⚠️ VACÍA |
| `useEntradasAlmacen` | `almacen_entradas` | ⚠️ VACÍA |
| `useSalidasAlmacen` | `almacen_salidas` | ⚠️ VACÍA |
| `useDashboardData` | `dashboard_paneles` | ⚠️ VACÍA |

**PROBLEMA CRÍTICO**: La colección `movimientos` que la UI espera está VACÍA. Todos los datos reales están en las colecciones fragmentadas.

---

## 🚀 SCRIPT DE MIGRACIÓN REQUERIDO

### Prioridad ALTA:

1. **Migrar movimientos bancarios**:
   - Leer de: `*_ingresos`, `transacciones*`, `transferencias`, `gya`
   - Escribir a: `movimientos`
   - Normalizar: bancoId, tipoMovimiento

2. **Migrar ventas_local → ventas**:
   - Deduplicar por ID de venta
   - Mantener la más reciente

3. **Actualizar capitales de bancos**:
   - Calcular desde `movimientos`
   - Escribir a `bancos/{id}.capitalActual`

---

## 📌 DECISIÓN ARQUITECTÓNICA

### Opción A: Migración Completa (RECOMENDADA) ✅
- Crear script de migración
- Mover datos a colecciones correctas
- Eliminar colecciones duplicadas
- **Tiempo**: 2-4 horas
- **Riesgo**: Bajo (backup previo)
- **Beneficio**: Sistema limpio y mantenible

### Opción B: Adaptar UI a Colecciones Existentes
- Cambiar hooks para leer de múltiples colecciones
- No eliminar nada
- **Tiempo**: 1-2 horas
- **Riesgo**: Deuda técnica permanente
- **Problema**: Código complejo y frágil

### Opción C: Híbrido
- Crear vistas/aggregations en código
- Mantener datos donde están
- **Tiempo**: 3-5 horas
- **Riesgo**: Alto (sincronización)

---

## ✅ PRÓXIMOS PASOS

1. [ ] **Backup de Firestore** (export)
2. [ ] Crear script `migrate-to-movimientos.ts`
3. [ ] Migrar todos los movimientos bancarios
4. [ ] Migrar ventas_local a ventas
5. [ ] Actualizar capitales en bancos
6. [ ] Verificar que UI funciona
7. [ ] Eliminar colecciones obsoletas
8. [ ] Actualizar firestore.rules
9. [ ] Actualizar firestore.indexes.json
10. [ ] Commit y deploy

---

## 📊 MÉTRICAS DE ÉXITO

Después de migración:
- [ ] `movimientos`: ~1,060 documentos
- [ ] `ventas`: ~289 documentos (sin duplicados)
- [ ] `bancos`: 7 documentos con capitalActual correcto
- [ ] Colecciones eliminadas: ~15
- [ ] UI funcionando sin errores
- [ ] Queries optimizadas con índices correctos

---

**Documento generado**: 26 Noviembre 2025
**Autor**: Copilot - Análisis Exhaustivo de Firestore
