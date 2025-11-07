import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { presupuestosApi } from '../api/presupuestos';
import Layout from '../components/Layout';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  User,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Mail,
  Phone,
  MapPin,
  Printer,
  ShoppingCart ,
} from 'lucide-react';

const PresupuestoDetalle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { showSuccess, showError, showConfirm } = useNotification();

  const [presupuesto, setPresupuesto] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailDestino, setEmailDestino] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    loadPresupuesto();
  }, [id]);

  const loadPresupuesto = async () => {
    try {
      setLoading(true);
      const data = await presupuestosApi.getById(id);
      setPresupuesto(data.presupuesto);
    } catch (error) {
      showError(error.message);
      navigate('/presupuestos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      `¿Está seguro de eliminar el presupuesto "${presupuesto.numero}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await presupuestosApi.delete(id);
      showSuccess('Presupuesto eliminado exitosamente');
      navigate('/presupuestos');
    } catch (error) {
      showError(error.message);
    }
  };

  const handleChangeEstado = async (nuevoEstado) => {
    const estadoLabels = {
      pendiente: 'Pendiente',
      aprobado: 'Aprobado',
      rechazado: 'Rechazado',
    };

    const confirmed = await showConfirm(
      `¿Cambiar el estado del presupuesto a "${estadoLabels[nuevoEstado]}"?`
    );

    if (!confirmed) return;

    try {
      await presupuestosApi.updateEstado(id, nuevoEstado);
      showSuccess('Estado actualizado exitosamente');
      loadPresupuesto();
    } catch (error) {
      showError(error.message);
    }
  };

  const handleEnviarEmail = async () => {
    if (!emailDestino) {
      showError('Ingresa un email de destino');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailDestino)) {
      showError('Formato de email inválido');
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch(`/api/presupuestos/${id}/enviar-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ emailDestino }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar email');
      }

      showSuccess(`Email enviado a ${emailDestino}`);
      setShowEmailModal(false);
      setEmailDestino('');
    } catch (error) {
      showError(error.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const handleOpenEmailModal = () => {
    // Pre-llenar con el email del cliente si existe
    if (presupuesto.cliente_email) {
      setEmailDestino(presupuesto.cliente_email);
    }
    setShowEmailModal(true);
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      pendiente: { color: '#f59e0b', bg: '#fef3c7', icon: Clock, label: 'Pendiente' },
      aprobado: { color: '#10b981', bg: '#d1fae5', icon: CheckCircle, label: 'Aprobado' },
      rechazado: { color: '#dc2626', bg: '#fee2e2', icon: XCircle, label: 'Rechazado' },
      convertido: { color: '#6366f1', bg: '#e0e7ff', icon: CheckCircle, label: 'Convertido' },
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

  if (!presupuesto) return null;

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Presupuesto {presupuesto.numero}</h1>
          {presupuesto.fecha_vencimiento && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              marginTop: '8px',
              backgroundColor: new Date(presupuesto.fecha_vencimiento) < new Date() ? '#fee2e2' : '#d1fae5',
              color: new Date(presupuesto.fecha_vencimiento) < new Date() ? '#dc2626' : '#059669',
            }}>
              <Clock size={16} />
              {new Date(presupuesto.fecha_vencimiento) < new Date() ? 
                `Vencido el ${new Date(presupuesto.fecha_vencimiento).toLocaleDateString('es-AR')}` :
                `Válido hasta ${new Date(presupuesto.fecha_vencimiento).toLocaleDateString('es-AR')}`
              }
            </div>
          )}
          <p style={styles.subtitle}>Detalles completos del presupuesto</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => navigate('/presupuestos')} style={styles.backButton}>
            <ArrowLeft size={18} style={{ marginRight: '6px' }} />
            Volver
          </button>
          <button onClick={handleImprimir} style={styles.printButton}>
            <Printer size={18} style={{ marginRight: '6px' }} />
            Imprimir
          </button>
          <button onClick={handleOpenEmailModal} style={styles.emailButton}>
            <Mail size={18} style={{ marginRight: '6px' }} />
            Enviar Email
          </button>
          {presupuesto.estado !== 'convertido' && (
            <>
              <button
                onClick={() => navigate(`/presupuestos/${id}/editar`)}
                style={styles.editButton}
              >
                <Edit size={18} style={{ marginRight: '6px' }} />
                Editar
              </button>
              <button onClick={handleDelete} style={styles.deleteButton}>
                <Trash2 size={18} style={{ marginRight: '6px' }} />
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Estado y Acciones */}
      <div style={styles.statusBar}>
        <div style={styles.statusLeft}>
          <span style={styles.statusLabel}>Estado:</span>
          {getEstadoBadge(presupuesto.estado)}
        </div>
        {presupuesto.estado === 'pendiente' && (
          <div style={styles.statusActions}>
            <button
              onClick={() => handleChangeEstado('aprobado')}
              style={styles.approveButton}
            >
              <CheckCircle size={18} style={{ marginRight: '6px' }} />
              Aprobar
            </button>
            <button
              onClick={() => handleChangeEstado('rechazado')}
              style={styles.rejectButton}
            >
              <XCircle size={18} style={{ marginRight: '6px' }} />
              Rechazar
            </button>
          </div>
        )}
        {presupuesto.estado === 'aprobado' && (
          <div style={styles.statusActions}>
            <button
              onClick={() => navigate('/ventas/nueva', { state: { presupuestoId: presupuesto.id } })}
              style={styles.convertButton}
            >
              <ShoppingCart size={18} style={{ marginRight: '6px' }} />
              Convertir a Venta
            </button>
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
                <div style={styles.infoLabel}>Número</div>
                <div style={styles.infoValue}>{presupuesto.numero}</div>
              </div>
            </div>

            <div style={styles.infoItem}>
              <Calendar size={18} style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Fecha</div>
                <div style={styles.infoValue}>
                  {new Date(presupuesto.fecha).toLocaleDateString('es-AR')}
                </div>
              </div>
            </div>

            {presupuesto.fecha_vencimiento && (
              <div style={styles.infoItem}>
                <Clock size={18} style={styles.infoIcon} />
                <div>
                  <div style={styles.infoLabel}>Válido hasta</div>
                  <div style={{
                    ...styles.infoValue,
                    color: presupuesto.fecha_vencimiento && new Date(presupuesto.fecha_vencimiento) < new Date() ? '#dc2626' : '#10b981',
                    fontWeight: '700',
                  }}>
                    {presupuesto.fecha_vencimiento ? 
                      new Date(presupuesto.fecha_vencimiento).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      }) : 
                      'Sin fecha de vencimiento'
                    }
                  </div>
                  {presupuesto.fecha_vencimiento && new Date(presupuesto.fecha_vencimiento) < new Date() && (
                    <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '2px', fontWeight: '600' }}>
                      ⚠️ Presupuesto vencido
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={styles.infoItem}>
              <DollarSign size={18} style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Moneda</div>
                <div style={styles.infoValue}>{presupuesto.moneda_codigo}</div>
              </div>
            </div>

            {presupuesto.usuario_nombre && (
              <div style={styles.infoItem}>
                <User size={18} style={styles.infoIcon} />
                <div>
                  <div style={styles.infoLabel}>Creado por</div>
                  <div style={styles.infoValue}>{presupuesto.usuario_nombre}</div>
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
                <h3 style={styles.clienteNombre}>{presupuesto.cliente_nombre}</h3>
                <span style={styles.clienteTipo}>
                  {presupuesto.tipo_cliente === 'minorista' && 'Minorista'}
                  {presupuesto.tipo_cliente === 'mayorista' && 'Mayorista'}
                  {presupuesto.tipo_cliente === 'obra' && 'Obra'}
                </span>
              </div>
            </div>

            <div style={styles.clienteInfo}>
              {presupuesto.cliente_cuit && (
                <div style={styles.clienteDetail}>
                  <strong>CUIT/DNI:</strong> {presupuesto.cliente_cuit}
                </div>
              )}
              {presupuesto.cliente_direccion && (
                <div style={styles.clienteDetail}>
                  <MapPin size={16} style={{ marginRight: '6px' }} />
                  {presupuesto.cliente_direccion}
                </div>
              )}
              {presupuesto.cliente_telefono && (
                <div style={styles.clienteDetail}>
                  <Phone size={16} style={{ marginRight: '6px' }} />
                  {presupuesto.cliente_telefono}
                </div>
              )}
              {presupuesto.cliente_email && (
                <div style={styles.clienteDetail}>
                  <Mail size={16} style={{ marginRight: '6px' }} />
                  {presupuesto.cliente_email}
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
                {presupuesto.detalle.map((item, index) => {
                  const subtotalItem = item.cantidad * item.precio_unitario;
                  const descuentoItem = subtotalItem * (item.descuento_porcentaje / 100);
                  const totalItem = subtotalItem - descuentoItem;

                  return (
                    <tr key={index} style={styles.tr}>
                      <td style={styles.td}>{item.producto_codigo}</td>
                      <td style={styles.td}>{item.descripcion}</td>
                      <td style={styles.tdRight}>
                        {parseFloat(item.cantidad).toLocaleString('es-AR')} {item.producto_unidad}
                      </td>
                      <td style={styles.tdRight}>
                        {presupuesto.moneda_simbolo} {parseFloat(item.precio_unitario).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                      <td style={styles.tdRight}>
                        {item.descuento_porcentaje > 0 ? `${item.descuento_porcentaje}%` : '-'}
                      </td>
                      <td style={styles.tdRight}>
                        {presupuesto.moneda_simbolo} {totalItem.toLocaleString('es-AR', {
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
                {presupuesto.moneda_simbolo} {parseFloat(presupuesto.subtotal).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>

            {(presupuesto.descuento_porcentaje > 0 || presupuesto.descuento_monto > 0) && (
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>
                  Descuento {presupuesto.descuento_porcentaje > 0 && `(${presupuesto.descuento_porcentaje}%)`}:
                </span>
                <span style={styles.totalValue}>
                  - {presupuesto.moneda_simbolo} {parseFloat(presupuesto.descuento_monto).toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            )}

            <div style={styles.totalRowFinal}>
              <span style={styles.totalLabelFinal}>Total:</span>
              <span style={styles.totalValueFinal}>
                {presupuesto.moneda_simbolo} {parseFloat(presupuesto.total).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>

            {/* Equivalencia en otra moneda */}
            {presupuesto.cotizacion_momento && presupuesto.cotizacion_momento > 0 && (
              <div style={styles.equivalenciaBox}>
                <div style={styles.equivalenciaIcon}>≈</div>
                <div style={styles.equivalenciaContent}>
                  <div style={styles.equivalenciaLabel}>
                    Equivalente aproximado:
                  </div>
                  <div style={styles.equivalenciaValue}>
                    {presupuesto.moneda_codigo === 'USD' ? (
                      <>
                        $ {(parseFloat(presupuesto.total) * parseFloat(presupuesto.cotizacion_momento)).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} ARS
                      </>
                    ) : (
                      <>
                        US$ {(parseFloat(presupuesto.total) / parseFloat(presupuesto.cotizacion_momento)).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </>
                    )}
                  </div>
                  <div style={styles.cotizacionInfo}>
                    Cotización del momento: ${parseFloat(presupuesto.cotizacion_momento).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} ARS = 1 USD
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Observaciones */}
        {presupuesto.observaciones && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Observaciones</h2>
            <p style={styles.observaciones}>{presupuesto.observaciones}</p>
          </div>
        )}
      </div>

      {/* Modal de Enviar Email */}
      {showEmailModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEmailModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Enviar Presupuesto por Email</h2>
              <button
                onClick={() => setShowEmailModal(false)}
                style={styles.modalClose}
              >
                ×
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                Se enviará el presupuesto <strong>{presupuesto.numero}</strong> al siguiente email:
              </p>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email de destino</label>
                <input
                  type="email"
                  value={emailDestino}
                  onChange={(e) => setEmailDestino(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  style={styles.emailInput}
                  autoFocus
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowEmailModal(false)}
                style={styles.modalCancelButton}
                disabled={sendingEmail}
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviarEmail}
                style={styles.modalSendButton}
                disabled={sendingEmail}
              >
                <Mail size={18} style={{ marginRight: '6px' }} />
                {sendingEmail ? 'Enviando...' : 'Enviar Email'}
              </button>
            </div>
          </div>
        </div>
      )}
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
  editButton: {
    padding: '10px 20px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#d1fae5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  deleteButton: {
    padding: '10px 20px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
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
  statusActions: {
    display: 'flex',
    gap: '12px',
  },
  approveButton: {
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
  rejectButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#dc2626',
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
  emailButton: {
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
  convertButton: {
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 16px 24px',
    borderBottom: '2px solid #f3f4f6',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  modalClose: {
    fontSize: '32px',
    fontWeight: '300',
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  modalBody: {
    padding: '24px',
  },
  modalText: {
    fontSize: '15px',
    color: '#4b5563',
    marginBottom: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  emailInput: {
    padding: '12px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px 24px 24px',
    borderTop: '2px solid #f3f4f6',
  },
  modalCancelButton: {
    padding: '10px 24px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalSendButton: {
    padding: '10px 24px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  equivalenciaBox: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    border: '2px solid #bfdbfe',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  equivalenciaIcon: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2563eb',
    lineHeight: '1',
  },
  equivalenciaContent: {
    flex: 1,
  },
  equivalenciaLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  equivalenciaValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: '4px',
  },
  cotizacionInfo: {
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
};

// Agregar esto después del objeto styles, antes del export default
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

// Inyectar estilos de impresión
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = printStyles;
  document.head.appendChild(styleElement);
}

export default PresupuestoDetalle;