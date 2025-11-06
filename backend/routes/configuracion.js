import express from 'express';
import { authMiddleware, checkRole } from '../middleware/auth.js';
import {
  getConfiguracion,
  getConfigByKey,
  updateConfiguracion,
  getMonedas,
  updateCotizacion
} from '../controllers/configuracionController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener toda la configuración (solo admin)
router.get('/', checkRole('admin'), getConfiguracion);

// Obtener configuración por clave
router.get('/:clave', getConfigByKey);

// Actualizar configuración (solo admin)
router.put('/', checkRole('admin'), updateConfiguracion);

// Obtener monedas
router.get('/monedas/list', getMonedas);

// Actualizar cotización (solo admin)
router.put('/cotizacion/update', checkRole('admin'), updateCotizacion);

export default router;