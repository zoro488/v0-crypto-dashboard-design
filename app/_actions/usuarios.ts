'use server'

import { db } from '@/database'
import { usuarios } from '@/database/schema'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { eq, sql, desc, like, or } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { 
  LoginSchema, 
  RegisterSchema, 
  UpdateUsuarioSchema,
  type LoginInput, 
  type RegisterInput, 
  type UpdateUsuarioInput 
} from './types'

// ═══════════════════════════════════════════════════════════════
// UTILIDADES DE HASH (simple para demo - usar bcrypt en producción)
// ═══════════════════════════════════════════════════════════════

async function hashPassword(password: string): Promise<string> {
  // En producción: usar bcrypt o argon2
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'chronos_salt_2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedInput = await hashPassword(password)
  return hashedInput === hash
}

// ═══════════════════════════════════════════════════════════════
// SERVER ACTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Autenticar usuario (login)
 */
export async function login(input: LoginInput) {
  const parsed = LoginSchema.safeParse(input)

  if (!parsed.success) {
    return { 
      error: 'Datos inválidos', 
      details: parsed.error.flatten().fieldErrors 
    }
  }

  const { data } = parsed

  try {
    const [user] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.email, data.email.toLowerCase()))
      .limit(1)

    if (!user) {
      return { error: 'Credenciales inválidas' }
    }

    const passwordValid = await verifyPassword(data.password, user.password)
    
    if (!passwordValid) {
      return { error: 'Credenciales inválidas' }
    }

    // Crear sesión simple (en producción: usar JWT o NextAuth)
    const sessionToken = nanoid(32)
    const cookieStore = await cookies()
    
    cookieStore.set('chronos_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    })

    cookieStore.set('chronos_user', JSON.stringify({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return { 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role,
      }
    }
  } catch (error) {
    console.error('Error en login:', error)
    return { error: 'Error al iniciar sesión. Intenta de nuevo.' }
  }
}

/**
 * Cerrar sesión (logout)
 */
export async function logout() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('chronos_session')
    cookieStore.delete('chronos_user')
    
    return { success: true }
  } catch (error) {
    console.error('Error en logout:', error)
    return { error: 'Error al cerrar sesión' }
  }
}

/**
 * Registrar nuevo usuario (solo admin puede hacerlo)
 */
export async function register(input: RegisterInput) {
  const parsed = RegisterSchema.safeParse(input)

  if (!parsed.success) {
    return { 
      error: 'Datos inválidos', 
      details: parsed.error.flatten().fieldErrors 
    }
  }

  const { data } = parsed
  const userId = nanoid()
  const now = new Date()

  try {
    // Verificar si el email ya existe
    const [existing] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.email, data.email.toLowerCase()))
      .limit(1)

    if (existing) {
      return { error: 'El email ya está registrado' }
    }

    const hashedPassword = await hashPassword(data.password)

    await db.insert(usuarios).values({
      id: userId,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      nombre: data.nombre,
      role: data.role,
      createdAt: now,
      updatedAt: now,
    })

    revalidatePath('/usuarios')

    return { 
      success: true, 
      id: userId,
      user: {
        id: userId,
        email: data.email,
        nombre: data.nombre,
        role: data.role,
      }
    }
  } catch (error) {
    console.error('Error en registro:', error)
    return { error: 'Error al registrar usuario. Intenta de nuevo.' }
  }
}

/**
 * Obtener usuario actual desde cookies
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('chronos_session')
    const userCookie = cookieStore.get('chronos_user')

    if (!sessionCookie || !userCookie) {
      return { error: 'No autenticado' }
    }

    const user = JSON.parse(userCookie.value)
    
    return { success: true, user }
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error)
    return { error: 'Error al obtener usuario' }
  }
}

/**
 * Obtener todos los usuarios (solo admin)
 */
