import { verifyToken } from '../utils/jwt.js';

export const authMiddleware = (req, res, next) => {
  try {
    // Obtener token de la cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ 
        error: 'No autorizado - Token no proporcionado' 
      });
    }

    // Verificar token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ 
        error: 'No autorizado - Token inválido o expirado' 
      });
    }

    // Agregar información del usuario a la request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error en authMiddleware:', error);
    res.status(500).json({ error: 'Error de autenticación' });
  }
};

// Middleware para verificar roles específicos
export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: 'No tienes permisos para realizar esta acción' 
      });
    }

    next();
  };
};