import { getAll, getOne, runQuery } from '../db/database.js';
import { getEmpresaId } from '../utils/tenantHelper.js';

// Obtener toda la configuración
export const getConfiguracion = async (req, res) => {
  try {
    const empresaId = getEmpresaId(req);
    const configuraciones = await getAll('SELECT * FROM configuracion WHERE empresa_id = ? ORDER BY clave ASC', [empresaId]);
    
    // Convertir a objeto agrupado por secciones
    const config = {
      empresa: {},
      facturacion: {},
      monedas: {},
      general: {}
    };

    configuraciones.forEach(item => {
      if (item.clave.startsWith('empresa_')) {
        config.empresa[item.clave.replace('empresa_', '')] = item.valor;
      } else if (item.clave.startsWith('facturacion_')) {
        config.facturacion[item.clave.replace('facturacion_', '')] = item.valor;
      } else if (item.clave.startsWith('cotizacion_') || item.clave === 'moneda_principal') {
        config.monedas[item.clave] = item.valor;
      } else {
        config.general[item.clave] = item.valor;
      }
    });

    res.json({ configuracion: config });
  } catch (error) {
    console.error('Error en getConfiguracion:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
};

// Obtener configuración por clave
export const getConfigByKey = async (req, res) => {
  try {
    const { clave } = req.params;
    const empresaId = getEmpresaId(req);
    
    const config = await getOne('SELECT * FROM configuracion WHERE empresa_id = ? AND clave = ?', [empresaId, clave]);
    
    if (!config) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }

    res.json({ configuracion: config });
  } catch (error) {
    console.error('Error en getConfigByKey:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
};

// Actualizar configuración (una o múltiples claves)
export const updateConfiguracion = async (req, res) => {
  try {
    const { configuraciones } = req.body;
    const empresaId = getEmpresaId(req);

    if (!configuraciones || typeof configuraciones !== 'object') {
      return res.status(400).json({ 
        error: 'Se requiere un objeto con las configuraciones a actualizar' 
      });
    }

    // Actualizar cada configuración
    for (const [clave, valor] of Object.entries(configuraciones)) {
      // Verificar si existe
      const existe = await getOne('SELECT id FROM configuracion WHERE empresa_id = ? AND clave = ?', [empresaId, clave]);
      
      if (existe) {
        // Actualizar
        await runQuery(
          'UPDATE configuracion SET valor = ?, updated_at = CURRENT_TIMESTAMP WHERE empresa_id = ? AND clave = ?',
          [valor, empresaId, clave]
        );
      } else {
        // Insertar si no existe
        await runQuery(
          'INSERT INTO configuracion (clave, valor, tipo, updated_at, empresa_id) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)',
          [clave, valor, 'string', empresaId]
        );
      }
    }

    res.json({ message: 'Configuración actualizada exitosamente' });
  } catch (error) {
    console.error('Error en updateConfiguracion:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
};

// Obtener monedas activas
export const getMonedas = async (req, res) => {
  try {
    const empresaId = getEmpresaId(req);
    const monedas = await getAll('SELECT * FROM monedas WHERE empresa_id = ? AND activa = 1 ORDER BY codigo ASC', [empresaId]);
    res.json({ monedas });
  } catch (error) {
    console.error('Error en getMonedas:', error);
    res.status(500).json({ error: 'Error al obtener monedas' });
  }
};

// Actualizar cotización
export const updateCotizacion = async (req, res) => {
  try {
    const { cotizacion_usd_ars } = req.body;
    const empresaId = getEmpresaId(req);

    if (!cotizacion_usd_ars || cotizacion_usd_ars <= 0) {
      return res.status(400).json({ error: 'Cotización inválida' });
    }

    const fecha = new Date().toISOString();

    await runQuery(
      'UPDATE configuracion SET valor = ?, updated_at = CURRENT_TIMESTAMP WHERE empresa_id = ? AND clave = ?',
      [cotizacion_usd_ars.toString(), empresaId, 'cotizacion_usd_ars']
    );

    await runQuery(
      'UPDATE configuracion SET valor = ?, updated_at = CURRENT_TIMESTAMP WHERE empresa_id = ? AND clave = ?',
      [fecha, empresaId, 'cotizacion_fecha_actualizacion']
    );

    res.json({ 
      message: 'Cotización actualizada exitosamente',
      cotizacion: cotizacion_usd_ars,
      fecha
    });
  } catch (error) {
    console.error('Error en updateCotizacion:', error);
    res.status(500).json({ error: 'Error al actualizar cotización' });
  }
};