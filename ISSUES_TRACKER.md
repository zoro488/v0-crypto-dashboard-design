# 📋 CHRONOS - Issues y Tareas Pendientes

Este documento contiene todas las issues y tareas identificadas para asegurar la funcionalidad completa del sistema CHRONOS, incluyendo la integración de componentes 3D en los paneles principales.

## 🎯 Resumen Ejecutivo

| Categoría | Total | Completadas | Pendientes |
|-----------|-------|-------------|------------|
| Integración 3D | 8 | 2 | 6 |
| Lógica de Negocio | 5 | 3 | 2 |
| Forms/Modales | 14 | 10 | 4 |
| Tests | 6 | 4 | 2 |

---

## 🎮 Issues de Integración 3D

### Issue #1: Integrar componentes 3D en BentoDashboard
**Estado:** ✅ Completado
**Prioridad:** Alta
**Componentes integrados:**
- `PremiumSplineOrb` - Orbe de estado del sistema
- `QuickStatsGrid` - Grid de estadísticas
- `ActivityFeedWidget` - Feed de actividad
- `MiniChartWidget` - Mini gráficos

### Issue #2: Integrar AIBrainVisualizer en BentoIA
**Estado:** ✅ Completado
**Prioridad:** Alta
**Componentes integrados:**
- `AIBrainVisualizer` - Red neural visualizada
- `QuickStatWidget` - Stats de IA
- `ActivityFeedWidget` - Actividad del agente
- Fallback cuando Spline está deshabilitado

### Issue #3: Agregar SalesFlowDiagram a BentoVentas
**Estado:** ✅ Completado
**Prioridad:** Alta
**Componentes integrados:**
- `SalesFlowDiagram` - Flujo de ventas animado
- Gráficos de distribución GYA

### Issue #4: Integrar ClientNetworkGraph en BentoClientes
**Estado:** ⏳ Pendiente
**Prioridad:** Media
**Componentes a agregar:**
- `ClientNetworkGraph` - Red de clientes
- `AnalyticsGlobe3D` - Distribución geográfica (opcional)

### Issue #5: Agregar InventoryHeatGrid a BentoAlmacen
**Estado:** ⏳ Pendiente
**Prioridad:** Media
**Componentes a agregar:**
- `InventoryHeatGrid` - Mapa de calor de stock

### Issue #6: Integrar FinancialRiverFlow en BentoBanco
**Estado:** ⏳ Pendiente
**Prioridad:** Media
**Componentes a agregar:**
- `FinancialRiverFlow` - Flujo de capital animado
- `ProfitWaterfallChart` - Waterfall de ganancias

### Issue #7: Agregar WorkflowVisualizer3D a BentoOrdenesCompra
**Estado:** ⏳ Pendiente
**Prioridad:** Media
**Componentes a agregar:**
- `WorkflowVisualizer3D` - Pipeline de órdenes

### Issue #8: Integrar ReportsTimeline en BentoReportes
**Estado:** ⏳ Pendiente
**Prioridad:** Baja
**Componentes a agregar:**
- `ReportsTimeline` - Timeline de reportes
- `ProfitWaterfallChart` - Gráfico de cascada

---

## 💼 Issues de Lógica de Negocio

### Issue #9: Verificar Fórmulas de Distribución GYA
**Estado:** ✅ Completado
**Prioridad:** Crítica
**Verificación:**
```typescript
// Fórmula correcta implementada:
montoBovedaMonte = precioCompraUnidad × cantidad    // COSTO
montoFletes = precioFlete × cantidad                 // FLETE  
montoUtilidades = (precioVenta - precioCompra - flete) × cantidad  // GANANCIA
```

### Issue #10: Implementar Estados de Pago Correctos
**Estado:** ✅ Completado
**Prioridad:** Crítica
**Estados:**
- ✅ Completo: 100% distribuido
- ✅ Parcial: Distribución proporcional
- ✅ Pendiente: Solo histórico

