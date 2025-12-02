'use client';

/**
 * 🛡️ ROLLBAR PROVIDER - Client Component
 * 
 * Provider para Rollbar en el cliente con error boundary.
 */

import { Provider, ErrorBoundary } from '@rollbar/react';
import { rollbarClientConfig } from '@/app/lib/rollbar/config';
import { ReactNode, Component, ErrorInfo } from 'react';

interface RollbarProviderProps {
  children: ReactNode;
}

// Fallback UI cuando hay un error
function ErrorFallback({ error, resetError }: { error: Error | null; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">
          Algo salió mal
        </h2>
        <p className="text-gray-300 mb-4">
          Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
        </p>
        {error && (
          <details className="text-left bg-black/50 rounded-lg p-4 mb-4">
            <summary className="text-red-400 cursor-pointer">
              Detalles técnicos
            </summary>
            <pre className="text-xs text-gray-400 mt-2 overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
        <button
          onClick={() => resetError()}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

// Class component para error boundary custom
class CustomErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorFallback 
          error={this.state.error} 
          resetError={() => this.setState({ hasError: false, error: null })} 
        />
      );
    }

    return this.props.children;
  }
}

export function RollbarProvider({ children }: RollbarProviderProps) {
  // En desarrollo sin token, solo usa el error boundary
  if (!rollbarClientConfig.accessToken) {
    return (
      <CustomErrorBoundary>
        {children}
      </CustomErrorBoundary>
    );
  }

  return (
    <Provider config={rollbarClientConfig}>
      <ErrorBoundary fallbackUI={ErrorFallback}>
        {children}
      </ErrorBoundary>
    </Provider>
  );
}

export default RollbarProvider;
