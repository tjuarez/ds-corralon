import { getAll, getOne, runQuery } from '../db/database.js';

// Obtener todas las ventas (con búsqueda y filtros)
export const getVentas = async (req, res) => {
  try {
    const { search, fecha_desde, fecha_hasta, cliente_id, forma_pago } = req.query;

    let sql = `
      SELECT v.*, 
             c.razon_social as cliente_nombre,
             c.tipo_cliente,
             m.codigo as moneda_codigo,
             m.simbolo as moneda_simbolo,
             u.nombre || ' ' || u.apellido as usuario_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN monedas m ON v.moneda_id = m.id
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Búsqueda por número o cliente
    if (search) {
      sql += ` AND (v.numero_comprobante LIKE ? OR c.razon_social LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    // Filtro por fecha
    if (fecha_desde) {
      sql += ` AND v.fecha >= ?`;
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      sql += ` AND v.fecha <= ?`;
      params.push(fecha_hasta);
    }

    // Filtro por cliente
    if (cliente_id) {
      sql += ` AND v.cliente_id = ?`;
      params.push(cliente_id);
    }

    // Filtro por forma de pago
    if (forma_pago) {
      sql += ` AND v.forma_pago = ?`;
      params.push(forma_pago);
    }

    sql += ` ORDER BY v.fecha DESC, v.numero_comprobante DESC`;

    const ventas = await getAll(sql, params);
    res.json({ ventas });
  } catch (error) {
    console.error('Error en getVentas:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
};

// Obtener una venta por ID
export const getVentaById = async (req, res) => {
  try {
    const { id } = req.params;

    const venta = await getOne(`
      SELECT v.*, 
             c.razon_social as cliente_nombre,
             c.tipo_cliente,
             c.cuit_dni as cliente_cuit,
             c.direccion as cliente_direccion,
             c.telefono as cliente_telefono,
             c.email as cliente_email,
             m.codigo as moneda_codigo,
             m.simbolo as moneda_simbolo,
             u.nombre || ' ' || u.apellido as usuario_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN monedas m ON v.moneda_id = m.id
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.id = ?
    `, [id]);

    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    // Obtener detalle de la venta
    const detalle = await getAll(`
      SELECT vd.*,
            p.codigo as producto_codigo,
            p.descripcion as producto_descripcion,
            p.unidad_medida as producto_unidad
      FROM ventas_detalle vd
      LEFT JOIN productos p ON vd.producto_id = p.id
      WHERE vd.venta_id = ?
      ORDER BY vd.id ASC
    `, [id]);

    // Obtener formas de pago
    const pagos = await getAll(`
      SELECT * FROM ventas_pagos WHERE venta_id = ? ORDER BY id ASC
    `, [id]);

    res.json({ 
      venta: { 
        ...venta, 
        detalle,
        pagos
      } 
    });
  } catch (error) {
    console.error('Error en getVentaById:', error);
    res.status(500).json({ error: 'Error al obtener venta' });
  }
};

// Generar número de comprobante
const generateNumeroComprobante = async (tipo_comprobante) => {
  const year = new Date().getFullYear();
  const tipoPrefix = tipo_comprobante === 'factura_a' ? 'FA' : 
                     tipo_comprobante === 'factura_b' ? 'FB' : 
                     tipo_comprobante === 'factura_c' ? 'FC' : 
                     tipo_comprobante === 'remito' ? 'REM' : 'TK';

  const lastVenta = await getOne(
    `SELECT numero_comprobante FROM ventas 
     WHERE numero_comprobante LIKE ? 
     ORDER BY numero_comprobante DESC LIMIT 1`,
    [`${tipoPrefix}-${year}-%`]
  );

  let nextNumber = 1;
  if (lastVenta) {
    const parts = lastVenta.numero_comprobante.split('-');
    nextNumber = parseInt(parts[2]) + 1;
  }

  return `${tipoPrefix}-${year}-${String(nextNumber).padStart(8, '0')}`;
};

// Crear nueva venta
export const createVenta = async (req, res) => {
  try {
    const {
      cliente_id,
      fecha,
      tipo_comprobante,
      moneda_id,
      detalle,
      descuento_porcentaje,
      descuento_monto,
      forma_pago,
      pagos,
      observaciones,
      usuario_id,
      presupuesto_id
    } = req.body;

    // Validaciones
    if (!cliente_id || !fecha || !moneda_id || !detalle || detalle.length === 0) {
      return res.status(400).json({ 
        error: 'Cliente, fecha, moneda y al menos un producto son obligatorios' 
      });
    }

    // Validar que haya al menos una forma de pago
    if (!forma_pago && (!pagos || pagos.length === 0)) {
      return res.status(400).json({ 
        error: 'Debe especificar al menos una forma de pago' 
      });
    }

    // Verificar que el cliente existe
    const cliente = await getOne('SELECT id FROM clientes WHERE id = ?', [cliente_id]);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Verificar stock disponible
    for (const item of detalle) {
      const producto = await getOne(
        'SELECT id, codigo, descripcion, stock_actual FROM productos WHERE id = ?',
        [item.producto_id]
      );

      if (!producto) {
        return res.status(404).json({ 
          error: `Producto con ID ${item.producto_id} no encontrado` 
        });
      }

      if (producto.stock_actual < item.cantidad) {
        return res.status(400).json({ 
          error: `Stock insuficiente para ${producto.codigo} - ${producto.descripcion}. Stock actual: ${producto.stock_actual}` 
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

    // Si hay pagos múltiples, validar que sumen el total
    if (pagos && pagos.length > 0) {
      const sumaPagos = pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0);
      // Usar toFixed para evitar problemas de precisión de punto flotante
      if (Math.abs(sumaPagos - total) > 0.01) {
        return res.status(400).json({ 
          error: `La suma de los pagos (${sumaPagos}) no coincide con el total (${total})` 
        });
      }
    }

    // Generar número de comprobante
    const numero_comprobante = await generateNumeroComprobante(tipo_comprobante);

    // Insertar venta (forma_pago puede ser null si hay múltiples pagos)
    const formaPagoVenta = forma_pago || 'multiple';
    const result = await runQuery(`
      INSERT INTO ventas (
        numero_comprobante, tipo_comprobante, cliente_id, fecha, moneda_id,
        subtotal, descuento_porcentaje, descuento_monto, impuestos, total,
        forma_pago, estado, observaciones, presupuesto_id, usuario_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completada', ?, ?, ?)
    `, [
      numero_comprobante, tipo_comprobante, cliente_id, fecha, moneda_id,
      subtotal, descuento_porcentaje || 0, descuentoMonto, 0, total,
      formaPagoVenta, observaciones, presupuesto_id, usuario_id
    ]);

    const ventaId = result.id;

    // Insertar detalle y actualizar stock
    for (const item of detalle) {
      const itemSubtotal = item.cantidad * item.precio_unitario;
      const itemDescuentoMonto = itemSubtotal * (item.descuento_porcentaje || 0) / 100;
      const itemTotal = itemSubtotal - itemDescuentoMonto;

      // Insertar detalle de venta
      await runQuery(`
        INSERT INTO ventas_detalle (
          venta_id, producto_id, descripcion, cantidad,
          precio_unitario, descuento_porcentaje, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        ventaId, item.producto_id, item.descripcion,
        item.cantidad, item.precio_unitario,
        item.descuento_porcentaje || 0, itemTotal
      ]);

      // Obtener stock actual
      const producto = await getOne(
        'SELECT stock_actual FROM productos WHERE id = ?',
        [item.producto_id]
      );
      const stockAnterior = producto.stock_actual;
      const stockNuevo = stockAnterior - item.cantidad;

      // Actualizar stock del producto
      await runQuery(
        'UPDATE productos SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [stockNuevo, item.producto_id]
      );

      // Registrar movimiento de stock
      await runQuery(`
        INSERT INTO movimientos_stock (
          producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo,
          motivo, venta_id, usuario_id, fecha
        ) VALUES (?, 'salida', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        item.producto_id, item.cantidad, stockAnterior, stockNuevo,
        `Venta ${numero_comprobante}`, ventaId, usuario_id
      ]);
    }

    // Si la venta proviene de un presupuesto, marcarlo como convertido
    if (presupuesto_id) {
      await runQuery(
        `UPDATE presupuestos SET estado = 'convertido', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [presupuesto_id]
      );
    }


    // Procesar pagos
    const pagosList = pagos && pagos.length > 0 ? pagos : [{ forma_pago: forma_pago, monto: total }];

    for (const pago of pagosList) {
      // Insertar detalle del pago
      await runQuery(`
        INSERT INTO ventas_pagos (venta_id, forma_pago, monto, observaciones)
        VALUES (?, ?, ?, ?)
      `, [ventaId, pago.forma_pago, pago.monto, pago.observaciones || null]);

      // Si es cuenta corriente, registrar movimiento
      if (pago.forma_pago === 'cuenta_corriente') {
        const cliente = await getOne(
          'SELECT saldo_cuenta_corriente, limite_credito, razon_social FROM clientes WHERE id = ?',
          [cliente_id]
        );

        const saldoAnterior = cliente.saldo_cuenta_corriente;
        const saldoNuevo = saldoAnterior + parseFloat(pago.monto);

        // Registrar movimiento de débito (deuda)
        await runQuery(`
          INSERT INTO cuenta_corriente (
            cliente_id, tipo_movimiento, monto, saldo_anterior, saldo_nuevo,
            concepto, venta_id, fecha, usuario_id
          ) VALUES (?, 'debito', ?, ?, ?, ?, ?, ?, ?)
        `, [
          cliente_id, pago.monto, saldoAnterior, saldoNuevo,
          `Venta ${numero_comprobante}`, ventaId, fecha, usuario_id
        ]);

        // Actualizar saldo del cliente
        await runQuery(
          'UPDATE clientes SET saldo_cuenta_corriente = ? WHERE id = ?',
          [saldoNuevo, cliente_id]
        );
      }

      // Si es efectivo, registrar en caja abierta
      if (pago.forma_pago === 'efectivo') {
        // Buscar caja abierta del usuario
        const cajaAbierta = await getOne(
          'SELECT id FROM cajas WHERE usuario_apertura_id = ? AND estado = ? ORDER BY fecha_apertura DESC LIMIT 1',
          [usuario_id, 'abierta']
        );

        if (cajaAbierta) {
          // Registrar movimiento de ingreso en caja
          await runQuery(`
            INSERT INTO movimientos_caja (
              caja_id, tipo_movimiento, categoria, monto, concepto,
              venta_id, numero_comprobante, usuario_id
            ) VALUES (?, 'ingreso', 'venta', ?, ?, ?, ?, ?)
          `, [
            cajaAbierta.id, pago.monto,
            `Venta ${numero_comprobante}`, ventaId, numero_comprobante, usuario_id
          ]);

          // Actualizar totales de la caja
          await runQuery(`
            UPDATE cajas SET 
              total_ingresos = total_ingresos + ?
            WHERE id = ?
          `, [pago.monto, cajaAbierta.id]);

          console.log(`✓ Registrado en caja: Ingreso de $${pago.monto} por venta ${numero_comprobante}`);
        } else {
          console.warn(`⚠️ No hay caja abierta para registrar venta ${numero_comprobante}`);
        }
      }
    }


    res.status(201).json({
      message: 'Venta creada exitosamente',
      ventaId,
      numero_comprobante
    });
  } catch (error) {
    console.error('Error en createVenta:', error);
    res.status(500).json({ error: 'Error al crear venta' });
  }
};

// Anular venta
export const anularVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id } = req.body;

    const venta = await getOne(
      'SELECT id, estado, numero_comprobante, cliente_id, total, forma_pago FROM ventas WHERE id = ?',
      [id]
    );

    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    if (venta.estado === 'anulada') {
      return res.status(400).json({ error: 'La venta ya está anulada' });
    }

    // Obtener detalle para devolver stock
    const detalle = await getAll(
      'SELECT producto_id, cantidad FROM ventas_detalle WHERE venta_id = ?',
      [id]
    );

    // Devolver stock
    for (const item of detalle) {
      const producto = await getOne(
        'SELECT stock_actual FROM productos WHERE id = ?',
        [item.producto_id]
      );
      const stockAnterior = producto.stock_actual;
      const stockNuevo = stockAnterior + item.cantidad;

      await runQuery(
        'UPDATE productos SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [stockNuevo, item.producto_id]
      );

      // Registrar movimiento de stock
      await runQuery(`
        INSERT INTO movimientos_stock (
          producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo,
          motivo, venta_id, usuario_id, fecha
        ) VALUES (?, 'entrada', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        item.producto_id, item.cantidad, stockAnterior, stockNuevo,
        `Anulación venta ${venta.numero_comprobante}`, id, usuario_id
      ]);
    }

    // Si la venta fue con cuenta corriente (forma de pago única), revertir
    /*if (venta.forma_pago === 'cuenta_corriente') {
      const cliente = await getOne(
        'SELECT id, razon_social, saldo_cuenta_corriente FROM clientes WHERE id = ?',
        [venta.cliente_id]
      );

      const saldoAnterior = cliente.saldo_cuenta_corriente;
      const saldoNuevo = saldoAnterior - venta.total;

      // Registrar movimiento de crédito (reversión)
      await runQuery(`
        INSERT INTO cuenta_corriente (
          cliente_id, tipo_movimiento, monto, saldo_anterior, saldo_nuevo,
          concepto, venta_id, fecha, usuario_id
        ) VALUES (?, 'credito', ?, ?, ?, ?, ?, CURRENT_DATE, ?)
      `, [
        venta.cliente_id, venta.total, saldoAnterior, saldoNuevo,
        `Anulación venta ${venta.numero_comprobante}`, id, usuario_id
      ]);

      // Actualizar saldo del cliente
      await runQuery(
        'UPDATE clientes SET saldo_cuenta_corriente = ? WHERE id = ?',
        [saldoNuevo, venta.cliente_id]
      );
    }*/

    // Revertir pagos en cuenta corriente
    const pagosCC = await getAll(
      'SELECT * FROM ventas_pagos WHERE venta_id = ? AND forma_pago = ?',
      [id, 'cuenta_corriente']
    );

    for (const pago of pagosCC) {
      const cliente = await getOne(
        'SELECT id, razon_social, saldo_cuenta_corriente FROM clientes WHERE id = ?',
        [venta.cliente_id]
      );

      const saldoAnterior = cliente.saldo_cuenta_corriente;
      const saldoNuevo = saldoAnterior - parseFloat(pago.monto);

      // Registrar movimiento de crédito (reversión)
      await runQuery(`
        INSERT INTO cuenta_corriente (
          cliente_id, tipo_movimiento, monto, saldo_anterior, saldo_nuevo,
          concepto, venta_id, fecha, usuario_id
        ) VALUES (?, 'credito', ?, ?, ?, ?, ?, CURRENT_DATE, ?)
      `, [
        venta.cliente_id, pago.monto, saldoAnterior, saldoNuevo,
        `Anulación venta ${venta.numero_comprobante}`, id, usuario_id
      ]);

      // Actualizar saldo del cliente
      await runQuery(
        'UPDATE clientes SET saldo_cuenta_corriente = ? WHERE id = ?',
        [saldoNuevo, venta.cliente_id]
      );
    }


    // Revertir pagos en efectivo de la caja
    const pagosEfectivo = await getAll(
      'SELECT * FROM ventas_pagos WHERE venta_id = ? AND forma_pago = ?',
      [id, 'efectivo']
    );

    for (const pago of pagosEfectivo) {
      // Buscar el movimiento de caja relacionado
      const movimientoCaja = await getOne(
        'SELECT caja_id, monto FROM movimientos_caja WHERE venta_id = ? AND tipo_movimiento = ?',
        [id, 'ingreso']
      );

      if (movimientoCaja) {
        // Verificar que la caja esté abierta
        const caja = await getOne(
          'SELECT estado FROM cajas WHERE id = ?',
          [movimientoCaja.caja_id]
        );

        if (caja && caja.estado === 'abierta') {
          // Registrar movimiento de egreso (reversión)
          await runQuery(`
            INSERT INTO movimientos_caja (
              caja_id, tipo_movimiento, categoria, monto, concepto,
              venta_id, usuario_id
            ) VALUES (?, 'egreso', 'devolucion', ?, ?, ?, ?)
          `, [
            movimientoCaja.caja_id, pago.monto,
            `Anulación venta ${venta.numero_comprobante}`, id, usuario_id
          ]);

          // Actualizar totales de la caja
          await runQuery(`
            UPDATE cajas SET 
              total_egresos = total_egresos + ?
            WHERE id = ?
          `, [pago.monto, movimientoCaja.caja_id]);

          console.log(`✓ Revertido en caja: Egreso de $${pago.monto} por anulación de venta`);
        } else {
          console.warn(`⚠️ La caja está cerrada, no se puede revertir automáticamente el movimiento de $${pago.monto}`);
        }
      }
    }

    // Marcar venta como anulada
    await runQuery(
      'UPDATE ventas SET estado = \'anulada\', updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    const tienePagosCC = pagosCC.length > 0;
    const tienePagosEfectivo = pagosEfectivo.length > 0;

    let mensaje = 'Venta anulada exitosamente. Stock revertido';
    if (tienePagosCC) mensaje += ', crédito restaurado';
    if (tienePagosEfectivo) mensaje += ', movimiento en caja registrado';
    mensaje += '.';

    res.json({ message: mensaje });
  } catch (error) {
    console.error('Error en anularVenta:', error);
    res.status(500).json({ error: 'Error al anular venta' });
  }
};