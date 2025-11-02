import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { reportesApi } from '../api/reportes';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/Layout';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

const ReporteCaja = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showError } = useNotification();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    fecha_desde: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0],
    fecha_hasta: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadReporte();
  }, []);

  const loadReporte = async () => {
    try {
      setLoading(true);
      const reporteData = await reportesApi.getReporteCaja(filters);
      setData(reporteData);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = () => {
    loadReporte();
  };

  const getEstadoBadge = (estado) => {
    if (estado === 'abierta') {
      return { text: 'Abierta', color: '#10b981', bg: '#d1fae5', icon: Activity };
    }
    return { text: 'Cerrada', color: '#6b7280', bg: '#f3f4f6', icon: CheckCircle };
  };

  const getDiferenciaColor = (diferencia) => {
    const diff = parseFloat(diferencia || 0);
    if (Math.abs(diff) < 0.01) return '#10b981'; // Perfecto
    if (diff > 0) return '#f59e0b'; // Sobrante
    return '#dc2626'; // Faltante
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('cashReport')}</h1>
          <p style={styles.subtitle}>Análisis de movimientos de caja</p>
        </div>
        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
          <ArrowLeft size={18} style={{ marginRight: '6px' }} />
          {t('back')}
        </button>
      </div>

      {/* Filtros */}
      <div style={styles.filtersBox}>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>{t('from')}</label>
            <input
              type="date"
              name="fecha_desde"
              value={filters.fecha_desde}
              onChange={handleFilterChange}
              style={styles.filterInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>{t('to')}</label>
            <input
              type="date"
              name="fecha_hasta"
              value={filters.fecha_hasta}
              onChange={handleFilterChange}
              style={styles.filterInput}
            />
          </div>

          <button onClick={handleSearch} style={styles.searchButton}>
            <Calendar size={18} style={{ marginRight: '6px' }} />
            Buscar
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      ) : data ? (
        <>
          {/* Resumen */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, backgroundColor: '#dbeafe' }}>
                <Activity size={24} color="#2563eb" />
              </div>
              <div>
                <div style={styles.statLabel}>Total Cajas</div>
                <div style={styles.statValue}>{data.resumen?.total_cajas || 0}</div>
                <div style={styles.statSubtext}>
                  {data.resumen?.cajas_abiertas || 0} abiertas, {data.resumen?.cajas_cerradas || 0} cerradas
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, backgroundColor: '#d1fae5' }}>
                <TrendingUp size={24} color="#10b981" />
              </div>
              <div>
                <div style={styles.statLabel}>Total Ingresos</div>
                <div style={{ ...styles.statValue, color: '#10b981' }}>
                  {formatCurrency(data.resumen?.total_ingresos || 0, '$')}
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, backgroundColor: '#fee2e2' }}>
                <TrendingDown size={24} color="#dc2626" />
              </div>
              <div>
                <div style={styles.statLabel}>Total Egresos</div>
                <div style={{ ...styles.statValue, color: '#dc2626' }}>
                  {formatCurrency(data.resumen?.total_egresos || 0, '$')}
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{ 
                ...styles.statIcon, 
                backgroundColor: getDiferenciaColor(data.resumen?.diferencias_total) === '#10b981' ? '#d1fae5' :
                                  getDiferenciaColor(data.resumen?.diferencias_total) === '#f59e0b' ? '#fef3c7' : '#fee2e2'
              }}>
                <AlertCircle size={24} color={getDiferenciaColor(data.resumen?.diferencias_total)} />
              </div>
              <div>
                <div style={styles.statLabel}>Diferencias</div>
                <div style={{ 
                  ...styles.statValue, 
                  color: getDiferenciaColor(data.resumen?.diferencias_total) 
                }}>
                  {Math.abs(data.resumen?.diferencias_total || 0) < 0.01 
                    ? 'Perfecto'
                    : formatCurrency(data.resumen?.diferencias_total || 0, '$')
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Cajas */}
          {data.cajas.length === 0 ? (
            <div style={styles.noDataBox}>
              <DollarSign size={64} color="#9ca3af" />
              <h3 style={styles.noDataTitle}>No hay cajas en este período</h3>
              <p style={styles.noDataText}>
                Intenta cambiar el rango de fechas para ver resultados
              </p>
            </div>
          ) : (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Detalle de Cajas</h2>

              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Caja N°</th>
                      <th style={styles.th}>Fecha Apertura</th>
                      <th style={styles.th}>Usuario</th>
                      <th style={styles.thRight}>M. Inicial</th>
                      <th style={styles.thRight}>Ingresos</th>
                      <th style={styles.thRight}>Egresos</th>
                      <th style={styles.thRight}>M. Final</th>
                      <th style={styles.thRight}>Diferencia</th>
                      <th style={styles.thCenter}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cajas.map((caja) => {
                      const estadoBadge = getEstadoBadge(caja.estado);
                      const Icon = estadoBadge.icon;
                      const diferenciaColor = getDiferenciaColor(caja.diferencia);

                      return (
                        <tr 
                          key={caja.id} 
                          style={styles.tr}
                          onClick={() => navigate(`/caja/${caja.id}`)}
                        >
                          <td style={styles.td}>
                            <span style={styles.cajaNumero}>#{caja.numero}</span>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.fecha}>
                              {new Date(caja.fecha_apertura).toLocaleDateString('es-AR')}
                            </div>
                            <div style={styles.hora}>
                              {new Date(caja.fecha_apertura).toLocaleTimeString('es-AR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.usuario}>{caja.usuario_apertura}</div>
                            {caja.estado === 'cerrada' && caja.usuario_cierre && (
                              <div style={styles.usuarioCierre}>
                                Cerrado: {caja.usuario_cierre}
                              </div>
                            )}
                          </td>
                          <td style={styles.tdRight}>
                            {formatCurrency(caja.monto_inicial, '$')}
                          </td>
                          <td style={styles.tdRight}>
                            <span style={{ color: '#10b981', fontWeight: '600' }}>
                              {formatCurrency(caja.total_ingresos, '$')}
                            </span>
                          </td>
                          <td style={styles.tdRight}>
                            <span style={{ color: '#dc2626', fontWeight: '600' }}>
                              {formatCurrency(caja.total_egresos, '$')}
                            </span>
                          </td>
                          <td style={styles.tdRight}>
                            {caja.estado === 'cerrada' ? (
                              <strong>{formatCurrency(caja.monto_final, '$')}</strong>
                            ) : (
                              <span style={{ color: '#6b7280' }}>-</span>
                            )}
                          </td>
                          <td style={styles.tdRight}>
                            {caja.estado === 'cerrada' ? (
                              Math.abs(caja.diferencia) < 0.01 ? (
                                <span style={{ color: '#10b981', fontWeight: '600' }}>
                                  ✓ Perfecto
                                </span>
                              ) : (
                                <span style={{ 
                                  color: diferenciaColor, 
                                  fontWeight: '600' 
                                }}>
                                  {caja.diferencia > 0 ? '+' : ''}
                                  {formatCurrency(caja.diferencia, '$')}
                                </span>
                              )
                            ) : (
                              <span style={{ color: '#6b7280' }}>-</span>
                            )}
                          </td>
                          <td style={styles.tdCenter}>
                            <span style={{
                              ...styles.estadoBadge,
                              backgroundColor: estadoBadge.bg,
                              color: estadoBadge.color,
                            }}>
                              <Icon size={14} style={{ marginRight: '4px' }} />
                              {estadoBadge.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
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
  backButton: {
    padding: '10px 20px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  filtersBox: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    marginBottom: '30px',
  },
  filterRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    alignItems: 'end',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  filterInput: {
    padding: '10px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
  },
  searchButton: {
    padding: '10px 24px',
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  statIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statSubtext: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px',
  },
  noDataBox: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '60px 20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    textAlign: 'center',
  },
  noDataTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '20px 0 8px 0',
  },
  noDataText: {
    fontSize: '15px',
    color: '#6b7280',
    margin: 0,
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
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
  },
  thRight: {
    padding: '12px',
    textAlign: 'right',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
  },
  thCenter: {
    padding: '12px',
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '14px 12px',
    fontSize: '14px',
    color: '#1f2937',
  },
  tdRight: {
    padding: '14px 12px',
    textAlign: 'right',
    fontSize: '14px',
    color: '#1f2937',
  },
  tdCenter: {
    padding: '14px 12px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#1f2937',
  },
  cajaNumero: {
    padding: '4px 10px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  fecha: {
    fontWeight: '500',
    color: '#1f2937',
  },
  hora: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  usuario: {
    fontWeight: '500',
    color: '#1f2937',
  },
  usuarioCierre: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  estadoBadge: {
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
  },
};

export default ReporteCaja;