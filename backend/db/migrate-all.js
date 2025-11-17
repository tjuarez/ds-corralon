import { runMigrations } from './migrate.js';
import { runQuery } from './database.js';

console.log('🔄 Iniciando migraciones completas...\n');

// Función para ejecutar migración multi-tenant manualmente
async function createMultiTenant() {
  try {
    console.log('Ejecutando migración multi-tenant...');
    
    // Verificar si la tabla empresas ya existe
    const tableExists = await runQuery(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='empresas'
    `);
    
    if (tableExists.length > 0) {
      console.log('⚠️  Tabla empresas ya existe, saltando migración...');
      return;
    }
    
    // Crear tabla empresas
    await runQuery(`
      CREATE TABLE IF NOT EXISTS empresas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        razon_social TEXT,
        cuit TEXT,
        direccion TEXT,
        telefono TEXT,
        email TEXT,
        logo_url TEXT,
        plan TEXT DEFAULT 'basico',
        fecha_vencimiento DATETIME,
        activa INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabla empresas creada');
    
    // Insertar empresa demo
    await runQuery(`
      INSERT INTO empresas (slug, nombre, activa)
      VALUES ('demo', 'Corralón Demo', 1)
    `);
    
    console.log('✅ Empresa demo creada');
    
    // Agregar empresa_id a todas las tablas
    const tables = [
      'usuarios', 'clientes', 'categorias', 'productos', 'proveedores',
      'presupuestos', 'presupuestos_items', 'ventas', 'ventas_items',
      'compras', 'compras_items', 'pagos', 'movimientos_cuenta',
      'cajas', 'movimientos_caja', 'sucursales', 'stock_sucursales',
      'movimientos_stock', 'transferencias_stock', 'configuraciones',
      'productos_proveedores', 'cotizaciones_proveedores', 'ajustes_stock',
      'categorias_clientes', 'notas_credito', 'notas_credito_items',
      'descuentos_productos'
    ];
    
    for (const table of tables) {
      try {
        // Verificar si la columna ya existe
        const columns = await runQuery(`PRAGMA table_info(${table})`);
        const hasEmpresaId = columns.some(col => col.name === 'empresa_id');
        
        if (!hasEmpresaId) {
          await runQuery(`ALTER TABLE ${table} ADD COLUMN empresa_id INTEGER REFERENCES empresas(id)`);
          await runQuery(`UPDATE ${table} SET empresa_id = 1 WHERE empresa_id IS NULL`);
          await runQuery(`CREATE INDEX IF NOT EXISTS idx_${table}_empresa_id ON ${table}(empresa_id)`);
          console.log(`  ✓ ${table}: empresa_id agregada`);
        } else {
          console.log(`  ⚠️  ${table}: empresa_id ya existe`);
        }
      } catch (error) {
        console.log(`  ⚠️  ${table}: ${error.message}`);
      }
    }
    
    console.log('✅ Migración multi-tenant completada');
  } catch (error) {
    console.error('❌ Error en migración multi-tenant:', error);
    throw error;
  }
}

// Función para agregar rol super_admin
async function addSuperAdminRole() {
  try {
    console.log('Ejecutando migración super-admin role...');
    
    // Desactivar foreign keys
    await runQuery('PRAGMA foreign_keys = OFF');
    
    // Crear tabla temporal
    await runQuery(`DROP TABLE IF EXISTS usuarios_new`);
    
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
    
    // Copiar datos
    await runQuery(`INSERT INTO usuarios_new SELECT * FROM usuarios`);
    
    // Eliminar tabla antigua y renombrar
    await runQuery('DROP TABLE usuarios');
    await runQuery('ALTER TABLE usuarios_new RENAME TO usuarios');
    
    // Recrear índices
    await runQuery('CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_usuarios_sucursal_id ON usuarios(sucursal_id)');
    
    // Reactivar foreign keys
    await runQuery('PRAGMA foreign_keys = ON');
    
    console.log('✅ Migración super-admin role completada');
  } catch (error) {
    console.error('❌ Error en migración super-admin:', error);
    // Intentar reactivar foreign keys
    try {
      await runQuery('PRAGMA foreign_keys = ON');
    } catch (e) {}
    throw error;
  }
}

async function runAllMigrations() {
  try {
    // 1. Migraciones base
    console.log('📋 Paso 1: Ejecutando migraciones base...');
    await runMigrations();
    
    // 2. Migración multi-tenant
    console.log('\n📋 Paso 2: Ejecutando migración multi-tenant...');
    await createMultiTenant();
    
    // 3. Agregar rol super_admin
    console.log('\n📋 Paso 3: Agregando rol super_admin...');
    await addSuperAdminRole();
    
    console.log('\n✅ Todas las migraciones completadas exitosamente!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en migraciones:', error);
    process.exit(1);
  }
}

runAllMigrations();