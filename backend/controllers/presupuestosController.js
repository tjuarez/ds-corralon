import { getAll, getOne, runQuery } from '../db/database.js';
import { enviarPresupuestoPorEmail } from '../services/emailService.js';
import { getCotizacionActual } from '../utils/cotizacion.js';

// Obtener todos los presupuestos (con búsqueda y filtros)
export const getPresupuestos = async (req, res) => {
  try {
    const { search, estado, fecha_desde, fecha_hasta, cliente_id } = req.query;

    let sql = `
      SELECT p.*, 
             c.razon_social as cliente_nombre,
             c.tipo_cliente,
             m.codigo as moneda_codigo,
             m.simbolo as moneda_simbolo,
             u.nombre || ' ' || u.apellido as usuario_nombre
      FROM presupuestos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN monedas m ON p.moneda_id = m.id
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Búsqueda por número o cliente
    if (search) {
      sql += ` AND (p.numero LIKE ? OR c.razon_social LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    // Filtro por estado
    if (estado) {
      sql += ` AND p.estado = ?`;
      params.push(estado);
    }

    // Filtro por fecha
    if (fecha_desde) {
      sql += ` AND p.fecha >= ?`;
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      sql += ` AND p.fecha <= ?`;
      params.push(fecha_hasta);
    }

    // Filtro por cliente
    if (cliente_id) {
      sql += ` AND p.cliente_id = ?`;
      params.push(cliente_id);
    }

    sql += ` ORDER BY p.fecha DESC, p.numero DESC`;

    const presupuestos = await getAll(sql, params);
    res.json({ presupuestos });
  } catch (error) {
    console.error('Error en getPresupuestos:', error);
    res.status(500).json({ error: 'Error al obtener presupuestos' });
  }
};

// Obtener un presupuesto por ID
export const getPresupuestoById = async (req, res) => {
  try {
    const { id } = req.params;

    const presupuesto = await getOne(`
      SELECT p.*, 
             c.razon_social as cliente_nombre,
             c.tipo_cliente,
             c.cuit_dni as cliente_cuit,
             c.direccion as cliente_direccion,
             c.telefono as cliente_telefono,
             c.email as cliente_email,
             m.codigo as moneda_codigo,
             m.simbolo as moneda_simbolo,
             u.nombre || ' ' || u.apellido as usuario_nombre,
             p.cotizacion_momento
      FROM presupuestos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN monedas m ON p.moneda_id = m.id
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (!presupuesto) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    // Obtener detalle del presupuesto
    const detalle = await getAll(`
      SELECT pd.*,
             pr.codigo as producto_codigo,
             pr.descripcion as producto_descripcion,
             pr.unidad_medida as producto_unidad
      FROM presupuestos_detalle pd
      LEFT JOIN productos pr ON pd.producto_id = pr.id
      WHERE pd.presupuesto_id = ?
      ORDER BY pd.id ASC
    `, [id]);

    res.json({ 
      presupuesto: { 
        ...presupuesto, 
        detalle 
      } 
    });
  } catch (error) {
    console.error('Error en getPresupuestoById:', error);
    res.status(500).json({ error: 'Error al obtener presupuesto' });
  }
};

// Generar número de presupuesto
const generateNumeroPresupuesto = async () => {
  const year = new Date().getFullYear();
  const lastPresupuesto = await getOne(
    `SELECT numero FROM presupuestos 
     WHERE numero LIKE ? 
     ORDER BY numero DESC LIMIT 1`,
    [`PRES-${year}-%`]
  );

  let nextNumber = 1;
  if (lastPresupuesto) {
    const parts = lastPresupuesto.numero.split('-');
    nextNumber = parseInt(parts[2]) + 1;
  }

  return `PRES-${year}-${String(nextNumber).padStart(5, '0')}`;
};

// Crear nuevo presupuesto
export const createPresupuesto = async (req, res) => {
  try {
    const {
      cliente_id,
      fecha,
      fecha_vencimiento,
      moneda_id,
      detalle,
      descuento_porcentaje,
      descuento_monto,
      observaciones,
      usuario_id
    } = req.body;

    // Validaciones
    if (!cliente_id || !fecha || !moneda_id || !detalle || detalle.length === 0) {
      return res.status(400).json({ 
        error: 'Cliente, fecha, moneda y al menos un producto son obligatorios' 
      });
    }

    // Agregar esta validación
    if (!fecha_vencimiento) {
      return res.status(400).json({ 
        error: 'Fecha de vencimiento es obligatoria' 
      });
    }

    // Validar que fecha_vencimiento sea mayor a fecha
    if (new Date(fecha_vencimiento) < new Date(fecha)) {
      return res.status(400).json({ 
        error: 'La fecha de vencimiento debe ser posterior a la fecha del presupuesto' 
      });
    }

    // Verificar que el cliente existe
    const cliente = await getOne('SELECT id FROM clientes WHERE id = ?', [cliente_id]);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

// ========== OBTENER COTIZACIÓN DEL MOMENTO ==========
    const cotizacionMomento = await getCotizacionActual();
    console.log(`💱 Cotización del momento: ${cotizacionMomento}`);

    // Calcular totales
    let subtotal = 0;
    for (const item of detalle) {
      const itemSubtotal = item.cantidad * item.precio_unitario;
      const itemDescuento = itemSubtotal * (item.descuento_porcentaje || 0) / 100;
      subtotal += itemSubtotal - itemDescuento;
    }

    const descuentoMonto = descuento_monto || (subtotal * (descuento_porcentaje || 0) / 100);
    const total = subtotal - descuentoMonto;

    // Generar número de presupuesto
    const numero = await generateNumeroPresupuesto();

    // Insertar presupuesto
    const result = await runQuery(`
      INSERT INTO presupuestos (
        numero, cliente_id, fecha, fecha_vencimiento, moneda_id,
        subtotal, descuento_porcentaje, descuento_monto, impuestos, total,
        estado, observaciones, usuario_id, cotizacion_momento
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'pendiente', ?, ?, ?)
    `, [
      numero, cliente_id, fecha, fecha_vencimiento, moneda_id,
      subtotal, descuento_porcentaje || 0, descuentoMonto, total,
      observaciones, usuario_id, cotizacionMomento
    ]);

    const presupuestoId = result.id;

    // Insertar detalle
    for (const item of detalle) {
      const itemSubtotal = item.cantidad * item.precio_unitario;
      const itemDescuentoMonto = itemSubtotal * (item.descuento_porcentaje || 0) / 100;
      const itemTotal = itemSubtotal - itemDescuentoMonto;

      await runQuery(`
        INSERT INTO presupuestos_detalle (
          presupuesto_id, producto_id, descripcion, cantidad,
          precio_unitario, descuento_porcentaje, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        presupuestoId, item.producto_id, item.descripcion,
        item.cantidad, item.precio_unitario,
        item.descuento_porcentaje || 0, itemTotal
      ]);
    }

    res.status(201).json({
      message: 'Presupuesto creado exitosamente',
      presupuestoId,
      numero
    });
  } catch (error) {
    console.error('Error en createPresupuesto:', error);
    res.status(500).json({ error: 'Error al crear presupuesto' });
  }
};

