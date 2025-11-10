import express from 'express';
import { getMovimientos, getResumen } from '../controllers/movimientosStockController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getMovimientos);
router.get('/resumen', authMiddleware, getResumen);

export default router;