import express from 'express';
import {
  getPresupuestos,
  getPresupuestoById,
  createPresupuesto,
  updatePresupuesto,
  updateEstado,
  deletePresupuesto,
  enviarEmail,
} from '../controllers/presupuestosController.js';
import { authMiddleware, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de presupuestos
router.get('/', getPresupuestos);
router.get('/:id', getPresupuestoById);
router.post('/', createPresupuesto);
router.put('/:id', updatePresupuesto);
router.patch('/:id/estado', updateEstado);
router.delete('/:id', checkRole('admin'), deletePresupuesto);
router.post('/:id/enviar-email', enviarEmail);

export default router;