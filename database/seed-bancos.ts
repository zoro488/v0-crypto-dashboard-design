// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — SEED BANCOS
// Datos iniciales de los 7 bancos del sistema
// 
// DISTRIBUCIÓN AUTOMÁTICA DE VENTAS (GYA - INMUTABLE):
// - boveda_monte = precioCompra × cantidad (COSTO)
// - flete_sur = precioFlete × cantidad (TRANSPORTE)
// - utilidades = (precioVenta - precioCompra - precioFlete) × cantidad (GANANCIA)
// ═══════════════════════════════════════════════════════════════

import { db } from '@/database'
import { bancos } from '@/database/schema'
import { logger } from '@/app/_lib/utils/logger'

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export type BancoId = 
  | 'boveda_monte'
  | 'boveda_usa'
  | 'profit'
  | 'leftie'
  | 'azteca'
  | 'flete_sur'
  | 'utilidades'

export interface BancoSeedData {
  id: BancoId
  nombre: string
  tipo: 'operativo' | 'inversion' | 'ahorro'
  capitalActual: number
  historicoIngresos: number
  historicoGastos: number
  color: string
  icono: string
  orden: number
  activo: boolean
  // Metadatos de personalidad para el orbe 3D
  personality: OrbPersonality
}

export interface OrbPersonality {
  apodo: string           // Nombre del personaje
  descripcion: string     // Descripción breve
  colorPrimario: string   // Color principal del orbe
  colorSecundario: string // Color secundario
  animacion: string       // Tipo de animación principal
  sonido: string          // Descripción del sonido característico
  velocidadRespiracion: number // 0.5 = muy lento, 1.0 = normal, 1.5 = rápido
  escalaDistorsion: number     // 0.1 = sutil, 0.2 = notable
  frecuenciaNoise: number      // 2.0 = suave, 4.0 = turbulento
}

// ═══════════════════════════════════════════════════════════════
// LOS 7 BANCOS OFICIALES CON PERSONALIDADES
// ═══════════════════════════════════════════════════════════════

