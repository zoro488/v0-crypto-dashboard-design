import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
export const bancoRouter = Router();
bancoRouter.use(authenticate);
bancoRouter.get('/movimientos', async (req, res) => { res.json({ success: true, data: [] }); });
bancoRouter.get('/bancos', async (req, res) => { res.json({ success: true, data: [] }); });
bancoRouter.post('/ingreso', async (req, res) => { res.json({ success: true }); });
bancoRouter.post('/gasto', async (req, res) => { res.json({ success: true }); });
bancoRouter.post('/transferencia', async (req, res) => { res.json({ success: true }); });
