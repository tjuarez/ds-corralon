/**
 * Obtiene el empresa_id del usuario o tenant actual
 * Prioriza tenant si existe (para super_admin), sino usa empresa_id del usuario
 */
export const getEmpresaId = (req) => {
  // Si existe req.tenant (después del middleware), usar ese
  if (req.tenant && req.tenant.id) {
    return req.tenant.id;
  }
  
  // Si no, usar empresa_id del usuario
  if (req.user && req.user.empresa_id) {
    return req.user.empresa_id;
  }
  
  throw new Error('No se pudo determinar empresa_id');
};

/**
 * Agrega condición WHERE empresa_id a una consulta SQL
 */
export const addEmpresaFilter = (sql, empresaId) => {
  if (sql.toUpperCase().includes('WHERE')) {
    return `${sql} AND empresa_id = ${empresaId}`;
  } else {
    return `${sql} WHERE empresa_id = ${empresaId}`;
  }
};

/**
 * Middleware helper para verificar que una entidad pertenece al tenant
 */
export const verifyTenantOwnership = async (getOneFunc, tabla, id, empresaId) => {
  const query = `SELECT id FROM ${tabla} WHERE id = ? AND empresa_id = ?`;
  const result = await getOneFunc(query, [id, empresaId]);
  
  if (!result) {
    throw new Error(`Recurso no encontrado o no pertenece a esta empresa`);
  }
  
  return result;
};