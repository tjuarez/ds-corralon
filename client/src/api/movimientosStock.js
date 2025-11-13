import { fetchWithTenant } from '../utils/fetchWithTenant';

const API_URL = '/api/movimientos-stock';

export const movimientosStockApi = {
  // Obtener movimientos con filtros
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.producto_id) params.append('producto_id', filters.producto_id);
    if (filters.sucursal_id) params.append('sucursal_id', filters.sucursal_id);
    if (filters.tipo_movimiento) params.append('tipo_movimiento', filters.tipo_movimiento);
    if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters.search) params.append('search', filters.search);

    const response = await fetchWithTenant(`${API_URL}?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener movimientos');
    }

    return response.json();
  },

  // Obtener resumen
  getResumen: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters.sucursal_id) params.append('sucursal_id', filters.sucursal_id);

    const response = await fetchWithTenant(`${API_URL}/resumen?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener resumen');
    }

    return response.json();
  },
};