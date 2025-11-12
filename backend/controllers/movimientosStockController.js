import { getAll, getOne } from '../db/database.js';
import { getEmpresaId } from '../utils/tenantHelper.js';

// Obtener movimientos de stock con filtros
export const getMovimientos = async (req, res) => {
  try {
    const { 
      producto_id, 
      sucursal_id, 
      tipo_movimiento, 
      fecha_desde, 
      fecha_hasta,
      search 
    } = req.query;
    const empresaId = getEmpresaId(req);

    let sql = `
      SELECT 
        ms.*,
        p.codigo as producto_codigo,
        p.descripcion as producto_descripcion,
        p.unidad_medida,
        s.nombre as sucursal_nombre,
        u.nombre || ' ' || u.apellido as usuario_nombre
      FROM movimientos_stock ms
      LEFT JOIN productos p ON ms.empresa_id = p.empresa_id AND ms.producto_id = p.id
      LEFT JOIN sucursales s ON ms.empresa_id = s.empresa_id AND ms.sucursal_id = s.id
      LEFT JOIN usuarios u ON ms.empresa_id = u.empresa_id AND ms.usuario_id = u.id
      WHERE ms.empresa_id = ?
    `;
    const params = [empresaId];

    // Filtro por producto
    if (producto_id) {
      sql += ` AND ms.producto_id = ?`;
      params.push(producto_id);
    }

    // Filtro por sucursal
    if (sucursal_id) {
      sql += ` AND ms.sucursal_id = ?`;
      params.push(sucursal_id);
    }

    // Filtro por tipo de movimiento
    if (tipo_movimiento) {
      sql += ` AND ms.tipo_movimiento = ?`;
      params.push(tipo_movimiento);
    }

    // Filtro por rango de fechas
    if (fecha_desde) {
      sql += ` AND DATE(ms.fecha) >= DATE(?)`;
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      sql += ` AND DATE(ms.fecha) <= DATE(?)`;
      params.push(fecha_hasta);
    }

    // Búsqueda por código o descripción
    if (search) {
      sql += ` AND (p.codigo LIKE ? OR p.descripcion LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    sql += ` ORDER BY ms.fecha DESC, ms.id DESC`;

    const movimientos = await getAll(sql, params);

    res.json({ movimientos });
  } catch (error) {
    console.error('Error en getMovimientos:', error);
    res.status(500).json({ error: 'Error al obtener movimientos de stock' });
  }
};

// Obtener resumen de movimientos
export const getResumen = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, sucursal_id } = req.query;
    const empresaId = getEmpresaId(req);

    let sql = `
      SELECT 
        tipo_movimiento,
        COUNT(*) as cantidad_movimientos,
        SUM(cantidad) as cantidad_total
      FROM movimientos_stock
      WHERE empresa_id = ?
    `;
    const params = [empresaId];

    if (fecha_desde) {
      sql += ` AND DATE(fecha) >= DATE(?)`;
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      sql += ` AND DATE(fecha) <= DATE(?)`;
      params.push(fecha_hasta);
    }

    if (sucursal_id) {
      sql += ` AND sucursal_id = ?`;
      params.push(sucursal_id);
    }

    sql += ` GROUP BY tipo_movimiento`;

    const resumen = await getAll(sql, params);

    res.json({ resumen });
  } catch (error) {
    console.error('Error en getResumen:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};