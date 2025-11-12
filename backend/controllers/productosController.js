import { getAll, getOne, runQuery } from '../db/database.js';
import { getEmpresaId } from '../utils/tenantHelper.js';

// Obtener todos los productos (con filtros)
export const getProductos = async (req, res) => {
  try {
    const { search, categoria_id, activo, stock_bajo } = req.query;
    const user = req.user;
    const empresaId = getEmpresaId(req);

    let sql = '';
    let params = [];
    params.push(empresaId);

    // ========== CONSULTA SEGÚN ROL Y SUCURSAL ==========
    // Si NO es admin O si es admin CON sucursal activa → mostrar stock de sucursal
    if (user.rol !== 'admin' || user.sucursal_id) {
      // Verificar que tenga sucursal
      if (!user.sucursal_id) {
        return res.status(400).json({ 
          error: 'Usuario no tiene sucursal asignada' 
        });
      }

      sql = `
        SELECT p.*, 
               c.nombre as categoria_nombre,
               prov.razon_social as proveedor_nombre,
               COALESCE(ss.stock_actual, 0) as stock_actual,
               (SELECT COUNT(*) FROM productos_precios WHERE producto_id = p.id) as precios_count
        FROM productos p
        LEFT JOIN categorias c ON p.empresa_id = c.empresa_id and p.categoria_id = c.id
        LEFT JOIN proveedores prov ON p.empresa_id = prov.empresa_id and p.proveedor_id = prov.id
        LEFT JOIN stock_sucursales ss ON p.empresa_id = ss.empresa_id and p.id = ss.producto_id AND ss.sucursal_id = ?
        WHERE p.empresa_id = ?
      `;
      params.push(user.sucursal_id);
    } else {
      // Admin SIN sucursal activa → Mostrar stock total
      sql = `
        SELECT p.*, 
               c.nombre as categoria_nombre,
               prov.razon_social as proveedor_nombre,
               (SELECT COUNT(*) FROM productos_precios WHERE producto_id = p.id) as precios_count
        FROM productos p
        LEFT JOIN categorias c ON p.empresa_id = c.empresa_id and p.categoria_id = c.id
        LEFT JOIN proveedores prov ON p.empresa_id = prov.empresa_id and p.proveedor_id = prov.id
        WHERE p.empresa_id = ?
      `;
    }

    // Búsqueda por texto
    if (search) {
      sql += ` AND (p.codigo LIKE ? OR p.descripcion LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    // Filtro por categoría
    if (categoria_id) {
      sql += ` AND p.categoria_id = ?`;
      params.push(categoria_id);
    }

    // Filtro por activo
    if (activo !== undefined) {
      sql += ` AND p.activo = ?`;
      params.push(activo === 'true' ? 1 : 0);
    }

    // Filtro por stock bajo
    if (stock_bajo === 'true') {
      if (user.rol !== 'admin' || user.sucursal_id) {
        sql += ` AND COALESCE(ss.stock_actual, 0) <= p.stock_minimo`;
      } else {
        sql += ` AND p.stock_actual <= p.stock_minimo`;
      }
    }

    sql += ` ORDER BY p.descripcion ASC`;

    const productos = await getAll(sql, params);
    res.json({ productos });
  } catch (error) {
    console.error('Error en getProductos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Obtener producto por ID
export const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const empresaId = getEmpresaId(req);

    let sql = '';
    let params = [];

    // ========== CONSULTA SEGÚN ROL Y SUCURSAL ==========
    // Si NO es admin O si es admin CON sucursal activa → mostrar stock de sucursal
    if (user.rol !== 'admin' || user.sucursal_id) {
      if (!user.sucursal_id) {
        return res.status(400).json({ 
          error: 'Usuario no tiene sucursal asignada' 
        });
      }

      sql = `
        SELECT p.*, 
               c.nombre as categoria_nombre,
               prov.razon_social as proveedor_nombre,
               COALESCE(ss.stock_actual, 0) as stock_actual
        FROM productos p
        LEFT JOIN categorias c ON p.empresa_id = c.empresa_id and p.categoria_id = c.id
        LEFT JOIN proveedores prov ON p.empresa_id = prov.empresa_id and p.proveedor_id = prov.id
        LEFT JOIN stock_sucursales ss ON p.empresa_id = ss.empresa_id and p.id = ss.producto_id AND ss.sucursal_id = ?
        WHERE p.empresa_id = ?
        AND p.id = ?
      `;
      params = [user.sucursal_id, empresaId, id];
    } else {
      // Admin SIN sucursal activa → Mostrar stock total
      sql = `
        SELECT p.*, 
               c.nombre as categoria_nombre,
               prov.razon_social as proveedor_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.empresa_id = c.empresa_id and p.categoria_id = c.id
        LEFT JOIN proveedores prov ON p.empresa_id = prov.empresa_id and p.proveedor_id = prov.id
        WHERE p.empresa_id = ?
        AND p.id = ?
      `;
      params = [empresaId, id];
    }

    const producto = await getOne(sql, params);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Obtener precios del producto
    const precios = await getAll(
      `SELECT pp.*, lp.nombre as lista_nombre, m.codigo as moneda_codigo, m.simbolo as moneda_simbolo
       FROM productos_precios pp
       LEFT JOIN listas_precios lp ON pp.empresa_id = lp.empresa_id and pp.lista_precio_id = lp.id
       LEFT JOIN monedas m ON pp.empresa_id = m.empresa_id and pp.moneda_id = m.id
       WHERE pp.empresa_id = ?
       AND pp.producto_id = ? 
       AND (pp.fecha_hasta IS NULL OR pp.fecha_hasta >= date('now'))
       ORDER BY lp.id, m.codigo`,
      [empresaId, id]
    );

    // Si es admin SIN sucursal activa, agregar información de stock por sucursal
    let stockPorSucursal = [];
    if (user.rol === 'admin' && !user.sucursal_id) {
      stockPorSucursal = await getAll(`
        SELECT ss.*, s.nombre as sucursal_nombre, s.codigo as sucursal_codigo
        FROM stock_sucursales ss
        LEFT JOIN sucursales s ON ss.empresa_id = s.empresa_id and ss.sucursal_id = s.id
        WHERE ss.empresa_id = ?
        AND ss.producto_id = ?
        ORDER BY s.nombre
      `, [empresaId, id]);
    }

    res.json({ 
      producto: { 
        ...producto, 
        precios,
        ...(stockPorSucursal.length > 0 && { stock_por_sucursal: stockPorSucursal })
      } 
    });
  } catch (error) {
    console.error('Error en getProductoById:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

// Crear producto
export const createProducto = async (req, res) => {
  try {
    const {
      codigo,
      descripcion,
      categoria_id,
      marca,
      unidad_medida,
      stock_minimo,
      stock_actual,
      ubicacion,
      proveedor_id,
      imagen_url,
      observaciones,
      precios
    } = req.body;

    const user = req.user; // Usuario autenticado
    const empresaId = getEmpresaId(req);

    // Validaciones
    if (!codigo || !descripcion || !unidad_medida) {
      return res.status(400).json({ 
        error: 'Código, descripción y unidad de medida son obligatorios' 
      });
    }

    // Verificar si el código ya existe
    const existing = await getOne(
      'SELECT id FROM productos WHERE empresa_id = ? AND codigo = ?',
      [empresaId, codigo]
    );

    if (existing) {
      return res.status(409).json({ 
        error: 'Ya existe un producto con ese código' 
      });
    }

    // Validar stock inicial cuando no hay sucursal seleccionada
    const stockInicial = parseFloat(stock_actual) || 0;
    
    if (!user.sucursal_id && stockInicial > 0) {
      return res.status(400).json({ 
        error: 'No se puede asignar stock inicial sin una sucursal seleccionada. Selecciona una sucursal específica o crea el producto sin stock y realiza un ajuste posterior.' 
      });
    }

    // Insertar producto
    const result = await runQuery(
      `INSERT INTO productos (
        codigo, descripcion, categoria_id, marca, unidad_medida, 
        stock_minimo, stock_actual, ubicacion, proveedor_id, 
        imagen_url, observaciones, activo, empresa_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        codigo, descripcion, categoria_id || null, marca, unidad_medida,
        stock_minimo || 0, stockInicial, ubicacion, proveedor_id || null,
        imagen_url, observaciones, empresaId
      ]
    );

    const productoId = result.id;

    // Obtener todas las sucursales activas
    const sucursales = await getAll('SELECT id FROM sucursales WHERE empresa_id = ? AND activa = 1', [empresaId]);
    
    // Inicializar stock en todas las sucursales
    for (const sucursal of sucursales) {
      // Si es la sucursal del usuario, asignar el stock inicial
      // Si es otra sucursal, inicializar en 0
      const stockSucursal = (sucursal.id === user.sucursal_id) ? stockInicial : 0;
      
      await runQuery(`
        INSERT INTO stock_sucursales (producto_id, sucursal_id, stock_actual, stock_minimo, empresa_id)
        VALUES (?, ?, ?, ?, ?)
      `, [productoId, sucursal.id, stockSucursal, stock_minimo || 0, empresaId]);
    }

    // Si hubo stock inicial, registrar el movimiento
    if (stockInicial > 0 && user.sucursal_id) {
      await runQuery(`
        INSERT INTO movimientos_stock (
          producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo,
          motivo, sucursal_id, usuario_id, fecha, empresa_id
        ) VALUES (?, 'entrada', ?, 0, ?, 'Stock inicial', ?, ?, CURRENT_TIMESTAMP, ?)
      `, [productoId, stockInicial, stockInicial, user.sucursal_id, user.id, empresaId]);
    }

    // Insertar precios si se proporcionan
    if (precios && Array.isArray(precios) && precios.length > 0) {
      for (const precio of precios) {
        await runQuery(
          `INSERT INTO productos_precios (
            producto_id, lista_precio_id, moneda_id, precio, fecha_desde, empresa_id
          ) VALUES (?, ?, ?, ?, date('now'), ?)`,
          [productoId, precio.lista_precio_id, precio.moneda_id, precio.precio, empresaId]
        );
      }
    }

    res.status(201).json({
      message: 'Producto creado exitosamente',
      productoId
    });
  } catch (error) {
    console.error('Error en createProducto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

// Actualizar producto
export const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codigo,
      descripcion,
      categoria_id,
      marca,
      unidad_medida,
      stock_minimo,
      stock_actual,
      ubicacion,
      proveedor_id,
      imagen_url,
      observaciones,
      activo
    } = req.body;

    const user = req.user;
    const empresaId = getEmpresaId(req);

    // Verificar que existe
    const producto = await getOne('SELECT id FROM productos WHERE empresa_id = ? AND id = ?', [empresaId, id]);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar código duplicado
    if (codigo) {
      const existing = await getOne(
        'SELECT id FROM productos WHERE empresa_id = ? AND codigo = ? AND id != ?',
        [empresaId, codigo, id]
      );

      if (existing) {
        return res.status(409).json({ 
          error: 'Ya existe otro producto con ese código' 
        });
      }
    }

    // Actualizar datos básicos del producto (sin stock_actual)
    await runQuery(
      `UPDATE productos SET
        codigo = ?, descripcion = ?, categoria_id = ?, marca = ?, 
        unidad_medida = ?, stock_minimo = ?, 
        ubicacion = ?, proveedor_id = ?, imagen_url = ?, 
        observaciones = ?, activo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE empresa_id = ?
      AND id = ?`,
      [
        codigo, descripcion, categoria_id || null, marca, unidad_medida,
        stock_minimo, ubicacion, proveedor_id || null,
        imagen_url, observaciones, activo !== undefined ? activo : 1, empresaId, id
      ]
    );

    // Actualizar stock en stock_sucursales SI:
    // 1. Se proporcionó stock_actual en el body
    // 2. El usuario tiene una sucursal seleccionada
    if (stock_actual !== undefined && user.sucursal_id) {
      const nuevoStock = parseFloat(stock_actual) || 0;

      // Obtener stock actual de esta sucursal
      const stockSucursal = await getOne(
        'SELECT stock_actual FROM stock_sucursales WHERE empresa_id = ? AND producto_id = ? AND sucursal_id = ?',
        [empresaId, id, user.sucursal_id]
      );

      if (stockSucursal) {
        const stockAnterior = parseFloat(stockSucursal.stock_actual) || 0;
        const diferencia = nuevoStock - stockAnterior;

        // Solo actualizar si hay diferencia
        if (diferencia !== 0) {
          // Actualizar stock en stock_sucursales
          await runQuery(
            'UPDATE stock_sucursales SET stock_actual = ?, stock_minimo = ? WHERE empresa_id = ? AND producto_id = ? AND sucursal_id = ?',
            [nuevoStock, stock_minimo || 0, empresaId, id, user.sucursal_id]
          );

          // Registrar movimiento de stock
          await runQuery(`
            INSERT INTO movimientos_stock (
              producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo,
              motivo, sucursal_id, usuario_id, fecha, empresa_id
            ) VALUES (?, 'ajuste', ?, ?, ?, 'Ajuste desde edición de producto', ?, ?, CURRENT_TIMESTAMP, ?)
          `, [id, Math.abs(diferencia), stockAnterior, nuevoStock, user.sucursal_id, user.id, empresaId]);

          // Recalcular stock_actual total del producto (suma de todas las sucursales)
          const totalStock = await getOne(
            'SELECT SUM(stock_actual) as total FROM stock_sucursales WHERE empresa_id = ? AND producto_id = ?',
            [empresaId, id]
          );

          await runQuery(
            'UPDATE productos SET stock_actual = ? WHERE empresa_id = ? AND id = ?',
            [totalStock.total || 0, empresaId, id]
          );
        }
      }
    }

    // Actualizar stock_minimo en todas las sucursales
    if (stock_minimo !== undefined) {
      await runQuery(
        'UPDATE stock_sucursales SET stock_minimo = ? WHERE empresa_id = ? AND producto_id = ?',
        [stock_minimo || 0, empresaId, id]
      );
    }

    res.json({ message: 'Producto actualizado exitosamente' });
  } catch (error) {
    console.error('Error en updateProducto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

// Eliminar producto (soft delete)
export const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = getEmpresaId(req);

    const producto = await getOne('SELECT id FROM productos WHERE empresa_id = ? AND id = ?', [empresaId, id]);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar si tiene ventas asociadas
    const ventas = await getOne(
      'SELECT COUNT(*) as count FROM ventas_detalle WHERE empresa_id = ? AND producto_id = ?',
      [empresaId, id]
    );

    if (ventas.count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar un producto con ventas registradas. Puede desactivarlo en su lugar.' 
      });
    }

    await runQuery(
      'UPDATE productos SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE empresa_id = ? AND id = ?',
      [empresaId, id]
    );

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteProducto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

// Actualizar precios de un producto
export const updatePrecios = async (req, res) => {
  try {
    const { id } = req.params;
    const { precios } = req.body;
    const empresaId = getEmpresaId(req);

    // Verificar que el producto existe
    const producto = await getOne('SELECT id FROM productos WHERE empresa_id = ? AND id = ?', [empresaId, id]);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Cerrar precios anteriores (establecer fecha_hasta)
    await runQuery(
      `UPDATE productos_precios 
       SET fecha_hasta = date('now') 
       WHERE empresa_id = ? 
       AND producto_id = ? 
       AND fecha_hasta IS NULL`,
      [empresaId, id]
    );

    // Insertar nuevos precios
    if (precios && Array.isArray(precios) && precios.length > 0) {
      for (const precio of precios) {
        await runQuery(
          `INSERT INTO productos_precios (
            producto_id, lista_precio_id, moneda_id, precio, fecha_desde, empresa_id
          ) VALUES (?, ?, ?, ?, date('now'), ?)`,
          [id, precio.lista_precio_id, precio.moneda_id, precio.precio, empresaId]
        );
      }
    }

    res.json({ message: 'Precios actualizados exitosamente' });
  } catch (error) {
    console.error('Error en updatePrecios:', error);
    res.status(500).json({ error: 'Error al actualizar precios' });
  }
};