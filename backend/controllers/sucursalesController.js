import { getAll, getOne, runQuery } from '../db/database.js';

// Obtener todas las sucursales
export const getSucursales = async (req, res) => {
  try {
    const { activa } = req.query;

    let sql = 'SELECT * FROM sucursales WHERE 1=1';
    const params = [];

    if (activa !== undefined) {
      sql += ' AND activa = ?';
      params.push(activa === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY nombre ASC';

    const sucursales = await getAll(sql, params);
    res.json({ sucursales });
  } catch (error) {
    console.error('Error en getSucursales:', error);
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
};

// Obtener sucursal por ID
export const getSucursalById = async (req, res) => {
  try {
    const { id } = req.params;

    const sucursal = await getOne('SELECT * FROM sucursales WHERE id = ?', [id]);

    if (!sucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    res.json({ sucursal });
  } catch (error) {
    console.error('Error en getSucursalById:', error);
    res.status(500).json({ error: 'Error al obtener sucursal' });
  }
};

// Crear sucursal
export const createSucursal = async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      direccion,
      pais,
      provincia,
      ciudad,
      codigo_postal,
      telefono,
      email,
      responsable,
    } = req.body;

    // Validaciones
    if (!codigo || !nombre) {
      return res.status(400).json({
        error: 'Código y nombre son obligatorios'
      });
    }

    // Verificar que el código no exista
    const existente = await getOne(
      'SELECT id FROM sucursales WHERE codigo = ?',
      [codigo]
    );

    if (existente) {
      return res.status(400).json({
        error: 'Ya existe una sucursal con ese código'
      });
    }

    // Crear sucursal
    const result = await runQuery(`
      INSERT INTO sucursales (
        codigo, nombre, direccion, pais, provincia, ciudad,
        codigo_postal, telefono, email, responsable
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      codigo, nombre, direccion, pais, provincia, ciudad,
      codigo_postal, telefono, email, responsable
    ]);

    res.status(201).json({
      message: 'Sucursal creada exitosamente',
      sucursalId: result.id
    });
  } catch (error) {
    console.error('Error en createSucursal:', error);
    res.status(500).json({ error: 'Error al crear sucursal' });
  }
};

// Actualizar sucursal
export const updateSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codigo,
      nombre,
      direccion,
      pais,
      provincia,
      ciudad,
      codigo_postal,
      telefono,
      email,
      responsable,
    } = req.body;

    // Verificar que existe
    const sucursal = await getOne('SELECT id FROM sucursales WHERE id = ?', [id]);

    if (!sucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    // Validaciones
    if (!codigo || !nombre) {
      return res.status(400).json({
        error: 'Código y nombre son obligatorios'
      });
    }

    // Verificar que el código no exista en otra sucursal
    const existente = await getOne(
      'SELECT id FROM sucursales WHERE codigo = ? AND id != ?',
      [codigo, id]
    );

    if (existente) {
      return res.status(400).json({
        error: 'Ya existe otra sucursal con ese código'
      });
    }

    // Actualizar
    await runQuery(`
      UPDATE sucursales SET
        codigo = ?,
        nombre = ?,
        direccion = ?,
        pais = ?,
        provincia = ?,
        ciudad = ?,
        codigo_postal = ?,
        telefono = ?,
        email = ?,
        responsable = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      codigo, nombre, direccion, pais, provincia, ciudad,
      codigo_postal, telefono, email, responsable, id
    ]);

    res.json({ message: 'Sucursal actualizada exitosamente' });
  } catch (error) {
    console.error('Error en updateSucursal:', error);
    res.status(500).json({ error: 'Error al actualizar sucursal' });
  }
};

// Activar/Desactivar sucursal
export const toggleSucursal = async (req, res) => {
  try {
    const { id } = req.params;

    const sucursal = await getOne('SELECT activa FROM sucursales WHERE id = ?', [id]);

    if (!sucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    const nuevoEstado = sucursal.activa ? 0 : 1;

    await runQuery(
      'UPDATE sucursales SET activa = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nuevoEstado, id]
    );

    res.json({
      message: `Sucursal ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`
    });
  } catch (error) {
    console.error('Error en toggleSucursal:', error);
    res.status(500).json({ error: 'Error al cambiar estado de sucursal' });
  }
};

// Eliminar sucursal (solo si no tiene registros asociados)
export const deleteSucursal = async (req, res) => {
  try {
    const { id } = req.params;

    const sucursal = await getOne('SELECT * FROM sucursales WHERE id = ?', [id]);

    if (!sucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    // Verificar que no sea la casa central
    if (sucursal.codigo === 'CASA-CENTRAL') {
      return res.status(400).json({
        error: 'No se puede eliminar la casa central'
      });
    }

    // TODO: Verificar que no tenga registros asociados (ventas, usuarios, etc.)
    // Por ahora permitimos eliminar

    await runQuery('DELETE FROM sucursales WHERE id = ?', [id]);

    res.json({ message: 'Sucursal eliminada exitosamente' });
  } catch (error) {
    console.error('Error en deleteSucursal:', error);
    res.status(500).json({ error: 'Error al eliminar sucursal' });
  }
};