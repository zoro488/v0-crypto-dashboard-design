# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                    CHRONOS SYSTEM - QUICK START GUIDE                      ║
# ║                    Guía Rápida de Configuración e Inicio                   ║
# ╚════════════════════════════════════════════════════════════════════════════╝

## 🚀 INICIO RÁPIDO

### 1. Configuración Inicial (Primera vez)

```bash
# 1. Clonar el repositorio (si aún no lo tienes)
git clone <tu-repo-url>
cd v0-crypto-dashboard-design

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Firebase

# 4. Ejecutar limpieza inicial (opcional pero recomendado)
pnpm run cleanup

# 5. Iniciar en modo desarrollo
pnpm dev
```

### 2. Comandos Disponibles

```bash
# Desarrollo
pnpm dev                 # Iniciar servidor de desarrollo (puerto 3000)
pnpm build              # Crear build de producción
pnpm start              # Iniciar servidor de producción
pnpm lint               # Ejecutar ESLint
pnpm lint:fix           # Ejecutar ESLint y corregir automáticamente
pnpm format             # Formatear código con Prettier
pnpm type-check         # Verificar tipos TypeScript sin compilar

# Análisis
pnpm analyze            # Analizar tamaño del bundle

# Limpieza
pnpm cleanup            # Ejecutar script de limpieza

# Firebase
pnpm migrate            # Migrar datos a Firestore
pnpm migrate:web        # Migrar desde navegador
pnpm migrate:verify     # Verificar migración
```

### 3. Estructura del Proyecto

```
v0-crypto-dashboard-design/
├── app/                        # Página principal de Next.js
├── frontend/app/               # Aplicación frontend principal
│   ├── components/            # Componentes React
│   │   ├── layout/           # Componentes de layout (Header, Nav, etc.)
│   │   ├── modals/           # Modales funcionales
│   │   ├── panels/           # Paneles principales (Dashboard, etc.)
│   │   ├── ui/               # Componentes UI base (shadcn/ui)
│   │   ├── visualizations/   # Gráficos y visualizaciones
│   │   └── 3d/               # Componentes 3D (Spline, Three.js)
│   ├── lib/                  # Utilidades y configuración
│   │   ├── firebase/         # Configuración Firebase/Firestore
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store/            # Estado global (Zustand)
│   │   └── utils/            # Utilidades (logger, performance)
│   └── types/                # Definiciones TypeScript
├── backend/                   # API Backend (Node.js + Express)
│   ├── src/
│   │   ├── api/              # Rutas API
│   │   ├── config/           # Configuración (Firebase, logger)
│   │   ├── middleware/       # Middleware Express
│   │   ├── models/           # Modelos de datos
│   │   ├── services/         # Lógica de negocio
│   │   └── utils/            # Utilidades backend
│   └── tests/                # Tests unitarios
├── components/               # Componentes compartidos
├── public/                   # Archivos estáticos
├── scripts/                  # Scripts de utilidad
└── [archivos de config]      # Configuraciones (next, ts, tailwind, etc.)
```

### 4. Variables de Entorno Requeridas

Copiar `.env.example` a `.env.local` y configurar:

```env
# Firebase Frontend
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
# ... resto de variables Firebase

# Backend (si aplica)
FIREBASE_PROJECT_ID=tu_project_id
JWT_SECRET=tu_secret_aqui
```

### 5. Navegación del Sistema

Una vez iniciado, el sistema incluye:

- **Dashboard**: Vista general con métricas principales
- **Órdenes de Compra**: Gestión de compras a distribuidores
- **Ventas**: Registro y seguimiento de ventas
- **Distribuidores**: Gestión de proveedores
- **Clientes**: Base de datos de clientes
- **Banco**: Sistema bancario completo con múltiples cuentas
- **Almacén**: Control de inventario y stock
- **Reportes**: Análisis y reportes financieros
- **IA**: Panel de inteligencia artificial
- **Profit**: Análisis de rentabilidad

### 6. Características Principales

✅ **10 Paneles Funcionales** con lazy loading
✅ **20+ Modales** para operaciones CRUD
✅ **Firebase/Firestore** integración completa
✅ **Sistema Bancario** con múltiples cuentas
✅ **Control de Inventario** en tiempo real
✅ **Animaciones 3D** con Spline y Three.js
✅ **Tema Oscuro/Claro** configurable
✅ **Responsive Design** para móviles y tablets
✅ **Type-Safe** con TypeScript
✅ **Performance Optimizado** con code splitting

### 7. Desarrollo

```bash
# Terminal 1: Frontend
pnpm dev

# Terminal 2: Backend (opcional)
cd backend
pnpm dev

# El frontend estará en: http://localhost:3000
# El backend estará en: http://localhost:3001
```

### 8. Solución de Problemas Comunes

#### Puerto 3000 ocupado
```bash
# Cambiar puerto en package.json o usar:
PORT=3001 pnpm dev
```

#### Errores de TypeScript
```bash
# Verificar tipos
pnpm type-check

# Reconstruir
rm -rf .next
pnpm dev
```

#### Problemas con node_modules
```bash
# Limpiar y reinstalar
pnpm run cleanup
pnpm install
```

#### Firebase no conecta
- Verificar `.env.local` existe y tiene valores correctos
- Verificar reglas de Firestore permiten acceso
- Revisar consola del navegador para errores específicos

### 9. Build para Producción

```bash
# 1. Crear build optimizado
pnpm build

# 2. Probar build localmente
pnpm start

# 3. Deploy (ejemplo Vercel)
vercel deploy

# O usar el deploy configurado en tu plataforma
```

### 10. Mantenimiento

```bash
# Actualizar dependencias (con cuidado)
pnpm update --interactive

# Verificar seguridad
pnpm audit

# Limpiar proyecto regularmente
pnpm run cleanup
```

## 📚 Documentación Adicional

- `SISTEMA_OPTIMIZADO_COMPLETO.md` - Análisis completo del sistema
- `FIREBASE_SETUP.md` - Configuración detallada de Firebase
- `CHRONOS_SYSTEM_COMPLETE.md` - Documentación del sistema completo
- `backend/README.md` - Documentación del API backend

## 🆘 Soporte

Para problemas o preguntas:
1. Revisar documentación en archivos .md
2. Verificar consola del navegador (F12)
3. Revisar logs del servidor
4. Consultar repositorio de GitHub

## 🎉 ¡Listo!

Tu sistema CHRONOS está configurado y listo para usar. ¡Buen desarrollo! ✨
