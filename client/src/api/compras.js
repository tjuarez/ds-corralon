import { fetchWithTenant } from '../utils/fetchWithTenant';

const API_URL = '/api/compras';

export const comprasApi = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetchWithTenant(`${API_URL}?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener compras');
    }

    return response.json();
  },

  getById: async (id) => {
    const response = await fetchWithTenant(`${API_URL}/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener compra');
    }

    return response.json();
  },

  create: async (compraData) => {
    const response = await fetchWithTenant(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(compraData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear compra');
    }

    return response.json();
  },

  updateEstado: async (id, estado) => {
    const response = await fetchWithTenant(`${API_URL}/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ estado }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar estado');
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
      throw new Error(error.error || 'Error al anular compra');
    }

    return response.json();
  },
};