/**
 * Wrapper de fetch que agrega automáticamente el header de sucursal activa
 */
export const fetchWithSucursal = async (url, options = {}) => {
  // Obtener sucursal activa del localStorage
  const sucursalActivaStr = localStorage.getItem('sucursalActiva');
  const sucursalActiva = sucursalActivaStr ? JSON.parse(sucursalActivaStr) : null;

  // Crear headers con sucursal activa si existe
  const headers = {
    ...options.headers,
  };

  // Si hay sucursal activa, agregar el header
  if (sucursalActiva && sucursalActiva.id) {
    headers['x-sucursal-activa'] = sucursalActiva.id.toString();
  }

  // Llamar a fetch con los headers actualizados
  return fetch(url, {
    ...options,
    headers,
  });
};