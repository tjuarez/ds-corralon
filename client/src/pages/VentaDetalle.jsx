import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { ventasApi } from '../api/ventas';
import Layout from '../components/Layout';
import {
  ArrowLeft,
  Calendar,
  User,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Printer,
  Ban,
} from 'lucide-react';

const VentaDetalle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { showSuccess, showError, showConfirm } = useNotification();
  const { user } = useAuth();

  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVenta();
  }, [id]);

  const loadVenta = async () => {
    try {
      setLoading(true);
      const data = await ventasApi.getById(id);
      setVenta(data.venta);
    } catch (error) {
      showError(error.message);
      navigate('/ventas');
    } finally {
      setLoading(false);
    }
  };

  const handleAnular = async () => {
    const confirmed = await showConfirm(
      `¿Está seguro de anular la venta "${venta.numero_comprobante}"? Esta acción devolverá el stock y no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await ventasApi.anular(id, user.id);
      showSuccess('Venta anulada exitosamente. Stock devuelto.');
      loadVenta();
    } catch (error) {
      showError(error.message);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const getEstadoBadge = (estado) => {
    if (estado === 'completada') {
      return (
        <span style={{
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          backgroundColor: '#d1fae5',
          color: '#059669',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <CheckCircle size={18} />
          Completada
        </span>
      );
    } else {
      return (
        <span style={{
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <XCircle size={18} />
          Anulada
        </span>
      );
    }
  };

  const getTipoComprobante = (tipo) => {
    const tipos = {
      'factura_a': 'Factura A',
      'factura_b': 'Factura B',
      'factura_c': 'Factura C',
      'remito': 'Remito',
      'ticket': 'Ticket'
    };
    return tipos[tipo] || tipo;
  };

  const getFormaPago = (forma) => {
    const formas = {
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta',
      'transferencia': 'Transferencia',
      'cuenta_corriente': 'Cuenta Corriente'
    };
    return formas[forma] || forma;
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

  if (!venta) return null;

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{getTipoComprobante(venta.tipo_comprobante)} {venta.numero_comprobante}</h1>
          <p style={styles.subtitle}>Detalles completos de la venta</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => navigate('/ventas')} style={styles.backButton}>
            <ArrowLeft size={18} style={{ marginRight: '6px' }} />
            Volver
          </button>
          <button onClick={handleImprimir} style={styles.printButton}>
            <Printer size={18} style={{ marginRight: '6px' }} />
            Imprimir
          </button>
          {venta.estado === 'completada' && user.rol === 'admin' && (
            <button onClick={handleAnular} style={styles.anularButton}>
              <Ban size={18} style={{ marginRight: '6px' }} />
              Anular Venta
            </button>
          )}
        </div>
      </div>

      {/* Estado */}
      <div style={styles.statusBar}>
        <div style={styles.statusLeft}>
          <span style={styles.statusLabel}>Estado:</span>
          {getEstadoBadge(venta.estado)}
        </div>
      </div>

      <div style={styles.container} className="print-content">
        {/* Información General */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Información General</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <FileText size={18} style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Comprobante</div>
                <div style={styles.infoValue}>{venta.numero_comprobante}</div>
              </div>
            </div>

            <div style={styles.infoItem}>
              <FileText size={18} style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Tipo</div>
                <div style={styles.infoValue}>{getTipoComprobante(venta.tipo_comprobante)}</div>
              </div>
            </div>

            <div style={styles.infoItem}>
              <Calendar size={18} style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Fecha</div>
                <div style={styles.infoValue}>
                  {new Date(venta.fecha).toLocaleDateString('es-AR')}
                </div>
              </div>
            </div>

            <div style={styles.infoItem}>
              <DollarSign size={18} style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Moneda</div>
                <div style={styles.infoValue}>{venta.moneda_codigo}</div>
              </div>
            </div>

            <div style={styles.infoItem}>
              <FileText size={18} style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Forma de Pago</div>
                <div style={styles.infoValue}>{getFormaPago(venta.forma_pago)}</div>
              </div>
            </div>

            {venta.usuario_nombre && (
              <div style={styles.infoItem}>
                <User size={18} style={styles.infoIcon} />
                <div>
                  <div style={styles.infoLabel}>Vendedor</div>
                  <div style={styles.infoValue}>{venta.usuario_nombre}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información del Cliente */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Información del Cliente</h2>
          <div style={styles.clienteBox}>
            <div style={styles.clienteHeader}>
              <div>
                <h3 style={styles.clienteNombre}>{venta.cliente_nombre}</h3>
                <span style={styles.clienteTipo}>
                  {venta.tipo_cliente === 'minorista' && 'Minorista'}
                  {venta.tipo_cliente === 'mayorista' && 'Mayorista'}
                  {venta.tipo_cliente === 'obra' && 'Obra'}
                </span>
              </div>
            </div>

            <div style={styles.clienteInfo}>
              {venta.cliente_cuit && (
                <div style={styles.clienteDetail}>
                  <strong>CUIT/DNI:</strong> {venta.cliente_cuit}
                </div>
              )}
              {venta.cliente_direccion && (
                <div style={styles.clienteDetail}>
                  <MapPin size={16} style={{ marginRight: '6px' }} />
                  {venta.cliente_direccion}
                </div>
              )}
              {venta.cliente_telefono && (
                <div style={styles.clienteDetail}>
                  <Phone size={16} style={{ marginRight: '6px' }} />
                  {venta.cliente_telefono}
                </div>
              )}
              {venta.cliente_email && (
                <div style={styles.clienteDetail}>
                  <Mail size={16} style={{ marginRight: '6px' }} />
                  {venta.cliente_email}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detalle de Productos */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Detalle de Productos</h2>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Código</th>
                  <th style={styles.th}>Producto</th>
                  <th style={styles.thRight}>Cantidad</th>
                  <th style={styles.thRight}>Precio Unit.</th>
                  <th style={styles.thRight}>Desc. %</th>
                  <th style={styles.thRight}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {venta.detalle.map((item, index) => {
                  return (
                    <tr key={index} style={styles.tr}>
                      <td style={styles.td}>{item.producto_codigo}</td>
                      <td style={styles.td}>{item.descripcion}</td>
                      <td style={styles.tdRight}>
                        {parseFloat(item.cantidad).toLocaleString('es-AR')} {item.producto_unidad}
                      </td>
                      <td style={styles.tdRight}>
                        {venta.moneda_simbolo} {parseFloat(item.precio_unitario).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                      <td style={styles.tdRight}>
                        {item.descuento_porcentaje > 0 ? `${item.descuento_porcentaje}%` : '-'}
                      </td>
                      <td style={styles.tdRight}>
                        {venta.moneda_simbolo} {parseFloat(item.subtotal).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales */}
        <div style={styles.section}>
          <div style={styles.totalesBox}>
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Subtotal:</span>
              <span style={styles.totalValue}>
                {venta.moneda_simbolo} {parseFloat(venta.subtotal).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>

            {(venta.descuento_porcentaje > 0 || venta.descuento_monto > 0) && (
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>
                  Descuento {venta.descuento_porcentaje > 0 && `(${venta.descuento_porcentaje}%)`}:
                </span>
                <span style={styles.totalValue}>
                  - {venta.moneda_simbolo} {parseFloat(venta.descuento_monto).toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            )}

            <div style={styles.totalRowFinal}>
              <span style={styles.totalLabelFinal}>Total:</span>
              <span style={styles.totalValueFinal}>
                {venta.moneda_simbolo} {parseFloat(venta.total).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        {venta.observaciones && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Observaciones</h2>
            <p style={styles.observaciones}>{venta.observaciones}</p>
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
    marginBottom: '20px',
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
  anularButton: {
    padding: '10px 20px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#dc2626',
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
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 28px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    marginBottom: '30px',
  },
  statusLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  statusLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#6b7280',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
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
  clienteBox: {
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
  },
  clienteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  clienteNombre: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 6px 0',
  },
  clienteTipo: {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '4px',
    textTransform: 'capitalize',
  },
  clienteInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  clienteDetail: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#4b5563',
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
  totalesBox: {
    maxWidth: '500px',
    marginLeft: 'auto',
    padding: '24px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
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
  totalValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
  },
  totalRowFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 0 0 0',
    marginTop: '12px',
    borderTop: '2px solid #1f2937',
  },
  totalLabelFinal: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalValueFinal: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#10b981',
  },
  observaciones: {
    fontSize: '15px',
    color: '#4b5563',
    lineHeight: '1.6',
    margin: 0,
    whiteSpace: 'pre-wrap',
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

export default VentaDetalle;