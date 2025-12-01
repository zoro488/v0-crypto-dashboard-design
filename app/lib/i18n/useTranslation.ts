/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                    CHRONOS SYSTEM - i18n Hook                              ║
 * ║                    Translation Hook for Components                         ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultLocale, type Locale } from './config'
import es from './locales/es'
import en from './locales/en'

const translations = {
  es,
  en,
}

type TranslationKey = keyof typeof es

interface I18nStore {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useI18nStore = create<I18nStore>()(
  persist(
    (set) => ({
      locale: defaultLocale,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'chronos-i18n',
    },
  ),
)

export function useTranslation() {
  const { locale, setLocale } = useI18nStore()

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let translation: string = translations[locale][key] || translations[defaultLocale][key] || key

    // Replace params if provided
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{{${paramKey}}}`, String(paramValue))
      })
    }

    return translation
  }

  return {
    t,
    locale,
    setLocale,
  }
}

// Utility function for date formatting
export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

// Utility function for number formatting
export function formatNumber(
  number: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', options).format(number)
}

// Utility function for currency formatting
export function formatCurrency(amount: number, locale: Locale, currency = 'USD'): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}
