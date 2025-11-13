import { fetchWithTenant } from '../utils/fetchWithTenant';

const API_URL = '/api/super-admin/empresas';

export const empresasApi = {
  // Obtener todas las empresas
  getAll: async () => {
    const response = await fetchWithTenant(API_URL, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener empresas');
    }

    return response.json();
  },

  // Obtener una empresa por ID
  getById: async (id) => {
    const response = await fetchWithTenant(`${API_URL}/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener empresa');
    }

    return response.json();
  },

  // Crear nueva empresa
  create: async (empresaData) => {
    const response = await fetchWithTenant(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(empresaData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear empresa');
    }

    return response.json();
  },

  // Actualizar empresa
  update: async (id, empresaData) => {
    const response = await fetchWithTenant(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(empresaData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar empresa');
    }

    return response.json();
  },

  // Activar/Desactivar empresa
  toggleStatus: async (id) => {
    const response = await fetchWithTenant(`${API_URL}/${id}/toggle-status`, {
      method: 'PATCH',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cambiar estado');
    }

    return response.json();
  },

  // Eliminar empresa
  delete: async (id) => {
    const response = await fetchWithTenant(`${API_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar empresa');
    }

    return response.json();
  },
};