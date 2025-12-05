/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🧈 CHRONOS INFINITY 2026 - BUTTER SMOOTH EASINGS
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Los easings más suaves jamás creados para web
 * Nivel Apple Vision Pro + Linear + Arc Browser
 * 
 * PALETA: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { Transition, Variants } from 'framer-motion'

// ════════════════════════════════════════════════════════════════════════════════════════
// EASINGS DE DIOS - Los más suaves del planeta
// ════════════════════════════════════════════════════════════════════════════════════════

/** Mantequilla líquida - el más suave jamás creado */
export const butter = [0.22, 1, 0.36, 1] as const

/** Líquido magnético - para orbs y glass */
export const liquid = [0.16, 1, 0.3, 1] as const

/** Seda - hover principal */
export const silk = [0.215, 0.61, 0.355, 1] as const

/** Pluma - entrada de páginas */
export const feather = [0.32, 0.72, 0, 1] as const

/** Respirar - pulsos y respiraciones de orbs */
export const breathe = [0.4, 0, 0.2, 1] as const

/** Gravedad suave - para caídas y drops */
export const gentleGravity = [0.34, 1.56, 0.64, 1] as const

/** Cristal - micro-interacciones premium */
export const crystal = [0.25, 0.1, 0.25, 1] as const

// ════════════════════════════════════════════════════════════════════════════════════════
// DURACIONES ULTRA-SUAVES
// ════════════════════════════════════════════════════════════════════════════════════════

export const DURATIONS = {
  /** Micro-interacciones sutiles */
  micro: 0.15,
  /** Hover / focus estándar */
  hover: 0.6,
  /** Transiciones de panel */
  panel: 0.8,
  /** Transiciones de página */
  page: 1.0,
  /** Animaciones cinemáticas */
  cinematic: 1.4,
  /** Respiración de orbs */
  breathe: 8.0,
  /** Ciclo de partículas */
  particle: 12.0,
} as const

// ════════════════════════════════════════════════════════════════════════════════════════
// SPRINGS FÍSICOS REALISTAS
// ════════════════════════════════════════════════════════════════════════════════════════

/** Spring para hover suave */
export const springHover: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
}

/** Spring para entradas */
export const springEnter: Transition = {
  type: 'spring',
  stiffness: 80,
  damping: 32,
  mass: 1.2,
}

/** Spring para modales */
export const springModal: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 35,
  mass: 0.5,
}

/** Spring para cursor magnético */
export const springCursor: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 30,
  mass: 0.5,
}

/** Spring para partículas */
export const springParticle: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 20,
  mass: 0.3,
}

/** Spring rápido para micro-interacciones */
export const springQuick: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
  mass: 0.5,
}

/** Spring snappy para clicks */
export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 600,
  damping: 25,
  mass: 0.4,
}

// ════════════════════════════════════════════════════════════════════════════════════════
// TRANSICIONES BUTTER SMOOTH
// ════════════════════════════════════════════════════════════════════════════════════════

export const butterTransition: Transition = {
  duration: DURATIONS.panel,
  ease: [0.22, 1, 0.36, 1],
}

export const liquidTransition: Transition = {
  duration: DURATIONS.cinematic,
  ease: [0.16, 1, 0.3, 1],
}

export const silkTransition: Transition = {
  duration: DURATIONS.hover,
  ease: [0.215, 0.61, 0.355, 1],
}

// ════════════════════════════════════════════════════════════════════════════════════════
// VARIANTES PREMIUM
// ════════════════════════════════════════════════════════════════════════════════════════

/** Fade suave como seda */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: DURATIONS.hover, ease: [0.215, 0.61, 0.355, 1] },
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
}

/** Slide desde abajo con física real */
export const slideUpVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 60,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      ...springEnter,
      duration: DURATIONS.cinematic,
    },
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.3 },
  },
}

/** Scale con bounce suave */
export const scaleVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.92,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: springEnter,
  },
  exit: { 
    opacity: 0, 
    scale: 0.96,
    transition: { duration: 0.2 },
  },
}

/** Hover de lujo para cards */
export const hoverCardVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    rotateX: 0,
    rotateY: 0,
  },
  hover: {
    y: -16,
    scale: 1.025,
    rotateX: 4,
    rotateY: 4,
    transition: springHover,
  },
  tap: {
    scale: 0.985,
    transition: { duration: 0.1 },
  },
}

/** Respiración de orbs */
export const breatheVariants: Variants = {
  breathing: {
    scale: [1, 1.04, 1],
    filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
    transition: {
      duration: DURATIONS.breathe,
      repeat: Infinity,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

/** Stagger container suave */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

/** Stagger item suave */
export const staggerItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: springEnter,
  },
}

/** Modal/Command Menu portal */
export const portalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    filter: 'blur(20px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: springModal,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    filter: 'blur(10px)',
    transition: { duration: 0.2 },
  },
}

// ════════════════════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ════════════════════════════════════════════════════════════════════════════════════════

/** Genera delay escalonado para listas */
export const getStaggerDelay = (index: number, baseDelay = 0.05): number => {
  return index * baseDelay
}

/** Crea transición personalizada con easing butter */
export const createButterTransition = (duration = DURATIONS.panel): Transition => ({
  duration,
  ease: [0.22, 1, 0.36, 1],
})

/** CSS easing para usar en Tailwind/CSS */
export const CSS_EASINGS = {
  butter: 'cubic-bezier(0.22, 1, 0.36, 1)',
  liquid: 'cubic-bezier(0.16, 1, 0.3, 1)',
  silk: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  feather: 'cubic-bezier(0.32, 0.72, 0, 1)',
  breathe: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const

export default {
  butter,
  liquid,
  silk,
  feather,
  breathe,
  gentleGravity,
  crystal,
  DURATIONS,
  springHover,
  springEnter,
  springModal,
  springCursor,
  springParticle,
  CSS_EASINGS,
}
