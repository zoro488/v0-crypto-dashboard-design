/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                         AUTH ROUTES                                        ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { logger } from '../config/logger.js';

export const authRouter = Router();

// ========== VALIDATION SCHEMAS ==========

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres'),
});

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  rol: z.enum(['admin', 'user', 'viewer']).optional().default('user'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token es requerido'),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Password actual es requerido'),
  newPassword: z.string().min(6, 'Nuevo password debe tener al menos 6 caracteres'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

// ========== AUTH ENDPOINTS ==========

/**
 * POST /api/v1/auth/login
 * Login con email y password
 */
authRouter.post('/login', async (req, res) => {
  try {
    const credentials = loginSchema.parse(req.body);
    const result = await AuthService.login(credentials);

    logger.info(`User logged in: ${credentials.email}`);
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al iniciar sesión',
    });
  }
});

/**
 * POST /api/v1/auth/register
 * Registrar nuevo usuario
 */
authRouter.post('/register', async (req, res) => {
  try {
    const userData = registerSchema.parse(req.body);
    const result = await AuthService.register(userData);

    logger.info(`User registered: ${userData.email}`);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Register error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al registrar usuario',
    });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refrescar access token usando refresh token
 */
authRouter.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const result = await AuthService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Error al refrescar token',
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Cerrar sesión (invalidar refresh token)
 */
authRouter.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error: any) {
    logger.error('Logout error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al cerrar sesión',
    });
  }
});

/**
 * POST /api/v1/auth/change-password
 * Cambiar password (usuario autenticado)
 */
authRouter.post('/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);
    const userId = (req as any).user?.uid;

    await AuthService.changePassword(userId, oldPassword, newPassword);

    logger.info(`Password changed for user: ${userId}`);
    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente',
    });
  } catch (error: any) {
    logger.error('Change password error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al cambiar contraseña',
    });
  }
});

/**
 * POST /api/v1/auth/reset-password
 * Solicitar reset de password por email
 */
authRouter.post('/reset-password', async (req, res) => {
  try {
    const { email } = resetPasswordSchema.parse(req.body);
    await AuthService.requestPasswordReset(email);

    res.json({
      success: true,
      message: 'Se ha enviado un correo con instrucciones para restablecer tu contraseña',
    });
  } catch (error: any) {
    logger.error('Reset password error:', error);
    // Por seguridad, siempre devolver success aunque el email no exista
    res.json({
      success: true,
      message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña',
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Obtener datos del usuario autenticado
 */
authRouter.get('/me', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.uid;
    const user = await AuthService.getUserById(userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    logger.error('Get user error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al obtener datos del usuario',
    });
  }
});
