import { getAll, getOne, runQuery } from '../db/database.js';
import { actualizarStockTotal } from './stockSucursalesController.js';

// Obtener todas las compras (con búsqueda y filtros)
export const getCompras = async (req, res) => {
  try {
    const { search, fecha_desde, fecha_hasta, proveedor_id, estado, sucursal_id } = req.query;
    const user = req.user;

    let sql = `
      SELECT c.*, 
             p.razon_social as proveedor_nombre,
             m.codigo as moneda_codigo,
             m.simbolo as moneda_simbolo,
             u.nombre || ' ' || u.apellido as usuario_nombre,
             s.nombre as sucursal_nombre
      FROM compras c
      LEFT JOIN proveedores p ON c.proveedor_id = p.id
      LEFT JOIN monedas m ON c.moneda_id = m.id
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      LEFT JOIN sucursales s ON c.sucursal_id = s.id
      WHERE 1=1
    `;
    const params = [];

    // FILTRO CRÍTICO: Control por sucursal
    if (user.rol !== 'admin') {
      // No-admin: SOLO puede ver compras de su sucursal
      if (!user.sucursal_id) {
        return res.status(400).json({ 
          error: 'Usuario no tiene sucursal asignada' 
        });
      }
      sql += ' AND c.sucursal_id = ?';
      params.push(user.sucursal_id);
    } else {
      // Admin: puede filtrar por sucursal específica o ver todas
      if (sucursal_id) {
        sql += ' AND c.sucursal_id = ?';
        params.push(sucursal_id);
      }
    }

    // Búsqueda por número o proveedor
    if (search) {
      sql += ` AND (c.numero_comprobante LIKE ? OR p.razon_social LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    // Filtro por fecha
    if (fecha_desde) {
      sql += ` AND c.fecha >= ?`;
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      sql += ` AND c.fecha <= ?`;
      params.push(fecha_hasta);
    }

    // Filtro por proveedor
    if (proveedor_id) {
      sql += ` AND c.proveedor_id = ?`;
      params.push(proveedor_id);
    }

    // Filtro por estado
    if (estado) {
      sql += ` AND c.estado = ?`;
      params.push(estado);
    }

    sql += ` ORDER BY c.fecha DESC, c.numero_comprobante DESC`;

    const compras = await getAll(sql, params);
    res.json({ compras });
  } catch (error) {
    console.error('Error en getCompras:', error);
    res.status(500).json({ error: 'Error al obtener compras' });
  }
};

// Obtener una compra por ID
export const getCompraById = async (req, res) => {
  try {
    const { id } = req.params;

    const compra = await getOne(`
      SELECT c.*, 
             p.razon_social as proveedor_nombre,
             p.cuit_dni as proveedor_cuit,
             p.direccion as proveedor_direccion,
             p.telefono as proveedor_telefono,
             p.email as proveedor_email,
             m.codigo as moneda_codigo,
             m.simbolo as moneda_simbolo,
             u.nombre || ' ' || u.apellido as usuario_nombre,
             s.nombre as sucursal_nombre
      FROM compras c
      LEFT JOIN proveedores p ON c.proveedor_id = p.id
      LEFT JOIN monedas m ON c.moneda_id = m.id
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      LEFT JOIN sucursales s ON c.sucursal_id = s.id
      WHERE c.id = ?
    `, [id]);

    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    // Obtener detalle de la compra
    const detalle = await getAll(`
      SELECT cd.*,
             p.codigo as producto_codigo,
             p.descripcion as producto_descripcion,
             p.unidad_medida as producto_unidad
      FROM compras_detalle cd
      LEFT JOIN productos p ON cd.producto_id = p.id
      WHERE cd.compra_id = ?
      ORDER BY cd.id ASC
    `, [id]);

    res.json({ 
      compra: { 
        ...compra, 
        detalle 
      } 
    });
  } catch (error) {
    console.error('Error en getCompraById:', error);
    res.status(500).json({ error: 'Error al obtener compra' });
  }
};

// Generar número de comprobante
const generateNumeroComprobante = async () => {
  const year = new Date().getFullYear();
  
  const lastCompra = await getOne(
    `SELECT numero_comprobante FROM compras 
     WHERE numero_comprobante LIKE ? 
     ORDER BY numero_comprobante DESC LIMIT 1`,
    [`COM-${year}-%`]
  );

  let nextNumber = 1;
  if (lastCompra) {
    const parts = lastCompra.numero_comprobante.split('-');
    nextNumber = parseInt(parts[2]) + 1;
  }

  return `COM-${year}-${String(nextNumber).padStart(8, '0')}`;
};

// Crear nueva compra
export const createCompra = async (req, res) => {
  try {
    const {
      proveedor_id,
      fecha,
      numero_factura,
      tipo_comprobante,
      moneda_id,
      detalle,
      descuento_porcentaje,
      descuento_monto,
      forma_pago,
      observaciones,
      usuario_id
    } = req.body;

    const user = req.user;

    // VALIDACIÓN CRÍTICA: Usuario debe tener sucursal
    if (!user.sucursal_id) {
      return res.status(400).json({
        error: 'No puedes crear compras sin tener una sucursal asignada. Contacte al administrador.'
      });
    }

    // Validaciones
    if (!proveedor_id || !fecha || !moneda_id || !detalle || detalle.length === 0 || !forma_pago) {
      return res.status(400).json({ 
        error: 'Proveedor, fecha, moneda, forma de pago y al menos un producto son obligatorios' 
      });
    }

    // Verificar que el proveedor existe
    const proveedor = await getOne('SELECT id FROM proveedores WHERE id = ?', [proveedor_id]);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Verificar que los productos existen
    for (const item of detalle) {
      const producto = await getOne(
        'SELECT id, codigo, descripcion FROM productos WHERE id = ?',
        [item.producto_id]
      );

      if (!producto) {
        return res.status(404).json({ 
          error: `Producto con ID ${item.producto_id} no encontrado` 
        });
      }
    }

    // Calcular totales
    let subtotal = 0;
    for (const item of detalle) {
      const itemSubtotal = item.cantidad * item.precio_unitario;
      const itemDescuento = itemSubtotal * (item.descuento_porcentaje || 0) / 100;
      subtotal += itemSubtotal - itemDescuento;
    }

    const descuentoMonto = descuento_monto || (subtotal * (descuento_porcentaje || 0) / 100);
    const total = subtotal - descuentoMonto;

    // Generar número de comprobante interno
    const numero_comprobante = await generateNumeroComprobante();

    // INSERTAR COMPRA CON SUCURSAL_ID
    const result = await runQuery(`
      INSERT INTO compras (
        numero_comprobante, numero_factura, tipo_comprobante, proveedor_id, 
        fecha, moneda_id, subtotal, descuento_porcentaje, descuento_monto, 
        total, forma_pago, estado, observaciones, usuario_id, sucursal_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'recibida', ?, ?, ?)
    `, [
      numero_comprobante, numero_factura, tipo_comprobante, proveedor_id,
      fecha, moneda_id, subtotal, descuento_porcentaje || 0, descuentoMonto, 
      total, forma_pago, observaciones, usuario_id, user.sucursal_id
    ]);

    const compraId = result.id;

    // ========== ACTUALIZAR STOCK POR SUCURSAL ==========
    for (const item of detalle) {
      const itemSubtotal = item.cantidad * item.precio_unitario;
      const itemDescuentoMonto = itemSubtotal * (item.descuento_porcentaje || 0) / 100;
      const itemTotal = itemSubtotal - itemDescuentoMonto;

      // Insertar detalle de compra
      await runQuery(`
        INSERT INTO compras_detalle (
          compra_id, producto_id, descripcion, cantidad,
          precio_unitario, descuento_porcentaje, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        compraId, item.producto_id, item.descripcion,
        item.cantidad, item.precio_unitario,
        item.descuento_porcentaje || 0, itemTotal
      ]);

      // Verificar si existe stock para este producto en esta sucursal
      let stockSucursal = await getOne(
        'SELECT stock_actual FROM stock_sucursales WHERE producto_id = ? AND sucursal_id = ?',
        [item.producto_id, user.sucursal_id]
      );

      let stockAnterior = 0;
      
      if (!stockSucursal) {
        // Si no existe, crear el registro
        await runQuery(`
          INSERT INTO stock_sucursales (producto_id, sucursal_id, stock_actual)
          VALUES (?, ?, 0)
        `, [item.producto_id, user.sucursal_id]);
        stockAnterior = 0;
      } else {
        stockAnterior = stockSucursal.stock_actual;
      }

      const stockNuevo = stockAnterior + item.cantidad;

      // Actualizar stock en la sucursal
      await runQuery(
        'UPDATE stock_sucursales SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP WHERE producto_id = ? AND sucursal_id = ?',
        [stockNuevo, item.producto_id, user.sucursal_id]
      );

      // Registrar movimiento de stock con sucursal_id
      await runQuery(`
        INSERT INTO movimientos_stock (
          producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo,
          motivo, compra_id, usuario_id, sucursal_id, fecha
        ) VALUES (?, 'entrada', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        item.producto_id, item.cantidad, stockAnterior, stockNuevo,
        `Compra ${numero_comprobante}`, compraId, usuario_id, user.sucursal_id
      ]);

      // Actualizar stock total del producto
      await actualizarStockTotal(item.producto_id);

      // Actualizar precio de costo
      await runQuery(
        'UPDATE productos SET precio_costo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.precio_unitario, item.producto_id]
      );
    }

    res.status(201).json({
      message: 'Compra registrada exitosamente',
      compraId,
      numero_comprobante
    });
  } catch (error) {
    console.error('Error en createCompra:', error);
    res.status(500).json({ error: 'Error al crear compra' });
  }
};

// Actualizar estado de compra
export const updateEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'recibida', 'pagada', 'anulada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const compra = await getOne('SELECT id FROM compras WHERE id = ?', [id]);
    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    await runQuery(
      'UPDATE compras SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [estado, id]
    );

    res.json({ message: 'Estado actualizado exitosamente' });
  } catch (error) {
    console.error('Error en updateEstado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

// Anular compra (solo admin)
export const anularCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id } = req.body;

    const compra = await getOne(
      'SELECT id, estado, numero_comprobante, sucursal_id FROM compras WHERE id = ?',
      [id]
    );

    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    if (compra.estado === 'anulada') {
      return res.status(400).json({ error: 'La compra ya está anulada' });
    }

    // Obtener detalle para revertir stock
    const detalle = await getAll(
      'SELECT producto_id, cantidad FROM compras_detalle WHERE compra_id = ?',
      [id]
    );

    // ========== REVERTIR STOCK EN LA SUCURSAL ==========
    for (const item of detalle) {
      const stockSucursal = await getOne(
        'SELECT stock_actual FROM stock_sucursales WHERE producto_id = ? AND sucursal_id = ?',
        [item.producto_id, compra.sucursal_id]
      );

      if (!stockSucursal) {
        return res.status(400).json({ 
          error: 'No se puede anular: no hay registro de stock para este producto en la sucursal' 
        });
      }

      const stockAnterior = stockSucursal.stock_actual;
      const stockNuevo = stockAnterior - item.cantidad;

      if (stockNuevo < 0) {
        return res.status(400).json({ 
          error: 'No se puede anular: el stock resultante sería negativo en la sucursal' 
        });
      }

      await runQuery(
        'UPDATE stock_sucursales SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP WHERE producto_id = ? AND sucursal_id = ?',
        [stockNuevo, item.producto_id, compra.sucursal_id]
      );

      // Registrar movimiento de stock
      await runQuery(`
        INSERT INTO movimientos_stock (
          producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo,
          motivo, compra_id, usuario_id, sucursal_id, fecha
        ) VALUES (?, 'salida', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        item.producto_id, item.cantidad, stockAnterior, stockNuevo,
        `Anulación compra ${compra.numero_comprobante}`, id, usuario_id, compra.sucursal_id
      ]);

      // Actualizar stock total del producto
      await actualizarStockTotal(item.producto_id);
    }

    // Marcar compra como anulada
    await runQuery(
      'UPDATE compras SET estado = \'anulada\', updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: 'Compra anulada exitosamente. Stock revertido.' });
  } catch (error) {
    console.error('Error en anularCompra:', error);
    res.status(500).json({ error: 'Error al anular compra' });
  }
};