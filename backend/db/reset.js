import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const resetDatabase = async () => {
  console.log('🔄 RESET COMPLETO DE BASE DE DATOS\n');
  console.log('Este proceso hará:');
  console.log('  1. Limpiar todos los datos');
  console.log('  2. Cargar datos de ejemplo\n');

  try {
    // Paso 1: Limpiar (con flag --force para evitar confirmación)
    console.log('═══════════════════════════════════════');
    console.log('PASO 1: Limpiando base de datos...');
    console.log('═══════════════════════════════════════\n');
    
    const { stdout: cleanOutput } = await execAsync('node backend/db/clean.js --force');
    console.log(cleanOutput);

    // Paso 2: Cargar datos
    console.log('═══════════════════════════════════════');
    console.log('PASO 2: Cargando datos de ejemplo...');
    console.log('═══════════════════════════════════════\n');
    
    const { stdout: seedOutput } = await execAsync('node backend/db/seed.js');
    console.log(seedOutput);

    // Paso 3: Inicializar stock por sucursal
    console.log('═══════════════════════════════════════');
    console.log('PASO 3: Cargando datos de stock para las sucursales...');
    console.log('═══════════════════════════════════════\n');
    
    const { stdout: stockOutput } = await execAsync('node backend/db/inicializar-stock-sucursales.js');
    console.log(stockOutput);

    console.log('═══════════════════════════════════════');
    console.log('✅ RESET COMPLETADO EXITOSAMENTE');
    console.log('═══════════════════════════════════════');
    console.log('La base de datos ha sido limpiada y recargada.\n');

  } catch (error) {
    console.error('❌ Error durante el reset:', error.message);
    if (error.stdout) console.log('Output:', error.stdout);
    if (error.stderr) console.error('Error:', error.stderr);
    process.exit(1);
  }

  process.exit(0);
};

// Ejecutar
resetDatabase();