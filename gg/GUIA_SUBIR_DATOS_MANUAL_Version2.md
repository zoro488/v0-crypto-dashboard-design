# 📝 GUÍA: Cómo Subir Datos a Firestore Manualmente

## Opción 1: Desde Firebase Console (Más Fácil)

### Paso 1: Acceder a Firestore
1. Ve a: https://console.firebase.google.com/u/0/project/premium-ecosystem-1760790572/firestore
2. Inicia sesión con tu cuenta de Google
3. Selecciona "Firestore Database" en el menú lateral

### Paso 2: Crear Colecciones Manualmente
Para cada tipo de dato, crea una colección:

#### Colección: `clientes`
- Click en "Start collection"
- Nombre: `clientes`
- Agrega documentos con estos campos:
  - `nombre` (string)
  - `saldoPendiente` (number)
  - `totalPagado` (number)
  - `ultimaCompra` (timestamp)
  - `activo` (boolean)

#### Colección: `distribuidores`
- Nombre: `distribuidores`
- Campos:
  - `nombre` (string)
  - `telefono` (string)
  - `email` (string)
  - `activo` (boolean)

#### Colección: `ventas`
- Nombre: `ventas`
- Campos:
  - `fecha` (timestamp)
  - `cliente` (string)
  - `monto` (number)
  - `productos` (array)
  - `status` (string)

#### Colección: `bancos`
- Nombre: `bancos`
- Campos:
  - `nombre` (string)
  - `tipo` (string: 'azteca', 'leftie', 'profit', etc.)
  - `saldo` (number)
  - `movimientos` (array)

#### Colección: `almacen`
- Nombre: `almacen`
- Campos:
  - `producto` (string)
  - `cantidad` (number)
  - `precio` (number)
  - `ubicacion` (string)

---

## Opción 2: Importar desde Excel/CSV (Cuando tengas datos correctos)

### Preparar tus datos:
1. Asegúrate que tus archivos Excel/CSV tengan:
   - Encabezados claros en la primera fila
   - Datos limpios sin espacios extra
   - Fechas en formato consistente (YYYY-MM-DD)
   - Números sin símbolos de moneda

2. Guarda cada hoja como CSV separado en: `data/csv/`
   - `clientes.csv`
   - `distribuidores.csv`
   - `ventas.csv`
   - `bancos_azteca.csv`
   - `almacen.csv`
   - etc.

### Ejecutar importación automática:
```bash
# 1. Descargar credenciales (una sola vez)
# Ve a: https://console.firebase.google.com/u/0/project/premium-ecosystem-1760790572/settings/serviceaccounts/adminsdk
# Click "Generate new private key" y guarda como serviceAccountKey.json

# 2. Mover credenciales
npm run credentials:move

# 3. Validar datos
npm run validate:csv

# 4. Importar (prueba sin escribir)
npm run import:csv:dry-run

# 5. Importar real
npm run import:csv
```

---

## Opción 3: Desde la Aplicación Web

Si tu aplicación ya tiene formularios, puedes:
1. Ir a http://localhost:3001
2. Usar los formularios de cada sección para agregar datos uno por uno
3. Ventaja: Validación automática y formato correcto

---

## Estructura Recomendada de Firestore

```
firestore/
├── clientes/
│   ├── [id-auto] { nombre, saldo, ... }
│   └── [id-auto] { ... }
├── distribuidores/
│   ├── [id-auto] { nombre, telefono, ... }
│   └── [id-auto] { ... }
├── ventas/
│   ├── [id-auto] { fecha, cliente, monto, ... }
│   └── [id-auto] { ... }
├── bancos/
│   ├── [id-auto] { nombre, tipo, saldo, ... }
│   └── [id-auto] { ... }
├── almacen/
│   ├── [id-auto] { producto, cantidad, ... }
│   └── [id-auto] { ... }
└── ordenesCompra/
    ├── [id-auto] { fecha, proveedor, ... }
    └── [id-auto] { ... }
```

---

## Tips para Datos Correctos

### ✅ Buenos formatos:
- Fechas: `2025-01-15` o `2025-01-15T10:30:00`
- Números: `1500.50` (sin $ ni comas)
- Booleanos: `true` / `false`
- Textos: Sin espacios al inicio/final

### ❌ Evitar:
- Fechas: `15/01/2025` (ambiguo)
- Números: `$1,500.50` (con símbolos)
- Campos vacíos sin definir tipo
- Texto con saltos de línea en CSVs

---

## Archivos Disponibles

Los siguientes scripts están listos cuando tengas datos correctos:

- **scripts/importar-csv-firestore.js** - Importador principal
- **scripts/validar-csv.js** - Validador de formato
- **scripts/excel-to-csv.js** - Convertidor Excel → CSV
- **scripts/test-csv-setup.js** - Verificador de configuración

---

## Contacto de Ayuda

Si necesitas ayuda:
1. Revisa los logs de error en la consola
2. Verifica la estructura de tus CSVs
3. Prueba primero con pocos registros (5-10)
4. Usa el modo dry-run para validar sin escribir

---

**Nota**: Cuando tengas datos correctos, simplemente colócalos en `data/csv/` y ejecuta `npm run import:csv`
