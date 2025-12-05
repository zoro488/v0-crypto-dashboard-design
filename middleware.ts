/**
 * 🔒 Middleware Elite - CHRONOS 2026
 * 
 * Middleware optimizado con:
 * - Autenticación basada en cookies
 * - Rate limiting por IP
 * - Security headers (CSP, HSTS, etc.)
 * - Request logging
 * - Protección de rutas
 */

import { NextResponse, type NextRequest } from 'next/server'

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE RUTAS
// ═══════════════════════════════════════════════════════════════

// Rutas que requieren autenticación
const PROTECTED_ROUTES = [
  '/dashboard',
  '/ventas',
  '/clientes',
  '/bancos',
  '/distribuidores',
  '/ordenes',
  '/movimientos',
  '/almacen',
  '/configuracion',
  '/reportes',
  '/usuarios',
]

// Rutas públicas (no requieren auth)
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/demo',
  '/showcase-premium',
  '/api/health',
]

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING (Simple in-memory - para producción usar Redis)
// ═══════════════════════════════════════════════════════════════

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minuto
const RATE_LIMIT_MAX = 100 // 100 requests por minuto

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

// Limpiar records viejos cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(ip)
      }
    }
  }, 5 * 60 * 1000)
}

// ═══════════════════════════════════════════════════════════════
// SECURITY HEADERS
// ═══════════════════════════════════════════════════════════════

const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
}

// ═══════════════════════════════════════════════════════════════
// MAIN MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 
             request.headers.get('x-real-ip') ?? 
             'unknown'

  // 0. Verificar autenticación para rutas protegidas
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  const isApiRoute = pathname.startsWith('/api/')
  
  // Obtener sesión de cookies
  const sessionCookie = request.cookies.get('chronos_session')
  const isAuthenticated = !!sessionCookie?.value

  // Redirigir a login si no está autenticado y es ruta protegida
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirigir a dashboard si ya está autenticado y va a login
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 1. Rate limiting para APIs
  if (pathname.startsWith('/api/')) {
    if (!checkRateLimit(ip)) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': '0',
        }
      })
    }
  }

  // 2. Crear response con headers de seguridad
  const response = NextResponse.next()

  // Agregar security headers
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value)
  }

  // 3. Content Security Policy (más permisivo para desarrollo)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com https://vercel.live",
      "frame-src 'self' https://vercel.live",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '))
  }

  // 4. Cache headers para assets estáticos
  if (pathname.startsWith('/_next/static/') || 
      pathname.startsWith('/static/') ||
      pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|woff|woff2)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  // 5. No cache para APIs y páginas dinámicas
  if (pathname.startsWith('/api/') || pathname === '/') {
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
  }

  // 6. Request ID para debugging (usando globalThis.crypto disponible en Edge Runtime)
  const requestId = globalThis.crypto.randomUUID()
  response.headers.set('X-Request-ID', requestId)

  return response
}

// ═══════════════════════════════════════════════════════════════
// MATCHER CONFIG
// ═══════════════════════════════════════════════════════════════

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
