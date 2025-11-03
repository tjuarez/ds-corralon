import express from 'express';
import {
  getClientesConCC,
  getEstadoCuenta,
  registrarPago,
  getResumenGeneral,
} from '../controllers/cuentaCorrienteController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de cuenta corriente
router.get('/clientes', getClientesConCC);
router.get('/clientes/:clienteId/estado-cuenta', getEstadoCuenta);
router.post('/pagos', registrarPago);
router.get('/resumen', getResumenGeneral);

export default router;