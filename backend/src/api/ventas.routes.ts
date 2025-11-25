/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                         VENTAS CONTROLLER                                  ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { VentasService } from '../services/ventas.service.js';
import { CreateVentaSchema, UpdateVentaSchema } from '../models/venta.model.js';
import { logger } from '../config/logger.js';

export const ventasRouter = Router();

// All routes require authentication
ventasRouter.use(authenticate);

// GET /api/v1/ventas - Obtener todas las ventas
ventasRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { clienteId, distribuidorId, estado, fechaDesde, fechaHasta, limit } = req.query;

    const filters = {
      clienteId: clienteId as string,
      distribuidorId: distribuidorId as string,
      estado: estado as any,
      fechaDesde: fechaDesde ? new Date(fechaDesde as string) : undefined,
      fechaHasta: fechaHasta ? new Date(fechaHasta as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    };

    const ventas = await VentasService.getAll(filters);

    res.json({
      success: true,
      data: ventas,
      count: ventas.length,
    });
  } catch (error: any) {
    logger.error('Error in GET /ventas:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/v1/ventas/estadisticas - Obtener estadísticas
ventasRouter.get('/estadisticas', async (req: Request, res: Response) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;

    const estadisticas = await VentasService.getEstadisticas(
      fechaDesde ? new Date(fechaDesde as string) : undefined,
      fechaHasta ? new Date(fechaHasta as string) : undefined
    );

    res.json({
      success: true,
      data: estadisticas,
    });
  } catch (error: any) {
    logger.error('Error in GET /ventas/estadisticas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/v1/ventas/:id - Obtener venta por ID
ventasRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const venta = await VentasService.getById(id);

    if (!venta) {
      return res.status(404).json({
        success: false,
        error: 'Venta not found',
      });
    }

    res.json({
      success: true,
      data: venta,
    });
  } catch (error: any) {
    logger.error(`Error in GET /ventas/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/v1/ventas - Crear nueva venta
ventasRouter.post('/', async (req: Request, res: Response) => {
  try {
    const validation = CreateVentaSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: validation.error.errors,
      });
    }

    const userId = (req as any).user.uid;
    const venta = await VentasService.create(validation.data, userId);

    res.status(201).json({
      success: true,
      data: venta,
      message: 'Venta created successfully',
    });
  } catch (error: any) {
    logger.error('Error in POST /ventas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// PUT /api/v1/ventas/:id - Actualizar venta
ventasRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validation = UpdateVentaSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: validation.error.errors,
      });
    }

    const userId = (req as any).user.uid;
    const venta = await VentasService.update(id, validation.data, userId);

    res.json({
      success: true,
      data: venta,
      message: 'Venta updated successfully',
    });
  } catch (error: any) {
    logger.error(`Error in PUT /ventas/${req.params.id}:`, error);

    if (error.message === 'Venta not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// DELETE /api/v1/ventas/:id - Eliminar venta
ventasRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await VentasService.delete(id);

    res.json({
      success: true,
      message: 'Venta deleted successfully',
    });
  } catch (error: any) {
    logger.error(`Error in DELETE /ventas/${req.params.id}:`, error);

    if (error.message === 'Venta not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/v1/ventas/:id/abonos - Registrar abono
ventasRouter.post('/:id/abonos', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { monto, formaPago } = req.body;

    if (!monto || !formaPago) {
      return res.status(400).json({
        success: false,
        error: 'Monto and formaPago are required',
      });
    }

    const userId = (req as any).user.uid;
    const venta = await VentasService.registrarAbono(id, monto, formaPago, userId);

    res.json({
      success: true,
      data: venta,
      message: 'Abono registered successfully',
    });
  } catch (error: any) {
    logger.error(`Error in POST /ventas/${req.params.id}/abonos:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
