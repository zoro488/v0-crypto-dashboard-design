export interface Banco {
  id: string
  nombre: string
  icon: string
  color: string
  tipo: "operativo" | "inversion" | "externo"
  descripcion: string
  // Capital dinámico
  capitalActual: number
  // Históricos fijos (acumulativos)
  historicoIngresos: number
  historicoGastos: number
  historicoTransferencias: number
  estado: "activo" | "negativo"
  operaciones?: Operacion[]
  createdAt: any
  updatedAt: any
}

export interface OrdenCompra {
  id: string
  fecha: string
  origen: string
  distribuidor: string
  producto: string
  cantidad: number
  costoDistribuidor: number // Precio al que compramos
  costoTransporte: number
  costoPorUnidad: number // costoDistribuidor + costoTransporte
  costoTotal: number // costoPorUnidad × cantidad
  pagoDistribuidor: number // Monto pagado al distribuidor
  deuda: number // costoTotal - pagoDistribuidor
  estado: "pendiente" | "parcial" | "pagado"
  bancoOrigen?: string // Banco desde el que se pagó (si aplica)
  createdAt: any
  updatedAt: any
}

export interface Venta {
  id: string
  fecha: string
  cliente: string
  producto: string
  cantidad: number
  precioVentaUnidad: number // Precio al que vendemos
  precioCompraUnidad: number // Costo unitario del producto
  precioFlete: number // Flete por unidad (default 500)
  precioTotalUnidad: number // precioVentaUnidad + precioFlete
  precioTotalVenta: number // precioTotalUnidad × cantidad
  // Distribución en 3 bancos
  distribucionBancos: {
    bovedaMonte: number // precioCompraUnidad × cantidad
    fletes: number // precioFlete × cantidad
    utilidades: number // (precioVentaUnidad - precioCompraUnidad - precioFlete) × cantidad
  }
  montoPagado: number
  montoRestante: number
  estadoPago: "completo" | "parcial" | "pendiente"
  createdAt: any
  updatedAt: any
}

export interface Distribuidor {
  id: string
  nombre: string
  deudaTotal: number
  totalOrdenesCompra: number
  totalPagado: number
  ordenesCompra: string[] // IDs de órdenes de compra
  historialPagos: HistorialPago[]
  createdAt: any
  updatedAt: any
}

export interface Cliente {
  id: string
  nombre: string
  deudaTotal: number
  totalVentas: number
  totalPagado: number
  ventas: string[] // IDs de ventas
  historialPagos: HistorialPago[]
  createdAt: any
  updatedAt: any
}

export interface HistorialPago {
  fecha: any
  monto: number
  bancoOrigen?: string
  ordenCompraId?: string
  ventaId?: string
}

export interface Producto {
  id: string
  nombre: string
  origen: string
  stockActual: number // Dinámico: totalEntradas - totalSalidas
  totalEntradas: number // Acumulativo fijo
  totalSalidas: number // Acumulativo fijo
  valorUnitario: number
  entradas: MovimientoAlmacen[]
  salidas: MovimientoAlmacen[]
  createdAt: any
  updatedAt: any
}

export interface MovimientoAlmacen {
  id: string
  tipo: "entrada" | "salida"
  fecha: any
  cantidad: number
  origen?: string // Distribuidor (para entradas)
  destino?: string // Cliente (para salidas)
}

export interface Operacion {
  id: string
  tipo: "ingreso" | "gasto" | "transferencia_entrada" | "transferencia_salida"
  fecha: any
  monto: number
  concepto: string
  referencia?: string
  bancoRelacionado?: string
}

export interface IngresosBanco {
  id: string
  tipo: string
  fecha: string
  monto: number
  origen: string
  concepto: string
  referencia?: string
  createdAt: any
}

export interface GastosBanco {
  id: string
  tipo: string
  fecha: string
  monto: number
  destino: string
  concepto: string
  referencia?: string
  createdAt: any
}

export interface Transferencia {
  id: string
  fecha: string
  tipo: "entrada" | "salida"
  monto: number
  bancoOrigen: string
  bancoDestino: string
  concepto: string
  referencia?: string
  estado: "completada" | "pendiente"
  createdAt: any
}

export interface CorteBanco {
  id: string
  bancoId: string
  periodo: "diario" | "semanal" | "mensual" | "trimestral" | "anual"
  fechaInicio: string
  fechaFin: string
  capitalInicial: number
  totalIngresosPeriodo: number
  totalGastosPeriodo: number
  capitalFinal: number
  diferencia: number
  variacionPorcentaje: number
  estado: "positivo" | "negativo" | "neutro"
  createdAt: any
}
