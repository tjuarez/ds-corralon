import { runQuery, getAll } from './database.js';

console.log('🔧 Agregando empresa_id a todas las tablas...\n');

async function addEmpresaIdToTables() {
  /*const tables = [
    'usuarios', 'clientes', 'categorias', 'productos', 'proveedores',
    'presupuestos', 'ventas', 'compras', 'cajas', 'movimientos_caja',
    'sucursales', 'stock_sucursales', 'movimientos_stock'
  ];*/

  const tables = [
    'cajas',
    'categorias',
    'clientes',
    'clientes_contactos',
    'compras',
    'compras_detalle',
    'configuración',
    'cuenta_corriente',
    'fidelizacion_historial',
    'listas_precios',
    'monedas',
    'movimientos_caja',
    'movimientos_stock',
    'pagos_clientes',
    'presupuestos',
    'presupuestos_detalle',
    'productos',
    'productos_precios',
    'proveedores',
    'proveedores_contactos',
    'stock_sucursales',
    'sucursales',
    'tipos_cambio',
    'usuarios',
    'ventas',
    'ventas_detalle',
    'ventas_pagos'
  ];

  for (const table of tables) {
    try {
      console.log(`Procesando tabla: ${table}...`);
      
      // Verificar si la columna ya existe
      const columns = await getAll(`PRAGMA table_info(${table})`);
      const hasEmpresaId = columns.some(col => col.name === 'empresa_id');
      
      if (!hasEmpresaId) {
        // Agregar columna
        await runQuery(`ALTER TABLE ${table} ADD COLUMN empresa_id INTEGER REFERENCES empresas(id)`);
        console.log(`  ✓ Columna empresa_id agregada`);
        
        // Actualizar registros existentes
        await runQuery(`UPDATE ${table} SET empresa_id = 1 WHERE empresa_id IS NULL`);
        console.log(`  ✓ Registros actualizados`);
        
        // Crear índice
        await runQuery(`CREATE INDEX IF NOT EXISTS idx_${table}_empresa_id ON ${table}(empresa_id)`);
        console.log(`  ✓ Índice creado`);
      } else {
        console.log(`  ⚠️  empresa_id ya existe`);
      }
    } catch (error) {
      console.error(`  ❌ Error en ${table}:`, error.message);
    }
  }
  
  console.log('\n✅ Proceso completado!\n');
  process.exit(0);
}

addEmpresaIdToTables();