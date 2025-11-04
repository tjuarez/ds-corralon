import { fetchWithSucursal } from '../utils/fetchWithSucursal';

const API_URL = '/api/clientes';

export const clientesApi = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetchWithSucursal(`${API_URL}?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener clientes');
    }

    return response.json();
  },

  getById: async (id) => {
    const response = await fetchWithSucursal(`${API_URL}/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener cliente');
    }

    return response.json();
  },

  create: async (clienteData) => {
    const response = await fetchWithSucursal(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(clienteData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear cliente');
    }

    return response.json();
  },

  update: async (id, clienteData) => {
    const response = await fetchWithSucursal(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(clienteData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar cliente');
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
      throw new Error(error.error || 'Error al eliminar cliente');
    }

    return response.json();
  },

  addContacto: async (clienteId, contactoData) => {
    const response = await fetchWithSucursal(`${API_URL}/${clienteId}/contactos`, {
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
    const response = await fetchWithSucursal(`${API_URL}/contactos/${contactoId}`, {
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