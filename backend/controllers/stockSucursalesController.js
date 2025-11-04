import { getAll, getOne, runQuery } from '../db/database.js';

// Obtener stock de un producto en todas las sucursales
export const getStockProducto = async (req, res) => {
  try {
    const { producto_id } = req.params;

    const stocks = await getAll(`
      SELECT ss.*,
             s.nombre as sucursal_nombre,
             s.codigo as sucursal_codigo,
             p.codigo as producto_codigo,
             p.descripcion as producto_descripcion
      FROM stock_sucursales ss
      LEFT JOIN sucursales s ON ss.sucursal_id = s.id
      LEFT JOIN productos p ON ss.producto_id = p.id
      WHERE ss.producto_id = ?
      ORDER BY s.nombre ASC
    `, [producto_id]);

    res.json({ stocks });
  } catch (error) {
    console.error('Error en getStockProducto:', error);
    res.status(500).json({ error: 'Error al obtener stock del producto' });
  }
};

// Obtener stock de una sucursal
export const getStockSucursal = async (req, res) => {
  try {
    const { sucursal_id } = req.params;
    const { categoria_id, buscar, bajo_minimo } = req.query;

    let sql = `
      SELECT ss.*,
             p.codigo as producto_codigo,
             p.descripcion as producto_descripcion,
             p.unidad_medida,
             p.precio_costo,
             c.nombre as categoria_nombre
      FROM stock_sucursales ss
      LEFT JOIN productos p ON ss.producto_id = p.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE ss.sucursal_id = ?
    `;
    const params = [sucursal_id];

    if (categoria_id) {
      sql += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    if (buscar) {
      sql += ' AND (p.codigo LIKE ? OR p.descripcion LIKE ?)';
      const searchTerm = `%${buscar}%`;
      params.push(searchTerm, searchTerm);
    }

    if (bajo_minimo === 'true') {
      sql += ' AND ss.stock_actual <= ss.stock_minimo';
    }

    sql += ' ORDER BY p.descripcion ASC';

    const stocks = await getAll(sql, params);
    res.json({ stocks });
  } catch (error) {
    console.error('Error en getStockSucursal:', error);
    res.status(500).json({ error: 'Error al obtener stock de la sucursal' });
  }
};

// Inicializar stock para un producto en una sucursal
export const inicializarStock = async (req, res) => {
  try {
    const { producto_id, sucursal_id, stock_inicial, stock_minimo, stock_maximo } = req.body;

    if (!producto_id || !sucursal_id) {
      return res.status(400).json({ error: 'Producto y sucursal son obligatorios' });
    }

    // Verificar si ya existe
    const existe = await getOne(
      'SELECT id FROM stock_sucursales WHERE producto_id = ? AND sucursal_id = ?',
      [producto_id, sucursal_id]
    );

    if (existe) {
      return res.status(400).json({ error: 'El stock para este producto en esta sucursal ya existe' });
    }

    await runQuery(`
      INSERT INTO stock_sucursales (
        producto_id, sucursal_id, stock_actual, stock_minimo, stock_maximo
      ) VALUES (?, ?, ?, ?, ?)
    `, [producto_id, sucursal_id, stock_inicial || 0, stock_minimo || 0, stock_maximo || 0]);

    res.status(201).json({ message: 'Stock inicializado correctamente' });
  } catch (error) {
    console.error('Error en inicializarStock:', error);
    res.status(500).json({ error: 'Error al inicializar stock' });
  }
};

// Ajustar stock manualmente
export const ajustarStock = async (req, res) => {
  try {
    const { producto_id, sucursal_id, cantidad, motivo, usuario_id } = req.body;

    if (!producto_id || !sucursal_id || cantidad === undefined || !motivo) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Obtener stock actual
    const stockActual = await getOne(
      'SELECT stock_actual FROM stock_sucursales WHERE producto_id = ? AND sucursal_id = ?',
      [producto_id, sucursal_id]
    );

    if (!stockActual) {
      return res.status(404).json({ error: 'Stock no encontrado para este producto en esta sucursal' });
    }

    const stockAnterior = stockActual.stock_actual;
    const stockNuevo = parseFloat(stockAnterior) + parseFloat(cantidad);

    if (stockNuevo < 0) {
      return res.status(400).json({ error: 'El ajuste resultaría en stock negativo' });
    }

    // Actualizar stock en sucursal
    await runQuery(
      'UPDATE stock_sucursales SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP WHERE producto_id = ? AND sucursal_id = ?',
      [stockNuevo, producto_id, sucursal_id]
    );

    // Registrar movimiento
    const tipoMovimiento = cantidad > 0 ? 'entrada' : 'salida';
    await runQuery(`
      INSERT INTO movimientos_stock (
        producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo,
        motivo, usuario_id, sucursal_id, fecha
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      producto_id, tipoMovimiento, Math.abs(cantidad), stockAnterior, stockNuevo,
      motivo, usuario_id, sucursal_id
    ]);

    // Actualizar stock total del producto
    await actualizarStockTotal(producto_id);

    res.json({ message: 'Stock ajustado correctamente', stock_nuevo: stockNuevo });
  } catch (error) {
    console.error('Error en ajustarStock:', error);
    res.status(500).json({ error: 'Error al ajustar stock' });
  }
};

// Transferir stock entre sucursales
export const transferirStock = async (req, res) => {
  try {
    const { producto_id, sucursal_origen_id, sucursal_destino_id, cantidad, motivo, usuario_id } = req.body;

    if (!producto_id || !sucursal_origen_id || !sucursal_destino_id || !cantidad || !motivo) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (cantidad <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    // Verificar stock origen
    const stockOrigen = await getOne(
      'SELECT stock_actual FROM stock_sucursales WHERE producto_id = ? AND sucursal_id = ?',
      [producto_id, sucursal_origen_id]
    );

    if (!stockOrigen) {
      return res.status(404).json({ error: 'Stock no encontrado en sucursal origen' });
    }

    if (stockOrigen.stock_actual < cantidad) {
      return res.status(400).json({ error: 'Stock insuficiente en sucursal origen' });
    }

    // Verificar/crear stock destino
    let stockDestino = await getOne(
      'SELECT stock_actual FROM stock_sucursales WHERE producto_id = ? AND sucursal_id = ?',
      [producto_id, sucursal_destino_id]
    );

    if (!stockDestino) {
      // Crear registro si no existe
      await runQuery(`
        INSERT INTO stock_sucursales (producto_id, sucursal_id, stock_actual)
        VALUES (?, ?, 0)
      `, [producto_id, sucursal_destino_id]);
      stockDestino = { stock_actual: 0 };
    }

    // Realizar transferencia
    const nuevoStockOrigen = parseFloat(stockOrigen.stock_actual) - parseFloat(cantidad);
    const nuevoStockDestino = parseFloat(stockDestino.stock_actual) + parseFloat(cantidad);

    // Actualizar origen
    await runQuery(
      'UPDATE stock_sucursales SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP WHERE producto_id = ? AND sucursal_id = ?',
      [nuevoStockOrigen, producto_id, sucursal_origen_id]
    );

    // Actualizar destino
    await runQuery(
      'UPDATE stock_sucursales SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP WHERE producto_id = ? AND sucursal_id = ?',
      [nuevoStockDestino, producto_id, sucursal_destino_id]
    );

    // Registrar movimiento origen (salida)
    await runQuery(`
      INSERT INTO movimientos_stock (
        producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo,
        motivo, usuario_id, sucursal_id, fecha
      ) VALUES (?, 'salida', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      producto_id, cantidad, stockOrigen.stock_actual, nuevoStockOrigen,
      `Transferencia a sucursal destino: ${motivo}`, usuario_id, sucursal_origen_id
    ]);

    // Registrar movimiento destino (entrada)
    await runQuery(`
      INSERT INTO movimientos_stock (
        producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo,
        motivo, usuario_id, sucursal_id, fecha
      ) VALUES (?, 'entrada', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      producto_id, cantidad, stockDestino.stock_actual, nuevoStockDestino,
      `Transferencia desde sucursal origen: ${motivo}`, usuario_id, sucursal_destino_id
    ]);

    res.json({ 
      message: 'Transferencia realizada correctamente',
      stock_origen: nuevoStockOrigen,
      stock_destino: nuevoStockDestino
    });
  } catch (error) {
    console.error('Error en transferirStock:', error);
    res.status(500).json({ error: 'Error al transferir stock' });
  }
};

// Función auxiliar para actualizar stock total del producto
const actualizarStockTotal = async (producto_id) => {
  const resultado = await getOne(`
    SELECT COALESCE(SUM(stock_actual), 0) as stock_total
    FROM stock_sucursales
    WHERE producto_id = ?
  `, [producto_id]);

  await runQuery(
    'UPDATE productos SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [resultado.stock_total, producto_id]
  );
};

export { actualizarStockTotal };