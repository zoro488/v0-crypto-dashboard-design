/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║              SWAGGER DOCUMENTATION CONFIGURATION                           ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './environment.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CHRONOS ERP System API',
      version: '1.0.0',
      description: `
        API completa del sistema CHRONOS ERP.

        ## Características principales:
        - ✅ Autenticación JWT con refresh tokens
        - ✅ Sistema de ventas completo
        - ✅ Gestión de compras
        - ✅ Control de almacén e inventario
        - ✅ Casa de cambio con tipos de cambio en tiempo real
        - ✅ Gestión bancaria multi-banco
        - ✅ Gestión de clientes y distribuidores

        ## Autenticación
        La mayoría de los endpoints requieren autenticación mediante JWT.
        Incluye el token en el header Authorization: \`Bearer <token>\`
      `,
      contact: {
        name: 'CHRONOS Support',
        email: 'support@chronos.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/${config.apiVersion}`,
        description: 'Development server',
      },
      {
        url: `https://api.chronos.com/api/${config.apiVersion}`,
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtenido del endpoint /auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Autenticación y autorización',
      },
      {
        name: 'Ventas',
        description: 'Gestión de ventas y facturación',
      },
      {
        name: 'Compras',
        description: 'Órdenes de compra y proveedores',
      },
      {
        name: 'Almacen',
        description: 'Control de inventario y productos',
      },
      {
        name: 'Banco',
        description: 'Transacciones bancarias y cortes de caja',
      },
      {
        name: 'Casa de Cambio',
        description: 'Tipos de cambio y conversiones de moneda',
      },
      {
        name: 'Clientes',
        description: 'Gestión de clientes y cuentas',
      },
      {
        name: 'Distribuidores',
        description: 'Gestión de distribuidores y comisiones',
      },
    ],
  },
  apis: ['./src/api/*.routes.ts', './src/api/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
