import { getAll, getOne, runQuery } from '../db/database.js';

// Obtener todas las cajas
export const getCajas = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, estado, usuario_id, sucursal_id } = req.query;
    const user = req.user;

    let sql = `
      SELECT c.*,
             ua.nombre || ' ' || ua.apellido as usuario_apertura_nombre,
             uc.nombre || ' ' || uc.apellido as usuario_cierre_nombre,
             s.nombre as sucursal_nombre
      FROM cajas c
      LEFT JOIN usuarios ua ON c.usuario_apertura_id = ua.id
      LEFT JOIN usuarios uc ON c.usuario_cierre_id = uc.id
      LEFT JOIN sucursales s ON c.sucursal_id = s.id
      WHERE 1=1
    `;
    const params = [];

    // FILTRO CRÍTICO: Control por sucursal
    if (user.rol !== 'admin' || user.sucursal_id) {
      // No-admin: SOLO puede ver cajas de su sucursal
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

    if (fecha_desde) {
      sql += ` AND DATE(c.fecha_apertura) >= ?`;
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      sql += ` AND DATE(c.fecha_apertura) <= ?`;
      params.push(fecha_hasta);
    }
    if (estado) {
      sql += ` AND c.estado = ?`;
      params.push(estado);
    }
    if (usuario_id) {
      sql += ` AND c.usuario_apertura_id = ?`;
      params.push(usuario_id);
    }

    sql += ` ORDER BY c.fecha_apertura DESC`;

    const cajas = await getAll(sql, params);
    res.json({ cajas });
  } catch (error) {
    console.error('Error en getCajas:', error);
    res.status(500).json({ error: 'Error al obtener cajas' });
  }
};

// Obtener caja por ID
export const getCajaById = async (req, res) => {
  try {
    const { id } = req.params;

    const caja = await getOne(`
      SELECT c.*,
             ua.nombre || ' ' || ua.apellido as usuario_apertura_nombre,
             uc.nombre || ' ' || uc.apellido as usuario_cierre_nombre,
             s.nombre as sucursal_nombre
      FROM cajas c
      LEFT JOIN usuarios ua ON c.usuario_apertura_id = ua.id
      LEFT JOIN usuarios uc ON c.usuario_cierre_id = uc.id
      LEFT JOIN sucursales s ON c.sucursal_id = s.id
      WHERE c.id = ?
    `, [id]);

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    // Obtener movimientos
    const movimientos = await getAll(`
      SELECT m.*,
             u.nombre || ' ' || u.apellido as usuario_nombre
      FROM movimientos_caja m
      LEFT JOIN usuarios u ON m.usuario_id = u.id
      WHERE m.caja_id = ?
      ORDER BY m.fecha DESC
    `, [id]);

    res.json({ 
      caja: { 
        ...caja, 
        movimientos 
      } 
    });
  } catch (error) {
    console.error('Error en getCajaById:', error);
    res.status(500).json({ error: 'Error al obtener caja' });
  }
};

// Obtener caja abierta actual
export const getCajaAbierta = async (req, res) => {
  try {
    const { usuario_id } = req.query;
    const user = req.user;

    let sql = `
      SELECT c.*,
             ua.nombre || ' ' || ua.apellido as usuario_apertura_nombre,
             s.nombre as sucursal_nombre
      FROM cajas c
      LEFT JOIN usuarios ua ON c.usuario_apertura_id = ua.id
      LEFT JOIN sucursales s ON c.sucursal_id = s.id
      WHERE c.estado = 'abierta'
    `;
    const params = [];

    // FILTRO: Solo puede ver caja abierta de su sucursal
    if (user.sucursal_id) {
      sql += ` AND c.sucursal_id = ?`;
      params.push(user.sucursal_id);
    }

    if (usuario_id) {
      sql += ` AND c.usuario_apertura_id = ?`;
      params.push(usuario_id);
    }

    sql += ` ORDER BY c.fecha_apertura DESC LIMIT 1`;

    const caja = await getOne(sql, params);
    
    if (caja) {
      // Obtener movimientos
      const movimientos = await getAll(`
        SELECT m.*,
               u.nombre || ' ' || u.apellido as usuario_nombre
        FROM movimientos_caja m
        LEFT JOIN usuarios u ON m.usuario_id = u.id
        WHERE m.caja_id = ?
        ORDER BY m.fecha DESC
      `, [caja.id]);

      res.json({ caja: { ...caja, movimientos } });
    } else {
      res.json({ caja: null });
    }
  } catch (error) {
    console.error('Error en getCajaAbierta:', error);
    res.status(500).json({ error: 'Error al obtener caja abierta' });
  }
};

