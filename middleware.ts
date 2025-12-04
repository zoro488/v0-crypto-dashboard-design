/**
 * 🔒 Middleware - CHRONOS 2026
 * 
 * Middleware simplificado - permite todo el acceso público
 * La autenticación se maneja a nivel de componente
 */

import { NextResponse, type NextRequest } from 'next/server'

export function middleware(_request: NextRequest) {
  // Permitir todas las rutas sin restricción
  // La autenticación se maneja en los componentes
  return NextResponse.next()
}

// Solo aplicar a rutas API protegidas específicas
export const config = {
  matcher: [
    '/api/protected/:path*',
  ],
}
