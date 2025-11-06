import { runQuery } from './database.js';

const addCotizacionMomento = async () => {
  console.log('🔄 Agregando campo cotizacion_momento a tablas...');

  try {
    // Agregar a tabla ventas
    await runQuery(`
      ALTER TABLE ventas ADD COLUMN cotizacion_momento DECIMAL(10, 4) DEFAULT NULL
    `);
    console.log('✅ Campo agregado a tabla ventas');

    // Agregar a tabla presupuestos
    await runQuery(`
      ALTER TABLE presupuestos ADD COLUMN cotizacion_momento DECIMAL(10, 4) DEFAULT NULL
    `);
    console.log('✅ Campo agregado a tabla presupuestos');

    // Agregar a tabla compras
    await runQuery(`
      ALTER TABLE compras ADD COLUMN cotizacion_momento DECIMAL(10, 4) DEFAULT NULL
    `);
    console.log('✅ Campo agregado a tabla compras');

    console.log('✅ Migración completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
};

addCotizacionMomento();