/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                         VENTA MODEL & TYPES                                ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import { z } from 'zod';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const ProductoVentaSchema = z.object({
  productoId: z.string(),
  nombre: z.string(),
  cantidad: z.number().positive(),
  precioUnitario: z.number().positive(),
  subtotal: z.number().positive(),
});

export const CreateVentaSchema = z.object({
  clienteId: z.string(),
  clienteNombre: z.string().optional(),
  distribuidorId: z.string().optional(),
  distribuidorNombre: z.string().optional(),
  productos: z.array(ProductoVentaSchema),
  subtotal: z.number().positive(),
  descuento: z.number().default(0),
  impuestos: z.number().default(0),
  total: z.number().positive(),
  formaPago: z.enum(['efectivo', 'tarjeta', 'transferencia', 'credito']),
  estado: z.enum(['pendiente', 'parcial', 'pagado', 'cancelado']).optional(),
  saldoPendiente: z.number().optional(),
  notas: z.string().optional(),
  fecha: z.date().optional(),
});

export const UpdateVentaSchema = CreateVentaSchema.partial();

export const VentaFiltersSchema = z.object({
  clienteId: z.string().optional(),
  distribuidorId: z.string().optional(),
  estado: z.enum(['pendiente', 'parcial', 'pagado', 'cancelado']).optional(),
  fechaDesde: z.date().optional(),
  fechaHasta: z.date().optional(),
  limit: z.number().optional(),
});

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type ProductoVenta = z.infer<typeof ProductoVentaSchema>;
export type CreateVentaDto = z.infer<typeof CreateVentaSchema>;
export type UpdateVentaDto = z.infer<typeof UpdateVentaSchema>;
export type VentaFilters = z.infer<typeof VentaFiltersSchema>;

export interface Venta extends CreateVentaDto {
  id: string;
  fecha: Date;
  estado: 'pendiente' | 'parcial' | 'pagado' | 'cancelado';
  saldoPendiente: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}
