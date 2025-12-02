/**
 * ====================================================================
 * HOOK PARA DATOS DEL WIDGET AI
 * ====================================================================
 * 
 * Este hook proporciona datos agregados de Firestore para los widgets AI.
 * Combina datos de múltiples colecciones en un formato optimizado para
 * respuestas del asistente AI.
 * 
 * NO usar este hook para lógica de negocio - solo para visualización AI.
 * 
 * @author Chronos System
 * @version 1.0
 */

import { useMemo } from 'react'
import { useFirestoreCRUD } from './useFirestoreCRUD'
import type { 
  Venta, 
  Cliente, 
  Distribuidor,
} from '@/app/types'
import type { BancoUIState } from '@/app/lib/store/useAppStore'
// BancoId se usa implícitamente a través de BancoUIState

/**
 * Producto simplificado para el widget AI
 */
interface ProductoAI {
  nombre: string
  stockActual: number
  valorUnitario: number
}

/**
 * Datos agregados para respuestas del AI
 */
export interface AIWidgetData {
  // Ventas
  ventas: Venta[]
  totalVentas: number
  ventasHoy: Venta[]
  totalVentasHoy: number
  
  // Clientes
  clientes: Cliente[]
  totalClientes: number
  deudaTotalClientes: number
  clientesConDeuda: Cliente[]
  
  // Distribuidores
  distribuidores: Distribuidor[]
  totalDistribuidores: number
  deudaTotalDistribuidores: number
  
  // Productos
  productos: ProductoAI[]
  productosStockBajo: ProductoAI[]
  valorTotalInventario: number
  
  // Estado
  loading: boolean
  error: string | null
}

/**
 * Hook para obtener datos agregados de Firestore para widgets AI
 * Usa múltiples colecciones y calcula métricas en tiempo real
 * @param _bancos - Bancos del UI state (reservado para futuro uso de capital)
 */
export function useAIWidgetData(_bancos?: BancoUIState[]): AIWidgetData {
  // Obtener datos de Firestore
  const { data: ventasRaw, loading: loadingVentas } = useFirestoreCRUD<Venta>('ventas')
  const { data: clientesRaw, loading: loadingClientes } = useFirestoreCRUD<Cliente>('clientes')
  const { data: distribuidoresRaw, loading: loadingDist } = useFirestoreCRUD<Distribuidor>('distribuidores')
  
  // Obtener productos del almacén
  const { data: almacenRaw, loading: loadingAlmacen } = useFirestoreCRUD<{
    id: string
    nombre: string
    stock_actual: number
    valor_unitario: number
  }>('almacen')
  
  // Convertir datos de almacén a formato ProductoAI
  const productos = useMemo((): ProductoAI[] => {
    if (!almacenRaw) return []
    return almacenRaw.map(p => ({
      nombre: p.nombre,
      stockActual: p.stock_actual ?? 0,
      valorUnitario: p.valor_unitario ?? 0,
    }))
  }, [almacenRaw])
  
  // Ventas de hoy
  const ventasHoy = useMemo(() => {
    if (!ventasRaw) return []
    const hoy = new Date().toDateString()
    return ventasRaw.filter(v => {
      try {
        // Manejar diferentes formatos de fecha
        const fechaStr = typeof v.fecha === 'string' ? v.fecha : 
                        v.fecha instanceof Date ? v.fecha.toISOString() :
                        String(v.fecha)
        const fechaVenta = new Date(fechaStr)
        return !isNaN(fechaVenta.getTime()) && fechaVenta.toDateString() === hoy
      } catch {
        return false
      }
    })
  }, [ventasRaw])
  
  // Cálculos de totales
  const totalVentas = useMemo(() => 
    ventasRaw?.reduce((sum, v) => sum + (v.precioTotalVenta || 0), 0) ?? 0
  , [ventasRaw])
  
  const totalVentasHoy = useMemo(() => 
    ventasHoy.reduce((sum, v) => sum + (v.precioTotalVenta || 0), 0)
  , [ventasHoy])
  
  // Clientes con deuda
  const clientesConDeuda = useMemo(() => 
    clientesRaw?.filter(c => (c.deudaTotal || c.pendiente || 0) > 0) ?? []
  , [clientesRaw])
  
  const deudaTotalClientes = useMemo(() => 
    clientesRaw?.reduce((sum, c) => sum + (c.deudaTotal || c.pendiente || 0), 0) ?? 0
  , [clientesRaw])
  
  // Deuda distribuidores
  const deudaTotalDistribuidores = useMemo(() => 
    distribuidoresRaw?.reduce((sum, d) => sum + (d.deudaTotal || 0), 0) ?? 0
  , [distribuidoresRaw])
  
  // Productos con stock bajo
  const productosStockBajo = useMemo(() => 
    productos.filter(p => p.stockActual < 10)
  , [productos])
  
  // Valor total inventario
  const valorTotalInventario = useMemo(() => 
    productos.reduce((sum, p) => sum + (p.stockActual * p.valorUnitario), 0)
  , [productos])
  
  // Estado de carga y errores
  const loading = loadingVentas || loadingClientes || loadingDist || loadingAlmacen
  
  return {
    // Ventas
    ventas: ventasRaw ?? [],
    totalVentas,
    ventasHoy,
    totalVentasHoy,
    
    // Clientes
    clientes: clientesRaw ?? [],
    totalClientes: clientesRaw?.length ?? 0,
    deudaTotalClientes,
    clientesConDeuda,
    
    // Distribuidores
    distribuidores: distribuidoresRaw ?? [],
    totalDistribuidores: distribuidoresRaw?.length ?? 0,
    deudaTotalDistribuidores,
    
    // Productos
    productos,
    productosStockBajo,
    valorTotalInventario,
    
    // Estado
    loading,
    error: null,
  }
}

