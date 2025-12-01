---
name: 📝 Verificación de Forms y Modales
about: Verificar funcionalidad de formularios, botones y validación
title: '[FORM] Verificar modal/form de [COMPONENT_NAME]'
labels: forms, verification, ui
assignees: ''
---

## 📋 Descripción
Verificar que el modal/formulario **[COMPONENT_NAME]** funciona correctamente con validación, manejo de errores y lógica de negocio.

## 🎯 Componente a Verificar
- **Archivo**: `app/components/modals/[COMPONENT_NAME].tsx`
- **Tipo**: Modal Premium / Form Smart

## ✅ Checklist de Verificación

### Estructura del Form
- [ ] Usa `react-hook-form` para manejo de estado
- [ ] Tiene schema Zod para validación
- [ ] Implementa `zodResolver` correctamente

### Campos y Validación
- [ ] Todos los campos requeridos tienen validación
- [ ] Mensajes de error claros y en español
- [ ] Validación de tipos (números, fechas, etc.)
- [ ] Validación de rangos si aplica

### Botones y Acciones
- [ ] Botón Submit funcional
- [ ] Botón Cancelar/Cerrar
- [ ] Estados de loading en botones
- [ ] Deshabilitado durante submit

### Manejo de Errores
- [ ] try/catch en handlers
- [ ] Muestra errores al usuario
- [ ] Usa `logger` en lugar de `console.log`

### Integración Firebase
- [ ] Usa hooks de Firestore correctamente
- [ ] Cleanup en useEffect si hay listeners

## 📦 Schema Zod Esperado
```typescript
// Ejemplo para venta:
const VentaSchema = z.object({
  clienteId: z.string().min(1, 'Cliente requerido'),
  cantidad: z.number().min(1, 'Cantidad mínima: 1'),
  precioVenta: z.number().min(0, 'Precio no puede ser negativo'),
  precioCompra: z.number().min(0),
  flete: z.number().default(500),
  estadoPago: z.enum(['completo', 'parcial', 'pendiente']),
})
```

## 🔗 Archivos Relacionados
- Schema: `app/lib/schemas/[feature].schema.ts`
- Service: `app/lib/services/[feature].service.ts`
- Hook: `app/hooks/useFirestoreCRUD.ts`

## 📝 Notas
<!-- Agregar detalles específicos del componente -->
