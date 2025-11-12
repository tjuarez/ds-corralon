import { fetchWithTenant } from '../utils/fetchWithTenant';

const API_URL = '/api/presupuestos';

export const presupuestosApi = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetchWithTenant(`${API_URL}?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener presupuestos');
    }

    return response.json();
  },

  getById: async (id) => {
    const response = await fetchWithTenant(`${API_URL}/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener presupuesto');
    }

    return response.json();
  },

  create: async (presupuestoData) => {
    const response = await fetchWithTenant(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(presupuestoData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear presupuesto');
    }

    return response.json();
  },

  update: async (id, presupuestoData) => {
    const response = await fetchWithTenant(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(presupuestoData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar presupuesto');
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

  delete: async (id) => {
    const response = await fetchWithTenant(`${API_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar presupuesto');
    }

    return response.json();
  },
};