/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                      CASA DE CAMBIO CONTROLLER                             ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { CasaCambioService } from '../services/casa-cambio.service.js';
import { logger } from '../config/logger.js';

export const casaCambioRouter = Router();

// All routes require authentication
casaCambioRouter.use(authenticate);

// ========== TIPOS DE CAMBIO ==========

// GET /api/v1/casa-cambio/tipo-cambio/actual
casaCambioRouter.get('/tipo-cambio/actual', async (req: Request, res: Response) => {
  try {
    const tipoCambio = await CasaCambioService.getTipoCambioActual();

    if (!tipoCambio) {
      return res.status(404).json({
        success: false,
        error: 'No hay tipo de cambio configurado',
      });
    }

    res.json({
      success: true,
      data: tipoCambio,
    });
  } catch (error: any) {
    logger.error('Error getting tipo cambio:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/v1/casa-cambio/tipo-cambio/historico
casaCambioRouter.get('/tipo-cambio/historico', async (req: Request, res: Response) => {
  try {
    const { fechaDesde, fechaHasta, limit } = req.query;

    const historico = await CasaCambioService.getHistoricoTipoCambio(
      fechaDesde ? new Date(fechaDesde as string) : undefined,
      fechaHasta ? new Date(fechaHasta as string) : undefined,
      limit ? parseInt(limit as string) : 100
    );

    res.json({
      success: true,
      data: historico,
      count: historico.length,
    });
  } catch (error: any) {
    logger.error('Error getting histórico tipo cambio:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/v1/casa-cambio/tipo-cambio/actualizar
casaCambioRouter.post('/tipo-cambio/actualizar', async (req: Request, res: Response) => {
  try {
    const { usdToMxn, comisionCompra, comisionVenta, fuente } = req.body;

    if (!usdToMxn) {
      return res.status(400).json({
        success: false,
        error: 'usdToMxn is required',
      });
    }

    const userId = (req as any).user.uid;
    const tipoCambio = await CasaCambioService.actualizarTipoCambio(
      usdToMxn,
      comisionCompra || 0.02,
      comisionVenta || 0.02,
      fuente || 'manual',
      userId
    );

    res.json({
      success: true,
      data: tipoCambio,
      message: 'Tipo de cambio actualizado',
    });
  } catch (error: any) {
    logger.error('Error actualizando tipo cambio:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/v1/casa-cambio/tipo-cambio/actualizar-api
casaCambioRouter.post('/tipo-cambio/actualizar-api', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const tipoCambio = await CasaCambioService.actualizarTipoCambioDesdeAPI(userId);

    res.json({
      success: true,
      data: tipoCambio,
      message: 'Tipo de cambio actualizado desde API',
    });
  } catch (error: any) {
    logger.error('Error actualizando tipo cambio desde API:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ========== CÁLCULOS Y CONVERSIONES ==========

// POST /api/v1/casa-cambio/calcular/usd-to-mxn
casaCambioRouter.post('/calcular/usd-to-mxn', async (req: Request, res: Response) => {
  try {
    const { montoUSD } = req.body;

    if (!montoUSD || montoUSD <= 0) {
      return res.status(400).json({
        success: false,
        error: 'montoUSD must be a positive number',
      });
    }

    const conversion = await CasaCambioService.calcularConversionUSDtoMXN(montoUSD);

    res.json({
      success: true,
      data: conversion,
    });
  } catch (error: any) {
    logger.error('Error calculando conversión USD->MXN:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/v1/casa-cambio/calcular/mxn-to-usd
casaCambioRouter.post('/calcular/mxn-to-usd', async (req: Request, res: Response) => {
  try {
    const { montoMXN } = req.body;

    if (!montoMXN || montoMXN <= 0) {
      return res.status(400).json({
        success: false,
        error: 'montoMXN must be a positive number',
      });
    }

    const conversion = await CasaCambioService.calcularConversionMXNtoUSD(montoMXN);

    res.json({
      success: true,
      data: conversion,
    });
  } catch (error: any) {
    logger.error('Error calculando conversión MXN->USD:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ========== OPERACIONES ==========

// GET /api/v1/casa-cambio/operaciones
casaCambioRouter.get('/operaciones', async (req: Request, res: Response) => {
  try {
    const { tipo, clienteId, fechaDesde, fechaHasta, limit } = req.query;

    const filters = {
      tipo: tipo as any,
      clienteId: clienteId as string,
      fechaDesde: fechaDesde ? new Date(fechaDesde as string) : undefined,
      fechaHasta: fechaHasta ? new Date(fechaHasta as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    };

    const operaciones = await CasaCambioService.getHistorialOperaciones(filters);

    res.json({
      success: true,
      data: operaciones,
      count: operaciones.length,
    });
  } catch (error: any) {
    logger.error('Error getting operaciones:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/v1/casa-cambio/operaciones
casaCambioRouter.post('/operaciones', async (req: Request, res: Response) => {
  try {
    const {
      tipo,
      montoOriginal,
      monedaOriginal,
      clienteId,
      clienteNombre,
      notas
    } = req.body;

    if (!tipo || !montoOriginal || !monedaOriginal) {
      return res.status(400).json({
        success: false,
        error: 'tipo, montoOriginal, and monedaOriginal are required',
      });
    }

    if (!['compra_usd', 'venta_usd'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        error: 'tipo must be compra_usd or venta_usd',
      });
    }

    if (!['USD', 'MXN'].includes(monedaOriginal)) {
      return res.status(400).json({
        success: false,
        error: 'monedaOriginal must be USD or MXN',
      });
    }

    const userId = (req as any).user.uid;
    const operacion = await CasaCambioService.registrarOperacion(
      tipo,
      montoOriginal,
      monedaOriginal,
      clienteId,
      clienteNombre,
      notas,
      userId
    );

    res.status(201).json({
      success: true,
      data: operacion,
      message: 'Operación registrada exitosamente',
    });
  } catch (error: any) {
    logger.error('Error registrando operación:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ========== ESTADÍSTICAS ==========

// GET /api/v1/casa-cambio/estadisticas
casaCambioRouter.get('/estadisticas', async (req: Request, res: Response) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;

    const estadisticas = await CasaCambioService.getEstadisticas(
      fechaDesde ? new Date(fechaDesde as string) : undefined,
      fechaHasta ? new Date(fechaHasta as string) : undefined
    );

    res.json({
      success: true,
      data: estadisticas,
    });
  } catch (error: any) {
    logger.error('Error getting estadísticas casa de cambio:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
