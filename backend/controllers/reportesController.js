import { getAll, getOne } from '../db/database.js';

// Dashboard principal - Métricas generales
export const getDashboard = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // Ventas del día
    const ventasHoy = await getOne(`
      SELECT 
        COUNT(*) as cantidad,
        COALESCE(SUM(total), 0) as total
      FROM ventas
      WHERE DATE(fecha) = ? AND estado != 'anulada'
    `, [hoy]);

    // Ventas del mes
    const ventasMes = await getOne(`
      SELECT 
        COUNT(*) as cantidad,
        COALESCE(SUM(total), 0) as total
      FROM ventas
      WHERE DATE(fecha) >= ? AND estado != 'anulada'
    `, [inicioMes]);

    // Stock crítico (productos bajo stock mínimo)
    const stockCritico = await getOne(`
      SELECT COUNT(*) as cantidad
      FROM productos
      WHERE stock_actual <= stock_minimo AND activo = 1
    `);

    // Cuenta corriente - Deuda total
    const cuentaCorriente = await getOne(`
      SELECT 
        COUNT(*) as clientes_con_deuda,
        COALESCE(SUM(saldo_cuenta_corriente), 0) as deuda_total
      FROM clientes
      WHERE saldo_cuenta_corriente > 0 AND activo = 1
    `);

    // Caja abierta
    const cajaAbierta = await getOne(`
      SELECT 
        COUNT(*) as cantidad,
        COALESCE(SUM(monto_inicial + total_ingresos - total_egresos), 0) as monto_total
      FROM cajas
      WHERE estado = 'abierta'
    `);

    // Presupuestos pendientes
    const presupuestosPendientes = await getOne(`
      SELECT 
        COUNT(*) as cantidad,
        COALESCE(SUM(total), 0) as total
      FROM presupuestos
      WHERE estado = 'pendiente'
    `);

    // Top 5 productos más vendidos del mes
    const topProductos = await getAll(`
      SELECT 
        p.id,
        p.codigo,
        p.descripcion,
        SUM(vd.cantidad) as cantidad_vendida,
        SUM(vd.subtotal) as total_vendido
      FROM ventas_detalle vd
      JOIN ventas v ON vd.venta_id = v.id
      JOIN productos p ON vd.producto_id = p.id
      WHERE DATE(v.fecha) >= ? AND v.estado != 'anulada'
      GROUP BY p.id, p.codigo, p.descripcion
      ORDER BY cantidad_vendida DESC
      LIMIT 5
    `, [inicioMes]);

    // Top 5 clientes del mes
    const topClientes = await getAll(`
      SELECT 
        c.id,
        c.razon_social,
        COUNT(v.id) as cantidad_compras,
        SUM(v.total) as total_comprado
      FROM ventas v
      JOIN clientes c ON v.cliente_id = c.id
      WHERE DATE(v.fecha) >= ? AND v.estado != 'anulada'
      GROUP BY c.id, c.razon_social
      ORDER BY total_comprado DESC
      LIMIT 5
    `, [inicioMes]);

    // Ventas por día (últimos 7 días)
    const ventasUltimos7Dias = await getAll(`
      SELECT 
        DATE(fecha) as fecha,
        COUNT(*) as cantidad,
        SUM(total) as total
      FROM ventas
      WHERE DATE(fecha) >= DATE('now', '-7 days') AND estado != 'anulada'
      GROUP BY DATE(fecha)
      ORDER BY fecha ASC
    `);

    res.json({
      ventasHoy,
      ventasMes,
      stockCritico,
      cuentaCorriente,
      cajaAbierta,
      presupuestosPendientes,
      topProductos,
      topClientes,
      ventasUltimos7Dias
    });
  } catch (error) {
    console.error('Error en getDashboard:', error);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
};

// Reporte de ventas por período
export const getReporteVentas = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, agrupar_por } = req.query;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({ error: 'Fecha desde y hasta son requeridas' });
    }

    const agrupar = agrupar_por || 'dia'; // dia, mes, año

    let formatoFecha;
    switch (agrupar) {
      case 'mes':
        formatoFecha = '%Y-%m';
        break;
      case 'año':
        formatoFecha = '%Y';
        break;
      default:
        formatoFecha = '%Y-%m-%d';
    }

    const ventas = await getAll(`
      SELECT 
        strftime('${formatoFecha}', fecha) as periodo,
        COUNT(*) as cantidad,
        SUM(subtotal) as subtotal,
        SUM(descuento_monto) as descuentos,
        SUM(total) as total
      FROM ventas
      WHERE DATE(fecha) BETWEEN ? AND ? AND estado != 'anulada'
      GROUP BY periodo
      ORDER BY periodo ASC
    `, [fecha_desde, fecha_hasta]);

    // Resumen general
    const resumen = await getOne(`
      SELECT 
        COUNT(*) as total_ventas,
        COALESCE(SUM(subtotal), 0) as subtotal_total,
        COALESCE(SUM(descuento_monto), 0) as descuentos_total,
        COALESCE(SUM(total), 0) as total_general,
        COALESCE(AVG(total), 0) as ticket_promedio
      FROM ventas
      WHERE DATE(fecha) BETWEEN ? AND ? AND estado != 'anulada'
    `, [fecha_desde, fecha_hasta]);

    // Asegurar que los valores sean números válidos
    const resumenFinal = {
      total_ventas: parseInt(resumen.total_ventas) || 0,
      subtotal_total: parseFloat(resumen.subtotal_total) || 0,
      descuentos_total: parseFloat(resumen.descuentos_total) || 0,
      total_general: parseFloat(resumen.total_general) || 0,
      ticket_promedio: parseFloat(resumen.ticket_promedio) || 0,
    };

    // Ventas por forma de pago
    const porFormaPago = await getAll(`
      SELECT 
        forma_pago,
        COUNT(*) as cantidad,
        SUM(total) as total
      FROM ventas
      WHERE DATE(fecha) BETWEEN ? AND ? AND estado != 'anulada'
      GROUP BY forma_pago
      ORDER BY total DESC
    `, [fecha_desde, fecha_hasta]);

    res.json({
      ventas,
      resumen: resumenFinal,
      porFormaPago
    });
  } catch (error) {
    console.error('Error en getReporteVentas:', error);
    res.status(500).json({ error: 'Error al obtener reporte de ventas' });
  }
};

