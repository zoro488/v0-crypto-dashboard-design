/**
 * 👥 CLIENTES - Funciones Convex
 * 
 * Gestión de clientes con búsqueda full-text y consultas reactivas.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ===== QUERIES =====

export const list = query({
  args: {
    limit: v.optional(v.number()),
    estado: v.optional(v.union(v.literal("activo"), v.literal("inactivo"))),
  },
  handler: async (ctx, args) => {
    const clientes = await ctx.db.query("clientes").collect();
    
    let filtered = clientes;
    if (args.estado) {
      filtered = clientes.filter(c => c.estado === args.estado);
    }
    
    return args.limit ? filtered.slice(0, args.limit) : filtered;
  },
});

export const getById = query({
  args: { id: v.id("clientes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (args.query.length < 2) return [];
    
    return await ctx.db
      .query("clientes")
      .withSearchIndex("search_nombre", (q) => q.search("nombre", args.query))
      .take(20);
  },
});

export const getDeudores = query({
  args: {},
  handler: async (ctx) => {
    const clientes = await ctx.db.query("clientes").collect();
    return clientes
      .filter(c => c.pendiente > 0)
      .sort((a, b) => b.pendiente - a.pendiente);
  },
});

export const getTotales = query({
  args: {},
  handler: async (ctx) => {
    const clientes = await ctx.db.query("clientes").collect();
    
    return {
      totalClientes: clientes.length,
      clientesActivos: clientes.filter(c => c.estado === "activo").length,
      deudaTotal: clientes.reduce((sum, c) => sum + c.pendiente, 0),
      abonosTotal: clientes.reduce((sum, c) => sum + c.abonos, 0),
      actualTotal: clientes.reduce((sum, c) => sum + c.actual, 0),
    };
  },
});

// ===== MUTATIONS =====

export const create = mutation({
  args: {
    nombre: v.string(),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
    direccion: v.optional(v.string()),
    actual: v.number(),
    deuda: v.number(),
    abonos: v.number(),
    pendiente: v.number(),
    estado: v.union(v.literal("activo"), v.literal("inactivo")),
  },
  handler: async (ctx, args) => {
    // Generar keywords para búsqueda
    const keywords = args.nombre
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 1);

    return await ctx.db.insert("clientes", {
      ...args,
      keywords,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("clientes"),
    nombre: v.optional(v.string()),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
    direccion: v.optional(v.string()),
    actual: v.optional(v.number()),
    deuda: v.optional(v.number()),
    abonos: v.optional(v.number()),
    pendiente: v.optional(v.number()),
    estado: v.optional(v.union(v.literal("activo"), v.literal("inactivo"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    // Actualizar keywords si cambió el nombre
    if (cleanUpdates.nombre) {
      const keywords = (cleanUpdates.nombre as string)
        .toLowerCase()
        .split(/\s+/)
        .filter((w: string) => w.length > 1);
      (cleanUpdates as Record<string, unknown>).keywords = keywords;
    }
    
    await ctx.db.patch(id, cleanUpdates);
  },
});

export const registrarAbono = mutation({
  args: {
    id: v.id("clientes"),
    monto: v.number(),
  },
  handler: async (ctx, args) => {
    const cliente = await ctx.db.get(args.id);
    if (!cliente) {
      throw new Error("Cliente no encontrado");
    }

    await ctx.db.patch(args.id, {
      abonos: cliente.abonos + args.monto,
      pendiente: Math.max(0, cliente.pendiente - args.monto),
    });

    return { 
      success: true, 
      nuevoAbono: cliente.abonos + args.monto,
      nuevoPendiente: Math.max(0, cliente.pendiente - args.monto),
    };
  },
});

export const registrarDeuda = mutation({
  args: {
    id: v.id("clientes"),
    monto: v.number(),
  },
  handler: async (ctx, args) => {
    const cliente = await ctx.db.get(args.id);
    if (!cliente) {
      throw new Error("Cliente no encontrado");
    }

    await ctx.db.patch(args.id, {
      deuda: cliente.deuda + args.monto,
      actual: cliente.actual + args.monto,
      pendiente: cliente.pendiente + args.monto,
    });

    return { 
      success: true, 
      nuevaDeuda: cliente.deuda + args.monto,
    };
  },
});
