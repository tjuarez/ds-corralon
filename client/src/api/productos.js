import { fetchWithTenant } from '../utils/fetchWithTenant';

const API_URL = '/api';

export const productosApi = {
  // Productos
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetchWithTenant(`${API_URL}/productos?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener productos');
    }

    return response.json();
  },

  getById: async (id) => {
    const response = await fetchWithTenant(`${API_URL}/productos/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener producto');
    }

    return response.json();
  },

  create: async (productoData) => {
    const response = await fetchWithTenant(`${API_URL}/productos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(productoData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear producto');
    }

    return response.json();
  },

  update: async (id, productoData) => {
    const response = await fetchWithTenant(`${API_URL}/productos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(productoData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar producto');
    }

    return response.json();
  },

  delete: async (id) => {
    const response = await fetchWithTenant(`${API_URL}/productos/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar producto');
    }

    return response.json();
  },

  updatePrecios: async (id, precios) => {
    const response = await fetchWithTenant(`${API_URL}/productos/${id}/precios`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ precios }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar precios');
    }

    return response.json();
  },

  // Categorías
  getCategorias: async () => {
    const response = await fetchWithTenant(`${API_URL}/categorias`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener categorías');
    }

    return response.json();
  },

  createCategoria: async (categoriaData) => {
    const response = await fetchWithTenant(`${API_URL}/categorias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(categoriaData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear categoría');
    }

    return response.json();
  },

  // Upload de imagen
  uploadImagen: async (file) => {
    const formData = new FormData();
    formData.append('imagen', file);

    const response = await fetchWithTenant(`${API_URL}/upload/producto-imagen`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al subir imagen');
    }

    return response.json();
  },

  // Eliminar imagen
  deleteImagen: async (filename) => {
    const response = await fetchWithTenant(`${API_URL}/upload/producto-imagen/${filename}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar imagen');
    }

    return response.json();
  },
};