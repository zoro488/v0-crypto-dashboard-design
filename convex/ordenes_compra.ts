/**
 * 📦 ÓRDENES DE COMPRA - Funciones Convex
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ===== QUERIES =====

export const list = query({
  args: {
    limit: v.optional(v.number()),
    estado: v.optional(v.union(v.literal("pendiente"), v.literal("parcial"), v.literal("pagado"))),
  },
  handler: async (ctx, args) => {
    let ordenes = await ctx.db.query("ordenes_compra").order("desc").collect();
    
    if (args.estado) {
      ordenes = ordenes.filter(o => o.estado === args.estado);
    }
    
    return args.limit ? ordenes.slice(0, args.limit) : ordenes;
  },
});

export const getById = query({
  args: { ordenId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ordenes_compra")
      .withIndex("by_ordenId", (q) => q.eq("ordenId", args.ordenId))
      .first();
  },
});

export const getStock = query({
  args: {},
  handler: async (ctx) => {
    const ordenes = await ctx.db.query("ordenes_compra").collect();
    
    return {
      stockTotal: ordenes.reduce((sum, o) => sum + o.stockActual, 0),
      stockInicial: ordenes.reduce((sum, o) => sum + o.stockInicial, 0),
      ordenesActivas: ordenes.filter(o => o.stockActual > 0).length,
      deudaTotal: ordenes.reduce((sum, o) => sum + o.deuda, 0),
    };
  },
});

// ===== MUTATIONS =====

export const create = mutation({
  args: {
    ordenId: v.string(),
    fecha: v.string(),
    distribuidorId: v.optional(v.id("distribuidores")),
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
    estado: v.union(v.literal("pendiente"), v.literal("parcial"), v.literal("pagado")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ordenes_compra", args);
  },
});

export const descontarStock = mutation({
  args: {
    ordenId: v.string(),
    cantidad: v.number(),
  },
  handler: async (ctx, args) => {
    const orden = await ctx.db
      .query("ordenes_compra")
      .withIndex("by_ordenId", (q) => q.eq("ordenId", args.ordenId))
      .first();

    if (!orden) {
      throw new Error(`Orden ${args.ordenId} no encontrada`);
    }

    if (orden.stockActual < args.cantidad) {
      throw new Error(`Stock insuficiente. Disponible: ${orden.stockActual}`);
    }

    await ctx.db.patch(orden._id, {
      stockActual: orden.stockActual - args.cantidad,
    });

    return { success: true, stockRestante: orden.stockActual - args.cantidad };
  },
});

export const registrarPago = mutation({
  args: {
    ordenId: v.string(),
    monto: v.number(),
  },
  handler: async (ctx, args) => {
    const orden = await ctx.db
      .query("ordenes_compra")
      .withIndex("by_ordenId", (q) => q.eq("ordenId", args.ordenId))
      .first();

    if (!orden) {
      throw new Error(`Orden ${args.ordenId} no encontrada`);
    }

    const nuevoPago = orden.pagoDistribuidor + args.monto;
    const nuevaDeuda = Math.max(0, orden.costoTotal - nuevoPago);
    const nuevoEstado = nuevaDeuda <= 0 ? "pagado" : nuevoPago > 0 ? "parcial" : "pendiente";

    await ctx.db.patch(orden._id, {
      pagoDistribuidor: nuevoPago,
      deuda: nuevaDeuda,
      estado: nuevoEstado,
    });

    return { success: true, nuevoEstado, deudaRestante: nuevaDeuda };
  },
});

export const generateOrdenId = query({
  args: {},
  handler: async (ctx) => {
    const ordenes = await ctx.db.query("ordenes_compra").collect();
    const maxNum = ordenes.reduce((max, o) => {
      const num = parseInt(o.ordenId.replace("OC", ""), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `OC${String(maxNum + 1).padStart(4, "0")}`;
  },
});
