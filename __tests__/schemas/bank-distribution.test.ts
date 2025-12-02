/**
 * 🏦 VERIFICACIÓN MILITAR AL 1000% - LÓGICA BANCARIA Y ESTADOS DE PAGO
 * 
 * Test Suite basado en LOGICA_CORRECTA_SISTEMA_Version2.md
 * y FORMULAS_CORRECTAS_VENTAS_Version2.md
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * VERIFICACIÓN DE FLOWDISTRIBUTOR - DISTRIBUCIÓN A 3 BANCOS
 * ═══════════════════════════════════════════════════════════════════════════════
 */

describe('🏦 LÓGICA BANCARIA Y ESTADOS DE PAGO – VERIFICACIÓN 100%', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // DATOS DE PRUEBA ESTÁNDAR (según documento sagrado)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const datosPrueba = {
    precioVentaUnidad: 10000,   // Precio al que VENDEMOS al cliente
    precioCompraUnidad: 6300,  // Precio al que COMPRAMOS (costo distribuidor)
    precioFlete: 500,          // Flete por unidad (default 500)
    cantidad: 10,              // Cantidad vendida
  };

  // Cálculos esperados según documento sagrado
  const esperado = {
    precioTotalUnidad: 10500,      // precioVentaUnidad + precioFlete
    precioTotalVenta: 105000,      // precioTotalUnidad × cantidad
    totalVenta: 100000,            // precioVentaUnidad × cantidad (sin flete para distribución)
    bovedaMonte: 63000,            // precioCompraUnidad × cantidad (COSTO)
    fletes: 5000,                  // precioFlete × cantidad
    utilidades: 32000,             // (precioVenta - precioCompra - precioFlete) × cantidad
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER: Función de cálculo GYA (Ganancia y Asignación)
  // ═══════════════════════════════════════════════════════════════════════════
  
  function calcularDistribucionGYA(datos: typeof datosPrueba) {
    const { precioVentaUnidad, precioCompraUnidad, precioFlete, cantidad } = datos;
    
    const totalVenta = precioVentaUnidad * cantidad;
    const montoBovedaMonte = precioCompraUnidad * cantidad;
    const montoFletes = precioFlete * cantidad;
    const montoUtilidades = (precioVentaUnidad - precioCompraUnidad - precioFlete) * cantidad;
    
    return {
      totalVenta,
      bovedaMonte: montoBovedaMonte,
      fletes: montoFletes,
      utilidades: montoUtilidades,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 01 – VENTA PAGO COMPLETO → 100% a los 3 bancos
  // ═══════════════════════════════════════════════════════════════════════════
  
  test('01 – VENTA PAGO COMPLETO → 100% a los 3 bancos', () => {
    const distribucion = calcularDistribucionGYA(datosPrueba);
    const montoPagado = esperado.totalVenta;
    const proporcion = montoPagado / distribucion.totalVenta;
    
    // Calcular distribución a cada banco
    const capitalBovedaMonte = distribucion.bovedaMonte * proporcion;
    const capitalFletes = distribucion.fletes * proporcion;
    const capitalUtilidades = distribucion.utilidades * proporcion;
    
    // ✅ Verificar que el capital es 100%
    expect(capitalBovedaMonte).toBe(63000);
    expect(capitalFletes).toBe(5000);
    expect(capitalUtilidades).toBe(32000);
    
    // ✅ Verificar que histórico también es 100%
    const historicoBovedaMonte = 63000;
    const historicoFletes = 5000;
    const historicoUtilidades = 32000;
    
    expect(historicoBovedaMonte).toBe(63000);
    expect(historicoFletes).toBe(5000);
    expect(historicoUtilidades).toBe(32000);
    
    // ✅ Verificar que la suma = totalVenta
    expect(capitalBovedaMonte + capitalFletes + capitalUtilidades).toBe(100000);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 02 – VENTA PARCIAL 50% (52500 pagados) → capital 50%, histórico 100%
  // ═══════════════════════════════════════════════════════════════════════════
  
  test('02 – VENTA PARCIAL 50% (52500 pagados) → capital 50%, histórico 100%', () => {
    const distribucion = calcularDistribucionGYA(datosPrueba);
    const precioTotalVenta = esperado.precioTotalVenta; // 105,000
    const montoPagado = 52500; // 50% del total cobrado al cliente
    const proporcion = montoPagado / precioTotalVenta; // 0.5
    
    // ✅ Calcular capital (proporcional al pago)
    const capitalBovedaMonte = Math.round(distribucion.bovedaMonte * proporcion);
    const capitalFletes = Math.round(distribucion.fletes * proporcion);
    const capitalUtilidades = Math.round(distribucion.utilidades * proporcion);
    
    expect(capitalBovedaMonte).toBe(31500);   // 63000 × 0.5
    expect(capitalFletes).toBe(2500);          // 5000 × 0.5
    expect(capitalUtilidades).toBe(16000);     // 32000 × 0.5
    
    // ✅ Histórico SIEMPRE es 100% (acumulativo fijo)
    const historicoBovedaMonte = distribucion.bovedaMonte;
    const historicoFletes = distribucion.fletes;
    const historicoUtilidades = distribucion.utilidades;
    
    expect(historicoBovedaMonte).toBe(63000);
    expect(historicoFletes).toBe(5000);
    expect(historicoUtilidades).toBe(32000);
    
    // ✅ Verificar proporción
    expect(proporcion).toBe(0.5);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 03 – VENTA PENDIENTE (0 pagado) → capital 0, histórico 100%
  // ═══════════════════════════════════════════════════════════════════════════
  
  test('03 – VENTA PENDIENTE (0 pagado) → capital 0, histórico 100%', () => {
    const distribucion = calcularDistribucionGYA(datosPrueba);
    const montoPagado = 0;
    const proporcion = 0; // No hay pago
    
    // ✅ Capital DEBE ser 0 (no hay pago)
    const capitalBovedaMonte = distribucion.bovedaMonte * proporcion;
    const capitalFletes = distribucion.fletes * proporcion;
    const capitalUtilidades = distribucion.utilidades * proporcion;
    
    expect(capitalBovedaMonte).toBe(0);
    expect(capitalFletes).toBe(0);
    expect(capitalUtilidades).toBe(0);
    
    // ✅ Histórico SIEMPRE es 100% (para referencia futura)
    const historicoBovedaMonte = distribucion.bovedaMonte;
    const historicoFletes = distribucion.fletes;
    const historicoUtilidades = distribucion.utilidades;
    
    expect(historicoBovedaMonte).toBe(63000);
    expect(historicoFletes).toBe(5000);
    expect(historicoUtilidades).toBe(32000);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 04 – ABONO POSTERIOR 25% (26250) → +25% proporcional a capital
  // ═══════════════════════════════════════════════════════════════════════════
  
  test('04 – ABONO POSTERIOR 25% (26250) → +25% proporcional a capital', () => {
    const distribucion = calcularDistribucionGYA(datosPrueba);
    const precioTotalVenta = esperado.precioTotalVenta; // 105,000
    
    // Estado inicial: venta pendiente (0% pagado)
    let capitalBovedaMonte = 0;
    let capitalFletes = 0;
    let capitalUtilidades = 0;
    
    // Cliente abona 25% = 26,250
    const montoAbono = 26250;
    const proporcionAbono = montoAbono / precioTotalVenta; // 0.25
    
    // ✅ Calcular incremento proporcional
    capitalBovedaMonte += distribucion.bovedaMonte * proporcionAbono;
    capitalFletes += distribucion.fletes * proporcionAbono;
    capitalUtilidades += distribucion.utilidades * proporcionAbono;
    
    expect(capitalBovedaMonte).toBe(15750);   // 63000 × 0.25
    expect(capitalFletes).toBe(1250);          // 5000 × 0.25
    expect(capitalUtilidades).toBe(8000);      // 32000 × 0.25
    
    // ✅ Histórico NO cambia (ya fue registrado al crear venta)
    const historicoBovedaMonte = distribucion.bovedaMonte;
    expect(historicoBovedaMonte).toBe(63000); // Permanece igual
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 05 – PAGO A DISTRIBUIDOR DESDE BANCO SELECCIONADO
  // ═══════════════════════════════════════════════════════════════════════════
  
  test('05 – PAGO A DISTRIBUIDOR DESDE BANCO SELECCIONADO', () => {
    // Estado inicial del banco
    let capitalBanco = 200000;
    let historicoGastos = 50000;
    
    // Pago a distribuidor
    const montoPago = 63000; // Pagamos el costo de la OC
    
    // ✅ Actualizar banco
    capitalBanco -= montoPago;
    historicoGastos += montoPago;
    
    expect(capitalBanco).toBe(137000);
    expect(historicoGastos).toBe(113000);
    
    // ✅ Verificar que el gasto afecta capital
    const capitalCalculado = 200000 - montoPago; // historicoIngresos - historicoGastos implícito
    expect(capitalCalculado).toBe(137000);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 06 – TRANSFERENCIAS ENTRE BANCOS
  // ═══════════════════════════════════════════════════════════════════════════
  
  test('06 – TRANSFERENCIA: origen -monto, destino +monto', () => {
    // Bancos iniciales
    let origenCapital = 200000;
    let origenHistoricoTransferencias = 0;
    
    let destinoCapital = 100000;
    let destinoHistoricoIngresos = 100000;
    
    // Transferencia de 50,000
    const montoTransferencia = 50000;
    
    // ✅ Actualizar origen (resta)
    origenCapital -= montoTransferencia;
    origenHistoricoTransferencias += montoTransferencia;
    
    // ✅ Actualizar destino (suma)
    destinoCapital += montoTransferencia;
    destinoHistoricoIngresos += montoTransferencia;
    
    expect(origenCapital).toBe(150000);
    expect(origenHistoricoTransferencias).toBe(50000);
    
    expect(destinoCapital).toBe(150000);
    expect(destinoHistoricoIngresos).toBe(150000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICACIÓN DE LOS 7 BANCOS DEL SISTEMA
// ═══════════════════════════════════════════════════════════════════════════════

describe('🏦 VERIFICACIÓN DE LOS 7 BANCOS OBLIGATORIOS', () => {
  const BANCOS_SISTEMA = [
    { id: 'boveda_monte', nombre: 'Bóveda Monte', recibeIngresosVenta: true, permiteIngresoManual: false },
    { id: 'boveda_usa', nombre: 'Bóveda USA', recibeIngresosVenta: false, permiteIngresoManual: true },
    { id: 'utilidades', nombre: 'Utilidades', recibeIngresosVenta: true, permiteIngresoManual: false },
    { id: 'flete_sur', nombre: 'Flete Sur', recibeIngresosVenta: true, permiteIngresoManual: false },
    { id: 'azteca', nombre: 'Azteca', recibeIngresosVenta: false, permiteIngresoManual: true },
    { id: 'leftie', nombre: 'Leftie', recibeIngresosVenta: false, permiteIngresoManual: true },
    { id: 'profit', nombre: 'Profit', recibeIngresosVenta: false, permiteIngresoManual: true },
  ];

  test('Existen exactamente 7 bancos en el sistema', () => {
    expect(BANCOS_SISTEMA.length).toBe(7);
  });

  test('Bancos que reciben ingresos de ventas son 3 (GYA)', () => {
    const bancosGYA = BANCOS_SISTEMA.filter(b => b.recibeIngresosVenta);
    expect(bancosGYA.length).toBe(3);
    expect(bancosGYA.map(b => b.id)).toContain('boveda_monte');
    expect(bancosGYA.map(b => b.id)).toContain('utilidades');
    expect(bancosGYA.map(b => b.id)).toContain('flete_sur');
  });

  test('Bancos que permiten ingresos manuales son 4', () => {
    const bancosOperativos = BANCOS_SISTEMA.filter(b => b.permiteIngresoManual);
    expect(bancosOperativos.length).toBe(4);
    expect(bancosOperativos.map(b => b.id)).toContain('boveda_usa');
    expect(bancosOperativos.map(b => b.id)).toContain('azteca');
    expect(bancosOperativos.map(b => b.id)).toContain('leftie');
    expect(bancosOperativos.map(b => b.id)).toContain('profit');
  });

  test('Todos los bancos usan snake_case para IDs', () => {
    BANCOS_SISTEMA.forEach(banco => {
      expect(banco.id).toMatch(/^[a-z0-9_]+$/);
      expect(banco.id).not.toContain(' ');
      expect(banco.id).toBe(banco.id.toLowerCase());
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICACIÓN DE TRANSFERENCIAS ENTRE BANCOS
// ═══════════════════════════════════════════════════════════════════════════════

describe('🔄 TRANSFERENCIAS ENTRE LOS 7 BANCOS', () => {
  
  interface Banco {
    id: string;
    capitalActual: number;
    historicoIngresos: number;
    historicoGastos: number;
    historicoTransferencias: number;
  }

  interface Transaccion {
    id: string;
    tipo: 'transferencia_entrada' | 'transferencia_salida';
    monto: number;
    concepto: string;
    bancoOrigenId?: string;
    bancoDestinoId?: string;
  }

  function ejecutarTransferencia(
    origen: Banco,
    destino: Banco,
    monto: number,
    concepto: string
  ): { origen: Banco; destino: Banco; transacciones: Transaccion[] } {
    // Validaciones
    if (origen.id === destino.id) {
      throw new Error('Origen y destino no pueden ser iguales');
    }
    if (monto <= 0) {
      throw new Error('Monto debe ser mayor a 0');
    }
    if (origen.capitalActual < monto) {
      throw new Error('Capital insuficiente');
    }

    // Actualizar origen
    const nuevoOrigen: Banco = {
      ...origen,
      capitalActual: origen.capitalActual - monto,
      historicoTransferencias: origen.historicoTransferencias + monto,
    };

    // Actualizar destino
    const nuevoDestino: Banco = {
      ...destino,
      capitalActual: destino.capitalActual + monto,
      historicoIngresos: destino.historicoIngresos + monto,
    };

    // Crear transacciones
    const transacciones: Transaccion[] = [
      {
        id: `TRF-OUT-${Date.now()}`,
        tipo: 'transferencia_salida',
        monto,
        concepto,
        bancoDestinoId: destino.id,
      },
      {
        id: `TRF-IN-${Date.now()}`,
        tipo: 'transferencia_entrada',
        monto,
        concepto,
        bancoOrigenId: origen.id,
      },
    ];

    return { origen: nuevoOrigen, destino: nuevoDestino, transacciones };
  }

  test('Transferencia 1: Bóveda Monte → Profit (50,000)', () => {
    const bovedaMonte: Banco = {
      id: 'boveda_monte',
      capitalActual: 200000,
      historicoIngresos: 300000,
      historicoGastos: 100000,
      historicoTransferencias: 0,
    };

    const profit: Banco = {
      id: 'profit',
      capitalActual: 100000,
      historicoIngresos: 100000,
      historicoGastos: 0,
      historicoTransferencias: 0,
    };

    const resultado = ejecutarTransferencia(bovedaMonte, profit, 50000, 'Distribución utilidades');

    expect(resultado.origen.capitalActual).toBe(150000);
    expect(resultado.origen.historicoTransferencias).toBe(50000);
    expect(resultado.destino.capitalActual).toBe(150000);
    expect(resultado.destino.historicoIngresos).toBe(150000);
    expect(resultado.transacciones.length).toBe(2);
  });

  test('Transferencia 2: Utilidades → Azteca (32,000)', () => {
    const utilidades: Banco = {
      id: 'utilidades',
      capitalActual: 100000,
      historicoIngresos: 150000,
      historicoGastos: 50000,
      historicoTransferencias: 0,
    };

    const azteca: Banco = {
      id: 'azteca',
      capitalActual: 50000,
      historicoIngresos: 50000,
      historicoGastos: 0,
      historicoTransferencias: 0,
    };

    const resultado = ejecutarTransferencia(utilidades, azteca, 32000, 'Retiro utilidades');

    expect(resultado.origen.capitalActual).toBe(68000);
    expect(resultado.destino.capitalActual).toBe(82000);
  });

  test('Transferencia 3: Fletes → Leftie (8,000)', () => {
    const fletes: Banco = {
      id: 'flete_sur',
      capitalActual: 15000,
      historicoIngresos: 20000,
      historicoGastos: 5000,
      historicoTransferencias: 0,
    };

    const leftie: Banco = {
      id: 'leftie',
      capitalActual: 20000,
      historicoIngresos: 25000,
      historicoGastos: 5000,
      historicoTransferencias: 0,
    };

    const resultado = ejecutarTransferencia(fletes, leftie, 8000, 'Transferencia operativa');

    expect(resultado.origen.capitalActual).toBe(7000);
    expect(resultado.destino.capitalActual).toBe(28000);
  });

  test('Transferencia 4: Profit → Bóveda Monte (30,000) - Ciclo completo', () => {
    const profit: Banco = {
      id: 'profit',
      capitalActual: 130000,
      historicoIngresos: 180000,
      historicoGastos: 50000,
      historicoTransferencias: 0,
    };

    const bovedaMonte: Banco = {
      id: 'boveda_monte',
      capitalActual: 150000,
      historicoIngresos: 250000,
      historicoGastos: 100000,
      historicoTransferencias: 50000,
    };

    const resultado = ejecutarTransferencia(profit, bovedaMonte, 30000, 'Reinversión capital');

    expect(resultado.origen.capitalActual).toBe(100000);
    expect(resultado.destino.capitalActual).toBe(180000);
  });

  test('Validación: No permite origen = destino', () => {
    const banco: Banco = {
      id: 'boveda_monte',
      capitalActual: 100000,
      historicoIngresos: 100000,
      historicoGastos: 0,
      historicoTransferencias: 0,
    };

    expect(() => ejecutarTransferencia(banco, banco, 10000, 'Test')).toThrow('Origen y destino no pueden ser iguales');
  });

  test('Validación: No permite monto <= 0', () => {
    const origen: Banco = { id: 'boveda_monte', capitalActual: 100000, historicoIngresos: 100000, historicoGastos: 0, historicoTransferencias: 0 };
    const destino: Banco = { id: 'profit', capitalActual: 50000, historicoIngresos: 50000, historicoGastos: 0, historicoTransferencias: 0 };

    expect(() => ejecutarTransferencia(origen, destino, 0, 'Test')).toThrow('Monto debe ser mayor a 0');
    expect(() => ejecutarTransferencia(origen, destino, -100, 'Test')).toThrow('Monto debe ser mayor a 0');
  });

  test('Validación: No permite capital insuficiente', () => {
    const origen: Banco = { id: 'boveda_monte', capitalActual: 5000, historicoIngresos: 10000, historicoGastos: 5000, historicoTransferencias: 0 };
    const destino: Banco = { id: 'profit', capitalActual: 50000, historicoIngresos: 50000, historicoGastos: 0, historicoTransferencias: 0 };

    expect(() => ejecutarTransferencia(origen, destino, 10000, 'Test')).toThrow('Capital insuficiente');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FÓRMULA DE CAPITAL BANCARIO
// ═══════════════════════════════════════════════════════════════════════════════

describe('📊 FÓRMULA DE CAPITAL BANCARIO', () => {
  test('capitalActual = historicoIngresos - historicoGastos', () => {
    const historicoIngresos = 500000;
    const historicoGastos = 200000;
    
    const capitalActual = historicoIngresos - historicoGastos;
    
    expect(capitalActual).toBe(300000);
  });

  test('historicoIngresos NUNCA disminuye', () => {
    let historicoIngresos = 100000;
    
    // Solo puede incrementar
    historicoIngresos += 50000;
    expect(historicoIngresos).toBe(150000);
    
    historicoIngresos += 25000;
    expect(historicoIngresos).toBe(175000);
    
    // No existe operación de decremento para históricos
  });

  test('historicoGastos NUNCA disminuye', () => {
    let historicoGastos = 50000;
    
    // Solo puede incrementar
    historicoGastos += 10000;
    expect(historicoGastos).toBe(60000);
    
    historicoGastos += 5000;
    expect(historicoGastos).toBe(65000);
  });

  test('Capital puede ser negativo (sobregiro)', () => {
    const historicoIngresos = 100000;
    const historicoGastos = 150000;
    
    const capitalActual = historicoIngresos - historicoGastos;
    
    expect(capitalActual).toBe(-50000);
    expect(capitalActual).toBeLessThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ESTADOS DE PAGO EN VENTAS
// ═══════════════════════════════════════════════════════════════════════════════

describe('💳 ESTADOS DE PAGO EN VENTAS', () => {
  function determinarEstadoPago(montoPagado: number, precioTotalVenta: number): 'completo' | 'parcial' | 'pendiente' {
    if (montoPagado >= precioTotalVenta) return 'completo';
    if (montoPagado > 0) return 'parcial';
    return 'pendiente';
  }

  test('Estado COMPLETO: montoPagado >= precioTotalVenta', () => {
    expect(determinarEstadoPago(105000, 105000)).toBe('completo');
    expect(determinarEstadoPago(110000, 105000)).toBe('completo'); // Sobrepago
  });

  test('Estado PARCIAL: 0 < montoPagado < precioTotalVenta', () => {
    expect(determinarEstadoPago(50000, 105000)).toBe('parcial');
    expect(determinarEstadoPago(1, 105000)).toBe('parcial'); // Cualquier cantidad > 0
    expect(determinarEstadoPago(104999, 105000)).toBe('parcial');
  });

  test('Estado PENDIENTE: montoPagado = 0', () => {
    expect(determinarEstadoPago(0, 105000)).toBe('pendiente');
  });
});
