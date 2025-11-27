/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                         AUTH SERVICE                                       ║
 * ║              Autenticación JWT + Firebase Auth                            ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import { getAuth, getFirestore } from '../config/firebase.js';
import { logger } from '../config/logger.js';
import { config } from '../config/environment.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const auth = getAuth();
const db = getFirestore();

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: string[];
  createdAt: Date;
  lastLogin?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName?: string;
  role?: 'admin' | 'user' | 'viewer';
}

export interface TokenPayload {
  uid: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  /**
   * Login con email y password
   */
  static async login(credentials: LoginCredentials): Promise<AuthTokens & { user: User }> {
    try {
      const { email, password } = credentials;

      // Verificar usuario en Firestore
      const usersSnapshot = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        throw new Error('Invalid credentials');
      }

      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data() as User;

      // Verificar password (hash)
      const passwordMatch = await bcrypt.compare(password, userData.password as any);
      if (!passwordMatch) {
        throw new Error('Invalid credentials');
      }

      // Actualizar último login
      await db.collection('users').doc(userDoc.id).update({
        lastLogin: new Date(),
      });

      // Generar tokens
      const tokens = this.generateTokens({
        uid: userDoc.id,
        email: userData.email,
        role: userData.role,
        permissions: userData.permissions || [],
      });

      logger.info(`User logged in: ${email}`);

      return {
        ...tokens,
        user: {
          uid: userDoc.id,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          permissions: userData.permissions || [],
          createdAt: userData.createdAt,
          lastLogin: new Date(),
        },
      };
    } catch (error: any) {
      logger.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Register nuevo usuario
   */
  static async register(data: RegisterData): Promise<AuthTokens & { user: User }> {
    try {
      const { email, password, displayName, role = 'user' } = data;

      // Verificar si usuario ya existe
      const existingUser = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!existingUser.empty) {
        throw new Error('User already exists');
      }

      // Crear usuario en Firebase Auth
      const firebaseUser = await auth.createUser({
        email,
        password,
        displayName: displayName || email.split('@')[0],
      });

      // Hash password para Firestore
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear documento en Firestore
      const userData: User & { password: string } = {
        uid: firebaseUser.uid,
        email,
        displayName: displayName || email.split('@')[0],
        role,
        permissions: this.getDefaultPermissions(role),
        password: hashedPassword,
        createdAt: new Date(),
      };

      await db.collection('users').doc(firebaseUser.uid).set(userData);

      // Generar tokens
      const tokens = this.generateTokens({
        uid: firebaseUser.uid,
        email,
        role,
        permissions: userData.permissions,
      });

      logger.info(`User registered: ${email}`);

      // Remover password del response
      const { password: _, ...userWithoutPassword } = userData;

      return {
        ...tokens,
        user: userWithoutPassword,
      };
    } catch (error: any) {
      logger.error('Register error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verificar refresh token
      const decoded = jwt.verify(
        refreshToken,
        config.jwt.refreshSecret
      ) as TokenPayload;

      // Obtener usuario actualizado
      const userDoc = await db.collection('users').doc(decoded.uid).get();

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data() as User;

      // Generar nuevo access token
      const accessToken = jwt.sign(
        {
          uid: decoded.uid,
          email: userData.email,
          role: userData.role,
          permissions: userData.permissions || [],
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      logger.info(`Access token refreshed for user: ${userData.email}`);

      return { accessToken };
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout usuario
   */
  static async logout(uid: string): Promise<void> {
    try {
      // Actualizar último logout
      await db.collection('users').doc(uid).update({
        lastLogout: new Date(),
      });

      logger.info(`User logged out: ${uid}`);
    } catch (error: any) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario por UID
   */
  static async getUserByUid(uid: string): Promise<User | null> {
    try {
      const userDoc = await db.collection('users').doc(uid).get();

      if (!userDoc.exists) {
        return null;
      }

      const { password, ...userData } = userDoc.data() as any;
      return {
        uid: userDoc.id,
        ...userData,
      } as User;
    } catch (error: any) {
      logger.error(`Error getting user ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Verificar token JWT
   */
  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Cambiar password
   */
  static async changePassword(uid: string, oldPassword: string, newPassword: string): Promise<void> {
    try {
      const userDoc = await db.collection('users').doc(uid).get();

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data() as any;

      // Verificar old password
      const passwordMatch = await bcrypt.compare(oldPassword, userData.password);
      if (!passwordMatch) {
        throw new Error('Invalid old password');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar en Firestore
      await db.collection('users').doc(uid).update({
        password: hashedPassword,
        passwordChangedAt: new Date(),
      });

      // Actualizar en Firebase Auth
      await auth.updateUser(uid, { password: newPassword });

      logger.info(`Password changed for user: ${uid}`);
    } catch (error: any) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Reset password (generar link)
   */
  static async requestPasswordReset(email: string): Promise<{ message: string }> {
    try {
      // Verificar que usuario existe
      const usersSnapshot = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        // No revelar si el email existe o no (seguridad)
        return { message: 'If this email exists, a reset link has been sent' };
      }

      // Generar token de reset
      const resetToken = jwt.sign(
        { email },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      // Guardar token en Firestore
      const userDoc = usersSnapshot.docs[0];
      await db.collection('users').doc(userDoc.id).update({
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hora
      });

      // TODO: Enviar email con link de reset
      logger.info(`Password reset requested for: ${email}`);

      return { message: 'If this email exists, a reset link has been sent' };
    } catch (error: any) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * Generar access y refresh tokens
   */
  private static generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(
      payload,
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      payload,
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiry(config.jwt.expiresIn),
    };
  }

  /**
   * Obtener permisos por defecto según rol
   */
  private static getDefaultPermissions(role: string): string[] {
    switch (role) {
      case 'admin':
        return ['*']; // Todos los permisos
      case 'user':
        return [
          'ventas:read',
          'ventas:write',
          'compras:read',
          'compras:write',
          'almacen:read',
          'almacen:write',
          'banco:read',
          'clientes:read',
          'clientes:write',
        ];
      case 'viewer':
        return [
          'ventas:read',
          'compras:read',
          'almacen:read',
          'banco:read',
          'clientes:read',
        ];
      default:
        return [];
    }
  }

  /**
   * Parsear tiempo de expiración a segundos
   */
  private static parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600; // 1 hora por defecto
    }
  }
}
