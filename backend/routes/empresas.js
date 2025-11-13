import express from 'express';
import {
  getEmpresas,
  getEmpresaById,
  createEmpresa,
  updateEmpresa,
  toggleEmpresaStatus,
  deleteEmpresa
} from '../controllers/empresasController.js';
import { authMiddleware, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol super_admin
router.use(authMiddleware);
router.use(checkRole('super_admin'));

router.get('/', getEmpresas);
router.get('/:id', getEmpresaById);
router.post('/', createEmpresa);
router.put('/:id', updateEmpresa);
router.patch('/:id/toggle-status', toggleEmpresaStatus);
router.delete('/:id', deleteEmpresa);

export default router;