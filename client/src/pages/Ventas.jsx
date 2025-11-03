import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ventasApi } from '../api/ventas';
import { sucursalesApi } from '../api/sucursales';
import Layout from '../components/Layout';
import { Plus, Search, Eye, DollarSign, Calendar, User, FileText, XCircle, CheckCircle, Building2 } from 'lucide-react';

const Ventas = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showError } = useNotification();
  
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sucursales, setSucursales] = useState([]);
  const [filtroSucursal, setFiltroSucursal] = useState('');

  useEffect(() => {
    loadVentas();
    if (user?.rol === 'admin') {
      loadSucursales();
    }
  }, []);

  const loadVentas = async () => {
    try {
      setLoading(true);
      const filtros = {};

      // Admin puede filtrar por sucursal
      if (user?.rol === 'admin' && filtroSucursal) {
        filtros.sucursal_id = filtroSucursal;
      }

      const data = await ventasApi.getAll(filtros);
      setVentas(data.ventas);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSucursales = async () => {
    try {
      const data = await sucursalesApi.getAll({ activa: 'true' });
      setSucursales(data.sucursales);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    }
  };

  // Aplicar filtro cuando cambia
  useEffect(() => {
    if (user) {
      loadVentas();
    }
  }, [filtroSucursal]);

  const getEstadoBadge = (estado) => {
    if (estado === 'completada') {
      return (
        <span style={styles.badgeCompleted}>
          <CheckCircle size={14} style={{ marginRight: '4px' }} />
          Completada
        </span>
      );
    } else {
      return (
        <span style={styles.badgeCancelled}>
          <XCircle size={14} style={{ marginRight: '4px' }} />
          Anulada
        </span>
      );
    }
  };

  const getTipoComprobante = (tipo) => {
    const tipos = {
      'factura_a': 'Factura A',
      'factura_b': 'Factura B',
      'factura_c': 'Factura C',
      'remito': 'Remito',
      'ticket': 'Ticket'
    };
    return tipos[tipo] || tipo;
  };

  const getFormaPago = (forma) => {
    const formas = {
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta',
      'transferencia': 'Transferencia',
      'cuenta_corriente': 'Cuenta Corriente',
      'multiple': 'Múltiple'
    };
    return formas[forma] || forma;
  };

  // Filtrar ventas por búsqueda
  const ventasFiltradas = ventas.filter(venta => {
    const searchLower = search.toLowerCase();
    return (
      venta.numero_comprobante.toLowerCase().includes(searchLower) ||
      (venta.cliente_nombre && venta.cliente_nombre.toLowerCase().includes(searchLower)) ||
      (venta.sucursal_nombre && venta.sucursal_nombre.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('sales')}</h1>
          <p style={styles.subtitle}>
            {ventasFiltradas.length} {ventasFiltradas.length === 1 ? 'venta registrada' : 'ventas registradas'}
            {user?.rol !== 'admin' && user?.sucursal_nombre && (
              <span style={styles.sucursalInfo}> • {user.sucursal_nombre}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => navigate('/ventas/nueva')}
          style={styles.addButton}
        >
          <Plus size={18} style={{ marginRight: '6px' }} />
          {t('newSale')}
        </button>
      </div>

      {/* Filtros */}
      <div style={styles.filters}>
        <div style={styles.searchContainer}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder={`${t('search')} por número, cliente o sucursal...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Filtro de Sucursal - Solo para Admin */}
        {user?.rol === 'admin' && (
          <div style={styles.filterGroup}>
            <select
              value={filtroSucursal}
              onChange={(e) => setFiltroSucursal(e.target.value)}
              style={styles.select}
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map(sucursal => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Lista de ventas */}
      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      ) : ventasFiltradas.length === 0 ? (
        <div style={styles.noData}>
          <FileText size={48} color="#9ca3af" />
          <p style={styles.noDataText}>
            {search || filtroSucursal ? 'No se encontraron ventas con los filtros aplicados' : t('noData')}
          </p>
          {!search && !filtroSucursal && (
            <button
              onClick={() => navigate('/ventas/nueva')}
              style={styles.addButtonSecondary}
            >
              Crear primera venta
            </button>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {ventasFiltradas.map((venta) => (
            <div key={venta.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.cardNumber}>{venta.numero_comprobante}</div>
                  <div style={styles.cardTipo}>{getTipoComprobante(venta.tipo_comprobante)}</div>
                  <h3 style={styles.cardTitle}>{venta.cliente_nombre}</h3>
                </div>
                {getEstadoBadge(venta.estado)}
              </div>

              <div style={styles.cardBody}>
                {/* Sucursal */}
                <div style={styles.infoRow}>
                  <Building2 size={16} style={styles.infoIcon} />
                  <span style={styles.sucursalBadge}>
                    {venta.sucursal_nombre || 'Sin asignar'}
                  </span>
                </div>

                <div style={styles.infoRow}>
                  <Calendar size={16} style={styles.infoIcon} />
                  <span style={styles.infoValue}>
                    {new Date(venta.fecha).toLocaleDateString('es-AR')}
                  </span>
                </div>

                <div style={styles.infoRow}>
                  <DollarSign size={16} style={styles.infoIcon} />
                  <span style={styles.infoValue}>
                    {venta.moneda_simbolo} {parseFloat(venta.total).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>

                <div style={styles.infoRow}>
                  <FileText size={16} style={styles.infoIcon} />
                  <span style={styles.infoValue}>{getFormaPago(venta.forma_pago)}</span>
                </div>

                {venta.usuario_nombre && (
                  <div style={styles.infoRow}>
                    <User size={16} style={styles.infoIcon} />
                    <span style={styles.infoValue}>{venta.usuario_nombre}</span>
                  </div>
                )}
              </div>

              <div style={styles.cardFooter}>
                <button
                  onClick={() => navigate(`/ventas/${venta.id}`)}
                  style={styles.viewButton}
                >
                  <Eye size={16} style={{ marginRight: '6px' }} />
                  Ver Detalle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  sucursalInfo: {
    color: '#2563eb',
    fontWeight: '600',
  },
  addButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  addButtonSecondary: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: 'white',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '20px',
  },
  filters: {
    display: 'flex',
    gap: '15px',
    marginBottom: '30px',
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: '#9ca3af',
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px 12px 45px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
  },
  filterGroup: {
    minWidth: '200px',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#6b7280',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  noData: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  noDataText: {
    fontSize: '18px',
    color: '#6b7280',
    margin: '20px 0 0 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '2px solid #f3f4f6',
  },
  cardNumber: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: '2px',
  },
  cardTipo: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  badgeCompleted: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    display: 'inline-flex',
    alignItems: 'center',
  },
  badgeCancelled: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    display: 'inline-flex',
    alignItems: 'center',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
  },
  infoIcon: {
    color: '#6b7280',
    flexShrink: 0,
  },
  infoValue: {
    color: '#4b5563',
  },
  sucursalBadge: {
    padding: '4px 12px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
  },
  cardFooter: {
    display: 'flex',
    gap: '10px',
    paddingTop: '16px',
    borderTop: '2px solid #f3f4f6',
  },
  viewButton: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default Ventas;