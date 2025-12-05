'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🎬 CHRONOS INFINITY - MOTION VARIANTS & ANIMATIONS
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Variantes de animación premium para Framer Motion
 * Física de spring real, transiciones cinematográficas
 * 
 * Inspirado en: Apple Vision Pro + Linear + Arc Browser
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { Variants, Transition } from 'framer-motion'

// ════════════════════════════════════════════════════════════════════════════════════════
// TRANSICIONES BASE
// ════════════════════════════════════════════════════════════════════════════════════════

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 25,
  mass: 0.5,
}

export const smoothSpring: Transition = {
  type: 'spring',
  stiffness: 180,
  damping: 22,
  mass: 0.8,
}

export const bouncySpring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 10,
  mass: 0.5,
}

export const cinematicTransition: Transition = {
  duration: 0.8,
  ease: [0.16, 1, 0.3, 1],
}

// ════════════════════════════════════════════════════════════════════════════════════════
// FADE VARIANTS
// ════════════════════════════════════════════════════════════════════════════════════════

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { ...smoothSpring },
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 },
  },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { ...smoothSpring },
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: { duration: 0.2 },
  },
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { ...smoothSpring },
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { duration: 0.2 },
  },
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { ...smoothSpring },
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.2 },
  },
}

// ════════════════════════════════════════════════════════════════════════════════════════
// SCALE VARIANTS
// ════════════════════════════════════════════════════════════════════════════════════════

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { ...springTransition },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}

export const scaleInBounce: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { ...bouncySpring },
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: { duration: 0.2 },
  },
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: 'spring',
      stiffness: 350,
      damping: 15,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    y: -5,
    transition: { duration: 0.15 },
  },
}

// ════════════════════════════════════════════════════════════════════════════════════════
// STAGGER CONTAINER
// ════════════════════════════════════════════════════════════════════════════════════════

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
}

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
}

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

// Elemento individual para usar dentro de stagger containers
export const staggerItem: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { ...smoothSpring },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.15 },
  },
}

// ════════════════════════════════════════════════════════════════════════════════════════
// CARD VARIANTS (Para GlassCard3D y similares)
// ════════════════════════════════════════════════════════════════════════════════════════

export const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { ...smoothSpring },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: { ...springTransition },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}

export const kpiCardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 40,
    scale: 0.9,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
  hover: {
    y: -12,
    scale: 1.03,
    boxShadow: '0 20px 60px rgba(139, 0, 255, 0.3)',
    transition: { ...springTransition },
  },
}

// ════════════════════════════════════════════════════════════════════════════════════════
// MODAL VARIANTS
// ════════════════════════════════════════════════════════════════════════════════════════

export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15, delay: 0.1 },
  },
}

export const modalContentVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9,
    y: 20,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { ...smoothSpring, delay: 0.05 },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
}

export const sheetVariants: Variants = {
  hidden: { y: '100%' },
  visible: { 
    y: 0,
    transition: { ...smoothSpring },
  },
  exit: { 
    y: '100%',
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
  },
}

// ════════════════════════════════════════════════════════════════════════════════════════
// SIDEBAR VARIANTS
// ════════════════════════════════════════════════════════════════════════════════════════

export const sidebarVariants: Variants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { ...smoothSpring },
  },
  exit: { 
    x: '-100%', 
    opacity: 0,
    transition: { duration: 0.25 },
  },
}

export const menuItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { ...springTransition },
  },
  hover: {
    x: 4,
    backgroundColor: 'rgba(139, 0, 255, 0.1)',
    transition: { duration: 0.15 },
  },
}

// ════════════════════════════════════════════════════════════════════════════════════════
// TOAST / NOTIFICATION VARIANTS
// ════════════════════════════════════════════════════════════════════════════════════════

export const toastVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    scale: 0.9,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { ...bouncySpring },
  },
  exit: { 
    opacity: 0, 
    x: 100,
    transition: { duration: 0.2 },
  },
}

// ════════════════════════════════════════════════════════════════════════════════════════
// PULSE & GLOW ANIMATIONS
// ════════════════════════════════════════════════════════════════════════════════════════

export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const glowVariants: Variants = {
  glow: {
    boxShadow: [
      '0 0 20px rgba(139, 0, 255, 0.3)',
      '0 0 40px rgba(139, 0, 255, 0.5)',
      '0 0 20px rgba(139, 0, 255, 0.3)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const breatheVariants: Variants = {
  breathe: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ════════════════════════════════════════════════════════════════════════════════════════
// LOADING VARIANTS
// ════════════════════════════════════════════════════════════════════════════════════════

export const skeletonVariants: Variants = {
  loading: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const spinnerVariants: Variants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

// ════════════════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════════════

/** Genera un delay escalonado para listas */
export function getStaggerDelay(index: number, baseDelay = 0.05): number {
  return index * baseDelay
}

/** Genera variants con delay personalizado */
export function withDelay(variants: Variants, delay: number): Variants {
  return {
    ...variants,
    visible: {
      ...variants.visible,
      transition: {
        ...(typeof variants.visible === 'object' && 'transition' in variants.visible 
          ? variants.visible.transition 
          : {}),
        delay,
      },
    },
  }
}

/** Combina múltiples variants */
export function mergeVariants(...variants: Variants[]): Variants {
  return variants.reduce((acc, variant) => ({
    ...acc,
    ...variant,
    hidden: { ...acc.hidden, ...variant.hidden },
    visible: { ...acc.visible, ...variant.visible },
    exit: { ...acc.exit, ...variant.exit },
  }), {})
}
