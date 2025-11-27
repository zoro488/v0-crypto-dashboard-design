import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
export const clientesRouter = Router();
clientesRouter.use(authenticate);
clientesRouter.get('/', async (req, res) => { res.json({ success: true, data: [] }); });
clientesRouter.get('/:id', async (req, res) => { res.json({ success: true, data: null }); });
clientesRouter.post('/', async (req, res) => { res.json({ success: true, data: null }); });
clientesRouter.put('/:id', async (req, res) => { res.json({ success: true, data: null }); });
clientesRouter.delete('/:id', async (req, res) => { res.json({ success: true }); });
