import { runMigrations } from './migrate.js';
import { createMultiTenant } from './migrations/create-multi-tenant.js';
import { addSuperAdminRole } from './migrations/add-super-admin-role.js';

console.log('🔄 Iniciando migraciones completas...\n');

async function runAllMigrations() {
  try {
    // 1. Migraciones base (crear todas las tablas)
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