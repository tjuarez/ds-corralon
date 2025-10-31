import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { cuentaCorrienteApi } from '../api/cuentaCorriente';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/Layout';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
  Printer,
  Filter,
} from 'lucide-react';

const EstadoCuenta = () => {
  const navigate = useNavigate();
  const { clienteId } = useParams();
  const { t } = useLanguage();
  const { showError } = useNotification();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    fecha_desde: '',
    fecha_hasta: '',
  });

  useEffect(() => {
    loadEstadoCuenta();
  }, [clienteId]);

  const loadEstadoCuenta = async () => {
    try {
      setLoading(true);
      const result = await cuentaCorrienteApi.getEstadoCuenta(clienteId, filters);
      setData(result);
    } catch (error) {
      showError(error.message);
      navigate('/cuenta-corriente');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadEstadoCuenta();
  };

  const handleClearFilters = () => {
    setFilters({ fecha_desde: '', fecha_hasta: '' });
    setTimeout(() => loadEstadoCuenta(), 0);
  };

  const handleImprimir = () => {
    window.print();
  };

  const getTipoIcon = (tipo) => {
    return tipo === 'debito' ? (
      <TrendingUp size={18} color="#dc2626" />
    ) : (
      <TrendingDown size={18} color="#10b981" />
    );
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

  const { cliente, movimientos } = data;
  const creditoDisponible = cliente.limite_credito - cliente.saldo_cuenta_corriente;

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Estado de Cuenta</h1>
          <p style={styles.subtitle}>{cliente.razon_social}</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => navigate('/cuenta-corriente')} style={styles.backButton}>
            <ArrowLeft size={18} style={{ marginRight: '6px' }} />
            Volver
          </button>
          <button onClick={handleImprimir} style={styles.printButton}>
            <Printer size={18} style={{ marginRight: '6px' }} />
            Imprimir
          </button>
          <button
            onClick={() => navigate(`/cuenta-corriente/${clienteId}/pago`)}
            style={styles.addButton}
          >
            <Plus size={18} style={{ marginRight: '6px' }} />
            Registrar Pago
          </button>
        </div>
      </div>

      <div className="print-content">
        {/* Resumen del Cliente */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: '#fee2e2' }}>
              <DollarSign size={24} color="#dc2626" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Saldo Actual</div>
              <div style={{
                ...styles.statValue,
                color: cliente.saldo_cuenta_corriente > 0 ? '#dc2626' : '#10b981'
              }}>
                {formatCurrency(cliente.saldo_cuenta_corriente, '$')}
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: '#dbeafe' }}>
              <TrendingUp size={24} color="#2563eb" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Límite de Crédito</div>
              <div style={styles.statValue}>
                {formatCurrency(cliente.limite_credito, '$')}
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: '#d1fae5' }}>
              <TrendingDown size={24} color="#10b981" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Crédito Disponible</div>
              <div style={{
                ...styles.statValue,
                color: creditoDisponible < 0 ? '#dc2626' : '#10b981'
              }}>
                {formatCurrency(Math.max(0, creditoDisponible), '$')}
              </div>
            </div>
          </div>

          {creditoDisponible < 0 && (
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, backgroundColor: '#fee2e2' }}>
                <AlertCircle size={24} color="#dc2626" />
              </div>
              <div style={styles.statContent}>
                <div style={styles.statLabel}>Sobre Límite</div>
                <div style={{ ...styles.statValue, color: '#dc2626' }}>
                  {formatCurrency(Math.abs(creditoDisponible), '$')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div style={styles.filtersSection}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={styles.filterButton}
          >
            <Filter size={18} style={{ marginRight: '6px' }} />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>

          {showFilters && (
            <div style={styles.filtersBox}>
              <div style={styles.filterInputs}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Fecha Desde</label>
                  <input
                    type="date"
                    value={filters.fecha_desde}
                    onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Fecha Hasta</label>
                  <input
                    type="date"
                    value={filters.fecha_hasta}
                    onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.filterActions}>
                <button onClick={handleFilter} style={styles.applyButton}>
                  Aplicar
                </button>
                <button onClick={handleClearFilters} style={styles.clearButton}>
                  Limpiar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabla de Movimientos */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Movimientos</h2>
          
          {movimientos.length === 0 ? (
            <div style={styles.noData}>
              <Calendar size={48} color="#9ca3af" />
              <p style={styles.noDataText}>No hay movimientos para mostrar</p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Tipo</th>
                    <th style={styles.th}>Concepto</th>
                    <th style={styles.th}>Medio Pago</th>
                    <th style={styles.thRight}>Débito</th>
                    <th style={styles.thRight}>Crédito</th>
                    <th style={styles.thRight}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((mov) => (
                    <tr key={mov.id} style={styles.tr}>
                      <td style={styles.td}>
                        {new Date(mov.fecha).toLocaleDateString('es-AR')}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.tipoCell}>
                          {getTipoIcon(mov.tipo_movimiento)}
                          <span style={{ marginLeft: '6px', textTransform: 'capitalize' }}>
                            {mov.tipo_movimiento}
                          </span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div>
                          <div>{mov.concepto}</div>
                          {mov.numero_comprobante && (
                            <div style={styles.comprobante}>
                              Comp: {mov.numero_comprobante}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        {mov.medio_pago ? (
                          <span style={styles.medioPago}>{mov.medio_pago}</span>
                        ) : '-'}
                      </td>
                      <td style={styles.tdRight}>
                        {mov.tipo_movimiento === 'debito' ? (
                          <span style={styles.debito}>
                            {formatCurrency(mov.monto, '$')}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={styles.tdRight}>
                        {mov.tipo_movimiento === 'credito' ? (
                          <span style={styles.credito}>
                            {formatCurrency(mov.monto, '$')}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={styles.tdRight}>
                        <strong>{formatCurrency(mov.saldo_nuevo, '$')}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Totales */}
        {movimientos.length > 0 && (
          <div style={styles.totalesSection}>
            <div style={styles.totalesBox}>
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Total Débitos:</span>
                <span style={styles.totalDebito}>
                  {formatCurrency(cliente.total_debitos || 0, '$')}
                </span>
              </div>
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Total Créditos:</span>
                <span style={styles.totalCredito}>
                  {formatCurrency(cliente.total_creditos || 0, '$')}
                </span>
              </div>
              <div style={styles.totalRowFinal}>
                <span style={styles.totalLabelFinal}>Saldo Actual:</span>
                <span style={{
                  ...styles.totalValueFinal,
                  color: cliente.saldo_cuenta_corriente > 0 ? '#dc2626' : '#10b981'
                }}>
                  {formatCurrency(cliente.saldo_cuenta_corriente, '$')}
                </span>
              </div>
            </div>
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
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '18px',
    color: '#6b7280',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
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
  printButton: {
    padding: '10px 20px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#6366f1',
    backgroundColor: '#e0e7ff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  addButton: {
    padding: '10px 20px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
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
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  filtersSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    marginBottom: '30px',
  },
  filterButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6366f1',
    backgroundColor: '#eff6ff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  filtersBox: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  filterInputs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '15px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '2px solid #e5e7eb',
    borderRadius: '6px',
    outline: 'none',
  },
  filterActions: {
    display: 'flex',
    gap: '10px',
  },
  applyButton: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  clearButton: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 20px 0',
    paddingBottom: '12px',
    borderBottom: '2px solid #f3f4f6',
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
  },
  tdRight: {
    padding: '14px 12px',
    textAlign: 'right',
    fontSize: '14px',
    color: '#1f2937',
  },
  tipoCell: {
    display: 'flex',
    alignItems: 'center',
  },
  comprobante: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  medioPago: {
    padding: '4px 8px',
    fontSize: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    textTransform: 'capitalize',
  },
  debito: {
    color: '#dc2626',
    fontWeight: '600',
  },
  credito: {
    color: '#10b981',
    fontWeight: '600',
  },
  totalesSection: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  totalesBox: {
    width: '400px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  totalLabel: {
    fontSize: '15px',
    color: '#6b7280',
  },
  totalDebito: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#dc2626',
  },
  totalCredito: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#10b981',
  },
  totalRowFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 0 0 0',
    marginTop: '12px',
    borderTop: '2px solid #1f2937',
  },
  totalLabelFinal: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalValueFinal: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
};

// Estilos de impresión
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .print-content, .print-content * {
      visibility: visible;
    }
    .print-content {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    button {
      display: none !important;
    }
    @page {
      margin: 2cm;
      size: A4;
    }
  }
`;

if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = printStyles;
  document.head.appendChild(styleElement);
}

export default EstadoCuenta;