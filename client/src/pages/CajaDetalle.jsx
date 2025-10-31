import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { cajaApi } from '../api/caja';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/Layout';
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  User,
  FileText,
  Printer,
  Activity,
  AlertCircle,
} from 'lucide-react';

const CajaDetalle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { showError } = useNotification();
  const { user } = useAuth();

  const [caja, setCaja] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCaja();
  }, [id]);

  const loadCaja = async () => {
    try {
      setLoading(true);
      const [cajaData, resumenData] = await Promise.all([
        cajaApi.getById(id),
        cajaApi.getResumen(id)
      ]);
      setCaja(cajaData.caja);
      setResumen(resumenData);
    } catch (error) {
      showError(error.message);
      navigate('/caja');
    } finally {
      setLoading(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const getTipoIcon = (tipo) => {
    return tipo === 'ingreso' ? (
      <TrendingUp size={18} color="#10b981" />
    ) : (
      <TrendingDown size={18} color="#dc2626" />
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

  if (!caja || !resumen) return null;

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Caja N° {caja.numero}</h1>
          <p style={styles.subtitle}>
            {new Date(caja.fecha_apertura).toLocaleString('es-AR')}
          </p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => navigate('/caja')} style={styles.backButton}>
            <ArrowLeft size={18} style={{ marginRight: '6px' }} />
            Volver
          </button>
          <button onClick={handleImprimir} style={styles.printButton}>
            <Printer size={18} style={{ marginRight: '6px' }} />
            Imprimir
          </button>
          {caja.estado === 'abierta' && (
            <>
              <button
                onClick={() => navigate(`/caja/${id}/movimiento`)}
                style={styles.addButton}
              >
                <Plus size={18} style={{ marginRight: '6px' }} />
                Nuevo Movimiento
              </button>
              <button
                onClick={() => navigate(`/caja/${id}/cerrar`)}
                style={styles.cerrarButton}
              >
                Cerrar Caja
              </button>
            </>
          )}
        </div>
      </div>

      <div className="print-content">
        {/* Resumen */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: '#dbeafe' }}>
              <DollarSign size={24} color="#2563eb" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Monto Inicial</div>
              <div style={styles.statValue}>{formatCurrency(caja.monto_inicial, '$')}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: '#d1fae5' }}>
              <TrendingUp size={24} color="#10b981" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>
                Ingresos ({resumen.cantidad_ingresos})
              </div>
              <div style={{ ...styles.statValue, color: '#10b981' }}>
                {formatCurrency(resumen.total_ingresos, '$')}
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: '#fee2e2' }}>
              <TrendingDown size={24} color="#dc2626" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>
                Egresos ({resumen.cantidad_egresos})
              </div>
              <div style={{ ...styles.statValue, color: '#dc2626' }}>
                {formatCurrency(resumen.total_egresos, '$')}
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{
              ...styles.statIcon,
              backgroundColor: caja.estado === 'abierta' ? '#10b981' : '#6b7280'
            }}>
              <Activity size={24} color="white" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>
                {caja.estado === 'abierta' ? 'Monto Actual' : 'Monto Final'}
              </div>
              <div style={styles.statValue}>
                {formatCurrency(
                  caja.estado === 'abierta' ? resumen.monto_actual : caja.monto_final,
                  '$'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Diferencia (solo si está cerrada) */}
        {caja.estado === 'cerrada' && caja.diferencia !== 0 && (
          <div style={{
            ...styles.alertBox,
            backgroundColor: caja.diferencia > 0 ? '#d1fae5' : '#fee2e2',
            borderColor: caja.diferencia > 0 ? '#10b981' : '#dc2626',
          }}>
            <AlertCircle size={24} color={caja.diferencia > 0 ? '#10b981' : '#dc2626'} />
            <div>
              <div style={styles.alertTitle}>
                {caja.diferencia > 0 ? 'Sobrante en caja' : 'Faltante en caja'}
              </div>
              <div style={styles.alertText}>
                Diferencia: {formatCurrency(Math.abs(caja.diferencia), '$')}
                <br />
                Esperado: {formatCurrency(caja.monto_esperado, '$')} | 
                Contado: {formatCurrency(caja.monto_final, '$')}
              </div>
            </div>
          </div>
        )}

        {/* Información General */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Información General</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <User size={18} style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Abierta por</div>
                <div style={styles.infoValue}>{caja.usuario_apertura_nombre}</div>
              </div>
            </div>

            <div style={styles.infoItem}>
              <Calendar size={18} style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Fecha de Apertura</div>
                <div style={styles.infoValue}>
                  {new Date(caja.fecha_apertura).toLocaleString('es-AR')}
                </div>
              </div>
            </div>

            {caja.estado === 'cerrada' && (
              <>
                <div style={styles.infoItem}>
                  <User size={18} style={styles.infoIcon} />
                  <div>
                    <div style={styles.infoLabel}>Cerrada por</div>
                    <div style={styles.infoValue}>{caja.usuario_cierre_nombre}</div>
                  </div>
                </div>

                <div style={styles.infoItem}>
                  <Calendar size={18} style={styles.infoIcon} />
                  <div>
                    <div style={styles.infoLabel}>Fecha de Cierre</div>
                    <div style={styles.infoValue}>
                      {new Date(caja.fecha_cierre).toLocaleString('es-AR')}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {caja.observaciones_apertura && (
            <div style={styles.observacionesBox}>
              <div style={styles.observacionesLabel}>Observaciones de Apertura:</div>
              <div style={styles.observacionesText}>{caja.observaciones_apertura}</div>
            </div>
          )}

          {caja.observaciones_cierre && (
            <div style={styles.observacionesBox}>
              <div style={styles.observacionesLabel}>Observaciones de Cierre:</div>
              <div style={styles.observacionesText}>{caja.observaciones_cierre}</div>
            </div>
          )}
        </div>

        {/* Movimientos */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Movimientos de Caja</h2>

          {caja.movimientos.length === 0 ? (
            <div style={styles.noData}>
              <FileText size={48} color="#9ca3af" />
              <p style={styles.noDataText}>No hay movimientos registrados</p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Fecha/Hora</th>
                    <th style={styles.th}>Tipo</th>
                    <th style={styles.th}>Categoría</th>
                    <th style={styles.th}>Concepto</th>
                    <th style={styles.th}>Usuario</th>
                    <th style={styles.thRight}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {caja.movimientos.map((mov) => (
                    <tr key={mov.id} style={styles.tr}>
                      <td style={styles.td}>
                        {new Date(mov.fecha).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.tipoCell}>
                          {getTipoIcon(mov.tipo_movimiento)}
                          <span style={{
                            marginLeft: '6px',
                            textTransform: 'capitalize',
                            color: mov.tipo_movimiento === 'ingreso' ? '#10b981' : '#dc2626',
                            fontWeight: '600'
                          }}>
                            {mov.tipo_movimiento}
                          </span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        {mov.categoria ? (
                          <span style={styles.categoria}>{mov.categoria}</span>
                        ) : '-'}
                      </td>
                      <td style={styles.td}>
                        <div>
                          {mov.concepto}
                          {mov.numero_comprobante && (
                            <div style={styles.comprobante}>
                              Comp: {mov.numero_comprobante}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>{mov.usuario_nombre || '-'}</td>
                      <td style={styles.tdRight}>
                        <span style={{
                          fontWeight: '600',
                          color: mov.tipo_movimiento === 'ingreso' ? '#10b981' : '#dc2626'
                        }}>
                          {mov.tipo_movimiento === 'ingreso' ? '+' : '-'}
                          {formatCurrency(mov.monto, '$')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
    fontSize: '16px',
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
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  cerrarButton: {
    padding: '10px 20px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
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
  alertBox: {
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    marginBottom: '30px',
  },
  alertTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  alertText: {
    fontSize: '14px',
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
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  infoItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  infoIcon: {
    color: '#6b7280',
    marginTop: '2px',
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  infoValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
  },
  observacionesBox: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginTop: '16px',
  },
  observacionesLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '8px',
  },
  observacionesText: {
    fontSize: '14px',
    color: '#1f2937',
    whiteSpace: 'pre-wrap',
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
  categoria: {
    padding: '4px 8px',
    fontSize: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    textTransform: 'capitalize',
  },
  comprobante: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
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

export default CajaDetalle;