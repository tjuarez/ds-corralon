import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { cuentaCorrienteApi } from '../api/cuentaCorriente';
import { clientesApi } from '../api/clientes';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/Layout';
import { ArrowLeft, Save, X, DollarSign, AlertCircle } from 'lucide-react';

const RegistrarPago = () => {
  const navigate = useNavigate();
  const { clienteId } = useParams();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [formData, setFormData] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    medio_pago: 'efectivo',
    numero_comprobante: '',
    observaciones: '',
  });

  useEffect(() => {
    loadCliente();
  }, [clienteId]);

  const loadCliente = async () => {
    try {
      const data = await clientesApi.getById(clienteId);
      setCliente(data.cliente);
    } catch (error) {
      showError(error.message);
      navigate('/cuenta-corriente');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      showError('El monto debe ser mayor a 0');
      return;
    }

    if (parseFloat(formData.monto) > cliente.saldo_cuenta_corriente) {
      showError(`El monto no puede superar la deuda actual de ${formatCurrency(cliente.saldo_cuenta_corriente, '$')}`);
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        cliente_id: parseInt(clienteId),
        monto: parseFloat(formData.monto),
        fecha: formData.fecha,
        medio_pago: formData.medio_pago,
        numero_comprobante: formData.numero_comprobante || null,
        observaciones: formData.observaciones,
        usuario_id: user.id,
      };

      const result = await cuentaCorrienteApi.registrarPago(dataToSend);
      showSuccess(`Pago registrado exitosamente. Nuevo saldo: ${formatCurrency(result.saldo_nuevo, '$')}`);
      navigate(`/cuenta-corriente/${clienteId}`);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!cliente) {
    return (
      <Layout>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      </Layout>
    );
  }

  const montoAPagar = parseFloat(formData.monto) || 0;
  const nuevoSaldo = cliente.saldo_cuenta_corriente - montoAPagar;

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Registrar Pago</h1>
          <p style={styles.subtitle}>{cliente.razon_social}</p>
        </div>
        <button
          onClick={() => navigate(`/cuenta-corriente/${clienteId}`)}
          style={styles.backButton}
        >
          <ArrowLeft size={18} style={{ marginRight: '6px' }} />
          {t('back')}
        </button>
      </div>

      {/* Info del Cliente */}
      <div style={styles.infoCard}>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Saldo Actual:</span>
          <span style={styles.infoDeuda}>
            {formatCurrency(cliente.saldo_cuenta_corriente, '$')}
          </span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Límite de Crédito:</span>
          <span style={styles.infoValue}>
            {formatCurrency(cliente.limite_credito, '$')}
          </span>
        </div>
      </div>

      {cliente.saldo_cuenta_corriente <= 0 ? (
        <div style={styles.alertBox}>
          <AlertCircle size={24} color="#10b981" />
          <div>
            <div style={styles.alertTitle}>Cliente sin deuda</div>
            <div style={styles.alertText}>
              Este cliente no tiene saldo pendiente en cuenta corriente.
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Datos del Pago</h2>

            <div style={styles.grid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Monto a Pagar <span style={styles.required}>*</span>
                </label>
                <div style={styles.montoInputContainer}>
                  <DollarSign size={18} style={styles.montoIcon} />
                  <input
                    type="number"
                    name="monto"
                    value={formData.monto}
                    onChange={handleChange}
                    style={styles.montoInput}
                    min="0.01"
                    max={cliente.saldo_cuenta_corriente}
                    step="0.01"
                    required
                    placeholder="0.00"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, monto: cliente.saldo_cuenta_corriente })}
                  style={styles.fullPayButton}
                >
                  Pago Total
                </button>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Fecha <span style={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Medio de Pago <span style={styles.required}>*</span>
                </label>
                <select
                  name="medio_pago"
                  value={formData.medio_pago}
                  onChange={handleChange}
                  style={styles.select}
                  required
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Número de Comprobante</label>
                <input
                  type="text"
                  name="numero_comprobante"
                  value={formData.numero_comprobante}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ej: 001-00001234"
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Observaciones</label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                style={styles.textarea}
                rows="3"
                placeholder="Notas adicionales sobre el pago..."
              />
            </div>
          </div>

          {/* Preview del Pago */}
          {montoAPagar > 0 && (
            <div style={styles.previewSection}>
              <h3 style={styles.previewTitle}>Resumen del Pago</h3>
              <div style={styles.previewBox}>
                <div style={styles.previewRow}>
                  <span style={styles.previewLabel}>Saldo Actual:</span>
                  <span style={styles.previewDeuda}>
                    {formatCurrency(cliente.saldo_cuenta_corriente, '$')}
                  </span>
                </div>
                <div style={styles.previewRow}>
                  <span style={styles.previewLabel}>Monto a Pagar:</span>
                  <span style={styles.previewPago}>
                    - {formatCurrency(montoAPagar, '$')}
                  </span>
                </div>
                <div style={styles.previewRowFinal}>
                  <span style={styles.previewLabelFinal}>Nuevo Saldo:</span>
                  <span style={{
                    ...styles.previewValueFinal,
                    color: nuevoSaldo > 0 ? '#dc2626' : '#10b981'
                  }}>
                    {formatCurrency(nuevoSaldo, '$')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div style={styles.actions}>
            <button
              type="button"
              onClick={() => navigate(`/cuenta-corriente/${clienteId}`)}
              style={styles.cancelButton}
              disabled={loading}
            >
              <X size={18} style={{ marginRight: '6px' }} />
              {t('cancel')}
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={loading || montoAPagar <= 0}
            >
              <Save size={18} style={{ marginRight: '6px' }} />
              {loading ? 'Procesando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      )}
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
  backButton: {
    padding: '10px 20px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
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
  infoCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'space-around',
    gap: '30px',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  infoValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  infoDeuda: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#dc2626',
  },
  alertBox: {
    backgroundColor: '#d1fae5',
    border: '2px solid #10b981',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  alertTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#065f46',
    marginBottom: '4px',
  },
  alertText: {
    fontSize: '14px',
    color: '#047857',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
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
  required: {
    color: '#dc2626',
  },
  montoInputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  montoIcon: {
    position: 'absolute',
    left: '14px',
    color: '#6b7280',
  },
  montoInput: {
    flex: 1,
    padding: '12px 14px 12px 45px',
    fontSize: '18px',
    fontWeight: '600',
    border: '2px solid #10b981',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: 'white',
  },
  fullPayButton: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#10b981',
    backgroundColor: '#d1fae5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '4px',
  },
  input: {
    padding: '12px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: 'white',
  },
  select: {
    padding: '12px 40px 12px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: 'white',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  previewSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  previewTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px',
  },
  previewBox: {
    padding: '24px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
  },
  previewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  previewLabel: {
    fontSize: '15px',
    color: '#6b7280',
  },
  previewDeuda: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#dc2626',
  },
  previewPago: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#10b981',
  },
  previewRowFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 0 0 0',
    marginTop: '12px',
    borderTop: '2px solid #1f2937',
  },
  previewLabelFinal: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  previewValueFinal: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
    paddingTop: '20px',
  },
  cancelButton: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  submitButton: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
};

export default RegistrarPago;