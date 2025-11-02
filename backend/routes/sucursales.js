import express from 'express';
import {
  getSucursales,
  getSucursalById,
  createSucursal,
  updateSucursal,
  toggleSucursal,
  deleteSucursal,
} from '../controllers/sucursalesController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de sucursales
router.get('/', getSucursales);
router.get('/:id', getSucursalById);
router.post('/', createSucursal);
router.put('/:id', updateSucursal);
router.patch('/:id/toggle', toggleSucursal);
router.delete('/:id', deleteSucursal);

export default router;