// database/schema.ts
import { sql } from 'drizzle-orm'
import { 
  sqliteTable, 
  text, 
  integer, 
  real, 
  index,
} from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// ═══════════════════════════════════════════════════════════════
// USUARIOS
// ═══════════════════════════════════════════════════════════════

export const usuarios = sqliteTable('usuarios', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  nombre: text('nombre').notNull(),
  role: text('role', { enum: ['admin', 'operator', 'viewer'] }).default('viewer'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
}))

// ═══════════════════════════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════════════════════════

export const clientes = sqliteTable('clientes', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  email: text('email'),
  telefono: text('telefono'),
  direccion: text('direccion'),
  rfc: text('rfc'),
  limiteCredito: real('limite_credito').default(0),
  saldoPendiente: real('saldo_pendiente').default(0),
  estado: text('estado', { enum: ['activo', 'inactivo', 'suspendido'] }).default('activo'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  nombreIdx: index('cliente_nombre_idx').on(table.nombre),
  estadoIdx: index('cliente_estado_idx').on(table.estado),
}))

// ═══════════════════════════════════════════════════════════════
// DISTRIBUIDORES
// ═══════════════════════════════════════════════════════════════

export const distribuidores = sqliteTable('distribuidores', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  empresa: text('empresa'),
  telefono: text('telefono'),
  email: text('email'),
  tipoProductos: text('tipo_productos'),
  saldoPendiente: real('saldo_pendiente').default(0),
  estado: text('estado', { enum: ['activo', 'inactivo'] }).default('activo'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  nombreIdx: index('distribuidor_nombre_idx').on(table.nombre),
}))

// ═══════════════════════════════════════════════════════════════
// BANCOS
// ═══════════════════════════════════════════════════════════════

export const bancos = sqliteTable('bancos', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  tipo: text('tipo', { enum: ['operativo', 'inversion', 'ahorro'] }).notNull(),
  capitalActual: real('capital_actual').default(0).notNull(),
  historicoIngresos: real('historico_ingresos').default(0).notNull(),
  historicoGastos: real('historico_gastos').default(0).notNull(),
  color: text('color').notNull(),
  icono: text('icono'),
  orden: integer('orden').default(0),
  activo: integer('activo', { mode: 'boolean' }).default(true),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  tipoIdx: index('banco_tipo_idx').on(table.tipo),
}))

// ═══════════════════════════════════════════════════════════════
// VENTAS
// ═══════════════════════════════════════════════════════════════

export const ventas = sqliteTable('ventas', {
  id: text('id').primaryKey(),
  clienteId: text('cliente_id').notNull().references(() => clientes.id),
  fecha: integer('fecha', { mode: 'timestamp' }).notNull(),
  
  cantidad: integer('cantidad').notNull(),
  precioVentaUnidad: real('precio_venta_unidad').notNull(),
  precioCompraUnidad: real('precio_compra_unidad').notNull(),
  precioFlete: real('precio_flete').default(0),
  
  precioTotalVenta: real('precio_total_venta').notNull(),
  montoPagado: real('monto_pagado').default(0),
  montoRestante: real('monto_restante').notNull(),
  
  montoBovedaMonte: real('monto_boveda_monte').default(0),
  montoFletes: real('monto_fletes').default(0),
  montoUtilidades: real('monto_utilidades').default(0),
  
  estadoPago: text('estado_pago', { 
    enum: ['pendiente', 'parcial', 'completo'] 
  }).default('pendiente'),
  
  observaciones: text('observaciones'),
  createdBy: text('created_by').references(() => usuarios.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  clienteIdx: index('venta_cliente_idx').on(table.clienteId),
  fechaIdx: index('venta_fecha_idx').on(table.fecha),
  estadoIdx: index('venta_estado_idx').on(table.estadoPago),
}))

// ═══════════════════════════════════════════════════════════════
// ORDENES DE COMPRA
// ═══════════════════════════════════════════════════════════════

export const ordenesCompra = sqliteTable('ordenes_compra', {
  id: text('id').primaryKey(),
  distribuidorId: text('distribuidor_id').notNull().references(() => distribuidores.id),
  fecha: integer('fecha', { mode: 'timestamp' }).notNull(),
  
  numeroOrden: text('numero_orden').unique(),
  cantidad: integer('cantidad').notNull(),
  precioUnitario: real('precio_unitario').notNull(),
  
  subtotal: real('subtotal').notNull(),
  iva: real('iva').default(0),
  total: real('total').notNull(),
  
  montoPagado: real('monto_pagado').default(0),
  montoRestante: real('monto_restante').notNull(),
  
  estado: text('estado', { 
    enum: ['pendiente', 'parcial', 'completo', 'cancelado'] 
  }).default('pendiente'),
  
  bancoOrigenId: text('banco_origen_id').references(() => bancos.id),
  observaciones: text('observaciones'),
  
  createdBy: text('created_by').references(() => usuarios.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  distribuidorIdx: index('oc_distribuidor_idx').on(table.distribuidorId),
  fechaIdx: index('oc_fecha_idx').on(table.fecha),
  estadoIdx: index('oc_estado_idx').on(table.estado),
}))

