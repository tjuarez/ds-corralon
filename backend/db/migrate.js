import db, { runQuery } from './database.js';

const migrations = [
  // 1. Tabla de sucursales
  `CREATE TABLE IF NOT EXISTS sucursales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    pais VARCHAR(100),
    provincia VARCHAR(100),
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(10),
    telefono VARCHAR(50),
    email VARCHAR(100),
    responsable VARCHAR(100),
    activa BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 2. Tabla de usuarios
  `CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('admin', 'vendedor', 'cajero')),
    sucursal_id INTEGER,
    activo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
  )`,

  // 3. Tabla de configuración del corralón
  `CREATE TABLE IF NOT EXISTS configuracion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clave TEXT UNIQUE NOT NULL,
    valor TEXT,
    tipo TEXT DEFAULT 'string',
    descripcion TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 4. Tabla de monedas
  `CREATE TABLE IF NOT EXISTS monedas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    simbolo TEXT NOT NULL,
    activa INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 5. Tabla de tipos de cambio
  `CREATE TABLE IF NOT EXISTS tipos_cambio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    moneda_origen_id INTEGER NOT NULL,
    moneda_destino_id INTEGER NOT NULL,
    tasa REAL NOT NULL,
    fecha DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (moneda_origen_id) REFERENCES monedas(id),
    FOREIGN KEY (moneda_destino_id) REFERENCES monedas(id)
  )`,

  // 6. Tabla de clientes
  `CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_cliente TEXT NOT NULL CHECK(tipo_cliente IN ('minorista', 'mayorista', 'obra')),
    razon_social TEXT NOT NULL,
    nombre_fantasia TEXT,
    cuit_dni TEXT UNIQUE,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    pais TEXT DEFAULT 'AR',
    localidad TEXT,
    provincia TEXT,
    codigo_postal TEXT,
    condicion_pago TEXT DEFAULT 'contado',
    lista_precio_id INTEGER,
    nivel_fidelizacion TEXT DEFAULT 'bronce' CHECK(nivel_fidelizacion IN ('bronce', 'plata', 'oro')),
    puntos_fidelizacion INTEGER DEFAULT 0,
    observaciones TEXT,
    activo INTEGER DEFAULT 1,
    limite_credito DECIMAL(10, 2) DEFAULT 0,
    saldo_cuenta_corriente DECIMAL(10, 2) DEFAULT 0,
    dias_vencimiento_cc INTEGER DEFAULT 30,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 7. Tabla de contactos de clientes
  `CREATE TABLE IF NOT EXISTS clientes_contactos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    cargo TEXT,
    telefono TEXT,
    email TEXT,
    principal INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
  )`,

  // 8. Tabla de proveedores
  `CREATE TABLE IF NOT EXISTS proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    razon_social TEXT NOT NULL,
    nombre_fantasia TEXT,
    cuit_dni TEXT UNIQUE,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    pais TEXT DEFAULT 'AR',
    localidad TEXT,
    provincia TEXT,
    codigo_postal TEXT,
    sitio_web TEXT,
    condicion_pago TEXT DEFAULT 'cuenta_corriente',
    observaciones TEXT,
    activo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

    // 8.5. Tabla de contactos de proveedores
  `CREATE TABLE IF NOT EXISTS proveedores_contactos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proveedor_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    cargo TEXT,
    telefono TEXT,
    email TEXT,
    principal INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE
  )`,

  // 9. Tabla de categorías de productos
  `CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    parent_id INTEGER,
    activa INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categorias(id)
  )`,

  // 10. Tabla de productos
  `CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    descripcion TEXT NOT NULL,
    categoria_id INTEGER,
    marca TEXT,
    unidad_medida TEXT NOT NULL,
    stock_minimo REAL DEFAULT 0,
    stock_actual REAL DEFAULT 0,
    precio_costo DECIMAL(10, 2) DEFAULT 0,
    ubicacion TEXT,
    proveedor_id INTEGER,
    imagen_url TEXT,
    observaciones TEXT,
    activo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
  )`,

  // 11. Tabla de listas de precios
  `CREATE TABLE IF NOT EXISTS listas_precios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    activa INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 12. Tabla de precios de productos
  `CREATE TABLE IF NOT EXISTS productos_precios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    lista_precio_id INTEGER NOT NULL,
    moneda_id INTEGER NOT NULL,
    precio REAL NOT NULL,
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (lista_precio_id) REFERENCES listas_precios(id),
    FOREIGN KEY (moneda_id) REFERENCES monedas(id)
  )`,

  // 13. Tabla de compras
  `CREATE TABLE IF NOT EXISTS compras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_comprobante VARCHAR(50) UNIQUE NOT NULL,
    numero_factura VARCHAR(50),
    tipo_comprobante VARCHAR(20) NOT NULL,
    proveedor_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    moneda_id INTEGER NOT NULL,
    cotizacion_momento REAL DEFAULT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    descuento_porcentaje DECIMAL(5, 2) DEFAULT 0,
    descuento_monto DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    forma_pago VARCHAR(20) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    observaciones TEXT,
    usuario_id INTEGER,
    sucursal_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    FOREIGN KEY (moneda_id) REFERENCES monedas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
  )`,

  // 14. Tabla de detalle de compras
  `CREATE TABLE IF NOT EXISTS compras_detalle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    compra_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    descripcion TEXT,
    cantidad DECIMAL(10, 2) NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    descuento_porcentaje DECIMAL(5, 2) DEFAULT 0,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
  )`,

  // 15. Tabla de presupuestos
  `CREATE TABLE IF NOT EXISTS presupuestos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT UNIQUE NOT NULL,
    cliente_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    fecha_vencimiento DATE,
    moneda_id INTEGER NOT NULL,
    cotizacion_momento REAL DEFAULT NULL,
    subtotal REAL NOT NULL,
    descuento_porcentaje REAL DEFAULT 0,
    descuento_monto REAL DEFAULT 0,
    impuestos REAL DEFAULT 0,
    total REAL NOT NULL,
    estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'aprobado', 'rechazado', 'convertido')),
    observaciones TEXT,
    sucursal_id INTEGER,
    usuario_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (moneda_id) REFERENCES monedas(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )`,

  // 16. Tabla de detalle de presupuestos
  `CREATE TABLE IF NOT EXISTS presupuestos_detalle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    presupuesto_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    descripcion TEXT,
    cantidad REAL NOT NULL,
    precio_unitario REAL NOT NULL,
    descuento_porcentaje REAL DEFAULT 0,
    subtotal REAL NOT NULL,
    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
  )`,

  // 17. Tabla de ventas
  `CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_comprobante TEXT UNIQUE NOT NULL,
    tipo_comprobante TEXT NOT NULL,
    punto_venta TEXT,
    cliente_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    moneda_id INTEGER NOT NULL,
    cotizacion_momento REAL DEFAULT NULL,
    subtotal REAL NOT NULL,
    descuento_porcentaje REAL DEFAULT 0,
    descuento_monto REAL DEFAULT 0,
    impuestos REAL DEFAULT 0,
    total REAL NOT NULL,
    forma_pago TEXT NOT NULL,
    estado TEXT DEFAULT 'completada' CHECK(estado IN ('completada', 'anulada')),
    cae TEXT,
    cae_vencimiento DATE,
    presupuesto_id INTEGER,
    observaciones TEXT,
    sucursal_id INTEGER,
    usuario_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (moneda_id) REFERENCES monedas(id),
    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )`,

  // 18. Tabla de detalle de ventas
  `CREATE TABLE IF NOT EXISTS ventas_detalle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    descripcion TEXT,
    cantidad REAL NOT NULL,
    precio_unitario REAL NOT NULL,
    descuento_porcentaje REAL DEFAULT 0,
    subtotal REAL NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
  )`,

  // Tabla de pagos de ventas (para pagos mixtos)
  `CREATE TABLE IF NOT EXISTS ventas_pagos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL,
    forma_pago VARCHAR(20) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    observaciones TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
  )`,

  // 19. Tabla de cuenta corriente
  `CREATE TABLE IF NOT EXISTS cuenta_corriente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    saldo_anterior DECIMAL(10, 2) NOT NULL,
    saldo_nuevo DECIMAL(10, 2) NOT NULL,
    concepto TEXT NOT NULL,
    venta_id INTEGER,
    fecha DATE NOT NULL,
    fecha_vencimiento DATE,
    medio_pago VARCHAR(20),
    numero_comprobante VARCHAR(50),
    observaciones TEXT,
    usuario_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )`,

  // 20. Tabla de pagos de clientes
  `CREATE TABLE IF NOT EXISTS pagos_clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    monto REAL NOT NULL,
    moneda_id INTEGER NOT NULL,
    forma_pago TEXT NOT NULL,
    numero_referencia TEXT,
    observaciones TEXT,
    sucursal_id INTEGER,
    usuario_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (moneda_id) REFERENCES monedas(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )`,

  // 21. Tabla de cajas
  `CREATE TABLE IF NOT EXISTS cajas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero INTEGER NOT NULL,
    fecha_apertura DATETIME NOT NULL,
    fecha_cierre DATETIME,
    usuario_apertura_id INTEGER NOT NULL,
    usuario_cierre_id INTEGER,
    sucursal_id INTEGER NOT NULL,
    monto_inicial DECIMAL(10, 2) NOT NULL,
    monto_final DECIMAL(10, 2),
    total_ingresos DECIMAL(10, 2) DEFAULT 0,
    total_egresos DECIMAL(10, 2) DEFAULT 0,
    monto_esperado DECIMAL(10, 2),
    diferencia DECIMAL(10, 2),
    estado VARCHAR(20) DEFAULT 'abierta',
    observaciones_apertura TEXT,
    observaciones_cierre TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_apertura_id) REFERENCES usuarios(id),
    FOREIGN KEY (usuario_cierre_id) REFERENCES usuarios(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
  )`,

  // 22. Tabla de movimientos de caja
  `CREATE TABLE IF NOT EXISTS movimientos_caja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caja_id INTEGER NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL,
    categoria VARCHAR(50),
    monto DECIMAL(10, 2) NOT NULL,
    concepto TEXT NOT NULL,
    venta_id INTEGER,
    pago_cc_id INTEGER,
    numero_comprobante VARCHAR(50),
    usuario_id INTEGER,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE CASCADE,
    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )`,

  // 23. Tabla de movimientos de stock
  `CREATE TABLE IF NOT EXISTS movimientos_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    tipo_movimiento TEXT NOT NULL CHECK(tipo_movimiento IN ('entrada', 'salida', 'ajuste')),
    cantidad REAL NOT NULL,
    stock_anterior REAL NOT NULL,
    stock_nuevo REAL NOT NULL,
    motivo TEXT NOT NULL,
    compra_id INTEGER,
    venta_id INTEGER,
    sucursal_id INTEGER,
    usuario_id INTEGER,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (compra_id) REFERENCES compras(id),
    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )`,

  // 23.5. Tabla de stock por sucursal
  `CREATE TABLE IF NOT EXISTS stock_sucursales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,
    stock_actual DECIMAL(10,2) DEFAULT 0,
    stock_minimo DECIMAL(10,2) DEFAULT 0,
    stock_maximo DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    UNIQUE(producto_id, sucursal_id)
  )`,

  // 23.6. Índices para stock_sucursales
  `CREATE INDEX IF NOT EXISTS idx_stock_sucursales_producto ON stock_sucursales(producto_id)`,
  
  `CREATE INDEX IF NOT EXISTS idx_stock_sucursales_sucursal ON stock_sucursales(sucursal_id)`,
  
  `CREATE INDEX IF NOT EXISTS idx_movimientos_stock_sucursal ON movimientos_stock(sucursal_id)`,

  // 24. Tabla de historial de fidelización
  `CREATE TABLE IF NOT EXISTS fidelizacion_historial (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    puntos INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('ganado', 'canjeado')),
    concepto TEXT NOT NULL,
    venta_id INTEGER,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (venta_id) REFERENCES ventas(id)
  )`
];

