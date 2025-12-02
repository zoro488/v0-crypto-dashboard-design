/**
 * 🔥 CONVEX SCHEMA - CHRONOS SYSTEM
 * 
 * Esquema de base de datos en tiempo real para el sistema CHRONOS.
 * Convex proporciona sincronización automática, consultas reactivas y baja latencia.
 */

import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // ===== BANCOS =====
  bancos: defineTable({
    bancoId: v.string(), // boveda_monte, boveda_usa, etc.
    nombre: v.string(),
    icon: v.string(),
    color: v.string(),
    tipo: v.union(v.literal('boveda'), v.literal('operativo'), v.literal('gastos'), v.literal('utilidades')),
    moneda: v.union(v.literal('MXN'), v.literal('USD')),
    capitalActual: v.number(),
    capitalInicial: v.number(),
    historicoIngresos: v.number(),
    historicoGastos: v.number(),
    estado: v.union(v.literal('activo'), v.literal('inactivo')),
  }).index('by_bancoId', ['bancoId']),

  // ===== CLIENTES =====
  clientes: defineTable({
    nombre: v.string(),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
    direccion: v.optional(v.string()),
    actual: v.number(),
    deuda: v.number(),
    abonos: v.number(),
    pendiente: v.number(),
    estado: v.union(v.literal('activo'), v.literal('inactivo')),
    keywords: v.array(v.string()),
  })
    .index('by_nombre', ['nombre'])
    .searchIndex('search_nombre', { searchField: 'nombre' }),

  // ===== DISTRIBUIDORES =====
  distribuidores: defineTable({
    nombre: v.string(),
    empresa: v.optional(v.string()),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
    costoTotal: v.number(),
    abonos: v.number(),
    pendiente: v.number(),
    estado: v.union(v.literal('activo'), v.literal('inactivo')),
  })
    .index('by_nombre', ['nombre'])
    .searchIndex('search_nombre', { searchField: 'nombre' }),

  // ===== ÓRDENES DE COMPRA =====
  ordenes_compra: defineTable({
    ordenId: v.string(), // OC0001, OC0002, etc.
    fecha: v.string(),
    distribuidorId: v.optional(v.id('distribuidores')),
    distribuidor: v.string(),
    cantidad: v.number(),
    costoDistribuidor: v.number(),
    costoTransporte: v.number(),
    costoPorUnidad: v.number(),
    costoTotal: v.number(),
    stockActual: v.number(),
    stockInicial: v.number(),
    pagoDistribuidor: v.number(),
    deuda: v.number(),
    estado: v.union(v.literal('pendiente'), v.literal('parcial'), v.literal('pagado')),
  })
    .index('by_ordenId', ['ordenId'])
    .index('by_estado', ['estado'])
    .index('by_fecha', ['fecha']),

  // ===== VENTAS =====
  ventas: defineTable({
    ventaId: v.string(), // VTA00001, VTA00002, etc.
    fecha: v.string(),
    ocRelacionada: v.optional(v.string()),
    clienteId: v.optional(v.id('clientes')),
    cliente: v.string(),
    cantidad: v.number(),
    precioVenta: v.number(),
    precioCompra: v.number(),
    ingreso: v.number(),
    flete: v.union(v.literal('Aplica'), v.literal('NoAplica')),
    fleteUtilidad: v.number(),
    utilidad: v.number(),
    bovedaMonte: v.number(),
    estatus: v.union(v.literal('Pagado'), v.literal('Pendiente'), v.literal('Parcial')),
    montoPagado: v.number(),
    montoRestante: v.number(),
  })
    .index('by_ventaId', ['ventaId'])
    .index('by_cliente', ['cliente'])
    .index('by_fecha', ['fecha'])
    .index('by_estatus', ['estatus']),

  // ===== MOVIMIENTOS =====
  movimientos: defineTable({
    bancoId: v.string(),
    tipo: v.union(v.literal('ingreso'), v.literal('gasto'), v.literal('transferencia')),
    fecha: v.string(),
    monto: v.number(),
    concepto: v.string(),
    cliente: v.optional(v.string()),
    origen: v.optional(v.string()),
    destino: v.optional(v.string()),
    referenciaId: v.optional(v.string()),
    referenciaTipo: v.optional(v.string()),
  })
    .index('by_bancoId', ['bancoId'])
    .index('by_fecha', ['fecha'])
    .index('by_tipo', ['tipo']),

  // ===== GASTOS Y ABONOS =====
  gastos_abonos: defineTable({
    fecha: v.string(),
    tipo: v.union(v.literal('gasto'), v.literal('abono')),
    origen: v.string(),
    monto: v.number(),
    destino: v.string(),
    bancoId: v.optional(v.string()),
    concepto: v.optional(v.string()),
  })
    .index('by_tipo', ['tipo'])
    .index('by_fecha', ['fecha']),

  // ===== CHAT/IA =====
  messages: defineTable({
    role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
    content: v.string(),
    toolCalls: v.optional(v.array(v.object({
      name: v.string(),
      arguments: v.string(),
      result: v.optional(v.string()),
    }))),
    timestamp: v.number(),
    userId: v.optional(v.string()),
  })
    .index('by_timestamp', ['timestamp'])
    .index('by_userId', ['userId']),

  // ===== ANALYTICS =====
  analytics_events: defineTable({
    event: v.string(),
    properties: v.optional(v.any()),
    timestamp: v.number(),
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  })
    .index('by_event', ['event'])
    .index('by_timestamp', ['timestamp']),
})
