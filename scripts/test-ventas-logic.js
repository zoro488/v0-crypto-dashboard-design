#!/usr/bin/env node

/**
 * 🧪 TEST RÁPIDO DE LÓGICA DE VENTAS
 * 
 * Script para validar manualmente las fórmulas de distribución GYA
 * SIN ejecutar nada en Firestore (solo cálculos matemáticos)
 */

console.log('🧪 VERIFICACIÓN DE FÓRMULAS DE DISTRIBUCIÓN GYA\n')
console.log('=' .repeat(70))
console.log()

// ===================================================================
// FUNCIONES DE CÁLCULO (Réplica de firestore-service.ts)
// ===================================================================

function calcularDistribucion(ventaInput) {
  const {
    cantidad,
    precioVenta,
    precioCompra,
    precioFlete,
    montoPagado,
  } = ventaInput

  // Totales
  const totalVenta = precioVenta * cantidad
  const montoRestante = totalVenta - montoPagado

  // Distribución GYA
  const montoBovedaMonte = precioCompra * cantidad
  const montoFlete = precioFlete * cantidad
  const montoUtilidad = (precioVenta - precioCompra - precioFlete) * cantidad

  // Estado de pago
  let estadoPago = 'pendiente'
  if (montoPagado >= totalVenta) estadoPago = 'completo'
  else if (montoPagado > 0) estadoPago = 'parcial'

  // Proporción pagada
  const proporcionPagada = totalVenta > 0 ? montoPagado / totalVenta : 0

  // Montos reales que van a bancos (proporcional al pago)
  const montoBovedaMonteReal = montoBovedaMonte * proporcionPagada
  const montoFleteReal = montoFlete * proporcionPagada
  const montoUtilidadReal = montoUtilidad * proporcionPagada

  return {
    totalVenta,
    montoPagado,
    montoRestante,
    estadoPago,
    proporcionPagada: (proporcionPagada * 100).toFixed(2) + '%',
    distribucion: {
      bovedaMonte: montoBovedaMonte,
      fletes: montoFlete,
      utilidades: montoUtilidad,
    },
    capitalActualizado: {
      bovedaMonte: montoBovedaMonteReal,
      fletes: montoFleteReal,
      utilidades: montoUtilidadReal,
      total: montoBovedaMonteReal + montoFleteReal + montoUtilidadReal,
    },
  }
}

