import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildTenantPath } from '../utils/tenantHelper';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { reportesApi } from '../api/reportes';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/Layout';
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Wallet,
  FileText,
  AlertCircle,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showError } = useNotification();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const dashboardData = await reportesApi.getDashboard();
      setData(dashboardData);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      </Layout>
    );
  }

  if (!data) return null;

  // Preparar datos para gráficos
  const ventasGrafico = data.ventasUltimos7Dias.map(v => ({
    fecha: new Date(v.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
    ventas: parseFloat(v.total),
    cantidad: v.cantidad,
  }));

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('dashboard')}</h1>
          <p style={styles.subtitle}>Resumen general del negocio</p>
        </div>
      </div>

      {/* Métricas Principales */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard} onClick={() => navigate(buildTenantPath('/ventas'))}>
          <div style={{ ...styles.metricIcon, backgroundColor: '#dbeafe' }}>
            <TrendingUp size={28} color="#2563eb" />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricLabel}>{t('todaySales')}</div>
            <div style={styles.metricValue}>
              {formatCurrency(data.ventasHoy.total, '$')}
            </div>
            <div style={styles.metricSubtext}>
              {data.ventasHoy.cantidad} {data.ventasHoy.cantidad === 1 ? 'venta' : 'ventas'}
            </div>
          </div>
        </div>

        <div style={styles.metricCard} onClick={() => navigate(buildTenantPath('/ventas'))}>
          <div style={{ ...styles.metricIcon, backgroundColor: '#d1fae5' }}>
            <DollarSign size={28} color="#10b981" />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricLabel}>{t('monthSales')}</div>
            <div style={styles.metricValue}>
              {formatCurrency(data.ventasMes.total, '$')}
            </div>
            <div style={styles.metricSubtext}>
              {data.ventasMes.cantidad} {data.ventasMes.cantidad === 1 ? 'venta' : 'ventas'}
            </div>
          </div>
        </div>

        <div style={styles.metricCard} onClick={() => navigate(buildTenantPath('/productos'))}>
          <div style={{ ...styles.metricIcon, backgroundColor: '#fee2e2' }}>
            <AlertCircle size={28} color="#dc2626" />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricLabel}>{t('criticalStock')}</div>
            <div style={styles.metricValue}>{data.stockCritico.cantidad}</div>
            <div style={styles.metricSubtext}>productos bajo mínimo</div>
          </div>
        </div>

        <div style={styles.metricCard} onClick={() => navigate(buildTenantPath('/cuenta-corriente'))}>
          <div style={{ ...styles.metricIcon, backgroundColor: '#fef3c7' }}>
            <Wallet size={28} color="#f59e0b" />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricLabel}>{t('currentAccount')}</div>
            <div style={styles.metricValue}>
              {formatCurrency(data.cuentaCorriente.deuda_total, '$')}
            </div>
            <div style={styles.metricSubtext}>
              {data.cuentaCorriente.clientes_con_deuda} {data.cuentaCorriente.clientes_con_deuda === 1 ? 'cliente' : 'clientes'}
            </div>
          </div>
        </div>

        <div style={styles.metricCard} onClick={() => navigate(buildTenantPath('/caja'))}>
          <div style={{ ...styles.metricIcon, backgroundColor: '#e0e7ff' }}>
            <Package size={28} color="#6366f1" />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricLabel}>{t('openCash')}</div>
            <div style={styles.metricValue}>
              {formatCurrency(data.cajaAbierta.monto_total, '$')}
            </div>
            <div style={styles.metricSubtext}>
              {data.cajaAbierta.cantidad} {data.cajaAbierta.cantidad === 1 ? 'caja abierta' : 'cajas abiertas'}
            </div>
          </div>
        </div>

        <div style={styles.metricCard} onClick={() => navigate(buildTenantPath('/presupuestos'))}>
          <div style={{ ...styles.metricIcon, backgroundColor: '#fce7f3' }}>
            <FileText size={28} color="#ec4899" />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricLabel}>{t('pendingBudgets')}</div>
            <div style={styles.metricValue}>
              {formatCurrency(data.presupuestosPendientes.total, '$')}
            </div>
            <div style={styles.metricSubtext}>
              {data.presupuestosPendientes.cantidad} {data.presupuestosPendientes.cantidad === 1 ? 'presupuesto' : 'presupuestos'}
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Ventas */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>{t('salesLast7Days')}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={ventasGrafico}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip
              formatter={(value) => formatCurrency(value, '$')}
              labelStyle={{ color: '#1f2937' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="ventas"
              stroke="#10b981"
              strokeWidth={3}
              name="Ventas"
              dot={{ r: 5 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Productos y Clientes */}
      <div style={styles.grid2}>
        {/* Top Productos */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>{t('topProducts')}</h2>
            <button
              onClick={() => navigate(buildTenantPath('/reportes/productos'))}
              style={styles.viewAllButton}
            >
              {t('viewReport')}
              <ArrowRight size={16} style={{ marginLeft: '4px' }} />
            </button>
          </div>

          {data.topProductos.length === 0 ? (
            <div style={styles.noData}>
              <BarChart3 size={48} color="#9ca3af" />
              <p style={styles.noDataText}>No hay datos</p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Producto</th>
                    <th style={styles.thRight}>Cant.</th>
                    <th style={styles.thRight}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProductos.map((prod, index) => (
                    <tr key={prod.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.ranking}>{index + 1}</div>
                        <div>
                          <div style={styles.productName}>{prod.descripcion}</div>
                          <div style={styles.productCode}>{prod.codigo}</div>
                        </div>
                      </td>
                      <td style={styles.tdRight}>{prod.cantidad_vendida}</td>
                      <td style={styles.tdRight}>
                        {formatCurrency(prod.total_vendido, '$')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Clientes */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>{t('topClients')}</h2>
            <button
              onClick={() => navigate(buildTenantPath('/reportes/clientes'))}
              style={styles.viewAllButton}
            >
              {t('viewReport')}
              <ArrowRight size={16} style={{ marginLeft: '4px' }} />
            </button>
          </div>

          {data.topClientes.length === 0 ? (
            <div style={styles.noData}>
              <Users size={48} color="#9ca3af" />
              <p style={styles.noDataText}>No hay datos</p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Cliente</th>
                    <th style={styles.thRight}>Compras</th>
                    <th style={styles.thRight}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topClientes.map((cliente, index) => (
                    <tr key={cliente.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.ranking}>{index + 1}</div>
                        <div style={styles.clientName}>{cliente.razon_social}</div>
                      </td>
                      <td style={styles.tdRight}>{cliente.cantidad_compras}</td>
                      <td style={styles.tdRight}>
                        {formatCurrency(cliente.total_comprado, '$')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Botones de Reportes */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>{t('reports')}</h2>
        <div style={styles.reportsGrid}>
          <button
            onClick={() => navigate(buildTenantPath('/reportes/ventas'))}
            style={styles.reportButton}
          >
            <TrendingUp size={24} color="#2563eb" />
            <span>{t('salesReport')}</span>
            <ArrowRight size={20} color="#6b7280" />
          </button>

          <button
            onClick={() => navigate(buildTenantPath('/reportes/productos'))}
            style={styles.reportButton}
          >
            <Package size={24} color="#10b981" />
            <span>{t('productsReport')}</span>
            <ArrowRight size={20} color="#6b7280" />
          </button>

          <button
            onClick={() => navigate(buildTenantPath('/reportes/clientes'))}
            style={styles.reportButton}
          >
            <Users size={24} color="#f59e0b" />
            <span>{t('clientsReport')}</span>
            <ArrowRight size={20} color="#6b7280" />
          </button>

          <button
            onClick={() => navigate(buildTenantPath('/reportes/stock'))}
            style={styles.reportButton}
          >
            <AlertCircle size={24} color="#dc2626" />
            <span>{t('stockReport')}</span>
            <ArrowRight size={20} color="#6b7280" />
          </button>

          <button
            onClick={() => navigate(buildTenantPath('/reportes/caja'))}
            style={styles.reportButton}
          >
            <DollarSign size={24} color="#6366f1" />
            <span>{t('cashReport')}</span>
            <ArrowRight size={20} color="#6b7280" />
          </button>

          <button
            onClick={() => navigate(buildTenantPath('/reportes/rentabilidad'))}
            style={styles.reportButton}
          >
            <BarChart3 size={24} color="#ec4899" />
            <span>{t('profitabilityReport')}</span>
            <ArrowRight size={20} color="#6b7280" />
          </button>
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  header: {
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  metricIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  metricValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px',
  },
  metricSubtext: {
    fontSize: '13px',
    color: '#9ca3af',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    marginBottom: '30px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  viewAllButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '30px',
    marginBottom: '30px',
  },
  noData: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6b7280',
  },
  noDataText: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '16px 0 0 0',
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
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  tdRight: {
    padding: '14px 12px',
    textAlign: 'right',
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '600',
  },
  ranking: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  productName: {
    fontWeight: '500',
    color: '#1f2937',
  },
  productCode: {
    fontSize: '12px',
    color: '#6b7280',
  },
  clientName: {
    fontWeight: '500',
    color: '#1f2937',
  },
  reportsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  reportButton: {
    padding: '20px',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
    transition: 'all 0.2s',
  },
};

export default Dashboard;