/**
 * 🏛️ SERVICIOS CENTRALIZADOS - CHRONOS SYSTEM
 * 
 * Punto de entrada único para todos los servicios de negocio.
 * Importa desde aquí para mantener consistencia.
 */

// ====================================================================
// SERVICIO DE LÓGICA DE NEGOCIO (Funciones granulares)
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
