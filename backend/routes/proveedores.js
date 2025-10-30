import express from 'express';
import {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  addContacto,
  deleteContacto,
} from '../controllers/proveedoresController.js';
import { authMiddleware, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de proveedores
router.get('/', getProveedores);
router.get('/:id', getProveedorById);
router.post('/', createProveedor);
router.put('/:id', updateProveedor);
router.delete('/:id', checkRole('admin'), deleteProveedor);

// Rutas de contactos
router.post('/:id/contactos', addContacto);
router.delete('/contactos/:contactoId', deleteContacto);

export default router;