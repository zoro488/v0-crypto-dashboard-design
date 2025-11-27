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
  tipo: "compra" | "ajuste" | "devolucion"
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
  tipo: "venta" | "ajuste" | "merma"
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
  tipo: "entrada" | "salida" | "ajuste"
  productoId: string
  productoNombre: string
  cantidadAnterior: number
  cantidadNueva: number
  diferencia: number
  motivo: string
  usuario: string
}

// Datos iniciales basados en datos_mapeados.json
export const productosAlmacen: ProductoAlmacen[] = [
  {
    id: "PROD-001",
    codigo: "CARNE-001",
    nombre: "Carne de Res Premium",
    categoria: "Carnes",
    precioCompra: 6100,
    precioVenta: 6300,
    stockActual: 423,
    unidad: "kg",
  },
  {
    id: "PROD-002",
    codigo: "CARNE-002",
    nombre: "Carne de Cerdo",
    categoria: "Carnes",
    precioCompra: 5800,
    precioVenta: 6000,
    stockActual: 250,
    unidad: "kg",
  },
  {
    id: "PROD-003",
    codigo: "POLLO-001",
    nombre: "Pollo Entero",
    categoria: "Aves",
    precioCompra: 4200,
    precioVenta: 4500,
    stockActual: 180,
    unidad: "kg",
  },
]

// Entradas desde OC0001
export const entradasAlmacen: EntradaAlmacen[] = [
  {
    id: "ENT-001",
    fecha: "2025-08-25",
    tipo: "compra",
    ordenCompraId: "OC0001",
    distribuidor: "Q-MAYA",
    productoId: "PROD-001",
    productoNombre: "Carne de Res Premium",
    cantidad: 423,
    precioUnitario: 6300,
    total: 2664900,
    observaciones: "Orden de compra Q-MAYA",
  },
  {
    id: "ENT-002",
    fecha: "2025-08-25",
    tipo: "compra",
    ordenCompraId: "OC0002",
    distribuidor: "Q-MAYA",
    productoId: "PROD-001",
    productoNombre: "Carne de Res Premium",
    cantidad: 32,
    precioUnitario: 6300,
    total: 201600,
    observaciones: "Orden de compra Q-MAYA",
  },
]

// Salidas desde Ventas
export const salidasAlmacen: SalidaAlmacen[] = [
  {
    id: "SAL-001",
    fecha: "2025-08-23",
    tipo: "venta",
    ventaId: "VENTA-2025-08-23-Bódega M-P-1",
    cliente: "Bódega M-P",
    productoId: "PROD-001",
    productoNombre: "Carne de Res Premium",
    cantidad: 150,
    precioVenta: 6300,
    total: 945000,
    observaciones: "Venta a Bódega M-P",
  },
  {
    id: "SAL-002",
    fecha: "2025-08-23",
    tipo: "venta",
    ventaId: "VENTA-2025-08-23-Valle-2",
    cliente: "Valle",
    productoId: "PROD-001",
    productoNombre: "Carne de Res Premium",
    cantidad: 60,
    precioVenta: 6300,
    total: 378000,
    observaciones: "Venta a Valle",
  },
]

export const modificacionesAlmacen: ModificacionAlmacen[] = [
  {
    id: "MOD-001",
    fecha: "2025-08-25",
    tipo: "entrada",
    productoId: "PROD-001",
    productoNombre: "Carne de Res Premium",
    cantidadAnterior: 0,
    cantidadNueva: 423,
    diferencia: 423,
    motivo: "Entrada por OC0001",
    usuario: "Sistema",
  },
]
