// ═══════════════════════════════════════════════════════════════
// CHRONOS - TIPOS DE SERVER ACTIONS
// Archivo separado para evitar errores de 'use server' con tipos
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════
// VENTAS
// ═══════════════════════════════════════════════════════════════

export const CreateVentaSchema = z.object({
  clienteId: z.string().min(1, 'Cliente requerido'),
  cantidad: z.number().int().positive('Cantidad debe ser positiva'),
  precioVentaUnidad: z.number().positive('Precio de venta requerido'),
  precioCompraUnidad: z.number().positive('Precio de compra requerido'),
  precioFlete: z.number().min(0).default(0),
  montoPagado: z.number().min(0).default(0),
  observaciones: z.string().optional(),
})

export const UpdateVentaSchema = CreateVentaSchema.partial().extend({
  id: z.string().min(1, 'ID requerido'),
})

export const AbonoVentaSchema = z.object({
  ventaId: z.string().min(1, 'Venta requerida'),
  monto: z.number().positive('Monto debe ser positivo'),
  bancoDestinoId: z.string().min(1, 'Banco destino requerido'),
  referencia: z.string().optional(),
})

export type CreateVentaInput = z.infer<typeof CreateVentaSchema>
export type UpdateVentaInput = z.infer<typeof UpdateVentaSchema>
export type AbonoVentaInput = z.infer<typeof AbonoVentaSchema>

// ═══════════════════════════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════════════════════════

export const CreateClienteSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  rfc: z.string().optional(),
  limiteCredito: z.number().min(0).default(0),
})

export const UpdateClienteSchema = CreateClienteSchema.partial().extend({
  id: z.string().min(1, 'ID requerido'),
})

export type CreateClienteInput = z.infer<typeof CreateClienteSchema>
export type UpdateClienteInput = z.infer<typeof UpdateClienteSchema>

// ═══════════════════════════════════════════════════════════════
// DISTRIBUIDORES
// ═══════════════════════════════════════════════════════════════

export const CreateDistribuidorSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  empresa: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  tipoProductos: z.string().optional(),
})

export const UpdateDistribuidorSchema = CreateDistribuidorSchema.partial().extend({
  id: z.string().min(1, 'ID requerido'),
})

export type CreateDistribuidorInput = z.infer<typeof CreateDistribuidorSchema>
export type UpdateDistribuidorInput = z.infer<typeof UpdateDistribuidorSchema>

// ═══════════════════════════════════════════════════════════════
// ORDENES DE COMPRA
// ═══════════════════════════════════════════════════════════════

export const CreateOrdenSchema = z.object({
  distribuidorId: z.string().min(1, 'Distribuidor requerido'),
  cantidad: z.number().int().positive('Cantidad debe ser positiva'),
  precioUnitario: z.number().positive('Precio debe ser positivo'),
  iva: z.number().min(0).default(0),
  bancoOrigenId: z.string().min(1, 'Banco origen requerido'),
  observaciones: z.string().optional(),
  numeroOrden: z.string().optional(),
})

export const PagoOrdenSchema = z.object({
  ordenId: z.string(),
  monto: z.number().positive('Monto debe ser positivo'),
  bancoOrigenId: z.string(),
  referencia: z.string().optional(),
})

export const CambiarEstadoOrdenSchema = z.object({
  ordenId: z.string(),
  nuevoEstado: z.enum(['pendiente', 'parcial', 'completo', 'cancelado']),
})

export type CreateOrdenInput = z.infer<typeof CreateOrdenSchema>
export type PagoOrdenInput = z.infer<typeof PagoOrdenSchema>
export type CambiarEstadoOrdenInput = z.infer<typeof CambiarEstadoOrdenSchema>

// ═══════════════════════════════════════════════════════════════
// MOVIMIENTOS
// ═══════════════════════════════════════════════════════════════

export const TipoMovimiento = z.enum([
  'ingreso', 
  'gasto', 
  'transferencia_entrada', 
  'transferencia_salida', 
  'abono', 
  'pago'
])

export const CreateMovimientoSchema = z.object({
  bancoId: z.string().min(1, 'Banco requerido'),
  tipo: TipoMovimiento,
  monto: z.number().positive('Monto debe ser positivo'),
  concepto: z.string().min(1, 'Concepto requerido'),
  referencia: z.string().optional(),
  clienteId: z.string().optional(),
  distribuidorId: z.string().optional(),
  ventaId: z.string().optional(),
  ordenCompraId: z.string().optional(),
  observaciones: z.string().optional(),
})

export const FiltrosMovimientoSchema = z.object({
  bancoId: z.string().optional(),
  tipo: TipoMovimiento.optional(),
  fechaInicio: z.date().optional(),
  fechaFin: z.date().optional(),
  busqueda: z.string().optional(),
  limit: z.number().min(1).max(500).default(100),
  offset: z.number().min(0).default(0),
})

export type CreateMovimientoInput = z.infer<typeof CreateMovimientoSchema>
export type FiltrosMovimiento = z.infer<typeof FiltrosMovimientoSchema>

// ═══════════════════════════════════════════════════════════════
// ALMACEN
// ═══════════════════════════════════════════════════════════════

export const CreateProductoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  cantidad: z.number().int().min(0, 'Cantidad no puede ser negativa'),
  precioCompra: z.number().positive('Precio de compra debe ser positivo'),
  precioVenta: z.number().positive('Precio de venta debe ser positivo'),
  minimo: z.number().int().min(0).default(0),
  ubicacion: z.string().optional(),
})

export const UpdateProductoSchema = CreateProductoSchema.partial().extend({
  id: z.string().min(1, 'ID requerido'),
})

export const AjustarInventarioSchema = z.object({
  productoId: z.string().min(1, 'Producto requerido'),
  cantidad: z.number().int(),
  tipo: z.enum(['entrada', 'salida', 'ajuste']),
  motivo: z.string().min(1, 'Motivo requerido'),
  bancoId: z.string().optional(),
})

export type CreateProductoInput = z.infer<typeof CreateProductoSchema>
export type UpdateProductoInput = z.infer<typeof UpdateProductoSchema>
export type AjustarInventarioInput = z.infer<typeof AjustarInventarioSchema>

// ═══════════════════════════════════════════════════════════════
// USUARIOS
// ═══════════════════════════════════════════════════════════════

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
})

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
  nombre: z.string().min(2, 'Nombre requerido'),
  role: z.enum(['admin', 'operator', 'viewer']).default('viewer'),
})

export const UpdateUsuarioSchema = z.object({
  id: z.string().min(1, 'ID requerido'),
  email: z.string().email('Email inválido').optional(),
  nombre: z.string().min(2).optional(),
  role: z.enum(['admin', 'operator', 'viewer']).optional(),
  password: z.string().min(8).optional(),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type UpdateUsuarioInput = z.infer<typeof UpdateUsuarioSchema>

// ═══════════════════════════════════════════════════════════════
// REPORTES
// ═══════════════════════════════════════════════════════════════

export const FiltrosReporteSchema = z.object({
  fechaInicio: z.date(),
  fechaFin: z.date(),
  bancoId: z.string().optional(),
  clienteId: z.string().optional(),
  distribuidorId: z.string().optional(),
})

export type FiltrosReporte = z.infer<typeof FiltrosReporteSchema>
