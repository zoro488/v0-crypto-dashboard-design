/**
 * API Routes Index
 */

import { Router } from 'express';

// Import route modules
import { ventasRouter } from './ventas.routes.js';
import { comprasRouter } from './compras.routes.js';
import { almacenRouter } from './almacen.routes.js';
import { bancoRouter } from './banco.routes.js';
import { clientesRouter } from './clientes.routes.js';
import { distribuidoresRouter } from './distribuidores.routes.js';
import { authRouter } from './auth.routes.js';
import { casaCambioRouter } from './casa-cambio.routes.js';

export const apiRouter = Router();

// Health check for API
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/ventas', ventasRouter);
apiRouter.use('/compras', comprasRouter);
apiRouter.use('/almacen', almacenRouter);
apiRouter.use('/banco', bancoRouter);
apiRouter.use('/clientes', clientesRouter);
apiRouter.use('/distribuidores', distribuidoresRouter);
apiRouter.use('/casa-cambio', casaCambioRouter);

// API documentation endpoint
apiRouter.get('/docs', (req, res) => {
  res.json({
    message: 'CHRONOS API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /auth/login': 'Login with email and password',
        'POST /auth/register': 'Register new user',
        'POST /auth/refresh': 'Refresh access token',
        'POST /auth/logout': 'Logout user',
      },
      ventas: {
        'GET /ventas': 'Get all ventas',
        'GET /ventas/:id': 'Get venta by ID',
        'POST /ventas': 'Create new venta',
        'PUT /ventas/:id': 'Update venta',
        'DELETE /ventas/:id': 'Delete venta',
      },
      compras: {
        'GET /compras': 'Get all compras',
        'GET /compras/:id': 'Get compra by ID',
        'POST /compras': 'Create new compra',
        'PUT /compras/:id': 'Update compra',
        'DELETE /compras/:id': 'Delete compra',
      },
      almacen: {
        'GET /almacen': 'Get all inventory',
        'GET /almacen/:id': 'Get inventory item by ID',
        'POST /almacen/entrada': 'Create entrada',
        'POST /almacen/salida': 'Create salida',
        'POST /almacen/transferencia': 'Create transferencia',
      },
      banco: {
        'GET /banco/movimientos': 'Get all movimientos',
        'GET /banco/bancos': 'Get all bancos',
        'POST /banco/ingreso': 'Create ingreso',
        'POST /banco/gasto': 'Create gasto',
        'POST /banco/transferencia': 'Create transferencia',
      },
      clientes: {
        'GET /clientes': 'Get all clientes',
        'GET /clientes/:id': 'Get cliente by ID',
        'POST /clientes': 'Create new cliente',
        'PUT /clientes/:id': 'Update cliente',
        'DELETE /clientes/:id': 'Delete cliente',
      },
      distribuidores: {
        'GET /distribuidores': 'Get all distribuidores',
        'GET /distribuidores/:id': 'Get distribuidor by ID',
        'POST /distribuidores': 'Create new distribuidor',
        'PUT /distribuidores/:id': 'Update distribuidor',
        'DELETE /distribuidores/:id': 'Delete distribuidor',
      },
    },
  });
});
