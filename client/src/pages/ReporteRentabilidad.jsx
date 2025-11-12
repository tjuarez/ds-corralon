import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildTenantPath } from '../utils/tenantHelper';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { reportesApi } from '../api/reportes';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/Layout';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const ReporteRentabilidad = () => {
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
      const reporteData = await reportesApi.getReporteRentabilidad(filters);
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

  if (!data && !loading) {
    return null;
  }

  const chartData = data ? [
    {
      name: 'Ventas',
      monto: parseFloat(data.ventas.total),
    },
    {
      name: 'Compras',
      monto: parseFloat(data.compras.total),
    },
    {
      name: 'Rentabilidad',
      monto: parseFloat(data.rentabilidad),
    },
  ] : [];

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('profitabilityReport')}</h1>
          <p style={styles.subtitle}>Comparativa de ventas vs compras</p>
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
          {/* Métricas Principales */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, backgroundColor: '#d1fae5' }}>
                <TrendingUp size={28} color="#10b981" />
              </div>
              <div style={styles.statContent}>
                <div style={styles.statLabel}>Total Ventas</div>
                <div style={{ ...styles.statValue, color: '#10b981' }}>
                  {formatCurrency(data.ventas.total, '$')}
                </div>
                <div style={styles.statSubtext}>
                  {data.ventas.cantidad} {data.ventas.cantidad === 1 ? 'venta' : 'ventas'}
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, backgroundColor: '#fee2e2' }}>
                <TrendingDown size={28} color="#dc2626" />
              </div>
              <div style={styles.statContent}>
                <div style={styles.statLabel}>Total Compras</div>
                <div style={{ ...styles.statValue, color: '#dc2626' }}>
                  {formatCurrency(data.compras.total, '$')}
                </div>
                <div style={styles.statSubtext}>
                  {data.compras.cantidad} {data.compras.cantidad === 1 ? 'compra' : 'compras'}
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{ 
                ...styles.statIcon, 
                backgroundColor: data.rentabilidad >= 0 ? '#d1fae5' : '#fee2e2' 
              }}>
                <DollarSign size={28} color={data.rentabilidad >= 0 ? '#10b981' : '#dc2626'} />
              </div>
              <div style={styles.statContent}>
                <div style={styles.statLabel}>
                  {data.rentabilidad >= 0 ? 'Ganancia' : 'Pérdida'}
                </div>
                <div style={{ 
                  ...styles.statValue, 
                  color: data.rentabilidad >= 0 ? '#10b981' : '#dc2626' 
                }}>
                  {formatCurrency(Math.abs(data.rentabilidad), '$')}
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{ 
                ...styles.statIcon, 
                backgroundColor: parseFloat(data.margen) >= 0 ? '#dbeafe' : '#fee2e2' 
              }}>
                <Percent size={28} color={parseFloat(data.margen) >= 0 ? '#2563eb' : '#dc2626'} />
              </div>
              <div style={styles.statContent}>
                <div style={styles.statLabel}>Margen</div>
                <div style={{ 
                  ...styles.statValue, 
                  color: parseFloat(data.margen) >= 0 ? '#2563eb' : '#dc2626' 
                }}>
                  {data.margen}%
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico Comparativo */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Comparativa Ventas vs Compras</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(value, '$')}
                  labelStyle={{ color: '#1f2937' }}
                />
                <Legend />
                <Bar 
                  dataKey="monto" 
                  fill="#10b981" 
                  name="Monto"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Análisis Detallado */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Análisis Detallado</h2>

            <div style={styles.analysisGrid}>
              {/* Ventas */}
              <div style={styles.analysisCard}>
                <div style={styles.analysisHeader}>
                  <TrendingUp size={20} color="#10b981" />
                  <h3 style={styles.analysisTitle}>Ventas</h3>
                </div>
                <div style={styles.analysisContent}>
                  <div style={styles.analysisRow}>
                    <span style={styles.analysisLabel}>Cantidad:</span>
                    <span style={styles.analysisValue}>{data.ventas.cantidad}</span>
                  </div>
                  <div style={styles.analysisRow}>
                    <span style={styles.analysisLabel}>Total:</span>
                    <span style={{ ...styles.analysisValue, color: '#10b981', fontWeight: '700' }}>
                      {formatCurrency(data.ventas.total, '$')}
                    </span>
                  </div>
                  <div style={styles.analysisRow}>
                    <span style={styles.analysisLabel}>Promedio:</span>
                    <span style={styles.analysisValue}>
                      {formatCurrency(
                        data.ventas.cantidad > 0 ? data.ventas.total / data.ventas.cantidad : 0,
                        '$'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compras */}
              <div style={styles.analysisCard}>
                <div style={styles.analysisHeader}>
                  <TrendingDown size={20} color="#dc2626" />
                  <h3 style={styles.analysisTitle}>Compras</h3>
                </div>
                <div style={styles.analysisContent}>
                  <div style={styles.analysisRow}>
                    <span style={styles.analysisLabel}>Cantidad:</span>
                    <span style={styles.analysisValue}>{data.compras.cantidad}</span>
                  </div>
                  <div style={styles.analysisRow}>
                    <span style={styles.analysisLabel}>Total:</span>
                    <span style={{ ...styles.analysisValue, color: '#dc2626', fontWeight: '700' }}>
                      {formatCurrency(data.compras.total, '$')}
                    </span>
                  </div>
                  <div style={styles.analysisRow}>
                    <span style={styles.analysisLabel}>Promedio:</span>
                    <span style={styles.analysisValue}>
                      {formatCurrency(
                        data.compras.cantidad > 0 ? data.compras.total / data.compras.cantidad : 0,
                        '$'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rentabilidad */}
              <div style={{
                ...styles.analysisCard,
                backgroundColor: data.rentabilidad >= 0 ? '#f0fdf4' : '#fef2f2',
                border: `2px solid ${data.rentabilidad >= 0 ? '#10b981' : '#dc2626'}`,
              }}>
                <div style={styles.analysisHeader}>
                  <DollarSign size={20} color={data.rentabilidad >= 0 ? '#10b981' : '#dc2626'} />
                  <h3 style={styles.analysisTitle}>Resultado</h3>
                </div>
                <div style={styles.analysisContent}>
                  <div style={styles.analysisRow}>
                    <span style={styles.analysisLabel}>
                      {data.rentabilidad >= 0 ? 'Ganancia:' : 'Pérdida:'}
                    </span>
                    <span style={{ 
                      ...styles.analysisValue, 
                      color: data.rentabilidad >= 0 ? '#10b981' : '#dc2626',
                      fontWeight: '700',
                      fontSize: '18px'
                    }}>
                      {formatCurrency(Math.abs(data.rentabilidad), '$')}
                    </span>
                  </div>
                  <div style={styles.analysisRow}>
                    <span style={styles.analysisLabel}>Margen:</span>
                    <span style={{ 
                      ...styles.analysisValue, 
                      color: parseFloat(data.margen) >= 0 ? '#10b981' : '#dc2626',
                      fontWeight: '700',
                      fontSize: '18px'
                    }}>
                      {data.margen}%
                    </span>
                  </div>
                  <div style={styles.analysisRow}>
                    <span style={styles.analysisLabel}>Ratio V/C:</span>
                    <span style={styles.analysisValue}>
                      {data.compras.total > 0 
                        ? (data.ventas.total / data.compras.total).toFixed(2)
                        : '0.00'
                      }x
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nota Importante */}
          <div style={styles.noteBox}>
            <div style={styles.noteIcon}>ℹ️</div>
            <div>
              <div style={styles.noteTitle}>Nota sobre el cálculo</div>
              <div style={styles.noteText}>
                Este reporte calcula una rentabilidad <strong>aproximada</strong> comparando el total de ventas con el total de compras en el período seleccionado. 
                Para un análisis más preciso de rentabilidad por producto, se requeriría calcular el costo de mercadería vendida (CMV) y considerar otros gastos operativos.
              </div>
            </div>
          </div>
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
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statSubtext: {
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: '4px',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 24px 0',
    paddingBottom: '12px',
    borderBottom: '2px solid #f3f4f6',
  },
  analysisGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  analysisCard: {
    padding: '24px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
  },
  analysisHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid #e5e7eb',
  },
  analysisTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  analysisContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  analysisRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  analysisValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  noteBox: {
    padding: '20px',
    backgroundColor: '#eff6ff',
    border: '2px solid #93c5fd',
    borderRadius: '12px',
    display: 'flex',
    gap: '16px',
  },
  noteIcon: {
    fontSize: '28px',
    flexShrink: 0,
  },
  noteTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: '8px',
  },
  noteText: {
    fontSize: '14px',
    color: '#1e40af',
    lineHeight: '1.6',
  },
};

export default ReporteRentabilidad;