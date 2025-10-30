import { getAll, getOne, runQuery } from '../db/database.js';

// Obtener todas las categorías (árbol jerárquico)
export const getCategorias = async (req, res) => {
  try {
    const { activa } = req.query;

    let sql = 'SELECT * FROM categorias WHERE 1=1';
    const params = [];

    if (activa !== undefined) {
      sql += ' AND activa = ?';
      params.push(activa === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY nombre ASC';

    const categorias = await getAll(sql, params);

    // Construir árbol jerárquico
    const categoriasMap = {};
    const arbol = [];

    categorias.forEach(cat => {
      categoriasMap[cat.id] = { ...cat, hijos: [] };
    });

    categorias.forEach(cat => {
      if (cat.parent_id) {
        if (categoriasMap[cat.parent_id]) {
          categoriasMap[cat.parent_id].hijos.push(categoriasMap[cat.id]);
        }
      } else {
        arbol.push(categoriasMap[cat.id]);
      }
    });

    res.json({ categorias: arbol, categoriasPlanas: categorias });
  } catch (error) {
    console.error('Error en getCategorias:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

// Obtener categoría por ID
export const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await getOne(
      'SELECT * FROM categorias WHERE id = ?',
      [id]
    );

    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Obtener productos de esta categoría
    const productos = await getAll(
      'SELECT COUNT(*) as count FROM productos WHERE categoria_id = ?',
      [id]
    );

    res.json({ categoria: { ...categoria, productos_count: productos[0].count } });
  } catch (error) {
    console.error('Error en getCategoriaById:', error);
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
};

// Crear categoría
export const createCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, parent_id } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    // Verificar si ya existe
    const existing = await getOne(
      'SELECT id FROM categorias WHERE nombre = ?',
      [nombre]
    );

    if (existing) {
      return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    }

    const result = await runQuery(
      'INSERT INTO categorias (nombre, descripcion, parent_id, activa) VALUES (?, ?, ?, 1)',
      [nombre, descripcion, parent_id || null]
    );

    res.status(201).json({
      message: 'Categoría creada exitosamente',
      categoriaId: result.id
    });
  } catch (error) {
    console.error('Error en createCategoria:', error);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

// Actualizar categoría
export const updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, parent_id, activa } = req.body;

    const categoria = await getOne('SELECT id FROM categorias WHERE id = ?', [id]);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Verificar nombre duplicado
    if (nombre) {
      const existing = await getOne(
        'SELECT id FROM categorias WHERE nombre = ? AND id != ?',
        [nombre, id]
      );

      if (existing) {
        return res.status(409).json({ error: 'Ya existe otra categoría con ese nombre' });
      }
    }

    await runQuery(
      'UPDATE categorias SET nombre = ?, descripcion = ?, parent_id = ?, activa = ? WHERE id = ?',
      [nombre, descripcion, parent_id || null, activa !== undefined ? activa : 1, id]
    );

    res.json({ message: 'Categoría actualizada exitosamente' });
  } catch (error) {
    console.error('Error en updateCategoria:', error);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

// Eliminar categoría
export const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await getOne('SELECT id FROM categorias WHERE id = ?', [id]);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Verificar si tiene productos
    const productos = await getOne(
      'SELECT COUNT(*) as count FROM productos WHERE categoria_id = ?',
      [id]
    );

    if (productos.count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar una categoría con productos asociados' 
      });
    }

    // Verificar si tiene subcategorías
    const subcategorias = await getOne(
      'SELECT COUNT(*) as count FROM categorias WHERE parent_id = ?',
      [id]
    );

    if (subcategorias.count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar una categoría con subcategorías' 
      });
    }

    await runQuery('UPDATE categorias SET activa = 0 WHERE id = ?', [id]);

    res.json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    console.error('Error en deleteCategoria:', error);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};