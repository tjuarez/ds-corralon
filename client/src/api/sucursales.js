import { fetchWithSucursal } from '../utils/fetchWithSucursal';

const API_URL = '/api/sucursales';

export const sucursalesApi = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetchWithSucursal(`${API_URL}?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener sucursales');
    }

    return response.json();
  },

  getById: async (id) => {
    const response = await fetchWithSucursal(`${API_URL}/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener sucursal');
    }

    return response.json();
  },

  create: async (sucursalData) => {
    const response = await fetchWithSucursal(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(sucursalData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear sucursal');
    }

    return response.json();
  },

  update: async (id, sucursalData) => {
    const response = await fetchWithSucursal(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(sucursalData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar sucursal');
    }

    return response.json();
  },

  toggle: async (id) => {
    const response = await fetchWithSucursal(`${API_URL}/${id}/toggle`, {
      method: 'PATCH',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cambiar estado');
    }

    return response.json();
  },

  delete: async (id) => {
    const response = await fetchWithSucursal(`${API_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar sucursal');
    }

    return response.json();
  },
};