export const BANCOS_SEED: BancoSeedData[] = [
  // ═══════════════════════════════════════════════════════════
  // 1. BÓVEDA MONTE — El Guardián Eterno
  // Recibe: precioCompra × cantidad (costo de inventario)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'boveda_monte',
    nombre: 'Bóveda Monte',
    tipo: 'operativo',
    capitalActual: 400000,
    historicoIngresos: 2500000,
    historicoGastos: 2100000,
    color: '#FFD700', // ORO
    icono: 'Vault',
    orden: 1,
    activo: true,
    personality: {
      apodo: 'El Guardián Eterno',
      descripcion: 'Oro líquido cayendo desde la cima, derramando riqueza',
      colorPrimario: '#FFD700',      // Oro puro
      colorSecundario: '#B8860B',    // Oro oscuro
      animacion: 'oro_cayendo',
      sonido: 'Respiración grave y profunda, como montaña durmiente',
      velocidadRespiracion: 0.8,
      escalaDistorsion: 0.12,
      frecuenciaNoise: 2.5,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // 2. BÓVEDA USA — El Extranjero Elegante
  // Capital en dólares para operaciones internacionales
  // ═══════════════════════════════════════════════════════════
  {
    id: 'boveda_usa',
    nombre: 'Bóveda USA',
    tipo: 'operativo',
    capitalActual: 200000,
    historicoIngresos: 800000,
    historicoGastos: 600000,
    color: '#228B22', // Verde dólar
    icono: 'DollarSign',
    orden: 2,
    activo: true,
    personality: {
      apodo: 'El Extranjero Elegante',
      descripcion: 'Oro con destellos verdes, bandera ondeando sutilmente',
      colorPrimario: '#FFD700',      // Oro
      colorSecundario: '#228B22',    // Verde bosque
      animacion: 'billetes_flotando',
      sonido: 'Himno lejano, monedas cayendo suavemente',
      velocidadRespiracion: 0.9,
      escalaDistorsion: 0.14,
      frecuenciaNoise: 2.8,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // 3. PROFIT — El Visionario (EMPERADOR - Centro de todo)
  // Ganancias acumuladas para reinversión estratégica
  // ═══════════════════════════════════════════════════════════
  {
    id: 'profit',
    nombre: 'Profit',
    tipo: 'inversion',
    capitalActual: 120000,
    historicoIngresos: 500000,
    historicoGastos: 380000,
    color: '#8B00FF', // Violeta imperial
    icono: 'TrendingUp',
    orden: 3,
    activo: true,
    personality: {
      apodo: 'El Visionario',
      descripcion: 'El emperador del sistema, violeta con destellos dorados',
      colorPrimario: '#8B00FF',      // Violeta imperial
      colorSecundario: '#FFD700',    // Oro
      animacion: 'fuegos_artificiales',
      sonido: 'Fanfarria triunfal, trompetas doradas',
      velocidadRespiracion: 1.1,
      escalaDistorsion: 0.16,
      frecuenciaNoise: 3.2,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // 4. LEFTIE — El Rey Noble
  // Fondo de reserva y emergencias
  // ═══════════════════════════════════════════════════════════
  {
    id: 'leftie',
    nombre: 'Leftie',
    tipo: 'ahorro',
    capitalActual: 80000,
    historicoIngresos: 300000,
    historicoGastos: 220000,
    color: '#FFD700', // Oro brillante
    icono: 'Crown',
    orden: 4,
    activo: true,
    personality: {
      apodo: 'El Rey Noble',
      descripcion: 'Corona dorada flotante, cetro de luz',
      colorPrimario: '#FFD700',      // Oro brillante
      colorSecundario: '#FFF8DC',    // Cornsilk
      animacion: 'corona_flotando',
      sonido: 'Campanas de palacio, eco majestuoso',
      velocidadRespiracion: 1.0,
      escalaDistorsion: 0.18,
      frecuenciaNoise: 3.0,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // 5. AZTECA — El Sabio Anciano
  // Cuenta bancaria principal
  // ═══════════════════════════════════════════════════════════
  {
    id: 'azteca',
    nombre: 'Azteca',
    tipo: 'operativo',
    capitalActual: 150000,
    historicoIngresos: 1200000,
    historicoGastos: 1050000,
    color: '#8B0000', // Rojo sangre ancestral
    icono: 'Pyramid',
    orden: 5,
    activo: true,
    personality: {
      apodo: 'El Sabio Anciano',
      descripcion: 'Grietas doradas en superficie roja, sangre de imperio',
      colorPrimario: '#8B0000',      // Rojo sangre
      colorSecundario: '#FFD700',    // Oro
      animacion: 'grietas_brillantes',
      sonido: 'Tambores ancestrales, viento del desierto',
      velocidadRespiracion: 0.6,
      escalaDistorsion: 0.1,
      frecuenciaNoise: 2.0,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // 6. FLETE SUR — El Guerrero Veloz
  // Recibe: precioFlete × cantidad (transporte)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'flete_sur',
    nombre: 'Flete Sur',
    tipo: 'operativo',
    capitalActual: 0,  // Empieza en 0, se llena con fletes
    historicoIngresos: 180000,
    historicoGastos: 180000,
    color: '#8B00FF', // Violeta plasma
    icono: 'Truck',
    orden: 6,
    activo: true,
    personality: {
      apodo: 'El Guerrero Veloz',
      descripcion: 'Líneas de velocidad violeta, plasma eléctrico',
      colorPrimario: '#8B00FF',      // Violeta plasma
      colorSecundario: '#4B0082',    // Índigo profundo
      animacion: 'lineas_velocidad',
      sonido: 'Motor turbo, relámpagos cercanos',
      velocidadRespiracion: 1.2,
      escalaDistorsion: 0.15,
      frecuenciaNoise: 3.5,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // 7. UTILIDADES — La Diva Celebrante
  // Recibe: (precioVenta - precioCompra - precioFlete) × cantidad
  // ═══════════════════════════════════════════════════════════
  {
    id: 'utilidades',
    nombre: 'Utilidades',
    tipo: 'inversion',
    capitalActual: 0,  // Empieza en 0, acumula ganancias netas
    historicoIngresos: 450000,
    historicoGastos: 450000,
    color: '#FF1493', // Rosa eléctrico
    icono: 'Sparkles',
    orden: 7,
    activo: true,
    personality: {
      apodo: 'La Diva Celebrante',
      descripcion: 'Rosa eléctrico con explosiones doradas, fiesta eterna',
      colorPrimario: '#FF1493',      // Rosa eléctrico
      colorSecundario: '#FFD700',    // Oro
      animacion: 'explosion_particulas',
      sonido: 'Champagne descorchando, aplausos, confeti',
      velocidadRespiracion: 1.5,
      escalaDistorsion: 0.2,
      frecuenciaNoise: 4.0,
    },
  },
]

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN DE SEED
// ═══════════════════════════════════════════════════════════════

export async function seedBancos(): Promise<void> {
  try {
    logger.info('🏦 Iniciando seed de bancos...', { context: 'seed-bancos' })
    
    for (const banco of BANCOS_SEED) {
      await db.insert(bancos).values({
        id: banco.id,
        nombre: banco.nombre,
        tipo: banco.tipo,
        capitalActual: banco.capitalActual,
        historicoIngresos: banco.historicoIngresos,
        historicoGastos: banco.historicoGastos,
        color: banco.color,
        icono: banco.icono,
        orden: banco.orden,
        activo: banco.activo,
      }).onConflictDoUpdate({
        target: bancos.id,
        set: {
          capitalActual: banco.capitalActual,
          historicoIngresos: banco.historicoIngresos,
          historicoGastos: banco.historicoGastos,
        },
      })
      
      logger.info(`✅ Banco ${banco.nombre} (${banco.personality.apodo}) insertado`, {
        context: 'seed-bancos',
        data: { id: banco.id, capital: banco.capitalActual },
      })
    }
    
    logger.info('🎉 Seed de bancos completado exitosamente', { context: 'seed-bancos' })
  } catch (error) {
    logger.error('❌ Error en seed de bancos', error, { context: 'seed-bancos' })
    throw error
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Obtener personalidad de orbe por ID de banco
 */
export function getOrbPersonality(bancoId: BancoId): OrbPersonality | undefined {
  const banco = BANCOS_SEED.find(b => b.id === bancoId)
  return banco?.personality
}

/**
 * Obtener todos los bancos con sus personalidades
 */
export function getAllBancosWithPersonalities(): BancoSeedData[] {
  return BANCOS_SEED
}

/**
 * Obtener banco por ID
 */
export function getBancoById(bancoId: BancoId): BancoSeedData | undefined {
  return BANCOS_SEED.find(b => b.id === bancoId)
}

/**
 * Obtener los 3 bancos que reciben distribución automática de ventas
 */
export function getBancosDistribucion(): BancoSeedData[] {
  return BANCOS_SEED.filter(b => 
    b.id === 'boveda_monte' || 
    b.id === 'flete_sur' || 
    b.id === 'utilidades'
  )
}

/**
 * Calcular capital total del sistema
 */
export function getCapitalTotal(): number {
  return BANCOS_SEED.reduce((sum, banco) => sum + banco.capitalActual, 0)
}

// ═══════════════════════════════════════════════════════════════
// COLORES CHRONOS (CYAN PROHIBIDO)
// ═══════════════════════════════════════════════════════════════

export const CHRONOS_COLORS = {
  BLACK: '#000000',
  VIOLET: '#8B00FF',
  GOLD: '#FFD700',
  PINK: '#FF1493',
  // Secundarios permitidos
  GOLD_DARK: '#B8860B',
  INDIGO: '#4B0082',
  RED_BLOOD: '#8B0000',
  GREEN_DOLLAR: '#228B22',
  CORNSILK: '#FFF8DC',
} as const

export default BANCOS_SEED
