// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — CONFIGURACIÓN DE BANCOS / BÓVEDAS
// Los 7 bancos del sistema con sus configuraciones y personalidades
// Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
// ═══════════════════════════════════════════════════════════════

export type BancoId = 
  | 'boveda_monte'
  | 'boveda_usa'
  | 'profit'
  | 'leftie'
  | 'azteca'
  | 'flete_sur'
  | 'utilidades'

// ═══════════════════════════════════════════════════════════════
// PERSONALIDAD DEL ORBE 3D
// ═══════════════════════════════════════════════════════════════

export interface OrbPersonality {
  apodo: string           // Nombre del personaje
  descripcion: string     // Descripción breve
  animacion: string       // Tipo de animación principal
  sonido: string          // Descripción del sonido característico
  velocidadRespiracion: number // 0.5 = muy lento, 1.0 = normal, 1.5 = rápido
  escalaDistorsion: number     // 0.1 = sutil, 0.2 = notable
  frecuenciaNoise: number      // 2.0 = suave, 4.0 = turbulento
}

export interface BancoConfig {
  id: BancoId
  nombre: string
  descripcion: string
  tipo: 'operativo' | 'inversion' | 'ahorro'
  color: string           // Color principal (CHRONOS palette)
  colorSecondary: string  // Color secundario para shaders
  colorGradient: string   // Gradient para UI
  icono: string
  orden: number
  personality: OrbPersonality
}

