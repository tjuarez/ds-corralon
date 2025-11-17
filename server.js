import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { tenantMiddleware, checkTenantAccess } from './backend/middleware/tenant.js';
import { authMiddleware } from './backend/middleware/auth.js';
import authRoutes from './backend/routes/auth.js';
import clientesRoutes from './backend/routes/clientes.js';
import categoriasRoutes from './backend/routes/categorias.js';
import productosRoutes from './backend/routes/productos.js';
import proveedoresRoutes from './backend/routes/proveedores.js';
import presupuestosRoutes from './backend/routes/presupuestos.js';
import ventasRoutes from './backend/routes/ventas.js';
import comprasRoutes from './backend/routes/compras.js';
import uploadRoutes from './backend/routes/upload.js';
import cuentaCorrienteRoutes from './backend/routes/cuentaCorriente.js';
import cajaRoutes from './backend/routes/caja.js';
import reportesRoutes from './backend/routes/reportes.js';
import sucursalesRoutes from './backend/routes/sucursales.js';
import usuariosRoutes from './backend/routes/usuarios.js';
import stockSucursalesRoutes from './backend/routes/stockSucursales.js';
import configuracionRoutes from './backend/routes/configuracion.js';
import movimientosStockRoutes from './backend/routes/movimientosStock.js';
import empresasRoutes from './backend/routes/empresas.js';

// Configuración de variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad y compresión
app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitado para desarrollo
}));
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - Configuración para desarrollo y producción
const allowedOrigins = [
  'http://localhost:5173',
  'https://corralon.dogosoftware.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como Postman, mobile apps, same-origin)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS no permitido'), false);
    }
    
    return callback(null, true);
  },
  credentials: true
}));

// Servir archivos estáticos (uploads, imágenes de productos, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta de salud (sin tenant)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'DS-Corralón API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// ========== RUTAS PÚBLICAS (SIN TENANT) ==========
app.use('/api/auth', authRoutes);

// ========== RUTAS DE SUPER-ADMIN (SIN TENANT) ==========
app.use('/api/super-admin/empresas', empresasRoutes);

// ========== RUTAS CON TENANT ==========
// Todas las rutas con /:tenant/ requieren validación de tenant y autenticación

app.use('/api/:tenant/clientes', tenantMiddleware, authMiddleware, checkTenantAccess, clientesRoutes);
app.use('/api/:tenant/categorias', tenantMiddleware, authMiddleware, checkTenantAccess, categoriasRoutes);
app.use('/api/:tenant/productos', tenantMiddleware, authMiddleware, checkTenantAccess, productosRoutes);
app.use('/api/:tenant/proveedores', tenantMiddleware, authMiddleware, checkTenantAccess, proveedoresRoutes);
app.use('/api/:tenant/presupuestos', tenantMiddleware, authMiddleware, checkTenantAccess, presupuestosRoutes);
app.use('/api/:tenant/ventas', tenantMiddleware, authMiddleware, checkTenantAccess, ventasRoutes);
app.use('/api/:tenant/compras', tenantMiddleware, authMiddleware, checkTenantAccess, comprasRoutes);
app.use('/api/:tenant/cuenta-corriente', tenantMiddleware, authMiddleware, checkTenantAccess, cuentaCorrienteRoutes);
app.use('/api/:tenant/upload', tenantMiddleware, authMiddleware, checkTenantAccess, uploadRoutes);
app.use('/api/:tenant/caja', tenantMiddleware, authMiddleware, checkTenantAccess, cajaRoutes);
app.use('/api/:tenant/reportes', tenantMiddleware, authMiddleware, checkTenantAccess, reportesRoutes);
app.use('/api/:tenant/sucursales', tenantMiddleware, authMiddleware, checkTenantAccess, sucursalesRoutes);
app.use('/api/:tenant/usuarios', tenantMiddleware, authMiddleware, checkTenantAccess, usuariosRoutes);
app.use('/api/:tenant/stock-sucursales', tenantMiddleware, authMiddleware, checkTenantAccess, stockSucursalesRoutes);
app.use('/api/:tenant/configuracion', tenantMiddleware, authMiddleware, checkTenantAccess, configuracionRoutes);
app.use('/api/:tenant/movimientos-stock', tenantMiddleware, authMiddleware, checkTenantAccess, movimientosStockRoutes);

// En producción, servir el frontend compilado
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
  });
}

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  //console.log(`🚀 Servidor DS-Corralón ejecutándose en http://localhost:${PORT}`);
  //console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  //console.log(`🏢 Multi-tenant: Activado`);
  void(0);
});