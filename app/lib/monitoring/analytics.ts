/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                    CHRONOS SYSTEM - Analytics Configuration                ║
 * ║                    Analytics Tracking and Event Management                 ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Analytics event types
export type AnalyticsEvent =
  | 'page_view'
  | 'order_created'
  | 'sale_created'
  | 'payment_received'
  | 'export_data'
  | 'import_data'
  | 'search'
  | 'filter_applied'
  | 'error_occurred'

// Track custom events
export function trackEvent(event: AnalyticsEvent, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return

  // Vercel Analytics
  if (window.va) {
    window.va('event', { name: event, ...properties })
  }

  // Google Analytics (if configured)
  if (window.gtag) {
    window.gtag('event', event, properties)
  }

  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event, properties)
  }
}

// Track page views
export function trackPageView(url: string) {
  if (typeof window === 'undefined') return

  trackEvent('page_view', { url })

  if (window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {
      page_path: url,
    })
  }
}

// Track errors
export function trackError(error: Error, context?: Record<string, any>) {
  trackEvent('error_occurred', {
    message: error.message,
    stack: error.stack,
    ...context,
  })
}

// Track user actions
export function trackUserAction(action: string, details?: Record<string, any>) {
  trackEvent(action as AnalyticsEvent, {
    timestamp: new Date().toISOString(),
    ...details,
  })
}

// Track performance metrics
export function trackPerformance(metric: string, value: number, unit = 'ms') {
  trackEvent('page_view', {
    metric,
    value,
    unit,
  })
}

// Analytics components to be included in layout
export { Analytics, SpeedInsights }

// Type declarations for global analytics
declare global {
  interface Window {
    va?: (event: 'beforeSend' | 'event' | 'pageview', properties?: unknown) => void
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void
  }
}
