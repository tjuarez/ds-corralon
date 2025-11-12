import { fetchWithTenant } from '../utils/fetchWithTenant';

const API_URL = '/api/proveedores';

export const proveedoresApi = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetchWithTenant(`${API_URL}?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener proveedores');
    }

    return response.json();
  },

  getById: async (id) => {
    const response = await fetchWithTenant(`${API_URL}/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener proveedor');
    }

    return response.json();
  },

  create: async (proveedorData) => {
    const response = await fetchWithTenant(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(proveedorData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear proveedor');
    }

    return response.json();
  },

  update: async (id, proveedorData) => {
    const response = await fetchWithTenant(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(proveedorData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar proveedor');
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
      throw new Error(error.error || 'Error al eliminar proveedor');
    }

    return response.json();
  },

  addContacto: async (proveedorId, contactoData) => {
    const response = await fetchWithTenant(`${API_URL}/${proveedorId}/contactos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(contactoData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al agregar contacto');
    }

    return response.json();
  },

  deleteContacto: async (contactoId) => {
    const response = await fetchWithTenant(`${API_URL}/contactos/${contactoId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar contacto');
    }

    return response.json();
  },
};