/**
 * Genera una respuesta de AI basada en el mensaje y los datos
 */
export function generateAIResponse(
  message: string,
  data: AIWidgetData,
  bancos: BancoUIState[],
): { text: string; suggestions: string[] } {
  const lowerMessage = message.toLowerCase()
  
  // Análisis de ventas
  if (lowerMessage.includes('venta') || lowerMessage.includes('ventas')) {
    return {
      text: `📊 Resumen de ventas:\n\n• Total histórico: $${data.totalVentas.toLocaleString()}\n• Ventas hoy: ${data.ventasHoy.length} operaciones\n• Total hoy: $${data.totalVentasHoy.toLocaleString()}\n• Ticket promedio: $${data.ventasHoy.length > 0 ? (data.totalVentasHoy / data.ventasHoy.length).toLocaleString() : 0}`,
      suggestions: ['Top clientes', 'Productos más vendidos', 'Comparar con ayer'],
    }
  }
  
  // Stock e inventario
  if (lowerMessage.includes('stock') || lowerMessage.includes('inventario') || lowerMessage.includes('producto')) {
    return {
      text: `📦 Estado del inventario:\n\n• Total productos: ${data.productos.length}\n• Valor total: $${data.valorTotalInventario.toLocaleString()}\n• Productos con stock bajo (<10): ${data.productosStockBajo.length}\n${data.productosStockBajo.length > 0 ? `\n⚠️ Reabastecer: ${data.productosStockBajo.map(p => p.nombre).slice(0, 5).join(', ')}${data.productosStockBajo.length > 5 ? '...' : ''}` : ''}`,
      suggestions: ['Ver detalle productos', 'Crear orden de compra', 'Historial de movimientos'],
    }
  }
  
  // Bancos y finanzas
  if (lowerMessage.includes('banco') || lowerMessage.includes('capital') || lowerMessage.includes('finanz') || lowerMessage.includes('saldo')) {
    const totalCapital = bancos.reduce((sum, b) => sum + b.saldo, 0)
    const bancosResumen = bancos.map(b => `• ${b.nombre}: $${b.saldo.toLocaleString()}`).join('\n')
    
    return {
      text: `🏦 Estado financiero:\n\n${bancosResumen}\n\n💰 Capital total: $${totalCapital.toLocaleString()}`,
      suggestions: ['Hacer transferencia', 'Ver movimientos', 'Registrar gasto'],
    }
  }
  
  // Clientes
  if (lowerMessage.includes('cliente')) {
    return {
      text: `👥 Resumen de clientes:\n\n• Total clientes: ${data.totalClientes}\n• Clientes con deuda: ${data.clientesConDeuda.length}\n• Deuda total por cobrar: $${data.deudaTotalClientes.toLocaleString()}`,
      suggestions: ['Ver clientes morosos', 'Registrar abono', 'Nuevo cliente'],
    }
  }
  
  // Distribuidores
  if (lowerMessage.includes('distribuidor') || lowerMessage.includes('proveedor')) {
    return {
      text: `🚚 Resumen de distribuidores:\n\n• Total distribuidores: ${data.totalDistribuidores}\n• Deuda total a pagar: $${data.deudaTotalDistribuidores.toLocaleString()}`,
      suggestions: ['Ver órdenes pendientes', 'Registrar pago', 'Nueva orden de compra'],
    }
  }
  
  // Saludo o inicio
  if (lowerMessage.includes('hola') || lowerMessage.includes('inicio') || lowerMessage.includes('ayuda')) {
    return {
      text: '¡Hola! 👋 Soy Chronos, tu asistente de IA. Puedo ayudarte con:\n\n• 📊 Análisis de ventas\n• 📦 Estado del inventario\n• 🏦 Resumen financiero\n• 👥 Gestión de clientes\n• 🚚 Control de distribuidores\n\n¿Qué te gustaría consultar?',
      suggestions: ['Resumen del día', 'Ventas de hoy', 'Estado de bancos'],
    }
  }
  
  // Resumen general
  if (lowerMessage.includes('resumen') || lowerMessage.includes('general') || lowerMessage.includes('dashboard')) {
    const totalCapital = bancos.reduce((sum, b) => sum + b.saldo, 0)
    
    return {
      text: `📈 Resumen General del Sistema:\n\n💰 Capital disponible: $${totalCapital.toLocaleString()}\n📊 Ventas totales: $${data.totalVentas.toLocaleString()}\n💳 Por cobrar: $${data.deudaTotalClientes.toLocaleString()}\n📦 Productos en stock: ${data.productos.length}\n👥 Clientes activos: ${data.totalClientes}`,
      suggestions: ['Ver detalles', 'Exportar reporte', 'Análisis profundo'],
    }
  }
  
  // Respuesta por defecto
  return {
    text: 'Entiendo tu consulta. Para darte información más precisa, puedes preguntarme sobre:\n\n• Ventas y facturación\n• Inventario y productos\n• Estado de bancos\n• Clientes y cobranza\n• Distribuidores y pagos',
    suggestions: ['Ver ventas', 'Estado financiero', 'Revisar inventario'],
  }
}
