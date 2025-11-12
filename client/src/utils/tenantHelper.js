/**
 * Extrae el tenant (slug de empresa) de la URL actual
 * Ejemplo: /demo/dashboard → "demo"
 */
export const getTenantFromUrl = () => {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  
  // El tenant es el primer segmento de la URL
  if (segments.length > 0) {
    return segments[0];
  }
  
  return 'demo'; // Fallback por defecto
};

/**
 * Construye una ruta con el tenant actual
 * Ejemplo: buildTenantPath('/dashboard') → "/demo/dashboard"
 */
export const buildTenantPath = (path) => {
  const tenant = getTenantFromUrl();
  
  // Si el path ya incluye el tenant, devolverlo tal cual
  if (path.startsWith(`/${tenant}/`)) {
    return path;
  }
  
  // Asegurar que el path comience con /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `/${tenant}${cleanPath}`;
};

/**
 * Valida si un tenant existe (llamada al backend)
 */
export const validateTenant = async (tenant) => {
  try {
    const response = await fetch(`/api/auth/empresas`);
    const data = await response.json();
    const empresas = data.empresas || [];
    
    return empresas.some(e => e.slug === tenant);
  } catch (error) {
    console.error('Error validando tenant:', error);
    return false;
  }
};