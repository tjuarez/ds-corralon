import { getAll, getOne, runQuery } from '../db/database.js';

// Obtener todos los productos (con filtros)
export const getProductos = async (req, res) => {
  try {
    const { search, categoria_id, activo, stock_bajo } = req.query;

    let sql = `
      SELECT p.*, 
             c.nombre as categoria_nombre,
             prov.razon_social as proveedor_nombre,
             (SELECT COUNT(*) FROM productos_precios WHERE producto_id = p.id) as precios_count
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN proveedores prov ON p.proveedor_id = prov.id
      WHERE 1=1
    `;
    const params = [];

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
      sql += ` AND p.stock_actual <= p.stock_minimo`;
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

    const producto = await getOne(
      `SELECT p.*, 
              c.nombre as categoria_nombre,
              prov.razon_social as proveedor_nombre
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       LEFT JOIN proveedores prov ON p.proveedor_id = prov.id
       WHERE p.id = ?`,
      [id]
    );

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Obtener precios del producto
    const precios = await getAll(
      `SELECT pp.*, lp.nombre as lista_nombre, m.codigo as moneda_codigo, m.simbolo as moneda_simbolo
       FROM productos_precios pp
       LEFT JOIN listas_precios lp ON pp.lista_precio_id = lp.id
       LEFT JOIN monedas m ON pp.moneda_id = m.id
       WHERE pp.producto_id = ? AND (pp.fecha_hasta IS NULL OR pp.fecha_hasta >= date('now'))
       ORDER BY lp.id, m.codigo`,
      [id]
    );

    res.json({ producto: { ...producto, precios } });
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

    // Validaciones
    if (!codigo || !descripcion || !unidad_medida) {
      return res.status(400).json({ 
        error: 'Código, descripción y unidad de medida son obligatorios' 
      });
    }

    // Verificar si el código ya existe
    const existing = await getOne(
      'SELECT id FROM productos WHERE codigo = ?',
      [codigo]
    );

    if (existing) {
      return res.status(409).json({ 
        error: 'Ya existe un producto con ese código' 
      });
    }

    // Insertar producto
    const result = await runQuery(
      `INSERT INTO productos (
        codigo, descripcion, categoria_id, marca, unidad_medida, 
        stock_minimo, stock_actual, ubicacion, proveedor_id, 
        imagen_url, observaciones, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        codigo, descripcion, categoria_id || null, marca, unidad_medida,
        stock_minimo || 0, stock_actual || 0, ubicacion, proveedor_id || null,
        imagen_url, observaciones
      ]
    );

    const productoId = result.id;

    // Insertar precios si se proporcionan
    if (precios && Array.isArray(precios) && precios.length > 0) {
      for (const precio of precios) {
        await runQuery(
          `INSERT INTO productos_precios (
            producto_id, lista_precio_id, moneda_id, precio, fecha_desde
          ) VALUES (?, ?, ?, ?, date('now'))`,
          [productoId, precio.lista_precio_id, precio.moneda_id, precio.precio]
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

    // Verificar que existe
    const producto = await getOne('SELECT id FROM productos WHERE id = ?', [id]);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar código duplicado
    if (codigo) {
      const existing = await getOne(
        'SELECT id FROM productos WHERE codigo = ? AND id != ?',
        [codigo, id]
      );

      if (existing) {
        return res.status(409).json({ 
          error: 'Ya existe otro producto con ese código' 
        });
      }
    }

    await runQuery(
      `UPDATE productos SET
        codigo = ?, descripcion = ?, categoria_id = ?, marca = ?, 
        unidad_medida = ?, stock_minimo = ?, stock_actual = ?, 
        ubicacion = ?, proveedor_id = ?, imagen_url = ?, 
        observaciones = ?, activo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        codigo, descripcion, categoria_id || null, marca, unidad_medida,
        stock_minimo, stock_actual, ubicacion, proveedor_id || null,
        imagen_url, observaciones, activo !== undefined ? activo : 1, id
      ]
    );

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

    const producto = await getOne('SELECT id FROM productos WHERE id = ?', [id]);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar si tiene ventas asociadas
    const ventas = await getOne(
      'SELECT COUNT(*) as count FROM ventas_detalle WHERE producto_id = ?',
      [id]
    );

    if (ventas.count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar un producto con ventas registradas. Puede desactivarlo en su lugar.' 
      });
    }

    await runQuery(
      'UPDATE productos SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
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

    // Verificar que el producto existe
    const producto = await getOne('SELECT id FROM productos WHERE id = ?', [id]);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Cerrar precios anteriores (establecer fecha_hasta)
    await runQuery(
      `UPDATE productos_precios 
       SET fecha_hasta = date('now') 
       WHERE producto_id = ? AND fecha_hasta IS NULL`,
      [id]
    );

    // Insertar nuevos precios
    if (precios && Array.isArray(precios) && precios.length > 0) {
      for (const precio of precios) {
        await runQuery(
          `INSERT INTO productos_precios (
            producto_id, lista_precio_id, moneda_id, precio, fecha_desde
          ) VALUES (?, ?, ?, ?, date('now'))`,
          [id, precio.lista_precio_id, precio.moneda_id, precio.precio]
        );
      }
    }

    res.json({ message: 'Precios actualizados exitosamente' });
  } catch (error) {
    console.error('Error en updatePrecios:', error);
    res.status(500).json({ error: 'Error al actualizar precios' });
  }
};