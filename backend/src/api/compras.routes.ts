import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
export const comprasRouter = Router();
comprasRouter.use(authenticate);
comprasRouter.get('/', async (req, res) => { res.json({ success: true, data: [] }); });
comprasRouter.get('/:id', async (req, res) => { res.json({ success: true, data: null }); });
comprasRouter.post('/', async (req, res) => { res.json({ success: true, data: null }); });
comprasRouter.put('/:id', async (req, res) => { res.json({ success: true, data: null }); });
comprasRouter.delete('/:id', async (req, res) => { res.json({ success: true }); });
