import rateLimit from 'express-rate-limit';

// Rate limiter para autenticación (más restrictivo)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  message: 'Demasiados intentos de inicio de sesión. Por favor, intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter general para API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: 'Demasiadas peticiones. Por favor, intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});