export const BANCOS_CONFIG: Record<BancoId, BancoConfig> = {
  // ═══════════════════════════════════════════════════════════
  // BÓVEDA MONTE — El Guardián Eterno
  // Recibe: precioCompra × cantidad (costo de inventario)
  // ═══════════════════════════════════════════════════════════
  boveda_monte: {
    id: 'boveda_monte',
    nombre: 'Bóveda Monte',
    descripcion: 'Capital de compras y costos de inventario',
    tipo: 'operativo',
    color: '#FFD700',           // Oro puro
    colorSecondary: '#B8860B',  // Oro oscuro
    colorGradient: 'from-amber-500 to-yellow-600',
    icono: 'Vault',
    orden: 1,
    personality: {
      apodo: 'El Guardián Eterno',
      descripcion: 'Oro líquido cayendo desde la cima, derramando riqueza',
      animacion: 'oro_cayendo',
      sonido: 'Respiración grave y profunda, como montaña durmiente',
      velocidadRespiracion: 0.8,
      escalaDistorsion: 0.12,
      frecuenciaNoise: 2.5,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // BÓVEDA USA — El Extranjero Elegante
  // ═══════════════════════════════════════════════════════════
  boveda_usa: {
    id: 'boveda_usa',
    nombre: 'Bóveda USA',
    descripcion: 'Capital en dólares para importaciones',
    tipo: 'operativo',
    color: '#FFD700',           // Oro
    colorSecondary: '#228B22',  // Verde dólar
    colorGradient: 'from-amber-500 to-emerald-600',
    icono: 'DollarSign',
    orden: 2,
    personality: {
      apodo: 'El Extranjero Elegante',
      descripcion: 'Oro con destellos verdes, bandera ondeando sutilmente',
      animacion: 'billetes_flotando',
      sonido: 'Himno lejano, monedas cayendo suavemente',
      velocidadRespiracion: 0.9,
      escalaDistorsion: 0.14,
      frecuenciaNoise: 2.8,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // PROFIT — El Visionario (EMPERADOR - Centro de todo)
  // ═══════════════════════════════════════════════════════════
  profit: {
    id: 'profit',
    nombre: 'Profit',
    descripcion: 'Ganancias acumuladas para reinversión',
    tipo: 'inversion',
    color: '#8B00FF',           // Violeta imperial
    colorSecondary: '#FFD700',  // Oro
    colorGradient: 'from-violet-600 to-purple-700',
    icono: 'TrendingUp',
    orden: 3,
    personality: {
      apodo: 'El Visionario',
      descripcion: 'El emperador del sistema, violeta con destellos dorados',
      animacion: 'fuegos_artificiales',
      sonido: 'Fanfarria triunfal, trompetas doradas',
      velocidadRespiracion: 1.1,
      escalaDistorsion: 0.16,
      frecuenciaNoise: 3.2,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // LEFTIE — El Rey Noble
  // ═══════════════════════════════════════════════════════════
  leftie: {
    id: 'leftie',
    nombre: 'Leftie',
    descripcion: 'Fondo de reserva y emergencias',
    tipo: 'ahorro',
    color: '#FFD700',           // Oro brillante
    colorSecondary: '#FFF8DC',  // Cornsilk
    colorGradient: 'from-yellow-400 to-amber-500',
    icono: 'Crown',
    orden: 4,
    personality: {
      apodo: 'El Rey Noble',
      descripcion: 'Corona dorada flotante, cetro de luz',
      animacion: 'corona_flotando',
      sonido: 'Campanas de palacio, eco majestuoso',
      velocidadRespiracion: 1.0,
      escalaDistorsion: 0.18,
      frecuenciaNoise: 3.0,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // AZTECA — El Sabio Anciano
  // ═══════════════════════════════════════════════════════════
  azteca: {
    id: 'azteca',
    nombre: 'Azteca',
    descripcion: 'Cuenta bancaria principal Azteca',
    tipo: 'operativo',
    color: '#8B0000',           // Rojo sangre
    colorSecondary: '#FFD700',  // Oro
    colorGradient: 'from-red-700 to-red-900',
    icono: 'Pyramid',
    orden: 5,
    personality: {
      apodo: 'El Sabio Anciano',
      descripcion: 'Grietas doradas en superficie roja, sangre de imperio',
      animacion: 'grietas_brillantes',
      sonido: 'Tambores ancestrales, viento del desierto',
      velocidadRespiracion: 0.6,
      escalaDistorsion: 0.1,
      frecuenciaNoise: 2.0,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // FLETE SUR — El Guerrero Veloz
  // Recibe: precioFlete × cantidad (transporte)
  // ═══════════════════════════════════════════════════════════
  flete_sur: {
    id: 'flete_sur',
    nombre: 'Flete Sur',
    descripcion: 'Fondos destinados a logística y transporte',
    tipo: 'operativo',
    color: '#8B00FF',           // Violeta plasma
    colorSecondary: '#4B0082',  // Índigo
    colorGradient: 'from-violet-500 to-indigo-700',
    icono: 'Truck',
    orden: 6,
    personality: {
      apodo: 'El Guerrero Veloz',
      descripcion: 'Líneas de velocidad violeta, plasma eléctrico',
      animacion: 'lineas_velocidad',
      sonido: 'Motor turbo, relámpagos cercanos',
      velocidadRespiracion: 1.2,
      escalaDistorsion: 0.15,
      frecuenciaNoise: 3.5,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // UTILIDADES — La Diva Celebrante
  // Recibe: (precioVenta - precioCompra - precioFlete) × cantidad
  // ═══════════════════════════════════════════════════════════
  utilidades: {
    id: 'utilidades',
    nombre: 'Utilidades',
    descripcion: 'Ganancias netas después de costos',
    tipo: 'inversion',
    color: '#FF1493',           // Rosa eléctrico
    colorSecondary: '#FFD700',  // Oro
    colorGradient: 'from-pink-500 to-rose-600',
    icono: 'Sparkles',
    orden: 7,
    personality: {
      apodo: 'La Diva Celebrante',
      descripcion: 'Rosa eléctrico con explosiones doradas, fiesta eterna',
      animacion: 'explosion_particulas',
      sonido: 'Champagne descorchando, aplausos, confeti',
      velocidadRespiracion: 1.5,
      escalaDistorsion: 0.2,
      frecuenciaNoise: 4.0,
    },
  },
}

// ═══════════════════════════════════════════════════════════════
// HELPERS Y EXPORTS
// ═══════════════════════════════════════════════════════════════

// Array ordenado para iteración
export const BANCOS_ORDENADOS = Object.values(BANCOS_CONFIG).sort((a, b) => a.orden - b.orden)

// Helper para obtener config por ID
export function getBancoConfig(id: BancoId): BancoConfig {
  return BANCOS_CONFIG[id]
}

// Obtener personalidad de orbe por ID
export function getOrbPersonality(id: BancoId): OrbPersonality {
  return BANCOS_CONFIG[id].personality
}

// Tipos de banco para filtros
export const TIPOS_BANCO = ['operativo', 'inversion', 'ahorro'] as const
export type TipoBanco = typeof TIPOS_BANCO[number]

// Colores por tipo (actualizados a paleta CHRONOS)
export const COLORES_TIPO_BANCO: Record<TipoBanco, string> = {
  operativo: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  inversion: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  ahorro: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
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

// ═══════════════════════════════════════════════════════════════
// DISTRIBUCIÓN DE VENTAS (GYA - INMUTABLE)
// ═══════════════════════════════════════════════════════════════

export const BANCOS_DISTRIBUCION = {
  COSTO: 'boveda_monte' as BancoId,       // precioCompra × cantidad
  TRANSPORTE: 'flete_sur' as BancoId,     // precioFlete × cantidad
  GANANCIA: 'utilidades' as BancoId,      // (precioVenta - precioCompra - precioFlete) × cantidad
} as const
