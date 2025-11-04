import { fetchWithSucursal } from '../utils/fetchWithSucursal';

const API_URL = '/api/usuarios';

export const usuariosApi = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetchWithSucursal(`${API_URL}?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener usuarios');
    }

    return response.json();
  },

  getById: async (id) => {
    const response = await fetchWithSucursal(`${API_URL}/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener usuario');
    }

    return response.json();
  },

  create: async (usuarioData) => {
    const response = await fetchWithSucursal(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(usuarioData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear usuario');
    }

    return response.json();
  },

  update: async (id, usuarioData) => {
    const response = await fetchWithSucursal(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(usuarioData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar usuario');
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
      throw new Error(error.error || 'Error al eliminar usuario');
    }

    return response.json();
  },

  cambiarPassword: async (id, passwords) => {
    const response = await fetchWithSucursal(`${API_URL}/${id}/cambiar-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(passwords),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cambiar contraseña');
    }

    return response.json();
  },
};