// Datos iniciales
const seedData = async () => {
  try {
    console.log('📝 Insertando datos iniciales...');

    // 1. Insertar monedas
    await runQuery(`
      INSERT OR IGNORE INTO monedas (codigo, nombre, simbolo, activa) VALUES
      ('ARS', 'Peso Argentino', '$', 1),
      ('USD', 'Dólar Estadounidense', 'US$', 1)
    `);

    // 2. Insertar listas de precios
    await runQuery(`
      INSERT OR IGNORE INTO listas_precios (nombre, descripcion, activa) VALUES
      ('Minorista', 'Precio para consumidor final', 1),
      ('Mayorista', 'Precio para revendedores', 1),
      ('Obra', 'Precio especial para constructoras', 1)
    `);

    // 3. Insertar sucursal principal
    await runQuery(`
      INSERT OR IGNORE INTO sucursales (codigo, nombre, direccion, pais, provincia, ciudad, activa)
      VALUES ('CASA-CENTRAL', 'Casa Central', 'Av. Principal 123', 'Argentina', 'Buenos Aires', 'Lomas de Zamora', 1)
    `);

    // 4. Insertar usuario administrador por defecto
    // Contraseña: admin123 (deberá cambiarla en el primer login)
    const bcrypt = await import('bcrypt');
    //const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Usuarios por defecto
    const usuarios = [
      {
        username: 'admin',
        nombre: 'Admin',
        apellido: 'Sistema',
        email: 'admin@corralon.com',
        password: bcrypt.hashSync('admin123', 10),
        rol: 'admin',
        sucursal_id: 1,
      },
      {
        username: 'vendedor1',
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@corralon.com',
        password: bcrypt.hashSync('vendedor123', 10),
        rol: 'vendedor',
        sucursal_id: 1,
      },
      {
        username: 'vendedor2',
        nombre: 'Ana',
        apellido: 'Martínez',
        email: 'ana.martinez@corralon.com',
        password: bcrypt.hashSync('vendedor123', 10),
        rol: 'vendedor',
        sucursal_id: 1,
      },
      {
        username: 'cajero1',
        nombre: 'María',
        apellido: 'González',
        email: 'maria.gonzalez@corralon.com',
        password: bcrypt.hashSync('cajero123', 10),
        rol: 'cajero',
        sucursal_id: 1,
      },
      {
        username: 'cajero2',
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        email: 'carlos.rodriguez@corralon.com',
        password: bcrypt.hashSync('cajero123', 10),
        rol: 'cajero',
        sucursal_id: 1,
      },
    ];

    for (const usuario of usuarios) {
      await runQuery(`
        INSERT OR IGNORE INTO usuarios (username, nombre, apellido, email, password, rol, sucursal_id, activo)
        VALUES ('${usuario.username}', '${usuario.nombre}', '${usuario.apellido}', '${usuario.email}', '${usuario.password}', '${usuario.rol}', ${usuario.sucursal_id}, 1)
      `);
    }


    // 5. Insertar configuración básica
    await runQuery(`
      INSERT OR IGNORE INTO configuracion (clave, valor, tipo, descripcion) VALUES
      -- Datos de la Empresa
      ('empresa_razon_social', 'Mi Corralón', 'string', 'Razón social de la empresa'),
      ('empresa_nombre_fantasia', 'Corralón Central', 'string', 'Nombre de fantasía'),
      ('empresa_cuit', '', 'string', 'CUIT de la empresa'),
      ('empresa_condicion_iva', 'responsable_inscripto', 'string', 'Condición frente a IVA'),
      ('empresa_direccion', '', 'string', 'Dirección fiscal'),
      ('empresa_pais', 'Argentina', 'string', 'País'),
      ('empresa_provincia', 'Buenos Aires', 'string', 'Provincia'),
      ('empresa_ciudad', '', 'string', 'Ciudad'),
      ('empresa_codigo_postal', '', 'string', 'Código postal'),
      ('empresa_telefono', '', 'string', 'Teléfono de contacto'),
      ('empresa_email', '', 'string', 'Email de contacto'),
      ('empresa_sitio_web', '', 'string', 'Sitio web'),
      ('empresa_logo_url', '', 'string', 'URL del logo de la empresa'),
      
      -- Configuración de Facturación
      ('facturacion_punto_venta', '1', 'number', 'Punto de venta predeterminado'),
      ('facturacion_proximo_numero_fa', '1', 'number', 'Próximo número de Factura A'),
      ('facturacion_proximo_numero_fb', '1', 'number', 'Próximo número de Factura B'),
      ('facturacion_proximo_numero_fc', '1', 'number', 'Próximo número de Factura C'),
      ('facturacion_proximo_numero_rem', '1', 'number', 'Próximo número de Remito'),
      ('facturacion_proximo_numero_tk', '1', 'number', 'Próximo número de Ticket'),
      ('facturacion_pie_pagina', 'Gracias por su compra', 'string', 'Pie de página en facturas'),
      ('facturacion_terminos', '', 'text', 'Términos y condiciones'),
      ('facturacion_dias_validez_presupuesto', '15', 'number', 'Días de validez de presupuestos'),
      
      -- Monedas y Cotización
      ('moneda_principal', 'ARS', 'string', 'Moneda principal de operación'),
      ('cotizacion_usd_ars', '1000', 'number', 'Cotización USD a ARS'),
      ('cotizacion_fecha_actualizacion', '', 'string', 'Fecha de última actualización de cotización'),
      
      -- Configuración General
      ('iva_porcentaje_defecto', '21', 'number', 'Porcentaje de IVA por defecto'),
      ('puntos_por_peso', '1', 'number', 'Puntos de fidelización por cada peso gastado'),
      ('alerta_stock_bajo_activa', '1', 'boolean', 'Activar alertas de stock bajo'),
      ('umbral_stock_bajo_porcentaje', '20', 'number', 'Porcentaje para considerar stock bajo')
    `);

    console.log('✅ Datos iniciales insertados correctamente');
  } catch (error) {
    console.error('❌ Error al insertar datos iniciales:', error);
  }
};

// Ejecutar migraciones
const runMigrations = async () => {
  console.log('🔄 Iniciando migraciones de base de datos...');
  
  try {
    for (let i = 0; i < migrations.length; i++) {
      await runQuery(migrations[i]);
      console.log(`✅ Migración ${i + 1}/${migrations.length} completada`);
    }
    
    console.log('✅ Todas las migraciones completadas');
    
    // Insertar datos iniciales
    await seedData();
    
    console.log('🎉 Base de datos inicializada correctamente');
    console.log('👤 Usuario por defecto:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ⚠️  IMPORTANTE: Cambiar la contraseña en el primer login');
    
  } catch (error) {
    console.error('❌ Error en las migraciones:', error);
    throw error; // ← CAMBIAR: lanzar error en lugar de exit
  }
};

// Exportar runMigrations para uso desde otros scripts
export { runMigrations };

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}