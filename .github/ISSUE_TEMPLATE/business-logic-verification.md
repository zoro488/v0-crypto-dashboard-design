---
name: 💼 Verificación de Lógica de Negocio
about: Verificar y corregir la lógica de negocio del sistema CHRONOS
title: '[BIZ] Verificar lógica de [FEATURE_NAME]'
labels: business-logic, verification
assignees: ''
---

## 📋 Descripción
Verificar y asegurar que la lógica de negocio para **[FEATURE_NAME]** está correctamente implementada según las reglas del sistema CHRONOS.

## 🎯 Área de Verificación

### Distribución Automática de Ventas (GYA)
```typescript
// Fórmula CORRECTA:
const montoBovedaMonte = precioCompraUnidad * cantidad    // COSTO
const montoFletes = precioFlete * cantidad                 // FLETE
const montoUtilidades = (precioVentaUnidad - precioCompraUnidad - precioFlete) * cantidad  // GANANCIA
```

### Estados de Pago
- [ ] **Completo**: 100% distribuido a los 3 bancos
- [ ] **Parcial**: Distribución proporcional (`proporcion = montoPagado / precioTotalVenta`)
- [ ] **Pendiente**: Solo en histórico, NO afecta capital actual

### Capital Bancario
```typescript
// Fórmula:
capitalActual = historicoIngresos - historicoGastos
// historicoIngresos y historicoGastos son acumulativos y NUNCA disminuyen
```

## 📦 Archivos a Verificar
- [ ] `app/lib/services/` - Servicios de negocio
- [ ] `app/lib/schemas/` - Schemas de validación
- [ ] `app/components/panels/` - Paneles con lógica
- [ ] `app/components/modals/` - Modales de CRUD

## ✅ Criterios de Aceptación
- [ ] Fórmulas GYA implementadas correctamente
- [ ] Estados de pago funcionan según especificación
- [ ] Capital se calcula dinámicamente
- [ ] Validación Zod en todos los forms
- [ ] Tests unitarios cubren casos críticos
- [ ] Logger usado en lugar de console.log

## 🔍 Verificaciones Específicas

### Para Ventas
- [ ] Distribución a Bóveda Monte (costo)
- [ ] Distribución a Flete Sur (flete)
- [ ] Distribución a Utilidades (ganancia)

### Para Bancos
- [ ] 7 bancos/bóvedas configurados
- [ ] Cálculo de saldo correcto
- [ ] Histórico de movimientos

### Para Clientes
- [ ] Balance de deuda
- [ ] Historial de pagos/abonos

## 📝 Notas Adicionales
<!-- Agregar contexto específico del feature -->
