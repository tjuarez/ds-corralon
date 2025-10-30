import { getAll, getOne, runQuery } from '../db/database.js';

// Obtener todos los proveedores (con búsqueda y filtros)
export const getProveedores = async (req, res) => {
  try {
    const { search, activo } = req.query;

    let sql = `
      SELECT p.*, 
             (SELECT COUNT(*) FROM proveedores_contactos WHERE proveedor_id = p.id) as contactos_count,
             (SELECT COUNT(*) FROM productos WHERE proveedor_id = p.id) as productos_count
      FROM proveedores p
      WHERE 1=1
    `;
    const params = [];

    // Búsqueda por texto
    if (search) {
      sql += ` AND (p.razon_social LIKE ? OR p.nombre_fantasia LIKE ? OR p.cuit_dni LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // Filtro por activo
    if (activo !== undefined) {
      sql += ` AND p.activo = ?`;
      params.push(activo === 'true' ? 1 : 0);
    }

    sql += ` ORDER BY p.razon_social ASC`;

    const proveedores = await getAll(sql, params);
    res.json({ proveedores });
  } catch (error) {
    console.error('Error en getProveedores:', error);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
};

// Obtener un proveedor por ID
export const getProveedorById = async (req, res) => {
  try {
    const { id } = req.params;

    const proveedor = await getOne(
      'SELECT * FROM proveedores WHERE id = ?',
      [id]
    );

    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Obtener contactos del proveedor
    const contactos = await getAll(
      'SELECT * FROM proveedores_contactos WHERE proveedor_id = ? ORDER BY principal DESC, nombre ASC',
      [id]
    );

    // Obtener productos del proveedor
    const productos = await getAll(
      'SELECT id, codigo, descripcion, stock_actual FROM productos WHERE proveedor_id = ? ORDER BY descripcion ASC',
      [id]
    );

    res.json({ proveedor: { ...proveedor, contactos, productos } });
  } catch (error) {
    console.error('Error en getProveedorById:', error);
    res.status(500).json({ error: 'Error al obtener proveedor' });
  }
};

// Crear nuevo proveedor
export const createProveedor = async (req, res) => {
  try {
    const {
      razon_social,
      nombre_fantasia,
      cuit_dni,
      telefono,
      email,
      direccion,
      pais,
      localidad,
      provincia,
      codigo_postal,
      sitio_web,
      condicion_pago,
      observaciones,
    } = req.body;

    // Validaciones
    if (!razon_social) {
      return res.status(400).json({ 
        error: 'La razón social es obligatoria' 
      });
    }

    // Verificar si el CUIT/DNI ya existe (si se proporciona)
    if (cuit_dni) {
      const existing = await getOne(
        'SELECT id FROM proveedores WHERE cuit_dni = ?',
        [cuit_dni]
      );

      if (existing) {
        return res.status(409).json({ 
          error: 'Ya existe un proveedor con ese CUIT/DNI' 
        });
      }
    }

    const result = await runQuery(
      `INSERT INTO proveedores (
        razon_social, nombre_fantasia, cuit_dni, telefono, email,
        direccion, pais, localidad, provincia, codigo_postal, sitio_web,
        condicion_pago, observaciones, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        razon_social, nombre_fantasia, cuit_dni, telefono, email,
        direccion, pais || 'AR', localidad, provincia, codigo_postal, sitio_web,
        condicion_pago || 'cuenta_corriente', observaciones
      ]
    );

    res.status(201).json({
      message: 'Proveedor creado exitosamente',
      proveedorId: result.id
    });
  } catch (error) {
    console.error('Error en createProveedor:', error);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
};

// Actualizar proveedor
export const updateProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      razon_social,
      nombre_fantasia,
      cuit_dni,
      telefono,
      email,
      direccion,
      pais,
      localidad,
      provincia,
      codigo_postal,
      sitio_web,
      condicion_pago,
      observaciones,
      activo,
    } = req.body;

    // Verificar que el proveedor existe
    const proveedor = await getOne('SELECT id FROM proveedores WHERE id = ?', [id]);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Verificar si el CUIT/DNI ya existe en otro proveedor
    if (cuit_dni) {
      const existing = await getOne(
        'SELECT id FROM proveedores WHERE cuit_dni = ? AND id != ?',
        [cuit_dni, id]
      );

      if (existing) {
        return res.status(409).json({ 
          error: 'Ya existe otro proveedor con ese CUIT/DNI' 
        });
      }
    }

    await runQuery(
      `UPDATE proveedores SET
        razon_social = ?, nombre_fantasia = ?, cuit_dni = ?,
        telefono = ?, email = ?, direccion = ?, pais = ?, localidad = ?, 
        provincia = ?, codigo_postal = ?, sitio_web = ?,
        condicion_pago = ?, observaciones = ?, activo = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        razon_social, nombre_fantasia, cuit_dni, telefono, email,
        direccion, pais, localidad, provincia, codigo_postal, sitio_web,
        condicion_pago, observaciones, activo !== undefined ? activo : 1, id
      ]
    );

    res.json({ message: 'Proveedor actualizado exitosamente' });
  } catch (error) {
    console.error('Error en updateProveedor:', error);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
};

// Eliminar proveedor (soft delete)
export const deleteProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el proveedor existe
    const proveedor = await getOne('SELECT id FROM proveedores WHERE id = ?', [id]);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Verificar si tiene compras asociadas
    const compras = await getOne(
      'SELECT COUNT(*) as count FROM compras WHERE proveedor_id = ?',
      [id]
    );

    if (compras.count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar un proveedor con compras registradas. Puede desactivarlo en su lugar.' 
      });
    }

    // Verificar si tiene productos asociados
    const productos = await getOne(
      'SELECT COUNT(*) as count FROM productos WHERE proveedor_id = ?',
      [id]
    );

    if (productos.count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar un proveedor con productos asociados. Puede desactivarlo en su lugar.' 
      });
    }

    // Soft delete
    await runQuery(
      'UPDATE proveedores SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: 'Proveedor eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteProveedor:', error);
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
};

// Agregar contacto a un proveedor
export const addContacto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, cargo, telefono, email, principal } = req.body;

    // Verificar que el proveedor existe
    const proveedor = await getOne('SELECT id FROM proveedores WHERE id = ?', [id]);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Si se marca como principal, desmarcar otros contactos principales
    if (principal) {
      await runQuery(
        'UPDATE proveedores_contactos SET principal = 0 WHERE proveedor_id = ?',
        [id]
      );
    }

    const result = await runQuery(
      `INSERT INTO proveedores_contactos (proveedor_id, nombre, cargo, telefono, email, principal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, nombre, cargo, telefono, email, principal ? 1 : 0]
    );

    res.status(201).json({
      message: 'Contacto agregado exitosamente',
      contactoId: result.id
    });
  } catch (error) {
    console.error('Error en addContacto:', error);
    res.status(500).json({ error: 'Error al agregar contacto' });
  }
};

// Eliminar contacto
export const deleteContacto = async (req, res) => {
  try {
    const { contactoId } = req.params;

    await runQuery('DELETE FROM proveedores_contactos WHERE id = ?', [contactoId]);

    res.json({ message: 'Contacto eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteContacto:', error);
    res.status(500).json({ error: 'Error al eliminar contacto' });
  }
};