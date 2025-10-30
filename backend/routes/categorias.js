import express from 'express';
import {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from '../controllers/categoriasController.js';
import { authMiddleware, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getCategorias);
router.get('/:id', getCategoriaById);
router.post('/', createCategoria);
router.put('/:id', updateCategoria);
router.delete('/:id', checkRole('admin'), deleteCategoria);

export default router;