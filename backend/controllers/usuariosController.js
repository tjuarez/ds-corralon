import { getAll, getOne, runQuery } from '../db/database.js';
import bcrypt from 'bcrypt';
import { getEmpresaId } from '../utils/tenantHelper.js';

// Obtener todos los usuarios
export const getUsuarios = async (req, res) => {
  try {
    const { activo, rol, sucursal_id } = req.query;
    const empresaId = getEmpresaId(req);

    let sql = `
      SELECT u.*, s.nombre as sucursal_nombre
      FROM usuarios u
      LEFT JOIN sucursales s ON u.empresa_id = s.empresa_id AND u.sucursal_id = s.id
      WHERE u.empresa_id = ?
    `;
    const params = [empresaId];

    if (activo !== undefined) {
      sql += ' AND u.activo = ?';
      params.push(activo === 'true' ? 1 : 0);
    }

    if (rol) {
      sql += ' AND u.rol = ?';
      params.push(rol);
    }

    if (sucursal_id) {
      sql += ' AND u.sucursal_id = ?';
      params.push(sucursal_id);
    }

    sql += ' ORDER BY u.nombre ASC';

    const usuarios = await getAll(sql, params);
    
    // No enviar passwords
    const usuariosSinPassword = usuarios.map(({ password, ...usuario }) => usuario);
    
    res.json({ usuarios: usuariosSinPassword });
  } catch (error) {
    console.error('Error en getUsuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// Obtener usuario por ID
export const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = getEmpresaId(req);

    const usuario = await getOne(`
      SELECT u.*, s.nombre as sucursal_nombre
      FROM usuarios u
      LEFT JOIN sucursales s ON u.empresa_id = s.empresa_id AND u.sucursal_id = s.id
      WHERE u.empresa_id = ?
      AND u.id = ?
    `, [empresaId, id]);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No enviar password
    const { password, ...usuarioSinPassword } = usuario;

    res.json({ usuario: usuarioSinPassword });
  } catch (error) {
    console.error('Error en getUsuarioById:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

// Crear usuario
export const createUsuario = async (req, res) => {
  try {
    const {
      username,
      nombre,
      apellido,
      email,
      password,
      rol,
      sucursal_id,
    } = req.body;
    const empresaId = getEmpresaId(req);

    // Validaciones
    if (!username || !nombre || !apellido || !email || !password || !rol) {
      return res.status(400).json({
        error: 'Username, nombre, apellido, email, contraseña y rol son obligatorios'
      });
    }

    if (!['admin', 'vendedor', 'cajero'].includes(rol)) {
      return res.status(400).json({
        error: 'Rol inválido'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar que el username no exista
    const existenteUsername = await getOne(
      'SELECT id FROM usuarios WHERE empresa_id = ? AND username = ?',
      [empresaId, username]
    );

    if (existenteUsername) {
      return res.status(400).json({
        error: 'Ya existe un usuario con ese username'
      });
    }

    // Verificar que el email no exista
    const existenteEmail = await getOne(
      'SELECT id FROM usuarios WHERE empresa_id = ? AND email = ?',
      [empresaId, email]
    );

    if (existenteEmail) {
      return res.status(400).json({
        error: 'Ya existe un usuario con ese email'
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const result = await runQuery(`
      INSERT INTO usuarios (
        username, nombre, apellido, email, password, rol, sucursal_id, empresa_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      username, nombre, apellido, email, hashedPassword, rol, sucursal_id || null, empresaId
    ]);

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuarioId: result.id
    });
  } catch (error) {
    console.error('Error en createUsuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

// Actualizar usuario
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      nombre,
      apellido,
      email,
      password,
      rol,
      sucursal_id,
    } = req.body;
    const empresaId = getEmpresaId(req);

    // Verificar que existe
    const usuario = await getOne('SELECT * FROM usuarios WHERE empresa_id = ? AND id = ?', [empresaId, id]);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Validaciones
    if (!username || !nombre || !apellido || !email || !rol) {
      return res.status(400).json({
        error: 'Username, nombre, apellido, email y rol son obligatorios'
      });
    }

    if (!['admin', 'vendedor', 'cajero'].includes(rol)) {
      return res.status(400).json({
        error: 'Rol inválido'
      });
    }

    // Verificar que el username no exista en otro usuario
    const existenteUsername = await getOne(
      'SELECT id FROM usuarios WHERE empresa_id = ? AND username = ? AND id != ?',
      [empresaId, username, id]
    );

    if (existenteUsername) {
      return res.status(400).json({
        error: 'Ya existe otro usuario con ese username'
      });
    }

    // Verificar que el email no exista en otro usuario
    const existenteEmail = await getOne(
      'SELECT id FROM usuarios WHERE empresa_id = ? AND email = ? AND id != ?',
      [map, email, id]
    );

    if (existenteEmail) {
      return res.status(400).json({
        error: 'Ya existe otro usuario con ese email'
      });
    }

    // Si se proporciona nueva contraseña, hashearla
    let updatePassword = '';
    let params = [username, nombre, apellido, email, rol, sucursal_id || null];

    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).json({
          error: 'La contraseña debe tener al menos 6 caracteres'
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updatePassword = ', password = ?';
      params.push(hashedPassword);
    }

    params.push(empresaId);
    params.push(id);

    // Actualizar
    await runQuery(`
      UPDATE usuarios SET
        username = ?,
        nombre = ?,
        apellido = ?,
        email = ?,
        rol = ?,
        sucursal_id = ?
        ${updatePassword},
        updated_at = CURRENT_TIMESTAMP
      WHERE empresa_id = ? 
      AND id = ?
    `, params);

    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error en updateUsuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

// Activar/Desactivar usuario
export const toggleUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = getEmpresaId(req);

    const usuario = await getOne('SELECT * FROM usuarios WHERE empresa_id = ? AND id = ?', [empresaId, id]);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir desactivar al admin principal
    if (usuario.username === 'admin') {
      return res.status(400).json({
        error: 'No se puede desactivar el usuario administrador principal'
      });
    }

    const nuevoEstado = usuario.activo ? 0 : 1;

    await runQuery(
      'UPDATE usuarios SET activo = ?, updated_at = CURRENT_TIMESTAMP WHERE empresa_id = ? AND id = ?',
      [nuevoEstado, empresaId, id]
    );

    res.json({
      message: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`
    });
  } catch (error) {
    console.error('Error en toggleUsuario:', error);
    res.status(500).json({ error: 'Error al cambiar estado de usuario' });
  }
};

// Eliminar usuario
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = getEmpresaId(req);

    const usuario = await getOne('SELECT * FROM usuarios WHERE empresa_id = ? AND id = ?', [empresaId, id]);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir eliminar al admin principal
    if (usuario.username === 'admin') {
      return res.status(400).json({
        error: 'No se puede eliminar el usuario administrador principal'
      });
    }

    // TODO: Verificar que no tenga registros asociados (ventas, etc.)
    // Por ahora permitimos eliminar

    await runQuery('DELETE FROM usuarios WHERE empresa_id = ? AND id = ?', [empresaId, id]);

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteUsuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

// Cambiar contraseña (para el propio usuario)
export const cambiarPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password_actual, password_nueva } = req.body;
    const empresaId = getEmpresaId(req);

    if (!password_actual || !password_nueva) {
      return res.status(400).json({
        error: 'Contraseña actual y nueva son obligatorias'
      });
    }

    if (password_nueva.length < 6) {
      return res.status(400).json({
        error: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    const usuario = await getOne('SELECT * FROM usuarios WHERE empresa_id = ? AND id = ?', [empresaId, id]);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const passwordValido = await bcrypt.compare(password_actual, usuario.password);

    if (!passwordValido) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(password_nueva, 10);

    // Actualizar
    await runQuery(
      'UPDATE usuarios SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE empresa_id = ? AND id = ?',
      [hashedPassword, empresaId, id]
    );

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error en cambiarPassword:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};