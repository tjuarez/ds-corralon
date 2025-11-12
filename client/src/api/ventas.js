import { fetchWithTenant } from '../utils/fetchWithTenant';

const API_URL = '/api/ventas';

export const ventasApi = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetchWithTenant(`${API_URL}?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener ventas');
    }

    return response.json();
  },

  getById: async (id) => {
    const response = await fetchWithTenant(`${API_URL}/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener venta');
    }

    return response.json();
  },

  create: async (ventaData) => {
    const response = await fetchWithTenant(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(ventaData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear venta');
    }

    return response.json();
  },

  anular: async (id, usuario_id) => {
    const response = await fetchWithTenant(`${API_URL}/${id}/anular`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ usuario_id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al anular venta');
    }

    return response.json();
  },
};