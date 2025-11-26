# Configuración de Firebase Firestore

## 1. Configurar Reglas de Seguridad

Para que FlowDistributor funcione correctamente, necesitas configurar las reglas de seguridad en Firebase Console:

### Pasos:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **premium-ecosystem-1760790572**
3. En el menú lateral, ve a **Firestore Database**
4. Click en la pestaña **Rules** (Reglas)
5. Copia y pega el contenido del archivo `firestore.rules`
6. Click en **Publish** (Publicar)

### Reglas de Seguridad de Producción

Las reglas actuales requieren **autenticación** para todas las operaciones:

\`\`\`javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Funciones helper
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function hasRequiredFields(fields) {
      return request.resource.data.keys().hasAll(fields);
    }
    
    // BANCOS - Solo lectura para usuarios autenticados, escritura restringida
    match /bancos/{bancoId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() 
        && hasRequiredFields(['nombre', 'capitalActual', 'createdAt']);
      allow update: if isAuthenticated();
      allow delete: if false; // No permitir eliminar bancos
    }
    
    // ÓRDENES DE COMPRA
    match /ordenesCompra/{ordenId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
        && hasRequiredFields(['distribuidor', 'producto', 'cantidad', 'fecha']);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // VENTAS
    match /ventas/{ventaId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
        && hasRequiredFields(['cliente', 'producto', 'cantidad', 'fecha']);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // DISTRIBUIDORES
    match /distribuidores/{distribuidorId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // CLIENTES
    match /clientes/{clienteId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // PRODUCTOS
    match /productos/{productoId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // ALMACÉN
    match /almacen/{productoId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // Regla catch-all: denegar todo lo demás
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
\`\`\`

### ⚠️ Modo Desarrollo (Solo para Testing Local)

Si necesitas probar sin autenticación durante el desarrollo, puedes usar temporalmente las siguientes reglas **INSEGURAS**:

\`\`\`javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // ⚠️ ADVERTENCIA: Reglas completamente abiertas - SOLO PARA DESARROLLO
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
\`\`\`

> **⚠️ IMPORTANTE**: Nunca uses las reglas de desarrollo en producción. Permiten acceso completo sin autenticación.

## 2. Configurar Autenticación

Para que las reglas de producción funcionen, debes habilitar la autenticación en Firebase:

1. Ve a **Authentication** en Firebase Console
2. Click en **Get Started**
3. Habilita los métodos de autenticación que necesites (Email/Password, Google, etc.)
4. Implementa el flujo de autenticación en tu aplicación

## 3. Inicializar Colecciones

Una vez configuradas las reglas y la autenticación, el sistema creará automáticamente las colecciones cuando hagas la primera operación (crear orden de compra, venta, etc.)

## 4. Estructura de Datos

El sistema utiliza las siguientes colecciones:

| Colección | Descripción | Campos Requeridos (create) |
|-----------|-------------|----------------------------|
| **bancos** | Control financiero (Bóveda Monte, Bóveda USA, Utilidades, Fletes, Azteca, Leftie, Profit) | `nombre`, `capitalActual`, `createdAt` |
| **ordenesCompra** | Órdenes de compra a distribuidores | `distribuidor`, `producto`, `cantidad`, `fecha` |
| **ventas** | Ventas a clientes | `cliente`, `producto`, `cantidad`, `fecha` |
| **distribuidores** | Perfiles de distribuidores con historial de compras | - |
| **clientes** | Perfiles de clientes con historial de ventas | - |
| **almacen** | Stock de productos disponibles | - |
| **productos** | Catálogo de productos | - |

## 5. Características de Seguridad

Las reglas de producción incluyen las siguientes protecciones:

- ✅ **Autenticación requerida**: Todas las operaciones requieren un usuario autenticado
- ✅ **Validación de campos**: Se validan campos requeridos en operaciones de creación
- ✅ **Protección de bancos**: No se permite eliminar registros de bancos
- ✅ **Catch-all seguro**: Se deniega acceso a colecciones no definidas
- ✅ **Funciones helper reutilizables**: Código limpio y mantenible

## 6. Notas Importantes

- Las reglas de producción requieren autenticación para todas las operaciones
- Los datos se sincronizan en tiempo real entre todos los clientes conectados
- Para desarrollo local, puedes usar las reglas abiertas temporalmente
- Siempre verifica que las reglas de producción estén activas antes de desplegar
