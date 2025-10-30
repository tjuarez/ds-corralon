import db, { runQuery, getOne } from './database.js';

const seedDatabase = async () => {
  console.log('🌱 Iniciando carga masiva de datos...\n');

  try {
    // ============================================
    // 1. CATEGORÍAS
    // ============================================
    console.log('📦 Creando categorías...');

    const categorias = [
      { nombre: 'Materiales de Construcción', descripcion: 'Materiales básicos para construcción', parent_id: null },
      { nombre: 'Herramientas', descripcion: 'Herramientas manuales y eléctricas', parent_id: null },
      { nombre: 'Sanitarios', descripcion: 'Productos sanitarios y grifería', parent_id: null },
      { nombre: 'Electricidad', descripcion: 'Materiales eléctricos', parent_id: null },
      { nombre: 'Pinturas', descripcion: 'Pinturas y accesorios', parent_id: null },
    ];

    const categoriasIds = {};

    for (const cat of categorias) {
      const result = await runQuery(
        'INSERT INTO categorias (nombre, descripcion, parent_id, activa) VALUES (?, ?, ?, 1)',
        [cat.nombre, cat.descripcion, cat.parent_id]
      );
      categoriasIds[cat.nombre] = result.id;
      console.log(`  ✓ ${cat.nombre}`);
    }

    // Subcategorías
    const subcategorias = [
      { nombre: 'Cemento y Cal', parent: 'Materiales de Construcción' },
      { nombre: 'Arena y Piedra', parent: 'Materiales de Construcción' },
      { nombre: 'Ladrillos', parent: 'Materiales de Construcción' },
      { nombre: 'Herramientas Manuales', parent: 'Herramientas' },
      { nombre: 'Herramientas Eléctricas', parent: 'Herramientas' },
      { nombre: 'Inodoros y Bidets', parent: 'Sanitarios' },
      { nombre: 'Griferías', parent: 'Sanitarios' },
    ];

    for (const subcat of subcategorias) {
      const result = await runQuery(
        'INSERT INTO categorias (nombre, descripcion, parent_id, activa) VALUES (?, ?, ?, 1)',
        [subcat.nombre, '', categoriasIds[subcat.parent]]
      );
      categoriasIds[subcat.nombre] = result.id;
      console.log(`  ✓ ${subcat.nombre} (subcategoría)`);
    }

    console.log(`✅ ${categorias.length + subcategorias.length} categorías creadas\n`);

    // ============================================
    // 2. CLIENTES
    // ============================================
    console.log('👥 Creando clientes...');

    const clientes = [
      {
        tipo: 'minorista',
        razon_social: 'Juan Pérez',
        nombre_fantasia: '',
        cuit_dni: '20-35678901-2',
        telefono: '11 4567-8901',
        email: 'juan.perez@email.com',
        direccion: 'Av. Rivadavia 1234',
        pais: 'AR',
        provincia: 'Buenos Aires',
        localidad: 'La Plata',
        codigo_postal: '1900',
        limite_credito: 50000,
        condicion_pago: 'cuenta_corriente'
      },
      {
        tipo: 'mayorista',
        razon_social: 'Construcciones García S.A.',
        nombre_fantasia: 'García Construcciones',
        cuit_dni: '30-71234567-8',
        telefono: '11 2345-6789',
        email: 'contacto@garciaconstrucciones.com',
        direccion: 'Calle 50 N° 456',
        pais: 'AR',
        provincia: 'Buenos Aires',
        localidad: 'La Plata',
        codigo_postal: '1900',
        limite_credito: 500000,
        condicion_pago: '30_dias'
      },
      {
        tipo: 'obra',
        razon_social: 'Desarrollos Urbanos del Sur S.R.L.',
        nombre_fantasia: 'DUS Construcciones',
        cuit_dni: '30-98765432-1',
        telefono: '221 555-1234',
        email: 'info@dusconstrucciones.com',
        direccion: 'Diagonal 74 N° 789',
        pais: 'AR',
        provincia: 'Buenos Aires',
        localidad: 'La Plata',
        codigo_postal: '1900',
        limite_credito: 1000000,
        condicion_pago: '60_dias'
      },
      {
        tipo: 'minorista',
        razon_social: 'María Rodríguez',
        nombre_fantasia: '',
        cuit_dni: '27-28901234-5',
        telefono: '11 6789-0123',
        email: 'maria.rodriguez@email.com',
        direccion: 'Calle 7 N° 321',
        pais: 'AR',
        provincia: 'Buenos Aires',
        localidad: 'La Plata',
        codigo_postal: '1900',
        limite_credito: 30000,
        condicion_pago: 'contado'
      },
      {
        tipo: 'mayorista',
        razon_social: 'Ferretería El Tornillo S.A.',
        nombre_fantasia: 'El Tornillo',
        cuit_dni: '30-65432109-8',
        telefono: '221 444-5555',
        email: 'ventas@eltornillo.com',
        direccion: 'Av. 7 N° 1500',
        pais: 'AR',
        provincia: 'Buenos Aires',
        localidad: 'La Plata',
        codigo_postal: '1900',
        limite_credito: 300000,
        condicion_pago: '30_dias'
      },
      {
        tipo: 'minorista',
        razon_social: 'Carlos Fernández',
        nombre_fantasia: '',
        cuit_dni: '20-30123456-7',
        telefono: '11 3456-7890',
        email: 'carlos.fernandez@email.com',
        direccion: 'Calle 13 N° 678',
        pais: 'AR',
        provincia: 'Buenos Aires',
        localidad: 'La Plata',
        codigo_postal: '1900',
        limite_credito: 40000,
        condicion_pago: 'cuenta_corriente'
      },
      {
        tipo: 'obra',
        razon_social: 'Constructora Los Tilos S.A.',
        nombre_fantasia: 'Los Tilos',
        cuit_dni: '30-55667788-9',
        telefono: '221 666-7777',
        email: 'obras@lostilos.com',
        direccion: 'Av. 13 N° 2100',
        pais: 'AR',
        provincia: 'Buenos Aires',
        localidad: 'La Plata',
        codigo_postal: '1900',
        limite_credito: 800000,
        condicion_pago: '90_dias'
      }
    ];

    for (const cliente of clientes) {
      await runQuery(
        `INSERT INTO clientes (
          tipo_cliente, razon_social, nombre_fantasia, cuit_dni, telefono, email,
          direccion, pais, localidad, provincia, codigo_postal, 
          limite_credito, condicion_pago, lista_precio_id, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
        [
          cliente.tipo, cliente.razon_social, cliente.nombre_fantasia,
          cliente.cuit_dni, cliente.telefono, cliente.email,
          cliente.direccion, cliente.pais, cliente.localidad, cliente.provincia,
          cliente.codigo_postal, cliente.limite_credito, cliente.condicion_pago
        ]
      );
      console.log(`  ✓ ${cliente.razon_social} (${cliente.tipo})`);
    }

    console.log(`✅ ${clientes.length} clientes creados\n`);

    // ============================================
    // 3. PROVEEDORES
    // ============================================
    console.log('🏢 Creando proveedores...');

    const proveedores = [
      {
        razon_social: 'Distribuidora Materiales del Sur S.A.',
        nombre_fantasia: 'Materiales del Sur',
        cuit_dni: '30-71234567-8',
        telefono: '221 555-1000',
        email: 'ventas@materialesdelsur.com.ar',
        direccion: 'Av. Industrial 1500',
        pais: 'AR',
        provincia: 'Buenos Aires',
        localidad: 'La Plata',
        codigo_postal: '1900',
        sitio_web: 'https://www.materialesdelsur.com.ar',
        condicion_pago: '30_dias',
        observaciones: 'Proveedor principal de cemento y áridos. Descuento por volumen.',
      },
      {
        razon_social: 'Loma Negra C.I.A.S.A.',
        nombre_fantasia: 'Loma Negra',
        cuit_dni: '30-50000024-4',
        telefono: '0800-555-5662',
        email: 'contacto@lomanegra.com',
        direccion: 'Bouchard 680 Piso 16',
        pais: 'AR',
        provincia: 'Buenos Aires',
        localidad: 'Buenos Aires',
        codigo_postal: '1106',
        sitio_web: 'https://www.lomanegra.com',
        condicion_pago: '60_dias',
        observaciones: 'Fábrica de cemento. Pedidos mínimos de 100 bolsas.',
      },
      {
        razon_social: 'Acindar Industria Argentina de Aceros S.A.',
        nombre_fantasia: 'Acindar',
        cuit_dni: '30-50279317-5',
        telefono: '0800-222-4632',
        email: 'ventas@acindar.com.ar',
        direccion: 'Av. Libertador 1068',
        pais: 'AR',
        provincia: 'Buenos Aires',
        localidad: 'Villa Constitución',
        codigo_postal: '2919',
        sitio_web: 'https://www.acindar.com.ar',
        condicion_pago: '90_dias',
        observaciones: 'Proveedor de hierro y acero. Entrega directa desde fábrica.',
      },
      {
        razon_social: 'Ferrum S.A.',
        nombre_fantasia: 'Ferrum',
        cuit_dni: '30-50004179-0',
        telefono: '0800-333-3778',
        email: 'atencion@ferrum.com.ar',
        direccion: 'Ruta 8 Km 60',
        pais: 'AR',
        provincia: 'Buenos Aires',
        localidad: 'Pilar',
        codigo_postal: '1629',
        sitio_web: 'https://www.ferrum.com.ar',
        condicion_pago: '60_dias',
        observaciones: 'Sanitarios y griferías. Garantía extendida.',
      },
      {
        razon_social: 'Alba Pinturas S.R.L.',
        nombre_fantasia: 'Alba',
        cuit_dni: '30-68901234-7',
        telefono: '221 488-5000',
        email: 'info@albapinturas.com',
        direccion: 'Calle 116 N° 2345',
        pais: 'AR',
        provincia: 'Buenos Aires',
        localidad: 'La Plata',
        codigo_postal: '1900',
        sitio_web: 'https://www.albapinturas.com',
        condicion_pago: '30_dias',
        observaciones: 'Pinturas y revestimientos. Envíos gratuitos por +20L.',
      },
      {
        razon_social: 'Electro Import S.A.',
        nombre_fantasia: 'Electro Import',
        cuit_dni: '30-70555666-3',
        telefono: '11 4555-7890',
        email: 'ventas@electroimport.com.ar',
        direccion: 'Av. Corrientes 3456',
        pais: 'AR',
        provincia: 'Buenos Aires',
        localidad: 'Buenos Aires',
        codigo_postal: '1194',
        sitio_web: 'https://www.electroimport.com.ar',
        condicion_pago: 'cuenta_corriente',
        observaciones: 'Materiales eléctricos importados. Stock limitado.',
      },
      {
        razon_social: 'Herramientas Profesionales del Plata S.R.L.',
        nombre_fantasia: 'Herraplata',
        cuit_dni: '30-71888999-4',
        telefono: '221 421-8000',
        email: 'consultas@herraplata.com',
        direccion: 'Diagonal 80 N° 1234',
        pais: 'AR',
        provincia: 'Buenos Aires',
        localidad: 'La Plata',
        codigo_postal: '1900',
        sitio_web: 'https://www.herraplata.com',
        condicion_pago: '30_dias',
        observaciones: 'Herramientas manuales y eléctricas. Representante de Bosch y Stanley.',
      },
      {
        razon_social: 'Cerámica San Lorenzo S.A.I.C.',
        nombre_fantasia: 'San Lorenzo',
        cuit_dni: '30-52451526-2',
        telefono: '0800-444-7265',
        email: 'comercial@sanlorenzo.com.ar',
        direccion: 'Ruta 11 Km 468',
        pais: 'AR',
        provincia: 'Santa Fe',
        localidad: 'San Lorenzo',
        codigo_postal: '2200',
        sitio_web: 'https://www.sanlorenzo.com.ar',
        condicion_pago: '60_dias',
        observaciones: 'Ladrillos y cerámicos. Entrega en planta o flete coordinado.',
      },
      {
        razon_social: 'FV S.A.',
        nombre_fantasia: 'FV',
        cuit_dni: '30-50108752-9',
        telefono: '0810-666-3838',
        email: 'ventas@fv-sa.com',
        direccion: 'José Barros Pazos 5160',
        pais: 'AR',
        provincia: 'Buenos Aires',
        localidad: 'Buenos Aires',
        codigo_postal: '1437',
        sitio_web: 'https://www.fv-sa.com',
        condicion_pago: '60_dias',
        observaciones: 'Griferías premium. Catálogo completo disponible.',
      },
      {
        razon_social: 'Prysmian Cables y Sistemas Argentina S.A.',
        nombre_fantasia: 'Prysmian',
        cuit_dni: '30-50711433-8',
        telefono: '0800-122-7797',
        email: 'info.ar@prysmiangroup.com',
        direccion: 'Panamericana Km 37.5',
        pais: 'AR',
        provincia: 'Buenos Aires',
        localidad: 'Del Viso',
        codigo_postal: '1669',
        sitio_web: 'https://www.prysmiangroup.com',
        condicion_pago: '90_dias',
        observaciones: 'Cables eléctricos. Certificaciones internacionales.',
      },
    ];

    const proveedoresIds = {};

    for (const prov of proveedores) {
      const result = await runQuery(
        `INSERT INTO proveedores (
          razon_social, nombre_fantasia, cuit_dni, telefono, email,
          direccion, pais, localidad, provincia, codigo_postal, sitio_web,
          condicion_pago, observaciones, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          prov.razon_social, prov.nombre_fantasia, prov.cuit_dni,
          prov.telefono, prov.email, prov.direccion, prov.pais,
          prov.localidad, prov.provincia, prov.codigo_postal,
          prov.sitio_web, prov.condicion_pago, prov.observaciones
        ]
      );
      proveedoresIds[prov.nombre_fantasia] = result.id;
      console.log(`  ✓ ${prov.razon_social}`);
    }

    // Agregar contactos a algunos proveedores
    const contactos = [
      { proveedor: 'Materiales del Sur', nombre: 'Carlos Gómez', cargo: 'Gerente de Ventas', telefono: '221 555-1001', email: 'cgomez@materialesdelsur.com.ar', principal: 1 },
      { proveedor: 'Materiales del Sur', nombre: 'Laura Fernández', cargo: 'Administración', telefono: '221 555-1002', email: 'lfernandez@materialesdelsur.com.ar', principal: 0 },
      { proveedor: 'Loma Negra', nombre: 'Roberto Martínez', cargo: 'Representante Comercial', telefono: '0800-555-5663', email: 'rmartinez@lomanegra.com', principal: 1 },
      { proveedor: 'Acindar', nombre: 'Mónica Silva', cargo: 'Atención a Distribuidores', telefono: '0800-222-4633', email: 'msilva@acindar.com.ar', principal: 1 },
      { proveedor: 'Ferrum', nombre: 'Jorge López', cargo: 'Ventas Zona Sur', telefono: '0800-333-3779', email: 'jlopez@ferrum.com.ar', principal: 1 },
      { proveedor: 'Alba', nombre: 'Andrea Benítez', cargo: 'Comercial', telefono: '221 488-5001', email: 'abenitez@albapinturas.com', principal: 1 },
      { proveedor: 'Herraplata', nombre: 'Pablo Rodríguez', cargo: 'Gerente General', telefono: '221 421-8001', email: 'prodriguez@herraplata.com', principal: 1 },
    ];

    for (const contacto of contactos) {
      const proveedorId = proveedoresIds[contacto.proveedor];
      if (proveedorId) {
        await runQuery(
          `INSERT INTO proveedores_contactos (proveedor_id, nombre, cargo, telefono, email, principal)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [proveedorId, contacto.nombre, contacto.cargo, contacto.telefono, contacto.email, contacto.principal]
        );
      }
    }

    console.log(`✅ ${proveedores.length} proveedores creados con ${contactos.length} contactos\n`);

    // ============================================
    // 3. PRODUCTOS
    // ============================================
    console.log('📦 Creando productos...');

    const productos = [
      {
        codigo: 'CEM-001',
        descripcion: 'Cemento Portland x 50kg',
        categoria: 'Cemento y Cal',
        marca: 'Loma Negra',
        proveedor: 'Loma Negra',
        unidad: 'bolsa',
        stock_actual: 250,
        stock_minimo: 50,
        ubicacion: 'Depósito A - Est. 1',
        precios: [
          { lista: 1, moneda: 1, precio: 8500 },
          { lista: 1, moneda: 2, precio: 8.5 },
          { lista: 2, moneda: 1, precio: 7800 },
          { lista: 2, moneda: 2, precio: 7.8 },
          { lista: 3, moneda: 1, precio: 7200 },
          { lista: 3, moneda: 2, precio: 7.2 }
        ]
      },
      {
        codigo: 'LAD-001',
        descripcion: 'Ladrillo Hueco 8cm x 18cm x 33cm',
        categoria: 'Ladrillos',
        marca: 'Cerámica San Lorenzo',
        proveedor: 'San Lorenzo',
        unidad: 'unidad',
        stock_actual: 5000,
        stock_minimo: 1000,
        ubicacion: 'Patio Exterior',
        precios: [
          { lista: 1, moneda: 1, precio: 180 },
          { lista: 1, moneda: 2, precio: 0.18 },
          { lista: 2, moneda: 1, precio: 165 },
          { lista: 2, moneda: 2, precio: 0.165 },
          { lista: 3, moneda: 1, precio: 155 },
          { lista: 3, moneda: 2, precio: 0.155 }
        ]
      },
      {
        codigo: 'ARE-001',
        descripcion: 'Arena Fina x m³',
        categoria: 'Arena y Piedra',
        marca: '',
        proveedor: 'Materiales del Sur',
        unidad: 'metro3',
        stock_actual: 50,
        stock_minimo: 10,
        ubicacion: 'Patio - Sector Arena',
        precios: [
          { lista: 1, moneda: 1, precio: 18000 },
          { lista: 1, moneda: 2, precio: 18 },
          { lista: 2, moneda: 1, precio: 16500 },
          { lista: 2, moneda: 2, precio: 16.5 },
          { lista: 3, moneda: 1, precio: 15500 },
          { lista: 3, moneda: 2, precio: 15.5 }
        ]
      },
      {
        codigo: 'HIER-001',
        descripcion: 'Hierro de Construcción 8mm x 12m',
        categoria: 'Materiales de Construcción',
        marca: 'Acindar',
        proveedor: 'Acindar',
        unidad: 'unidad',
        stock_actual: 180,
        stock_minimo: 30,
        ubicacion: 'Depósito B',
        precios: [
          { lista: 1, moneda: 1, precio: 6500 },
          { lista: 1, moneda: 2, precio: 6.5 },
          { lista: 2, moneda: 1, precio: 6000 },
          { lista: 2, moneda: 2, precio: 6 },
          { lista: 3, moneda: 1, precio: 5600 },
          { lista: 3, moneda: 2, precio: 5.6 }
        ]
      },
      {
        codigo: 'PINT-001',
        descripcion: 'Pintura Látex Interior Blanco x 20L',
        categoria: 'Pinturas',
        marca: 'Alba',
        proveedor: 'Alba',
        unidad: 'unidad',
        stock_actual: 45,
        stock_minimo: 10,
        ubicacion: 'Depósito C - Est. 3',
        precios: [
          { lista: 1, moneda: 1, precio: 28000 },
          { lista: 1, moneda: 2, precio: 28 },
          { lista: 2, moneda: 1, precio: 26000 },
          { lista: 2, moneda: 2, precio: 26 },
          { lista: 3, moneda: 1, precio: 24500 },
          { lista: 3, moneda: 2, precio: 24.5 }
        ]
      },
      {
        codigo: 'HERR-001',
        descripcion: 'Pala Ancha Mango Largo',
        categoria: 'Herramientas Manuales',
        marca: 'Bellota',
        proveedor: 'Herraplata',
        unidad: 'unidad',
        stock_actual: 25,
        stock_minimo: 5,
        ubicacion: 'Depósito D - Est. 1',
        precios: [
          { lista: 1, moneda: 1, precio: 15000 },
          { lista: 1, moneda: 2, precio: 15 },
          { lista: 2, moneda: 1, precio: 13800 },
          { lista: 2, moneda: 2, precio: 13.8 },
          { lista: 3, moneda: 1, precio: 13000 },
          { lista: 3, moneda: 2, precio: 13 }
        ]
      },
      {
        codigo: 'HERR-002',
        descripcion: 'Taladro Percutor 13mm 650W',
        categoria: 'Herramientas Eléctricas',
        marca: 'Bosch',
        proveedor: 'Herraplata',
        unidad: 'unidad',
        stock_actual: 8,
        stock_minimo: 3,
        ubicacion: 'Depósito D - Est. 2',
        precios: [
          { lista: 1, moneda: 1, precio: 95000 },
          { lista: 1, moneda: 2, precio: 95 },
          { lista: 2, moneda: 1, precio: 88000 },
          { lista: 2, moneda: 2, precio: 88 },
          { lista: 3, moneda: 1, precio: 83000 },
          { lista: 3, moneda: 2, precio: 83 }
        ]
      },
      {
        codigo: 'SAN-001',
        descripcion: 'Inodoro Largo con Mochila',
        categoria: 'Inodoros y Bidets',
        marca: 'Ferrum',
        proveedor: 'Ferrum',
        unidad: 'unidad',
        stock_actual: 12,
        stock_minimo: 3,
        ubicacion: 'Depósito E',
        precios: [
          { lista: 1, moneda: 1, precio: 75000 },
          { lista: 1, moneda: 2, precio: 75 },
          { lista: 2, moneda: 1, precio: 69000 },
          { lista: 2, moneda: 2, precio: 69 },
          { lista: 3, moneda: 1, precio: 65000 },
          { lista: 3, moneda: 2, precio: 65 }
        ]
      },
      {
        codigo: 'GRIF-001',
        descripcion: 'Canilla Monocomando Cocina',
        categoria: 'Griferías',
        marca: 'FV',
        proveedor: 'FV',
        unidad: 'unidad',
        stock_actual: 18,
        stock_minimo: 5,
        ubicacion: 'Depósito E - Est. 2',
        precios: [
          { lista: 1, moneda: 1, precio: 32000 },
          { lista: 1, moneda: 2, precio: 32 },
          { lista: 2, moneda: 1, precio: 29500 },
          { lista: 2, moneda: 2, precio: 29.5 },
          { lista: 3, moneda: 1, precio: 27800 },
          { lista: 3, moneda: 2, precio: 27.8 }
        ]
      },
      {
        codigo: 'ELEC-001',
        descripcion: 'Cable Unipolar 2.5mm x 100m',
        categoria: 'Electricidad',
        marca: 'Prysmian',
        proveedor: 'Prysmian',
        unidad: 'unidad',
        stock_actual: 35,
        stock_minimo: 8,
        ubicacion: 'Depósito F - Est. 1',
        precios: [
          { lista: 1, moneda: 1, precio: 42000 },
          { lista: 1, moneda: 2, precio: 42 },
          { lista: 2, moneda: 1, precio: 38500 },
          { lista: 2, moneda: 2, precio: 38.5 },
          { lista: 3, moneda: 1, precio: 36200 },
          { lista: 3, moneda: 2, precio: 36.2 }
        ]
      },
      {
        codigo: 'CEM-002',
        descripcion: 'Cal Hidratada x 25kg',
        categoria: 'Cemento y Cal',
        marca: 'Loma Negra',
        proveedor: 'Loma Negra',
        unidad: 'bolsa',
        stock_actual: 120,
        stock_minimo: 25,
        ubicacion: 'Depósito A - Est. 2',
        precios: [
          { lista: 1, moneda: 1, precio: 3500 },
          { lista: 1, moneda: 2, precio: 3.5 },
          { lista: 2, moneda: 1, precio: 3200 },
          { lista: 2, moneda: 2, precio: 3.2 },
          { lista: 3, moneda: 1, precio: 3000 },
          { lista: 3, moneda: 2, precio: 3 }
        ]
      },
      {
        codigo: 'PIE-001',
        descripcion: 'Piedra Partida 6-20mm x m³',
        categoria: 'Arena y Piedra',
        marca: '',
        proveedor: 'Materiales del Sur',
        unidad: 'metro3',
        stock_actual: 40,
        stock_minimo: 10,
        ubicacion: 'Patio - Sector Piedra',
        precios: [
          { lista: 1, moneda: 1, precio: 22000 },
          { lista: 1, moneda: 2, precio: 22 },
          { lista: 2, moneda: 1, precio: 20000 },
          { lista: 2, moneda: 2, precio: 20 },
          { lista: 3, moneda: 1, precio: 18800 },
          { lista: 3, moneda: 2, precio: 18.8 }
        ]
      },
      {
        codigo: 'PINT-002',
        descripcion: 'Enduido Plástico Interior x 30kg',
        categoria: 'Pinturas',
        marca: 'Ferma',
        proveedor: 'Alba',
        unidad: 'bolsa',
        stock_actual: 60,
        stock_minimo: 15,
        ubicacion: 'Depósito C - Est. 2',
        precios: [
          { lista: 1, moneda: 1, precio: 12500 },
          { lista: 1, moneda: 2, precio: 12.5 },
          { lista: 2, moneda: 1, precio: 11500 },
          { lista: 2, moneda: 2, precio: 11.5 },
          { lista: 3, moneda: 1, precio: 10800 },
          { lista: 3, moneda: 2, precio: 10.8 }
        ]
      },
      {
        codigo: 'ELEC-002',
        descripcion: 'Toma Corriente 10A con Tierra',
        categoria: 'Electricidad',
        marca: 'Cambre',
        proveedor: 'Electro Import',
        unidad: 'unidad',
        stock_actual: 85,
        stock_minimo: 20,
        ubicacion: 'Depósito F - Est. 3',
        precios: [
          { lista: 1, moneda: 1, precio: 1800 },
          { lista: 1, moneda: 2, precio: 1.8 },
          { lista: 2, moneda: 1, precio: 1650 },
          { lista: 2, moneda: 2, precio: 1.65 },
          { lista: 3, moneda: 1, precio: 1550 },
          { lista: 3, moneda: 2, precio: 1.55 }
        ]
      },
      {
        codigo: 'HERR-003',
        descripcion: 'Nivel de Burbuja Aluminio 60cm',
        categoria: 'Herramientas Manuales',
        marca: 'Stanley',
        proveedor: 'Herraplata',
        unidad: 'unidad',
        stock_actual: 15,
        stock_minimo: 5,
        ubicacion: 'Depósito D - Est. 1',
        precios: [
          { lista: 1, moneda: 1, precio: 18500 },
          { lista: 1, moneda: 2, precio: 18.5 },
          { lista: 2, moneda: 1, precio: 17000 },
          { lista: 2, moneda: 2, precio: 17 },
          { lista: 3, moneda: 1, precio: 16000 },
          { lista: 3, moneda: 2, precio: 16 }
        ]
      }
    ];

    for (const prod of productos) {
      // Obtener el proveedor_id si existe
      const proveedorId = prod.proveedor ? proveedoresIds[prod.proveedor] : null;

      // Insertar producto
      const result = await runQuery(
        `INSERT INTO productos (
          codigo, descripcion, categoria_id, marca, unidad_medida,
          stock_actual, stock_minimo, ubicacion, proveedor_id, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          prod.codigo,
          prod.descripcion,
          categoriasIds[prod.categoria],
          prod.marca,
          prod.unidad,
          prod.stock_actual,
          prod.stock_minimo,
          prod.ubicacion,
          proveedorId
        ]
      );

      const productoId = result.id;

      // Insertar precios
      for (const precio of prod.precios) {
        await runQuery(
          `INSERT INTO productos_precios (
            producto_id, lista_precio_id, moneda_id, precio, fecha_desde
          ) VALUES (?, ?, ?, ?, date('now'))`,
          [productoId, precio.lista, precio.moneda, precio.precio]
        );
      }

      console.log(`  ✓ ${prod.codigo} - ${prod.descripcion}`);
    }

    console.log(`✅ ${productos.length} productos creados\n`);

    // ============================================
    // RESUMEN
    // ============================================
    console.log('═══════════════════════════════════════');
    console.log('🎉 CARGA MASIVA COMPLETADA');
    console.log('═══════════════════════════════════════');
    console.log(`📦 Categorías: ${categorias.length + subcategorias.length}`);
    console.log(`👥 Clientes: ${clientes.length}`);
    console.log(`🏢 Proveedores: ${proveedores.length}`);
    console.log(`📦 Productos: ${productos.length}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error durante la carga de datos:', error);
    process.exit(1);
  }

  process.exit(0);
};

// Ejecutar
seedDatabase();