### Issue #11: Verificar Cálculo de Capital Bancario
**Estado:** ✅ Completado
**Prioridad:** Crítica
**Fórmula:**
```typescript
capitalActual = historicoIngresos - historicoGastos
```

### Issue #12: Validar 7 Bancos/Bóvedas
**Estado:** ⏳ Pendiente
**Prioridad:** Alta
**Bancos a verificar:**
- [ ] boveda_monte (MXN)
- [ ] boveda_usa (USD)
- [ ] profit
- [ ] leftie
- [ ] azteca
- [ ] flete_sur
- [ ] utilidades

### Issue #13: Implementar Distribución Proporcional para Pagos Parciales
**Estado:** ⏳ Pendiente
**Prioridad:** Alta
**Fórmula:**
```typescript
proporcion = montoPagado / precioTotalVenta
// Aplicar proporción a cada banco
```

---

## 📝 Issues de Forms y Modales

### Issue #14-27: Verificar Modales Premium (14 modales)
**Estado:** 10 Completados, 4 Pendientes

| Modal | Estado | Validación Zod | Error Handling |
|-------|--------|---------------|----------------|
| CreateVentaModalPremium | ✅ | ✅ | ✅ |
| CreateOrdenCompraModalPremium | ✅ | ✅ | ✅ |
| CreateClienteModalPremium | ✅ | ✅ | ✅ |
| CreateDistribuidorModalPremium | ✅ | ✅ | ✅ |
| CreateTransferenciaModalPremium | ✅ | ✅ | ✅ |
| CreateAbonoClienteModal | ⏳ | ⚠️ | ⚠️ |
| CreatePagoDistribuidorModal | ⏳ | ⚠️ | ⚠️ |
| CreateProductoModal | ⏳ | ⚠️ | ⚠️ |
| CreateEntradaAlmacenModal | ⏳ | ⚠️ | ⚠️ |

---

## 🧪 Issues de Tests

### Issue #28: Tests para Schemas Zod
**Estado:** ✅ Completado
**Archivo:** `__tests__/schemas/`

### Issue #29: Tests para Store Zustand
**Estado:** ✅ Completado
**Archivo:** `__tests__/store/`

### Issue #30: Tests de Integración Firebase
**Estado:** ⏳ Pendiente
**Archivo:** `__tests__/integration/`

### Issue #31: Tests E2E con Playwright
**Estado:** ⏳ Pendiente
**Archivo:** `e2e/`

---

## 🗑️ Paneles a Eliminar (Migrados a principales)

Los siguientes paneles demo/3D deben eliminarse después de integrar sus componentes en los paneles principales:

1. ~~`app/demo-3d/page.tsx`~~ - Mantener como referencia/demo
2. `BentoIAImmersive.tsx` - Funcionalidad migrada a `BentoIA.tsx`
3. `BentoZeroForce.tsx` - Componentes migrados a otros paneles

**Nota:** Solo eliminar después de verificar que la funcionalidad está en paneles principales.

---

## 📅 Cronograma Sugerido

### Semana 1: Integración 3D
- Issues #4, #5, #6 (Clientes, Almacén, Banco)

### Semana 2: Lógica de Negocio
- Issues #12, #13 (Bancos, Pagos Parciales)

### Semana 3: Forms y Tests
- Issues #14-27 (Modales pendientes)
- Issues #30, #31 (Tests)

### Semana 4: Limpieza
- Eliminar paneles redundantes
- Documentación final

---

## 🔗 Workflows Relacionados

| Workflow | Descripción |
|----------|-------------|
| `component-verification.yml` | Verificar componentes, forms, 3D |
| `3d-integration.yml` | Integración de componentes 3D |
| `business-logic-verification.yml` | Verificar lógica GYA |
| `agent-session-tasks.yml` | Tareas automatizadas del agente |

---

## 📝 Notas

- Usar `logger` de `app/lib/utils/logger.ts` en lugar de `console.log`
- Evitar `any` en TypeScript - usar tipos específicos
- Cleanup obligatorio en `useEffect` con listeners
- Validación Zod en todos los formularios
