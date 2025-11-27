/**
 * Validators - Esquemas de validación con Zod
 * Validaciones para todos los formularios y datos del sistema
 */

import { z } from 'zod';

// ==========================================
// VALIDACIONES BASE
// ==========================================

// Validación de teléfono mexicano
export const telefonoSchema = z.string()
  .regex(/^(\+52)?[1-9]\d{9}$/, 'Teléfono inválido (10 dígitos)')
  .or(z.literal(''));

// Validación de email
export const emailSchema = z.string()
  .email('Email inválido')
  .or(z.literal(''));

// Validación de monto positivo
export const montoPositivoSchema = z.number()
  .min(0, 'El monto debe ser mayor o igual a 0')
  .finite('Monto inválido');

// Validación de cantidad entera positiva
export const cantidadSchema = z.number()
  .int('La cantidad debe ser un número entero')
  .min(1, 'La cantidad debe ser al menos 1');

// Validación de fecha
export const fechaSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
  .or(z.date());

// Validación de ID
export const idSchema = z.string()
  .min(1, 'ID requerido')
  .max(100, 'ID demasiado largo');

// Validación de nombre
export const nombreSchema = z.string()
  .min(2, 'Nombre demasiado corto (mínimo 2 caracteres)')
  .max(100, 'Nombre demasiado largo (máximo 100 caracteres)')
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\.]+$/, 'Nombre contiene caracteres inválidos');

// ==========================================
// ESQUEMAS DE VENTA
// ==========================================

export const ventaSchema = z.object({
  fecha: fechaSchema,
  clienteId: idSchema.optional(),
  cliente: nombreSchema,
  producto: z.string().min(1, 'Producto requerido'),
  cantidad: cantidadSchema,
  precioVentaUnidad: montoPositivoSchema.min(0.01, 'Precio de venta debe ser mayor a 0'),
  precioCompraUnidad: montoPositivoSchema,
  precioFlete: montoPositivoSchema,
  montoPagado: montoPositivoSchema.optional().default(0),
}).refine(
  (data) => data.precioVentaUnidad >= data.precioCompraUnidad,
  {
    message: 'El precio de venta debe ser mayor o igual al precio de compra',
    path: ['precioVentaUnidad'],
  }
);

export type VentaInput = z.infer<typeof ventaSchema>;

// Esquema para abono de cliente
export const abonoClienteSchema = z.object({
  clienteId: idSchema,
  monto: montoPositivoSchema.min(0.01, 'El monto debe ser mayor a 0'),
  metodoPago: z.enum(['efectivo', 'transferencia', 'cheque']).optional(),
  referencia: z.string().max(50).optional(),
});

export type AbonoClienteInput = z.infer<typeof abonoClienteSchema>;

// ==========================================
// ESQUEMAS DE ORDEN DE COMPRA
// ==========================================

export const ordenCompraSchema = z.object({
  fecha: fechaSchema,
  distribuidorId: idSchema.optional(),
  distribuidor: nombreSchema,
  origen: z.string().min(1, 'Origen requerido'),
  producto: z.string().min(1, 'Producto requerido'),
  cantidad: cantidadSchema,
  costoDistribuidor: montoPositivoSchema.min(0.01, 'Costo debe ser mayor a 0'),
  costoTransporte: montoPositivoSchema.default(0),
  pagoInicial: montoPositivoSchema.optional().default(0),
}).refine(
  (data) => {
    const total = (data.costoDistribuidor * data.cantidad) + data.costoTransporte;
    return (data.pagoInicial || 0) <= total;
  },
  {
    message: 'El pago inicial no puede ser mayor al costo total',
    path: ['pagoInicial'],
  }
);

export type OrdenCompraInput = z.infer<typeof ordenCompraSchema>;

// Esquema para abono a distribuidor
export const abonoDistribuidorSchema = z.object({
  distribuidorId: idSchema,
  monto: montoPositivoSchema.min(0.01, 'El monto debe ser mayor a 0'),
  bancoOrigen: idSchema,
});

