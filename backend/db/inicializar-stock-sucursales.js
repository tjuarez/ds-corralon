import { getAll, runQuery } from '../db/database.js';

const inicializarStockSucursales = async () => {
  try {
    console.log('🔄 Iniciando inicialización de stock por sucursal...');

    // Obtener todas las sucursales activas
    const sucursales = await getAll('SELECT id, nombre FROM sucursales WHERE activa = 1');
    console.log(`📍 Sucursales encontradas: ${sucursales.length}`);

    // Obtener todos los productos activos
    const productos = await getAll('SELECT id, codigo, descripcion, stock_actual, stock_minimo FROM productos WHERE activo = 1');
    console.log(`📦 Productos encontrados: ${productos.length}`);

    let insertados = 0;
    let actualizados = 0;

    // Para cada combinación producto-sucursal
    for (const sucursal of sucursales) {
      for (const producto of productos) {
        // Verificar si ya existe
        const existe = await getAll(
          'SELECT id FROM stock_sucursales WHERE producto_id = ? AND sucursal_id = ?',
          [producto.id, sucursal.id]
        );

        if (existe.length === 0) {
          // Si es la primera sucursal (Casa Central), asignar todo el stock actual
          // Para las demás sucursales, inicializar en 0
          const stockInicial = sucursal.id === 1 ? producto.stock_actual : 0;

          await runQuery(`
            INSERT INTO stock_sucursales (producto_id, sucursal_id, stock_actual, stock_minimo)
            VALUES (?, ?, ?, ?)
          `, [producto.id, sucursal.id, stockInicial, producto.stock_minimo || 0]);

          insertados++;
        } else {
          actualizados++;
        }
      }
    }

    console.log(`✅ Inicialización completada:`);
    console.log(`   - Registros insertados: ${insertados}`);
    console.log(`   - Registros ya existentes: ${actualizados}`);
    console.log(`   - Total procesado: ${insertados + actualizados}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar stock:', error);
    process.exit(1);
  }
};

inicializarStockSucursales();