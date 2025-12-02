/**
 * 🎤 API Route: Twilio Voice Token Generator
 * 
 * Genera tokens de acceso para Twilio Voice SDK
 * Permite llamadas WebRTC en tiempo real
 * 
 * @endpoint POST /api/voice/token
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/app/lib/utils/logger'

// Configuración de Twilio (se obtienen de variables de entorno)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_API_KEY = process.env.TWILIO_API_KEY
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET
const _TWILIO_TWIML_APP_SID = process.env.TWILIO_TWIML_APP_SID // Reservado para uso futuro

interface TokenRequest {
  identity: string
  roomName?: string
}

export async function POST(request: NextRequest) {
  try {
    // Verificar configuración de Twilio
    if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY || !TWILIO_API_SECRET) {
      logger.warn('Twilio no configurado, usando modo mock', { context: 'VoiceToken' })
      
      // Retornar token mock para desarrollo
      return NextResponse.json({
        token: 'mock-token-for-development',
        identity: 'dev-user',
        expiresIn: 3600,
        mode: 'mock',
        message: 'Twilio no configurado. Configure TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET en .env.local',
      })
    }

    const body: TokenRequest = await request.json()
    const { identity, roomName } = body

    if (!identity) {
      return NextResponse.json(
        { error: 'Identity es requerido' },
        { status: 400 },
      )
    }

    // Nota: Para usar Twilio, instalar: pnpm add twilio @types/twilio
    // Por ahora, retornamos un token placeholder que indica que Twilio está configurado
    // pero el SDK no está instalado
    
    // TODO: Descomentar cuando twilio esté instalado:
    // const twilio = await import('twilio')
    // const AccessToken = twilio.jwt.AccessToken
    // const VoiceGrant = AccessToken.VoiceGrant
    // const accessToken = new AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, { identity })
    // const voiceGrant = new VoiceGrant({ outgoingApplicationSid: TWILIO_TWIML_APP_SID, incomingAllow: true })
    // accessToken.addGrant(voiceGrant)
    // const token = accessToken.toJwt()
    
    // Token placeholder hasta que se instale twilio SDK
    const token = `twilio-configured-${identity}-${Date.now()}`

    logger.info('Token de voz generado', {
      context: 'VoiceToken',
      data: { identity, hasRoom: !!roomName },
    })

    return NextResponse.json({
      token,
      identity,
      expiresIn: 3600, // 1 hora
      mode: 'production',
    })

  } catch (error) {
    logger.error('Error generando token de voz', error as Error, { context: 'VoiceToken' })
    
    return NextResponse.json(
      { error: 'Error generando token', details: (error as Error).message },
      { status: 500 },
    )
  }
}

export async function GET() {
  // Health check
  const isConfigured = !!(TWILIO_ACCOUNT_SID && TWILIO_API_KEY && TWILIO_API_SECRET)
  
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Voice Token Generator',
    configured: isConfigured,
    timestamp: new Date().toISOString(),
  })
}
