/**
 * 🏦 FLOWDISTRIBUTOR CLOUD FUNCTIONS - Sistema de Gestión Financiera
 *
 * Funciones serverless con TRANSACCIONES ATÓMICAS para:
 * - crearVentaCompleta: Multi-producto con distribución GYA a 3 bancos
 * - crearOrdenCompraCompleta: Multi-producto con adeudo automático
 * - abonarCliente: Abonos con selección de banco destino
 * - pagarDistribuidor: Pagos con selección de banco origen
 * - transferirEntreBancos: Transferencias atómicas
 * - registrarGasto: Gastos desde cualquier banco
 * - registrarIngreso: Solo bancos operativos (azteca, leftie, profit)
 *
 * @version 3.0.0 PRODUCTION
 * @author FlowDistributor Team
 */
import * as functions from 'firebase-functions';
/**
 * 🛒 CREAR VENTA COMPLETA
 *
 * Transacción atómica que:
 * 1. Crea documento de venta con MÚLTIPLES PRODUCTOS
 * 2. Distribuye a 3 bancos (Bóveda Monte, Fletes, Utilidades)
 * 3. Crea cliente si no existe / actualiza deuda
 * 4. Registra salida en almacén (inmutable)
 * 5. Actualiza stock de OC relacionadas
 */
export declare const crearVentaCompleta: functions.HttpsFunction & functions.Runnable<any>;
/**
 * 📦 CREAR ORDEN DE COMPRA COMPLETA
 *
 * Transacción atómica que:
 * 1. Crea OC con MÚLTIPLES PRODUCTOS
 * 2. Crea distribuidor si no existe
 * 3. Genera adeudo automático
 * 4. Registra entrada en almacén (inmutable)
 * 5. Si hay pago inicial, descuenta del banco origen
 */
export declare const crearOrdenCompraCompleta: functions.HttpsFunction & functions.Runnable<any>;
/**
 * 💰 ABONAR CLIENTE
 *
 * Registra un abono de un cliente:
 * 1. Reduce la deuda del cliente
 * 2. Registra ingreso en banco SELECCIONADO
 * 3. Crea movimiento inmutable
 * 4. Si hay venta específica, actualiza su estado
 */
export declare const abonarCliente: functions.HttpsFunction & functions.Runnable<any>;
/**
 * 💸 PAGAR DISTRIBUIDOR
 *
 * Registra un pago a distribuidor:
 * 1. Verifica fondos en banco origen
 * 2. Reduce el adeudo del distribuidor
 * 3. Registra gasto en banco origen SELECCIONADO
 * 4. Si hay OC específica, actualiza su estado
 */
export declare const pagarDistribuidor: functions.HttpsFunction & functions.Runnable<any>;
/**
 * 🔄 TRANSFERENCIA ENTRE BANCOS
 */
export declare const transferirEntreBancos: functions.HttpsFunction & functions.Runnable<any>;
export declare const registrarGasto: functions.HttpsFunction & functions.Runnable<any>;
export declare const registrarIngreso: functions.HttpsFunction & functions.Runnable<any>;
//# sourceMappingURL=index.d.ts.map