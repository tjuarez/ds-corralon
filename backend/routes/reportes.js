import express from 'express';
import {
  getDashboard,
  getReporteVentas,
  getReporteProductos,
  getReporteClientes,
  getReporteStock,
  getReporteCaja,
  getReporteRentabilidad,
} from '../controllers/reportesController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de reportes
router.get('/dashboard', getDashboard);
router.get('/ventas', getReporteVentas);
router.get('/productos', getReporteProductos);
router.get('/clientes', getReporteClientes);
router.get('/stock', getReporteStock);
router.get('/caja', getReporteCaja);
router.get('/rentabilidad', getReporteRentabilidad);

export default router;