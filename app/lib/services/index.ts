/**
 * 🏛️ SERVICIOS CENTRALIZADOS - CHRONOS SYSTEM
 * 
 * Punto de entrada único para todos los servicios de negocio.
 * Importa desde aquí para mantener consistencia.
 */

// ====================================================================
// SERVICIO DE CÁLCULOS (FUENTE ÚNICA DE VERDAD PARA GYA)
// ====================================================================
export {
  // Función principal de cálculo GYA
  calcularDistribucionGYA,
  
  // Utilidades de redondeo
  redondearMonto,
  noNegativo,
  
  // Constantes
  PRECIO_FLETE_DEFAULT as PRECIO_FLETE_CALCULO,
  DECIMALES_MONEDA,
  BANCOS_IDS as BANCOS_IDS_CALCULO,
  BANCOS_DISTRIBUCION_GYA,
  BANCOS_OPERATIVOS,
  
  // Tipos
  type CalculoVentaInput,
  type CalculoOrdenCompraInput,
} from './calculo.service'

// ====================================================================
// SERVICIO DE OPERACIONES DE NEGOCIO COMPLETAS (RECOMENDADO)
// ====================================================================
export {
  // Operaciones completas con batch transactions
  crearOrdenCompraCompleta,
  crearVentaCompleta,
  abonarCliente,
  pagarDistribuidor,
  realizarTransferencia,
  registrarGasto,
  registrarIngreso,
  businessOperationsService,
  
  // Tipos
  type CrearOrdenCompraInput,
  type OrdenCompraResult,
  type CrearVentaInput,
  type VentaResult,
  type AbonarClienteInput,
  type PagarDistribuidorInput,
  type TransferenciaInput as BusinessTransferenciaInput,
  type RegistrarGastoInput,
  type RegistrarIngresoInput,
} from './business-operations.service'

// ====================================================================
// SERVICIO DE LÓGICA DE NEGOCIO (Funciones granulares - LEGACY)
// ====================================================================
export {
  // Funciones de cálculo
  calcularDistribucionVenta,
  calcularDistribucionParcial,
  
  // Operaciones de negocio
  registrarVenta,
  registrarAbonoCliente,
  registrarPagoDistribuidor,
  registrarOrdenCompra,
  registrarTransferencia,
  
  // Consultas
  obtenerResumenCliente,
  obtenerResumenDistribuidor,
  
  // Tipos
  type NuevaVentaInput,
  type AbonoClienteInput,
  type PagoDistribuidorInput,
  type TransferenciaInput,
  
  // Constantes
  PRECIO_FLETE_DEFAULT,
  BANCOS_IDS,
  BANCOS_VENTAS,
} from './business-logic.service'

// ====================================================================
// SERVICIO DE TRANSACCIONES ATÓMICAS (Operaciones complejas)
// ====================================================================
export {
  // Transacciones
  procesarVentaAtomica,
  procesarOrdenCompraAtomica,
  procesarAbonoAtomico,
  procesarTransferenciaAtomica,
  transactionService,
  
  // Tipos
  type VentaData,
  type VentaItem,
  type OrdenCompraData,
  type AbonoData,
  type TransferenciaData,
  type ResultadoTransaccion,
  type DistribucionBancos,
  type BancoId as BancoIdTransaction,
} from './ventas-transaction.service'

// ====================================================================
// SERVICIO DE CASA DE CAMBIO
// ====================================================================
export { casaCambioService } from './casa-cambio.service'
