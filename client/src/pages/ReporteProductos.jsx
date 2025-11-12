import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildTenantPath } from '../utils/tenantHelper';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { reportesApi } from '../api/reportes';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/Layout';
import { ArrowLeft, Calendar, Package, TrendingUp, AlertCircle } from 'lucide-react';

const ReporteProductos = () => {
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
      const reporteData = await reportesApi.getReporteProductos(filters);
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

  const getStockBadge = (producto) => {
    if (producto.stock_actual === 0) {
      return { text: 'Sin Stock', color: '#dc2626', bg: '#fee2e2' };
    }
    if (producto.stock_actual <= producto.stock_minimo) {
      return { text: 'Stock Crítico', color: '#f59e0b', bg: '#fef3c7' };
    }
    return { text: 'Stock Normal', color: '#10b981', bg: '#d1fae5' };
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('productsReport')}</h1>
          <p style={styles.subtitle}>Productos más vendidos por período</p>
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
          {data.productos.length === 0 ? (
            <div style={styles.noDataBox}>
              <Package size={64} color="#9ca3af" />
              <h3 style={styles.noDataTitle}>No hay productos vendidos en este período</h3>
              <p style={styles.noDataText}>
                Intenta cambiar el rango de fechas para ver resultados
              </p>
            </div>
          ) : (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Top {filters.limite} Productos Más Vendidos
              </h2>

              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Código</th>
                      <th style={styles.th}>Producto</th>
                      <th style={styles.th}>Categoría</th>
                      <th style={styles.thRight}>Unidades</th>
                      <th style={styles.thRight}>N° Ventas</th>
                      <th style={styles.thRight}>Total Vendido</th>
                      <th style={styles.thCenter}>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.productos.map((producto, index) => {
                      const stockBadge = getStockBadge(producto);
                      return (
                        <tr key={producto.id} style={styles.tr}>
                          <td style={styles.td}>
                            <div style={{
                              ...styles.ranking,
                              backgroundColor: index < 3 ? '#f59e0b' : '#6b7280'
                            }}>
                              {index + 1}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.codigo}>{producto.codigo}</span>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.productName}>{producto.descripcion}</div>
                          </td>
                          <td style={styles.td}>
                            {producto.categoria ? (
                              <span style={styles.categoria}>{producto.categoria}</span>
                            ) : (
                              <span style={styles.sinCategoria}>Sin categoría</span>
                            )}
                          </td>
                          <td style={styles.tdRight}>
                            <strong>{producto.cantidad_vendida}</strong>
                          </td>
                          <td style={styles.tdRight}>{producto.numero_ventas}</td>
                          <td style={styles.tdRight}>
                            <strong>{formatCurrency(producto.total_vendido, '$')}</strong>
                          </td>
                          <td style={styles.tdCenter}>
                            <div style={styles.stockInfo}>
                              <span style={{
                                ...styles.stockBadge,
                                backgroundColor: stockBadge.bg,
                                color: stockBadge.color,
                              }}>
                                {producto.stock_actual}
                              </span>
                              {producto.stock_actual <= producto.stock_minimo && (
                                <AlertCircle size={16} color={stockBadge.color} />
                              )}
                            </div>
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
  codigo: {
    padding: '4px 8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  productName: {
    fontWeight: '500',
    color: '#1f2937',
  },
  categoria: {
    padding: '4px 10px',
    fontSize: '12px',
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
    borderRadius: '12px',
    fontWeight: '600',
  },
  sinCategoria: {
    fontSize: '12px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  stockInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  stockBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
  },
};

export default ReporteProductos;