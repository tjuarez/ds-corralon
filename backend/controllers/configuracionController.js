import { getAll, getOne, runQuery } from '../db/database.js';

// Obtener toda la configuración
export const getConfiguracion = async (req, res) => {
  try {
    const configuraciones = await getAll('SELECT * FROM configuracion ORDER BY clave ASC');
    
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
    
    const config = await getOne('SELECT * FROM configuracion WHERE clave = ?', [clave]);
    
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

    if (!configuraciones || typeof configuraciones !== 'object') {
      return res.status(400).json({ 
        error: 'Se requiere un objeto con las configuraciones a actualizar' 
      });
    }

    // Actualizar cada configuración
    for (const [clave, valor] of Object.entries(configuraciones)) {
      // Verificar si existe
      const existe = await getOne('SELECT id FROM configuracion WHERE clave = ?', [clave]);
      
      if (existe) {
        // Actualizar
        await runQuery(
          'UPDATE configuracion SET valor = ?, updated_at = CURRENT_TIMESTAMP WHERE clave = ?',
          [valor, clave]
        );
      } else {
        // Insertar si no existe
        await runQuery(
          'INSERT INTO configuracion (clave, valor, tipo, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
          [clave, valor, 'string']
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
    const monedas = await getAll('SELECT * FROM monedas WHERE activa = 1 ORDER BY codigo ASC');
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

    if (!cotizacion_usd_ars || cotizacion_usd_ars <= 0) {
      return res.status(400).json({ error: 'Cotización inválida' });
    }

    const fecha = new Date().toISOString();

    await runQuery(
      'UPDATE configuracion SET valor = ?, updated_at = CURRENT_TIMESTAMP WHERE clave = ?',
      [cotizacion_usd_ars.toString(), 'cotizacion_usd_ars']
    );

    await runQuery(
      'UPDATE configuracion SET valor = ?, updated_at = CURRENT_TIMESTAMP WHERE clave = ?',
      [fecha, 'cotizacion_fecha_actualizacion']
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