// Actualizar presupuesto
export const updatePresupuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cliente_id,
      fecha,
      fecha_vencimiento,
      moneda_id,
      detalle,
      descuento_porcentaje,
      descuento_monto,
      observaciones
    } = req.body;

    // Verificar que el presupuesto existe y no está convertido
    const presupuesto = await getOne(
      'SELECT id, estado FROM presupuestos WHERE id = ?',
      [id]
    );
    
    if (!presupuesto) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    if (presupuesto.estado === 'convertido') {
      return res.status(400).json({ 
        error: 'No se puede editar un presupuesto ya convertido a venta' 
      });
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

    // Actualizar presupuesto
    await runQuery(`
      UPDATE presupuestos SET
        cliente_id = ?, fecha = ?, fecha_vencimiento = ?, moneda_id = ?,
        subtotal = ?, descuento_porcentaje = ?, descuento_monto = ?,
        total = ?, observaciones = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      cliente_id, fecha, fecha_vencimiento, moneda_id,
      subtotal, descuento_porcentaje || 0, descuentoMonto,
      total, observaciones, id
    ]);

    // Eliminar detalle anterior
    await runQuery('DELETE FROM presupuestos_detalle WHERE presupuesto_id = ?', [id]);

    // Insertar nuevo detalle
    for (const item of detalle) {
      const itemSubtotal = item.cantidad * item.precio_unitario;
      const itemDescuentoMonto = itemSubtotal * (item.descuento_porcentaje || 0) / 100;
      const itemTotal = itemSubtotal - itemDescuentoMonto;

      await runQuery(`
        INSERT INTO presupuestos_detalle (
          presupuesto_id, producto_id, descripcion, cantidad,
          precio_unitario, descuento_porcentaje, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        id, item.producto_id, item.descripcion,
        item.cantidad, item.precio_unitario,
        item.descuento_porcentaje || 0, itemTotal
      ]);
    }

    res.json({ message: 'Presupuesto actualizado exitosamente' });
  } catch (error) {
    console.error('Error en updatePresupuesto:', error);
    res.status(500).json({ error: 'Error al actualizar presupuesto' });
  }
};

