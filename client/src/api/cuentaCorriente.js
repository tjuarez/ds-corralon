import { fetchWithTenant } from '../utils/fetchWithTenant';

const API_URL = '/api/cuenta-corriente';

export const cuentaCorrienteApi = {
  getClientes: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetchWithTenant(`${API_URL}/clientes?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener clientes');
    }

    return response.json();
  },

  getEstadoCuenta: async (clienteId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetchWithTenant(`${API_URL}/clientes/${clienteId}/estado-cuenta?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener estado de cuenta');
    }

    return response.json();
  },

  registrarPago: async (pagoData) => {
    const response = await fetchWithTenant(`${API_URL}/pagos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(pagoData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar pago');
    }

    return response.json();
  },

  getResumen: async () => {
    const response = await fetchWithTenant(`${API_URL}/resumen`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener resumen');
    }

    return response.json();
  },
};