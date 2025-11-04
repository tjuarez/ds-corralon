import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getStockProducto,
  getStockSucursal,
  inicializarStock,
  ajustarStock,
  transferirStock
} from '../controllers/stockSucursalesController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener stock de un producto en todas las sucursales
router.get('/producto/:producto_id', getStockProducto);

// Obtener stock de una sucursal
router.get('/sucursal/:sucursal_id', getStockSucursal);

// Inicializar stock
router.post('/inicializar', inicializarStock);

// Ajustar stock manualmente
router.post('/ajustar', ajustarStock);

// Transferir stock entre sucursales
router.post('/transferir', transferirStock);

export default router;