import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildTenantPath } from '../utils/tenantHelper';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { reportesApi } from '../api/reportes';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/Layout';
import { ArrowLeft, Calendar, Users, DollarSign, ShoppingCart, AlertCircle } from 'lucide-react';

const ReporteClientes = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showError } = useNotification();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    fecha_desde: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0],
    fecha_hasta: new Date().toISOString().split('T')[0],
    limite: '20',
  });

  useEffect(() => {
    loadReporte();
  }, []);

  const loadReporte = async () => {
    try {
      setLoading(true);
      const reporteData = await reportesApi.getReporteClientes(filters);
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

  const getTipoClienteBadge = (tipo) => {
    const tipos = {
      particular: { text: 'Particular', color: '#2563eb', bg: '#dbeafe' },
      empresa: { text: 'Empresa', color: '#10b981', bg: '#d1fae5' },
      constructor: { text: 'Constructor', color: '#f59e0b', bg: '#fef3c7' },
    };
    return tipos[tipo] || tipos.particular;
  };

  const getCreditoStatus = (saldo, limite) => {
    const porcentaje = limite > 0 ? (saldo / limite) * 100 : 0;
    if (porcentaje >= 90) {
      return { text: 'Límite Alto', color: '#dc2626', bg: '#fee2e2', icon: AlertCircle };
    }
    if (porcentaje >= 70) {
      return { text: 'Advertencia', color: '#f59e0b', bg: '#fef3c7', icon: AlertCircle };
    }
    if (saldo > 0) {
      return { text: 'Con Deuda', color: '#6366f1', bg: '#e0e7ff', icon: null };
    }
    return { text: 'Sin Deuda', color: '#10b981', bg: '#d1fae5', icon: null };
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('clientsReport')}</h1>
          <p style={styles.subtitle}>Análisis de clientes por facturación</p>
        </div>
        <button onClick={() => navigate(buildTenantPath('/dashboard'))} style={styles.backButton}>
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

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Límite</label>
            <select
              name="limite"
              value={filters.limite}
              onChange={handleFilterChange}
              style={styles.filterInput}
            >
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="50">Top 50</option>
              <option value="100">Top 100</option>
            </select>
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
          {data.clientes.length === 0 ? (
            <div style={styles.noDataBox}>
              <Users size={64} color="#9ca3af" />
              <h3 style={styles.noDataTitle}>No hay clientes con compras en este período</h3>
              <p style={styles.noDataText}>
                Intenta cambiar el rango de fechas para ver resultados
              </p>
            </div>
          ) : (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Top {filters.limite} Clientes por Facturación
              </h2>

              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Cliente</th>
                      <th style={styles.th}>Tipo</th>
                      <th style={styles.thRight}>Compras</th>
                      <th style={styles.thRight}>Total Comprado</th>
                      <th style={styles.thRight}>Deuda Actual</th>
                      <th style={styles.th}>Estado Crédito</th>
                      <th style={styles.th}>Última Compra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.clientes.map((cliente, index) => {
                      const tipoBadge = getTipoClienteBadge(cliente.tipo_cliente);
                      const creditoStatus = getCreditoStatus(
                        parseFloat(cliente.saldo_cuenta_corriente || 0),
                        parseFloat(cliente.limite_credito || 0)
                      );
                      const Icon = creditoStatus.icon;
                      
                      return (
                        <tr key={cliente.id} style={styles.tr}>
                          <td style={styles.td}>
                            <div style={{
                              ...styles.ranking,
                              backgroundColor: index < 3 ? '#f59e0b' : 
                                              index < 10 ? '#10b981' : '#6b7280'
                            }}>
                              {index + 1}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.clientName}>{cliente.razon_social}</div>
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.tipoBadge,
                              backgroundColor: tipoBadge.bg,
                              color: tipoBadge.color,
                            }}>
                              {tipoBadge.text}
                            </span>
                          </td>
                          <td style={styles.tdRight}>
                            <strong>{cliente.cantidad_compras || 0}</strong>
                          </td>
                          <td style={styles.tdRight}>
                            <strong style={{ color: '#10b981', fontSize: '15px' }}>
                              {formatCurrency(cliente.total_comprado || 0, '$')}
                            </strong>
                          </td>
                          <td style={styles.tdRight}>
                            {cliente.saldo_cuenta_corriente > 0 ? (
                              <span style={{ color: '#dc2626', fontWeight: '600' }}>
                                {formatCurrency(cliente.saldo_cuenta_corriente, '$')}
                              </span>
                            ) : (
                              <span style={{ color: '#6b7280' }}>-</span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.creditoBadge,
                              backgroundColor: creditoStatus.bg,
                              color: creditoStatus.color,
                            }}>
                              {Icon && <Icon size={14} style={{ marginRight: '4px' }} />}
                              {creditoStatus.text}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {cliente.ultima_compra ? (
                              <span style={{ fontSize: '13px' }}>
                                {new Date(cliente.ultima_compra).toLocaleDateString('es-AR')}
                              </span>
                            ) : (
                              <span style={{ color: '#9ca3af', fontSize: '13px' }}>
                                Sin compras
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div style={styles.totalesBox}>
                <div style={styles.totalItem}>
                  <Users size={20} color="#2563eb" />
                  <div>
                    <div style={styles.totalLabel}>Clientes con Compras</div>
                    <div style={styles.totalValue}>
                      {data.clientes.filter(c => c.cantidad_compras > 0).length}
                    </div>
                  </div>
                </div>
                <div style={styles.totalItem}>
                  <ShoppingCart size={20} color="#10b981" />
                  <div>
                    <div style={styles.totalLabel}>Total Compras</div>
                    <div style={styles.totalValue}>
                      {data.clientes.reduce((sum, c) => sum + (parseInt(c.cantidad_compras) || 0), 0)}
                    </div>
                  </div>
                </div>
                <div style={styles.totalItem}>
                  <DollarSign size={20} color="#f59e0b" />
                  <div>
                    <div style={styles.totalLabel}>Total Facturado</div>
                    <div style={styles.totalValue}>
                      {formatCurrency(
                        data.clientes.reduce((sum, c) => sum + (parseFloat(c.total_comprado) || 0), 0),
                        '$'
                      )}
                    </div>
                  </div>
                </div>
                <div style={styles.totalItem}>
                  <AlertCircle size={20} color="#dc2626" />
                  <div>
                    <div style={styles.totalLabel}>Deuda Total</div>
                    <div style={styles.totalValue}>
                      {formatCurrency(
                        data.clientes.reduce((sum, c) => sum + (parseFloat(c.saldo_cuenta_corriente) || 0), 0),
                        '$'
                      )}
                    </div>
                  </div>
                </div>
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
    marginBottom: '30px',
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
  tr: {
    borderBottom: '1px solid #f3f4f6',
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
  ranking: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    color: 'white',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  clientName: {
    fontWeight: '500',
    color: '#1f2937',
  },
  tipoBadge: {
    padding: '4px 10px',
    fontSize: '12px',
    borderRadius: '12px',
    fontWeight: '600',
    display: 'inline-block',
  },
  creditoBadge: {
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
  },
  totalesBox: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    padding: '24px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
  },
  totalItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  totalValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
};

export default ReporteClientes;