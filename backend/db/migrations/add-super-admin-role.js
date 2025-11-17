import { runQuery, getAll } from '../database.js';

const addSuperAdminRole = async () => {
  console.log('🔄 Agregando rol super_admin a la tabla usuarios...');

  try {
    // Desactivar foreign keys temporalmente
    console.log('🔓 Paso 0: Desactivar foreign keys...');
    await runQuery('PRAGMA foreign_keys = OFF');

    // Limpiar tabla temporal si existe
    console.log('🧹 Paso 0.5: Limpiar tabla temporal si existe...');
    try {
      await runQuery('DROP TABLE IF EXISTS usuarios_new');
    } catch (e) {
      // Ignorar error si no existe
    }

    console.log('📋 Paso 1: Crear tabla temporal...');
    await runQuery(`
      CREATE TABLE usuarios_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        rol TEXT NOT NULL CHECK(rol IN ('super_admin', 'admin', 'vendedor', 'cajero')),
        sucursal_id INTEGER,
        empresa_id INTEGER,
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      )
    `);

    console.log('📝 Paso 2: Copiar datos existentes...');
    await runQuery(`
      INSERT INTO usuarios_new 
      SELECT * FROM usuarios
    `);

    console.log('🗑️  Paso 3: Eliminar tabla antigua...');
    await runQuery('DROP TABLE usuarios');

    console.log('📦 Paso 4: Renombrar tabla nueva...');
    await runQuery('ALTER TABLE usuarios_new RENAME TO usuarios');

    console.log('🔍 Paso 5: Recrear índices...');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_usuarios_sucursal_id ON usuarios(sucursal_id)');

    // Reactivar foreign keys
    console.log('🔒 Paso 6: Reactivar foreign keys...');
    await runQuery('PRAGMA foreign_keys = ON');

    console.log('\n✅ Rol super_admin agregado exitosamente!');
    console.log('   Ahora puedes crear usuarios con rol super_admin.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    
    // Intentar reactivar foreign keys incluso si hay error
    try {
      await runQuery('PRAGMA foreign_keys = ON');
    } catch (e) {
      // Ignorar error
    }
    
    process.exit(1);
  }
};

// Exportar la función principal para uso desde otros scripts
export { addSuperAdminRole };

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  addSuperAdminRole();
}