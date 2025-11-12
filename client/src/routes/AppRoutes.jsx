import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Clientes from '../pages/Clientes';
import ClienteForm from '../pages/ClienteForm';
import ClienteDetalle from '../pages/ClienteDetalle';
import Productos from '../pages/Productos';
import ProductoForm from '../pages/ProductoForm';
import ProductoDetalle from '../pages/ProductoDetalle';
import Proveedores from '../pages/Proveedores';
import ProveedorForm from '../pages/ProveedorForm';
import ProveedorDetalle from '../pages/ProveedorDetalle';
import Presupuestos from '../pages/Presupuestos';
import PresupuestoForm from '../pages/PresupuestoForm';
import PresupuestoDetalle from '../pages/PresupuestoDetalle';
import Ventas from '../pages/Ventas';
import VentaForm from '../pages/VentaForm';
import VentaDetalle from '../pages/VentaDetalle';
import Compras from '../pages/Compras';
import CompraForm from '../pages/CompraForm';
import CompraDetalle from '../pages/CompraDetalle';
import CuentaCorriente from '../pages/CuentaCorriente';
import EstadoCuenta from '../pages/EstadoCuenta';
import RegistrarPago from '../pages/RegistrarPago';
import Caja from '../pages/Caja';
import AbrirCaja from '../pages/AbrirCaja';
import CajaDetalle from '../pages/CajaDetalle';
import RegistrarMovimientoCaja from '../pages/RegistrarMovimientoCaja';
import CerrarCaja from '../pages/CerrarCaja';
import Reportes from '../pages/Reportes';
import ReporteVentas from '../pages/ReporteVentas';
import ReporteProductos from '../pages/ReporteProductos';
import ReporteStock from '../pages/ReporteStock';
import ReporteClientes from '../pages/ReporteClientes';
import ReporteCaja from '../pages/ReporteCaja';
import ReporteRentabilidad from '../pages/ReporteRentabilidad';
import Sucursales from '../pages/Sucursales';
import SucursalForm from '../pages/SucursalForm';
import Usuarios from '../pages/Usuarios';
import UsuarioForm from '../pages/UsuarioForm';
import Configuracion from '../pages/Configuracion';
import MovimientosStock from '../pages/MovimientosStock';

