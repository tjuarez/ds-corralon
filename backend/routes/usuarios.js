import express from 'express';
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  toggleUsuario,
  deleteUsuario,
  cambiarPassword,
} from '../controllers/usuariosController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de usuarios
router.get('/', getUsuarios);
router.get('/:id', getUsuarioById);
router.post('/', createUsuario);
router.put('/:id', updateUsuario);
router.patch('/:id/toggle', toggleUsuario);
router.delete('/:id', deleteUsuario);
router.post('/:id/cambiar-password', cambiarPassword);

export default router;
