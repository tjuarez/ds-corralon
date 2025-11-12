import { getAll, getOne, runQuery } from '../db/database.js';
import { getEmpresaId } from '../utils/tenantHelper.js';

// Obtener todos los proveedores (con búsqueda y filtros)
export const getProveedores = async (req, res) => {
  try {
    const { search, activo } = req.query;
    const empresaId = getEmpresaId(req);

    let sql = `
      SELECT p.*, 
             (SELECT COUNT(*) FROM proveedores_contactos pc WHERE pc.empresa_id = p.empresa_id AND pc.proveedor_id = p.id) as contactos_count,
             (SELECT COUNT(*) FROM productos pr WHERE pr.empresa_id = p.empresa_id AND pr.proveedor_id = p.id) as productos_count
      FROM proveedores p
      WHERE p.empresa_id = ?
    `;
    const params = [empresaId];

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
    const empresaId = getEmpresaId(req);

    const proveedor = await getOne(
      'SELECT * FROM proveedores WHERE empresa_id = ? AND id = ?',
      [empresaId, id]
    );

    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Obtener contactos del proveedor
    const contactos = await getAll(
      'SELECT * FROM proveedores_contactos WHERE empresa_id = ? AND proveedor_id = ? ORDER BY principal DESC, nombre ASC',
      [empresaId, id]
    );

    // Obtener productos del proveedor
    const productos = await getAll(
      'SELECT id, codigo, descripcion, stock_actual FROM productos WHERE empresa_id = ? AND proveedor_id = ? ORDER BY descripcion ASC',
      [empresaId, id]
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
    const empresaId = getEmpresaId(req);

    // Validaciones
    if (!razon_social) {
      return res.status(400).json({ 
        error: 'La razón social es obligatoria' 
      });
    }

    // Verificar si el CUIT/DNI ya existe (si se proporciona)
    if (cuit_dni) {
      const existing = await getOne(
        'SELECT id FROM proveedores WHERE empresa_id = ? AND cuit_dni = ?',
        [empresaId, cuit_dni]
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
        condicion_pago, observaciones, activo, empresa_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        razon_social, nombre_fantasia, cuit_dni, telefono, email,
        direccion, pais || 'AR', localidad, provincia, codigo_postal, sitio_web,
        condicion_pago || 'cuenta_corriente', observaciones, empresaId
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
    const empresaId = getEmpresaId(req);

    // Verificar que el proveedor existe
    const proveedor = await getOne('SELECT id FROM proveedores WHERE empresa_id = ? AND id = ?', [empresaId, id]);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Verificar si el CUIT/DNI ya existe en otro proveedor
    if (cuit_dni) {
      const existing = await getOne(
        'SELECT id FROM proveedores WHERE empresa_id = ? AND cuit_dni = ? AND id != ?',
        [empresaId, cuit_dni, id]
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
      WHERE empresa_id = ? 
      AND id = ?`,
      [
        razon_social, nombre_fantasia, cuit_dni, telefono, email,
        direccion, pais, localidad, provincia, codigo_postal, sitio_web,
        condicion_pago, observaciones, activo !== undefined ? activo : 1, empresaId, id
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
    const empresaId = getEmpresaId(req);

    // Verificar que el proveedor existe
    const proveedor = await getOne('SELECT id FROM proveedores WHERE empresa_id = ? AND id = ?', [empresaId, id]);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Verificar si tiene compras asociadas
    const compras = await getOne(
      'SELECT COUNT(*) as count FROM compras WHERE empresa_id = ? AND proveedor_id = ?',
      [empresaId, id]
    );

    if (compras.count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar un proveedor con compras registradas. Puede desactivarlo en su lugar.' 
      });
    }

    // Verificar si tiene productos asociados
    const productos = await getOne(
      'SELECT COUNT(*) as count FROM productos WHERE empresa_id = ? AND proveedor_id = ?',
      [empresaId, id]
    );

    if (productos.count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar un proveedor con productos asociados. Puede desactivarlo en su lugar.' 
      });
    }

    // Soft delete
    await runQuery(
      'UPDATE proveedores SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE empresa_id = ? AND id = ?',
      [empresaId, id]
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
    const empresaId = getEmpresaId(req);

    // Verificar que el proveedor existe
    const proveedor = await getOne('SELECT id FROM proveedores WHERE empresa_id = ? AND id = ?', [empresaId, id]);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Si se marca como principal, desmarcar otros contactos principales
    if (principal) {
      await runQuery(
        'UPDATE proveedores_contactos SET principal = 0 WHERE empresa_id = ? AND proveedor_id = ?',
        [empresaId, id]
      );
    }

    const result = await runQuery(
      `INSERT INTO proveedores_contactos (proveedor_id, nombre, cargo, telefono, email, principal, empresa_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, nombre, cargo, telefono, email, principal ? 1 : 0, empresaId]
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
    const empresaId = getEmpresaId(req);

    await runQuery('DELETE FROM proveedores_contactos WHERE empresa_id = ? AND id = ?', [empresaId, contactoId]);

    res.json({ message: 'Contacto eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteContacto:', error);
    res.status(500).json({ error: 'Error al eliminar contacto' });
  }
};