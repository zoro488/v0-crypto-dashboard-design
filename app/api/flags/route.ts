import { NextResponse } from 'next/server'
import { getAllFlags } from '@/flags'
import { flagFallbacks } from '@/generated/hypertune'

/**
 * 🎯 API ROUTE: GET /api/flags
 * 
 * Endpoint para obtener todas las feature flags evaluadas.
 * Usado por el hook useFeatureFlags en el cliente.
 */

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Intentar obtener flags evaluadas
    let flags
    
    try {
      flags = await getAllFlags()
    } catch (error) {
      console.warn('[API/flags] Error evaluating flags, using fallbacks:', error)
      flags = flagFallbacks
    }

    return NextResponse.json({
      success: true,
      flags,
      timestamp: new Date().toISOString(),
      source: 'hypertune',
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('[API/flags] Error:', error)
    
    // Retornar fallbacks en caso de error
    return NextResponse.json({
      success: false,
      flags: flagFallbacks,
      timestamp: new Date().toISOString(),
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, {
      status: 200, // 200 para que el cliente pueda usar los fallbacks
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
      },
    })
  }
}

/**
 * POST /api/flags - Evaluar flags con contexto específico
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, userEmail, userName } = body

    // Por ahora, retornar las mismas flags
    // En producción, esto evaluaría con el contexto del usuario
    const flags = await getAllFlags()

    return NextResponse.json({
      success: true,
      flags,
      context: {
        userId: userId || 'anonymous',
        userEmail: userEmail || 'anonymous@chronos.app',
        userName: userName || 'Anonymous',
      },
      timestamp: new Date().toISOString(),
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('[API/flags] POST Error:', error)
    
    return NextResponse.json({
      success: false,
      flags: flagFallbacks,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, {
      status: 200,
    })
  }
}
