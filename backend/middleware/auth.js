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

    // Obtener información completa del usuario desde la BD (incluyendo sucursal_id y nombre de sucursal)
    const user = await getOne(`
      SELECT u.id, u.username, u.nombre, u.apellido, u.email, u.rol, u.sucursal_id, u.activo,
             s.nombre as sucursal_nombre
      FROM usuarios u
      LEFT JOIN sucursales s ON u.sucursal_id = s.id
      WHERE u.id = ?
    `, [decoded.id]);

    if (!user || !user.activo) {
      return res.status(401).json({ 
        error: 'Usuario no válido o inactivo' 
      });
    }

    // ========== LÓGICA DE SUCURSAL ACTIVA PARA ADMIN ==========
    if (user.rol === 'admin') {
      // Obtener sucursal activa desde el header (enviado por el frontend)
      const sucursalActivaId = req.headers['x-sucursal-activa'];
      
      if (sucursalActivaId && sucursalActivaId !== 'null' && sucursalActivaId !== 'undefined') {
        // Admin tiene una sucursal activa seleccionada
        const sucursalActiva = await getOne(
          'SELECT id, nombre FROM sucursales WHERE id = ?',
          [parseInt(sucursalActivaId)]
        );

        if (sucursalActiva) {
          // Sobrescribir sucursal_id y sucursal_nombre con la sucursal activa
          user.sucursal_id = sucursalActiva.id;
          user.sucursal_nombre = sucursalActiva.nombre;
          user.sucursal_activa_temporal = true; // Flag para saber que es temporal
        }
      } else {
        // Admin sin sucursal activa = puede ver todas las sucursales
        user.sucursal_id = null;
        user.sucursal_nombre = 'Todas las sucursales';
      }
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

  // Admin puede acceder a todas las sucursales (incluso sin sucursal activa)
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