/**
 * 🏦 BANCOS - Funciones Convex
 * 
 * Operaciones CRUD y consultas para bancos/bóvedas.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ===== QUERIES =====

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bancos").collect();
  },
});

export const getByBancoId = query({
  args: { bancoId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bancos")
      .withIndex("by_bancoId", (q) => q.eq("bancoId", args.bancoId))
      .first();
  },
});

export const getCapitalesTotal = query({
  args: {},
  handler: async (ctx) => {
    const bancos = await ctx.db.query("bancos").collect();
    return bancos.reduce((total, banco) => total + banco.capitalActual, 0);
  },
});

// ===== MUTATIONS =====

export const create = mutation({
  args: {
    bancoId: v.string(),
    nombre: v.string(),
    icon: v.string(),
    color: v.string(),
    tipo: v.union(v.literal("boveda"), v.literal("operativo"), v.literal("gastos"), v.literal("utilidades")),
    moneda: v.union(v.literal("MXN"), v.literal("USD")),
    capitalActual: v.number(),
    capitalInicial: v.number(),
    historicoIngresos: v.number(),
    historicoGastos: v.number(),
    estado: v.union(v.literal("activo"), v.literal("inactivo")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bancos", args);
  },
});

export const updateCapital = mutation({
  args: {
    id: v.id("bancos"),
    capitalActual: v.number(),
    historicoIngresos: v.optional(v.number()),
    historicoGastos: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, cleanUpdates);
  },
});

export const registrarMovimiento = mutation({
  args: {
    bancoId: v.string(),
    tipo: v.union(v.literal("ingreso"), v.literal("gasto")),
    monto: v.number(),
  },
  handler: async (ctx, args) => {
    const banco = await ctx.db
      .query("bancos")
      .withIndex("by_bancoId", (q) => q.eq("bancoId", args.bancoId))
      .first();

    if (!banco) {
      throw new Error(`Banco ${args.bancoId} no encontrado`);
    }

    const nuevoCapital = args.tipo === "ingreso"
      ? banco.capitalActual + args.monto
      : banco.capitalActual - args.monto;

    const updates: Record<string, number> = { capitalActual: nuevoCapital };
    
    if (args.tipo === "ingreso") {
      updates.historicoIngresos = banco.historicoIngresos + args.monto;
    } else {
      updates.historicoGastos = banco.historicoGastos + args.monto;
    }

    await ctx.db.patch(banco._id, updates);
    return { success: true, nuevoCapital };
  },
});
