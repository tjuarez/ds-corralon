import { getAll, getOne, runQuery } from '../db/database.js';
import { getEmpresaId } from '../utils/tenantHelper.js';

// Obtener clientes con cuenta corriente
export const getClientesConCC = async (req, res) => {
  try {
    const { search, con_saldo } = req.query;
    const empresaId = getEmpresaId(req);

    let sql = `
      SELECT c.*,
             (SELECT COUNT(*) FROM cuenta_corriente cc WHERE cc.empresa_id = c.empresa_id AND cc.cliente_id = c.id) as cantidad_movimientos
      FROM clientes c
      WHERE c.empresa_id = ?
      AND c.activo = 1
    `;
    const params = [empresaId];

    // Búsqueda por razón social o CUIT
    if (search) {
      sql += ` AND (c.razon_social LIKE ? OR c.cuit_dni LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    // Filtrar solo clientes con saldo
    if (con_saldo === 'true') {
      sql += ` AND c.saldo_cuenta_corriente > 0`;
    }

    sql += ` ORDER BY c.razon_social ASC`;

    const clientes = await getAll(sql, params);
    res.json({ clientes });
  } catch (error) {
    console.error('Error en getClientesConCC:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

// Obtener estado de cuenta de un cliente
export const getEstadoCuenta = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { fecha_desde, fecha_hasta } = req.query;
    const empresaId = getEmpresaId(req);

    // Obtener información del cliente
    const cliente = await getOne(`
      SELECT c.*,
             (SELECT SUM(cc1.monto) FROM cuenta_corriente cc1 WHERE c.empresa_id = cc1.empresa_id AND cc1.cliente_id = c.id AND cc1.tipo_movimiento = 'debito') as total_debitos,
             (SELECT SUM(cc2.monto) FROM cuenta_corriente cc2 WHERE c.empresa_id = cc2.empresa_id AND cc2.cliente_id = c.id AND cc2.tipo_movimiento = 'credito') as total_creditos
      FROM clientes c
      WHERE c.empresa_id = ?
      AND c.id = ?
    `, [empresaId, clienteId]);

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Obtener movimientos
    let sql = `
      SELECT cc.*,
             u.nombre || ' ' || u.apellido as usuario_nombre
      FROM cuenta_corriente cc
      LEFT JOIN usuarios u ON cc.empresa_id = u.empresa_id AND cc.usuario_id = u.id
      WHERE cc.empresa_id = ?
      AND cc.cliente_id = ?
    `;
    const params = [empresaId, clienteId];

    if (fecha_desde) {
      sql += ` AND cc.fecha >= ?`;
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      sql += ` AND cc.fecha <= ?`;
      params.push(fecha_hasta);
    }

    sql += ` ORDER BY cc.fecha DESC, cc.created_at DESC`;

    const movimientos = await getAll(sql, params);

    res.json({
      cliente,
      movimientos
    });
  } catch (error) {
    console.error('Error en getEstadoCuenta:', error);
    res.status(500).json({ error: 'Error al obtener estado de cuenta' });
  }
};

// Registrar un pago
export const registrarPago = async (req, res) => {
  try {
    const {
      cliente_id,
      monto,
      fecha,
      medio_pago,
      numero_comprobante,
      observaciones,
      usuario_id
    } = req.body;
    const empresaId = getEmpresaId(req);

    // Validaciones
    if (!cliente_id || !monto || !fecha || !medio_pago) {
      return res.status(400).json({
        error: 'Cliente, monto, fecha y medio de pago son obligatorios'
      });
    }

    if (parseFloat(monto) <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    }

    // Obtener cliente
    const cliente = await getOne(
      'SELECT id, razon_social, saldo_cuenta_corriente FROM clientes WHERE empresa_id = ? AND id = ?',
      [empresaId, cliente_id]
    );

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    if (cliente.saldo_cuenta_corriente <= 0) {
      return res.status(400).json({ error: 'El cliente no tiene deuda' });
    }

    const montoAPagar = parseFloat(monto);
    if (montoAPagar > cliente.saldo_cuenta_corriente) {
      return res.status(400).json({
        error: `El monto no puede superar la deuda actual de ${cliente.saldo_cuenta_corriente}`
      });
    }

    // Calcular nuevo saldo
    const saldoAnterior = cliente.saldo_cuenta_corriente;
    const saldoNuevo = saldoAnterior - montoAPagar;

    // Registrar movimiento de crédito (pago)
    await runQuery(`
      INSERT INTO cuenta_corriente (
        cliente_id, tipo_movimiento, monto, saldo_anterior, saldo_nuevo,
        concepto, fecha, medio_pago, numero_comprobante, observaciones, usuario_id, empresa_id
      ) VALUES (?, 'credito', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cliente_id, montoAPagar, saldoAnterior, saldoNuevo,
      'Pago recibido', fecha, medio_pago, numero_comprobante,
      observaciones, usuario_id, empresaId
    ]);

    // Actualizar saldo del cliente
    await runQuery(
      'UPDATE clientes SET saldo_cuenta_corriente = ? WHERE empresa_id = ? AND id = ?',
      [saldoNuevo, empresaId, cliente_id]
    );


    // Si el pago es en efectivo, registrar en caja abierta
    if (medio_pago === 'efectivo') {
      // Buscar caja abierta del usuario
      const cajaAbierta = await getOne(
        'SELECT id FROM cajas WHERE empresa_id = ? AND usuario_apertura_id = ? AND estado = ? ORDER BY fecha_apertura DESC LIMIT 1',
        [empresaId, usuario_id, 'abierta']
      );

      if (cajaAbierta) {
        // Registrar movimiento de ingreso en caja
        await runQuery(`
          INSERT INTO movimientos_caja (
            caja_id, tipo_movimiento, categoria, monto, concepto,
            numero_comprobante, observaciones, usuario_id, empresa_id
          ) VALUES (?, 'ingreso', 'pago_cliente', ?, ?, ?, ?, ?, ?)
        `, [
          cajaAbierta.id, montoAPagar,
          `Pago de ${cliente.razon_social}`,
          numero_comprobante, observaciones, usuario_id, empresaId
        ]);

        // Actualizar totales de la caja
        await runQuery(`
          UPDATE cajas SET 
            total_ingresos = total_ingresos + ?
          WHERE empresa_id = ?
          AND id = ?
        `, [montoAPagar, empresaId, cajaAbierta.id]);

        //console.log(`✓ Registrado en caja: Ingreso de $${montoAPagar} por pago de cliente`);
      } else {
        //console.warn(`⚠️ No hay caja abierta para registrar pago de $${montoAPagar}`);
      }
    }


    res.status(201).json({
      message: 'Pago registrado exitosamente',
      saldo_anterior: saldoAnterior,
      saldo_nuevo: saldoNuevo
    });
  } catch (error) {
    console.error('Error en registrarPago:', error);
    res.status(500).json({ error: 'Error al registrar pago' });
  }
};

