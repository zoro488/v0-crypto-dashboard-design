/**
 * 🔒 BotID Server Utilities
 * Funciones de verificación de bots para rutas del servidor
 */

import { checkBotId } from 'botid/server';
import { NextResponse } from 'next/server';
import { logger } from '@/app/lib/utils/logger';

interface BotCheckResult {
  isBot: boolean;
  confidence?: number;
  reason?: string;
}

/**
 * Verificar si la request es de un bot
 * @returns Resultado de la verificación
 */
export async function verifyBotId(): Promise<BotCheckResult> {
  try {
    const verification = await checkBotId();
    
    if (verification.isBot) {
      logger.warn('Bot detectado', { 
        context: 'BotID',
        data: { isBot: true }
      });
    }
    
    return {
      isBot: verification.isBot,
    };
  } catch (error) {
    logger.error('Error verificando BotID', error as Error, { context: 'BotID' });
    // En caso de error, permitir la request (fail open)
    return { isBot: false, reason: 'error' };
  }
}

/**
 * Middleware helper para rutas protegidas
 * Retorna NextResponse de error si es bot, null si es humano
 */
export async function botGuard(): Promise<NextResponse | null> {
  const result = await verifyBotId();
  
  if (result.isBot) {
    return NextResponse.json(
      { 
        error: 'Acceso denegado', 
        code: 'BOT_DETECTED',
        message: 'Esta acción no está permitida para solicitudes automatizadas' 
      },
      { status: 403 }
    );
  }
  
  return null;
}

/**
 * Wrapper para rutas API con protección BotID
 */
export function withBotProtection<T>(
  handler: () => Promise<NextResponse<T>>
): () => Promise<NextResponse<T | { error: string }>> {
  return async () => {
    const guardResult = await botGuard();
    if (guardResult) {
      return guardResult as NextResponse<{ error: string }>;
    }
    return handler();
  };
}

/**
 * Opciones de desarrollo para testing local
 * En desarrollo local, checkBotId siempre retorna isBot: false
 * Usar estas opciones para simular comportamiento de producción
 */
export const developmentOptions = {
  // Simular que es un bot (para testing)
  simulateBot: process.env.SIMULATE_BOT === 'true',
  
  // Bypass BotID en desarrollo
  bypassInDev: process.env.NODE_ENV === 'development',
};

export default {
  verifyBotId,
  botGuard,
  withBotProtection,
  developmentOptions,
};
