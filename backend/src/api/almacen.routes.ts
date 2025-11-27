import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
export const almacenRouter = Router();
almacenRouter.use(authenticate);
almacenRouter.get('/', async (req, res) => { res.json({ success: true, data: [] }); });
almacenRouter.post('/entrada', async (req, res) => { res.json({ success: true }); });
almacenRouter.post('/salida', async (req, res) => { res.json({ success: true }); });
almacenRouter.post('/transferencia', async (req, res) => { res.json({ success: true }); });
