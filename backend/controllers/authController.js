import bcrypt from 'bcrypt';
import { getAll, getOne, runQuery } from '../db/database.js';
import { generateToken } from '../utils/jwt.js';
import { getEmpresaId } from '../utils/tenantHelper.js';

// Registro de nuevo usuario
export const register = async (req, res) => {
  try {
    const { 
      username, 
      password, 
      nombre, 
      apellido, 
      email, 
      rol = 'vendedor',
      sucursal_id 
    } = req.body;
    const empresaId = getEmpresaId(req);

    // Validaciones básicas
    if (!username || !password || !nombre || !apellido || !email) {
      return res.status(400).json({ 
        error: 'Todos los campos son obligatorios' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await getOne(
      'SELECT id FROM usuarios WHERE empresa_id = ? AND (username = ? OR email = ?)',
      [empresaId, username, email]
    );

    if (existingUser) {
      return res.status(409).json({ 
        error: 'El usuario o email ya están registrados' 
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const result = await runQuery(
      `INSERT INTO usuarios (username, password, nombre, apellido, email, rol, sucursal_id, activo, empresa_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [username, hashedPassword, nombre, apellido, email, rol, sucursal_id || 1, empresaId]
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      userId: result.id
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// Login - Recibe tenant como parámetro
export const login = async (req, res) => {
  try {
    const { username, password, tenant } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Usuario y contraseña son obligatorios' 
      });
    }

    if (!tenant) {
      return res.status(400).json({ 
        error: 'Debe especificar la empresa (tenant)' 
      });
    }

    // Buscar empresa por slug
    const empresa = await getOne(
      'SELECT id, slug, nombre, activa FROM empresas WHERE slug = ?',
      [tenant]
    );

    if (!empresa) {
      return res.status(404).json({ 
        error: 'Empresa no encontrada' 
      });
    }

    if (!empresa.activa) {
      return res.status(403).json({ 
        error: 'Esta empresa está inactiva. Contacte al administrador.' 
      });
    }

    // Buscar usuario:
    // 1. Super-admin (sin empresa_id, puede acceder a cualquier empresa)
    // 2. Usuario normal de la empresa específica
    const user = await getOne(
      `SELECT u.*, s.nombre as sucursal_nombre, e.slug as empresa_slug, e.nombre as empresa_nombre
       FROM usuarios u
       LEFT JOIN sucursales s ON u.sucursal_id = s.id
       LEFT JOIN empresas e ON u.empresa_id = e.id
       WHERE u.username = ? 
       AND u.activo = 1
       AND (u.rol = 'super_admin' OR u.empresa_id = ?)`,
      [username, empresa.id]
    );

    if (!user) {
      return res.status(401).json({ 
        error: 'Usuario o contraseña incorrectos' 
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Usuario o contraseña incorrectos' 
      });
    }

    // Si es super_admin, asignar datos de la empresa actual temporalmente
    if (user.rol === 'super_admin') {
      user.empresa_id = empresa.id;
      user.empresa_slug = empresa.slug;
      user.empresa_nombre = empresa.nombre;
    }

    // Generar token (incluir empresa_id y slug)
    const token = generateToken({
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol: user.rol,
      sucursal_id: user.sucursal_id,
      sucursal_nombre: user.sucursal_nombre,
      empresa_id: user.empresa_id,
      empresa_slug: user.empresa_slug,
      empresa_nombre: user.empresa_nombre
    });

    // Establecer cookie con el token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    // Enviar respuesta (sin la contraseña)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Inicio de sesión exitoso',
      user: userWithoutPassword,
      tenant: empresa.slug
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Logout
export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Sesión cerrada exitosamente' });
};

// Obtener usuario actual
export const getCurrentUser = async (req, res) => {
  try {
    // Para getCurrentUser, usar el empresa_id del usuario autenticado (del token)
    // No usar getEmpresaId porque esta ruta no tiene tenant en el path
    const empresaId = req.user.empresa_id;
    
    if (!empresaId && req.user.rol !== 'super_admin') {
      return res.status(403).json({ 
        error: 'Usuario sin empresa asignada' 
      });
    }

    const user = await getOne(
      `SELECT u.id, u.username, u.nombre, u.apellido, u.email, u.rol, 
              u.sucursal_id, s.nombre as sucursal_nombre, u.created_at,
              u.empresa_id, e.slug as empresa_slug, e.nombre as empresa_nombre
       FROM usuarios u
       LEFT JOIN sucursales s ON u.sucursal_id = s.id
       LEFT JOIN empresas e ON u.empresa_id = e.id
       WHERE u.id = ? 
       AND u.activo = 1`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error en getCurrentUser:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

// Cambiar contraseña
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const empresaId = getEmpresaId(req);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Contraseña actual y nueva son obligatorias' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'La nueva contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Obtener usuario actual
    const user = await getOne(
      'SELECT password FROM usuarios WHERE empresa_id = ? AND id = ?',
      [empresaId, userId]
    );

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'La contraseña actual es incorrecta' 
      });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await runQuery(
      'UPDATE usuarios SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE empresa_id = ? AND id = ?',
      [hashedPassword, empresaId, userId]
    );

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error en changePassword:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};

// Obtener lista de empresas activas (para selector en login)
export const getEmpresas = async (req, res) => {
  try {
    const empresas = await getAll(
      'SELECT slug, nombre FROM empresas WHERE activa = 1 ORDER BY nombre ASC'
    );
    
    res.json({ empresas: empresas || [] });
  } catch (error) {
    console.error('Error en getEmpresas:', error);
    res.status(500).json({ error: 'Error al obtener empresas' });
  }
};