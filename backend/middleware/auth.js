import { verifyToken } from '../utils/jwt.js';
import { getOne } from '../db/database.js';

export const authMiddleware = async (req, res, next) => {
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

    // Obtener información completa del usuario desde la BD (incluyendo sucursal_id)
    const user = await getOne(
      'SELECT id, username, nombre, apellido, email, rol, sucursal_id, activo FROM usuarios WHERE id = ?',
      [decoded.id]
    );

    if (!user || !user.activo) {
      return res.status(401).json({ 
        error: 'Usuario no válido o inactivo' 
      });
    }

    // Agregar información completa del usuario a la request
    req.user = user;
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

// Middleware para verificar acceso por sucursal
export const checkSucursal = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Admin puede acceder a todas las sucursales
  if (user.rol === 'admin') {
    return next();
  }

  // Otros roles deben tener sucursal asignada
  if (!user.sucursal_id) {
    return res.status(400).json({ 
      error: 'Usuario no tiene sucursal asignada. Contacte al administrador.' 
    });
  }

  next();
};