export type AbonoDistribuidorInput = z.infer<typeof abonoDistribuidorSchema>;

// ==========================================
// ESQUEMAS DE CLIENTE
// ==========================================

export const clienteSchema = z.object({
  nombre: nombreSchema,
  telefono: telefonoSchema.optional().default(''),
  email: emailSchema.optional().default(''),
  direccion: z.string().max(200).optional(),
  notas: z.string().max(500).optional(),
  limiteCredito: montoPositivoSchema.optional(),
  estado: z.enum(['activo', 'inactivo', 'suspendido']).default('activo'),
});

export type ClienteInput = z.infer<typeof clienteSchema>;

// ==========================================
// ESQUEMAS DE DISTRIBUIDOR
// ==========================================

export const distribuidorSchema = z.object({
  nombre: nombreSchema,
  empresa: z.string().min(1, 'Empresa requerida').max(100),
  telefono: telefonoSchema.optional().default(''),
  email: emailSchema.optional().default(''),
  direccion: z.string().max(200).optional(),
  rfc: z.string().regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/, 'RFC inválido').optional().or(z.literal('')),
  banco: z.string().max(50).optional(),
  clabe: z.string().regex(/^\d{18}$/, 'CLABE debe tener 18 dígitos').optional().or(z.literal('')),
  notas: z.string().max(500).optional(),
});

export type DistribuidorInput = z.infer<typeof distribuidorSchema>;

// ==========================================
// ESQUEMAS DE PRODUCTO
// ==========================================

export const productoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(100),
  descripcion: z.string().max(500).optional(),
  categoria: z.string().max(50).optional(),
  stockActual: z.number().int().min(0).default(0),
  stockMinimo: z.number().int().min(0).default(5),
  stockOptimo: z.number().int().min(0).default(20),
  valorUnitario: montoPositivoSchema,
  unidadMedida: z.enum(['pieza', 'kg', 'litro', 'metro', 'caja']).default('pieza'),
  codigoBarras: z.string().max(50).optional(),
  ubicacion: z.string().max(50).optional(),
});

export type ProductoInput = z.infer<typeof productoSchema>;

// Esquema para movimiento de almacén
export const movimientoAlmacenSchema = z.object({
  productoId: idSchema,
  tipo: z.enum(['entrada', 'salida', 'ajuste']),
  cantidad: cantidadSchema,
  motivo: z.string().min(1, 'Motivo requerido').max(200),
  referencia: z.string().max(50).optional(),
});

export type MovimientoAlmacenInput = z.infer<typeof movimientoAlmacenSchema>;

// ==========================================
// ESQUEMAS DE BANCO
// ==========================================

export const bancoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(50),
  tipo: z.enum(['boveda', 'banco', 'utilidades', 'fletes', 'caja']),
  saldoInicial: montoPositivoSchema.default(0),
  descripcion: z.string().max(200).optional(),
  color: z.string().regex(/^from-\w+-\d+ to-\w+-\d+$/).optional(),
});

export type BancoInput = z.infer<typeof bancoSchema>;

// Esquema para transferencia entre bancos
export const transferenciaSchema = z.object({
  bancoOrigen: idSchema,
  bancoDestino: idSchema,
  monto: montoPositivoSchema.min(0.01, 'El monto debe ser mayor a 0'),
  concepto: z.string().min(1, 'Concepto requerido').max(200),
}).refine(
  (data) => data.bancoOrigen !== data.bancoDestino,
  {
    message: 'El banco origen y destino deben ser diferentes',
    path: ['bancoDestino'],
  }
);

export type TransferenciaInput = z.infer<typeof transferenciaSchema>;

// Esquema para gasto
export const gastoSchema = z.object({
  bancoId: idSchema,
  monto: montoPositivoSchema.min(0.01, 'El monto debe ser mayor a 0'),
  concepto: z.string().min(1, 'Concepto requerido').max(200),
  categoria: z.enum([
    'operativo',
    'administrativo',
    'personal',
    'transporte',
    'servicios',
    'otros'
  ]).default('operativo'),
  fecha: fechaSchema.optional(),
});