// ═══════════════════════════════════════════════════════════════
// MOVIMIENTOS
// ═══════════════════════════════════════════════════════════════

export const movimientos = sqliteTable('movimientos', {
  id: text('id').primaryKey(),
  bancoId: text('banco_id').notNull().references(() => bancos.id),
  
  tipo: text('tipo', { 
    enum: ['ingreso', 'gasto', 'transferencia_entrada', 'transferencia_salida', 'abono', 'pago'] 
  }).notNull(),
  
  monto: real('monto').notNull(),
  fecha: integer('fecha', { mode: 'timestamp' }).notNull(),
  
  concepto: text('concepto').notNull(),
  referencia: text('referencia'),
  
  bancoOrigenId: text('banco_origen_id').references(() => bancos.id),
  bancoDestinoId: text('banco_destino_id').references(() => bancos.id),
  
  clienteId: text('cliente_id').references(() => clientes.id),
  distribuidorId: text('distribuidor_id').references(() => distribuidores.id),
  ventaId: text('venta_id').references(() => ventas.id),
  ordenCompraId: text('orden_compra_id').references(() => ordenesCompra.id),
  
  observaciones: text('observaciones'),
  createdBy: text('created_by').references(() => usuarios.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  bancoIdx: index('mov_banco_idx').on(table.bancoId),
  tipoIdx: index('mov_tipo_idx').on(table.tipo),
  fechaIdx: index('mov_fecha_idx').on(table.fecha),
  referenciaIdx: index('mov_referencia_idx').on(table.referencia),
}))

// ═══════════════════════════════════════════════════════════════
// ALMACEN
// ═══════════════════════════════════════════════════════════════

export const almacen = sqliteTable('almacen', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  cantidad: integer('cantidad').notNull().default(0),
  precioCompra: real('precio_compra').notNull(),
  precioVenta: real('precio_venta').notNull(),
  minimo: integer('minimo').default(0),
  ubicacion: text('ubicacion'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  nombreIdx: index('almacen_nombre_idx').on(table.nombre),
}))

// ═══════════════════════════════════════════════════════════════
// RELACIONES
// ═══════════════════════════════════════════════════════════════

export const ventasRelations = relations(ventas, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [ventas.clienteId],
    references: [clientes.id],
  }),
  movimientos: many(movimientos),
}))

export const clientesRelations = relations(clientes, ({ many }) => ({
  ventas: many(ventas),
  movimientos: many(movimientos),
}))

export const bancosRelations = relations(bancos, ({ many }) => ({
  movimientos: many(movimientos),
  ordenesCompra: many(ordenesCompra),
}))

export const distribuidoresRelations = relations(distribuidores, ({ many }) => ({
  ordenesCompra: many(ordenesCompra),
  movimientos: many(movimientos),
}))

export const ordenesCompraRelations = relations(ordenesCompra, ({ one }) => ({
  distribuidor: one(distribuidores, {
    fields: [ordenesCompra.distribuidorId],
    references: [distribuidores.id],
  }),
  bancoOrigen: one(bancos, {
    fields: [ordenesCompra.bancoOrigenId],
    references: [bancos.id],
  }),
}))

export const movimientosRelations = relations(movimientos, ({ one }) => ({
  banco: one(bancos, {
    fields: [movimientos.bancoId],
    references: [bancos.id],
  }),
  cliente: one(clientes, {
    fields: [movimientos.clienteId],
    references: [clientes.id],
  }),
  venta: one(ventas, {
    fields: [movimientos.ventaId],
    references: [ventas.id],
  }),
  ordenCompra: one(ordenesCompra, {
    fields: [movimientos.ordenCompraId],
    references: [ordenesCompra.id],
  }),
}))

// Export types
export type Usuario = typeof usuarios.$inferSelect
export type InsertUsuario = typeof usuarios.$inferInsert
export type Cliente = typeof clientes.$inferSelect
export type InsertCliente = typeof clientes.$inferInsert
export type Distribuidor = typeof distribuidores.$inferSelect
export type InsertDistribuidor = typeof distribuidores.$inferInsert
export type Banco = typeof bancos.$inferSelect
export type InsertBanco = typeof bancos.$inferInsert
export type Venta = typeof ventas.$inferSelect
export type InsertVenta = typeof ventas.$inferInsert
export type OrdenCompra = typeof ordenesCompra.$inferSelect
export type InsertOrdenCompra = typeof ordenesCompra.$inferInsert
export type Movimiento = typeof movimientos.$inferSelect
export type InsertMovimiento = typeof movimientos.$inferInsert
export type Almacen = typeof almacen.$inferSelect
export type InsertAlmacen = typeof almacen.$inferInsert
