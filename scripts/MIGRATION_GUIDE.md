# 🚀 Guía de Migración Maestra - CHRONOS

Este documento explica cómo ejecutar la migración completa de datos a Firestore con la lógica GYA (Ganancia y Asignación).

## Opciones de Migración

| Comando | Fuente | Descripción |
|---------|--------|-------------|
| `pnpm migrate:json` | JSON | **RECOMENDADO** - Migra desde `BASE_DATOS_FLOWDISTRIBUTOR_UNIFICADO.json` |
| `pnpm migrate:master` | CSV | Migra desde archivos CSV en `/csv/` |

### ¿Cuál usar?

- **`migrate:json`** (Recomendado): Incluye RF Actual de cada banco y movimientos detallados
- **`migrate:master`**: Útil si solo tienes los CSVs actualizados

## Prerrequisitos

1. **Credenciales de Firebase Admin SDK**
   - Ve a Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Guarda el archivo como `scripts/service-account.json`

2. **Instalar dependencias del script**
   ```bash
   cd scripts
   npm install
   ```

## Ejecutar la Migración

### Opción 1: Desde JSON (RECOMENDADO)
```bash
# Desde la raíz del proyecto
pnpm migrate:json

# O desde scripts/
cd scripts && npm run migrate:json
```

### Opción 2: Desde CSVs
```bash
pnpm migrate:master
```

## ¿Qué hace la migración?

### 1. Estructura de Bancos (7 entidades)
- `boveda_monte` - Bóveda principal (recibe costos)
- `boveda_usa` - Bóveda en USD
- `profit` - Banco operativo
- `leftie` - Banco operativo
- `azteca` - Banco Azteca
- `flete_sur` - Gastos de flete
- `utilidades` - Ganancias netas

### 2. Órdenes de Compra
Lee `csv/ordenes_compra.csv` y crea:
- Documentos en colección `ordenes_compra`
- Distribuidores asociados

### 3. Ventas con Distribución GYA
Lee `csv/ventas.csv` y aplica la lógica del Excel:

```
Bóveda Monte = Costo (bovedaMonte del CSV)
Flete Sur    = fleteUtilidad del CSV
Utilidades   = utilidad del CSV (ganancia neta)
```

Para cada venta **PAGADA**, crea movimientos bancarios automáticos.

### 4. Clientes
Crea/actualiza clientes basándose en las ventas.

### 5. Gastos y Abonos
Lee `csv/gastos_abonos.csv` (si existe).

## Estructura de CSVs Esperada

### ventas.csv
```csv
fecha,ocRelacionada,cantidad,cliente,bovedaMonte,precioVenta,ingreso,flete,fleteUtilidad,utilidad,estatus,concepto
2025-08-23,OC0001,150,Cliente X,945000,6300,945000,Aplica,75000,0,Pendiente,
```

### ordenes_compra.csv
```csv
id,fecha,origen,cantidad,costoDistribuidor,costoTransporte,costoPorUnidad,stockActual,costoTotal,pagoDistribuidor,deuda
OC0001,2025-08-25,Q-MAYA,423,6100,200,6300,0,2664900,0,0
```

## Verificación Post-Migración

1. Abrir el dashboard: `pnpm dev`
2. Verificar en **BentoDashboard**:
   - Totales de bancos
   - Número de ventas
3. Verificar en **BentoVentas**:
   - Distribución GYA por venta
   - Estados de pago

## Resumen de Distribución GYA

```
Total Venta = Bóveda Monte + Flete + Utilidad

Donde:
- Bóveda Monte = Costo de adquisición (recuperación de inversión)
- Flete = Costo de transporte/envío
- Utilidad = Ganancia neta (puede ser negativa en tramites)
```

## Troubleshooting

### Error: "No se pudo configurar Firebase Admin"
- Verificar que `scripts/service-account.json` exista
- O establecer `GOOGLE_APPLICATION_CREDENTIALS` en `.env.local`

### Error: "Firestore no disponible"
- Verificar conexión a internet
- Verificar que las credenciales sean válidas
- Verificar que el proyecto de Firebase exista

### Datos no aparecen en el dashboard
- Esperar unos segundos (propagación)
- Verificar en Firebase Console → Firestore
- Revisar logs del terminal
