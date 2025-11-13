import db, { runQuery, getAll } from './database.js';
import readline from 'readline';

// Verificar si se pasa el flag --force
const forceMode = process.argv.includes('--force');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const tableExists = async (tableName) => {
  try {
    const result = await getAll(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    );
    return result.length > 0;
  } catch (error) {
    return false;
  }
};

const cleanTable = async (tableName, description) => {
  try {
    const exists = await tableExists(tableName);
    if (exists) {
      await runQuery(`DELETE FROM ${tableName}`);
      //console.log(`  ✓ ${description}`);
    } else {
      console.log(`  ⊘ ${description} (tabla no existe)`);
    }
  } catch (error) {
    console.log(`  ⚠ Error al limpiar ${tableName}:`, error.message);
  }
};

const cleanDatabase = async () => {
  if (!forceMode) {
    console.log('⚠️  ADVERTENCIA: Esta acción eliminará TODOS los datos de la base de datos');
    console.log('    (excepto usuarios, sucursales y configuración básica)\n');

    const answer = await question('¿Estás seguro de continuar? (escribe "SI" para confirmar): ');

    if (answer.toUpperCase() !== 'SI') {
      console.log('❌ Operación cancelada');
      rl.close();
      process.exit(0);
    }
  }

  console.log('\n🧹 Limpiando base de datos...\n');

  try {
    // Deshabilitar foreign keys temporalmente
    await runQuery('PRAGMA foreign_keys = OFF');

    // ============================================
    // LIMPIAR TABLAS DE VENTAS
    // ============================================
    console.log('📋 Limpiando ventas...');
    await cleanTable('ventas_detalle', 'Detalles de ventas');
    await cleanTable('ventas_pagos', 'Pagos de ventas');
    await cleanTable('ventas', 'Ventas');

    // ============================================
    // LIMPIAR TABLAS DE COMPRAS
    // ============================================
    console.log('📦 Limpiando compras...');
    await cleanTable('compras_detalle', 'Detalles de compras');
    await cleanTable('compras', 'Compras');

    // ============================================
    // LIMPIAR PRODUCTOS
    // ============================================
    console.log('📦 Limpiando productos...');
    await cleanTable('productos_precios', 'Precios de productos');
    await cleanTable('productos', 'Productos');

    // ============================================
    // LIMPIAR CATEGORÍAS
    // ============================================
    console.log('📁 Limpiando categorías...');
    await cleanTable('categorias', 'Categorías');

    // ============================================
    // LIMPIAR CLIENTES
    // ============================================
    console.log('👥 Limpiando clientes...');
    await cleanTable('clientes_contactos', 'Contactos de clientes');
    await cleanTable('clientes', 'Clientes');

    // ============================================
    // LIMPIAR PROVEEDORES
    // ============================================
    console.log('🏢 Limpiando proveedores...');
    await cleanTable('proveedores_contactos', 'Contactos de proveedores');
    await cleanTable('proveedores', 'Proveedores');

    // ============================================
    // LIMPIAR PRESUPUESTOS
    // ============================================
    console.log('📄 Limpiando presupuestos...');
    await cleanTable('presupuestos_detalle', 'Detalles de presupuestos');
    await cleanTable('presupuestos', 'Presupuestos');

    // ============================================
    // LIMPIAR CAJA
    // ============================================
    console.log('💰 Limpiando movimientos de caja...');
    await cleanTable('movimientos_caja', 'Movimientos de caja');
    await cleanTable('cierres_caja', 'Cierres de caja');
    await cleanTable('aperturas_caja', 'Aperturas de caja');

    // ============================================
    // RESETEAR AUTOINCREMENT
    // ============================================
    console.log('🔄 Reseteando contadores...');
    const tables = [
      'ventas', 'ventas_detalle', 'ventas_pagos',
      'compras', 'compras_detalle',
      'productos', 'productos_precios',
      'categorias',
      'clientes', 'clientes_contactos',
      'proveedores', 'proveedores_contactos',
      'presupuestos', 'presupuestos_detalle',
      'movimientos_caja', 'cierres_caja', 'aperturas_caja'
    ];

    for (const table of tables) {
      const exists = await tableExists(table);
      if (exists) {
        await runQuery(`DELETE FROM sqlite_sequence WHERE name = '${table}'`);
      }
    }
    console.log('  ✓ Contadores reseteados');

    // Rehabilitar foreign keys
    await runQuery('PRAGMA foreign_keys = ON');

    console.log('\n═══════════════════════════════════════');
    console.log('✅ BASE DE DATOS LIMPIADA EXITOSAMENTE');
    console.log('═══════════════════════════════════════');
    
    if (!forceMode) {
      console.log('La base de datos está lista para recibir nuevos datos.');
      console.log('Puedes ejecutar: npm run seed');
      console.log('═══════════════════════════════════════\n');
    }

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    rl.close();
    process.exit(1);
  }

  rl.close();
  process.exit(0);
};

// Ejecutar
cleanDatabase();