// Middleware para filtrar automáticamente por sucursal
export const filterBySucursal = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Si es admin, puede filtrar manualmente o ver todo
  if (user.rol === 'admin') {
    // El admin puede pasar ?sucursal_id=X para filtrar, o no pasarlo para ver todo
    return next();
  }

  // No-admin: debe tener sucursal asignada
  if (!user.sucursal_id) {
    return res.status(400).json({ 
      error: 'Usuario no tiene sucursal asignada. Contacte al administrador.' 
    });
  }

  // Forzar el filtro por la sucursal del usuario
  req.query.sucursal_id = user.sucursal_id.toString();
  req.userSucursalId = user.sucursal_id;
  req.isAdmin = false;

  next();
};

// Middleware para validar que el usuario tenga sucursal antes de crear datos
export const requireSucursal = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (!user.sucursal_id) {
    return res.status(400).json({ 
      error: 'No puedes realizar esta acción sin una sucursal asignada. Contacte al administrador.' 
    });
  }

  next();
};