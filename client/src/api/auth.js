import { fetchWithTenant } from '../utils/fetchWithTenant';

const API_URL = '/api';

export const authApi = {
  login: async (tenant, username, password) => {
    const response = await fetchWithTenant(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ tenant, username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al iniciar sesión');
    }

    return response.json();
  },

  register: async (userData) => {
    const response = await fetchWithTenant(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar usuario');
    }

    return response.json();
  },

  logout: async () => {
    const response = await fetchWithTenant(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error al cerrar sesión');
    }

    return response.json();
  },

  getCurrentUser: async () => {
    const response = await fetchWithTenant(`${API_URL}/auth/me`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('No autenticado');
    }

    return response.json();
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await fetchWithTenant(`${API_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cambiar contraseña');
    }

    return response.json();
  },
};