import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { cajaApi } from '../api/caja';
import { sucursalesApi } from '../api/sucursales';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/Layout';
import { Plus, Eye, Calendar, User, DollarSign, TrendingUp, TrendingDown, CheckCircle, XCircle, Activity, Building2 } from 'lucide-react';

const Caja = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showError } = useNotification();
  const { user } = useAuth();
  
  const [cajas, setCajas] = useState([]);
  const [cajaAbierta, setCajaAbierta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sucursales, setSucursales] = useState([]);
  const [filtroSucursal, setFiltroSucursal] = useState('');

  useEffect(() => {
    loadData();
    if (user?.rol === 'admin') {
      loadSucursales();
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const filters = {};
      // Admin puede filtrar por sucursal
      if (user?.rol === 'admin' && filtroSucursal) {
        filters.sucursal_id = filtroSucursal;
      }
      
      const [cajasData, cajaAbiertaData] = await Promise.all([
        cajaApi.getAll(filters),
        cajaApi.getCajaAbierta(user.id)
      ]);

      setCajas(cajasData.cajas);
      setCajaAbierta(cajaAbiertaData.caja);
    } catch (error) {
      console.error('Error al cargar datos:', error);
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
      loadData();
    }
  }, [filtroSucursal]);

  const getEstadoBadge = (estado) => {
    const estados = {
      abierta: { color: '#10b981', bg: '#d1fae5', icon: Activity, label: 'Abierta' },
      cerrada: { color: '#6b7280', bg: '#f3f4f6', icon: CheckCircle, label: 'Cerrada' },
    };

    const config = estados[estado] || estados.abierta;
    const Icon = config.icon;

    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: config.bg,
        color: config.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('cashRegister')}</h1>
          <p style={styles.subtitle}>
            Gestión de caja y movimientos diarios
            {user?.rol !== 'admin' && user?.sucursal_nombre && (
              <span style={styles.sucursalInfo}> • {user.sucursal_nombre}</span>
            )}
          </p>
        </div>
        {!cajaAbierta && (
          <button
            onClick={() => navigate('/caja/abrir')}
            style={styles.addButton}
          >
            <Plus size={18} style={{ marginRight: '6px' }} />
            Abrir Caja
          </button>
        )}
      </div>

      {/* Caja Abierta Actual */}
      {cajaAbierta && (
        <div style={styles.cajaActiva}>
          <div style={styles.cajaActivaHeader}>
            <div>
              <h2 style={styles.cajaActivaTitle}>Caja N° {cajaAbierta.numero}</h2>
              <p style={styles.cajaActivaSubtitle}>
                Abierta el {new Date(cajaAbierta.fecha_apertura).toLocaleString('es-AR')}
                {cajaAbierta.sucursal_nombre && (
                  <> • <span style={styles.sucursalBadgeInline}>{cajaAbierta.sucursal_nombre}</span></>
                )}
              </p>
            </div>
            {getEstadoBadge(cajaAbierta.estado)}
          </div>

          <div style={styles.cajaActivaStats}>
            <div style={styles.statBox}>
              <DollarSign size={20} color="#6b7280" />
              <div>
                <div style={styles.statLabel}>Monto Inicial</div>
                <div style={styles.statValue}>{formatCurrency(cajaAbierta.monto_inicial, '$')}</div>
              </div>
            </div>

            <div style={styles.statBox}>
              <TrendingUp size={20} color="#10b981" />
              <div>
                <div style={styles.statLabel}>Ingresos</div>
                <div style={{ ...styles.statValue, color: '#10b981' }}>
                  {formatCurrency(cajaAbierta.total_ingresos || 0, '$')}
                </div>
              </div>
            </div>

            <div style={styles.statBox}>
              <TrendingDown size={20} color="#dc2626" />
              <div>
                <div style={styles.statLabel}>Egresos</div>
                <div style={{ ...styles.statValue, color: '#dc2626' }}>
                  {formatCurrency(cajaAbierta.total_egresos || 0, '$')}
                </div>
              </div>
            </div>

            <div style={styles.statBoxTotal}>
              <div>
                <div style={styles.statLabel}>Monto Actual</div>
                <div style={styles.statValueTotal}>
                  {formatCurrency(
                    parseFloat(cajaAbierta.monto_inicial) +
                    parseFloat(cajaAbierta.total_ingresos || 0) -
                    parseFloat(cajaAbierta.total_egresos || 0),
                    '$'
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={styles.cajaActivaActions}>
            <button
              onClick={() => navigate(`/caja/${cajaAbierta.id}`)}
              style={styles.verCajaButton}
            >
              <Eye size={16} style={{ marginRight: '6px' }} />
              Ver Movimientos
            </button>
            <button
              onClick={() => navigate(`/caja/${cajaAbierta.id}/cerrar`)}
              style={styles.cerrarButton}
            >
              <CheckCircle size={16} style={{ marginRight: '6px' }} />
              Cerrar Caja
            </button>
          </div>
        </div>
      )}

      {/* Filtro de Sucursal - Solo para Admin */}
      {user?.rol === 'admin' && (
        <div style={styles.filterBox}>
          <label style={styles.filterLabel}>Filtrar por sucursal:</label>
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

      {/* Historial de Cajas */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Historial de Cajas</h2>

        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <p>{t('loading')}</p>
          </div>
        ) : cajas.length === 0 ? (
          <div style={styles.noData}>
            <Activity size={48} color="#9ca3af" />
            <p style={styles.noDataText}>
              {filtroSucursal ? 'No hay cajas registradas con los filtros aplicados' : 'No hay cajas registradas'}
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {cajas.map((caja) => (
              <div key={caja.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.cardNumber}>Caja N° {caja.numero}</div>
                    <h3 style={styles.cardTitle}>
                      {new Date(caja.fecha_apertura).toLocaleDateString('es-AR')}
                    </h3>
                  </div>
                  {getEstadoBadge(caja.estado)}
                </div>

                <div style={styles.cardBody}>
                  {/* Sucursal */}
                  <div style={styles.infoRow}>
                    <Building2 size={16} style={styles.infoIcon} />
                    <span style={styles.sucursalBadge}>
                      {caja.sucursal_nombre || 'Sin asignar'}
                    </span>
                  </div>

                  <div style={styles.infoRow}>
                    <User size={16} style={styles.infoIcon} />
                    <span style={styles.infoValue}>{caja.usuario_apertura_nombre}</span>
                  </div>

                  <div style={styles.infoRow}>
                    <Calendar size={16} style={styles.infoIcon} />
                    <span style={styles.infoValue}>
                      {new Date(caja.fecha_apertura).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {caja.fecha_cierre && (
                        <> - {new Date(caja.fecha_cierre).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</>
                      )}
                    </span>
                  </div>

                  <div style={styles.montoRow}>
                    <div style={styles.montoItem}>
                      <span style={styles.montoLabel}>Inicial:</span>
                      <span style={styles.montoValue}>{formatCurrency(caja.monto_inicial, '$')}</span>
                    </div>
                    {caja.estado === 'cerrada' && (
                      <>
                        <div style={styles.montoItem}>
                          <span style={styles.montoLabel}>Final:</span>
                          <span style={styles.montoValue}>{formatCurrency(caja.monto_final, '$')}</span>
                        </div>
                        {caja.diferencia !== 0 && (
                          <div style={styles.montoItem}>
                            <span style={styles.montoLabel}>Dif:</span>
                            <span style={{
                              ...styles.montoValue,
                              color: caja.diferencia > 0 ? '#10b981' : '#dc2626',
                              fontWeight: '700'
                            }}>
                              {caja.diferencia > 0 ? '+' : ''}{formatCurrency(caja.diferencia, '$')}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  <button
                    onClick={() => navigate(`/caja/${caja.id}`)}
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
      </div>
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
    color: '#10b981',
    fontWeight: '600',
  },
  addButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  filterBox: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  filterLabel: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#4b5563',
  },
  select: {
    padding: '10px 16px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
    minWidth: '250px',
  },
  cajaActiva: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px',
    border: '3px solid #10b981',
  },
  cajaActivaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '2px solid #f3f4f6',
  },
  cajaActivaTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  cajaActivaSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  sucursalBadgeInline: {
    color: '#10b981',
    fontWeight: '600',
  },
  cajaActivaStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statBox: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  statBoxTotal: {
    padding: '16px',
    backgroundColor: '#10b981',
    borderRadius: '8px',
    color: 'white',
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statValueTotal: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
  },
  cajaActivaActions: {
    display: 'flex',
    gap: '12px',
  },
  verCajaButton: {
    flex: 1,
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cerrarButton: {
    flex: 1,
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 24px 0',
    paddingBottom: '12px',
    borderBottom: '2px solid #f3f4f6',
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
    borderTop: '5px solid #10b981',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  noData: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280',
  },
  noDataText: {
    fontSize: '18px',
    color: '#6b7280',
    margin: '20px 0 0 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '2px solid #f3f4f6',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f3f4f6',
  },
  cardNumber: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#10b981',
    marginBottom: '4px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
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
    gap: '8px',
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
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
  },
  montoRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '12px',
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
  },
  montoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  montoLabel: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '600',
  },
  montoValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  cardFooter: {
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  viewButton: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#10b981',
    backgroundColor: '#d1fae5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default Caja;