// Reporte de productos más vendidos
export const getReporteProductos = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, limite } = req.query;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({ error: 'Fecha desde y hasta son requeridas' });
    }

    const limit = parseInt(limite) || 20;

    const productos = await getAll(`
      SELECT 
        p.id,
        p.codigo,
        p.descripcion,
        p.stock_actual,
        p.stock_minimo,
        c.nombre as categoria,
        SUM(vd.cantidad) as cantidad_vendida,
        SUM(vd.subtotal) as total_vendido,
        COUNT(DISTINCT v.id) as numero_ventas
      FROM ventas_detalle vd
      JOIN ventas v ON vd.venta_id = v.id
      JOIN productos p ON vd.producto_id = p.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE DATE(v.fecha) BETWEEN ? AND ? AND v.estado != 'anulada'
      GROUP BY p.id, p.codigo, p.descripcion, p.stock_actual, p.stock_minimo, c.nombre
      ORDER BY cantidad_vendida DESC
      LIMIT ?
    `, [fecha_desde, fecha_hasta, limit]);

    res.json({ productos });
  } catch (error) {
    console.error('Error en getReporteProductos:', error);
    res.status(500).json({ error: 'Error al obtener reporte de productos' });
  }
};

// Reporte de clientes
export const getReporteClientes = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, limite } = req.query;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({ error: 'Fecha desde y hasta son requeridas' });
    }

    const limit = parseInt(limite) || 20;

    const clientes = await getAll(`
      SELECT 
        c.id,
        c.razon_social,
        c.tipo_cliente,
        c.saldo_cuenta_corriente,
        c.limite_credito,
        COUNT(v.id) as cantidad_compras,
        SUM(v.total) as total_comprado,
        MAX(v.fecha) as ultima_compra
      FROM clientes c
      LEFT JOIN ventas v ON c.id = v.cliente_id 
        AND DATE(v.fecha) BETWEEN ? AND ? 
        AND v.estado != 'anulada'
      WHERE c.activo = 1
      GROUP BY c.id, c.razon_social, c.tipo_cliente, c.saldo_cuenta_corriente, c.limite_credito
      ORDER BY total_comprado DESC
      LIMIT ?
    `, [fecha_desde, fecha_hasta, limit]);

    res.json({ clientes });
  } catch (error) {
    console.error('Error en getReporteClientes:', error);
    res.status(500).json({ error: 'Error al obtener reporte de clientes' });
  }
};

