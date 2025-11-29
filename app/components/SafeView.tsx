"use client"

/**
 * 🛡️ SAFE VIEW - Cortafuegos de UI
 * Generado automáticamente por emergency-fix.ts
 * 
 * Envuelve componentes peligrosos en un ErrorBoundary
 * que captura errores y muestra un fallback amigable.
 */

import React, { Component, ReactNode } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  componentName?: string
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    
    // Log del error
    console.error(`[SafeView] Error en ${this.props.componentName || 'componente'}:`, error)
    console.error('Stack:', errorInfo.componentStack)
    
    // Callback opcional
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Fallback personalizado o por defecto
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-500">⚠️</span>
            <h3 className="font-semibold text-red-500">
              Error en {this.props.componentName || 'este componente'}
            </h3>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            Algo salió mal. El resto de la aplicación sigue funcionando.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="px-3 py-1 text-sm bg-red-500/20 hover:bg-red-500/30 rounded transition-colors"
          >
            🔄 Reintentar
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-3">
              <summary className="text-xs text-gray-500 cursor-pointer">
                Detalles técnicos
              </summary>
              <pre className="text-xs mt-2 p-2 bg-black/50 rounded overflow-auto max-h-32">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para usar SafeView de forma declarativa
interface SafeViewProps {
  children: ReactNode
  name?: string
  fallback?: ReactNode
}

export function SafeView({ children, name, fallback }: SafeViewProps) {
  return (
    <ErrorBoundary componentName={name} fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}

// Wrapper para componentes lazy
export function withSafeView<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  return function SafeWrappedComponent(props: P) {
    return (
      <SafeView name={componentName || WrappedComponent.displayName || 'Component'}>
        <WrappedComponent {...props} />
      </SafeView>
    )
  }
}

export default ErrorBoundary