// Componente de redirección a tenant por defecto
const RedirectToDefaultTenant = () => {
  return <Navigate to="/demo/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Ruta raíz: redirigir a tenant por defecto */}
      <Route path="/" element={<RedirectToDefaultTenant />} />

      {/* Rutas públicas con tenant */}
      <Route path="/:tenant/login" element={<Login />} />
      <Route path="/:tenant/register" element={<Register />} />
      
      {/* Rutas protegidas con tenant */}
      <Route path="/:tenant/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      <Route path="/:tenant/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
      <Route path="/:tenant/clientes/nuevo" element={<ProtectedRoute><ClienteForm /></ProtectedRoute>} />
      <Route path="/:tenant/clientes/:id" element={<ProtectedRoute><ClienteDetalle /></ProtectedRoute>} />
      <Route path="/:tenant/clientes/:id/editar" element={<ProtectedRoute><ClienteForm /></ProtectedRoute>} />

      <Route path="/:tenant/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
      <Route path="/:tenant/productos/nuevo" element={<ProtectedRoute><ProductoForm /></ProtectedRoute>} />
      <Route path="/:tenant/productos/:id/editar" element={<ProtectedRoute><ProductoForm /></ProtectedRoute>} />
      <Route path="/:tenant/productos/:id" element={<ProtectedRoute><ProductoDetalle /></ProtectedRoute>} />

      <Route path="/:tenant/proveedores" element={<ProtectedRoute><Proveedores /></ProtectedRoute>} />
      <Route path="/:tenant/proveedores/nuevo" element={<ProtectedRoute><ProveedorForm /></ProtectedRoute>} />
      <Route path="/:tenant/proveedores/:id" element={<ProtectedRoute><ProveedorDetalle /></ProtectedRoute>} />
      <Route path="/:tenant/proveedores/:id/editar" element={<ProtectedRoute><ProveedorForm /></ProtectedRoute>} />

      <Route path="/:tenant/presupuestos" element={<ProtectedRoute><Presupuestos /></ProtectedRoute>} />
      <Route path="/:tenant/presupuestos/nuevo" element={<ProtectedRoute><PresupuestoForm /></ProtectedRoute>} />
      <Route path="/:tenant/presupuestos/:id" element={<ProtectedRoute><PresupuestoDetalle /></ProtectedRoute>} />
      <Route path="/:tenant/presupuestos/:id/editar" element={<ProtectedRoute><PresupuestoForm /></ProtectedRoute>} />

      <Route path="/:tenant/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
      <Route path="/:tenant/ventas/nueva" element={<ProtectedRoute><VentaForm /></ProtectedRoute>} />
      <Route path="/:tenant/ventas/:id" element={<ProtectedRoute><VentaDetalle /></ProtectedRoute>} />

      <Route path="/:tenant/compras" element={<ProtectedRoute><Compras /></ProtectedRoute>} />
      <Route path="/:tenant/compras/nueva" element={<ProtectedRoute><CompraForm /></ProtectedRoute>} />
      <Route path="/:tenant/compras/:id" element={<ProtectedRoute><CompraDetalle /></ProtectedRoute>} />

      <Route path="/:tenant/cuenta-corriente" element={<ProtectedRoute><CuentaCorriente /></ProtectedRoute>} />
      <Route path="/:tenant/cuenta-corriente/:clienteId" element={<ProtectedRoute><EstadoCuenta /></ProtectedRoute>} />
      <Route path="/:tenant/cuenta-corriente/:clienteId/pago" element={<ProtectedRoute><RegistrarPago /></ProtectedRoute>} />

      <Route path="/:tenant/caja" element={<ProtectedRoute><Caja /></ProtectedRoute>} />
      <Route path="/:tenant/caja/abrir" element={<ProtectedRoute><AbrirCaja /></ProtectedRoute>} />
      <Route path="/:tenant/caja/:id" element={<ProtectedRoute><CajaDetalle /></ProtectedRoute>} />
      <Route path="/:tenant/caja/:id/movimiento" element={<ProtectedRoute><RegistrarMovimientoCaja /></ProtectedRoute>} />
      <Route path="/:tenant/caja/:id/cerrar" element={<ProtectedRoute><CerrarCaja /></ProtectedRoute>} />

      <Route path="/:tenant/reportes" element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
      <Route path="/:tenant/reportes/ventas" element={<ProtectedRoute><ReporteVentas /></ProtectedRoute>} />
      <Route path="/:tenant/reportes/productos" element={<ProtectedRoute><ReporteProductos /></ProtectedRoute>} />
      <Route path="/:tenant/reportes/stock" element={<ProtectedRoute><ReporteStock /></ProtectedRoute>} />
      <Route path="/:tenant/reportes/clientes" element={<ProtectedRoute><ReporteClientes /></ProtectedRoute>} />
      <Route path="/:tenant/reportes/caja" element={<ProtectedRoute><ReporteCaja /></ProtectedRoute>} />
      <Route path="/:tenant/reportes/rentabilidad" element={<ProtectedRoute><ReporteRentabilidad /></ProtectedRoute>} />

      <Route path="/:tenant/sucursales" element={<ProtectedRoute><Sucursales /></ProtectedRoute>} />
      <Route path="/:tenant/sucursales/nueva" element={<ProtectedRoute><SucursalForm /></ProtectedRoute>} />
      <Route path="/:tenant/sucursales/:id/editar" element={<ProtectedRoute><SucursalForm /></ProtectedRoute>} />

      <Route path="/:tenant/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
      <Route path="/:tenant/usuarios/nuevo" element={<ProtectedRoute><UsuarioForm /></ProtectedRoute>} />
      <Route path="/:tenant/usuarios/:id/editar" element={<ProtectedRoute><UsuarioForm /></ProtectedRoute>} />

      <Route path="/:tenant/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />

      <Route path="/:tenant/movimientos-stock" element={<ProtectedRoute><MovimientosStock /></ProtectedRoute>} />

      {/* Catch-all: redirigir a tenant por defecto */}
      <Route path="*" element={<RedirectToDefaultTenant />} />
    </Routes>
  );
};

export default AppRoutes;