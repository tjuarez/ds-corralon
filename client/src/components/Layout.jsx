import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import SucursalSelector from './SucursalSelector';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Building2,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
  Truck,
  TrendingUp
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [logoEmpresa, setLogoEmpresa] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  // Cargar logo de la empresa
  useEffect(() => {
    loadLogo();
  }, []);

  const loadLogo = async () => {
    try {
      const response = await fetch('/api/configuracion/empresa_logo_url', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.configuracion?.valor) {
          setLogoEmpresa(data.configuracion.valor);
        }
      }
    } catch (error) {
      console.error('Error al cargar logo:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const menuItems = [
    { path: '/dashboard', icon: BarChart3, label: t('dashboard') },
    { path: '/clientes', icon: Users, label: t('clients') },
    { path: '/productos', icon: Package, label: t('products') },
    { path: '/movimientos-stock', icon: TrendingUp, label: t('stockMovements') },
    { path: '/proveedores', icon: Truck, label: t('providers') },
    { path: '/ventas', icon: ShoppingCart, label: t('sales') },
    { path: '/presupuestos', icon: FileText, label: t('quotes') },
    { path: '/compras', icon: ShoppingBag, label: t('purchases') }
  ];

  if (user?.rol === 'admin' || user?.rol === 'vendedor' || user?.rol === 'cajero') {
    menuItems.push(
      { path: '/cuenta-corriente', icon: DollarSign, label: t('currentAccount') }
    );
  }

  if (user?.rol === 'admin' || user?.rol === 'cajero') {
    menuItems.push(
      { path: '/caja', icon: DollarSign, label: t('cashRegister') }
    );
  }

  menuItems.push(
    { path: '/reportes', icon: BarChart3, label: t('reports') }
  );

  // Solo admins pueden ver configuración y usuarios
  if (user?.rol === 'admin') {
    menuItems.push(
      { path: '/sucursales', icon: Building2, label: t('branches') },
      { path: '/usuarios', icon: User, label: t('users') },
      { path: '/configuracion', icon: Settings, label: t('settings') }
    );
  }

  const isActive = (path) => {
    // Considerar activo si la ruta actual comienza con el path del menú
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={{
        ...styles.sidebar,
        width: sidebarOpen ? '260px' : '70px',
      }}>
<div style={styles.sidebarHeader}>
          {sidebarOpen ? (
            <div style={styles.logoContainer}>
              {logoEmpresa ? (
                <img 
                  src={logoEmpresa} 
                  alt="Logo" 
                  style={styles.logoImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <h1 
                style={{
                  ...styles.logo,
                  display: logoEmpresa ? 'none' : 'block'
                }}
              >
                {t('appName')}
              </h1>
            </div>
          ) : (
            <h1 style={styles.logoCollapsed}>DS</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.toggleButton}
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...styles.navItem,
                  ...(isActive(item.path) ? styles.navItemActive : {}),
                }}
              >
                <Icon size={20} style={styles.navIcon} />
                {sidebarOpen && (
                  <span style={styles.navLabel}>{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div style={styles.sidebarFooter}>
            <div style={styles.userCard}>
              <div style={styles.userAvatar}>
                {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
              </div>
              <div style={styles.userInfo}>
                <div style={styles.userName}>
                  {user?.nombre} {user?.apellido}
                </div>
                <div style={styles.userRole}>{user?.rol}</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div style={{
        ...styles.mainContainer,
        marginLeft: sidebarOpen ? '260px' : '70px',
      }}>
        {/* Top Bar */}
        <header style={styles.topBar}>
          <div style={styles.topBarContent}>
            <div style={styles.breadcrumb}>
              {location.pathname.split('/').filter(Boolean).map((segment, index, arr) => (
                <span key={segment} style={styles.breadcrumbItem}>
                  {segment.charAt(0).toUpperCase() + segment.slice(1)}
                  {index < arr.length - 1 && ' / '}
                </span>
              ))}
            </div>

            <div style={styles.topBarRight}>
              {/* Selector de sucursal para admin, badge estático para otros */}
              {user?.rol === 'admin' ? (
                <SucursalSelector />
              ) : (
                <div style={styles.sucursalBadge}>
                  <Store size={16} style={{ marginRight: '6px' }} />
                  {user?.sucursal_nombre || 'Sin sucursal'}
                </div>
              )}

              <select
                value={language}
                onChange={handleLanguageChange}
                style={styles.languageSelect}
              >
                <option value="es">ES</option>
                <option value="en">EN</option>
                <option value="pt">PT</option>
              </select>

              <button onClick={handleLogout} style={styles.logoutButton}>
                <LogOut size={16} style={{ marginRight: '6px' }} />
                {t('logout')}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
  },
  sidebar: {
    backgroundColor: '#1f2937',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    position: 'fixed',
    height: '100vh',
    left: 0,
    top: 0,
    zIndex: 100,
    overflowY: 'auto',
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid #374151',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '70px',
  },
  logo: {
    fontSize: '22px',
    fontWeight: 'bold',
    margin: 0,
    color: '#60a5fa',
  },
  logoCollapsed: {
    fontSize: '22px',
    fontWeight: 'bold',
    margin: 0,
    color: '#60a5fa',
  },
  toggleButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    flex: 1,
    padding: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '14px 20px',
    color: '#d1d5db',
    textDecoration: 'none',
    transition: 'all 0.2s',
    fontSize: '15px',
    fontWeight: '500',
  },
  navItemActive: {
    backgroundColor: '#374151',
    color: 'white',
    borderLeft: '4px solid #60a5fa',
  },
  navIcon: {
    minWidth: '20px',
    flexShrink: 0,
  },
  navLabel: {
    whiteSpace: 'nowrap',
  },
  sidebarFooter: {
    padding: '20px',
    borderTop: '1px solid #374151',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#60a5fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    overflow: 'hidden',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: '12px',
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  mainContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    transition: 'margin-left 0.3s ease',
  },
  topBar: {
    backgroundColor: 'white',
    borderBottom: '2px solid #e5e7eb',
    padding: '16px 30px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  topBarContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breadcrumb: {
    fontSize: '15px',
    color: '#6b7280',
    fontWeight: '500',
  },
  breadcrumbItem: {
    textTransform: 'capitalize',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  sucursalBadge: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    border: '2px solid #d1d5db',
    display: 'flex',
    alignItems: 'center',
  },
  languageSelect: {
    padding: '7px 28px 7px 10px',
    fontSize: '13px',
    fontWeight: '500',
    borderRadius: '6px',
    border: '2px solid #e5e7eb',
    backgroundColor: 'white',
    color: '#1f2937',
    cursor: 'pointer',
    outline: 'none',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#dc2626',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: '30px',
    overflowY: 'auto',
  },
logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoImage: {
    maxWidth: '180px',
    maxHeight: '50px',
    objectFit: 'contain',
  },
};

export default Layout;