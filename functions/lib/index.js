"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrarIngreso = exports.registrarGasto = exports.transferirEntreBancos = exports.pagarDistribuidor = exports.abonarCliente = exports.crearOrdenCompraCompleta = exports.crearVentaCompleta = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
// Config de bancos
const BANCOS_CONFIG = {
    boveda_monte: { nombre: 'Bóveda Monte', tipo: 'boveda' },
    boveda_usa: { nombre: 'Bóveda USA', tipo: 'boveda' },
    utilidades: { nombre: 'Utilidades', tipo: 'utilidades' },
    flete_sur: { nombre: 'Flete Sur', tipo: 'gastos' },
    azteca: { nombre: 'Azteca', tipo: 'operativo' },
    leftie: { nombre: 'Leftie', tipo: 'operativo' },
    profit: { nombre: 'Profit', tipo: 'operativo' },
};
// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS BLINDADOS
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Asegurar que un banco existe, creándolo si es necesario
 */
async function ensureBancoExists(transaction, bancoId) {
    const bancoRef = db.collection('bancos').doc(bancoId);
    const bancoDoc = await transaction.get(bancoRef);
    if (!bancoDoc.exists) {
        const config = BANCOS_CONFIG[bancoId];
        transaction.set(bancoRef, {
            id: bancoId,
            nombre: config?.nombre || bancoId,
            tipo: config?.tipo || 'operativo',
            historicoIngresos: 0,
            historicoGastos: 0,
            historicoTransferencias: 0,
            capitalActual: 0,
            capitalInicial: 0,
            estado: 'activo',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
    }
}
/**
 * Actualizar banco con nuevo movimiento (ATÓMICO)
 */
async function actualizarBanco(transaction, bancoId, tipo, monto, concepto, referencia, usuarioId) {
    await ensureBancoExists(transaction, bancoId);
    const bancoRef = db.collection('bancos').doc(bancoId);
    const bancoDoc = await transaction.get(bancoRef);
    const data = bancoDoc.data();
    const nuevoHistoricoIngresos = (data.historicoIngresos || 0) + (tipo === 'ingreso' ? monto : 0);
    const nuevoHistoricoGastos = (data.historicoGastos || 0) + (tipo === 'gasto' ? monto : 0);
    // FÓRMULA CRÍTICA: capitalActual = historicoIngresos - historicoGastos
    transaction.update(bancoRef, {
        historicoIngresos: nuevoHistoricoIngresos,
        historicoGastos: nuevoHistoricoGastos,
        capitalActual: nuevoHistoricoIngresos - nuevoHistoricoGastos,
        updatedAt: FieldValue.serverTimestamp(),
    });
    // Registrar movimiento INMUTABLE
    const movimientoRef = db.collection('movimientos').doc();
    transaction.set(movimientoRef, {
        id: movimientoRef.id,
        bancoId,
        tipoMovimiento: tipo,
        monto,
        concepto,
        referenciaId: referencia || null,
        referenciaTipo: referencia ? 'venta' : 'manual',
        fecha: FieldValue.serverTimestamp(),
        usuarioId: usuarioId || null,
        createdAt: FieldValue.serverTimestamp(),
    });
}
/**
 * Generar ID único para venta
 */
function generarVentaId() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `VTA-${year}${month}${day}-${random}`;
}
/**
 * Generar ID único para orden de compra
 */
function generarOCId() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    return `OC${year}${month}-${random}`;
}
// ═══════════════════════════════════════════════════════════════════════════════
// 1. CREAR VENTA COMPLETA - MULTI-PRODUCTO (ATÓMICA)
// ═══════════════════════════════════════════════════════════════════════════════
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
exports.crearVentaCompleta = functions
    .region('us-central1')
    .runWith({
    memory: '512MB',
    timeoutSeconds: 60,
    maxInstances: 20
})
    .https.onCall(async (data, context) => {
    // Verificar autenticación
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debes iniciar sesión para crear ventas');
    }
    // Normalizar: soportar legacy (single product) y nuevo (multi-product)
    let productos = [];
    if (data.productos && data.productos.length > 0) {
        productos = data.productos;
    }
    else if (data.producto && data.cantidad && data.precioVenta) {
        // Legacy single product
        productos = [{
                producto: data.producto,
                cantidad: data.cantidad,
                precioVenta: data.precioVenta,
                precioCompra: data.precioCompra || 0,
                precioFlete: data.precioFlete || 500,
                ocRelacionada: data.ocRelacionada,
            }];
    }
    if (!data.cliente || productos.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Datos de venta incompletos: cliente y productos son requeridos');
    }
    const ventaId = generarVentaId();
    const ahora = FieldValue.serverTimestamp();
    const userId = context.auth.uid;
    // Calcular totales de TODOS los productos
    let precioTotalVenta = 0;
    let totalBovedaMonte = 0;
    let totalFletes = 0;
    let totalUtilidades = 0;
    let totalCantidad = 0;
    for (const prod of productos) {
        const subtotal = prod.precioVenta * prod.cantidad;
        const costo = prod.precioCompra * prod.cantidad;
        const flete = prod.precioFlete * prod.cantidad;
        const utilidad = subtotal - costo - flete;
        precioTotalVenta += subtotal;
        totalBovedaMonte += costo;
        totalFletes += flete;
        totalUtilidades += utilidad;
        totalCantidad += prod.cantidad;
    }
    // Calcular proporción según estado de pago
    let proporcion = 1;
    if (data.estadoPago === 'parcial') {
        proporcion = precioTotalVenta > 0 ? data.montoPagado / precioTotalVenta : 0;
    }
    else if (data.estadoPago === 'pendiente') {
        proporcion = 0;
    }
    const bovedaMonteEfectivo = Math.round(totalBovedaMonte * proporcion);
    const fletesEfectivo = Math.round(totalFletes * proporcion);
    const utilidadesEfectivo = Math.round(totalUtilidades * proporcion);
    const montoRestante = precioTotalVenta - data.montoPagado;
    try {
        const resultado = await db.runTransaction(async (transaction) => {
            // 1. Crear documento de venta
            const ventaRef = db.collection('ventas').doc(ventaId);
            transaction.set(ventaRef, {
                id: ventaId,
                fecha: ahora,
                cliente: data.cliente,
                clienteId: data.clienteId || null,
                // MULTI-PRODUCTO
                productos,
                cantidad: totalCantidad,
                // Precios
                precioTotalVenta,
                montoPagado: data.montoPagado,
                montoRestante,
                adeudo: montoRestante,
                estadoPago: data.estadoPago,
                estatus: data.estadoPago === 'completo' ? 'Pagado' : data.estadoPago === 'parcial' ? 'Parcial' : 'Pendiente',
                metodoPago: data.metodoPago,
                notas: data.notas || null,
                // Distribución GYA TOTAL (inmutable)
                bovedaMonte: totalBovedaMonte,
                fleteUtilidad: totalFletes,
                utilidad: totalUtilidades,
                distribucionBancos: {
                    bovedaMonte: totalBovedaMonte,
                    fletes: totalFletes,
                    utilidades: totalUtilidades,
                },
                // Distribución efectiva (según pago)
                distribucionEfectiva: {
                    bovedaMonte: bovedaMonteEfectivo,
                    fletes: fletesEfectivo,
                    utilidades: utilidadesEfectivo,
                },
                // Metadata
                usuarioId: userId,
                createdAt: ahora,
                updatedAt: ahora,
            });
            // 2. Buscar o crear cliente
            let clienteId = data.clienteId;
            const clienteQuery = await db.collection('clientes')
                .where('nombre', '==', data.cliente)
                .limit(1)
                .get();
            if (clienteQuery.empty) {
                // Crear nuevo cliente
                clienteId = db.collection('clientes').doc().id;
                const clienteRef = db.collection('clientes').doc(clienteId);
                transaction.set(clienteRef, {
                    id: clienteId,
                    nombre: data.cliente,
                    totalVentas: precioTotalVenta,
                    totalPagado: data.montoPagado,
                    deudaTotal: montoRestante,
                    numeroCompras: 1,
                    ultimaCompra: ahora,
                    ventas: [ventaId],
                    estado: 'activo',
                    createdAt: ahora,
                    updatedAt: ahora,
                });
            }
            else {
                // Actualizar cliente existente
                clienteId = clienteQuery.docs[0].id;
                const clienteRef = db.collection('clientes').doc(clienteId);
                transaction.update(clienteRef, {
                    totalVentas: FieldValue.increment(precioTotalVenta),
                    totalPagado: FieldValue.increment(data.montoPagado),
                    deudaTotal: FieldValue.increment(montoRestante),
                    numeroCompras: FieldValue.increment(1),
                    ultimaCompra: ahora,
                    ventas: FieldValue.arrayUnion(ventaId),
                    updatedAt: ahora,
                });
            }
            // Actualizar venta con clienteId
            transaction.update(ventaRef, { clienteId });
            // 3. Distribuir a bancos (solo si hay pago)
            if (proporcion > 0) {
                // Bóveda Monte - Costo
                if (bovedaMonteEfectivo > 0) {
                    await actualizarBanco(transaction, 'boveda_monte', 'ingreso', bovedaMonteEfectivo, `Venta ${ventaId} - ${data.cliente} (Costo)`, ventaId, userId);
                }
                // Flete Sur
                if (fletesEfectivo > 0) {
                    await actualizarBanco(transaction, 'flete_sur', 'ingreso', fletesEfectivo, `Venta ${ventaId} - ${data.cliente} (Flete)`, ventaId, userId);
                }
                // Utilidades - Ganancia neta
                if (utilidadesEfectivo > 0) {
                    await actualizarBanco(transaction, 'utilidades', 'ingreso', utilidadesEfectivo, `Venta ${ventaId} - ${data.cliente} (Utilidad)`, ventaId, userId);
                }
            }
            // 4. Registrar salida inmutable en almacén
            const salidaRef = db.collection('salidasAlmacen').doc();
            transaction.set(salidaRef, {
                id: salidaRef.id,
                tipo: 'salida',
                ventaId,
                cliente: data.cliente,
                productos: productos.map(p => ({
                    producto: p.producto,
                    cantidad: p.cantidad,
                    precioVenta: p.precioVenta,
                    ocRelacionada: p.ocRelacionada,
                })),
                totalCantidad,
                totalVenta: precioTotalVenta,
                fecha: ahora,
                usuarioId: userId,
                createdAt: ahora,
            });
            // 5. Actualizar stock en OC y almacén
            for (const prod of productos) {
                // Actualizar OC si está relacionada
                if (prod.ocRelacionada) {
                    const ocRef = db.collection('ordenes_compra').doc(prod.ocRelacionada);
                    transaction.update(ocRef, {
                        stockActual: FieldValue.increment(-prod.cantidad),
                        updatedAt: ahora,
                    });
                }
                // Actualizar almacén si tiene productoId
                if (prod.productoId) {
                    const almacenRef = db.collection('almacen').doc(prod.productoId);
                    transaction.update(almacenRef, {
                        stockActual: FieldValue.increment(-prod.cantidad),
                        totalSalidas: FieldValue.increment(prod.cantidad),
                        updatedAt: ahora,
                    });
                }
            }
            return { clienteId };
        });
        // Log de auditoría
        await db.collection('audit_logs').add({
            action: 'VENTA_CREADA',
            ventaId,
            usuario: userId,
            datos: {
                cliente: data.cliente,
                productos: productos.length,
                total: precioTotalVenta,
                estado: data.estadoPago,
            },
            timestamp: FieldValue.serverTimestamp(),
        });
        return {
            success: true,
            ventaId,
            clienteId: resultado.clienteId,
            totalVenta: precioTotalVenta,
            distribucion: {
                bovedaMonte: bovedaMonteEfectivo,
                fletes: fletesEfectivo,
                utilidades: utilidadesEfectivo,
            },
            deudaCliente: montoRestante,
        };
    }
    catch (error) {
        console.error('[crearVentaCompleta] Error:', error);
        throw new functions.https.HttpsError('internal', `Error al procesar la venta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
});
// ═══════════════════════════════════════════════════════════════════════════════
// 2. CREAR ORDEN DE COMPRA - MULTI-PRODUCTO (ATÓMICA)
// ═══════════════════════════════════════════════════════════════════════════════
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
exports.crearOrdenCompraCompleta = functions
    .region('us-central1')
    .runWith({
    memory: '512MB',
    timeoutSeconds: 60,
    maxInstances: 20
})
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    if (!data.distribuidor || !data.productos || data.productos.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Datos incompletos');
    }
    const ocId = generarOCId();
    const ahora = FieldValue.serverTimestamp();
    const userId = context.auth.uid;
    // Calcular totales
    let costoTotal = 0;
    let totalCantidad = 0;
    const productosConCosto = data.productos.map(prod => {
        const costoPorUnidad = prod.costoDistribuidor + (prod.costoTransporte || 0);
        const subtotal = costoPorUnidad * prod.cantidad;
        costoTotal += subtotal;
        totalCantidad += prod.cantidad;
        return { ...prod, costoPorUnidad, subtotal };
    });
    const pagoInicial = data.pagoInicial || 0;
    const deuda = costoTotal - pagoInicial;
    try {
        const resultado = await db.runTransaction(async (transaction) => {
            // 1. Crear OC
            const ocRef = db.collection('ordenes_compra').doc(ocId);
            transaction.set(ocRef, {
                id: ocId,
                fecha: ahora,
                distribuidor: data.distribuidor,
                productos: productosConCosto,
                cantidad: totalCantidad,
                costoTotal,
                pagoDistribuidor: pagoInicial,
                pagoInicial,
                deuda,
                stockActual: totalCantidad,
                stockInicial: totalCantidad,
                bancoOrigen: data.bancoOrigen || null,
                estado: deuda === 0 ? 'pagado' : pagoInicial > 0 ? 'parcial' : 'pendiente',
                notas: data.notas || '',
                usuarioId: userId,
                createdAt: ahora,
                updatedAt: ahora,
            });
            // 2. Buscar o crear distribuidor
            let distribuidorId;
            const distQuery = await db.collection('distribuidores')
                .where('nombre', '==', data.distribuidor)
                .limit(1)
                .get();
            if (distQuery.empty) {
                distribuidorId = db.collection('distribuidores').doc().id;
                const distRef = db.collection('distribuidores').doc(distribuidorId);
                transaction.set(distRef, {
                    id: distribuidorId,
                    nombre: data.distribuidor,
                    totalOrdenesCompra: costoTotal,
                    totalPagado: pagoInicial,
                    deudaTotal: deuda,
                    numeroOrdenes: 1,
                    ultimaOrden: ahora,
                    ordenesCompra: [ocId],
                    estado: 'activo',
                    createdAt: ahora,
                    updatedAt: ahora,
                });
            }
            else {
                distribuidorId = distQuery.docs[0].id;
                const distRef = db.collection('distribuidores').doc(distribuidorId);
                transaction.update(distRef, {
                    totalOrdenesCompra: FieldValue.increment(costoTotal),
                    totalPagado: FieldValue.increment(pagoInicial),
                    deudaTotal: FieldValue.increment(deuda),
                    numeroOrdenes: FieldValue.increment(1),
                    ultimaOrden: ahora,
                    ordenesCompra: FieldValue.arrayUnion(ocId),
                    updatedAt: ahora,
                });
            }
            // Actualizar OC con distribuidorId
            transaction.update(ocRef, { distribuidorId });
            // 3. Registrar entrada inmutable en almacén
            const entradaRef = db.collection('entradasAlmacen').doc();
            transaction.set(entradaRef, {
                id: entradaRef.id,
                tipo: 'entrada',
                ordenCompraId: ocId,
                distribuidor: data.distribuidor,
                productos: productosConCosto,
                totalCantidad,
                costoTotal,
                fecha: ahora,
                usuarioId: userId,
                createdAt: ahora,
            });
            // 4. Actualizar o crear productos en almacén
            for (const prod of productosConCosto) {
                const prodQuery = await db.collection('almacen')
                    .where('nombre', '==', prod.producto)
                    .limit(1)
                    .get();
                if (prodQuery.empty) {
                    const prodRef = db.collection('almacen').doc();
                    transaction.set(prodRef, {
                        id: prodRef.id,
                        nombre: prod.producto,
                        origen: data.distribuidor,
                        stockActual: prod.cantidad,
                        stockMinimo: 10,
                        precioCompra: prod.costoDistribuidor,
                        valorUnitario: prod.costoPorUnidad,
                        totalEntradas: prod.cantidad,
                        totalSalidas: 0,
                        activo: true,
                        createdAt: ahora,
                        updatedAt: ahora,
                    });
                }
                else {
                    const prodRef = db.collection('almacen').doc(prodQuery.docs[0].id);
                    transaction.update(prodRef, {
                        stockActual: FieldValue.increment(prod.cantidad),
                        totalEntradas: FieldValue.increment(prod.cantidad),
                        updatedAt: ahora,
                    });
                }
            }
            // 5. Si hay pago inicial, descontar del banco
            if (pagoInicial > 0 && data.bancoOrigen) {
                await actualizarBanco(transaction, data.bancoOrigen, 'gasto', pagoInicial, `Pago OC ${ocId} - ${data.distribuidor}`, ocId, userId);
            }
            return { distribuidorId };
        });
        return {
            success: true,
            ordenId: ocId,
            distribuidorId: resultado.distribuidorId,
            costoTotal,
            deuda,
        };
    }
    catch (error) {
        console.error('[crearOrdenCompraCompleta] Error:', error);
        throw new functions.https.HttpsError('internal', 'Error al crear OC');
    }
});
// ═══════════════════════════════════════════════════════════════════════════════
// 3. ABONAR CLIENTE (ATÓMICA)
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * 💰 ABONAR CLIENTE
 *
 * Registra un abono de un cliente:
 * 1. Reduce la deuda del cliente
 * 2. Registra ingreso en banco SELECCIONADO
 * 3. Crea movimiento inmutable
 * 4. Si hay venta específica, actualiza su estado
 */
exports.abonarCliente = functions
    .region('us-central1')
    .runWith({ memory: '256MB', timeoutSeconds: 30 })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    if (!data.clienteId || data.monto <= 0 || !data.bancoDestino) {
        throw new functions.https.HttpsError('invalid-argument', 'Datos inválidos: clienteId, monto y bancoDestino son requeridos');
    }
    const abonoId = `ABO-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const userId = context.auth.uid;
    const ahora = FieldValue.serverTimestamp();
    try {
        await db.runTransaction(async (transaction) => {
            // Obtener cliente
            const clienteRef = db.collection('clientes').doc(data.clienteId);
            const clienteDoc = await transaction.get(clienteRef);
            if (!clienteDoc.exists) {
                throw new Error('Cliente no encontrado');
            }
            const clienteData = clienteDoc.data();
            const deudaActual = clienteData.deudaTotal || clienteData.deuda || 0;
            if (data.monto > deudaActual) {
                throw new Error(`El abono ($${data.monto}) excede la deuda actual ($${deudaActual})`);
            }
            const nuevaDeuda = Math.max(0, deudaActual - data.monto);
            // Actualizar cliente
            transaction.update(clienteRef, {
                totalPagado: FieldValue.increment(data.monto),
                deudaTotal: nuevaDeuda,
                deuda: nuevaDeuda, // Legacy
                ultimoAbono: ahora,
                updatedAt: ahora,
            });
            // Si hay venta específica, actualizar su estado
            if (data.ventaId) {
                const ventaRef = db.collection('ventas').doc(data.ventaId);
                const ventaDoc = await transaction.get(ventaRef);
                if (ventaDoc.exists) {
                    const ventaData = ventaDoc.data();
                    const nuevoMontoPagado = (ventaData.montoPagado || 0) + data.monto;
                    const nuevoMontoRestante = Math.max(0, (ventaData.precioTotalVenta || 0) - nuevoMontoPagado);
                    const nuevoEstado = nuevoMontoRestante <= 0 ? 'completo' : 'parcial';
                    transaction.update(ventaRef, {
                        montoPagado: nuevoMontoPagado,
                        montoRestante: nuevoMontoRestante,
                        adeudo: nuevoMontoRestante,
                        estadoPago: nuevoEstado,
                        estatus: nuevoEstado === 'completo' ? 'Pagado' : 'Parcial',
                        updatedAt: ahora,
                    });
                    // Distribuir proporcionalmente a los 3 bancos
                    const proporcion = (ventaData.precioTotalVenta || 0) > 0
                        ? data.monto / (ventaData.precioTotalVenta || 1)
                        : 0;
                    const dist = ventaData.distribucionBancos || {};
                    if (dist.bovedaMonte && dist.bovedaMonte > 0) {
                        const montoBoveda = Math.round(dist.bovedaMonte * proporcion);
                        if (montoBoveda > 0) {
                            await actualizarBanco(transaction, 'boveda_monte', 'ingreso', montoBoveda, `Abono ${clienteData.nombre} - Venta ${data.ventaId}`, abonoId, userId);
                        }
                    }
                    if (dist.fletes && dist.fletes > 0) {
                        const montoFletes = Math.round(dist.fletes * proporcion);
                        if (montoFletes > 0) {
                            await actualizarBanco(transaction, 'flete_sur', 'ingreso', montoFletes, `Abono ${clienteData.nombre} - Flete`, abonoId, userId);
                        }
                    }
                    if (dist.utilidades && dist.utilidades > 0) {
                        const montoUtil = Math.round(dist.utilidades * proporcion);
                        if (montoUtil > 0) {
                            await actualizarBanco(transaction, 'utilidades', 'ingreso', montoUtil, `Abono ${clienteData.nombre} - Utilidad`, abonoId, userId);
                        }
                    }
                }
            }
            else {
                // Abono general: va al banco seleccionado
                await actualizarBanco(transaction, data.bancoDestino, 'ingreso', data.monto, `Abono ${clienteData.nombre || data.clienteId}`, abonoId, userId);
            }
            // Registrar abono inmutable
            const abonoRef = db.collection('abonos').doc(abonoId);
            transaction.set(abonoRef, {
                id: abonoId,
                tipo: 'cliente',
                clienteId: data.clienteId,
                clienteNombre: clienteData.nombre || data.clienteId,
                ventaId: data.ventaId || null,
                monto: data.monto,
                metodoPago: data.metodoPago,
                bancoDestino: data.bancoDestino,
                concepto: data.concepto || 'Abono a cuenta',
                deudaAnterior: deudaActual,
                deudaNueva: nuevaDeuda,
                usuarioId: userId,
                fecha: ahora,
                createdAt: ahora,
            });
        });
        return {
            success: true,
            abonoId,
            message: 'Abono registrado correctamente',
        };
    }
    catch (error) {
        console.error('[abonarCliente] Error:', error);
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Error al procesar abono');
    }
});
// ═══════════════════════════════════════════════════════════════════════════════
// 4. PAGAR DISTRIBUIDOR (ATÓMICA)
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * 💸 PAGAR DISTRIBUIDOR
 *
 * Registra un pago a distribuidor:
 * 1. Verifica fondos en banco origen
 * 2. Reduce el adeudo del distribuidor
 * 3. Registra gasto en banco origen SELECCIONADO
 * 4. Si hay OC específica, actualiza su estado
 */
exports.pagarDistribuidor = functions
    .region('us-central1')
    .runWith({ memory: '256MB', timeoutSeconds: 30 })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    if (!data.distribuidorId || data.monto <= 0 || !data.bancoOrigen) {
        throw new functions.https.HttpsError('invalid-argument', 'Datos inválidos');
    }
    const pagoId = `PAGO-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const userId = context.auth.uid;
    const ahora = FieldValue.serverTimestamp();
    try {
        await db.runTransaction(async (transaction) => {
            // Verificar fondos en banco origen
            await ensureBancoExists(transaction, data.bancoOrigen);
            const bancoRef = db.collection('bancos').doc(data.bancoOrigen);
            const bancoDoc = await transaction.get(bancoRef);
            const capitalActual = bancoDoc.data()?.capitalActual || 0;
            if (capitalActual < data.monto) {
                throw new Error(`Fondos insuficientes en ${BANCOS_CONFIG[data.bancoOrigen].nombre}. Capital: $${capitalActual}`);
            }
            // Obtener distribuidor
            const distRef = db.collection('distribuidores').doc(data.distribuidorId);
            const distDoc = await transaction.get(distRef);
            if (!distDoc.exists) {
                throw new Error('Distribuidor no encontrado');
            }
            const distData = distDoc.data();
            const deudaActual = distData.deudaTotal || distData.adeudoPendiente || 0;
            const nuevaDeuda = Math.max(0, deudaActual - data.monto);
            // Actualizar distribuidor
            transaction.update(distRef, {
                totalPagado: FieldValue.increment(data.monto),
                deudaTotal: nuevaDeuda,
                adeudoPendiente: nuevaDeuda, // Legacy
                ultimoPago: ahora,
                updatedAt: ahora,
            });
            // Si hay OC específica, actualizarla
            if (data.ordenCompraId) {
                const ocRef = db.collection('ordenes_compra').doc(data.ordenCompraId);
                const ocDoc = await transaction.get(ocRef);
                if (ocDoc.exists) {
                    const ocData = ocDoc.data();
                    const nuevoPago = (ocData.pagoDistribuidor || 0) + data.monto;
                    const nuevaDeudaOC = Math.max(0, (ocData.costoTotal || 0) - nuevoPago);
                    transaction.update(ocRef, {
                        pagoDistribuidor: nuevoPago,
                        deuda: nuevaDeudaOC,
                        estado: nuevaDeudaOC <= 0 ? 'pagado' : 'parcial',
                        updatedAt: ahora,
                    });
                }
            }
            // Registrar gasto en banco origen
            await actualizarBanco(transaction, data.bancoOrigen, 'gasto', data.monto, `Pago a ${distData.nombre || data.distribuidorId}`, pagoId, userId);
            // Registrar pago inmutable
            const pagoRef = db.collection('pagos_distribuidores').doc(pagoId);
            transaction.set(pagoRef, {
                id: pagoId,
                distribuidorId: data.distribuidorId,
                distribuidorNombre: distData.nombre || data.distribuidorId,
                ordenCompraId: data.ordenCompraId || null,
                monto: data.monto,
                bancoOrigen: data.bancoOrigen,
                metodoPago: data.metodoPago,
                concepto: data.concepto || 'Pago a proveedor',
                deudaAnterior: deudaActual,
                deudaNueva: nuevaDeuda,
                usuarioId: userId,
                fecha: ahora,
                createdAt: ahora,
            });
        });
        return {
            success: true,
            pagoId,
            message: 'Pago registrado correctamente',
        };
    }
    catch (error) {
        console.error('[pagarDistribuidor] Error:', error);
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Error al procesar pago');
    }
});
// ═══════════════════════════════════════════════════════════════════════════════
// 5. TRANSFERENCIA ENTRE BANCOS (ATÓMICA)
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * 🔄 TRANSFERENCIA ENTRE BANCOS
 */
exports.transferirEntreBancos = functions
    .region('us-central1')
    .runWith({ memory: '256MB', timeoutSeconds: 30 })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    if (!data.bancoOrigen || !data.bancoDestino || data.monto <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Datos inválidos');
    }
    if (data.bancoOrigen === data.bancoDestino) {
        throw new functions.https.HttpsError('invalid-argument', 'Los bancos deben ser diferentes');
    }
    const transferId = `TRF-${Date.now()}-${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
    const userId = context.auth.uid;
    const ahora = FieldValue.serverTimestamp();
    try {
        await db.runTransaction(async (transaction) => {
            // Verificar fondos en origen
            await ensureBancoExists(transaction, data.bancoOrigen);
            await ensureBancoExists(transaction, data.bancoDestino);
            const origenRef = db.collection('bancos').doc(data.bancoOrigen);
            const origenDoc = await transaction.get(origenRef);
            const capitalOrigen = origenDoc.data()?.capitalActual || 0;
            if (capitalOrigen < data.monto) {
                throw new Error(`Fondos insuficientes. Capital actual: $${capitalOrigen}`);
            }
            // Actualizar banco origen (restar)
            transaction.update(origenRef, {
                capitalActual: FieldValue.increment(-data.monto),
                historicoTransferencias: FieldValue.increment(data.monto),
                updatedAt: ahora,
            });
            // Actualizar banco destino (sumar)
            const destinoRef = db.collection('bancos').doc(data.bancoDestino);
            transaction.update(destinoRef, {
                capitalActual: FieldValue.increment(data.monto),
                historicoIngresos: FieldValue.increment(data.monto),
                updatedAt: ahora,
            });
            // Movimiento de salida
            const movSalidaRef = db.collection('movimientos').doc();
            transaction.set(movSalidaRef, {
                id: movSalidaRef.id,
                bancoId: data.bancoOrigen,
                tipoMovimiento: 'transferencia_salida',
                monto: data.monto,
                concepto: `Transferencia a ${BANCOS_CONFIG[data.bancoDestino].nombre}`,
                referenciaId: transferId,
                referenciaTipo: 'transferencia',
                destino: data.bancoDestino,
                fecha: ahora,
                usuarioId: userId,
                createdAt: ahora,
            });
            // Movimiento de entrada
            const movEntradaRef = db.collection('movimientos').doc();
            transaction.set(movEntradaRef, {
                id: movEntradaRef.id,
                bancoId: data.bancoDestino,
                tipoMovimiento: 'transferencia_entrada',
                monto: data.monto,
                concepto: `Transferencia de ${BANCOS_CONFIG[data.bancoOrigen].nombre}`,
                referenciaId: transferId,
                referenciaTipo: 'transferencia',
                origen: data.bancoOrigen,
                fecha: ahora,
                usuarioId: userId,
                createdAt: ahora,
            });
            // Registrar transferencia
            const transRef = db.collection('transferencias').doc(transferId);
            transaction.set(transRef, {
                id: transferId,
                bancoOrigen: data.bancoOrigen,
                bancoDestino: data.bancoDestino,
                monto: data.monto,
                concepto: data.concepto,
                usuarioId: userId,
                fecha: ahora,
                createdAt: ahora,
            });
        });
        return {
            success: true,
            transferId,
        };
    }
    catch (error) {
        console.error('[transferirEntreBancos] Error:', error);
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Error en transferencia');
    }
});
// ═══════════════════════════════════════════════════════════════════════════════
// 6. REGISTRAR GASTO (ATÓMICA)
// ═══════════════════════════════════════════════════════════════════════════════
exports.registrarGasto = functions
    .region('us-central1')
    .runWith({ memory: '256MB', timeoutSeconds: 30 })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    if (!data.bancoOrigen || data.monto <= 0 || !data.concepto) {
        throw new functions.https.HttpsError('invalid-argument', 'Datos inválidos');
    }
    const gastoId = `GASTO-${Date.now()}`;
    const userId = context.auth.uid;
    const ahora = FieldValue.serverTimestamp();
    try {
        await db.runTransaction(async (transaction) => {
            await ensureBancoExists(transaction, data.bancoOrigen);
            const bancoRef = db.collection('bancos').doc(data.bancoOrigen);
            const bancoDoc = await transaction.get(bancoRef);
            const capitalActual = bancoDoc.data()?.capitalActual || 0;
            if (capitalActual < data.monto) {
                throw new Error(`Fondos insuficientes. Capital: $${capitalActual}`);
            }
            await actualizarBanco(transaction, data.bancoOrigen, 'gasto', data.monto, data.concepto, gastoId, userId);
            // Registrar gasto
            const gastoRef = db.collection('gastos').doc(gastoId);
            transaction.set(gastoRef, {
                id: gastoId,
                bancoId: data.bancoOrigen,
                monto: data.monto,
                concepto: data.concepto,
                categoria: data.categoria || 'General',
                usuarioId: userId,
                fecha: ahora,
                createdAt: ahora,
            });
        });
        return { success: true, gastoId };
    }
    catch (error) {
        console.error('[registrarGasto] Error:', error);
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Error al registrar gasto');
    }
});
// ═══════════════════════════════════════════════════════════════════════════════
// 7. REGISTRAR INGRESO MANUAL (ATÓMICA) - Solo azteca, leftie, profit
// ═══════════════════════════════════════════════════════════════════════════════
exports.registrarIngreso = functions
    .region('us-central1')
    .runWith({ memory: '256MB', timeoutSeconds: 30 })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    // Solo bancos operativos pueden recibir ingresos manuales
    const bancosPermitidos = ['azteca', 'leftie', 'profit'];
    if (!bancosPermitidos.includes(data.bancoDestino)) {
        throw new functions.https.HttpsError('permission-denied', 'Solo Azteca, Leftie y Profit pueden recibir ingresos manuales');
    }
    if (data.monto <= 0 || !data.concepto) {
        throw new functions.https.HttpsError('invalid-argument', 'Datos inválidos');
    }
    const ingresoId = `ING-${Date.now()}`;
    const userId = context.auth.uid;
    const ahora = FieldValue.serverTimestamp();
    try {
        await db.runTransaction(async (transaction) => {
            await actualizarBanco(transaction, data.bancoDestino, 'ingreso', data.monto, data.concepto, ingresoId, userId);
            // Registrar ingreso
            const ingresoRef = db.collection('ingresos').doc(ingresoId);
            transaction.set(ingresoRef, {
                id: ingresoId,
                bancoId: data.bancoDestino,
                monto: data.monto,
                concepto: data.concepto,
                cliente: data.cliente || '',
                categoria: data.categoria || 'General',
                usuarioId: userId,
                fecha: ahora,
                createdAt: ahora,
            });
        });
        return { success: true, ingresoId };
    }
    catch (error) {
        console.error('[registrarIngreso] Error:', error);
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Error al registrar ingreso');
    }
});
//# sourceMappingURL=index.js.map