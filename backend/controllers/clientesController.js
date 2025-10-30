import { getAll, getOne, runQuery } from '../db/database.js';

// Obtener todos los clientes (con búsqueda y filtros)
export const getClientes = async (req, res) => {
  try {
    const { search, tipo_cliente, activo } = req.query;

    let sql = `
      SELECT c.*, 
             (SELECT COUNT(*) FROM clientes_contactos WHERE cliente_id = c.id) as contactos_count
      FROM clientes c
      WHERE 1=1
    `;
    const params = [];

    // Búsqueda por texto
    if (search) {
      sql += ` AND (c.razon_social LIKE ? OR c.nombre_fantasia LIKE ? OR c.cuit_dni LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // Filtro por tipo de cliente
    if (tipo_cliente) {
      sql += ` AND c.tipo_cliente = ?`;
      params.push(tipo_cliente);
    }

    // Filtro por activo
    if (activo !== undefined) {
      sql += ` AND c.activo = ?`;
      params.push(activo === 'true' ? 1 : 0);
    }

    sql += ` ORDER BY c.razon_social ASC`;

    const clientes = await getAll(sql, params);
    res.json({ clientes });
  } catch (error) {
    console.error('Error en getClientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

// Obtener un cliente por ID
export const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await getOne(
      'SELECT * FROM clientes WHERE id = ?',
      [id]
    );

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Obtener contactos del cliente
    const contactos = await getAll(
      'SELECT * FROM clientes_contactos WHERE cliente_id = ? ORDER BY principal DESC, nombre ASC',
      [id]
    );

    res.json({ cliente: { ...cliente, contactos } });
  } catch (error) {
    console.error('Error en getClienteById:', error);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
};

// Crear nuevo cliente
export const createCliente = async (req, res) => {
  try {
    const {
      tipo_cliente,
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
      limite_credito,
      condicion_pago,
      lista_precio_id,
      observaciones,
    } = req.body;

    // Validaciones
    if (!tipo_cliente || !razon_social) {
      return res.status(400).json({ 
        error: 'Tipo de cliente y razón social son obligatorios' 
      });
    }

    // Verificar si el CUIT/DNI ya existe (si se proporciona)
    if (cuit_dni) {
      const existing = await getOne(
        'SELECT id FROM clientes WHERE cuit_dni = ?',
        [cuit_dni]
      );

      if (existing) {
        return res.status(409).json({ 
          error: 'Ya existe un cliente con ese CUIT/DNI' 
        });
      }
    }

    const result = await runQuery(
      `INSERT INTO clientes (
        tipo_cliente, razon_social, nombre_fantasia, cuit_dni, telefono, email,
        direccion, pais, localidad, provincia, codigo_postal, limite_credito,
        condicion_pago, lista_precio_id, observaciones, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        tipo_cliente, razon_social, nombre_fantasia, cuit_dni, telefono, email,
        direccion, pais, localidad, provincia, codigo_postal, limite_credito || 0,
        condicion_pago || 'contado', lista_precio_id, observaciones
      ]
    );

    res.status(201).json({
      message: 'Cliente creado exitosamente',
      clienteId: result.id
    });
  } catch (error) {
    console.error('Error en createCliente:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};

// Actualizar cliente
export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipo_cliente,
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
      limite_credito,
      condicion_pago,
      lista_precio_id,
      observaciones,
      activo,
    } = req.body;

    // Verificar que el cliente existe
    const cliente = await getOne('SELECT id FROM clientes WHERE id = ?', [id]);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Verificar si el CUIT/DNI ya existe en otro cliente
    if (cuit_dni) {
      const existing = await getOne(
        'SELECT id FROM clientes WHERE cuit_dni = ? AND id != ?',
        [cuit_dni, id]
      );

      if (existing) {
        return res.status(409).json({ 
          error: 'Ya existe otro cliente con ese CUIT/DNI' 
        });
      }
    }

    await runQuery(
      `UPDATE clientes SET
        tipo_cliente = ?, razon_social = ?, nombre_fantasia = ?, cuit_dni = ?,
        telefono = ?, email = ?, direccion = ?, pais = ?, localidad = ?, provincia = ?,
        codigo_postal = ?, limite_credito = ?, condicion_pago = ?,
        lista_precio_id = ?, observaciones = ?, activo = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        tipo_cliente, razon_social, nombre_fantasia, cuit_dni, telefono, email,
        direccion, pais, localidad, provincia, codigo_postal, limite_credito,
        condicion_pago, lista_precio_id, observaciones, activo !== undefined ? activo : 1, id
      ]
    );

    res.json({ message: 'Cliente actualizado exitosamente' });
  } catch (error) {
    console.error('Error en updateCliente:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
};

// Eliminar cliente (soft delete)
export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el cliente existe
    const cliente = await getOne('SELECT id FROM clientes WHERE id = ?', [id]);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Verificar si tiene ventas asociadas
    const ventas = await getOne(
      'SELECT COUNT(*) as count FROM ventas WHERE cliente_id = ?',
      [id]
    );

    if (ventas.count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar un cliente con ventas registradas. Puede desactivarlo en su lugar.' 
      });
    }

    // Soft delete
    await runQuery(
      'UPDATE clientes SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteCliente:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
};

// Agregar contacto a un cliente
export const addContacto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, cargo, telefono, email, principal } = req.body;

    // Verificar que el cliente existe
    const cliente = await getOne('SELECT id FROM clientes WHERE id = ?', [id]);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Si se marca como principal, desmarcar otros contactos principales
    if (principal) {
      await runQuery(
        'UPDATE clientes_contactos SET principal = 0 WHERE cliente_id = ?',
        [id]
      );
    }

    const result = await runQuery(
      `INSERT INTO clientes_contactos (cliente_id, nombre, cargo, telefono, email, principal)
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

    await runQuery('DELETE FROM clientes_contactos WHERE id = ?', [contactoId]);

    res.json({ message: 'Contacto eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteContacto:', error);
    res.status(500).json({ error: 'Error al eliminar contacto' });
  }
};