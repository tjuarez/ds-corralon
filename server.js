import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
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

// CORS - En desarrollo permitir el frontend de Vite
if (process.env.NODE_ENV === 'development') {
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
  }));
}

// Servir archivos estáticos (uploads, imágenes de productos, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes 
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/presupuestos', presupuestosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/cuenta-corriente', cuentaCorrienteRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/sucursales', sucursalesRoutes);

// En producción, servir el frontend compilado
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
  });
}

// Ruta de salud para verificar que el servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'DS-Corralón API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

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
  console.log(`🚀 Servidor DS-Corralón ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});