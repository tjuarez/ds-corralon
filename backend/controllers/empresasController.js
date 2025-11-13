import { getAll, getOne, runQuery } from '../db/database.js';

// Obtener todas las empresas (solo super-admin)
export const getEmpresas = async (req, res) => {
  try {
    const empresas = await getAll(`
      SELECT 
        e.*,
        (SELECT COUNT(*) FROM usuarios WHERE empresa_id = e.id) as total_usuarios,
        (SELECT COUNT(*) FROM sucursales WHERE empresa_id = e.id) as total_sucursales,
        (SELECT COUNT(*) FROM productos WHERE empresa_id = e.id) as total_productos,
        (SELECT COUNT(*) FROM ventas WHERE empresa_id = e.id) as total_ventas
      FROM empresas e
      ORDER BY e.created_at DESC
    `);

    res.json({ empresas });
  } catch (error) {
    console.error('Error en getEmpresas:', error);
    res.status(500).json({ error: 'Error al obtener empresas' });
  }
};

// Obtener una empresa por ID
export const getEmpresaById = async (req, res) => {
  try {
    const { id } = req.params;

    const empresa = await getOne(
      'SELECT * FROM empresas WHERE id = ?',
      [id]
    );

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Estadísticas adicionales
    const stats = await getOne(`
      SELECT 
        (SELECT COUNT(*) FROM usuarios WHERE empresa_id = ?) as total_usuarios,
        (SELECT COUNT(*) FROM sucursales WHERE empresa_id = ?) as total_sucursales,
        (SELECT COUNT(*) FROM productos WHERE empresa_id = ?) as total_productos,
        (SELECT COUNT(*) FROM clientes WHERE empresa_id = ?) as total_clientes,
        (SELECT COUNT(*) FROM ventas WHERE empresa_id = ?) as total_ventas,
        (SELECT SUM(total) FROM ventas WHERE empresa_id = ? AND estado != 'anulada') as ventas_total
    `, [id, id, id, id, id, id]);

    res.json({ 
      empresa: {
        ...empresa,
        stats
      }
    });
  } catch (error) {
    console.error('Error en getEmpresaById:', error);
    res.status(500).json({ error: 'Error al obtener empresa' });
  }
};

// Crear nueva empresa
export const createEmpresa = async (req, res) => {
  try {
    const {
      slug,
      nombre,
      razon_social,
      cuit,
      direccion,
      telefono,
      email,
      logo_url,
      plan,
      fecha_vencimiento
    } = req.body;

    // Validaciones
    if (!slug || !nombre) {
      return res.status(400).json({ 
        error: 'Slug y nombre son obligatorios' 
      });
    }

    // Validar que el slug sea válido (solo letras minúsculas, números y guiones)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({ 
        error: 'El slug solo puede contener letras minúsculas, números y guiones' 
      });
    }

    // Verificar que el slug no exista
    const existing = await getOne(
      'SELECT id FROM empresas WHERE slug = ?',
      [slug]
    );

    if (existing) {
      return res.status(409).json({ 
        error: 'Ya existe una empresa con ese slug' 
      });
    }

    const result = await runQuery(
      `INSERT INTO empresas (
        slug, nombre, razon_social, cuit, direccion, telefono, email,
        logo_url, plan, fecha_vencimiento, activa
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        slug, nombre, razon_social, cuit, direccion, telefono, email,
        logo_url, plan || 'basico', fecha_vencimiento
      ]
    );

    res.status(201).json({
      message: 'Empresa creada exitosamente',
      empresaId: result.id
    });
  } catch (error) {
    console.error('Error en createEmpresa:', error);
    res.status(500).json({ error: 'Error al crear empresa' });
  }
};

// Actualizar empresa
export const updateEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      razon_social,
      cuit,
      direccion,
      telefono,
      email,
      logo_url,
      plan,
      fecha_vencimiento,
      activa
    } = req.body;

    // Verificar que la empresa existe
    const empresa = await getOne('SELECT id FROM empresas WHERE id = ?', [id]);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    await runQuery(
      `UPDATE empresas SET
        nombre = ?, razon_social = ?, cuit = ?, direccion = ?, telefono = ?,
        email = ?, logo_url = ?, plan = ?, fecha_vencimiento = ?, activa = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        nombre, razon_social, cuit, direccion, telefono, email, logo_url,
        plan, fecha_vencimiento, activa !== undefined ? activa : 1, id
      ]
    );

    res.json({ message: 'Empresa actualizada exitosamente' });
  } catch (error) {
    console.error('Error en updateEmpresa:', error);
    res.status(500).json({ error: 'Error al actualizar empresa' });
  }
};

// Activar/Desactivar empresa
export const toggleEmpresaStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la empresa existe
    const empresa = await getOne('SELECT id, activa FROM empresas WHERE id = ?', [id]);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const nuevoEstado = empresa.activa === 1 ? 0 : 1;

    await runQuery(
      'UPDATE empresas SET activa = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nuevoEstado, id]
    );

    res.json({ 
      message: `Empresa ${nuevoEstado === 1 ? 'activada' : 'desactivada'} exitosamente`,
      activa: nuevoEstado
    });
  } catch (error) {
    console.error('Error en toggleEmpresaStatus:', error);
    res.status(500).json({ error: 'Error al cambiar estado de empresa' });
  }
};

// Eliminar empresa (solo si no tiene datos)
export const deleteEmpresa = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la empresa existe
    const empresa = await getOne('SELECT id, slug FROM empresas WHERE id = ?', [id]);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // No permitir eliminar empresa "demo"
    if (empresa.slug === 'demo') {
      return res.status(400).json({ 
        error: 'No se puede eliminar la empresa demo' 
      });
    }

    // Verificar si tiene datos asociados
    const hasData = await getOne(`
      SELECT 
        (SELECT COUNT(*) FROM usuarios WHERE empresa_id = ?) +
        (SELECT COUNT(*) FROM sucursales WHERE empresa_id = ?) +
        (SELECT COUNT(*) FROM productos WHERE empresa_id = ?) +
        (SELECT COUNT(*) FROM ventas WHERE empresa_id = ?) as total
    `, [id, id, id, id]);

    if (hasData.total > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar una empresa con datos. Desactívela en su lugar.' 
      });
    }

    await runQuery('DELETE FROM empresas WHERE id = ?', [id]);

    res.json({ message: 'Empresa eliminada exitosamente' });
  } catch (error) {
    console.error('Error en deleteEmpresa:', error);
    res.status(500).json({ error: 'Error al eliminar empresa' });
  }
};