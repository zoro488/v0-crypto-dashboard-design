'use server'

import { z } from 'zod'
import { db } from '@/database'
import { clientes } from '@/database/schema'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { eq } from 'drizzle-orm'

// ═══════════════════════════════════════════════════════════════
// SCHEMAS DE VALIDACIÓN ZOD
// ═══════════════════════════════════════════════════════════════

const CreateClienteSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  rfc: z.string().optional(),
  limiteCredito: z.number().nonnegative().default(0),
})

const UpdateClienteSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  rfc: z.string().optional(),
  limiteCredito: z.number().nonnegative().optional(),
  estado: z.enum(['activo', 'inactivo', 'suspendido']).optional(),
})

// ═══════════════════════════════════════════════════════════════
// TIPOS INFERIDOS
// ═══════════════════════════════════════════════════════════════

export type CreateClienteInput = z.infer<typeof CreateClienteSchema>
export type UpdateClienteInput = z.infer<typeof UpdateClienteSchema>

// ═══════════════════════════════════════════════════════════════
// SERVER ACTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Crear nuevo cliente
 */
export async function createCliente(formData: FormData) {
  const rawData = {
    nombre: formData.get('nombre'),
    email: formData.get('email') || undefined,
    telefono: formData.get('telefono') || undefined,
    direccion: formData.get('direccion') || undefined,
    rfc: formData.get('rfc') || undefined,
    limiteCredito: Number(formData.get('limiteCredito') || 0),
  }

  const parsed = CreateClienteSchema.safeParse(rawData)

  if (!parsed.success) {
    return { 
      error: 'Datos inválidos', 
      details: parsed.error.flatten().fieldErrors 
    }
  }

  const { data } = parsed
  const clienteId = nanoid()
  const now = new Date()

  try {
    await db.insert(clientes).values({
      id: clienteId,
      nombre: data.nombre,
      email: data.email || null,
      telefono: data.telefono || null,
      direccion: data.direccion || null,
      rfc: data.rfc || null,
      limiteCredito: data.limiteCredito,
      saldoPendiente: 0,
      estado: 'activo',
      createdAt: now,
      updatedAt: now,
    })

    revalidatePath('/clientes')
    revalidatePath('/ventas')

    return { success: true, id: clienteId }
  } catch (error) {
    console.error('Error creando cliente:', error)
    return { error: 'Error al crear cliente. Intenta de nuevo.' }
  }
}

/**
 * Actualizar cliente existente
 */
export async function updateCliente(formData: FormData) {
  const rawData = {
    id: formData.get('id'),
    nombre: formData.get('nombre') || undefined,
    email: formData.get('email') || undefined,
    telefono: formData.get('telefono') || undefined,
    direccion: formData.get('direccion') || undefined,
    rfc: formData.get('rfc') || undefined,
    limiteCredito: formData.get('limiteCredito') ? Number(formData.get('limiteCredito')) : undefined,
    estado: formData.get('estado') || undefined,
  }

  const parsed = UpdateClienteSchema.safeParse(rawData)

  if (!parsed.success) {
    return { 
      error: 'Datos inválidos', 
      details: parsed.error.flatten().fieldErrors 
    }
  }

  const { data } = parsed
  const { id, ...updateData } = data
  const now = new Date()

  try {
    await db
      .update(clientes)
      .set({
        ...updateData,
        updatedAt: now,
      })
      .where(eq(clientes.id, id))

    revalidatePath('/clientes')
    revalidatePath('/ventas')

    return { success: true }
  } catch (error) {
    console.error('Error actualizando cliente:', error)
    return { error: 'Error al actualizar cliente. Intenta de nuevo.' }
  }
}

/**
 * Obtener todos los clientes
 */
export async function getClientes() {
  try {
    const result = await db.query.clientes.findMany({
      orderBy: (clientes, { asc }) => [asc(clientes.nombre)],
    })
    return { success: true, data: result }
  } catch (error) {
    console.error('Error obteniendo clientes:', error)
    return { error: 'Error al obtener clientes' }
  }
}

/**
 * Obtener cliente por ID con ventas relacionadas
 */
export async function getClienteById(id: string) {
  try {
    const result = await db.query.clientes.findFirst({
      where: eq(clientes.id, id),
      with: {
        ventas: {
          orderBy: (ventas, { desc }) => [desc(ventas.fecha)],
        },
      },
    })
    
    if (!result) {
      return { error: 'Cliente no encontrado' }
    }
    
    return { success: true, data: result }
  } catch (error) {
    console.error('Error obteniendo cliente:', error)
    return { error: 'Error al obtener cliente' }
  }
}

/**
 * Obtener clientes activos para selects
 */
export async function getClientesActivos() {
  try {
    const result = await db.query.clientes.findMany({
      where: eq(clientes.estado, 'activo'),
      columns: {
        id: true,
        nombre: true,
        saldoPendiente: true,
        limiteCredito: true,
      },
      orderBy: (clientes, { asc }) => [asc(clientes.nombre)],
    })
    return { success: true, data: result }
  } catch (error) {
    console.error('Error obteniendo clientes activos:', error)
    return { error: 'Error al obtener clientes' }
  }
}

/**
 * Obtener estadísticas de clientes
 */
export async function getClientesStats() {
  try {
    const allClientes = await db.query.clientes.findMany()
    
    const totalClientes = allClientes.length
    const clientesActivos = allClientes.filter(c => c.estado === 'activo').length
    const clientesInactivos = allClientes.filter(c => c.estado === 'inactivo').length
    const clientesSuspendidos = allClientes.filter(c => c.estado === 'suspendido').length
    
    const saldoPendienteTotal = allClientes.reduce((sum, c) => sum + (c.saldoPendiente ?? 0), 0)
    const limiteCreditoTotal = allClientes.reduce((sum, c) => sum + (c.limiteCredito ?? 0), 0)
    
    const clientesConDeuda = allClientes.filter(c => (c.saldoPendiente ?? 0) > 0).length
    
    return { 
      success: true, 
      data: {
        totalClientes,
        clientesActivos,
        clientesInactivos,
        clientesSuspendidos,
        saldoPendienteTotal,
        limiteCreditoTotal,
        clientesConDeuda,
      }
    }
  } catch (error) {
    console.error('Error obteniendo stats de clientes:', error)
    return { error: 'Error al obtener estadísticas' }
  }
}