// Abrir caja
export const abrirCaja = async (req, res) => {
  try {
    const { monto_inicial, observaciones, usuario_id } = req.body;
    const user = req.user;

    // VALIDACIÓN CRÍTICA: Usuario debe tener sucursal
    if (!user.sucursal_id) {
      return res.status(400).json({
        error: 'No puedes abrir caja sin tener una sucursal asignada. Contacte al administrador.'
      });
    }

    if (!monto_inicial || monto_inicial < 0) {
      return res.status(400).json({ error: 'Monto inicial inválido' });
    }

    // Verificar que no haya otra caja abierta del mismo usuario en la misma sucursal
    const cajaAbierta = await getOne(
      'SELECT id FROM cajas WHERE usuario_apertura_id = ? AND sucursal_id = ? AND estado = ?',
      [usuario_id, user.sucursal_id, 'abierta']
    );

    if (cajaAbierta) {
      return res.status(400).json({ 
        error: 'Ya tienes una caja abierta. Ciérrala antes de abrir una nueva.' 
      });
    }

    // Obtener el último número de caja
    const ultimaCaja = await getOne(
      'SELECT numero FROM cajas ORDER BY numero DESC LIMIT 1'
    );
    const numeroNuevo = ultimaCaja ? ultimaCaja.numero + 1 : 1;

    // CREAR NUEVA CAJA CON SUCURSAL_ID
    const result = await runQuery(`
      INSERT INTO cajas (
        numero, fecha_apertura, usuario_apertura_id, sucursal_id, monto_inicial,
        estado, observaciones_apertura
      ) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, 'abierta', ?)
    `, [numeroNuevo, usuario_id, user.sucursal_id, monto_inicial, observaciones]);

    res.status(201).json({
      message: 'Caja abierta exitosamente',
      cajaId: result.id,
      numero: numeroNuevo
    });
  } catch (error) {
    console.error('Error en abrirCaja:', error);
    res.status(500).json({ error: 'Error al abrir caja' });
  }
};

// Cerrar caja
export const cerrarCaja = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto_final, observaciones, usuario_id } = req.body;

    if (monto_final === undefined || monto_final < 0) {
      return res.status(400).json({ error: 'Monto final inválido' });
    }

    const caja = await getOne('SELECT * FROM cajas WHERE id = ?', [id]);

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    if (caja.estado === 'cerrada') {
      return res.status(400).json({ error: 'La caja ya está cerrada' });
    }

    // Calcular totales
    const totales = await getOne(`
      SELECT 
        COALESCE(SUM(CASE WHEN tipo_movimiento = 'ingreso' THEN monto ELSE 0 END), 0) as total_ingresos,
        COALESCE(SUM(CASE WHEN tipo_movimiento = 'egreso' THEN monto ELSE 0 END), 0) as total_egresos
      FROM movimientos_caja
      WHERE caja_id = ?
    `, [id]);

    const montoEsperado = parseFloat(caja.monto_inicial) + 
                          parseFloat(totales.total_ingresos) - 
                          parseFloat(totales.total_egresos);
    const diferencia = parseFloat(monto_final) - montoEsperado;

    // Cerrar caja
    await runQuery(`
      UPDATE cajas SET
        fecha_cierre = CURRENT_TIMESTAMP,
        usuario_cierre_id = ?,
        monto_final = ?,
        total_ingresos = ?,
        total_egresos = ?,
        monto_esperado = ?,
        diferencia = ?,
        estado = 'cerrada',
        observaciones_cierre = ?
      WHERE id = ?
    `, [
      usuario_id, monto_final, totales.total_ingresos, totales.total_egresos,
      montoEsperado, diferencia, observaciones, id
    ]);

    res.json({
      message: 'Caja cerrada exitosamente',
      monto_esperado: montoEsperado,
      monto_final: monto_final,
      diferencia: diferencia
    });
  } catch (error) {
    console.error('Error en cerrarCaja:', error);
    res.status(500).json({ error: 'Error al cerrar caja' });
  }
};

