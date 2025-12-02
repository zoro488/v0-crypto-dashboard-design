/**
 * 💳 VENTAS - Funciones Convex
 * 
 * Operaciones CRUD, distribución automática y consultas reactivas.
 */

import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// ===== QUERIES =====

export const list = query({
  args: {
    limit: v.optional(v.number()),
    estatus: v.optional(v.union(v.literal("Pagado"), v.literal("Pendiente"), v.literal("Parcial"))),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("ventas").order("desc");
    
    if (args.estatus !== undefined) {
      const estatus = args.estatus;
      q = ctx.db.query("ventas")
        .withIndex("by_estatus", (q) => q.eq("estatus", estatus))
        .order("desc");
    }
    
    const ventas = await q.collect();
    return args.limit ? ventas.slice(0, args.limit) : ventas;
  },
});

export const getById = query({
  args: { ventaId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ventas")
      .withIndex("by_ventaId", (q) => q.eq("ventaId", args.ventaId))
      .first();
  },
});

export const getByCliente = query({
  args: { cliente: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ventas")
      .withIndex("by_cliente", (q) => q.eq("cliente", args.cliente))
      .collect();
  },
});

export const getTotales = query({
  args: {},
  handler: async (ctx) => {
    const ventas = await ctx.db.query("ventas").collect();
    
    return {
      totalVentas: ventas.length,
      ingresoTotal: ventas.reduce((sum, v) => sum + v.ingreso, 0),
      utilidadTotal: ventas.reduce((sum, v) => sum + v.utilidad, 0),
      pendienteTotal: ventas.reduce((sum, v) => sum + v.montoRestante, 0),
      pagadoTotal: ventas.reduce((sum, v) => sum + v.montoPagado, 0),
      ventasPagadas: ventas.filter(v => v.estatus === "Pagado").length,
      ventasPendientes: ventas.filter(v => v.estatus === "Pendiente").length,
      ventasParciales: ventas.filter(v => v.estatus === "Parcial").length,
    };
  },
});

// ===== MUTATIONS =====

export const create = mutation({
  args: {
    ventaId: v.string(),
    fecha: v.string(),
    ocRelacionada: v.optional(v.string()),
    clienteId: v.optional(v.id("clientes")),
    cliente: v.string(),
    cantidad: v.number(),
    precioVenta: v.number(),
    precioCompra: v.number(),
    ingreso: v.number(),
    flete: v.union(v.literal("Aplica"), v.literal("NoAplica")),
    fleteUtilidad: v.number(),
    utilidad: v.number(),
    bovedaMonte: v.number(),
    estatus: v.union(v.literal("Pagado"), v.literal("Pendiente"), v.literal("Parcial")),
    montoPagado: v.number(),
    montoRestante: v.number(),
  },
  handler: async (ctx, args) => {
    // Crear la venta
    const ventaId = await ctx.db.insert("ventas", args);

    // Si está pagada, distribuir a bancos
    if (args.estatus === "Pagado" || args.estatus === "Parcial") {
      const proporcion = args.montoPagado / args.ingreso;
      
      // Distribuir a boveda_monte (costo)
      await ctx.scheduler.runAfter(0, internal.ventas.distribuirABanco, {
        bancoId: "boveda_monte",
        monto: args.bovedaMonte * proporcion,
        concepto: `Venta ${args.ventaId} - Costo`,
      });

      // Distribuir a flete_sur (si aplica)
      if (args.flete === "Aplica" && args.fleteUtilidad > 0) {
        await ctx.scheduler.runAfter(0, internal.ventas.distribuirABanco, {
          bancoId: "flete_sur",
          monto: args.fleteUtilidad * proporcion,
          concepto: `Venta ${args.ventaId} - Flete`,
        });
      }

      // Distribuir a utilidades
      await ctx.scheduler.runAfter(0, internal.ventas.distribuirABanco, {
        bancoId: "utilidades",
        monto: args.utilidad * proporcion,
        concepto: `Venta ${args.ventaId} - Utilidad`,
      });
    }

    return ventaId;
  },
});

export const distribuirABanco = internalMutation({
  args: {
    bancoId: v.string(),
    monto: v.number(),
    concepto: v.string(),
  },
  handler: async (ctx, args) => {
    const banco = await ctx.db
      .query("bancos")
      .withIndex("by_bancoId", (q) => q.eq("bancoId", args.bancoId))
      .first();

    if (banco) {
      await ctx.db.patch(banco._id, {
        capitalActual: banco.capitalActual + args.monto,
        historicoIngresos: banco.historicoIngresos + args.monto,
      });

      // Registrar movimiento
      await ctx.db.insert("movimientos", {
        bancoId: args.bancoId,
        tipo: "ingreso",
        fecha: new Date().toISOString().split('T')[0],
        monto: args.monto,
        concepto: args.concepto,
      });
    }
  },
});

export const registrarPago = mutation({
  args: {
    ventaId: v.string(),
    monto: v.number(),
  },
  handler: async (ctx, args) => {
    const venta = await ctx.db
      .query("ventas")
      .withIndex("by_ventaId", (q) => q.eq("ventaId", args.ventaId))
      .first();

    if (!venta) {
      throw new Error(`Venta ${args.ventaId} no encontrada`);
    }

    const nuevoMontoPagado = venta.montoPagado + args.monto;
    const nuevoMontoRestante = venta.ingreso - nuevoMontoPagado;
    const nuevoEstatus = nuevoMontoRestante <= 0 ? "Pagado" : "Parcial";

    await ctx.db.patch(venta._id, {
      montoPagado: nuevoMontoPagado,
      montoRestante: Math.max(0, nuevoMontoRestante),
      estatus: nuevoEstatus,
    });

    // Calcular proporciones y distribuir
    const proporcionNueva = args.monto / venta.ingreso;

    await ctx.scheduler.runAfter(0, internal.ventas.distribuirABanco, {
      bancoId: "boveda_monte",
      monto: venta.bovedaMonte * proporcionNueva,
      concepto: `Pago Venta ${args.ventaId}`,
    });

    if (venta.flete === "Aplica") {
      await ctx.scheduler.runAfter(0, internal.ventas.distribuirABanco, {
        bancoId: "flete_sur",
        monto: venta.fleteUtilidad * proporcionNueva,
        concepto: `Pago Venta ${args.ventaId} - Flete`,
      });
    }

    await ctx.scheduler.runAfter(0, internal.ventas.distribuirABanco, {
      bancoId: "utilidades",
      monto: venta.utilidad * proporcionNueva,
      concepto: `Pago Venta ${args.ventaId} - Utilidad`,
    });

    return { success: true, nuevoEstatus };
  },
});

// Generar nuevo ID de venta
export const generateVentaId = query({
  args: {},
  handler: async (ctx) => {
    const ventas = await ctx.db.query("ventas").collect();
    const maxNum = ventas.reduce((max, v) => {
      const num = parseInt(v.ventaId.replace("VTA", ""), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `VTA${String(maxNum + 1).padStart(5, "0")}`;
  },
});
