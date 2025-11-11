import { getOne } from '../db/database.js';

/**
 * Middleware para identificar y validar el tenant (empresa) desde la URL
 * Extrae el slug de la ruta /:tenant/... y valida que exista y esté activa
 */
export const tenantMiddleware = async (req, res, next) => {
  try {
    // Rutas que no requieren tenant (login público, registro, etc.)
    const rutasPublicas = ['/api/auth/login', '/api/auth/register', '/api/health'];
    
    if (rutasPublicas.includes(req.path)) {
      return next();
    }

    // Extraer tenant del path: /api/tenant/dashboard -> tenant
    const pathParts = req.path.split('/').filter(p => p);
    
    // Buscar el índice de 'api' y el siguiente elemento será el tenant
    const apiIndex = pathParts.indexOf('api');
    if (apiIndex === -1 || apiIndex === pathParts.length - 1) {
      // Si no hay 'api' o no hay nada después, no hay tenant en la URL
      return res.status(400).json({ 
        error: 'URL inválida. Se requiere especificar una empresa.',
        hint: 'Formato correcto: /api/:tenant/recurso'
      });
    }

    const tenantSlug = pathParts[apiIndex + 1];

    // Validar que el slug no sea un recurso directo (para rutas especiales)
    const recursosDirectos = ['empresas', 'super-admin'];
    if (recursosDirectos.includes(tenantSlug)) {
      // Estas rutas las manejaremos después para el super-admin
      return next();
    }

    // Buscar empresa por slug
    const empresa = await getOne(
      'SELECT id, slug, nombre, activa, fecha_vencimiento FROM empresas WHERE slug = ?',
      [tenantSlug]
    );

    if (!empresa) {
      return res.status(404).json({ 
        error: 'Empresa no encontrada',
        tenant: tenantSlug
      });
    }

    if (!empresa.activa) {
      return res.status(403).json({ 
        error: 'Esta empresa está inactiva. Contacte al administrador.',
        tenant: tenantSlug
      });
    }

    // Verificar fecha de vencimiento (si existe)
    if (empresa.fecha_vencimiento) {
      const fechaVencimiento = new Date(empresa.fecha_vencimiento);
      const ahora = new Date();
      
      if (ahora > fechaVencimiento) {
        return res.status(403).json({ 
          error: 'La suscripción de esta empresa ha vencido. Contacte al administrador.',
          tenant: tenantSlug
        });
      }
    }

    // Agregar información del tenant al request
    req.tenant = {
      id: empresa.id,
      slug: empresa.slug,
      nombre: empresa.nombre
    };

    next();
  } catch (error) {
    console.error('Error en tenantMiddleware:', error);
    res.status(500).json({ error: 'Error al validar la empresa' });
  }
};

/**
 * Middleware para verificar que el usuario pertenece al tenant actual
 */
export const checkTenantAccess = (req, res, next) => {
  const user = req.user;
  const tenant = req.tenant;

  if (!user || !tenant) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Super-admin puede acceder a cualquier tenant
  if (user.rol === 'super_admin') {
    return next();
  }

  // Verificar que el usuario pertenezca a este tenant
  if (user.empresa_id !== tenant.id) {
    return res.status(403).json({ 
      error: 'No tienes acceso a esta empresa',
      tenant: tenant.slug
    });
  }

  next();
};