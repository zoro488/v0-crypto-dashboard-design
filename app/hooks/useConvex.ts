/**
 * 🚀 HOOKS CONVEX - CHRONOS SYSTEM
 * 
 * Hooks optimizados para usar Convex con caché y optimización de renders.
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCallback, useMemo } from "react";
import type { Id } from "../../convex/_generated/dataModel";

// ===== BANCOS HOOKS =====

export function useBancos() {
  const bancos = useQuery(api.bancos.list);
  const capitalTotal = useQuery(api.bancos.getCapitalesTotal);
  
  const bancosMap = useMemo(() => {
    if (!bancos) return {};
    return Object.fromEntries(bancos.map(b => [b.bancoId, b]));
  }, [bancos]);

  return {
    bancos,
    bancosMap,
    capitalTotal,
    loading: bancos === undefined,
  };
}

export function useBanco(bancoId: string) {
  return useQuery(api.bancos.getByBancoId, { bancoId });
}

export function useBancoMutations() {
  const updateCapital = useMutation(api.bancos.updateCapital);
  const registrarMovimiento = useMutation(api.bancos.registrarMovimiento);

  return { updateCapital, registrarMovimiento };
}

// ===== VENTAS HOOKS =====

export function useVentas(options?: { 
  limit?: number; 
  estatus?: "Pagado" | "Pendiente" | "Parcial" 
}) {
  const ventas = useQuery(api.ventas.list, options || {});
  const totales = useQuery(api.ventas.getTotales);

  return {
    ventas,
    totales,
    loading: ventas === undefined,
  };
}

export function useVentaMutations() {
  const create = useMutation(api.ventas.create);
  const registrarPago = useMutation(api.ventas.registrarPago);

  const crearVenta = useCallback(async (data: Parameters<typeof create>[0]) => {
    return await create(data);
  }, [create]);

  return { crearVenta, registrarPago };
}

// ===== CLIENTES HOOKS =====

export function useClientes(options?: { limit?: number; estado?: "activo" | "inactivo" }) {
  const clientes = useQuery(api.clientes.list, options || {});
  const totales = useQuery(api.clientes.getTotales);
  const deudores = useQuery(api.clientes.getDeudores);

  return {
    clientes,
    totales,
    deudores,
    loading: clientes === undefined,
  };
}

export function useClienteSearch(query: string) {
  return useQuery(api.clientes.search, { query });
}

export function useClienteMutations() {
  const create = useMutation(api.clientes.create);
  const update = useMutation(api.clientes.update);
  const registrarAbono = useMutation(api.clientes.registrarAbono);
  const registrarDeuda = useMutation(api.clientes.registrarDeuda);

  return { create, update, registrarAbono, registrarDeuda };
}

// ===== ORDENES DE COMPRA HOOKS =====

export function useOrdenesCompra(options?: { 
  limit?: number; 
  estado?: "pendiente" | "parcial" | "pagado" 
}) {
  const ordenes = useQuery(api.ordenes_compra.list, options || {});
  const stock = useQuery(api.ordenes_compra.getStock);

  return {
    ordenes,
    stock,
    loading: ordenes === undefined,
  };
}

export function useOrdenCompraMutations() {
  const create = useMutation(api.ordenes_compra.create);
  const descontarStock = useMutation(api.ordenes_compra.descontarStock);
  const registrarPago = useMutation(api.ordenes_compra.registrarPago);

  return { create, descontarStock, registrarPago };
}

// ===== MOVIMIENTOS HOOKS =====

export function useMovimientos(options?: { 
  bancoId?: string; 
  tipo?: "ingreso" | "gasto" | "transferencia";
  limit?: number;
}) {
  const movimientos = useQuery(api.movimientos.listMovimientos, options || {});
  const resumen = useQuery(api.movimientos.getResumenMovimientos, { 
    bancoId: options?.bancoId 
  });

  return {
    movimientos,
    resumen,
    loading: movimientos === undefined,
  };
}

export function useGastosAbonos(options?: { tipo?: "gasto" | "abono"; limit?: number }) {
  const items = useQuery(api.movimientos.listGastosAbonos, options || {});
  const resumen = useQuery(api.movimientos.getResumenGastosAbonos);

  return {
    items,
    resumen,
    loading: items === undefined,
  };
}

// ===== CHAT HOOKS =====

export function useChatMessages(userId?: string, limit?: number) {
  return useQuery(api.chat.listMessages, { userId, limit });
}

export function useChatMutations() {
  const addMessage = useMutation(api.chat.addMessage);
  const clearHistory = useMutation(api.chat.clearHistory);

  return { addMessage, clearHistory };
}

// ===== ANALYTICS HOOKS =====

export function useAnalytics(event?: string, since?: number) {
  return useQuery(api.chat.getEventStats, { event, since });
}

export function useTrackEvent() {
  const trackEvent = useMutation(api.chat.trackEvent);
  
  return useCallback(async (
    event: string, 
    properties?: Record<string, unknown>,
    userId?: string
  ) => {
    return await trackEvent({ event, properties, userId });
  }, [trackEvent]);
}

// ===== DASHBOARD COMBINADO =====

export function useDashboardData() {
  const { bancos, capitalTotal, loading: loadingBancos } = useBancos();
  const { ventas, totales: ventasTotales, loading: loadingVentas } = useVentas({ limit: 10 });
  const { clientes, totales: clientesTotales, loading: loadingClientes } = useClientes({ limit: 10 });
  const { stock, loading: loadingStock } = useOrdenesCompra();

  return {
    bancos,
    capitalTotal,
    ventas,
    ventasTotales,
    clientes,
    clientesTotales,
    stock,
    loading: loadingBancos || loadingVentas || loadingClientes || loadingStock,
  };
}
