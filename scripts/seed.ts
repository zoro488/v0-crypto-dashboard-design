import { db } from '@/database'
import { bancos, clientes, distribuidores, usuarios } from '@/database/schema'
import { nanoid } from 'nanoid'
import { BANCOS_CONFIG, BANCOS_ORDENADOS } from '@/app/_lib/constants/bancos'

/**
 * Script de seed para inicializar la base de datos con datos de prueba
 * Ejecutar con: pnpm tsx scripts/seed.ts
 */

async function seed() {
  console.log('🌱 Iniciando seed de la base de datos...')

  try {
    // 1. Crear usuario admin
    console.log('📝 Creando usuario admin...')
    await db.insert(usuarios).values({
      id: 'admin-1',
      email: 'admin@chronos.com',
      password: 'chronos2025', // En producción usar hash
      nombre: 'Administrador',
      role: 'admin',
    }).onConflictDoNothing()

    // 2. Crear los 7 bancos/bóvedas
    console.log('🏦 Creando bancos/bóvedas...')
    for (const banco of BANCOS_ORDENADOS) {
      await db.insert(bancos).values({
        id: banco.id,
        nombre: banco.nombre,
        tipo: banco.tipo,
        capitalActual: 0,
        historicoIngresos: 0,
        historicoGastos: 0,
        color: banco.color,
        icono: banco.icono,
        orden: banco.orden,
        activo: true,
      }).onConflictDoNothing()
    }

    // 3. Crear clientes de ejemplo
    console.log('👥 Creando clientes...')
    const clientesData = [
      { nombre: 'Juan Pérez', email: 'juan@empresa.com', telefono: '555-1234', direccion: 'Calle Principal 123', limiteCredito: 50000 },
      { nombre: 'María García', email: 'maria@negocio.com', telefono: '555-5678', direccion: 'Av. Central 456', limiteCredito: 75000 },
      { nombre: 'Carlos López', email: 'carlos@comercial.com', telefono: '555-9012', direccion: 'Blvd. Norte 789', limiteCredito: 100000 },
      { nombre: 'Ana Martínez', email: 'ana@distribuidora.com', telefono: '555-3456', direccion: 'Plaza Sur 321', limiteCredito: 60000 },
      { nombre: 'Roberto Sánchez', email: 'roberto@tienda.com', telefono: '555-7890', direccion: 'Calle Comercio 654', limiteCredito: 45000 },
      { nombre: 'Laura Hernández', email: 'laura@almacen.com', telefono: '555-2345', direccion: 'Av. Industrial 987', limiteCredito: 80000 },
      { nombre: 'Miguel Torres', email: 'miguel@mayorista.com', telefono: '555-6789', direccion: 'Zona Centro 147', limiteCredito: 120000 },
      { nombre: 'Patricia Díaz', email: 'patricia@retail.com', telefono: '555-0123', direccion: 'Plaza Mayor 258', limiteCredito: 55000 },
      { nombre: 'Fernando Ruiz', email: 'fernando@market.com', telefono: '555-4567', direccion: 'Calle Principal 369', limiteCredito: 90000 },
      { nombre: 'Carmen Morales', email: 'carmen@comercio.com', telefono: '555-8901', direccion: 'Av. Libertad 741', limiteCredito: 70000 },
    ]

    for (const cliente of clientesData) {
      await db.insert(clientes).values({
        id: nanoid(),
        ...cliente,
        saldoPendiente: 0,
        estado: 'activo',
      }).onConflictDoNothing()
    }

    // 4. Crear distribuidores de ejemplo
    console.log('🚚 Creando distribuidores...')
    const distribuidoresData = [
      { nombre: 'Proveedor Nacional SA', empresa: 'Proveedor Nacional', telefono: '555-1111', email: 'ventas@provnacional.com', tipoProductos: 'Electrónicos' },
      { nombre: 'Importadora del Norte', empresa: 'Importadora Norte', telefono: '555-2222', email: 'contacto@impnorte.com', tipoProductos: 'Accesorios' },
      { nombre: 'Distribuidora Central', empresa: 'Dist. Central', telefono: '555-3333', email: 'pedidos@distcentral.com', tipoProductos: 'Varios' },
      { nombre: 'Mayorista Sur', empresa: 'Mayorista Sur SA', telefono: '555-4444', email: 'ventas@mayosur.com', tipoProductos: 'Tecnología' },
      { nombre: 'Comercializadora Este', empresa: 'Com. Este', telefono: '555-5555', email: 'info@comeste.com', tipoProductos: 'Hogar' },
    ]

    for (const dist of distribuidoresData) {
      await db.insert(distribuidores).values({
        id: nanoid(),
        ...dist,
        saldoPendiente: 0,
        estado: 'activo',
      }).onConflictDoNothing()
    }

    console.log('✅ Seed completado exitosamente!')
    console.log('📊 Resumen:')
    console.log('   - 1 usuario admin')
    console.log('   - 7 bancos/bóvedas')
    console.log('   - 10 clientes')
    console.log('   - 5 distribuidores')

  } catch (error) {
    console.error('❌ Error en seed:', error)
    process.exit(1)
  }
}

seed()
