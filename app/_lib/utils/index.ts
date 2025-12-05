// ═══════════════════════════════════════════════════════════════
// CHRONOS - UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases de Tailwind de forma inteligente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número como moneda mexicana
 */
export function formatCurrency(
  amount: number,
  options: { decimals?: number; showSign?: boolean } = {}
): string {
  const { decimals = 2, showSign = false } = options
  const sign = showSign && amount >= 0 ? '+' : ''
  return `${sign}$${amount.toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

/**
 * Formatea una fecha en formato legible
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

/**
 * Formatea fecha y hora
 */
export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date)
  return d.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatea fecha relativa (hace X minutos, ayer, etc.)
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'hace un momento'
  if (diffMinutes < 60) return `hace ${diffMinutes} min`
  if (diffHours < 24) return `hace ${diffHours}h`
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} días`
  return formatDate(d)
}

/**
 * Formatea un porcentaje
 */
export function formatPercent(
  value: number,
  options: { decimals?: number; showSign?: boolean } = {}
): string {
  const { decimals = 1, showSign = false } = options
  const sign = showSign && value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(
  value: number,
  options: { decimals?: number; locale?: string } = {}
): string {
  const { decimals = 0, locale = 'es-MX' } = options
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Calcula el porcentaje de un valor respecto a un total
 */
export function calculatePercent(value: number, total: number): number {
  if (total === 0) return 0
  return (value / total) * 100
}

/**
 * Capitaliza la primera letra
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Trunca un texto a una longitud máxima
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Genera un ID único simple
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args)
      timeoutId = null
    }, wait)
  }
}

/**
 * Agrupa un array por una propiedad
 */
export function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item)
    return {
      ...groups,
      [key]: [...(groups[key] || []), item],
    }
  }, {} as Record<string, T[]>)
}

/**
 * Ordena un array por una propiedad
 */
export function sortBy<T>(
  array: T[],
  keyFn: (item: T) => number | string,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = keyFn(a)
    const bVal = keyFn(b)
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return order === 'asc' ? comparison : -comparison
  })
}

/**
 * Suma valores de un array de objetos
 */
export function sumBy<T>(array: T[], keyFn: (item: T) => number): number {
  return array.reduce((sum, item) => sum + keyFn(item), 0)
}

/**
 * Promedio de valores de un array
 */
export function averageBy<T>(array: T[], keyFn: (item: T) => number): number {
  if (array.length === 0) return 0
  return sumBy(array, keyFn) / array.length
}

/**
 * Espera un número de milisegundos
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Valida si un string es un email válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida si un string es un RFC válido (México)
 */
export function isValidRFC(rfc: string): boolean {
  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$/
  return rfcRegex.test(rfc.toUpperCase())
}

/**
 * Sanitiza un string para prevenir XSS
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