export type GastoInput = z.infer<typeof gastoSchema>;

// ==========================================
// ESQUEMAS DE USUARIO Y AUTH
// ==========================================

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registroSchema = z.object({
  nombre: nombreSchema,
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
    .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número'),
  confirmPassword: z.string(),
  rol: z.enum(['admin', 'manager', 'operador', 'viewer']).default('operador'),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  }
);

export type RegistroInput = z.infer<typeof registroSchema>;

// ==========================================
// ESQUEMAS DE REPORTES
// ==========================================

export const filtroReporteSchema = z.object({
  fechaInicio: fechaSchema,
  fechaFin: fechaSchema,
  tipo: z.enum(['ventas', 'compras', 'inventario', 'bancos', 'clientes', 'general']),
  formato: z.enum(['pdf', 'excel', 'csv']).default('pdf'),
  incluirGraficos: z.boolean().default(true),
}).refine(
  (data) => new Date(data.fechaInicio) <= new Date(data.fechaFin),
  {
    message: 'La fecha de inicio debe ser anterior a la fecha de fin',
    path: ['fechaFin'],
  }
);

export type FiltroReporteInput = z.infer<typeof filtroReporteSchema>;

// ==========================================
// ESQUEMAS DE CONFIGURACIÓN IA
// ==========================================

export const reporteProgramadoSchema = z.object({
  nombre: z.string().min(1).max(100),
  tipo: z.enum(['ventas', 'inventario', 'financiero', 'clientes', 'general']),
  frecuencia: z.enum(['diario', 'semanal', 'mensual', 'trimestral']),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm'),
  diaSemana: z.number().int().min(0).max(6).optional(), // 0 = Domingo
  diaMes: z.number().int().min(1).max(31).optional(),
  destinatarios: z.array(emailSchema.pipe(z.string().email())).min(1, 'Al menos un destinatario'),
  activo: z.boolean().default(true),
});

export type ReporteProgramadoInput = z.infer<typeof reporteProgramadoSchema>;

// ==========================================
// FUNCIONES DE VALIDACIÓN HELPERS
// ==========================================

/**
 * Valida datos contra un esquema y retorna errores formateados
 */
export function validarDatos<T>(
  schema: z.ZodSchema<T>,
  datos: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(datos);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return { success: false, errors };
}

/**
 * Valida un campo individual
 */
export function validarCampo<T>(
  schema: z.ZodSchema<T>,
  valor: unknown
): { valid: boolean; error?: string } {
  const result = schema.safeParse(valor);
  
  if (result.success) {
    return { valid: true };
  }
  
  return { valid: false, error: result.error.errors[0]?.message };
}

/**
 * Sanitiza string para prevenir XSS básico
 */
export function sanitizarString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

/**
 * Normaliza nombre (capitaliza primera letra de cada palabra)
 */
export function normalizarNombre(nombre: string): string {
  return nombre
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

/**
 * Formatea teléfono a formato estándar
 */
export function formatearTelefono(telefono: string): string {
  const numeros = telefono.replace(/\D/g, '');
  if (numeros.length === 10) {
    return `(${numeros.slice(0, 3)}) ${numeros.slice(3, 6)}-${numeros.slice(6)}`;
  }
  return telefono;
}

// Export de todos los schemas
export const schemas = {
  venta: ventaSchema,
  abonoCliente: abonoClienteSchema,
  ordenCompra: ordenCompraSchema,
  abonoDistribuidor: abonoDistribuidorSchema,
  cliente: clienteSchema,
  distribuidor: distribuidorSchema,
  producto: productoSchema,
  movimientoAlmacen: movimientoAlmacenSchema,
  banco: bancoSchema,
  transferencia: transferenciaSchema,
  gasto: gastoSchema,
  login: loginSchema,
  registro: registroSchema,
  filtroReporte: filtroReporteSchema,
  reporteProgramado: reporteProgramadoSchema,
};

export default schemas;
