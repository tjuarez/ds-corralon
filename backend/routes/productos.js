import express from 'express';
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  updatePrecios,
} from '../controllers/productosController.js';
import { authMiddleware, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getProductos);
router.get('/:id', getProductoById);
router.post('/', createProducto);
router.put('/:id', updateProducto);
router.delete('/:id', checkRole('admin'), deleteProducto);
router.put('/:id/precios', updatePrecios);

export default router;