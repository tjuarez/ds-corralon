import express from 'express';
import {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  addContacto,
  deleteContacto,
} from '../controllers/clientesController.js';
import { authMiddleware, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de clientes
router.get('/', getClientes);
router.get('/:id', getClienteById);
router.post('/', createCliente);
router.put('/:id', updateCliente);
router.delete('/:id', checkRole('admin'), deleteCliente);

// Rutas de contactos
router.post('/:id/contactos', addContacto);
router.delete('/contactos/:contactoId', deleteContacto);

export default router;