import express from 'express';
import {
  getCajas,
  getCajaById,
  getCajaAbierta,
  abrirCaja,
  cerrarCaja,
  registrarMovimiento,
  getResumenCaja,
} from '../controllers/cajaController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de caja
router.get('/', getCajas);
router.get('/abierta', getCajaAbierta);
router.get('/:id', getCajaById);
router.get('/:caja_id/resumen', getResumenCaja);
router.post('/abrir', abrirCaja);
router.post('/:id/cerrar', cerrarCaja);
router.post('/movimientos', registrarMovimiento);

export default router;