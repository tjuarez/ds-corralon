import express from 'express';
import {
  getVentas,
  getVentaById,
  createVenta,
  anularVenta,
} from '../controllers/ventasController.js';
import { authMiddleware, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de ventas
router.get('/', getVentas);
router.get('/:id', getVentaById);
router.post('/', createVenta);
router.patch('/:id/anular', checkRole('admin'), anularVenta);

export default router;