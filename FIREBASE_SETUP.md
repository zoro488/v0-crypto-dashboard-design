# Configuración de Firebase Firestore

## 1. Configurar Reglas de Seguridad

Para que FlowDistributor funcione correctamente, necesitas configurar las reglas de seguridad en Firebase Console:

### Pasos:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Firestore Database**
4. Click en la pestaña **Rules** (Reglas)
5. Copia y pega el contenido del archivo `firestore.rules`
6. Click en **Publish** (Publicar)

### ⚠️ IMPORTANTE - Reglas de Seguridad

**NUNCA uses `allow read, write: if true;` en producción.**

Las reglas correctas requieren autenticación. Consulta el archivo `firestore.rules` del proyecto que implementa:
- Validación de autenticación (`request.auth != null`)
- Validación de campos requeridos
- Funciones de validación reutilizables
- Regla por defecto que deniega acceso

### Reglas de Producción (en firestore.rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Función de autenticación
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Todas las colecciones requieren autenticación
    match /bancos/{bancoId} {
      allow read, write: if isAuthenticated();
    }
    
    match /ventas/{ventaId} {
      allow read, write: if isAuthenticated();
    }
    
    // ... ver firestore.rules para reglas completas
    
    // DENEGAR todo lo demás
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 2. Inicializar Colecciones

Una vez configuradas las reglas, el sistema creará automáticamente las colecciones cuando hagas la primera operación (crear orden de compra, venta, etc.)

## 3. Estructura de Datos

El sistema utiliza las siguientes colecciones:

- **bancos**: Almacena los 7 bancos (Bóveda Monte, Bóveda USA, Utilidades, Fletes, Azteca, Leftie, Profit)
- **ordenesCompra**: Órdenes de compra a distribuidores
- **ventas**: Ventas a clientes
- **distribuidores**: Perfiles de distribuidores con historial de compras
- **clientes**: Perfiles de clientes con historial de ventas
- **almacen**: Stock de productos disponibles
- **productos**: Catálogo de productos

## 4. Habilitar Firestore en Producción

Actualmente el sistema usa datos locales para evitar errores de permisos. Una vez configuradas las reglas:

1. Las operaciones se sincronizarán automáticamente con Firestore
2. Los datos persistirán entre sesiones
3. Múltiples usuarios podrán trabajar simultáneamente

## Notas Importantes

- Las reglas actuales permiten acceso completo (solo para desarrollo)
- Para producción, considera agregar autenticación y reglas más estrictas
- Los datos se sincronizan en tiempo real entre todos los clientes conectados
