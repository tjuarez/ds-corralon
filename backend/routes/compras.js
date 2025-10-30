import express from 'express';
import {
  getCompras,
  getCompraById,
  createCompra,
  updateEstado,
  anularCompra,
} from '../controllers/comprasController.js';
import { authMiddleware, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de compras
router.get('/', getCompras);
router.get('/:id', getCompraById);
router.post('/', createCompra);
router.patch('/:id/estado', updateEstado);
router.patch('/:id/anular', checkRole('admin'), anularCompra);

export default router;