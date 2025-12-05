@# 🏦 FlowDistributor - Sistema de Gestión Financiera

[![Production Ready](https://img.shields.io/badge/status-PRODUCTION%20READY-success)](/)
[![Version](https://img.shields.io/badge/version-3.0.0-blue)](/)
[![Firebase](https://img.shields.io/badge/Firebase-v11-orange)](/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](/)

## 📋 Tabla de Contenidos

- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Módulos Principales](#módulos-principales)
- [Lógica de Negocio GYA](#lógica-de-negocio-gya)
- [Cloud Functions](#cloud-functions)
- [Security Rules](#security-rules)
- [Despliegue a Producción](#despliegue-a-producción)
- [Verificación del Sistema](#verificación-del-sistema)

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FlowDistributor Architecture                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │  Next.js 16 │───▶│  Firebase   │───▶│   Cloud     │             │
│  │  React 19   │    │  Firestore  │    │  Functions  │             │
│  │  TypeScript │    │  v11        │    │  (Atomic)   │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│         │                   │                  │                     │
│         │                   ▼                  │                     │
│         │           ┌─────────────┐           │                     │
│         └──────────▶│  Security   │◀──────────┘                     │
│                     │   Rules     │                                  │
│                     └─────────────┘                                  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Frontend | Next.js + React | 16 / 19 |
| Language | TypeScript | Strict Mode |
| UI | Tailwind CSS + shadcn/ui | Latest |
| State | Zustand + React Query | Latest |
| Backend | Firebase Firestore | v11 |
| Functions | Cloud Functions | v4.5 |
| 3D | Spline + Canvas API | Latest |

---

## 📦 Módulos Principales

### 1. 📦 Órdenes de Compra
- Multi-producto por orden
- Adeudo automático a distribuidor
- Entrada automática en almacén
- Pago inicial opcional desde cualquier banco

### 2. 🚚 Distribuidores
- Perfil automático al crear OC
- Historial de pagos completo
- Deuda acumulada por proveedor
- Estado: pendiente/parcial/pagado

### 3. 📋 Almacén
- Stock = Σ Entradas − Σ Salidas
- Entradas INMUTABLES (auditoría)
- Salidas INMUTABLES (auditoría)
- Alertas de stock mínimo

### 4. 🛒 Ventas
- Multi-producto por venta
- Distribución GYA automática
- Estados: completo/parcial/pendiente
- Vinculación cliente automática

### 5. 👥 Clientes / Deudas
- Historial de abonos completo
- Deuda solo puede BAJAR
- Abonos distribuidos proporcionalmente

### 6. 🏦 Bancos (6+1)
| Banco | Tipo | Función |
|-------|------|---------|
| boveda_monte | bóveda | Recibe costos de ventas |
| boveda_usa | bóveda | Reserva externa |
| utilidades | utilidades | Ganancias netas |
| flete_sur | gastos | Ingresos por flete |
| azteca | operativo | Operaciones diarias |
| leftie | operativo | Operaciones diarias |
| profit | operativo | Operaciones diarias |

### 7. 📊 Dashboard
- Métricas en tiempo real
- Visualizaciones 3D con Spline
- Gráficos interactivos (Recharts)
- KPIs de rendimiento

---

## 💰 Lógica de Negocio GYA

### Fórmula de Distribución de Ventas

```typescript
// DATOS DE ENTRADA
const precioVentaUnidad = 10000  // Precio VENTA al cliente
const precioCompraUnidad = 6300 // Precio COMPRA (costo distribuidor)
const precioFlete = 500         // Flete por unidad
const cantidad = 10

// DISTRIBUCIÓN CORRECTA A 3 BANCOS:
const montoBovedaMonte = precioCompraUnidad * cantidad    // 63,000 (COSTO)
const montoFletes = precioFlete * cantidad                 // 5,000
const montoUtilidades = (precioVentaUnidad - precioCompraUnidad - precioFlete) * cantidad  
// = (10000 - 6300 - 500) * 10 = 32,000 (GANANCIA NETA)

// TOTAL = 63,000 + 5,000 + 32,000 = 100,000 ✓
```

### Estados de Pago

| Estado | Descripción | Efecto en Bancos |
|--------|-------------|------------------|
| **Completo** | 100% pagado | 100% va a capitalActual |
| **Parcial** | Pago fraccionado | Proporción va a capitalActual |
| **Pendiente** | Sin pago | Solo historicoIngresos (referencia) |

### Fórmulas de Capital Bancario

```typescript
// FÓRMULA CRÍTICA - NUNCA MODIFICAR
capitalActual = historicoIngresos - historicoGastos

// REGLAS INMUTABLES
historicoIngresos: SOLO puede SUBIR
historicoGastos: SOLO puede SUBIR
deudaCliente: SOLO puede BAJAR
deudaDistribuidor: SOLO puede BAJAR
```

---

## ☁️ Cloud Functions

### Funciones Disponibles

```typescript
// 1. Crear venta con distribución GYA
crearVentaCompleta(data: CrearVentaInput): VentaResult

// 2. Crear orden de compra multi-producto
crearOrdenCompraCompleta(data: CrearOrdenCompraInput): OrdenCompraResult

// 3. Abonar cliente (reduce deuda, distribuye a bancos)
abonarCliente(data: AbonoInput): { success: boolean, abonoId: string }

// 4. Pagar distribuidor (gasto desde banco seleccionado)
pagarDistribuidor(data: PagoDistribuidorInput): { success: boolean, pagoId: string }

// 5. Transferencia entre bancos (atómica)
transferirEntreBancos(data: TransferenciaInput): { success: boolean, transferId: string }

// 6. Registrar gasto
registrarGasto(data: GastoInput): { success: boolean, gastoId: string }

// 7. Registrar ingreso (solo azteca, leftie, profit)
registrarIngreso(data: IngresoInput): { success: boolean, ingresoId: string }
```

### Desplegar Cloud Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

---

## 🔒 Security Rules

### Principios de Seguridad

1. **Autenticación obligatoria**: Todas las operaciones requieren `request.auth != null`
2. **Históricos inmutables**: `historicoIngresos` y `historicoGastos` NUNCA bajan
3. **Deudas solo bajan**: `deudaTotal` y `deuda` solo pueden decrementarse
4. **Registros inmutables**: Movimientos, ventas, abonos NO se pueden editar/eliminar
5. **Admin para eliminaciones**: Solo rol admin puede eliminar documentos críticos

### Estructura de Reglas

```javascript
// Bancos - históricos nunca bajan
match /bancos/{bancoId} {
  allow read: if isAuthenticated();
  allow update: if isAuthenticated() 
    && historicoNuncaBaja('historicoIngresos')
    && historicoNuncaBaja('historicoGastos');
  allow delete: if false;
}

// Movimientos - completamente inmutables
match /movimientos/{docId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && montoPositivo();
  allow update, delete: if false;
}
```

### Desplegar Security Rules

```bash
firebase deploy --only firestore:rules
```

---

## 🚀 Despliegue a Producción

### Pre-requisitos

1. Node.js 20+
2. pnpm instalado
3. Firebase CLI configurado
4. Variables de entorno configuradas

### Variables de Entorno Requeridas

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

# Optional
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=xxx
```

### Pasos de Despliegue

```bash
# 1. Instalar dependencias
pnpm install

# 2. Verificar tipos
pnpm type-check

# 3. Build de producción
pnpm build

# 4. Desplegar Cloud Functions
cd functions && npm install && npm run build
firebase deploy --only functions

# 5. Desplegar Security Rules
firebase deploy --only firestore:rules

# 6. Desplegar a Vercel (o plataforma elegida)
vercel --prod
```

---

## ✅ Verificación del Sistema

### Checklist de Producción

- [ ] Variables de entorno configuradas
- [ ] Firebase project en modo producción
- [ ] Cloud Functions desplegadas
- [ ] Security Rules desplegadas
- [ ] Build de Next.js exitoso
- [ ] Tests pasando
- [ ] Dominio configurado

### Comandos de Verificación

```bash
# Verificar tipos
pnpm type-check

# Verificar lint
pnpm lint

# Ejecutar tests
pnpm test

# Build de producción
pnpm build
```

### Tests Críticos

1. **Crear venta** → Verificar distribución a 3 bancos
2. **Abono cliente** → Verificar reducción de deuda
3. **Pago distribuidor** → Verificar descuento de banco
4. **Transferencia** → Verificar movimiento entre bancos
5. **Security Rules** → Verificar inmutabilidad de históricos

---

## 📞 Soporte

Para reportar problemas o solicitar mejoras, crear un issue en el repositorio.

---

**FlowDistributor v3.0.0** - Sistema de Gestión Financiera Production-Ready
