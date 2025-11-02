import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { reportesApi } from '../api/reportes';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/Layout';
import { ArrowLeft, Calendar, TrendingUp, DollarSign, FileText } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const ReporteVentas = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showError } = useNotification();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    fecha_desde: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0],
    fecha_hasta: new Date().toISOString().split('T')[0],
    agrupar_por: 'dia',
  });

  useEffect(() => {
    loadReporte();
  }, []);

  const loadReporte = async () => {
    try {
      setLoading(true);
      const reporteData = await reportesApi.getReporteVentas(filters);
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

  const COLORS = ['#10b981', '#2563eb', '#f59e0b', '#ec4899', '#6366f1'];

  // Preparar datos para gráficos
  const ventasGrafico = data?.ventas.map(v => ({
    periodo: v.periodo,
    total: parseFloat(v.total),
    cantidad: v.cantidad,
  })) || [];

  const formaPagoGrafico = data?.porFormaPago.map(fp => ({
    name: fp.forma_pago === 'efectivo' ? 'Efectivo' :
          fp.forma_pago === 'tarjeta' ? 'Tarjeta' :
          fp.forma_pago === 'transferencia' ? 'Transferencia' :
          fp.forma_pago === 'cuenta_corriente' ? 'Cuenta Corriente' :
          fp.forma_pago,
    value: parseFloat(fp.total),
  })) || [];

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('salesReport')}</h1>
          <p style={styles.subtitle}>Análisis detallado de ventas por período</p>
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

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>{t('groupBy')}</label>
            <select
              name="agrupar_por"
              value={filters.agrupar_por}
              onChange={handleFilterChange}
              style={styles.filterInput}
            >
              <option value="dia">{t('day')}</option>
              <option value="mes">{t('month')}</option>
              <option value="año">{t('year')}</option>
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
          
          {/* Si no hay ventas, mostrar mensaje */}
          {data.ventas.length === 0 ? (
            <div style={styles.noDataBox}>
              <FileText size={64} color="#9ca3af" />
              <h3 style={styles.noDataTitle}>No hay ventas en este período</h3>
              <p style={styles.noDataText}>
                Intenta cambiar el rango de fechas para ver resultados
              </p>
            </div>
          ) : (
            <>
            {/* Resumen */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={{ ...styles.statIcon, backgroundColor: '#dbeafe' }}>
                  <FileText size={24} color="#2563eb" />
                </div>
                <div>
                  <div style={styles.statLabel}>Total Ventas</div>
                  <div style={styles.statValue}>
                    {data.resumen?.total_ventas || 0}
                  </div>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={{ ...styles.statIcon, backgroundColor: '#d1fae5' }}>
                  <DollarSign size={24} color="#10b981" />
                </div>
                <div>
                  <div style={styles.statLabel}>Total Facturado</div>
                  <div style={styles.statValue}>
                    {formatCurrency(data.resumen?.total_general || 0, '$')}
                  </div>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={{ ...styles.statIcon, backgroundColor: '#fef3c7' }}>
                  <TrendingUp size={24} color="#f59e0b" />
                </div>
                <div>
                  <div style={styles.statLabel}>Ticket Promedio</div>
                  <div style={styles.statValue}>
                    {formatCurrency(data.resumen?.ticket_promedio || 0, '$')}
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico de Ventas */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Ventas por Período</h2>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={ventasGrafico}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(value, '$')}
                    labelStyle={{ color: '#1f2937' }}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="#10b981" name="Total Vendido" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Ventas por Forma de Pago */}
            {data.porFormaPago.length > 0 && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Ventas por Forma de Pago</h2>
                <div style={styles.grid2}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formaPagoGrafico}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${formatCurrency(entry.value, '$')}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {formaPagoGrafico.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value, '$')} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Forma de Pago</th>
                          <th style={styles.thRight}>Cantidad</th>
                          <th style={styles.thRight}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.porFormaPago.map((fp, index) => (
                          <tr key={index} style={styles.tr}>
                            <td style={styles.td}>
                              <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: COLORS[index % COLORS.length],
                                display: 'inline-block',
                                marginRight: '8px',
                              }}></div>
                              {fp.forma_pago === 'efectivo' ? 'Efectivo' :
                              fp.forma_pago === 'tarjeta' ? 'Tarjeta' :
                              fp.forma_pago === 'transferencia' ? 'Transferencia' :
                              fp.forma_pago === 'cuenta_corriente' ? 'Cuenta Corriente' :
                              fp.forma_pago}
                            </td>
                            <td style={styles.tdRight}>{fp.cantidad}</td>
                            <td style={styles.tdRight}>
                              {formatCurrency(fp.total, '$')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla Detallada */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Detalle por Período</h2>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Período</th>
                      <th style={styles.thRight}>Cantidad</th>
                      <th style={styles.thRight}>Subtotal</th>
                      <th style={styles.thRight}>Descuentos</th>
                      <th style={styles.thRight}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ventas.map((v, index) => (
                      <tr key={index} style={styles.tr}>
                        <td style={styles.td}>{v.periodo}</td>
                        <td style={styles.tdRight}>{v.cantidad}</td>
                        <td style={styles.tdRight}>{formatCurrency(v.subtotal, '$')}</td>
                        <td style={styles.tdRight}>{formatCurrency(v.descuentos, '$')}</td>
                        <td style={styles.tdRight}>
                          <strong>{formatCurrency(v.total, '$')}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
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
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
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
};

export default ReporteVentas;