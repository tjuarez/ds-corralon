import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { reportesApi } from '../api/reportes';
import Layout from '../components/Layout';
import { ArrowLeft, Package, AlertTriangle, XCircle, CheckCircle, Building2 } from 'lucide-react';

const ReporteStock = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showError } = useNotification();
  const { user, sucursalActiva } = useAuth();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');

  useEffect(() => {
    loadReporte();
  }, [sucursalActiva]);

  const loadReporte = async (tipo = 'todos', sucursalId = null) => {
    try {
      setLoading(true);
      const filters = {};
      
      if (tipo !== 'todos') {
        filters.tipo = tipo;
      }

      // Si no se especifica sucursal, usar la activa del contexto
      if (sucursalId) {
        filters.sucursal_id = sucursalId;
      } else if (sucursalActiva) {
        filters.sucursal_id = sucursalActiva.id;
      }

      const reporteData = await reportesApi.getReporteStock(filters);
      setData(reporteData);
      
      if (reporteData.sucursales) {
        setSucursales(reporteData.sucursales);
      }

      if (reporteData.sucursal_actual) {
        setSucursalSeleccionada(reporteData.sucursal_actual.id);
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (tipo) => {
    setFiltroTipo(tipo);
    loadReporte(tipo, sucursalSeleccionada);
  };

  const handleSucursalChange = (e) => {
    const sucursalId = e.target.value;
    setSucursalSeleccionada(sucursalId);
    loadReporte(filtroTipo, sucursalId);
  };

  const getEstadoBadge = (estadoStock) => {
    const estados = {
      sin_stock: { 
        text: 'Sin Stock', 
        color: '#dc2626', 
        bg: '#fee2e2',
        icon: XCircle 
      },
      critico: { 
        text: 'Stock Crítico', 
        color: '#f59e0b', 
        bg: '#fef3c7',
        icon: AlertTriangle 
      },
      normal: { 
        text: 'Stock Normal', 
        color: '#10b981', 
        bg: '#d1fae5',
        icon: CheckCircle 
      },
    };
    return estados[estadoStock] || estados.normal;
  };

  // Agrupar productos por código (para mostrar múltiples sucursales)
  const productosAgrupados = data?.productos.reduce((acc, producto) => {
    if (!acc[producto.codigo]) {
      acc[producto.codigo] = {
        ...producto,
        sucursales: []
      };
    }
    acc[producto.codigo].sucursales.push({
      sucursal_id: producto.sucursal_id,
      sucursal_nombre: producto.sucursal_nombre,
      stock_actual: producto.stock_actual,
      stock_minimo: producto.stock_minimo,
      estado_stock: producto.estado_stock
    });
    return acc;
  }, {});

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('stockReport')}</h1>
          <p style={styles.subtitle}>Estado actual del inventario por sucursal</p>
        </div>
        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
          <ArrowLeft size={18} style={{ marginRight: '6px' }} />
          {t('back')}
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      ) : data ? (
        <>
          {/* Selector de sucursal (solo para admin con "Todas las sucursales") */}
          {user?.rol === 'admin' && !sucursalActiva && sucursales.length > 0 && (
            <div style={styles.filterBar}>
              <div style={styles.filterGroup}>
                <Building2 size={18} style={{ marginRight: '8px' }} />
                <label style={styles.filterLabel}>Sucursal:</label>
                <select
                  value={sucursalSeleccionada}
                  onChange={handleSucursalChange}
                  style={styles.filterSelect}
                >
                  <option value="">Todas las sucursales</option>
                  {sucursales.map(suc => (
                    <option key={suc.id} value={suc.id}>
                      {suc.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Resumen */}
          <div style={styles.statsGrid}>
            <div 
              style={{
                ...styles.statCard,
                cursor: 'pointer',
                border: filtroTipo === 'todos' ? '3px solid #2563eb' : 'none'
              }}
              onClick={() => handleFiltroChange('todos')}
            >
              <div style={{ ...styles.statIcon, backgroundColor: '#dbeafe' }}>
                <Package size={24} color="#2563eb" />
              </div>
              <div>
                <div style={styles.statLabel}>Total Productos</div>
                <div style={styles.statValue}>{data.resumen?.total_productos || 0}</div>
              </div>
            </div>

            <div 
              style={{
                ...styles.statCard,
                cursor: 'pointer',
                border: filtroTipo === 'sin_stock' ? '3px solid #dc2626' : 'none'
              }}
              onClick={() => handleFiltroChange('sin_stock')}
            >
              <div style={{ ...styles.statIcon, backgroundColor: '#fee2e2' }}>
                <XCircle size={24} color="#dc2626" />
              </div>
              <div>
                <div style={styles.statLabel}>Sin Stock</div>
                <div style={styles.statValue}>{data.resumen?.sin_stock || 0}</div>
              </div>
            </div>

            <div 
              style={{
                ...styles.statCard,
                cursor: 'pointer',
                border: filtroTipo === 'critico' ? '3px solid #f59e0b' : 'none'
              }}
              onClick={() => handleFiltroChange('critico')}
            >
              <div style={{ ...styles.statIcon, backgroundColor: '#fef3c7' }}>
                <AlertTriangle size={24} color="#f59e0b" />
              </div>
              <div>
                <div style={styles.statLabel}>Stock Crítico</div>
                <div style={styles.statValue}>{data.resumen?.stock_critico || 0}</div>
              </div>
            </div>

            <div 
              style={{
                ...styles.statCard,
                cursor: 'pointer',
                border: filtroTipo === 'normal' ? '3px solid #10b981' : 'none'
              }}
              onClick={() => handleFiltroChange('normal')}
            >
              <div style={{ ...styles.statIcon, backgroundColor: '#d1fae5' }}>
                <CheckCircle size={24} color="#10b981" />
              </div>
              <div>
                <div style={styles.statLabel}>Stock Normal</div>
                <div style={styles.statValue}>{data.resumen?.stock_normal || 0}</div>
              </div>
            </div>
          </div>

          {/* Tabla de Productos */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              {filtroTipo === 'sin_stock' ? 'Productos Sin Stock' :
               filtroTipo === 'critico' ? 'Productos con Stock Crítico' :
               filtroTipo === 'normal' ? 'Productos con Stock Normal' :
               'Inventario por Sucursal'}
            </h2>

            {data.productos.length === 0 ? (
              <div style={styles.noData}>
                <Package size={48} color="#9ca3af" />
                <p style={styles.noDataText}>No hay productos en esta categoría</p>
              </div>
            ) : (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Código</th>
                      <th style={styles.th}>Producto</th>
                      <th style={styles.th}>Categoría</th>
                      <th style={styles.th}>Sucursal</th>
                      <th style={styles.thCenter}>Stock Actual</th>
                      <th style={styles.thCenter}>Stock Mínimo</th>
                      <th style={styles.th}>Unidad</th>
                      <th style={styles.thCenter}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.productos.map((producto) => {
                      const estadoBadge = getEstadoBadge(producto.estado_stock);
                      const Icon = estadoBadge.icon;
                      return (
                        <tr key={`${producto.id}-${producto.sucursal_id}`} style={styles.tr}>
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
                          <td style={styles.td}>
                            <span style={styles.sucursal}>{producto.sucursal_nombre}</span>
                          </td>
                          <td style={styles.tdCenter}>
                            <strong style={{
                              color: producto.estado_stock === 'sin_stock' ? '#dc2626' :
                                     producto.estado_stock === 'critico' ? '#f59e0b' :
                                     '#10b981'
                            }}>
                              {producto.stock_actual}
                            </strong>
                          </td>
                          <td style={styles.tdCenter}>
                            {producto.stock_minimo}
                          </td>
                          <td style={styles.td}>{producto.unidad_medida}</td>
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
            )}
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
  filterBar: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  filterLabel: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#374151',
  },
  filterSelect: {
    padding: '10px 40px 10px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    minWidth: '250px',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
    transition: 'all 0.2s',
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
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
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
  tdCenter: {
    padding: '14px 12px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#1f2937',
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
  sucursal: {
    padding: '4px 10px',
    fontSize: '12px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '12px',
    fontWeight: '600',
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

export default ReporteStock;