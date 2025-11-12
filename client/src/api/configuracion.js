import { fetchWithTenant } from '../utils/fetchWithTenant';

const API_URL = '/api';

export const configuracionApi = {
  // Obtener toda la configuración
  getAll: async () => {
    const response = await fetchWithTenant(`${API_URL}/configuracion`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener configuración');
    }

    return response.json();
  },

  // Actualizar configuración
  update: async (configuraciones) => {
    const response = await fetchWithTenant(`${API_URL}/configuracion`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ configuraciones }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar configuración');
    }

    return response.json();
  },

  // Obtener monedas
  getMonedas: async () => {
    const response = await fetchWithTenant(`${API_URL}/configuracion/monedas/list`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener monedas');
    }

    return response.json();
  },

  // Actualizar cotización
  updateCotizacion: async (cotizacion_usd_ars) => {
    const response = await fetchWithTenant(`${API_URL}/configuracion/cotizacion/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ cotizacion_usd_ars }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar cotización');
    }

    return response.json();
  },

  // Obtener cotización actual
  getCotizacionActual: async () => {
    const response = await fetchWithTenant(`${API_URL}/configuracion/cotizacion_usd_ars`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener cotización');
    }

    return response.json();
  },
};