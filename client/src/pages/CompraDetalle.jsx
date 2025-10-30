import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { comprasApi } from '../api/compras';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/Layout';
import {
  ArrowLeft,
  Calendar,
  User,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Printer,
  Ban,
} from 'lucide-react';

const CompraDetalle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { showSuccess, showError, showConfirm } = useNotification();
  const { user } = useAuth();

  const [compra, setCompra] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompra();
  }, [id]);

  const loadCompra = async () => {
    try {
      setLoading(true);
      const data = await comprasApi.getById(id);
      setCompra(data.compra);
    } catch (error) {
      showError(error.message);
      navigate('/compras');
    } finally {
      setLoading(false);
    }
  };

  const handleAnular = async () => {
    const confirmed = await showConfirm(
      `¿Está seguro de anular la compra "${compra.numero_comprobante}"? Esta acción revertirá el stock y no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await comprasApi.anular(id, user.id);
      showSuccess('Compra anulada exitosamente. Stock revertido.');
      loadCompra();
    } catch (error) {
      showError(error.message);
    }
  };

  const handleChangeEstado = async (nuevoEstado) => {
    const estadoLabels = {
      pendiente: 'Pendiente',
      recibida: 'Recibida',
      pagada: 'Pagada',
    };

    const confirmed = await showConfirm(
      `¿Cambiar el estado de la compra a "${estadoLabels[nuevoEstado]}"?`
    );

    if (!confirmed) return;

    try {
      await comprasApi.updateEstado(id, nuevoEstado);
      showSuccess('Estado actualizado exitosamente');
      loadCompra();
    } catch (error) {
      showError(error.message);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      pendiente: { color: '#f59e0b', bg: '#fef3c7', icon: Clock, label: 'Pendiente' },
      recibida: { color: '#10b981', bg: '#d1fae5', icon: CheckCircle, label: 'Recibida' },
      pagada: { color: '#2563eb', bg: '#dbeafe', icon: CheckCircle, label: 'Pagada' },
      anulada: { color: '#dc2626', bg: '#fee2e2', icon: XCircle, label: 'Anulada' },
    };

    const config = estados[estado] || estados.pendiente;
    const Icon = config.icon;

    return (
      <span style={{
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        backgroundColor: config.bg,
        color: config.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <Icon size={18} />
        {config.label}
      </span>
    );
  };

  const getTipoComprobante = (tipo) => {
    const tipos = {
      'factura_a': 'Factura A',
      'factura_b': 'Factura B',
      'factura_c': 'Factura C',
      'remito': 'Remito',
      'nota_debito': 'Nota de Débito',
      'nota_credito': 'Nota de Crédito'
    };
    return tipos[tipo] || tipo;
  };

  const getFormaPago = (forma) => {
    const formas = {
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta',
      'transferencia': 'Transferencia',
      'cheque': 'Cheque',
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

  if (!compra) return null;

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Compra {compra.numero_comprobante}</h1>
          {compra.numero_factura && (
            <p style={styles.numeroFactura}>Factura del proveedor: {compra.numero_factura}</p>
          )}
          <p style={styles.subtitle}>Detalles completos de la compra</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => navigate('/compras')} style={styles.backButton}>
            <ArrowLeft size={18} style={{ marginRight: '6px' }} />
            Volver
          </button>
          <button onClick={handleImprimir} style={styles.printButton}>
            <Printer size={18} style={{ marginRight: '6px' }} />
            Imprimir
          </button>
          {compra.estado !== 'anulada' && user.rol === 'admin' && (
            <button onClick={handleAnular} style={styles.anularButton}>
              <Ban size={18} style={{ marginRight: '6px' }} />
              Anular Compra
            </button>
          )}
        </div>
      </div>

      {/* Estado y Acciones */}
      <div style={styles.statusBar}>
        <div style={styles.statusLeft}>
          <span style={styles.statusLabel}>Estado:</span>
          {getEstadoBadge(compra.estado)}
        </div>
        {compra.estado !== 'anulada' && compra.estado !== 'pagada' && (
          <div style={styles.statusActions}>
            {compra.estado === 'pendiente' && (
              <button
                onClick={() => handleChangeEstado('recibida')}
                style={styles.receivedButton}
              >
                <CheckCircle size={18} style={{ marginRight: '6px' }} />
                Marcar como Recibida
              </button>
            )}
            {compra.estado === 'recibida' && (
              <button
                onClick={() => handleChangeEstado('pagada')}
                style={styles.paidButton}
              >
                <CheckCircle size={18} style={{ marginRight: '6px' }} />
                Marcar como Pagada
              </button>
            )}
          </div>
        )}
      </div>

      <div style={styles.container} className="print-content">
        {/* Información General */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Información General</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <FileText size={18} style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Número Interno</div>
                <div style={styles.infoValue}>{compra.numero_comprobante}</div>
              </div>
            </div>

            {compra.numero_factura && (
              <div style={styles.infoItem}>
                <FileText size={18} style={styles.infoIcon} />
                <div>
                  <div style={styles.infoLabel}>Factura Proveedor</div>
                  <div style={styles.infoValue}>{compra.numero_factura}</div>
                </div>
              </div>
            )}

            <div style={styles.infoItem}>
              <FileText size={18} style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Tipo</div>
                <div style={styles.infoValue}>{getTipoComprobante(compra.tipo_comprobante)}</div>
              </div>
            </div>

            <div style={styles.infoItem}>
              <Calendar size={18} style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Fecha</div>
                <div style={styles.infoValue}>
                  {new Date(compra.fecha).toLocaleDateString('es-AR')}
                </div>
              </div>
            </div>

            <div style={styles.infoItem}>
              <DollarSign size={18} style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Moneda</div>
                <div style={styles.infoValue}>{compra.moneda_codigo}</div>
              </div>
            </div>

            <div style={styles.infoItem}>
              <FileText size={18} style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Forma de Pago</div>
                <div style={styles.infoValue}>{getFormaPago(compra.forma_pago)}</div>
              </div>
            </div>

            {compra.usuario_nombre && (
              <div style={styles.infoItem}>
                <User size={18} style={styles.infoIcon} />
                <div>
                  <div style={styles.infoLabel}>Registrado por</div>
                  <div style={styles.infoValue}>{compra.usuario_nombre}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información del Proveedor */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Información del Proveedor</h2>
          <div style={styles.proveedorBox}>
            <div style={styles.proveedorHeader}>
              <h3 style={styles.proveedorNombre}>{compra.proveedor_nombre}</h3>
            </div>

            <div style={styles.proveedorInfo}>
              {compra.proveedor_cuit && (
                <div style={styles.proveedorDetail}>
                  <strong>CUIT:</strong> {compra.proveedor_cuit}
                </div>
              )}
              {compra.proveedor_direccion && (
                <div style={styles.proveedorDetail}>
                  <MapPin size={16} style={{ marginRight: '6px' }} />
                  {compra.proveedor_direccion}
                </div>
              )}
              {compra.proveedor_telefono && (
                <div style={styles.proveedorDetail}>
                  <Phone size={16} style={{ marginRight: '6px' }} />
                  {compra.proveedor_telefono}
                </div>
              )}
              {compra.proveedor_email && (
                <div style={styles.proveedorDetail}>
                  <Mail size={16} style={{ marginRight: '6px' }} />
                  {compra.proveedor_email}
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
                {compra.detalle.map((item, index) => {
                  return (
                    <tr key={index} style={styles.tr}>
                      <td style={styles.td}>{item.producto_codigo}</td>
                      <td style={styles.td}>{item.descripcion}</td>
                      <td style={styles.tdRight}>
                        {parseFloat(item.cantidad).toLocaleString('es-AR')} {item.producto_unidad}
                      </td>
                      <td style={styles.tdRight}>
                        {formatCurrency(item.precio_unitario, compra.moneda_simbolo)}
                      </td>
                      <td style={styles.tdRight}>
                        {item.descuento_porcentaje > 0 ? `${item.descuento_porcentaje}%` : '-'}
                      </td>
                      <td style={styles.tdRight}>
                        {formatCurrency(item.subtotal, compra.moneda_simbolo)}
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
                {formatCurrency(compra.subtotal, compra.moneda_simbolo)}
              </span>
            </div>

            {(compra.descuento_porcentaje > 0 || compra.descuento_monto > 0) && (
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>
                  Descuento {compra.descuento_porcentaje > 0 && `(${compra.descuento_porcentaje}%)`}:
                </span>
                <span style={styles.totalValue}>
                  - {formatCurrency(compra.descuento_monto, compra.moneda_simbolo)}
                </span>
              </div>
            )}

            <div style={styles.totalRowFinal}>
              <span style={styles.totalLabelFinal}>Total:</span>
              <span style={styles.totalValueFinal}>
                {formatCurrency(compra.total, compra.moneda_simbolo)}
              </span>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        {compra.observaciones && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Observaciones</h2>
            <p style={styles.observaciones}>{compra.observaciones}</p>
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
    margin: '0 0 4px 0',
  },
  numeroFactura: {
    fontSize: '14px',
    color: '#6b7280',
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
    borderTop: '5px solid #10b981',
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
  statusActions: {
    display: 'flex',
    gap: '12px',
  },
  receivedButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  paidButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
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
  proveedorBox: {
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
  },
  proveedorHeader: {
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  proveedorNombre: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  proveedorInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  proveedorDetail: {
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

export default CompraDetalle;