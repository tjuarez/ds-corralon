import { Routes, Route, Navigate } from 'react-router-dom';
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

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <Clientes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/clientes/nuevo"
        element={
          <ProtectedRoute>
            <ClienteForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/clientes/:id"
        element={
          <ProtectedRoute>
            <ClienteDetalle />
          </ProtectedRoute>
        }
      />

      <Route
        path="/clientes/:id/editar"
        element={
          <ProtectedRoute>
            <ClienteForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/productos"
        element={
          <ProtectedRoute>
            <Productos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/productos/nuevo"
        element={
          <ProtectedRoute>
            <ProductoForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/productos/:id/editar"
        element={
          <ProtectedRoute>
            <ProductoForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/productos/:id"
        element={
          <ProtectedRoute>
            <ProductoDetalle />
          </ProtectedRoute>
        }
      />

      <Route
        path="/proveedores"
        element={
          <ProtectedRoute>
            <Proveedores />
          </ProtectedRoute>
        }
      />

      <Route
        path="/proveedores/nuevo"
        element={
          <ProtectedRoute>
            <ProveedorForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/proveedores/:id"
        element={
          <ProtectedRoute>
            <ProveedorDetalle />
          </ProtectedRoute>
        }
      />

      <Route
        path="/proveedores/:id/editar"
        element={
          <ProtectedRoute>
            <ProveedorForm />
          </ProtectedRoute>
        }
      />

      <Route path="/presupuestos" element={<Presupuestos />} />
      <Route path="/presupuestos/nuevo" element={<PresupuestoForm />} />
      <Route path="/presupuestos/:id" element={<PresupuestoDetalle />} />
      <Route path="/presupuestos/:id/editar" element={<PresupuestoForm />} />

      <Route path="/ventas" element={<Ventas />} />
      <Route path="/ventas/nueva" element={<VentaForm />} />
      <Route path="/ventas/:id" element={<VentaDetalle />} />

      <Route path="/compras" element={<Compras />} />
      <Route path="/compras/nueva" element={<CompraForm />} />
      <Route path="/compras/:id" element={<CompraDetalle />} />

      <Route path="/cuenta-corriente" element={<CuentaCorriente />} />
      <Route path="/cuenta-corriente/:clienteId" element={<EstadoCuenta />} />
      <Route path="/cuenta-corriente/:clienteId/pago" element={<RegistrarPago />} />

      <Route path="/caja" element={<Caja />} />
      <Route path="/caja/abrir" element={<AbrirCaja />} />
      <Route path="/caja/:id" element={<CajaDetalle />} />
      <Route path="/caja/:id/movimiento" element={<RegistrarMovimientoCaja />} />
      <Route path="/caja/:id/cerrar" element={<CerrarCaja />} />

      <Route path="/reportes" element={<Reportes />} />
      <Route path="/reportes/ventas" element={<ReporteVentas />} />
      <Route path="/reportes/productos" element={<ReporteProductos />} />
      <Route path="/reportes/stock" element={<ReporteStock />} />
      <Route path="/reportes/clientes" element={<ReporteClientes />} />
      <Route path="/reportes/caja" element={<ReporteCaja />} />
      <Route path="/reportes/rentabilidad" element={<ReporteRentabilidad />} />

      <Route path="/sucursales" element={<Sucursales />} />
      <Route path="/sucursales/nueva" element={<SucursalForm />} />
      <Route path="/sucursales/:id/editar" element={<SucursalForm />} />

      <Route path="/usuarios" element={<Usuarios />} />
      <Route path="/usuarios/nuevo" element={<UsuarioForm />} />
      <Route path="/usuarios/:id/editar" element={<UsuarioForm />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;