// Reporte de stock por sucursal
export const getReporteStock = async (req, res) => {
  try {
    const { tipo, sucursal_id } = req.query;
    const user = req.user;

    // Determinar qué sucursal(es) consultar
    let sucursalFiltro = null;
    if (user.rol === 'admin') {
      // Admin puede ver todas las sucursales o una específica
      sucursalFiltro = sucursal_id || user.sucursal_id;
    } else {
      // Otros roles solo ven su sucursal
      sucursalFiltro = user.sucursal_id;
    }

    // Query base con stock por sucursal
    let sql = `
      SELECT 
        p.id,
        p.codigo,
        p.descripcion,
        c.nombre as categoria,
        p.unidad_medida,
        ss.sucursal_id,
        s.nombre as sucursal_nombre,
        ss.stock_actual,
        ss.stock_minimo,
        CASE 
          WHEN ss.stock_actual = 0 THEN 'sin_stock'
          WHEN ss.stock_actual <= ss.stock_minimo THEN 'critico'
          ELSE 'normal'
        END as estado_stock
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN stock_sucursales ss ON p.id = ss.producto_id
      INNER JOIN sucursales s ON ss.sucursal_id = s.id
      WHERE p.activo = 1 AND s.activa = 1
    `;

    const params = [];

    // Filtrar por sucursal si es necesario
    if (sucursalFiltro) {
      sql += ` AND ss.sucursal_id = ?`;
      params.push(sucursalFiltro);
    }

    // Filtrar por tipo de stock
    if (tipo === 'critico') {
      sql += ` AND ss.stock_actual <= ss.stock_minimo AND ss.stock_actual > 0`;
    } else if (tipo === 'sin_stock') {
      sql += ` AND ss.stock_actual = 0`;
    } else if (tipo === 'normal') {
      sql += ` AND ss.stock_actual > ss.stock_minimo`;
    }

    sql += ` ORDER BY p.codigo ASC, s.nombre ASC`;

    const productos = await getAll(sql, params);

    // Resumen general
    let resumenSql = `
      SELECT 
        COUNT(DISTINCT p.id) as total_productos,
        SUM(CASE WHEN ss.stock_actual = 0 THEN 1 ELSE 0 END) as sin_stock,
        SUM(CASE WHEN ss.stock_actual <= ss.stock_minimo AND ss.stock_actual > 0 THEN 1 ELSE 0 END) as stock_critico,
        SUM(CASE WHEN ss.stock_actual > ss.stock_minimo THEN 1 ELSE 0 END) as stock_normal
      FROM productos p
      INNER JOIN stock_sucursales ss ON p.id = ss.producto_id
      INNER JOIN sucursales s ON ss.sucursal_id = s.id
      WHERE p.activo = 1 AND s.activa = 1
    `;

    const resumenParams = [];
    if (sucursalFiltro) {
      resumenSql += ` AND ss.sucursal_id = ?`;
      resumenParams.push(sucursalFiltro);
    }

    const resumen = await getOne(resumenSql, resumenParams);

    // Lista de sucursales activas (para el selector)
    const sucursales = await getAll(`
      SELECT id, nombre
      FROM sucursales
      WHERE activa = 1
      ORDER BY nombre ASC
    `);

    res.json({ 
      productos, 
      resumen,
      sucursales,
      sucursal_actual: sucursalFiltro ? { id: sucursalFiltro } : null
    });
  } catch (error) {
    console.error('Error en getReporteStock:', error);
    res.status(500).json({ error: 'Error al obtener reporte de stock' });
  }
};

// Reporte de caja
export const getReporteCaja = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({ error: 'Fecha desde y hasta son requeridas' });
    }

    const cajas = await getAll(`
      SELECT 
        c.*,
        ua.nombre || ' ' || ua.apellido as usuario_apertura,
        uc.nombre || ' ' || uc.apellido as usuario_cierre
      FROM cajas c
      LEFT JOIN usuarios ua ON c.usuario_apertura_id = ua.id
      LEFT JOIN usuarios uc ON c.usuario_cierre_id = uc.id
      WHERE DATE(c.fecha_apertura) BETWEEN ? AND ?
      ORDER BY c.fecha_apertura DESC
    `, [fecha_desde, fecha_hasta]);

    // Resumen
    const resumen = await getOne(`
      SELECT 
        COUNT(*) as total_cajas,
        SUM(CASE WHEN estado = 'abierta' THEN 1 ELSE 0 END) as cajas_abiertas,
        SUM(CASE WHEN estado = 'cerrada' THEN 1 ELSE 0 END) as cajas_cerradas,
        SUM(total_ingresos) as total_ingresos,
        SUM(total_egresos) as total_egresos,
        SUM(CASE WHEN estado = 'cerrada' THEN diferencia ELSE 0 END) as diferencias_total
      FROM cajas
      WHERE DATE(fecha_apertura) BETWEEN ? AND ?
    `, [fecha_desde, fecha_hasta]);

    res.json({ cajas, resumen });
  } catch (error) {
    console.error('Error en getReporteCaja:', error);
    res.status(500).json({ error: 'Error al obtener reporte de caja' });
  }
};

// Reporte de rentabilidad (comparar ventas vs compras)
export const getReporteRentabilidad = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({ error: 'Fecha desde y hasta son requeridas' });
    }

    // Total de ventas
    const ventas = await getOne(`
      SELECT 
        COUNT(*) as cantidad,
        COALESCE(SUM(total), 0) as total
      FROM ventas
      WHERE DATE(fecha) BETWEEN ? AND ? AND estado != 'anulada'
    `, [fecha_desde, fecha_hasta]);

    // Total de compras
    const compras = await getOne(`
      SELECT 
        COUNT(*) as cantidad,
        COALESCE(SUM(total), 0) as total
      FROM compras
      WHERE DATE(fecha) BETWEEN ? AND ? AND estado != 'anulada'
    `, [fecha_desde, fecha_hasta]);

    // Calcular rentabilidad aproximada
    const rentabilidad = parseFloat(ventas.total) - parseFloat(compras.total);
    const margen = ventas.total > 0 ? (rentabilidad / ventas.total) * 100 : 0;

    res.json({
      ventas,
      compras,
      rentabilidad,
      margen: margen.toFixed(2)
    });
  } catch (error) {
    console.error('Error en getReporteRentabilidad:', error);
    res.status(500).json({ error: 'Error al obtener reporte de rentabilidad' });
  }
};