// Obtener resumen general de cuenta corriente
export const getResumenGeneral = async (req, res) => {
  try {
    const empresaId = getEmpresaId(req);
    const stats = await getOne(`
      SELECT
        COUNT(DISTINCT c.id) as total_clientes_con_cc,
        COUNT(DISTINCT CASE WHEN c.saldo_cuenta_corriente > 0 THEN c.id END) as clientes_con_deuda,
        COALESCE(SUM(c.saldo_cuenta_corriente), 0) as deuda_total,
        COALESCE(SUM(CASE WHEN c.saldo_cuenta_corriente > c.limite_credito THEN c.saldo_cuenta_corriente - c.limite_credito ELSE 0 END), 0) as deuda_sobre_limite
      FROM clientes c
      WHERE c.empresa_id = ?
      AND c.activo = 1
    `, [empresaId]);

    // Top 5 clientes con mayor deuda
    const topDeudores = await getAll(`
      SELECT c.id, c.razon_social, c.saldo_cuenta_corriente, c.limite_credito
      FROM clientes c
      WHERE c.empresa_id = ?
      AND c.activo = 1 
      AND c.saldo_cuenta_corriente > 0
      ORDER BY c.saldo_cuenta_corriente DESC
      LIMIT 5
    `, [empresaId]);

    // Movimientos recientes
    const movimientosRecientes = await getAll(`
      SELECT cc.*,
             c.razon_social as cliente_nombre,
             u.nombre || ' ' || u.apellido as usuario_nombre
      FROM cuenta_corriente cc
      LEFT JOIN clientes c ON cc.empresa_id = c.empresa_id AND cc.cliente_id = c.id
      LEFT JOIN usuarios u ON cc.empresa_id = u.empresa_id AND cc.usuario_id = u.id
      WHERE cc.empresa_id = ?
      ORDER BY cc.created_at DESC
      LIMIT 10
    `, [empresaId]);

    res.json({
      stats,
      topDeudores,
      movimientosRecientes
    });
  } catch (error) {
    console.error('Error en getResumenGeneral:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};