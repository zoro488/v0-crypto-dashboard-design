/**
 * Tipos de datos para el almacén
 * Los datos reales se cargan desde Firestore
 */

export interface ProductoAlmacen {
  id: string
  codigo: string
  nombre: string
  categoria: string
  precioCompra: number
  precioVenta: number
  stockActual: number
  unidad: string
}

export interface EntradaAlmacen {
  id: string
  fecha: string
  tipo: 'compra' | 'ajuste' | 'devolucion'
  ordenCompraId?: string
  distribuidor?: string
  productoId: string
  productoNombre: string
  cantidad: number
  precioUnitario: number
  total: number
  observaciones?: string
}

export interface SalidaAlmacen {
  id: string
  fecha: string
  tipo: 'venta' | 'ajuste' | 'merma'
  ventaId?: string
  cliente?: string
  productoId: string
  productoNombre: string
  cantidad: number
  precioVenta: number
  total: number
  observaciones?: string
}

export interface ModificacionAlmacen {
  id: string
  fecha: string
  tipo: 'entrada' | 'salida' | 'ajuste'
  productoId: string
  productoNombre: string
  cantidadAnterior: number
  cantidadNueva: number
  diferencia: number
  motivo: string
  usuario: string
}

// Arrays vacíos - los datos reales vienen de Firestore
export const productosAlmacen: ProductoAlmacen[] = []
export const entradasAlmacen: EntradaAlmacen[] = []
export const salidasAlmacen: SalidaAlmacen[] = []
export const modificacionesAlmacen: ModificacionAlmacen[] = []
