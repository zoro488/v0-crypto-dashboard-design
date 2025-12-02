/**
 * 📊 MOVIMIENTOS & GASTOS/ABONOS - Funciones Convex
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ===== MOVIMIENTOS QUERIES =====

export const listMovimientos = query({
  args: {
    bancoId: v.optional(v.string()),
    tipo: v.optional(v.union(v.literal("ingreso"), v.literal("gasto"), v.literal("transferencia"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let movimientos = await ctx.db.query("movimientos").order("desc").collect();
    
    if (args.bancoId) {
      movimientos = movimientos.filter(m => m.bancoId === args.bancoId);
    }
    
    if (args.tipo) {
      movimientos = movimientos.filter(m => m.tipo === args.tipo);
    }
    
    return args.limit ? movimientos.slice(0, args.limit) : movimientos;
  },
});

export const getMovimientosByBanco = query({
  args: { bancoId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("movimientos")
      .withIndex("by_bancoId", (q) => q.eq("bancoId", args.bancoId))
      .order("desc")
      .collect();
  },
});

export const getResumenMovimientos = query({
  args: { bancoId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let movimientos = await ctx.db.query("movimientos").collect();
    
    if (args.bancoId) {
      movimientos = movimientos.filter(m => m.bancoId === args.bancoId);
    }

    const ingresos = movimientos.filter(m => m.tipo === "ingreso");
    const gastos = movimientos.filter(m => m.tipo === "gasto");

    return {
      totalMovimientos: movimientos.length,
      totalIngresos: ingresos.reduce((sum, m) => sum + m.monto, 0),
      totalGastos: gastos.reduce((sum, m) => sum + m.monto, 0),
      cantidadIngresos: ingresos.length,
      cantidadGastos: gastos.length,
    };
  },
});

// ===== MOVIMIENTOS MUTATIONS =====

export const createMovimiento = mutation({
  args: {
    bancoId: v.string(),
    tipo: v.union(v.literal("ingreso"), v.literal("gasto"), v.literal("transferencia")),
    fecha: v.string(),
    monto: v.number(),
    concepto: v.string(),
    cliente: v.optional(v.string()),
    origen: v.optional(v.string()),
    destino: v.optional(v.string()),
    referenciaId: v.optional(v.string()),
    referenciaTipo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("movimientos", args);
  },
});

// ===== GASTOS/ABONOS QUERIES =====

export const listGastosAbonos = query({
  args: {
    tipo: v.optional(v.union(v.literal("gasto"), v.literal("abono"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("gastos_abonos").order("desc").collect();
    
    if (args.tipo) {
      items = items.filter(i => i.tipo === args.tipo);
    }
    
    return args.limit ? items.slice(0, args.limit) : items;
  },
});

export const getResumenGastosAbonos = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("gastos_abonos").collect();
    
    const gastos = items.filter(i => i.tipo === "gasto");
    const abonos = items.filter(i => i.tipo === "abono");

    return {
      totalGastos: gastos.reduce((sum, g) => sum + g.monto, 0),
      totalAbonos: abonos.reduce((sum, a) => sum + a.monto, 0),
      cantidadGastos: gastos.length,
      cantidadAbonos: abonos.length,
    };
  },
});

// ===== GASTOS/ABONOS MUTATIONS =====

export const createGastoAbono = mutation({
  args: {
    fecha: v.string(),
    tipo: v.union(v.literal("gasto"), v.literal("abono")),
    origen: v.string(),
    monto: v.number(),
    destino: v.string(),
    bancoId: v.optional(v.string()),
    concepto: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("gastos_abonos", args);
  },
});
