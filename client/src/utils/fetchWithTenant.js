import { getTenantFromUrl } from './tenantHelper';

/**
 * Wrapper de fetch que agrega automáticamente:
 * - El tenant en la URL (excepto para rutas públicas)
 * - El header de sucursal activa
 */
export const fetchWithTenant = async (url, options = {}) => {
  // Obtener sucursal activa del localStorage
  const sucursalActivaStr = localStorage.getItem('sucursalActiva');
  const sucursalActiva = sucursalActivaStr ? JSON.parse(sucursalActivaStr) : null;

  // Obtener tenant de la URL actual
  const tenant = getTenantFromUrl();

  // Crear headers con sucursal activa si existe
  const headers = {
    ...options.headers,
  };

  // Si hay sucursal activa, agregar el header
  if (sucursalActiva && sucursalActiva.id) {
    headers['x-sucursal-activa'] = sucursalActiva.id.toString();
  }

  // Rutas públicas/globales que NO requieren tenant en el path
  const isPublicRoute = 
    url.startsWith('/api/auth/') || 
    url.startsWith('/api/health') ||
    url.startsWith('/api/super-admin/'); // ← AGREGAR

  // Debug en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 fetchWithTenant:', {
      originalUrl: url,
      isPublicRoute,
      tenant,
    });
  }

  // Si NO es ruta pública Y hay tenant, incluir tenant en la URL
  let finalUrl = url;
  if (!isPublicRoute && tenant && url.startsWith('/api/')) {
    // Transformar /api/recurso a /api/tenant/recurso
    finalUrl = url.replace('/api/', `/api/${tenant}/`);
  }

  // Debug en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 URL final:', finalUrl);
  }

  // Llamar a fetch con la URL y headers actualizados
  return fetch(finalUrl, {
    ...options,
    headers,
  });
};

// Mantener compatibilidad con el nombre antiguo
export const fetchWithSucursal = fetchWithTenant;