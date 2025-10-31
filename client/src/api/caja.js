const API_URL = '/api/caja';

export const cajaApi = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_URL}?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener cajas');
    }

    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener caja');
    }

    return response.json();
  },

  getCajaAbierta: async (usuario_id) => {
    const params = new URLSearchParams({ usuario_id });
    const response = await fetch(`${API_URL}/abierta?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener caja abierta');
    }

    return response.json();
  },

  abrirCaja: async (cajaData) => {
    const response = await fetch(`${API_URL}/abrir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(cajaData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al abrir caja');
    }

    return response.json();
  },

  cerrarCaja: async (id, cierreData) => {
    const response = await fetch(`${API_URL}/${id}/cerrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(cierreData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cerrar caja');
    }

    return response.json();
  },

  registrarMovimiento: async (movimientoData) => {
    const response = await fetch(`${API_URL}/movimientos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(movimientoData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar movimiento');
    }

    return response.json();
  },

  getResumen: async (cajaId) => {
    const response = await fetch(`${API_URL}/${cajaId}/resumen`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener resumen');
    }

    return response.json();
  },
};