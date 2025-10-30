import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getCurrentUser,
  changePassword 
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Rutas públicas (con rate limiting)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Rutas protegidas
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getCurrentUser);
router.post('/change-password', authMiddleware, changePassword);

export default router;