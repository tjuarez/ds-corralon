import { fetchWithTenant } from '../utils/fetchWithTenant';

const API_URL = '/api/reportes';

export const reportesApi = {
  getDashboard: async () => {
    const response = await fetchWithTenant(`${API_URL}/dashboard`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener dashboard');
    }

    return response.json();
  },

  getReporteVentas: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetchWithTenant(`${API_URL}/ventas?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener reporte de ventas');
    }

    return response.json();
  },

  getReporteProductos: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetchWithTenant(`${API_URL}/productos?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener reporte de productos');
    }

    return response.json();
  },

  getReporteClientes: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetchWithTenant(`${API_URL}/clientes?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener reporte de clientes');
    }

    return response.json();
  },

  getReporteStock: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetchWithTenant(`${API_URL}/stock?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener reporte de stock');
    }

    return response.json();
  },

  getReporteCaja: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetchWithTenant(`${API_URL}/caja?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener reporte de caja');
    }

    return response.json();
  },

  getReporteRentabilidad: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetchWithTenant(`${API_URL}/rentabilidad?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener reporte de rentabilidad');
    }

    return response.json();
  },
};