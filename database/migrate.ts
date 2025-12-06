// database/migrate.ts
import { db } from './index'
import { sql } from 'drizzle-orm'

async function runMigration() {
  console.log('🔄 Running database migrations...')
  
  try {
    // Create tables
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        nombre TEXT NOT NULL,
        role TEXT DEFAULT 'viewer',
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        email TEXT,
        telefono TEXT,
        direccion TEXT,
        rfc TEXT,
        limite_credito REAL DEFAULT 0,
        saldo_pendiente REAL DEFAULT 0,
        estado TEXT DEFAULT 'activo',
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS distribuidores (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        empresa TEXT,
        telefono TEXT,
        email TEXT,
        tipo_productos TEXT,
        saldo_pendiente REAL DEFAULT 0,
        estado TEXT DEFAULT 'activo',
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS bancos (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL,
        capital_actual REAL DEFAULT 0 NOT NULL,
        historico_ingresos REAL DEFAULT 0 NOT NULL,
        historico_gastos REAL DEFAULT 0 NOT NULL,
        color TEXT NOT NULL,
        icono TEXT,
        orden INTEGER DEFAULT 0,
        activo INTEGER DEFAULT 1,
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS ventas (
        id TEXT PRIMARY KEY,
        cliente_id TEXT NOT NULL REFERENCES clientes(id),
        fecha INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_venta_unidad REAL NOT NULL,
        precio_compra_unidad REAL NOT NULL,
        precio_flete REAL DEFAULT 0,
        precio_total_venta REAL NOT NULL,
        monto_pagado REAL DEFAULT 0,
        monto_restante REAL NOT NULL,
        monto_boveda_monte REAL DEFAULT 0,
        monto_fletes REAL DEFAULT 0,
        monto_utilidades REAL DEFAULT 0,
        estado_pago TEXT DEFAULT 'pendiente',
        observaciones TEXT,
        created_by TEXT REFERENCES usuarios(id),
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS ordenes_compra (
        id TEXT PRIMARY KEY,
        distribuidor_id TEXT NOT NULL REFERENCES distribuidores(id),
        fecha INTEGER NOT NULL,
        numero_orden TEXT UNIQUE,
        cantidad INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        subtotal REAL NOT NULL,
        iva REAL DEFAULT 0,
        total REAL NOT NULL,
        monto_pagado REAL DEFAULT 0,
        monto_restante REAL NOT NULL,
        estado TEXT DEFAULT 'pendiente',
        banco_origen_id TEXT REFERENCES bancos(id),
        observaciones TEXT,
        created_by TEXT REFERENCES usuarios(id),
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS movimientos (
        id TEXT PRIMARY KEY,
        banco_id TEXT NOT NULL REFERENCES bancos(id),
        tipo TEXT NOT NULL,
        monto REAL NOT NULL,
        fecha INTEGER NOT NULL,
        concepto TEXT NOT NULL,
        referencia TEXT,
        banco_origen_id TEXT REFERENCES bancos(id),
        banco_destino_id TEXT REFERENCES bancos(id),
        cliente_id TEXT REFERENCES clientes(id),
        distribuidor_id TEXT REFERENCES distribuidores(id),
        venta_id TEXT REFERENCES ventas(id),
        orden_compra_id TEXT REFERENCES ordenes_compra(id),
        observaciones TEXT,
        created_by TEXT REFERENCES usuarios(id),
        created_at INTEGER DEFAULT (unixepoch())
      )
    `)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS almacen (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        cantidad INTEGER NOT NULL DEFAULT 0,
        precio_compra REAL NOT NULL,
        precio_venta REAL NOT NULL,
        minimo INTEGER DEFAULT 0,
        ubicacion TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `)

    // Create indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS email_idx ON usuarios(email)`)
    await db.run(sql`CREATE INDEX IF NOT EXISTS cliente_nombre_idx ON clientes(nombre)`)
    await db.run(sql`CREATE INDEX IF NOT EXISTS venta_cliente_idx ON ventas(cliente_id)`)
    await db.run(sql`CREATE INDEX IF NOT EXISTS venta_fecha_idx ON ventas(fecha)`)
    await db.run(sql`CREATE INDEX IF NOT EXISTS mov_banco_idx ON movimientos(banco_id)`)
    await db.run(sql`CREATE INDEX IF NOT EXISTS mov_fecha_idx ON movimientos(fecha)`)

    console.log('✅ Migrations completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