// Registrar movimiento de caja
export const registrarMovimiento = async (req, res) => {
  try {
    const {
      caja_id,
      tipo_movimiento,
      categoria,
      monto,
      concepto,
      numero_comprobante,
      observaciones,
      usuario_id
    } = req.body;

    // Validaciones
    if (!caja_id || !tipo_movimiento || !monto || !concepto) {
      return res.status(400).json({
        error: 'Caja, tipo de movimiento, monto y concepto son obligatorios'
      });
    }

    if (!['ingreso', 'egreso'].includes(tipo_movimiento)) {
      return res.status(400).json({ error: 'Tipo de movimiento inválido' });
    }

    if (parseFloat(monto) <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    }

    // Verificar que la caja existe y está abierta
    const caja = await getOne('SELECT id, estado FROM cajas WHERE id = ?', [caja_id]);

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    if (caja.estado !== 'abierta') {
      return res.status(400).json({ error: 'La caja está cerrada' });
    }

    // Registrar movimiento
    await runQuery(`
      INSERT INTO movimientos_caja (
        caja_id, tipo_movimiento, categoria, monto, concepto,
        numero_comprobante, observaciones, usuario_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      caja_id, tipo_movimiento, categoria, monto, concepto,
      numero_comprobante, observaciones, usuario_id
    ]);

    res.status(201).json({ message: 'Movimiento registrado exitosamente' });
  } catch (error) {
    console.error('Error en registrarMovimiento:', error);
    res.status(500).json({ error: 'Error al registrar movimiento' });
  }
};

// Obtener resumen de caja actual
export const getResumenCaja = async (req, res) => {
  try {
    const { caja_id } = req.params;

    const caja = await getOne('SELECT * FROM cajas WHERE id = ?', [caja_id]);

    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    const totales = await getOne(`
      SELECT 
        COALESCE(SUM(CASE WHEN tipo_movimiento = 'ingreso' THEN monto ELSE 0 END), 0) as total_ingresos,
        COALESCE(SUM(CASE WHEN tipo_movimiento = 'egreso' THEN monto ELSE 0 END), 0) as total_egresos,
        COUNT(CASE WHEN tipo_movimiento = 'ingreso' THEN 1 END) as cantidad_ingresos,
        COUNT(CASE WHEN tipo_movimiento = 'egreso' THEN 1 END) as cantidad_egresos
      FROM movimientos_caja
      WHERE caja_id = ?
    `, [caja_id]);

    const montoActual = parseFloat(caja.monto_inicial) + 
                        parseFloat(totales.total_ingresos) - 
                        parseFloat(totales.total_egresos);

    res.json({
      caja_id: caja.id,
      numero: caja.numero,
      estado: caja.estado,
      monto_inicial: caja.monto_inicial,
      total_ingresos: totales.total_ingresos,
      total_egresos: totales.total_egresos,
      cantidad_ingresos: totales.cantidad_ingresos,
      cantidad_egresos: totales.cantidad_egresos,
      monto_actual: montoActual
    });
  } catch (error) {
    console.error('Error en getResumenCaja:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};