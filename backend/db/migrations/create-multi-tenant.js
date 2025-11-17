import { runQuery, getOne, getAll } from '../database.js';

const createMultiTenant = async () => {
  console.log('🔄 Creando sistema multi-tenant...');

  try {
    // ===== TABLA EMPRESAS (TENANTS) =====
    console.log('📦 Creando tabla empresas...');
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
        activa INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_vencimiento DATETIME,
        plan TEXT DEFAULT 'basico',
        configuracion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ===== OBTENER TODAS LAS TABLAS EXISTENTES =====
    console.log('🔍 Detectando tablas en la base de datos...');
    const todasLasTablas = await getAll(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      AND name != 'empresas'
      ORDER BY name
    `);

    const tablasExistentes = todasLasTablas.map(t => t.name);
    console.log(`   ✅ Encontradas ${tablasExistentes.length} tablas`);

    // ===== AGREGAR EMPRESA_ID A TODAS LAS TABLAS =====
    const tablasActualizadas = [];
    
    for (const tabla of tablasExistentes) {
      console.log(`➕ Agregando empresa_id a tabla ${tabla}...`);
      try {
        await runQuery(`ALTER TABLE ${tabla} ADD COLUMN empresa_id INTEGER REFERENCES empresas(id)`);
        tablasActualizadas.push(tabla);
        console.log(`   ✅ Columna agregada`);
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log(`   ℹ️  Columna empresa_id ya existe`);
          tablasActualizadas.push(tabla);
        } else {
          console.log(`   ⚠️  Error: ${error.message}`);
        }
      }
    }

    // ===== CREAR EMPRESA POR DEFECTO =====
    console.log('\n🏢 Creando empresa por defecto (demo)...');
    const empresaExiste = await getOne('SELECT id FROM empresas WHERE slug = ?', ['demo']);
    
    let empresaId;
    
    if (!empresaExiste) {
      const result = await runQuery(`
        INSERT INTO empresas (slug, nombre, razon_social, activa)
        VALUES ('demo', 'Corralón Demo', 'Demo - Dogo Software', 1)
      `);

      empresaId = result.id;
      console.log(`   ✅ Empresa creada con ID: ${empresaId}`);
    } else {
      empresaId = empresaExiste.id;
      console.log(`   ℹ️  Empresa demo ya existe (ID: ${empresaId})`);
    }

    // ===== ASIGNAR EMPRESA_ID A DATOS EXISTENTES =====
    console.log('\n📝 Asignando empresa_id a datos existentes...');
    
    let totalRegistrosActualizados = 0;
    
    for (const tabla of tablasActualizadas) {
      try {
        const result = await runQuery(`UPDATE ${tabla} SET empresa_id = ? WHERE empresa_id IS NULL`, [empresaId]);
        const changes = result.changes || 0;
        if (changes > 0) {
          console.log(`   ✅ ${tabla}: ${changes} registros`);
          totalRegistrosActualizados += changes;
        }
      } catch (error) {
        console.log(`   ⚠️  Error en ${tabla}: ${error.message}`);
      }
    }

    // ===== CREAR ÍNDICES PARA PERFORMANCE =====
    console.log('\n🔍 Creando índices para performance...');
    for (const tabla of tablasActualizadas) {
      try {
        await runQuery(`CREATE INDEX IF NOT EXISTS idx_${tabla}_empresa_id ON ${tabla}(empresa_id)`);
      } catch (error) {
        // Silenciar errores de índices duplicados
      }
    }
    console.log(`   ✅ Índices creados para ${tablasActualizadas.length} tablas`);

    // ===== CREAR ROL SUPER-ADMIN =====
    console.log('\n👤 Verificando rol super-admin...');
    const adminUser = await getOne('SELECT id, rol, username FROM usuarios WHERE rol = ?', ['super_admin']);
    
    if (!adminUser) {
      console.log('   ℹ️  No hay usuarios super-admin');
      console.log('   💡 Para crear uno, actualiza manualmente un usuario en la BD:');
      console.log(`      UPDATE usuarios SET rol = 'super_admin' WHERE id = 1;`);
    } else {
      console.log(`   ✅ Usuario super-admin existe: ${adminUser.username} (ID: ${adminUser.id})`);
    }

    // ===== MOSTRAR RESUMEN =====
    console.log('\n✅ Migración multi-tenant completada exitosamente!');
    
    const totalEmpresas = await getOne('SELECT COUNT(*) as count FROM empresas');
    const empresas = await getAll('SELECT id, slug, nombre, activa FROM empresas');
    
    console.log(`\n📊 Resumen:`);
    console.log(`   - Empresas: ${totalEmpresas.count}`);
    console.log(`   - Tablas actualizadas: ${tablasActualizadas.length}`);
    console.log(`   - Registros actualizados: ${totalRegistrosActualizados}`);
    console.log(`\n🏢 Empresas registradas:`);
    empresas.forEach(emp => {
      const estado = emp.activa ? '✅' : '❌';
      console.log(`   ${estado} [${emp.id}] ${emp.slug} → ${emp.nombre}`);
    });
    
    console.log('\n🎯 Próximos pasos:');
    console.log('   1. Actualizar middleware de autenticación');
    console.log('   2. Actualizar todos los controllers');
    console.log('   3. Actualizar rutas del frontend');
    console.log('   4. Crear panel de super-admin');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error en la migración:', error);
    console.error(error.stack);
    process.exit(1);
  }
};

// Exportar la función principal para uso desde otros scripts
export { createMultiTenant };

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createMultiTenant();
}