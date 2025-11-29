/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                    CHRONOS SYSTEM - PERFORMANCE MONITOR                    ║
 * ║              Real-time Performance Tracking & Optimization                 ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import { logger } from './logger'

interface PerformanceMetrics {
  name: string
  duration: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private maxMetrics = 100
  private enabled = typeof window !== 'undefined' && 'performance' in window

  /**
   * Measure performance of an async function
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) return fn()

    const startTime = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - startTime
      this.recordMetric(name, duration)
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      this.recordMetric(`${name} (error)`, duration)
      throw error
    }
  }

  /**
   * Measure performance of a sync function
   */
  measure<T>(name: string, fn: () => T): T {
    if (!this.enabled) return fn()

    const startTime = performance.now()
    try {
      const result = fn()
      const duration = performance.now() - startTime
      this.recordMetric(name, duration)
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      this.recordMetric(`${name} (error)`, duration)
      throw error
    }
  }

  /**
   * Mark a performance point
   */
  mark(name: string): void {
    if (!this.enabled) return
    performance.mark(name)
  }

  /**
   * Measure between two marks
   */
  measureBetween(name: string, startMark: string, endMark: string): void {
    if (!this.enabled) return
    try {
      performance.measure(name, startMark, endMark)
      const measures = performance.getEntriesByName(name, 'measure')
      if (measures.length > 0) {
        const lastMeasure = measures[measures.length - 1]
        this.recordMetric(name, lastMeasure.duration)
      }
    } catch (error) {
      logger.warn('Failed to measure between marks', { data: error })
    }
  }

  /**
   * Record a metric
   */
  private recordMetric(name: string, duration: number): void {
    const metric: PerformanceMetrics = {
      name,
      duration,
      timestamp: Date.now(),
    }

    this.metrics.push(metric)

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    // Log slow operations
    if (duration > 1000) {
      logger.warn(`Slow operation detected: ${name}`, {
        context: 'PerformanceMonitor',
        data: { duration: `${duration.toFixed(2)}ms` },
      })
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetrics[] {
    return this.metrics.filter((m) => m.name === name)
  }

  /**
   * Get average duration for a metric
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name)
    if (metrics.length === 0) return 0
    const sum = metrics.reduce((acc, m) => acc + m.duration, 0)
    return sum / metrics.length
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    if (this.enabled) {
      performance.clearMarks()
      performance.clearMeasures()
    }
  }

  /**
   * Get performance report
   */
  getReport(): string {
    if (this.metrics.length === 0) {
      return 'No performance metrics recorded'
    }

    const report = this.metrics
      .map((m) => `${m.name}: ${m.duration.toFixed(2)}ms`)
      .join('\n')

    return `Performance Report:\n${report}`
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Export type for external use
export type { PerformanceMetrics }