// Cambiar estado del presupuesto
export const updateEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'aprobado', 'rechazado', 'convertido'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const presupuesto = await getOne(
      'SELECT id, estado FROM presupuestos WHERE id = ?',
      [id]
    );

    if (!presupuesto) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    await runQuery(
      'UPDATE presupuestos SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [estado, id]
    );

    res.json({ message: 'Estado actualizado exitosamente' });
  } catch (error) {
    console.error('Error en updateEstado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

// Eliminar presupuesto
export const deletePresupuesto = async (req, res) => {
  try {
    const { id } = req.params;

    const presupuesto = await getOne(
      'SELECT id, estado FROM presupuestos WHERE id = ?',
      [id]
    );

    if (!presupuesto) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    if (presupuesto.estado === 'convertido') {
      return res.status(400).json({ 
        error: 'No se puede eliminar un presupuesto ya convertido a venta' 
      });
    }

    // Eliminar detalle (por CASCADE también se elimina automáticamente)
    await runQuery('DELETE FROM presupuestos WHERE id = ?', [id]);

    res.json({ message: 'Presupuesto eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deletePresupuesto:', error);
    res.status(500).json({ error: 'Error al eliminar presupuesto' });
  }
};

// Enviar presupuesto por email
export const enviarEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { emailDestino } = req.body;

    if (!emailDestino) {
      return res.status(400).json({ error: 'Email de destino es requerido' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailDestino)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Obtener presupuesto completo
    const presupuesto = await getOne(`
      SELECT p.*, 
             c.razon_social as cliente_nombre,
             c.cuit_dni as cliente_cuit,
             c.direccion as cliente_direccion,
             m.codigo as moneda_codigo,
             m.simbolo as moneda_simbolo
      FROM presupuestos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN monedas m ON p.moneda_id = m.id
      WHERE p.id = ?
    `, [id]);

    if (!presupuesto) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    // Obtener detalle
    const detalle = await getAll(`
      SELECT pd.*,
             pr.codigo as producto_codigo,
             pr.descripcion as producto_descripcion
      FROM presupuestos_detalle pd
      LEFT JOIN productos pr ON pd.producto_id = pr.id
      WHERE pd.presupuesto_id = ?
    `, [id]);

    presupuesto.detalle = detalle;

    // Enviar email
    await enviarPresupuestoPorEmail(presupuesto, emailDestino);

    res.json({ message: 'Email enviado exitosamente' });
  } catch (error) {
    console.error('Error al enviar email:', error);
    res.status(500).json({ 
      error: error.message || 'Error al enviar email' 
    });
  }
};