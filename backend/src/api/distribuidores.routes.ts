import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
export const distribuidoresRouter = Router();
distribuidoresRouter.use(authenticate);
distribuidoresRouter.get('/', async (req, res) => { res.json({ success: true, data: [] }); });
distribuidoresRouter.get('/:id', async (req, res) => { res.json({ success: true, data: null }); });
distribuidoresRouter.post('/', async (req, res) => { res.json({ success: true, data: null }); });
distribuidoresRouter.put('/:id', async (req, res) => { res.json({ success: true, data: null }); });
distribuidoresRouter.delete('/:id', async (req, res) => { res.json({ success: true }); });
