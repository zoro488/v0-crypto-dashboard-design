/**
 * 🔒 Middleware - Protected Routes
 * 
 * Protege todas las rutas excepto /login
 * Redirige a /login si no hay usuario autenticado
 */

import { NextResponse, type NextRequest } from 'next/server'

// Rutas públicas (no requieren auth)
const PUBLIC_ROUTES = ['/login', '/api']

// Archivos públicos que deben ser accesibles sin autenticación
const PUBLIC_FILES = [
  '/manifest.json',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/sw.js',
  '/workbox-',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas públicas
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Permitir archivos públicos específicos (manifest, favicon, etc.)
  if (PUBLIC_FILES.some(file => pathname.startsWith(file))) {
    return NextResponse.next()
  }

  // Permitir archivos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/icon-') || // PWA icons
    pathname.includes('.') // archivos con extensión
  ) {
    return NextResponse.next()
  }

  // Verificar sesión de Firebase (cookie)
  const session = request.cookies.get('session')?.value
  const firebaseToken = request.cookies.get('__session')?.value

  // Si no hay sesión, redirigir a login
  if (!session && !firebaseToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