export async function getUsuarios() {
  try {
    const result = await db
      .select({
        id: usuarios.id,
        email: usuarios.email,
        nombre: usuarios.nombre,
        role: usuarios.role,
        createdAt: usuarios.createdAt,
      })
      .from(usuarios)
      .orderBy(usuarios.nombre)

    return { success: true, data: result }
  } catch (error) {
    console.error('Error obteniendo usuarios:', error)
    return { error: 'Error al obtener usuarios' }
  }
}

/**
 * Obtener usuario por ID
 */
export async function getUsuarioById(id: string) {
  try {
    const [user] = await db
      .select({
        id: usuarios.id,
        email: usuarios.email,
        nombre: usuarios.nombre,
        role: usuarios.role,
        createdAt: usuarios.createdAt,
        updatedAt: usuarios.updatedAt,
      })
      .from(usuarios)
      .where(eq(usuarios.id, id))
      .limit(1)

    if (!user) {
      return { error: 'Usuario no encontrado' }
    }

    return { success: true, data: user }
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    return { error: 'Error al obtener usuario' }
  }
}

/**
 * Actualizar usuario
 */
export async function updateUsuario(input: UpdateUsuarioInput) {
  const parsed = UpdateUsuarioSchema.safeParse(input)

  if (!parsed.success) {
    return { 
      error: 'Datos inválidos', 
      details: parsed.error.flatten().fieldErrors 
    }
  }

  const { data } = parsed
  const now = new Date()

  try {
    const [existing] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, data.id))
      .limit(1)

    if (!existing) {
      return { error: 'Usuario no encontrado' }
    }

    const updateData: Partial<typeof usuarios.$inferInsert> = {
      updatedAt: now,
    }

    if (data.email) {
      // Verificar que el nuevo email no exista
      const [emailExists] = await db
        .select()
        .from(usuarios)
        .where(eq(usuarios.email, data.email.toLowerCase()))
        .limit(1)

      if (emailExists && emailExists.id !== data.id) {
        return { error: 'El email ya está en uso' }
      }

      updateData.email = data.email.toLowerCase()
    }

    if (data.nombre) updateData.nombre = data.nombre
    if (data.role) updateData.role = data.role
    if (data.password) {
      updateData.password = await hashPassword(data.password)
    }

    await db
      .update(usuarios)
      .set(updateData)
      .where(eq(usuarios.id, data.id))

    revalidatePath('/usuarios')

    return { success: true }
  } catch (error) {
    console.error('Error actualizando usuario:', error)
    return { error: 'Error al actualizar usuario. Intenta de nuevo.' }
  }
}

/**
 * Eliminar usuario (solo admin, no puede eliminarse a sí mismo)
 */
export async function deleteUsuario(id: string, currentUserId: string) {
  try {
    if (id === currentUserId) {
      return { error: 'No puedes eliminar tu propia cuenta' }
    }

    const [user] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, id))
      .limit(1)

    if (!user) {
      return { error: 'Usuario no encontrado' }
    }

    await db.delete(usuarios).where(eq(usuarios.id, id))

    revalidatePath('/usuarios')

    return { success: true }
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    return { error: 'Error al eliminar usuario. Intenta de nuevo.' }
  }
}

/**
 * Cambiar contraseña
 */
export async function cambiarPassword(
  userId: string, 
  passwordActual: string, 
  passwordNueva: string
) {
  try {
    if (passwordNueva.length < 8) {
      return { error: 'La nueva contraseña debe tener al menos 8 caracteres' }
    }

    const [user] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, userId))
      .limit(1)

    if (!user) {
      return { error: 'Usuario no encontrado' }
    }

    const passwordValid = await verifyPassword(passwordActual, user.password)
    
    if (!passwordValid) {
      return { error: 'Contraseña actual incorrecta' }
    }

    const hashedNewPassword = await hashPassword(passwordNueva)

    await db
      .update(usuarios)
      .set({
        password: hashedNewPassword,
        updatedAt: new Date(),
      })
      .where(eq(usuarios.id, userId))

    return { success: true }
  } catch (error) {
    console.error('Error cambiando contraseña:', error)
    return { error: 'Error al cambiar contraseña. Intenta de nuevo.' }
  }
}