function formatMoney(value) {
  return `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

function printResultado(titulo, venta, resultado) {
  console.log(`\n📊 ${titulo}`)
  console.log('-'.repeat(70))
  console.log(`  Cantidad: ${venta.cantidad} unidades`)
  console.log(`  Precio Venta: ${formatMoney(venta.precioVenta)} / unidad`)
  console.log(`  Precio Compra: ${formatMoney(venta.precioCompra)} / unidad`)
  console.log(`  Flete: ${formatMoney(venta.precioFlete)} / unidad`)
  console.log(`  Monto Pagado: ${formatMoney(venta.montoPagado)}`)
  console.log()
  console.log(`  ✅ Total Venta: ${formatMoney(resultado.totalVenta)}`)
  console.log(`  💰 Monto Pendiente: ${formatMoney(resultado.montoRestante)}`)
  console.log(`  📈 Estado Pago: ${resultado.estadoPago.toUpperCase()} (${resultado.proporcionPagada})`)
  console.log()
  console.log(`  📦 DISTRIBUCIÓN GYA (Conceptual):`)
  console.log(`     - Bóveda Monte: ${formatMoney(resultado.distribucion.bovedaMonte)}`)
  console.log(`     - Fletes: ${formatMoney(resultado.distribucion.fletes)}`)
  console.log(`     - Utilidades: ${formatMoney(resultado.distribucion.utilidades)}`)
  console.log()
  console.log(`  💵 CAPITAL ACTUALIZADO (Real):`)
  console.log(`     - Bóveda Monte: ${formatMoney(resultado.capitalActualizado.bovedaMonte)}`)
  console.log(`     - Fletes: ${formatMoney(resultado.capitalActualizado.fletes)}`)
  console.log(`     - Utilidades: ${formatMoney(resultado.capitalActualizado.utilidades)}`)
  console.log(`     - TOTAL A BANCOS: ${formatMoney(resultado.capitalActualizado.total)}`)
  console.log()
  
  // Validación
  const sumaDistribucion = 
    resultado.distribucion.bovedaMonte +
    resultado.distribucion.fletes +
    resultado.distribucion.utilidades
  
  const sumaCapital = resultado.capitalActualizado.total
  
  if (Math.abs(sumaDistribucion - resultado.totalVenta) < 0.01) {
    console.log(`  ✅ Distribución correcta: ${formatMoney(sumaDistribucion)} = ${formatMoney(resultado.totalVenta)}`)
  } else {
    console.log(`  ❌ ERROR: ${formatMoney(sumaDistribucion)} ≠ ${formatMoney(resultado.totalVenta)}`)
  }
  
  if (Math.abs(sumaCapital - venta.montoPagado) < 0.01) {
    console.log(`  ✅ Capital correcto: ${formatMoney(sumaCapital)} = ${formatMoney(venta.montoPagado)}`)
  } else {
    console.log(`  ❌ ERROR: ${formatMoney(sumaCapital)} ≠ ${formatMoney(venta.montoPagado)}`)
  }
}

// ===================================================================
// CASOS DE PRUEBA
// ===================================================================

console.log('🔍 EJECUTANDO CASOS DE PRUEBA...\n')

// CASO 1: Pago Completo
const caso1 = {
  cantidad: 10,
  precioVenta: 10000,
  precioCompra: 6300,
  precioFlete: 500,
  montoPagado: 100000, // 100%
}
const resultado1 = calcularDistribucion(caso1)
printResultado('CASO 1: Pago Completo (100%)', caso1, resultado1)

// CASO 2: Pago Parcial 50%
const caso2 = {
  cantidad: 10,
  precioVenta: 10000,
  precioCompra: 6300,
  precioFlete: 500,
  montoPagado: 50000, // 50%
}
const resultado2 = calcularDistribucion(caso2)
printResultado('CASO 2: Pago Parcial (50%)', caso2, resultado2)

// CASO 3: Pago Pendiente
const caso3 = {
  cantidad: 10,
  precioVenta: 10000,
  precioCompra: 6300,
  precioFlete: 500,
  montoPagado: 0, // 0%
}
const resultado3 = calcularDistribucion(caso3)
printResultado('CASO 3: Pago Pendiente (0%)', caso3, resultado3)

// CASO 4: Venta sin flete
const caso4 = {
  cantidad: 5,
  precioVenta: 8000,
  precioCompra: 5000,
  precioFlete: 0,
  montoPagado: 40000, // 100%
}
const resultado4 = calcularDistribucion(caso4)
printResultado('CASO 4: Sin Flete (100%)', caso4, resultado4)

// CASO 5: Pago Parcial 75%
const caso5 = {
  cantidad: 20,
  precioVenta: 15000,
  precioCompra: 10000,
  precioFlete: 800,
  montoPagado: 225000, // 75% (de 300,000)
}
const resultado5 = calcularDistribucion(caso5)
printResultado('CASO 5: Pago Parcial (75%)', caso5, resultado5)

// ===================================================================
// RESUMEN FINAL
// ===================================================================
console.log('\n' + '='.repeat(70))
console.log('✅ VERIFICACIÓN COMPLETA')
console.log('='.repeat(70))
console.log()
console.log('📌 FÓRMULAS IMPLEMENTADAS:')
console.log('   1. Bóveda Monte = Precio COMPRA × Cantidad')
console.log('   2. Fletes = Precio FLETE × Cantidad')
console.log('   3. Utilidades = (Precio VENTA - Precio COMPRA - Flete) × Cantidad')
console.log()
console.log('📌 ESTADOS DE PAGO:')
console.log('   - COMPLETO: montoPagado >= totalVenta → 100% a bancos')
console.log('   - PARCIAL: 0 < montoPagado < totalVenta → proporcional a bancos')
console.log('   - PENDIENTE: montoPagado = 0 → 0% a capitalActual (solo historicoIngresos)')
console.log()
console.log('📌 VALIDACIÓN:')
console.log('   ✅ Suma distribución = Total Venta')
console.log('   ✅ Suma capital actualizado = Monto Pagado')
console.log()
console.log('💡 Para pruebas en Firestore real, usar CreateVentaModalPremium en UI')
console.log()
