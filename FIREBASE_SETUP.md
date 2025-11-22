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

### Reglas de Seguridad (Copiar esto):

\`\`\`
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    match /bancos/{bancoId} {
      allow read, write: if true;
    }
    
    match /ordenesCompra/{ordenId} {
      allow read, write: if true;
    }
    
    match /ventas/{ventaId} {
      allow read, write: if true;
    }
    
    match /distribuidores/{distribuidorId} {
      allow read, write: if true;
    }
    
    match /clientes/{clienteId} {
      allow read, write: if true;
    }
    
    match /almacen/{productoId} {
      allow read, write: if true;
    }
    
    match /productos/{productoId} {
      allow read, write: if true;
    }
  }
}
\`\`\`

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
